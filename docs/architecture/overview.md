# Mimari Genel Bakış

Bu doküman Sprint 0 sonundaki sistem mimarisini açıklar. Ürün özellikleri değil, teknik temel konu alınır.

## Sistem bileşenleri

| Bileşen             | Sorumluluk                                             | Teknoloji                                                     |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `apps/web`          | Kullanıcıya gösterilen web arayüzü                     | Next.js (App Router), TypeScript, Tailwind CSS                |
| `apps/api`          | REST API, iş mantığı, veri erişimi                     | NestJS, TypeScript, Prisma                                    |
| `apps/worker`       | Arka plan işleri (ileride) için ayrı süreç             | Node.js, TypeScript                                           |
| PostgreSQL          | Kalıcı veri deposu                                     | PostgreSQL 16 (native kurulum)                                |
| Redis               | Önbellek, ileride kuyruk/oturum deposu                 | Redis 7-uyumlu (native; Windows'ta Memurai)                   |
| Yerel disk depolama | Dosya depolama (ileride ürün görselleri vb.)           | `packages/storage` (`StorageService` + `LocalStorageAdapter`) |
| Nginx               | Tek giriş noktası, reverse proxy (yalnızca production) | Nginx                                                         |
| PM2                 | Production süreç yöneticisi                            | PM2 (`ecosystem.config.cjs`)                                  |

`web`, `api` ve `worker` birbirinden bağımsız süreçlerdir; aralarında doğrudan kod bağımlılığı yoktur. Ortak kod yalnızca `packages/*` üzerinden paylaşılır.

Tüm bileşenler native (Docker'sız) çalışır; bkz. [ADR 0005](../decisions/0005-remove-docker-native-deployment.md) ve [ADR 0006](../decisions/0006-local-file-storage.md).

## Monorepo yapısı

```text
qr-platform/
├── apps/
│   ├── web/         # Next.js web uygulaması
│   ├── api/          # NestJS REST API
│   └── worker/        # Arka plan işlem süreci
├── packages/
│   ├── database/       # Prisma şeması ve tek PrismaClient
│   ├── validation/      # Ortak Zod şemaları (env, pagination, id)
│   ├── shared/           # Ortak TypeScript tipleri ve sabitler
│   ├── permissions/        # Rol sabitleri
│   ├── storage/              # StorageService soyutlaması + LocalStorageAdapter
│   ├── ui/                     # Ortak React bileşenleri
│   └── config/                   # TypeScript/ESLint/Prettier temel yapılandırmaları
├── infrastructure/
│   ├── nginx/            # Reverse proxy yapılandırması (yalnızca production)
│   └── scripts/            # Backup/restore ve operasyon yardımcı betikleri
├── ecosystem.config.cjs        # PM2 süreç tanımları (production)
├── docs/                     # Mimari dokümantasyon ve karar kayıtları
└── tests/                     # Playwright uçtan uca testleri
```

Yönetim, pnpm workspace + Turborepo ile sağlanır. Turborepo, paket bağımlılık grafiğine göre görevleri (`build`, `lint`, `typecheck`, `test`) doğru sırada çalıştırır: bir uygulama derlenmeden/test edilmeden önce bağımlı olduğu paketler derlenir.

## `web`, `api` ve `worker` sorumlulukları

- **`apps/web`**: Kullanıcı arayüzünü render eder. Sprint 0'da yalnızca sistem durum ekranı vardır. API'ye tarayıcı üzerinden HTTP isteği atar; API'nin kapalı olması web uygulamasının çökmesine yol açmaz.
- **`apps/api`**: Tüm iş mantığının ve veri erişiminin yaşayacağı REST API. Controller'lar ince tutulur; iş mantığı servis katmanında, veri erişimi Prisma üzerinden yapılır. Sprint 0'da yalnızca health uç noktaları vardır (`/api/v1/health`, `/health/live`, `/health/ready`).
- **`apps/worker`**: Kuyruk/zamanlanmış iş gerektiren işler (görsel işleme, e-posta, rapor, temizlik, bildirim) için ayrılmış, API'den bağımsız çalışan süreç. Sprint 0'da herhangi bir iş kuyruğu yoktur; yalnızca bağlantı sağlığı doğrulanır.

## Ortak paketlerin sorumlulukları

- **`packages/database`**: Tek `PrismaClient` örneğini dışa aktarır. `api` ve `worker` veritabanına yalnızca bu paket üzerinden erişir; hiçbir uygulama kendi `PrismaClient`'ını oluşturmaz.
- **`packages/validation`**: Ortam değişkeni şeması gibi paylaşılan Zod şemalarının tek kaynağı. Uygulamalar ihtiyaç duydukları alt kümeyi `.pick()` ile türetir.
- **`packages/shared`**: API cevap tipleri, health tipleri ve uygulama/ortam sabitleri gibi gerçekten ortak olan TypeScript tipleri.
- **`packages/permissions`**: İleride kullanılacak rol sabitleri. Sprint 0'da yetkilendirme mantığı yoktur.
- **`packages/storage`**: Framework'ten bağımsız `StorageService` arayüzü ve `LocalStorageAdapter` implementasyonu (bkz. [ADR 0006](../decisions/0006-local-file-storage.md)). `apps/api`'de bir DI provider'ı olarak sağlanır; henüz hiçbir upload endpoint'i bunu kullanmıyor.
- **`packages/ui`**: `web` uygulamasının kullandığı, marka sistemi içermeyen temel React bileşenleri (Button, Card, StatusBadge).
- **`packages/config`**: TypeScript, ESLint ve Prettier için tek doğruluk kaynağı olan temel yapılandırmalar.

## Modüler monolit yaklaşımı

Sprint 0 kararı gereği sistem başlangıçta **modüler monolit** olarak kurulur:

- `api` tek bir NestJS uygulamasıdır; ancak içindeki her modül (`modules/health` gibi) net bir sorumluluğa sahiptir ve birbirine sıkı bağlı değildir.
- Modüller arası paylaşım gerektiğinde ortak kod `packages/*`'a taşınır; modüller birbirinin iç dosyalarını import etmez.
- Bu yapı, ileride belirli modüllerin ayrı servislere bölünmesini (gerekirse) zorlaştırmayacak şekilde kurulmuştur: iş mantığı controller'da değil servislerde yaşar, veri erişimi tek noktadan (Prisma) yapılır, modüller arası doğrudan çağrı yerine net arayüzler kullanılır.

## İleride eklenecek multi-tenant mimari

Sprint 0'da herhangi bir tenant (işletme) tablosu veya tenant filtreleme mantığı **yoktur**. Sprint 1'de uygulanacak yaklaşım [`docs/decisions/0004-shared-database-multi-tenancy.md`](../decisions/0004-shared-database-multi-tenancy.md) dokümanında detaylandırılmıştır. Özetle: tek PostgreSQL veritabanı, tenant'a ait tablolarda `tenant_id` kolonu, backend tarafından zorunlu tenant filtreleme.

## İşletme verilerinin izolasyon prensibi

Her işletmenin (tenant) verisi kesinlikle birbirinden ayrılacaktır. Bu izolasyon:

- Veritabanı şeması seviyesinde (`tenant_id` kolonu ve zorunlu filtreleme),
- Uygulama kodu seviyesinde (her sorgu tenant bağlamına göre daraltılır),
- Gerekirse PostgreSQL Row Level Security ile

sağlanacaktır. Sprint 0'da bu mekanizmalar henüz kurulmamıştır; ancak kod tabanı (tek Prisma client, ince controller'lar, net modül sınırları) bu mekanizmanın Sprint 1'de eklenmesini engellemeyecek şekilde tasarlanmıştır.

## Tenant bilgisinin güvenilirlik ilkesi

**Tenant bilgisi hiçbir zaman frontend'den (request body, query string, header gibi istemci tarafından belirlenebilecek herhangi bir alandan) güvenilir kabul edilmeyecektir.** Tenant bağlamı, backend tarafında kimlik doğrulama sonrası sunucu taraflı oturum/token bilgisinden türetilecektir. Bu prensip Sprint 1'deki multi-tenant altyapının temel güvenlik varsayımıdır.

## Yetki kontrolü ilkesi

Yetki (rol/izin) kontrolü yalnızca backend'de yapılır. Frontend'deki herhangi bir gösterim/gizleme mantığı bir güvenlik sınırı değildir; yalnızca kullanıcı deneyimini iyileştirir. `packages/permissions` içindeki rol sabitleri Sprint 0'da tanımlanmış olsa da, gerçek yetki denetimi (guard, middleware) Sprint 0 kapsamı dışındadır ve backend tarafında ilerleyen sprintlerde uygulanacaktır.
