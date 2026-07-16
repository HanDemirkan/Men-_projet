# 0006 - Yerel disk depolama (StorageService + LocalStorageAdapter)

## Durum

Kabul edildi.

## Bağlam

Sprint 0'da MinIO, ileride eklenecek bir dosya yükleme özelliği (ürün görselleri vb.) için Docker Compose'daki S3-uyumlu nesne deposuydu. [ADR 0005](0005-remove-docker-native-deployment.md) ile Docker kaldırıldığından, MinIO'nun da native bir karşılığı gerekiyordu. Tek sunuculu bir production ortamında ayrıca bir nesne depolama servisi (MinIO'yu native kurup işletmek, ya da bir bulut S3 sağlayıcısına bağımlı olmak) bu aşamada gereksiz bir operasyonel yük ve maliyet getiriyor.

## Karar

- `packages/storage`, framework'ten bağımsız bir `StorageService` arayüzü ve bunun tek implementasyonu olan `LocalStorageAdapter`'ı dışa aktarır.
- `LocalStorageAdapter`, dosyaları `STORAGE_DIR` ortam değişkeninin gösterdiği, **uygulama/repo dizininin dışındaki** bir mutlak yola yazar (production'da ör. `/var/lib/qr-platform/storage`), böylece bir deploy/`pnpm build` bu dosyaları silmez.
- Dosya boyutu ve MIME tipi doğrulaması (`validateUpload`), `STORAGE_MAX_FILE_SIZE_MB` / `STORAGE_ALLOWED_MIME_TYPES` ortam değişkenlerine dayalı olarak, yükleme endpoint'inden bağımsız bir yardımcı fonksiyon olarak yaşar.
- `apps/api`'de `StorageModule`, `StorageService`'i DI üzerinden sağlar ama **herhangi bir controller/upload endpoint'i eklemez** — bu, ileride gerçek bir yükleme özelliği geldiğinde yapılacak.
- Nginx, ileride `STORAGE_DIR/public` altındaki statik dosyaları doğrudan (Node process'ini meşgul etmeden) sunmak üzere `/uploads/` location'ı ile önceden yapılandırılmıştır (bkz. `infrastructure/nginx/nginx.conf`).

## Gerekçe

- **Operasyonel sadelik**: Tek sunuculu bir dağıtımda yerel disk, ayrı bir servis (MinIO) işletmekten daha az hareketli parça demektir.
- **Değiştirilebilirlik**: `StorageService` arayüzü sayesinde, trafik/ölçek gerçekten bir bulut nesne deposunu (S3, vb.) gerektirdiğinde, yalnızca yeni bir adapter yazılır; çağıran kod değişmez.
- **Erken soyutlama riski yok**: Henüz tek bir adapter (`LocalStorageAdapter`) var; ikinci bir implementasyon (S3 vb.) yalnızca gerçekten ihtiyaç doğduğunda yazılacak (YAGNI).
- **Güvenlik**: Doğrulama (boyut/MIME tipi allow-list, path traversal koruması) adapter seviyesinde merkezi olduğundan, ileride eklenecek her yükleme endpoint'i bunu yeniden icat etmek zorunda kalmaz.

## Sonuçlar

- Bir sonraki sprintte bir upload endpoint'i eklenirken, yalnızca `STORAGE_SERVICE` token'ı inject edilip `save()`/`delete()` çağrılır; depolama detayları (dizin yapısı, doğrulama) zaten çözülmüştür.
- `STORAGE_DIR`'in production'da yedeklenmesi gerekir (bkz. `infrastructure/scripts/backup-storage.sh` ve [`docs/operations/backup-restore.md`](../operations/backup-restore.md)); PostgreSQL'in aksine bu veriler veritabanı yedeğine dahil değildir.
- MinIO'ya dönülmesi gerekirse (ör. çoklu sunucuya ölçekleme), yalnızca yeni bir `StorageService` implementasyonu yazılır; `packages/storage`'ın tükettiği arayüz değişmez.
