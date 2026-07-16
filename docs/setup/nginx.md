# Nginx Kurulumu

## Kurulum (Ubuntu)

```bash
sudo apt update
sudo apt install -y nginx
```

## Devreye alma (HTTP, SSL öncesi)

```bash
sudo cp /opt/qr-platform/infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

`infrastructure/nginx/nginx.conf`, `api` (`127.0.0.1:4000`) ve `web`'i (`127.0.0.1:3000`) proxy'ler; bu portlarda PM2'nin (bkz. [`docs/setup/pm2.md`](pm2.md)) süreçleri zaten çalışıyor olmalıdır. Bu adımdan sonra `curl http://<sunucu-ip>/api/v1/health` çalışmalıdır.

Bu aşamada dahil olanlar:

- `X-Forwarded-*` header'ları (gerçek istemci IP'si/protokolü API'ye ulaşır)
- Güvenlik header'ları (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`)
- `server_tokens off` (nginx sürümü gizlenir)
- gzip (tüm metin tabanlı response tipleri için)
- `client_max_body_size 20m` (ileride dosya yükleme için)
- `/uploads/` location'ı (henüz aktif değil — upload endpoint'i eklendiğinde `STORAGE_DIR/public` dolmaya başlar)

## Brotli (opsiyonel)

Ubuntu'nun nginx paketleri Brotli'yi built-in içermez; ayrı bir modül paketiyle eklenir:

```bash
sudo apt install -y libnginx-mod-http-brotli
```

Kurulumdan sonra `nginx.conf`'taki yorumlanmış `brotli` satırlarını açın ve `sudo nginx -t && sudo systemctl reload nginx` çalıştırın. Gzip zaten aktif olduğu için bu adım zorunlu değil, yalnızca ek bir sıkıştırma kazancı sağlar.

## SSL (Let's Encrypt / certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <your-domain>
```

certbot, `infrastructure/nginx/qr-platform.ssl.conf.example` dosyasındaki server bloklarına benzer bir yapılandırmayı otomatik oluşturur/günceller (o dosya, certbot'un üreteceği son hale referans olması için elle yazılmış bir örnektir — certbot'un ürettiği gerçek dosyayı kullanın). Detaylar dosyanın başındaki yorumda.

Yenileme certbot tarafından otomatik bir systemd timer ile yapılır; doğrulamak için:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

## Log konumları

- Access log: `/var/log/nginx/access.log`
- Error log: `/var/log/nginx/error.log`

Ubuntu'nun nginx paketi `/etc/logrotate.d/nginx` ile bu dosyaları otomatik günlük olarak rotate eder (varsayılan olarak etkin, ek yapılandırma gerekmez).
