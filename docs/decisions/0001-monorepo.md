# 0001 - Monorepo (pnpm workspace + Turborepo)

## Durum

Kabul edildi.

## Bağlam

Platform; bir web uygulaması, bir REST API ve bir worker sürecinden, bunların paylaştığı birden fazla ortak paketten (veritabanı erişimi, doğrulama şemaları, tipler, UI bileşenleri, izin sabitleri, ortak yapılandırma) oluşuyor. Bu bileşenler birbirinden bağımsız deploy edilebilir olsa da, geliştirme sırasında sık sık birlikte değişecekler ve tip güvenliğini uygulama sınırları arasında korumaları gerekiyor.

## Karar

Tek bir repository içinde, pnpm workspace ile paket yönetimi ve Turborepo ile görev orkestrasyonu (`build`, `lint`, `typecheck`, `test`) kullanılacak.

- `apps/*`: bağımsız çalıştırılabilir uygulamalar (web, api, worker).
- `packages/*`: uygulamalar arasında paylaşılan kod.
- Paketler arası bağımlılıklar `workspace:*` protokolü ile tanımlanır; bu sayede sürüm senkronizasyon sorunu yaşanmaz.
- Turborepo, bir görevi çalıştırmadan önce bağımlı paketlerin ilgili görevlerinin (`dependsOn: ["^build"]`) tamamlanmasını garanti eder.

## Gerekçe

- **Tip güvenliği sınır ötesi korunur**: `apps/api` ve `apps/web`, `packages/shared` içindeki aynı TypeScript tiplerini kullanır; API sözleşmesi değiştiğinde derleme zamanında fark edilir.
- **Tek PR ile uçtan uca değişiklik**: Bir özellik hem backend hem frontend hem de ortak paket değişikliği gerektirdiğinde, tek bir commit/PR ile atomik olarak yapılabilir.
- **Turborepo önbellekleme**: Değişmeyen paketler için build/test/lint tekrar çalıştırılmaz, CI ve yerel geliştirme hızlanır.
- **Alternatif olan çoklu repository** (her uygulama/paket ayrı repo), Sprint 0'ın küçük ölçeği için gereksiz operasyonel yük (versiyonlama, yayınlama, senkronizasyon) getirirdi.

## Sonuçlar

- Yeni bir paket eklemek `packages/` altına klasör açmak ve `pnpm-workspace.yaml` kapsamına otomatik dahil olmasını sağlamak kadar basittir.
- CI/CD pipeline'ı (ileride) Turborepo'nun `--filter` mekanizmasıyla yalnızca değişen paketleri build/test edebilir.
- Uygulamalar başka uygulamaların iç dosyalarını import edemez; paylaşım yalnızca `packages/*` üzerinden olur (bkz. `docs/architecture/overview.md`).
