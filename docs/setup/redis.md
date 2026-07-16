# Redis Kurulumu

Redis, Sprint 0'da yalnızca `/health` uç noktaları tarafından kullanılıyor, ama opsiyonel değildir: uygulama önbellek/kuyruk/oturum deposu olarak Redis'e bağımlı olacak şekilde tasarlanmıştır (bkz. [`docs/architecture/overview.md`](../architecture/overview.md)) ve API/worker, Redis erişilemez olduğunda çökmek yerine "degraded" durumuna geçecek şekilde kodlanmıştır (bkz. `apps/api/src/modules/health/health.module.ts`, `apps/worker/src/index.ts`).

## Ubuntu (production)

```bash
sudo apt update
sudo apt install -y redis-server
```

`/etc/redis/redis.conf` içinde şu ayarları yapın:

```conf
bind 127.0.0.1 -::1
protected-mode yes
requirepass REPLACE_WITH_STRONG_SECRET
```

- `bind 127.0.0.1`: Redis yalnızca aynı sunucudan erişilebilir olmalı, **asla** herkese açık bir IP'ye bind edilmemeli.
- `requirepass`: `.env.production`'daki `REDIS_URL`'in parola kısmıyla birebir eşleşmeli (`redis://:REPLACE_WITH_STRONG_SECRET@127.0.0.1:6379`).

```bash
sudo systemctl enable --now redis-server
sudo systemctl restart redis-server   # requirepass değişikliğinden sonra
redis-cli -a 'REPLACE_WITH_STRONG_SECRET' ping   # PONG dönmeli
```

İsteğe bağlı sertleştirme: tehlikeli komutları devre dışı bırakmak isterseniz `rename-command FLUSHALL ""` gibi satırlar ekleyebilirsiniz; bu proje bu komutları kullanmıyor, dolayısıyla zorunlu değildir.

## Windows (yerel geliştirme) — Memurai

Redis resmi olarak Windows'u desteklemez. Bu proje yerel geliştirme için **Memurai**'yi (Redis-uyumlu, native Windows servisi) önerir:

1. https://www.memurai.com/get-memurai adresinden Memurai Developer (ücretsiz) sürümünü indirin.
2. Installer'ı çalıştırın; Memurai bir Windows servisi olarak kurulur ve arka planda sürekli çalışır (PostgreSQL servisi gibi, ayrıca başlatmanız gerekmez).
3. Doğrulama:

   ```powershell
   Get-Service Memurai
   ```

4. `.env.development` içindeki varsayılan `REDIS_URL=redis://localhost:6379` değeri (parolasız) değişiklik gerektirmez.

Alternatif olarak WSL2 içine native `redis-server` kurup `localhost:6379` üzerinden erişebilirsiniz; WSL2 zaten kullanıyorsanız bu da geçerli bir seçenektir.

## Bağlantı dayanıklılığı

API ve worker'daki Redis client'ları `retryStrategy` (kademeli backoff, max 5sn) ve `reconnectOnError` ile yapılandırılmıştır; Redis geçici olarak erişilemez olduğunda:

- Process **çökmez**.
- `/api/v1/health` ve `/api/v1/health/ready` `"degraded"`/503 döner, `/api/v1/health/live` 200 dönmeye devam eder (PM2/orkestratör process'i öldürmez).
- Redis geri geldiğinde client otomatik olarak yeniden bağlanır.
