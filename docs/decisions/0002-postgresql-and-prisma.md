# 0002 - PostgreSQL ve Prisma ORM

## Durum

Kabul edildi.

## Bağlam

Platform; işletme, şube, menü, ürün, sipariş gibi ilişkisel verileri kesin bütünlük kısıtlarıyla (foreign key, unique constraint) saklamak zorunda. Sprint 1'de eklenecek çok kiracılı (multi-tenant) yapı, güçlü ilişkisel garantiler ve ileride değerlendirilecek Row Level Security desteği gerektiriyor.

## Karar

Veritabanı olarak **PostgreSQL**, ORM olarak **Prisma** kullanılacak. `packages/database` paketi:

- Prisma şemasının (`prisma/schema.prisma`) ve migration'ların tek kaynağıdır.
- Tek bir `PrismaClient` örneğini dışa aktarır; `api` ve `worker` bu örneği paylaşır, kendi `PrismaClient`'larını oluşturmazlar.
- Geliştirme ortamında hot-reload sırasında bağlantı havuzunun çoğalmasını önlemek için istemci `globalThis` üzerinde saklanır.

## Gerekçe

- **PostgreSQL**: Güçlü ilişkisel bütünlük, JSONB desteği (ileride esnek menü/ürün alanları için), olgun Row Level Security desteği (Sprint 1 tenant izolasyonu için değerlendirilecek) ve geniş ekosistem desteği sunuyor.
- **Prisma**: Tip güvenli sorgu API'si, migration yönetimi ve şema-kod senkronizasyonu sağlıyor. `schema.prisma` tek doğruluk kaynağı olduğundan, veritabanı şeması ile TypeScript tipleri asla birbirinden sapmıyor.
- **Tek PrismaClient**: Her istek/süreçte yeni `PrismaClient` oluşturmak bağlantı havuzunu tüketir ve production'da bağlantı tükenmesi hatalarına yol açar. Bu nedenle client, `packages/database` içinde tek noktadan yönetilir.
- **Migration altyapısı Sprint 0'da kurulur, tablo eklenmez**: Sprint 0'ın kapsamı yalnızca temel altyapıdır; ilk migration kasıtlı olarak boştur, `prisma migrate dev`/`deploy` komutlarının çalıştığını kanıtlamak için vardır.

## Sonuçlar

- Sprint 1'de tenant tabloları eklenirken yalnızca `packages/database/prisma/schema.prisma` güncellenir ve yeni bir migration üretilir; `api`/`worker` tarafında client kurulumu değişmez.
- `pnpm db:migrate` (yerel geliştirme, etkileşimli) ve `pnpm db:migrate:deploy` (CI/production, etkileşimsiz) ayrımı baştan kurulmuştur.
