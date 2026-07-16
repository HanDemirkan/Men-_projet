# 0005 - Docker'ın kaldırılması, PM2 + Nginx ile native deployment

## Durum

Kabul edildi.

## Bağlam

Sprint 0'da yerel geliştirme ve production, `docker-compose.yml` + `infrastructure/docker/*.Dockerfile` üzerinden çalışıyordu (Postgres, Redis, MinIO, `api`, `web`, `worker`, Nginx hepsi container). Ürün artık geçici bir prototip değil, doğrudan production'a alınacak ticari bir üründür ve tek bir Ubuntu sunucuya native olarak deploy edilecektir. Docker'ın getirdiği ek soyutlama katmanı (image build süresi, container networking, volume yönetimi) bu ölçekte bir fayda sağlamıyor; buna karşılık native bir kurulum, sistem servisleriyle (systemd, journald, apt tabanlı güvenlik güncellemeleri) doğrudan entegre olur ve tek sunuculuk bir dağıtım için operasyonel olarak daha basittir.

## Karar

- Yerel geliştirme: `pnpm dev` / `pnpm dev:web` / `pnpm dev:api` / `pnpm dev:worker`, native PostgreSQL + Redis-uyumlu bir servise (Windows'ta Memurai, Linux'ta native `redis-server`) karşı çalışır.
- Production: `pnpm build` sonrası her uygulama PM2 (`ecosystem.config.cjs`) altında ayrı bir process olarak çalışır; Nginx (`infrastructure/nginx/`) reverse proxy görevi görür; PostgreSQL ve Redis Ubuntu'da apt paketleri olarak native kurulur.
- Dosya depolama MinIO yerine yerel diske yazan bir `StorageService` soyutlaması (`packages/storage`) ile sağlanır (bkz. [ADR 0006](0006-local-file-storage.md)).
- `docker-compose.yml`, `infrastructure/docker/*.Dockerfile` ve `.dockerignore` kaldırılmıştır.

## Gerekçe

- **Tek sunucu, tek deploy birimi**: Bu ölçekte container orkestrasyonunun (networking, healthcheck, volume) getirdiği karmaşıklık, native process yönetiminden (PM2) daha pahalıya geliyor.
- **Sistem servisleriyle doğrudan entegrasyon**: PostgreSQL/Redis'in Ubuntu'nun kendi apt paketleri, systemd birimleri ve güvenlik güncellemeleriyle yönetilmesi, container image'larını ayrıca güncel tutmaktan daha az operasyonel yük getirir.
- **Geliştirici deneyimi**: Docker Desktop'a bağımlılık kalkar; geliştiriciler yalnızca `pnpm dev` çalıştırır, native servisler arka planda (Windows'ta servis, Linux'ta systemd) sürekli çalışır durumda kalır.
- **Geri dönüş kapısı bırakılmadı**: Docker dosyaları tamamen kaldırıldı (bkz. commit geçmişi); ihtiyaç olursa git history üzerinden geri alınabilir, ama iki paralel deployment modelini (Docker + native) bakımda tutmanın maliyeti bu aşamada gereksiz.

## Sonuçlar

- Yeni bir geliştirici, Docker kurmadan yalnızca native PostgreSQL + Redis-uyumlu bir servis kurarak (bkz. [`docs/setup/local-development.md`](../setup/local-development.md)) projeyi ayağa kaldırabilir.
- Production deploy adımları artık `docs/setup/production-ubuntu.md` ve `docs/operations/deploy.md`'de belgelenir; `docker compose up` yerine `pnpm build` + `pm2 reload` kullanılır.
- CI/CD veya ileride birden fazla sunucuya yatay ölçekleme ihtiyacı doğarsa, bu karar yeniden değerlendirilmelidir (container'lar o noktada tekrar anlamlı hale gelebilir).
