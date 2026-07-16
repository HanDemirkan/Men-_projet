# Production Kurulumu (Ubuntu)

Bu doküman, tek bir Ubuntu sunucusuna sıfırdan production kurulumu için gereken tüm adımları sırasıyla anlatır. Bileşen bazlı detaylar için: [`docs/setup/postgresql.md`](postgresql.md), [`docs/setup/redis.md`](redis.md), [`docs/setup/nginx.md`](nginx.md), [`docs/setup/pm2.md`](pm2.md). Deploy/rollback için: [`docs/operations/deploy.md`](../operations/deploy.md).

Hedef: Ubuntu 22.04 LTS veya 24.04 LTS.

## 1) Sistem kullanıcısı

Uygulamayı root olarak çalıştırmayın:

```bash
sudo adduser --system --group --home /opt/qr-platform qrapp
sudo mkdir -p /opt/qr-platform /var/lib/qr-platform/storage /var/backups/qr-platform /var/log/qr-platform
sudo chown -R qrapp:qrapp /opt/qr-platform /var/lib/qr-platform /var/backups/qr-platform /var/log/qr-platform
```

## 2) Node.js + pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@9.15.0 --activate
```

## 3) PostgreSQL

Bkz. [`docs/setup/postgresql.md`](postgresql.md) (apt kurulumu, veritabanı/kullanıcı oluşturma).

## 4) Redis

Bkz. [`docs/setup/redis.md`](redis.md) (apt kurulumu, `bind`/`requirepass` sertleştirmesi).

## 5) Nginx

Bkz. [`docs/setup/nginx.md`](nginx.md) (apt kurulumu, reverse proxy config, SSL).

## 6) PM2

```bash
sudo npm install -g pm2
```

Detaylar (systemd entegrasyonu, log rotation): [`docs/setup/pm2.md`](pm2.md).

## 7) Uygulamayı yerleştirme

```bash
sudo -u qrapp -H bash -c '
  cd /opt/qr-platform
  git clone <repo-url> .
  cp .env.production.example .env.production
  # .env.production icindeki tum REPLACE_WITH_* degerlerini gercek secret degerleriyle doldurun
  chmod 600 .env.production
'
```

## 8) Bağımlılıklar, build, migration

```bash
sudo -u qrapp -H bash -c '
  cd /opt/qr-platform
  pnpm install --frozen-lockfile
  pnpm build
  pnpm exec dotenv -e .env.production -- pnpm db:migrate:deploy
'
```

## 9) PM2 ile başlatma

```bash
sudo -u qrapp -H bash -c '
  cd /opt/qr-platform
  NODE_ENV=production pm2 start ecosystem.config.cjs
  pm2 save
'
```

## 10) PM2'yi sistem başlangıcında otomatik başlatma

```bash
sudo pm2 startup systemd -u qrapp --hp /opt/qr-platform
# Komutun çıktısı olarak verdiği `sudo env PATH=... pm2 startup systemd ...` satırını çalıştırın.
sudo -u qrapp pm2 save
```

## 11) Log rotation (PM2)

```bash
sudo -u qrapp pm2 install pm2-logrotate
sudo -u qrapp pm2 set pm2-logrotate:max_size 20M
sudo -u qrapp pm2 set pm2-logrotate:retain 30
sudo -u qrapp pm2 set pm2-logrotate:compress true
```

## 12) Otomatik yedekleme (cron)

```bash
sudo crontab -u qrapp -e
```

Ekleyin:

```cron
0 3 * * *  /opt/qr-platform/infrastructure/scripts/backup-postgres.sh >> /var/log/qr-platform/backup-postgres.log 2>&1
15 3 * * * /opt/qr-platform/infrastructure/scripts/backup-storage.sh  >> /var/log/qr-platform/backup-storage.log 2>&1
```

Detaylar: [`docs/operations/backup-restore.md`](../operations/backup-restore.md).

## 13) Doğrulama

```bash
curl -f http://127.0.0.1:4000/api/v1/health/ready
curl -f http://127.0.0.1:3000
pm2 status
```

Nginx + SSL kurulduktan sonra dış dünyadan:

```bash
curl -f https://<your-domain>/api/v1/health/ready
```
