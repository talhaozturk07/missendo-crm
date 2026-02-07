
# Facebook OAuth API Versiyonu Güncelleme Planı

## Sorun Analizi

Graph API Explorer'da `/me/accounts` endpoint'i **Dridora** sayfasını başarıyla döndürüyor, ancak CRM'deki Facebook Connect butonu aynı hesap için "sayfa bulunamadı" hatası veriyor.

**Tespit edilen fark:**
- Graph API Explorer: **v24.0** kullanıyor
- Edge Function: **v19.0** kullanıyor (eski versiyon)

Facebook API v19.0, 2024 sonlarında deprecated oldu ve bazı endpoint davranışları değişmiş olabilir.

## Çözüm

`facebook-oauth` edge function'ındaki tüm Graph API çağrılarının versiyonunu `v19.0`'dan `v21.0`'a güncelleyeceğim.

### Değiştirilecek Dosya

**supabase/functions/facebook-oauth/index.ts**

Aşağıdaki satırlarda `v19.0` → `v21.0` değişikliği yapılacak:

| Satır | Endpoint | Açıklama |
|-------|----------|----------|
| 29 | `/me/permissions` | İzin kontrolü |
| 65 | `/me/accounts` | Sayfa listesi |
| 90 | `/me/businesses` | Business API |
| 122 | `/me` | Kullanıcı bilgisi |
| 223 | `/oauth/access_token` | Token exchange |
| 356 | `/me/adaccounts` | Reklam hesapları |
| 374 | `/campaigns` | Kampanya listesi |
| 414 | `/adsets` | Ad set listesi |
| 497+ | Webhook subscription | Webhook kayıt |

**Toplam:** ~10 API çağrısı güncellenecek

## Teknik Detaylar

```text
API Versiyon Değişikliği:
- Eski: https://graph.facebook.com/v19.0/...
- Yeni: https://graph.facebook.com/v21.0/...

Neden v21.0?
- v24.0 çok yeni, bazı endpoint'ler henüz stabil olmayabilir
- v21.0 Meta'nın önerdiği stabil LTS versiyonu
- 2 yıl boyunca desteklenecek
```

## Test Planı

1. Edge function deploy edilecek
2. CRM Settings'den "Facebook ile Bağlan" tıklanacak
3. OAuth popup açılacak ve izinler verilecek
4. Dridora sayfasının listede görünmesi bekleniyor

## Önemli Not

Eğer API versiyonu güncellemesi sorunu çözmezse, sorun **Development Mode** kısıtlamasından kaynaklanıyor demektir. Bu durumda:
- Meta Developer Console'da App Roles bölümüne hesabın ekli olduğundan emin ol
- Veya App Review tamamlanarak Advanced Access alınmalı
