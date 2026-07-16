# 0004 - Paylaşılan Veritabanı ile Çok Kiracılılık (Sprint 1'de uygulanacak)

## Durum

Kabul edildi (uygulama Sprint 1'de yapılacak). Sprint 0'da hiçbir tenant tablosu veya tenant filtreleme mantığı oluşturulmamıştır; bu doküman yalnızca gelecekteki yaklaşımı belgeler.

## Bağlam

Platform çok işletmeli (multi-tenant) çalışacak: her kafe/restoran (tenant) kendi menüsüne, kullanıcılarına, siparişlerine sahip olacak. Kesin ürün kararı gereği her işletmenin verisi kesinlikle birbirinden ayrılmalıdır. İki temel yaklaşım değerlendirildi: (a) tenant başına ayrı veritabanı/şema, (b) tek veritabanında paylaşılan tablolar + `tenant_id` ile mantıksal izolasyon.

## Karar

**Paylaşılan tek PostgreSQL veritabanı + mantıksal izolasyon** yaklaşımı Sprint 1'de uygulanacaktır:

1. **Tek PostgreSQL veritabanı**: Tüm tenant'lar aynı veritabanını, aynı şemayı paylaşır. Tenant başına ayrı veritabanı/şema açılmaz.
2. **Ortak tablolar**: Tenant kavramından bağımsız, sistem geneline ait tablolar (örn. süper admin kullanıcıları, sistem sabitleri) `tenant_id` içermez.
3. **Tenant'a ait tablolarda `tenant_id`**: İşletmeye özel her tablo (menü, kategori, ürün, sipariş, şube, kullanıcı vb.) zorunlu bir `tenant_id` (foreign key) kolonu içerir.
4. **Backend tarafından zorunlu tenant filtreleme**: Tenant'a ait veriye erişen her sorgu, kimlik doğrulanmış oturumdan türetilen `tenant_id` ile daraltılır. Bu filtreleme, tekil sorgu yazarken unutulabilecek bir "opsiyon" değil, veri erişim katmanında zorunlu kılınan bir kuraldır (örn. tüm tenant-scoped sorgular tek bir yardımcı/temel sınıf üzerinden geçer).
5. **Kritik alanlarda PostgreSQL Row Level Security (RLS) değerlendirmesi**: Uygulama katmanındaki filtrelemeye ek bir güvenlik katmanı olarak, özellikle hassas tablolarda RLS politikaları (session değişkeni olarak `tenant_id` set edilip, PostgreSQL'in bunu her sorguda otomatik uygulaması) değerlendirilecektir. Bu, "uygulama kodunda bir filtreleme unutulursa bile veritabanı seviyesinde veri sızıntısı engellenir" garantisini sağlar.
6. **Tenant bilgisi request body'den alınmaz**: `tenant_id`, istemcinin gönderdiği hiçbir alandan (body, query string, header) türetilmez. Backend, kimlik doğrulama sonrası sunucu taraflı oturum/token bilgisinden tenant bağlamını çıkarır. Bu, spoofing (başka bir tenant'ın verisine erişim) riskini ortadan kaldırır.
7. **Tenant izolasyonu için integration testleri**: Sprint 1'de, iki farklı tenant'a ait veri oluşturup, bir tenant'ın oturumuyla diğer tenant'ın verisine erişilemediğini doğrulayan integration testleri zorunlu kılınacaktır. Bu testler, izolasyonun yalnızca kod incelemesiyle değil, otomatik olarak da garanti altına alınmasını sağlar.

## Gerekçe

- **Paylaşılan veritabanı** operasyonel olarak çok daha basittir: tek migration seti, tek bağlantı havuzu, tek yedekleme stratejisi. Tenant başına veritabanı, tenant sayısı arttıkça (yüzlerce kafe/restoran) yönetilemez hale gelir.
- **`tenant_id` + zorunlu filtreleme**, çoğu SaaS platformunda kanıtlanmış bir modeldir ve Prisma'nın ilişkisel sorgu modeliyle doğal olarak uyumludur.
- **RLS'in "değerlendirme" olarak işaretlenmesi** (henüz zorunlu değil): RLS, uygulama seviyesi filtrelemenin yerini almaz, ona ek bir savunma katmanıdır. Sprint 1'de hangi tabloların bu ek katmanı gerektirdiği (örn. ödeme/kasa verileri) ayrıca değerlendirilecektir.
- **Tenant bilgisinin frontend'den asla güvenilir kabul edilmemesi**, temel bir güvenlik ilkesidir: istemci taraflı herhangi bir veri, kötü niyetli veya hatalı bir istemci tarafından değiştirilebilir.

## Sprint 0'daki durum

- Bu sprintte `packages/database/prisma/schema.prisma` içinde hiçbir tenant, işletme, şube veya kullanıcı tablosu **yoktur**.
- İlk migration (`20260101000000_init`) kasıtlı olarak boştur.
- Bu doküman, Sprint 1'in başlangıç noktası olarak hizmet eder.

## Sonuçlar

- Sprint 1'de eklenecek her yeni tablo için "bu tabloya `tenant_id` gerekiyor mu?" sorusu şema tasarımının standart bir parçası olacaktır.
- Veri erişim katmanı (Sprint 1'de eklenecek), tek tek endpoint'lerin tenant filtrelemesini "hatırlamasına" güvenmek yerine, bunu yapısal olarak zorunlu kılacak şekilde tasarlanacaktır.
