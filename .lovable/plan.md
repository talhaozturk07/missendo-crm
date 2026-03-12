

## Sorun Analizi: İstenmeyen Lead'ler Neden Sisteme Düşüyor?

Kod incelemesi sonucunda **3 kritik filtreleme açığı** tespit edildi:

### Kök Nedenler

**1. Webhook'ta `ad_id` null olunca filtreleme atlanıyor (EN KRİTİK)**

Webhook kodunda (satır 97):
```
if (selectedCampaigns.length > 0 && adId) {
```
Eğer gelen lead'in `ad_id` değeri boş/null ise (test lead'leri, organik lead'ler veya Facebook'un bazen ad_id göndermediği durumlar), **kampanya filtresi tamamen devre dışı kalıyor** ve lead direkt kabul ediliyor.

**2. Webhook'ta page_id eşleşmezse TÜM organizasyonlarda deneniyor**

Webhook kodunda (satır 75-76):
```
const matchedOrgs = (orgs || []).filter(o => o.fb_page_id === pageId);
const orgsToTry = matchedOrgs.length > 0 ? matchedOrgs : (orgs || []);
```
Eğer gelen lead'in page_id'si hiçbir org ile eşleşmezse, sistem tüm organizasyonların token'larını deniyor. Bu da başka sayfalardan gelen lead'lerin yanlış organizasyona düşmesine neden olabiliyor.

**3. Webhook'ta `adId` yokken `break` yerine `continue` sorunu**

Filtreleme `break` ile sonlanıyor ama bu sadece mevcut org döngüsünü kırıyor — eğer `adId` null ise zaten filtreleme bloğuna hiç girilmiyor ve lead kabul ediliyor.

---

### Çözüm Planı

**Webhook (`facebook-lead-webhook/index.ts`):**
- `ad_id` null olsa bile kampanya filtresi aktifse, lead'i **reddet** (kabul etme). Eğer ad_id yoksa ve filtre aktifse, form_id üzerinden lead form'unun bağlı olduğu kampanyayı kontrol et veya doğrudan reddet.
- page_id eşleşmezse fallback'i kaldır — eşleşmeyen lead'leri atla, tüm org'larda deneme.
- Filtreleme kontrolünü daha güvenli hale getir: `adId` yoksa ve kampanya filtresi aktifse lead'i kabul etme.

**Polling (`poll-facebook-leads/index.ts`):**
- Polling zaten kampanya bazlı çalışıyor ve page-level polling kampanya filtresi aktifken atlanıyor — bu kısım doğru. Ek bir değişiklik gerekmez.

### Değişiklik Detayları

1. **Webhook: `ad_id` null kontrolü** — Kampanya filtresi aktifken `ad_id` olmayan lead'leri reddet
2. **Webhook: page_id fallback kaldırma** — `matchedOrgs` boşsa lead'i atla, başka org'larda deneme
3. **Detaylı loglama** — Reddedilen lead'ler için neden reddedildiğini logla

