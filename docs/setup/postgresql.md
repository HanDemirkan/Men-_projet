# PostgreSQL Kurulumu

## Ubuntu (production)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Veritabanı ve kullanıcı oluşturma:

```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE qr_platform;
CREATE USER qr_platform_user WITH PASSWORD 'REPLACE_WITH_STRONG_SECRET';
GRANT ALL PRIVILEGES ON DATABASE qr_platform TO qr_platform_user;
ALTER DATABASE qr_platform OWNER TO qr_platform_user;
SQL
```

Parolayı `.env.production`'daki `POSTGRES_PASSWORD`/`DATABASE_URL` ile eşleştirin. Varsayılan olarak PostgreSQL yalnızca `localhost`'u dinler (`listen_addresses = 'localhost'`, `/etc/postgresql/<version>/main/postgresql.conf`) — production'da bunu değiştirmeyin; API aynı sunucuda çalışır, dışarıdan doğrudan veritabanı erişimi olmamalıdır.

## Windows (yerel geliştirme)

postgresql.org'daki installer PostgreSQL'i bir Windows servisi olarak kurar (bu makinede zaten `postgresql-x64-17` servisi olarak kurulu ve çalışıyor). Kurulum sırasında belirlediğiniz `postgres` şifresiyle pgAdmin veya `psql` ile bağlanıp yerel geliştirme veritabanını/kullanıcısını oluşturun (bkz. [`docs/setup/local-development.md`](local-development.md)).

## Migration komutları

| Komut                    | Ne zaman kullanılır                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `pnpm db:generate`       | Prisma Client'ı `schema.prisma`'dan yeniden üretir (kod değişikliğinden sonra)                             |
| `pnpm db:migrate`        | **Yerel geliştirme**: yeni migration oluşturur ve etkileşimli olarak uygular                               |
| `pnpm db:migrate:deploy` | **Production/CI**: yalnızca var olan migration'ları etkileşimsiz olarak uygular; yeni migration oluşturmaz |
| `pnpm db:studio`         | Prisma Studio'yu açar                                                                                      |

## Production migration akışı

Her deploy'da (bkz. [`docs/operations/deploy.md`](../operations/deploy.md)), kod güncellendikten ve `pnpm build` çalıştırıldıktan **sonra**, uygulamalar yeniden başlatılmadan **önce**:

```bash
pnpm exec dotenv -e .env.production -- pnpm db:migrate:deploy
```

`prisma migrate deploy`:

- Yalnızca `packages/database/prisma/migrations/` altında zaten commit edilmiş migration'ları uygular; şema sürüklenmesi (drift) varsa hata verir.
- Etkileşimli soru sormaz, CI/CD'ye uygundur.
- **Otomatik rollback yapmaz.** Bir migration production'da hataya yol açarsa: (1) önce [`docs/operations/backup-restore.md`](../operations/backup-restore.md)'daki restore prosedürünü uygulayın, (2) migration'ı düzelten yeni bir migration ekleyip tekrar deploy edin. Uygulanmış bir migration dosyasını elle silmeyin/değiştirmeyin.

## Backup / Restore

Script'ler: `infrastructure/scripts/backup-postgres.sh`, `infrastructure/scripts/restore-postgres.sh`. Kullanım ve cron kurulumu için: [`docs/operations/backup-restore.md`](../operations/backup-restore.md).
