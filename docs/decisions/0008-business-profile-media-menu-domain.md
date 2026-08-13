# 0008 - Business Profile, Medya ve Menü Domain Şeması

## Durum

Kabul edildi ve uygulandı (Sprint 3A). [0007](0007-identity-multi-tenant-schema.md)'de kurulan tenant izolasyon mekanizması (`AsyncLocalStorage` + `tenantScopedPrisma`), bu sprintte platformun ilk gerçek tenant-owned CRUD domain'ine (Media, Menu, Category, Product, Variant, OptionGroup, Option) genişletildi.

## Bağlam

Sprint 3A kapsamı: işletmenin kendi profilini (logo, kapak, iletişim, tema) düzenleyebilmesi ve tam bir menü hiyerarşisi (Menü → Kategori → Ürün → Varyant/Seçenek Grubu → Seçenek) kurabilmesi. QR tasarımı ve Garson/Sipariş sistemi bilinçli olarak kapsam dışı bırakıldı. Kullanıcıyla netleştirilen dört mimari karar aşağıda gerekçeleriyle kayıt altına alınıyor.

## Kararlar

### 1. Yeni tüm tenant-owned modellerde denormalize edilmiş `tenantId` kolonu

`Media`, `Menu`, `Category`, `Product`, `Variant`, `OptionGroup`, `Option` — hepsi üst modele (`Menu`/`Category`/`Product`/`OptionGroup` üzerinden) join ile de tenant'a ulaşabilecekken, her birine doğrudan bir `tenantId` kolonu eklendi. Bu bir performans tercihi değil, [0007](0007-identity-multi-tenant-schema.md)'de kurulan `tenantScopedPrisma` mekanizmasının çalışma şekli gereği zorunlu: Prisma Client Extension'ın `$allOperations` kancası, `where`/`data`'ya **model bazında** doğrudan `tenantId` enjekte ediyor — join zinciri icat etmiyor. Denormalize kolon olmadan bu modeller mekanizmanın dışında kalır ve "unutulamaz tenant filtresi" iddiası bu yedi model için geçersizleşirdi. Her yeni model `TENANT_SCOPED_MODELS` setine eklendi (`packages/database/src/tenant-scoped-client.ts`).

### 2. OptionGroup → Product seviyesinde, Variant seviyesinde değil

Ekstralar/Soslar/Şuruplar gibi seçenek grupları `Product`'a bağlandı, `Variant`'a değil. Alternatif (her varyantın kendi seçenek gruplarını taşıması) veri tekrarına yol açardı — aynı "Ekstra Peynir" seçeneğinin Küçük/Orta/Büyük varyantlarının her biri için ayrı ayrı tanımlanması gerekirdi. Product-seviyeli OptionGroup, Wolt/Yemeksepeti gibi yerleşik menü sistemleriyle tutarlı: seçenekler tüm varyantlar arasında paylaşılır, yalnızca varyantın kendisi (Küçük/Orta/Büyük) fiyat/isim olarak ayrışır.

### 3. Business Profile CRUD = yalnızca GET + PATCH

`Tenant` modeline eklenen profil alanları (`about`, `phone`, `whatsapp`, `email`, `address`, `googleMapsLink`, `workingHours`, `instagram`, `facebook`, `website`, `currency`, `language`, `theme`, `primaryColor`, `secondaryColor`, `accentColor`, `logoImageId`, `coverImageId`) için ayrı bir create/delete akışı yok — tenant'ın kendisi zaten var, bu sprint yalnızca onu zenginleştiriyor. Tenant provisioning (create/delete), SUPER_ADMIN'in cross-tenant yönetim akışına ait, kapsam dışı bırakıldı (bkz. Bilinen Eksikler).

### 4. Medya servisi = API streaming endpoint, statik dosya sunumuna bağımlı değil

`GET /media/:id/file` ve `GET /media/:id/thumbnail` `@Public()` işaretli, ham (tenant-scoped olmayan) `prisma` client kullanan streaming endpoint'leri olarak kuruldu — [0007](0007-identity-multi-tenant-schema.md)'de `AuditLog`/`Role` için kurulan "belgelenmiş istisna" desenine uygun: bu istekler bağlamsız/anonim (görsel `<img src>` ile yüklenir, oturum çerezi taşımaz), tenant context kurulamaz, opak UUID ile sızıntı riski pratikte yok (spesifik bir medya ID'sini bilmeden erişim mümkün değil). Alternatif — Nginx/statik dosya sunucusuna bağımlı bir yapı — dev ve production ortamlarını farklılaştırır, [0005](0005-remove-docker-native-deployment.md)'in "native, kendi kendine yeterli deployment" ilkesiyle çelişirdi.

Bu endpoint'lerde ayrıca helmet'in varsayılan `Cross-Origin-Resource-Policy: same-origin` başlığı, `<img>` etiketinin farklı origin'den (dev: web:3000 → api:4000) görsel yüklemesini engellediği gerçek bir çalışma zamanı hatasıyla tespit edildi (Playwright konsol hatası incelemesiyle bulundu) ve yalnızca bu iki route'ta `Cross-Origin-Resource-Policy: cross-origin` başlığı elle set edilerek düzeltildi.

### 5. Sıralama = gerçek pointer-based drag & drop (`@dnd-kit`)

Kategori/ürün sıralaması için basit yukarı/aşağı butonları yerine `@dnd-kit/core` + `@dnd-kit/sortable` ile gerçek sürükle-bırak kullanıcı tarafından tercih edildi. Backend tarafında bu, tek bir `PATCH .../reorder` endpoint'i (`{items: [{id, sortOrder}]}`, tek `$transaction` içinde ardışık `update()` çağrıları) olarak karşılandı — sıralama mantığı frontend'in sürükleme kütüphanesinden bağımsız, herhangi bir UI ile değiştirilebilir kalır.

### 6. Product için soft delete, diğer modeller için hard delete

Yalnızca `Product`'ta `deletedAt: DateTime?` alanı var; `Menu`/`Category`/`Variant`/`OptionGroup`/`Option` hard delete kullanır. Gerekçe: bir ürün, geçmiş siparişlerde/raporlarda referans olarak kalabilir (gelecek sprint konusu) ve yanlışlıkla silinen bir ürünün geri getirilmesi işletme için değerli bir kurtarma senaryosu — kategoriler/menüler için bu risk ürün kadar yüksek değil, [0007](0007-identity-multi-tenant-schema.md)'de `User`/`Tenant` için kurulan manuel-filtre deseniyle tutarlı (global bir Prisma soft-delete middleware'i icat edilmedi, her sorgu noktasında `deletedAt: null` filtresi elle uygulanıyor).

### 7. Variant/OptionGroup/Option için ayrı permission kodu icat edilmedi

Spec'te açıkça listelenen 8 permission kodu (`menu.read/write`, `category.read/write`, `product.read/write`, `media.upload`, `theme.update`) dışına çıkılmadı. Variant/OptionGroup/Option, kavramsal olarak Product'ın bir parçası olduğu için `product.read`/`product.write`'a bağlı kaldı — yeni bir permission kodu, spec'in "yalnızca listelenen kodlar" sınırını aşardı.

## Sonuçlar

- Yeni bir tenant-owned tablo eklemek artık iki adım gerektiriyor: `tenantId` kolonu + `TENANT_SCOPED_MODELS` setine ekleme — aksi halde model, [0007](0007-identity-multi-tenant-schema.md)'deki "varsayılan olarak reddeden" mekanizmanın dışında kalır.
- Medya, tema/marka, menü hiyerarşisi artık aynı tenant izolasyon ve yetkilendirme zincirinden geçiyor; SUPER_ADMIN bu sprintte bu endpoint'leri kullanamaz (tenant context'i yok) — cross-tenant yönetim gelecek bir sprint konusu.
- `MediaType.QR` enum değeri şemada yer alıyor ama gerçek QR üretim mantığı bu sprintte yazılmadı — yalnızca gelecekteki QR-üretim sprintinin kullanacağı bir depo noktası.
