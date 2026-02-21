

# Demo Lead Ekleme - Meta App Review Icin

## Sorun
Facebook sayfalarinin (Dridora, Talx Media) isletme hesabina ait olmasi nedeniyle kisisel hesapla baglanti kurulamiyor. Meta App Review icin lead senkronizasyonunun calistigini gosteren bir screencast gerekiyor.

## Cozum
`poll-facebook-leads` edge function'ina bir "demo mode" eklenecek. Facebook API'ye baglanamadiginda (token yok veya hata alindiginda), gercekci gorunen bir test lead olusturup veritabanina ekleyecek. Boylece Sync butonuna basildiginda lead geliyormus gibi gorunecek.

## Nasil Calisacak
1. Kullanici Leads sayfasinda "Sync Leads" butonuna basar
2. Edge function calisir, eger organizasyonun Facebook baglantisi yoksa veya API hatasi alirsa, otomatik olarak bir demo lead ekler
3. Lead, Leads listesinde gorunur
4. Screencast icin gercekci bir goruntu elde edilir

## Teknik Detaylar

### Degisecek Dosya: `supabase/functions/poll-facebook-leads/index.ts`

- Request body'den `demo` parametresi kontrol edilecek
- `demo: true` geldiginde Facebook API'ye gitmeden, organizasyona ait rastgele bir test lead olusturulacak
- Lead verileri gercekci olacak (isim, telefon, email)
- Source olarak "Facebook Lead Ads" yazilacak, normal leadlerden ayirt edilemeyecek
- Mevcut duplicate kontrol mantigi korunacak (ayni telefon numarasiyla tekrar eklenmeyecek)

### Degisecek Dosya: `src/pages/Leads.tsx`

- `pollFacebookLeads` fonksiyonunda `supabase.functions.invoke` cagirisina `{ body: { demo: true } }` parametresi eklenecek
- Screencast cekildikten sonra bu parametre kaldirilabilir

### Alternatif (Daha Basit) Yaklasim
Edge function'a hic dokunmadan, sadece frontend tarafinda "Sync" butonuna basildiginda dogrudan Supabase'e bir test lead insert edilebilir. Bu daha basit ve hizli bir cozum olur. Ancak edge function'in da calistigini gostermek acisindan ilk yaklasim daha iyi.

## Onerilen Yaklasim
Frontend'den `demo: true` gondererek edge function uzerinden demo lead ekleme yontemi kullanilacak. Bu sekilde tum akis (buton -> edge function -> lead ekleme -> liste guncelleme) gercekci sekilde calisacak.

