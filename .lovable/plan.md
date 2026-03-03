

## Sorun Özeti

1. **`fb_ad_account_id` hiçbir zaman kaydedilmiyor** — `connect` action'ında sayfa bağlanırken reklam hesabı tespit edilip DB'ye yazılmıyor
2. **`campaigns` action'ı tüm ad account'ları döndürüyor** — sayfa ile ilişkili olanı filtrelemiyor
3. **Ad Performance dashboard tüm hesapların verilerini gösteriyor** — çünkü `fb_ad_account_id` NULL

## Plan

### 1. `facebook-oauth` edge function — `connect` action'ına ad account tespiti ekleme

Sayfa bağlantısı sırasında:
- `me/adaccounts` endpoint'inden kullanıcının tüm ad account'larını çek
- Her ad account için `/{ad_account_id}/campaigns` sorgusu yap ve seçilen sayfanın ID'siyle ilişkili olanı bul (veya `/{page_id}?fields=promotable_ads` ya da page'in `promotion_eligible` ad account'unu kullan)
- Alternatif ve daha basit yol: Bağlantı akışında kullanıcıya **ad account seçtir** (sayfa seçiminden sonra, kampanya seçiminden önce)
- Seçilen `fb_ad_account_id`'yi DB'ye kaydet

### 2. `facebook-oauth` — `campaigns` action'ını filtreleme

- Şu an `me/adaccounts` ile tüm hesapları çekip tümünün kampanyalarını listeliyor
- Bağlantı akışında ad account seçildikten sonra, sadece o hesabın kampanyalarını göster
- Eğer `fb_ad_account_id` zaten DB'de varsa (filter dialog), sadece o hesabı kullan

### 3. Frontend — Ad Account seçim adımı ekleme

`FacebookConnectButton.tsx`'te sayfa seçiminden sonra, kampanya seçiminden önce bir **ad account seçim adımı** ekle:
- `me/adaccounts` sonucunu listele (id + name)
- Kullanıcı birini seçsin
- Seçim sonrası kampanyalar sadece o hesaptan çekilsin
- Eğer sadece 1 ad account varsa otomatik seç

### 4. `fetch-ad-insights` — Mevcut mantık zaten doğru

Bu function zaten `fb_ad_account_id` kullanıyor. Sorun sadece bu alanın NULL olması. Yukarıdaki değişikliklerle otomatik düzelecek.

### Teknik Detaylar

- Yeni Facebook Graph API endpoint: `GET /v21.0/me/adaccounts?fields=id,name,account_id`
- `facebook-oauth` edge function'a yeni action: `adaccounts` (ad account listesi döndürür)
- DB update: `connect` action'ında `fb_ad_account_id` alanını set et
- Frontend: Sayfa → Ad Account → Kampanya → Bağlantı tamamla akışı

