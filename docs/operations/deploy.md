# Deploy

Önkoşul: sunucu bir kez [`docs/setup/production-ubuntu.md`](../setup/production-ubuntu.md)'ya göre kurulmuş, `/opt/qr-platform`'da çalışıyor ve `.env.production` doldurulmuş olmalı.

## Standart deploy akışı

```bash
sudo -u qrapp -H bash -c '
  set -euo pipefail
  cd /opt/qr-platform

  # 1) Kod
  git fetch origin
  git checkout <tag-veya-commit>

  # 2) Bağımlılıklar (lockfile değiştiyse gerekir, değişmediyse hızlı geçer)
  pnpm install --frozen-lockfile

  # 3) Build (paketler + uygulamalar, Turborepo bağımlılık sırasına göre)
  pnpm build

  # 4) Migration (uygulamalar yeniden başlamadan ÖNCE uygulanır)
  pnpm exec dotenv -e .env.production -- pnpm db:migrate:deploy

  # 5) Graceful reload (kesintisiz, bkz. docs/setup/pm2.md)
  pm2 reload ecosystem.config.cjs --update-env
'
```

## Deploy sonrası doğrulama

```bash
pm2 status
curl -f http://127.0.0.1:4000/api/v1/health/ready
curl -f http://127.0.0.1:3000
pm2 logs --lines 50 --nostream
```

Dışarıdan (Nginx + SSL üzerinden):

```bash
curl -f https://<your-domain>/api/v1/health/ready
```

## Deploy öncesi kontrol listesi

- [ ] Bu commit'te `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` yeşil (CI veya elle).
- [ ] Yeni/değişen bir migration varsa, geri dönüşü olmayan bir işlem içermiyor (ör. veri kaybettiren `DROP COLUMN`) ya da bilinçli olarak kabul edilmiş.
- [ ] `.env.production`'da yeni bir zorunlu değişken varsa sunucuya eklendi (merkezi env doğrulaması eksikse uygulama başlangıçta anlaşılır bir hatayla kapanır — bkz. [`docs/operations/troubleshooting.md`](troubleshooting.md)).
- [ ] Riskli bir migration/deploy öncesi taze bir Postgres backup'ı alındı (bkz. aşağıda).

## Deploy öncesi ekstra güvenlik: anlık backup

Riskli bir migration'dan hemen önce, günlük cron'u beklemeden manuel bir backup almak isterseniz:

```bash
sudo -u qrapp /opt/qr-platform/infrastructure/scripts/backup-postgres.sh
```

## Rollback

Bir deploy sorun çıkarırsa: [`docs/operations/rollback.md`](rollback.md).
