# Sorun Giderme

## Genel / geliştirme

**`pnpm install` başarısız oluyor / workspace paketi bulunamıyor**
`pnpm-workspace.yaml` içindeki `apps/*` ve `packages/*` kapsamlarının doğru olduğundan emin olun; kökten çalıştırdığınızdan emin olun (alt dizinlerden `pnpm install` çalıştırmayın).

**API/worker başlarken "Invalid environment configuration" hatası veriyor**
`.env.development` (veya `.env.production`) dosyanızda `DATABASE_URL`, `REDIS_URL` veya `STORAGE_DIR` eksik/geçersiz. Hata mesajı hangi alanın eksik olduğunu açıkça belirtir; ilgili `.env.*.example` dosyasıyla karşılaştırın. Production'da ayrıca `CORS_ALLOWED_ORIGINS`'de `localhost` bulunması veya `STORAGE_DIR`'in göreli (relative) bir yol olması da aynı hatayı verir (bkz. `apps/api/src/common/config/env.schema.ts`).

**`@qr-platform/database`, `@qr-platform/validation` veya `@qr-platform/storage` importu çözülemiyor**
Bu paketler `api`/`worker` tarafından derlenmiş (`dist/`) haliyle kullanılır. `pnpm build` (veya en azından ilgili paketin `build` script'i) çalıştırmadan `pnpm start:*` gibi derlenmiş çıktıyı çalıştıran komutları kullanmayın; `pnpm dev:*` bunu Turborepo'nun `dependsOn: ["^build"]` kuralı sayesinde otomatik yapar.

**`pnpm dev` çalışıyor ama `/api/v1/health` "degraded" dönüyor**
`database`/`redis` alanlarından hangisi `"down"` ise, o servis çalışmıyor veya `.env.development`'taki bağlantı bilgileri yanlış demektir. PostgreSQL için Windows'ta `Get-Service postgresql-x64-*`, Redis/Memurai için `Get-Service Memurai` ile servis durumunu kontrol edin.

**Host makinede migration çalıştırırken "Authentication failed" hatası alıyorum**
Makinenizde birden fazla PostgreSQL kurulumu/servisi varsa, bunlardan biri beklenmedik şekilde `5432` portunu dinliyor olabilir. `netstat -ano | findstr 5432` (Windows) veya `netstat -tlnp | grep 5432` (Linux) ile portu dinleyen süreci doğrulayın.

**Next.js `NEXT_PUBLIC_API_URL` değişikliği yansımıyor**
`NEXT_PUBLIC_*` değişkenleri build/dev başlangıcında inline edilir. Değeri değiştirdikten sonra `pnpm dev:web`'i yeniden başlatın (dev modunda yeterli) veya yeniden build edin (production modunda gereklidir).

## Redis

**API/worker sürekli "Redis connection error" logluyor ama çökmüyor**
Beklenen davranış budur (bkz. [`docs/setup/redis.md`](../setup/redis.md)) — process Redis'i bekleyerek çalışmaya devam eder, `/health/ready` 503 döner, `/health/live` 200 dönmeye devam eder. Redis servisinin (Memurai/`redis-server`) çalıştığını doğrulayın.

**Production'da "NOAUTH Authentication required" hatası**
`.env.production`'daki `REDIS_URL`'deki parola, `/etc/redis/redis.conf`'taki `requirepass` ile eşleşmiyor.

## PostgreSQL / migration

**`prisma migrate deploy` "drift detected" hatası veriyor**
Veritabanı şeması, migration geçmişiyle uyuşmuyor (ör. elle bir tablo değiştirilmiş). Migration dosyalarını elle düzenlemeyin; drift'i çözmek için bkz. [Prisma migrate resolve dokümantasyonu](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing) ve gerekirse bir DBA ile birlikte inceleyin.

## PM2

**`pm2 start ecosystem.config.cjs` hemen sonra "errored" durumuna düşüyor**
`pm2 logs <isim> --lines 50 --nostream` ile hata mesajını görün. En sık nedenler: (1) `pnpm build` çalıştırılmamış (`dist/` yok), (2) `.env.${NODE_ENV}` dosyası yok/yanlış yolda, (3) port zaten kullanımda (`netstat -tlnp | grep <port>`).

**`pm2 reload` sonrası eski env değerleri hâlâ kullanılıyor**
`--update-env` bayrağını unutmayın: `pm2 reload ecosystem.config.cjs --update-env`.

## Nginx

**502 Bad Gateway**
Nginx ayakta ama upstream (api/web) ayakta değil veya farklı bir portta. `pm2 status` ile süreçlerin çalıştığını, `nginx.conf`'taki upstream portlarının (`127.0.0.1:4000`, `127.0.0.1:3000`) `.env.production`'daki `API_PORT`/`WEB_PORT` ile eşleştiğini doğrulayın.

**`nginx -t` config hatası veriyor**
Genelde bir `{`/`}` dengesizliği veya SSL config'i (certbot tarafından değiştirilen dosya) elle düzenlenirken bozulmuş olmasıdır. `sudo nginx -t` hatanın satır numarasını verir.
