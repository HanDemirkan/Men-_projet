# 0009 - Public Storefront, Theme/Publishing Model ve QR Üretimi

## Durum

Kabul edildi ve uygulandı (Sprint 3B). [0007](0007-identity-multi-tenant-schema.md)'nin tenant izolasyon mekanizmasını ilk kez **oturumsuz (anonymous)** isteklere genişletiyor; [0008](0008-business-profile-media-menu-domain.md)'in tema alanlarını (3 renk + `theme` string) tamamen yeni bir sisteme taşıyor.

## Bağlam

Sprint 3B'nin amacı: müşterinin QR okuttuğunda gerçekten bir yere gitmesi (public storefront), işletmenin bu sayfayı kendi zevkine göre tasarlayabilmesi (tema sistemi + canlı önizlemeli QR Builder), ve gerçek indirilebilir QR kodları. Kullanıcıyla netleşen üç mimari karar (draft/publish modeli, arşivleme=soft-delete, arama hem panelde hem storefront'ta) ve bunların üzerine inşa edilen teknik kararlar aşağıda.

## Kararlar

### 1. Tema alanları JSON'a taşındı, draft/publish çifti olarak

[0008](0008-business-profile-media-menu-domain.md)'de `Tenant.theme/primaryColor/secondaryColor/accentColor` düz kolonlardı. Bu sprint 8 yeni stil ekseni (background/cardRadius/buttonRadius/typography/menuStyle/cardStyle/shadowStyle) ekliyor ve kullanıcı **draft + publish** modelini seçti (Kaydet ≠ yayında; ayrı bir Yayınla eylemi gerekiyor). Dört düz kolonu genişletmek yerine tamamı `Tenant.storefrontConfig` (yayında) ve `Tenant.storefrontConfigDraft` (taslak) — iki nullable JSON kolonuna taşındı. Tek bir tutarlı `StorefrontConfig` tipi (`packages/shared/src/storefront-config.ts`) hem backend'in default/merge mantığını hem frontend'in editör/önizleme bileşenlerini besliyor — iki ayrı yerde şema tekrarı yok. `null` = "hiç özelleştirilmedi", okuma anında Classic şablonuyla merge edilir (DB'de "boş" bir JSON zorunlu tutulmuyor). Dev DB'de henüz gerçek müşteri verisi olmadığından eski 4 kolonun verisi taşınmadan düşürüldü (bkz. migration `storefront_config_and_category_slug`).

4 hazır şablon (`STOREFRONT_TEMPLATES.classic/modern/minimal/premium`) aynı dosyada sabit tanımlı — `theme` alt-objesinin farklı ön tanımlı değer setleri, TemplatePicker bunları seçince draft'a kopyalar (henüz kaydedilmez).

### 2. Draft/Publish — tek kaynak, iki JSON kolon, üç endpoint

`storefrontConfigDraft`, QR Builder'ın **tüm** değişikliklerinin (tema, bölüm görünürlüğü, QR ayarları, SEO, footer, favicon/OG) tek yazma hedefi. `GET /storefront-config` `{published, draft, hasUnpublishedChanges}` döner; `PATCH .../draft` (`theme.update` izni) draft'ı kısmi günceller; `POST .../publish` (yeni `storefront.publish` izni) draft'ı olduğu gibi published'a kopyalar. Canlı önizleme (`StorefrontPreview` bileşeni) **hiçbir zaman** backend'e gitmez — saf, props-driven bir React bileşeni olarak hem gerçek public sayfada hem QR Builder'da render edilir, "her değişiklik anında yansısın" gereksinimini ağ isteği olmadan karşılar.

### 3. Public tenant-context — `AsyncLocalStorage` mekanizması anonim isteklere genişletildi

[0007](0007-identity-multi-tenant-schema.md) §3'ün kanıtladığı `runWithTenantContext(id, () => next())` deseni, JWT yerine `:tenantSlug` route parametresinden tenant çözen yeni bir `PublicStorefrontContextMiddleware` ile aynen tekrar kullanıldı — `AppModule.configure()`'da yalnızca `PublicStorefrontController`'ın kendi route'larına bağlı (Nest'in controller-bazlı middleware binding'i, path string'i elle inşa etmek yerine). Sonuç: public storefront endpoint'leri bile `tenantScopedPrisma`'nın "unutulamaz filtre" garantisiyle çalışıyor — anonim bir istek bile yanlışlıkla başka tenant verisi döndüremez. Bunun üzerine ayrı bir "published" filtre katmanı var (`Menu.status=PUBLISHED`, `Category.active=true`, `Product.isAvailable=true && deletedAt=null`) — tenant izolasyonundan bağımsız, published-content kuralı.

### 4. Business Profile vs Storefront Settings — veri vs. sunum ayrımı

`/business/profile` (Sprint 3A) veri girişini korur (telefon, adres, sosyal medya...). Yeni `/business/storefront` sayfası bu verilerin **hangi bölümlerinin public sayfada görüneceğini** (`sections` aç/kapa toggle'ları), temayı, QR görünümünü, SEO/footer/favicon/OG'yi yönetir. Veri tekrarı yok — storefront ayarları saf sunum tercihi, güvenlik sınırı değil (bu alanlar zaten müşteriye gösterilmek üzere var olan bilgiler, gizli değil), bu yüzden client-side toggle + backend'in ham veriyi döndürmesi yeterli görüldü (sunucu tarafı alan-bazlı filtreleme eklenmedi — spec'in gerektirmediği bir güvenlik sınırı icat edilmedi).

### 5. Category'ye `slug` eklendi

`/{tenantSlug}/category/{slug}` route'u için gerekli — Product'ın Sprint 3A'da kurulu Türkçe-karakter-duyarlı `slugify()`'ı `apps/api/src/common/slugify.ts`'e taşınıp Category'de de kullanılıyor (kod tekrarı yerine ortak yardımcı).

### 6. QR üretimi — talep anında, hiç saklanmadan

`qrcode` (yeni bağımlılık) + mevcut `sharp` (Sprint 3A'dan, logo kompozisyonu için). QR kodu **DB'ye veya diske hiç yazılmıyor** — her `GET /qr-code` çağrısı `${WEB_APP_URL}/${tenant.slug}`'ı yeniden kodluyor. Bu bilinçli bir tercih: QR görünümü (logo var/yok, hata düzeltme seviyesi) draft'ta değişebilir durumda olduğu sürece "önceden üretilmiş" bir kopya gereksiz karmaşıklık ve senkronizasyon riski olurdu. `WEB_APP_URL` zaten Sprint 2'den beri var olan bir env değişkeni (forgot-password linki için) — yeni bir `PUBLIC_WEB_URL` icat edilmedi.

### 7. `Cross-Origin-Resource-Policy` deseni — QR endpoint'ine de uygulandı

Sprint 3A'da Media'nın public streaming route'larında bulunan CORP sorunu (helmet'in `same-origin` varsayılanı cross-origin `<img>` yüklemesini engelliyor) **aynı şekilde QR endpoint'inde de** tekrarladı — gerçek tarayıcıda QR Builder'ın önizleme `<img>`'i sessizce kırık çıktı (Playwright'ın `toBeVisible()` kontrolü bunu yakalamadı, çünkü kırık bir `<img>` DOM'da hâlâ "visible"; sorunu yalnızca `naturalWidth > 0` kontrolü yakaladı). Düzeltme aynı: `Cross-Origin-Resource-Policy: cross-origin` başlığı QR route'una da eklendi. Bu, ileride başka bir cross-origin binary-response endpoint'i eklenirse aynı sınıf hatanın tekrarlanacağını gösteriyor — bir kontrol listesi maddesi olarak not düşülüyor (Bilinen Eksikler).

### 8. Arama — iki farklı gerçek uygulama, tek ortak alt yapı yok

Kullanıcı hem panel hem storefront'ta arama istedi; ikisi kasıtlı olarak **farklı** uygulandı:
- **Panel**: gerçek `GET /search` endpoint'i (Postgres `contains`+`insensitive`, tenant-scoped) — çünkü panelin verisi (Product/Category/Variant/Option) sayfalara bölünmüş, tek seferde yüklenmiyor.
- **Storefront**: `/{tenantSlug}/menu` zaten SSR ile tüm published menüyü tek istekte çekiyor; arama bu veri üzerinde client-side filtre, ekstra ağ isteği yok.

Fuse.js/Postgres full-text gibi bir arama motoru bilinçli olarak eklenmedi — bir işletmenin kataloğu bu ölçekte ILIKE için fazlasıyla yeterli, "gerçek" (mock olmayan) olma şartını zaten karşılıyor.

### 9. `packages/shared` — eksik build adımı bulundu ve düzeltildi

Gerçek tarayıcı doğrulaması sırasında `apps/api`'nin dev sunucusu açılışta çöktü: `packages/shared`'ın `package.json`'ı `main`/`exports`'u doğrudan ham `./src/index.ts`'e işaret ediyordu (kardeşleri `permissions`/`database`/`storage`/`validation`'ın hepsinde olan bir `build` adımı yoktu). `apps/web` bunu fark etmiyordu çünkü Next.js'in `transpilePackages`'ı ham TS'i kendi derliyor; ama `apps/api`'nin düz derlenmiş `dist/main.js`'i çalışma anında `require("@qr-platform/shared")` çağırdığında, Node'un yeni yerleşik TS-stripping desteği bu paketin kendi `index.ts`'indeki uzantısız `export * from "./constants"` gibi göreli import'ları ESM kuralına göre reddetti. Düzeltme: `packages/shared`'a diğer paketlerle birebir aynı `tsconfig.build.json` + `build` script'i + `dist` çıktısına işaret eden `main`/`exports` eklendi. Bu, Sprint 3A'dan beri var olan gizli bir kırılganlıktı — yalnızca gerçek `pnpm dev` ile apps/api'nin gerçekten yeniden başlatılmasıyla ortaya çıktı, "gerçek tarayıcı" doğrulamasının neden atlanamaz olduğuna bir kanıt daha.

### 10. Yeni permission haritası

| Permission | Kim | Gerekçe |
|---|---|---|
| `theme.update` (Sprint 3A'dan) | SUPER_ADMIN, TENANT_OWNER | Artık yalnızca draft'a yazma anlamına geliyor |
| `storefront.publish` (yeni) | SUPER_ADMIN, TENANT_OWNER | Draft'ı canlıya alma — ayrı bir eylem, ayrı bir izin |
| `qr.generate` (yeni) | SUPER_ADMIN, TENANT_OWNER, MENU_EDITOR | Düşük riskli (yalnızca okuma/üretim), menü editörü de masa QR'ı basabilmeli |
| `media.manage` (yeni) | SUPER_ADMIN, TENANT_OWNER, MENU_EDITOR | Medya **silme** `media.upload`'tan ayrıldı (ekleme/listeleme farklı, silme daha yıkıcı) |

BRANCH_MANAGER/CASHIER/WAITER/KITCHEN'a yeni izin eklenmedi — [0008](0008-business-profile-media-menu-domain.md)'in "marka/yayın kararı işletme sahibine özel" ilkesiyle tutarlı.

## Sonuçlar

- Public storefront, ADR 0007'nin tenant izolasyon garantisini ilk kez anonim isteklere taşıdı — yeni bir paralel güvenlik mekanizması icat edilmedi.
- Tema sistemi artık tek, versiyonlanabilir bir JSON tipinde yaşıyor; yeni bir stil ekseni eklemek `packages/shared`'da tek bir yer değişikliği + migration demek.
- `packages/shared`'ın artık gerçek bir build adımı var — kardeş paketlerle simetrik, `apps/api`'nin çalışma zamanı davranışı `apps/web`'inkiyle tutarlı hale geldi.
- Cross-origin binary response endpoint'leri (medya, QR) için `Cross-Origin-Resource-Policy: cross-origin` artık bilinen, tekrarlanan bir desen — yeni bir tane eklenirse ilk akla gelmesi gereken kontrol.
