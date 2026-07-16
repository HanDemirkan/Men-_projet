# Backup / Restore

Production'da yedeklenmesi gereken iki bağımsız veri kaynağı vardır: **PostgreSQL** (yapısal veri) ve **STORAGE_DIR** (yüklenen dosyalar, `packages/storage`). Bunlar ayrı script'lerle, ayrı zamanlarda yedeklenir ve birbirinden bağımsız restore edilebilir.

## PostgreSQL

### Yedekleme

```bash
./infrastructure/scripts/backup-postgres.sh
```

- `.env.production`'ı okur, `pg_dump --format=custom` ile yedek alır.
- Varsayılan hedef: `/var/backups/qr-platform/postgres/qr_platform_<timestamp>.dump` (`BACKUP_DIR` ile değiştirilebilir).
- Varsayılan retention: 14 gün (`RETENTION_DAYS` ile değiştirilebilir); daha eski yedekler otomatik silinir.

### Cron ile günlük otomatik yedekleme

```bash
sudo crontab -u qrapp -e
```

```cron
0 3 * * * /opt/qr-platform/infrastructure/scripts/backup-postgres.sh >> /var/log/qr-platform/backup-postgres.log 2>&1
```

### Restore

**Dikkat: yıkıcı işlemdir**, hedef veritabanındaki mevcut nesneleri `--clean --if-exists` ile siler ve yedekten yeniden oluşturur.

```bash
./infrastructure/scripts/restore-postgres.sh /var/backups/qr-platform/postgres/qr_platform_20260101_030000.dump --yes
```

Restore sonrası, yedek alındıktan sonra deploy edilmiş bir migration varsa uygulayın:

```bash
pnpm exec dotenv -e .env.production -- pnpm db:migrate:deploy
```

## Storage (STORAGE_DIR)

PostgreSQL yedeği, `STORAGE_DIR`'e yazılan dosyaları **içermez** — ayrıca yedeklenmesi gerekir.

### Yedekleme

```bash
./infrastructure/scripts/backup-storage.sh
```

- `.env.production`'daki `STORAGE_DIR`'i `tar.gz` olarak arşivler.
- Varsayılan hedef: `/var/backups/qr-platform/storage/storage_<timestamp>.tar.gz` (`BACKUP_DIR` ile değiştirilebilir).
- Varsayılan retention: 14 gün (`RETENTION_DAYS` ile değiştirilebilir).

### Cron

```cron
15 3 * * * /opt/qr-platform/infrastructure/scripts/backup-storage.sh >> /var/log/qr-platform/backup-storage.log 2>&1
```

(Postgres yedeğiyle çakışmaması için 15 dakika kaydırılmıştır.)

### Restore

**Dikkat: yıkıcı işlemdir**, `STORAGE_DIR`'in mevcut içeriğinin üzerine yazar.

```bash
./infrastructure/scripts/restore-storage.sh /var/backups/qr-platform/storage/storage_20260101_031500.tar.gz --yes
```

## Yedeklerin sunucu dışına taşınması

Bu script'ler yedekleri yalnızca **aynı sunucuda** `/var/backups/qr-platform/` altına yazar. Sunucunun kendisi kaybedilirse bu yedekler de kaybedilir. Production için `BACKUP_DIR`'i düzenli olarak sunucu dışına (ör. `rsync`/`rclone` ile başka bir makineye veya bir nesne depolama servisine) kopyalayan ayrı bir cron görevi eklemeniz önerilir; bu proje kapsamında (henüz bir bulut sağlayıcı seçilmediği için) bu adım kasıtlı olarak elle/operasyonel bir karar olarak bırakılmıştır.

## Restore sonrası doğrulama

```bash
curl -f http://127.0.0.1:4000/api/v1/health/ready
```

`/health/ready` `"healthy"` dönene kadar (database ve redis `"up"`) restore'un tamamlandığından emin olmayın.
