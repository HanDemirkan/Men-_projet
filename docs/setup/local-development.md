# Yerel Geliştirme Kurulumu

Bu doküman, Docker olmadan yerel geliştirme ortamını ayağa kaldırma adımlarını açıklar. Genel mimari için [`docs/architecture/overview.md`](../architecture/overview.md), Docker'ın neden kaldırıldığı için [ADR 0005](../decisions/0005-remove-docker-native-deployment.md).

## Önkoşullar

| Bileşen    | Windows                                                                                     | macOS / Linux                                                             |
| ---------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Node.js    | >= 20 (nodejs.org installer)                                                                | >= 20 (nvm veya paket yöneticisi)                                         |
| pnpm       | `corepack enable` (pnpm@9.15.0'ı otomatik etkinleştirir)                                    | aynı                                                                      |
| PostgreSQL | 16+ (postgresql.org installer, Windows servisi olarak kurulur)                              | 16+ (`apt install postgresql` / `brew install postgresql@16`)             |
| Redis      | **Memurai** (Redis-uyumlu, native Windows servisi) - bkz. [`docs/setup/redis.md`](redis.md) | native `redis-server` (`apt install redis-server` / `brew install redis`) |

Docker'a **ihtiyaç yoktur**.

## Kurulum

```bash
git clone <repo-url> qr-platform
cd qr-platform
cp .env.development.example .env.development
pnpm install
```

`.env.development` dosyasındaki değerleri kendi yerel ortamınıza göre düzenleyin (özellikle `POSTGRES_PASSWORD`/`DATABASE_URL` ve `STORAGE_DIR`). Bu dosya asla Git'e eklenmez.

### PostgreSQL

Windows'ta PostgreSQL kurulumu sırasında oluşturduğunuz şifreyle bir veritabanı ve kullanıcı oluşturun (`psql` veya pgAdmin ile):

```sql
CREATE DATABASE qr_platform;
CREATE USER qr_platform_user WITH PASSWORD 'change-me-in-local-env';
GRANT ALL PRIVILEGES ON DATABASE qr_platform TO qr_platform_user;
```

`.env.development` içindeki `DATABASE_URL` bu bilgilerle eşleşmelidir. Detaylar için [`docs/setup/postgresql.md`](postgresql.md).

### Redis (Memurai)

Windows'ta [`docs/setup/redis.md`](redis.md)'deki Memurai kurulum adımlarını izleyin. Kurulum sonrası Memurai bir Windows servisi olarak arka planda sürekli çalışır; `.env.development`'taki varsayılan `REDIS_URL=redis://localhost:6379` değeri değişiklik gerektirmez.

### Veritabanı şeması

```bash
pnpm db:migrate
```

### Storage dizini

`.env.development` içindeki `STORAGE_DIR`'in işaret ettiği dizinin var olduğundan emin olun (yoksa `LocalStorageAdapter` ilk yazmada otomatik oluşturur, ama repo dizini dışında bir yol seçtiğinizden emin olun):

```powershell
New-Item -ItemType Directory -Force -Path C:\qr-platform-data\storage
```

## Çalıştırma

```bash
pnpm dev            # web + api + worker, hepsi birden (Turborepo)
pnpm dev:web        # yalnızca web (http://localhost:3000)
pnpm dev:api        # yalnızca api (http://localhost:4000)
pnpm dev:worker     # yalnızca worker
```

Bu komutlar `.env.development` dosyasını otomatik yükler (kök `package.json`'daki `dotenv-cli` sarmalaması sayesinde).

Servisler ayağa kalktıktan sonra:

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health, `/health/live`, `/health/ready`
- Worker (iç sağlık ucu): http://localhost:4100/health

## Test/lint/build

```bash
pnpm lint
pnpm typecheck
pnpm test           # unit + packages/database'in Postgres'e bağlanan integration testi
pnpm test:e2e       # Jest e2e (api) + Playwright (web)
pnpm build          # production build (tüm paketler + uygulamalar)
```

`pnpm test`/`pnpm test:e2e` de `.env.development`'ı otomatik yükler (ve build adımlarının `next build`'i bozmaması için `NODE_ENV`'i açıkça `test`'e sabitler); native PostgreSQL ve Redis çalışıyor olmalıdır. Playwright'ın ana sayfa testi ayrıca API'nin ayrıca çalışıyor olmasını bekler (`NEXT_PUBLIC_API_URL` üzerinden gerçek bir istek atar) — başka bir terminalde `pnpm dev:api` (veya `pnpm dev`) çalıştırmadan bu test başarısız olur.

## PM2 ile yerel smoke test (opsiyonel)

Production'daki PM2 topolojisini yerelde denemek isterseniz (gerçek production akışı [`docs/setup/pm2.md`](pm2.md)'de):

```bash
pnpm build
NODE_ENV=development pnpm exec pm2 start ecosystem.config.cjs   # zaten var olan .env.development'ı kullanır
pnpm exec pm2 status
pnpm exec pm2 logs --lines 20
pnpm exec pm2 delete all
```

## Sorun giderme

Bkz. [`docs/operations/troubleshooting.md`](../operations/troubleshooting.md).
