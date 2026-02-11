
# Hasta Satır Tıklama ve Detay Sayfası Geliştirmesi

## Sorun
Hasta listesinde bir satıra tıklandığında **düzenleme formu** açılıyor. Kullanıcı beklentisi: satıra tıklayınca **detay sayfası** açılmalı.

## Yapılacak Degisiklikler

### 1. Satır Tiklama Davranisini Degistir
**Dosya:** `src/pages/Patients.tsx`

- Satir 819'da `onClick={() => handleEdit(patient)}` yerine detay sayfasini acacak sekilde degistirilecek
- Satir 850'deki superAdmin klinik hucresindeki `onClick` da ayni sekilde guncellenecek
- Artik satira tiklandiginda `setSelectedPatient(patient)` + `setShowPatientDetails(true)` calisacak

### 2. Detay Sayfasinda Ozet Bilgi Paneli Ekle
**Dosya:** `src/components/PatientDetails.tsx`

Detay sayfasi acildiginda, sekmelerin ustunde su bilgileri gosteren bir ozet panel eklenecek:

```text
+------------------------------------------+
| Randevular: 2 adet | Arama: 5 kez        |
| [+ Randevu Olustur]  (appointment yoksa)  |
+------------------------------------------+
```

- **Randevu sayisi:** `appointments` tablosundan `patient_id` ile sayilacak (zaten yukleniyor)
- **Arama sayisi:** `reminders` tablosu uzerinden `reminder_call_logs` sayisi cekilecek
- **Randevu yoksa:** "Henuz randevu yok" mesaji + **"Randevu Olustur"** kisayol butonu gosterilecek. Bu buton tiklandiginda `activeTab` otomatik olarak `appointments` sekmesine gecip formu hazirlayacak.

### 3. Mobil Kart Gorunumunde Degisiklik Yok
`PatientCard` bileseninde zaten `onDetails` ve `onEdit` ayri butonlar olarak mevcut, dogru calisiyor.

## Teknik Detaylar

### Veritabani Sorgulari (mevcut + yeni)
- Randevular: Zaten `loadData` icinde yukleniyor, `appointments.length` kullanilacak
- Arama kayitlari: Yeni sorgu eklenecek:
  ```sql
  SELECT count(*) FROM reminder_call_logs rcl
  JOIN reminders r ON rcl.reminder_id = r.id
  WHERE r.patient_id = :patientId
  ```

### Degisecek Dosyalar
| Dosya | Degisiklik |
|-------|-----------|
| `src/pages/Patients.tsx` | Satir tiklamasi `handleEdit` yerine detay acma |
| `src/components/PatientDetails.tsx` | Ozet panel + arama sayisi + kisayol buton |
