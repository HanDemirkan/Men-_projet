# QR Platform

QR Menü ve İşletme Operasyon Platformu — çok işletmeli (multi-tenant) dijital menü ve operasyon yönetim sistemi.

> **Sprint 0**: Bu sürümde hiçbir ürün özelliği bulunmamaktadır. Yalnızca ileride ürün özelliklerinin güvenli ve düzenli şekilde eklenebileceği teknik temel kurulmuştur (monorepo, web/api/worker iskeleti, veritabanı bağlantısı, PM2/Nginx tabanlı native production altyapısı, test/lint/build hattı).

## Proje amacı

Kafeler ve restoranlar için: işletmeye özel tanıtım sayfası, mobil uyumlu QR menü, menü/kategori/ürün yönetimi, garson ve mutfak sipariş ekranları, kasa takibi, süper admin paneli ve operasyon raporları sunacak bir platform. Bu özelliklerin hiçbiri Sprint 0 kapsamında değildir; bkz. [`docs/architecture/overview.md`](docs/architecture/overview.md).

## Mimari yaklaşım

- **Monorepo**: pnpm workspace + Turborepo (bkz. [ADR 0001](docs/decisions/0001-monorepo.md))
- **Modüler monolit**: Tek NestJS API, net modül sınırlarıyla (bkz. [ADR 0003](docs/decisions/0003-modular-monolith.md))
- **PostgreSQL + Prisma**: Tek paylaşılan `PrismaClient`, `packages/database` üzerinden (bkz. [ADR 0002](docs/decisions/0002-postgresql-and-prisma.md))
- **Çok kiracılılık**: Sprint 1'de eklenecek, bkz. [ADR 0004](docs/decisions/0004-shared-database-multi-tenancy.md)
- **Native deployment (Docker yok)**: Yerel geliştirme ve production, PM2 + Nginx + native PostgreSQL/Redis ile çalışır, bkz. [ADR 0005](docs/decisions/0005-remove-docker-native-deployment.md)
- **Yerel disk depolama**: Dosya depolama, `packages/storage` üzerinden `StorageService` soyutlamasıyla yerel diske yazılır, bkz. [ADR 0006](docs/decisions/0006-local-file-storage.md)

Detaylı sistem bileşenleri ve sorumluluk dağılımı için: [`docs/architecture/overview.md`](docs/architecture/overview.md).

## Gereksinimler

- Node.js >= 20
- pnpm >= 9 (`corepack enable` ile otomatik etkinleştirilebilir)
- PostgreSQL 16+ (native kurulum — Windows: installer, Ubuntu: apt)
- Redis-uyumlu bir servis (Windows: [Memurai](https://www.memurai.com/), Ubuntu: apt `redis-server`)

Docker'a **ihtiyaç yoktur**.

## Yerel kurulum

Ayrıntılı adımlar için [`docs/setup/local-development.md`](docs/setup/local-development.md); özet:

```bash
git clone <repo-url> qr-platform
cd qr-platform
cp .env.development.example .env.development
pnpm install
pnpm db:migrate
pnpm dev
```

`.env.development` dosyasındaki değerleri kendi ortamınıza göre düzenleyin (özellikle `POSTGRES_PASSWORD`, `DATABASE_URL`, `STORAGE_DIR`). Gerçek `.env*` dosyaları asla Git'e eklenmez.

Servisler ayağa kalktıktan sonra:

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health (birleşik durum), `/health/live`, `/health/ready`
- Worker (iç sağlık ucu): http://localhost:4100/health

## Environment kurulumu

Üç ayrı env dosyası kullanılır:

| Dosya                                                                          | Kullanım                                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `.env.development` (Git'te değil)                                              | `pnpm dev*`/`pnpm test*` tarafından otomatik yüklenir              |
| `.env.production` (Git'te değil)                                               | `pnpm start:*` ve PM2 (`ecosystem.config.cjs`) tarafından yüklenir |
| `.env.example`, `.env.development.example`, `.env.production.example` (Git'te) | Şablonlar                                                          |

Önemli noktalar:

- Tüm değişkenlerin merkezi doğruluk kaynağı `packages/validation/src/env.schema.ts`'dir (Zod); her uygulama ihtiyaç duyduğu alt kümeyi `.pick()` ile türetir.
- API ve worker, eksik/geçersiz bir zorunlu değişken olduğunda **anlaşılır bir hata ile başlangıçta kapanır**. Production'da ayrıca `CORS_ALLOWED_ORIGINS`'in `localhost` içermemesi ve `STORAGE_DIR`'in mutlak bir yol olması zorunludur (bkz. `apps/api/src/common/config/env.schema.ts`).
- Hassas değerler (parolalar, Redis parolası) hiçbir log çıktısında görünmez (pino `redact`, bkz. `apps/api/src/common/logging/logger.module.ts`).
- `NEXT_PUBLIC_API_URL`, web uygulamasının API'ye ulaşacağı tam adrestir (örn. `http://localhost:4000/api/v1`).

## Migration komutları

| Komut                    | Açıklama                                                      |
| ------------------------ | ------------------------------------------------------------- |
| `pnpm db:generate`       | Prisma Client'ı şemadan yeniden üretir                        |
| `pnpm db:migrate`        | Yerel geliştirme için etkileşimli migration oluşturur/uygular |
| `pnpm db:migrate:deploy` | CI/production için etkileşimsiz migration uygular             |
| `pnpm db:studio`         | Prisma Studio'yu açar                                         |

Production migration akışı için: [`docs/setup/postgresql.md`](docs/setup/postgresql.md).

## Test komutları

| Komut               | Kapsam                                                  |
| ------------------- | ------------------------------------------------------- |
| `pnpm test`         | Tüm paketlerin birim/entegrasyon testleri (Vitest/Jest) |
| `pnpm test:e2e`     | API e2e testleri (Supertest) + web Playwright testleri  |
| `pnpm lint`         | Tüm paketlerde ESLint                                   |
| `pnpm typecheck`    | Tüm paketlerde `tsc --noEmit`                           |
| `pnpm format:check` | Prettier format kontrolü                                |

Playwright'ı ilk kez çalıştırmadan önce tarayıcıları indirin: `pnpm exec playwright install --with-deps chromium`.

## Build ve production komutları

```bash
pnpm build          # tüm paketler + uygulamalar (Turborepo bağımlılık sırasına göre)
pnpm start:web      # yalnızca web, .env.production ile
pnpm start:api      # yalnızca api, .env.production ile
pnpm start:worker   # yalnızca worker, .env.production ile
```

Gerçek production'da uygulamalar tek tek `pnpm start:*` ile değil, PM2 üzerinden çalışır — bkz. [`docs/setup/pm2.md`](docs/setup/pm2.md) ve [`docs/operations/deploy.md`](docs/operations/deploy.md).

## Production kurulumu

Sıfırdan bir Ubuntu sunucusuna kurulum için: [`docs/setup/production-ubuntu.md`](docs/setup/production-ubuntu.md) (bileşen bazlı: [PostgreSQL](docs/setup/postgresql.md), [Redis](docs/setup/redis.md), [Nginx](docs/setup/nginx.md), [PM2](docs/setup/pm2.md)). Deploy/rollback için: [`docs/operations/deploy.md`](docs/operations/deploy.md), [`docs/operations/rollback.md`](docs/operations/rollback.md). Backup/restore için: [`docs/operations/backup-restore.md`](docs/operations/backup-restore.md).

## Port bilgileri

| Servis                 | Varsayılan port | Değişken                |
| ---------------------- | --------------- | ----------------------- |
| Web                    | 3000            | `WEB_PORT`              |
| API                    | 4000            | `API_PORT`              |
| Worker (iç sağlık ucu) | 4100            | `WORKER_PORT`           |
| PostgreSQL             | 5432            | `POSTGRES_PORT`         |
| Redis / Memurai        | 6379            | (bağlantı: `REDIS_URL`) |

Production'da Nginx 80/443'te dinler ve `/api/` isteklerini API'ye, geri kalanını web'e yönlendirir (bkz. [`docs/setup/nginx.md`](docs/setup/nginx.md)).

## Sorun giderme

Bkz. [`docs/operations/troubleshooting.md`](docs/operations/troubleshooting.md).
