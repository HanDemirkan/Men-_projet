# LAN Erişimi ve Telefondan QR Testi (Windows)

Bu doküman, geliştirme makinesindeki `pnpm dev`'e aynı Wi-Fi'daki bir telefondan erişmeyi ve gerçek bir QR kodunu telefondan okutarak storefront'u açmayı anlatır. Genel yerel kurulum için [`docs/setup/local-development.md`](local-development.md).

## 1. Makinenin güncel LAN IP'sini bul

LAN IP'niz DHCP ile atanır ve ağ değiştikçe (ör. farklı bir Wi-Fi'ya bağlanınca) değişebilir - aşağıdaki adımları her yeni ağda tekrarlayın.

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object IPAddress, InterfaceAlias
```

Telefonunuzun bağlı olduğu ağla **aynı** adaptörün (genellikle Wi-Fi) IP'sini not edin - örnekte `10.42.115.115`.

## 2. `.env.development`'ı güncelle

```env
NEXT_PUBLIC_API_URL=http://<LAN-IP>:4000/api/v1
PUBLIC_APP_URL=http://<LAN-IP>:3001
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://<LAN-IP>:3001
```

`API_SERVER_URL` ve `WEB_APP_URL`'i **değiştirmeyin** - bunlar sunucu tarafı (aynı makine) istekleri için kasıtlı olarak `localhost` üzerinde kalır, daha hızlı ve Wi-Fi'nin anlık kesilmesinden etkilenmez.

`pnpm dev`'i yeniden başlatın (env değişiklikleri yalnızca süreç başlangıcında okunur).

## 3. Windows Firewall - 3001 ve 4000 portlarını aç

Varsayılan olarak Windows Firewall, gelen LAN bağlantılarını Node.js için soracaktır; ilk açılışta "İzin Ver" (Private network) seçin. Kalıcı/açık bir kural için:

```powershell
New-NetFirewallRule -DisplayName "QR Platform Web (dev)" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -Profile Private
New-NetFirewallRule -DisplayName "QR Platform API (dev)" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow -Profile Private
```

`-Profile Private` ile sınırlı tutulur - herkese açık/güvensiz ağlarda bu portlar dışarıya kapalı kalır.

## 4. Doğrulama

### PC üzerinden

```powershell
curl http://localhost:3001
curl http://localhost:4000/api/v1/health/live
curl http://<LAN-IP>:3001
curl http://<LAN-IP>:4000/api/v1/health/live
```

Hepsi 200 dönmelidir. LAN IP üzerinden dönmüyorsa önce 3. adımdaki firewall kuralını, sonra makinenin ve telefonun **aynı** ağda (aynı SSID, misafir ağı değil) olduğunu kontrol edin.

### Telefondan

1. Telefonu PC ile aynı Wi-Fi'ya bağlayın.
2. Tarayıcıda `http://<LAN-IP>:3001` açın - login sayfası gelmelidir.
3. İşletme panelinde QR Builder'dan bir QR indirin (veya mevcut bir tenant'ın QR'ını kullanın) ve telefonun kamerasıyla okutun.
4. Açılan URL'nin `http://<LAN-IP>:3001/<tenant-slug>?src=qr` biçiminde olduğunu, `localhost` içermediğini doğrulayın.
5. Storefront'un ürün görselleriyle birlikte tam olarak yüklendiğini doğrulayın (görseller de API'den, `NEXT_PUBLIC_API_URL` üzerinden çekilir).

Bu adım atlanarak sprint tamamlanmış sayılmaz - kod tarafında doğru URL üretildiğini kanıtlamak yeterli değildir, gerçek bir telefonun gerçek ağ/firewall koşullarında erişebildiği doğrulanmalıdır.

## Sorun giderme

| Belirti | Olası neden |
|---|---|
| Telefon `<LAN-IP>:3001`'e hiç bağlanamıyor | Firewall kuralı yok/yanlış profil, ya da telefon farklı bir ağda (misafir Wi-Fi izole edilmiş olabilir) |
| Sayfa açılıyor ama API istekleri başarısız (CORS hatası) | `CORS_ALLOWED_ORIGINS`'e LAN origin'i eklenmemiş, veya `pnpm dev` env değişikliğinden sonra yeniden başlatılmamış |
| QR decode edilince `localhost` içeren bir URL çıkıyor | `PUBLIC_APP_URL` ayarlanmamış/API yeniden başlatılmamış - `QrService` her zaman `PUBLIC_APP_URL`'i kullanır, `WEB_APP_URL`'i değil |
| Görseller yüklenmiyor ama sayfa açılıyor | `NEXT_PUBLIC_API_URL` hâlâ `localhost` - tarayıcı bundle'ına derleme anında gömülür, sunucu tarafı `API_SERVER_URL`'den farklıdır |
