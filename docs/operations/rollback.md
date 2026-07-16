# Rollback

## Yalnızca kod değişti, migration yok

En basit durum. Bir önceki çalışan commit'e/tag'e dönün ve yeniden deploy edin:

```bash
sudo -u qrapp -H bash -c '
  set -euo pipefail
  cd /opt/qr-platform
  git checkout <onceki-calisan-tag-veya-commit>
  pnpm install --frozen-lockfile
  pnpm build
  pm2 reload ecosystem.config.cjs --update-env
'
```

## Migration da içeren bir deploy'un geri alınması

Prisma'nın otomatik/native bir "migration rollback" komutu yoktur (`migrate deploy` yalnızca ileri gider). İki seçenek:

### Seçenek A - Geriye dönük uyumlu ise: yeni bir "düzeltme" migration'ı yazın (tercih edilen)

Şema değişikliği geriye dönük uyumluysa (ör. yeni bir nullable kolon eklendi, henüz hiçbir kod okumuyor), kodu eski sürüme döndürmek genelde yeterlidir — yeni kolon kullanılmadığı sürece zararsızdır. Şema değişikliğini de geri almak isterseniz, "forward-only" prensibiyle bunu geri alan **yeni bir migration** yazıp deploy edin (`prisma migrate dev` ile yerelde oluşturup commit edin), var olan migration dosyalarını asla elle silmeyin/değiştirmeyin.

### Seçenek B - Geriye dönük uyumlu değilse: backup'tan restore

Migration veri kaybettiren veya kodun eski sürümüyle uyumsuz bir değişiklikse (ör. bir kolon silindi, kodun eski sürümü hâlâ o kolonu bekliyor):

1. Uygulamaları durdurun (kısa bir kesinti kaçınılmaz): `pm2 stop all`
2. En son taze backup'ı restore edin: [`docs/operations/backup-restore.md`](backup-restore.md)
3. Kodu önceki sürüme döndürün (yukarıdaki "yalnızca kod değişti" adımları).
4. `pm2 start ecosystem.config.cjs`

Bu senaryonun önüne geçmenin en iyi yolu, riskli migration'ları veri kaybettirmeyecek şekilde iki adıma bölmektir (ör. bir kolonu silmeden önce önce kodun onu kullanmayı bırakmasını deploy edin, kolonu ayrı bir sonraki deploy'da silin).

## Rollback sonrası doğrulama

Deploy dokümanındaki ["Deploy sonrası doğrulama"](deploy.md#deploy-sonrası-doğrulama) adımlarının aynısını uygulayın.
