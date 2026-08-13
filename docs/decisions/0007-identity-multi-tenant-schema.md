# 0007 - Identity, Çok Kiracılı Çekirdek Şema ve Tenant İzolasyon Mekanizması

## Durum

Kabul edildi ve uygulandı (Sprint 2). [0004](0004-shared-database-multi-tenancy.md)'te "değerlendirilecek" olarak bırakılan paylaşılan-veritabanı + zorunlu-filtreleme yaklaşımı, bu sprintte somut bir şema ve çalışan bir izolasyon mekanizmasına dönüştürüldü.

## Bağlam

Sprint 2'nin kapsamı: gerçek kullanıcı/tenant/rol/yetki/session/audit sistemi. Verilen tablo listesi (`tenants, branches, users, tenant_users, roles, permissions, role_permissions, sessions, audit_logs`) ve endpoint listesi (yalnızca 6 auth endpoint'i) net olsa da, uygulama sırasında üç noktada literal spesifikasyon ile "gerçek çalışan sistem" gereksinimleri çatıştı; bu doküman o kararları ve tenant izolasyonunun nasıl "unutulamaz" kılındığını kayıt altına alır.

## Kararlar

### 1. `PasswordResetToken` tablosu eklendi (literal listede yok)

FORGOT PASSWORD gereksinimi ("hash'lenmiş, tek kullanımlık, süreli") literal `DATABASE` tablo listesinde karşılığı olmayan bir tablo gerektiriyordu. `PasswordResetToken` (id, userId, tokenHash, expiresAt, usedAt, createdAt) eklendi. Alternatif — token'ı `User` tablosunda tek bir alan olarak tutmak — çoklu eşzamanlı reset isteğini ve "tek kullanımlık" garantisini doğal olarak ifade edemezdi.

### 2. `AuditLog.requestId` eklendi (literal alan listesinde yok, ama AUDIT bölümü zorunlu tutuyor)

Anlatı metni "her audit kaydı RequestId taşımalı" derken, tablonun literal alan listesi bunu içermiyordu. `requestId String?` eklendi ve mevcut `RequestIdMiddleware`'in ürettiği `request.requestId` ile dolduruldu.

### 3. `Session.tenantUserId` eklendi (literal alan listesinde yok)

Literal `SESSIONS` alan listesi (`id, userId, refreshTokenHash, ip, userAgent, expiresAt, lastUsedAt, createdAt`) bir session'ın hangi `TenantUser` üyeliği için açıldığını belirtmiyordu. Bu, `refresh()` akışında (aşağıda) tutarlı bir token yeniden-imzalama için zorunluydu: bir kullanıcının birden fazla tenant üyeliği olduğu genel durumda, "bu access token hangi tenant/rol için geçerli" sorusunun cevabı session'ın kendisinde saklanmalı, her seferinde yeniden hesaplanmamalı. `tenantUserId String` + `TenantUser` ilişkisi eklendi.

### 4. `tenant_users.tenantId` nullable — SUPER_ADMIN için ayrı bir mekanizma icat edilmedi

SUPER_ADMIN "tenant bağımsız" bir rol. İki seçenek vardı: (a) süper admin'i ayrı bir tablo/flag ile temsil etmek, (b) `tenantId = null` olan bir `tenant_users` satırıyla, aynı `TenantUser → Role → Permission` zincirinden geçirmek. (b) seçildi: yetkilendirme kod tabanında **tek bir sorgu yolu** var, süper admin için if/switch dallanması yok. `resolvePrimaryMembership()` platform-seviyeli (tenantId null) üyeliği önceliklendirir.

### 5. JWT access token yalnızca kimlik taşır, yetki taşımaz

`AccessTokenPayload = {sub, tenantUserId, sessionId}` — `tenantId`, `branchId`, `permissions` JWT'ye **gömülmez**. Her istekte `AuthContextMiddleware`, `tenantUserId` üzerinden `TenantUser → Role → RolePermission` zincirini veritabanından taze okur. Alternatif (yetkileri JWT'ye gömüp 15 dakikada bir yenilemek), "rol/yetki değişikliği audit'leniyor" gereksinimiyle çelişirdi: bir yöneticinin yetkisi geri alındığında, bu değişikliğin en geç bir sonraki istekte etkili olması gerekir, JWT'nin doğal 15 dakikalık ömrü boyunca değil.

## Tenant İzolasyonu — merkezi mekanizma

**En kritik gereksinim**: "Kod review sırasında tenant filtresi unutulabilecek yapı kabul edilmeyecek." Bu, iki parçalı bir mekanizmayla karşılandı:

1. **`AsyncLocalStorage` tabanlı `TenantContext`** (`packages/database/src/tenant-context.ts`): `runWithTenantContext(tenantId, fn)` / `getCurrentTenantId()`. Request'in tenant'ını, servis metotlarına parametre olarak geçirmeden, tüm async çağrı zinciri boyunca taşır. `AuthContextMiddleware` bunu her request'in başında kurar.

2. **Prisma Client Extension** (`packages/database/src/tenant-scoped-client.ts`): `tenantScopedPrisma`, tenant'a ait modellerde (`Branch`, `TenantUser` — bu liste yeni tenant-owned tablo eklendikçe büyür) `$allOperations` seviyesinde `where`/`data`'ya otomatik `tenantId` enjekte eder. `getCurrentTenantId()` boşsa **hata fırlatır**; sessizce tüm veriyi döndürmez. Bu, controller/service kodunun `where: { tenantId }` yazmasını/unutmasını değil, **Prisma client seviyesinde** filtrelemeyi zorunlu kılar — iş mantığından bağımsız, gözden geçirilmesi gerekmeyen tek bir uygulama noktası.

   Bilinçli olarak tenant-scoped **dışında** bırakılanlar: `Role` ve `AuditLog` (nullable `tenantId` — sistem rolleri/platform-seviyeli audit kayıtları tenant'lar arası paylaşılır), `User` (tenant'a ait değil, global kimlik; tenant-scoped erişim her zaman `TenantUser` üzerinden geçer).

3. **Gerçek çalışma zamanı hatası bulundu ve düzeltildi**: `tenantScopedPrisma`'nın modelleri gerçek Postgres'e karşı ilk kez test edilirken (`packages/database/src/__tests__/tenant-isolation.integration.test.ts`), `runWithTenantContext(tenantId, () => tenantScopedPrisma.branch.findMany())` biçimindeki — herhangi bir geliştiricinin doğal olarak yazacağı — kullanım biçiminin tenant bağlamını **kaybettiği** tespit edildi. Kök neden: Prisma'nın extended-client sorguları "lazy" (tembel) thenable'lardır; `$allOperations` yalnızca `.then()` çağrıldığında çalışır, ve eğer callback bu promise'i `await` etmeden geri döndürürse, Node'un `AsyncLocalStorage.run()` penceresi çoktan kapanmış olur — `.then()` daha sonra, bağlam dışında, çağrıldığında bağlam artık yoktur. Düzeltme, `runWithTenantContext`'in kendisine taşındı: callback'in döndürdüğü değer thenable ise, `Promise.resolve(result)` ile **senkron pencerenin içinde** çözülür, böylece hangi çağrı biçimi kullanılırsa kullanılsın (`await` içeride veya dışarıda) bağlam doğru yayılır. Bu, mekanizmayı "unutulamaz" yapan iddiaya somut, test edilmiş bir kanıt kazandırdı; test yazılmasaydı bu hata yalnızca ilk tenant-scoped CRUD endpoint'i (menü/ürün/sipariş, gelecek sprint) yazıldığında, sessizce ve tehlikeli biçimde ortaya çıkardı.

4. **İkinci savunma katmanı (RLS) bilinçli olarak bu sprintte kurulmadı** — bkz. Bilinen Eksikler.

## Sonuçlar

- Yeni bir tenant-owned tablo eklemek, `TENANT_SCOPED_MODELS` setine bir isim eklemek anlamına gelir; aksi halde o modelin sorguları (tenant context'i olmadan) hata fırlatır — "varsayılan olarak güvensiz" değil, "varsayılan olarak reddeden" bir tasarım.
- Süper admin dahil her yetkilendirme kararı aynı `TenantUser → Role → Permission` zincirinden geçer.
- `runWithTenantContext()` artık hem senkron hem senkron-olmayan (awaitsiz döndürülen promise) kullanım biçimlerinde güvenlidir; bu davranış `packages/database/src/__tests__/tenant-isolation.integration.test.ts` ile gerçek PostgreSQL'e karşı sürekli doğrulanır (`RUN_DB_INTEGRATION_TESTS=true`).
