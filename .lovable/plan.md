

## Sorun: Test Lead'leri Neden Gelmiyor?

Ekran görüntüsünden görüldüğü gibi, Facebook Testing Tool'dan gelen test lead'lerinde `ad_id: null` ve `adgroup_id: null` geliyor. Bu durum, geçen hafta eklediğimiz güvenlik filtresine takılıyor:

**Webhook (satır 101-107):** Kampanya filtresi aktifken `ad_id` null olan lead'ler reddediliyor.

**Polling (satır 292/337-339):** Kampanya filtresi aktifken page-level polling tamamen atlanıyor.

Her iki yol da test lead'lerini engelliyor.

### Neden ad_id null olan lead'ler güvenle kabul edilebilir?

Gerçek reklamlardan gelen lead'lerin **her zaman** bir `ad_id`'si olur. `ad_id: null` olan lead'ler yalnızca Facebook Testing Tool'dan veya organik formlardan gelir. Bunlar spam/istenmeyen lead değildir.

### Çözüm

**1. Webhook (`facebook-lead-webhook/index.ts`):**
- `ad_id` null olduğunda lead'i reddetmek yerine, "test/organic lead" olarak kabul et
- Log mesajını güncelle: `"Test lead ACCEPTED (no ad_id)"`

**2. Polling (`poll-facebook-leads/index.ts`):**
- Kampanya filtresi aktifken page-level polling'i tamamen atlamak yerine, page-level poll yap ama sadece `ad_id`'si olmayan lead'leri kabul et (test lead'leri)
- `ad_id`'si olan lead'ler zaten kampanya bazlı polling ile yakalanıyor

### Değişiklik Detayları

**Webhook - satır 101-107 arası:**
```
// Eski: ad_id null → REJECT
// Yeni: ad_id null → ACCEPT (test/organic lead)
if (selectedCampaigns.length > 0) {
  if (!adId) {
    console.log(`Test/organic lead ACCEPTED for org ${org.id} (no ad_id, leadgen_id=${leadgenId})`);
    // Filtrelemeyi atla, lead'i kabul et
  } else {
    // Mevcut kampanya doğrulama mantığı aynen kalır
  }
}
```

**Polling - satır 292-339 arası:**
```
// Eski: kampanya filtresi varsa page-level polling ATLA
// Yeni: kampanya filtresi varsa da page-level poll yap, ama sadece ad_id olmayan lead'leri al
if (selectedCampaignIds.length > 0) {
  // Page-level poll, sadece test lead'leri (ad_id olmayan) kabul et
}
```

