# 0003 - Modüler Monolit

## Durum

Kabul edildi.

## Bağlam

Platform ileride birçok alan (menü yönetimi, sipariş, kasa, mutfak, raporlama, süper admin) içerecek. Bu alanları baştan ayrı mikroservisler olarak kurmak, Sprint 0-1 ölçeğinde gereksiz operasyonel karmaşıklık (servisler arası ağ iletişimi, dağıtık transaction, ayrı deploy pipeline'ları) getirir.

## Karar

Backend, tek bir NestJS uygulaması (`apps/api`) olarak, **modüler monolit** şeklinde kurulur:

- Her iş alanı kendi NestJS modülü olarak yaşar (`src/modules/<alan>`), net bir sorumluluğa sahiptir.
- Modüller birbirinin iç dosyalarını import etmez; paylaşım gerekiyorsa `packages/*` üzerinden yapılır.
- Controller'lar ince tutulur: iş mantığı içermez, doğrudan Prisma sorgusu çalıştırmaz. İş mantığı servis katmanında, veri erişimi Prisma (tek client) üzerinden yapılır.
- Henüz ihtiyaç olmayan repository pattern, event bus veya ayrı domain katmanı eklenmez (YAGNI).

## Gerekçe

- **Erken mikroservis riski**: İş alanları arasındaki sınırlar henüz netleşmemişken servisleri fiziksel olarak ayırmak, yanlış sınırların kalıcılaşmasına ve pahalı yeniden yapılandırmalara yol açar.
- **Tek deploy birimi**: Sprint 0-1'in operasyonel yükünü (tek Docker image, tek health check, tek log akışı) düşük tutar.
- **Modülerlik korunur**: Net modül sınırları ve "controller'da iş mantığı yok" kuralı sayesinde, ileride belirli bir modülün ayrı bir servise çıkarılması gerekirse (örn. ödeme/kasa modülü), bu işlem koddaki bağımlılıkları çözmek yerine yalnızca modülü taşımak kadar basit olur.
- **Gereksiz soyutlama eklenmez**: Repository pattern veya event bus gibi yapılar, henüz birden fazla veri kaynağı veya asenkron olay akışı olmadığı için bu sprintte fayda sağlamaz; sadece kod okunabilirliğini ve geliştirme hızını düşürür.

## Sonuçlar

- Yeni bir iş alanı eklenirken `src/modules/<alan>` altına yeni bir Nest modülü açılır; `app.module.ts`'e eklenir.
- Bir modülün ayrı bir servise ayrılması gerektiğinde, modülün dış bağımlılıkları (yalnızca `packages/*` ve kendi Prisma modelleri) net olduğu için ayrıştırma maliyeti düşük olur.
