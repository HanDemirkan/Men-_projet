# PM2 Kurulumu ve Kullanımı

## Kurulum (production, global)

```bash
sudo npm install -g pm2
```

Yerel Windows geliştirme makinesinde global kuruluma gerek yoktur; `pnpm exec pm2 ...` kök `package.json`'daki `pm2` devDependency'sini kullanır (bkz. [`docs/setup/local-development.md`](local-development.md)).

## Süreç tanımı

`ecosystem.config.cjs` (repo kökü) üç süreç tanımlar: `qr-platform-api`, `qr-platform-worker`, `qr-platform-web`. Her biri:

- Zaten derlenmiş çıktıyı çalıştırır (`pnpm build` **önce** çalıştırılmış olmalı — PM2 herhangi bir build işlemi yapmaz).
- `.env.${NODE_ENV}` dosyasını (`NODE_ENV` PM2'yi başlatırken shell'den gelir) `ecosystem.config.cjs` içinde `dotenv.parse()` ile okuyup her app'in `env` alanına enjekte eder — PM2'nin kendisinde ecosystem dosyası başına otomatik `.env` yükleme özelliği yoktur, bu yüzden bu adım elle yapılır.
- `max_memory_restart` ile bellek sınırı aşıldığında otomatik yeniden başlar.
- `kill_timeout: 5000` ile durdurulurken uygulamanın kendi graceful shutdown mantığına (API: `app.enableShutdownHooks()`, worker: `registerGracefulShutdown`) 5 saniye tanır, sonra SIGKILL gönderir.

## Başlatma

```bash
# Production
NODE_ENV=production pm2 start ecosystem.config.cjs

# Yerel smoke test (Windows dahil)
NODE_ENV=development pnpm exec pm2 start ecosystem.config.cjs
```

## Günlük operasyon komutları

| Komut                                          | Ne yapar                                                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `pm2 status`                                   | Süreçlerin durumunu listeler                                                                                                  |
| `pm2 logs [isim]`                              | Canlı log akışı                                                                                                               |
| `pm2 reload ecosystem.config.cjs --update-env` | **Graceful restart**: eski süreç kapanmadan yeni süreç ayağa kalkar (mümkün olduğunca kesintisiz), env dosyası yeniden okunur |
| `pm2 restart <isim>`                           | Tek bir süreci yeniden başlatır                                                                                               |
| `pm2 delete all`                               | Tüm süreçleri durdurur ve PM2'nin listesinden çıkarır                                                                         |
| `pm2 save`                                     | Mevcut süreç listesini `pm2 startup` sonrası otomatik başlatma için kaydeder                                                  |

`reload` ile `restart` arasındaki fark önemlidir: **deploy'larda her zaman `reload` kullanın** (bkz. [`docs/operations/deploy.md`](../operations/deploy.md)); `restart` süreci tamamen durdurup yeniden başlatır (kısa bir kesinti olur), `reload` PM2'nin desteklediği ölçüde eski süreci ayakta tutarak yenisini başlatıp trafiği geçirir.

## Sistem başlangıcında otomatik başlatma

```bash
sudo pm2 startup systemd -u qrapp --hp /opt/qr-platform
# Çıktıdaki `sudo env PATH=... pm2 startup systemd ...` komutunu çalıştırın
sudo -u qrapp pm2 save
```

Bundan sonra sunucu yeniden başladığında PM2 ve kayıtlı tüm süreçler otomatik ayağa kalkar.

## Log dosyaları ve rotation

- Konum: repo kökünde `logs/api-{out,error}.log`, `logs/worker-{out,error}.log`, `logs/web-{out,error}.log` (`ecosystem.config.cjs`'de tanımlı, `.gitignore`'da hariç tutulur).
- Rotation, `pm2-logrotate` modülüyle sağlanır:

  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 20M
  pm2 set pm2-logrotate:retain 30
  pm2 set pm2-logrotate:compress true
  ```

## Bellek yeniden başlatma limitleri

| Süreç                | `max_memory_restart` |
| -------------------- | -------------------- |
| `qr-platform-api`    | 300M                 |
| `qr-platform-worker` | 250M                 |
| `qr-platform-web`    | 400M                 |

Bu değerler `ecosystem.config.cjs`'de tanımlıdır; trafik arttıkça `pm2 monit` ile gerçek kullanımı gözlemleyip ayarlayın.
