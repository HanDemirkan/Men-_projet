# QR Platform

QR Menü ve İşletme Operasyon Platformu — çok işletmeli (multi-tenant) dijital menü ve operasyon yönetim sistemi.

> **Sprint 0**: Bu sürümde hiçbir ürün özelliği bulunmamaktadır. Yalnızca ileride ürün özelliklerinin güvenli ve düzenli şekilde eklenebileceği teknik temel kurulmuştur (monorepo, web/api/worker iskeleti, veritabanı bağlantısı, Docker altyapısı, test/lint/build hattı).

## Proje amacı

Kafeler ve restoranlar için: işletmeye özel tanıtım sayfası, mobil uyumlu QR menü, menü/kategori/ürün yönetimi, garson ve mutfak sipariş ekranları, kasa takibi, süper admin paneli ve operasyon raporları sunacak bir platform. Bu özelliklerin hiçbiri Sprint 0 kapsamında değildir; bkz. [`docs/architecture/overview.md`](docs/architecture/overview.md).

## Mimari yaklaşım

- **Monorepo**: pnpm workspace + Turborepo (bkz. [ADR 0001](docs/decisions/0001-monorepo.md))
- **Modüler monolit**: Tek NestJS API, net modül sınırlarıyla (bkz. [ADR 0003](docs/decisions/0003-modular-monolith.md))
- **PostgreSQL + Prisma**: Tek paylaşılan `PrismaClient`, `packages/database` üzerinden (bkz. [ADR 0002](docs/decisions/0002-postgresql-and-prisma.md))
- **Çok kiracılılık**: Sprint 1'de eklenecek, bkz. [ADR 0004](docs/decisions/0004-shared-database-multi-tenancy.md)

Detaylı sistem bileşenleri ve sorumluluk dağılımı için: [`docs/architecture/overview.md`](docs/architecture/overview.md).

## Gereksinimler

- Node.js >= 20
- pnpm >= 9 (`corepack enable` ile otomatik etkinleştirilebilir)
- Docker + Docker Compose (Docker ile çalıştırmak isteyenler için)
- PostgreSQL 16, Redis 7, MinIO (Docker olmadan çalıştırmak isteyenler için, yerel kurulum)

## Yerel kurulum

```bash
git clone <repo-url> qr-platform
cd qr-platform
cp .env.example .env
pnpm install
```

`.env` dosyasındaki değerleri kendi ortamınıza göre düzenleyin (özellikle şifreler). `.env` asla Git'e eklenmez.

## Environment kurulumu

Tüm ortam değişkenleri `.env.example` içinde belgelenmiştir. Önemli noktalar:

- `DATABASE_URL`, `POSTGRES_*` değişkenleriyle tutarlı olmalıdır.
- `NEXT_PUBLIC_API_URL`, web uygulamasının API'ye ulaşacağı tam adrestir (örn. `http://localhost:4000/api/v1`).
- API ve worker, eksik/geçersiz bir zorunlu değişken olduğunda **anlaşılır bir hata ile başlangıçta kapanır** (bkz. `packages/validation/src/env.schema.ts` ve her uygulamanın kendi env şeması).
- Hassas değerler (şifreler, MinIO secret key) hiçbir log çıktısında görünmez.

## Docker ile çalıştırma

```bash
pnpm docker:up      # docker compose up -d
pnpm docker:logs     # docker compose logs -f
pnpm docker:down      # docker compose down
```

Servisler ayağa kalktıktan sonra:

- Web: http://localhost:3000
- API health: http://localhost:4000/api/v1/health
- Nginx (tek giriş noktası): http://localhost:8080
- MinIO Console: http://localhost:9001

Varsayılan olarak `dev` target'ı ile hot-reload modunda çalışır (`docker-compose.yml` içindeki `DOCKER_TARGET` değişkeniyle `production` target'ına geçilebilir).

İlk kez ayağa kaldırırken veritabanı şemasını uygulamak için:

```bash
pnpm db:migrate:deploy
```

## Docker olmadan çalıştırma

1. Yerel PostgreSQL, Redis ve MinIO servislerini başlatın (veya yalnızca bu üç servis için `docker compose up -d postgres redis minio` kullanabilirsiniz).
2. `.env` dosyasındaki bağlantı bilgilerinin yerel servislerinizle eşleştiğinden emin olun.
3. Bağımlılıkları kurun ve veritabanını hazırlayın:

   ```bash
   pnpm install
   pnpm db:migrate
   ```

4. Tüm uygulamaları geliştirme modunda başlatın:

   ```bash
   pnpm dev
   ```

   Bu komut Turborepo aracılığıyla `web` (http://localhost:3000), `api` (http://localhost:4000) ve `worker`'ı paralel başlatır.

## Migration komutları

| Komut                    | Açıklama                                                      |
| ------------------------ | ------------------------------------------------------------- |
| `pnpm db:generate`       | Prisma Client'ı şemadan yeniden üretir                        |
| `pnpm db:migrate`        | Yerel geliştirme için etkileşimli migration oluşturur/uygular |
| `pnpm db:migrate:deploy` | CI/production için etkileşimsiz migration uygular             |
| `pnpm db:studio`         | Prisma Studio'yu açar                                         |

## Test komutları

| Komut               | Kapsam                                                  |
| ------------------- | ------------------------------------------------------- |
| `pnpm test`         | Tüm paketlerin birim/entegrasyon testleri (Vitest/Jest) |
| `pnpm test:e2e`     | API e2e testleri (Supertest) + web Playwright testleri  |
| `pnpm lint`         | Tüm paketlerde ESLint                                   |
| `pnpm typecheck`    | Tüm paketlerde `tsc --noEmit`                           |
| `pnpm format:check` | Prettier format kontrolü                                |

Playwright'ı ilk kez çalıştırmadan önce tarayıcıları indirin: `pnpm exec playwright install --with-deps chromium`.

## Build komutları

```bash
pnpm build
```

Turborepo, bağımlılık grafiğine göre önce `packages/*` içindeki paketleri (özellikle `database` ve `validation`, çünkü `api`/`worker` bunları derlenmiş haliyle çalışma anında kullanır), ardından `apps/*` içindeki uygulamaları derler.

## Port bilgileri

| Servis                 | Varsayılan port | Değişken                             |
| ---------------------- | --------------- | ------------------------------------ |
| Web                    | 3000            | `WEB_PORT`                           |
| API                    | 4000            | `API_PORT`                           |
| Worker (iç sağlık ucu) | 4100            | `WORKER_PORT`                        |
| PostgreSQL             | 5432            | `POSTGRES_PORT`                      |
| Redis                  | 6379            | `REDIS_PORT`                         |
| MinIO API              | 9000            | `MINIO_PORT`                         |
| MinIO Console          | 9001            | `MINIO_CONSOLE_PORT`                 |
| Nginx                  | 8080            | (sabit, `docker-compose.yml` içinde) |

## Sorun giderme

**`pnpm install` başarısız oluyor / workspace paketi bulunamıyor**
`pnpm-workspace.yaml` içindeki `apps/*` ve `packages/*` kapsamlarının doğru olduğundan emin olun; kökten çalıştırdığınızdan emin olun (alt dizinlerden `pnpm install` çalıştırmayın).

**API başlarken "Invalid environment configuration" hatası veriyor**
`.env` dosyanızda `DATABASE_URL` veya `REDIS_URL` eksik/geçersiz. Hata mesajı hangi alanın eksik olduğunu açıkça belirtir; `.env.example` ile karşılaştırın.

**`@qr-platform/database` veya `@qr-platform/validation` importu çözülemiyor**
Bu iki paket, `api`/`worker` tarafından derlenmiş (`dist/`) haliyle kullanılır. `pnpm build` (veya en azından `pnpm --filter @qr-platform/database build && pnpm --filter @qr-platform/validation build`) çalıştırmadan `pnpm --filter @qr-platform/api start` gibi derlenmiş çıktıyı çalıştıran komutları kullanmayın; `pnpm dev` bunu Turborepo'nun `dependsOn: ["^build"]` kuralı sayesinde otomatik yapar.

**Docker Compose'da bir servis "unhealthy" kalıyor**
`pnpm docker:logs` ile ilgili servisin loglarına bakın. `postgres`/`redis`/`minio` için healthcheck'ler `docker-compose.yml` içinde tanımlıdır; `api` sağlıksızsa genelde `DATABASE_URL`/`REDIS_URL` yanlış yapılandırılmıştır.

**Prisma migration çalışmıyor**
`DATABASE_URL`'in çalışan bir PostgreSQL'e işaret ettiğinden emin olun (`docker compose up -d postgres` veya yerel kurulum). `pnpm db:migrate` yerel/etkileşimli, `pnpm db:migrate:deploy` CI/production için etkileşimsizdir — doğru komutu kullandığınızdan emin olun.

**Host makinede `localhost:5432` üzerinden migration çalıştırırken "Authentication failed" hatası alıyorum ama Docker container'ları sağlıklı görünüyor**
Makinenizde Docker dışında, ayrıca çalışan yerel bir PostgreSQL servisi varsa, o da 5432 portunu dinliyor olabilir; işletim sistemi `localhost:5432` isteğinizi Docker'ın yönlendirdiği porta değil, o yerel servise yönlendirebilir. Bunu doğrulamak için `netstat -ano | grep 5432` (veya Windows'ta `netstat -ano | findstr 5432`) ile portu dinleyen süreçleri kontrol edin. Bu durumda migration'ı doğrudan bir container içinden çalıştırın: `docker compose exec api sh -c "cd /app/packages/database && pnpm exec prisma migrate deploy"`.

**Next.js `NEXT_PUBLIC_API_URL` değişikliği yansımıyor**
`NEXT_PUBLIC_*` değişkenleri build zamanında inline edilir. Değeri değiştirdikten sonra `web` uygulamasını yeniden başlatın (dev modunda yeterli) veya yeniden build edin (production modunda gereklidir).

## Komut isimlendirmeleri hakkında not

Görev tanımındaki tüm kök komutlar (`pnpm dev`, `build`, `lint`, `test`, `test:e2e`, `typecheck`, `format`, `format:check`, `db:*`, `docker:*`) birebir korunmuştur; herhangi bir isim değişikliği yapılmamıştır.
