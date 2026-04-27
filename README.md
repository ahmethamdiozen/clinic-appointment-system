[🇬🇧 English](README.EN.md)

# DentaBook — Yapay Zeka Destekli Diş Kliniği Randevu Sistemi

Hastaların bir yapay zeka telefon asistanını arayarak randevu aldığı, klinik personelinin her şeyi modern bir web panelinden yönettiği full-stack klinik yönetim sistemi.

> AI ses entegrasyonu, Google Calendar senkronizasyonu ve otomatik SMS bildirimlerini sergileyen portföy projesi.

---

## Özellikler

### AI Ses ile Randevu
- Hastalar **Vapi** destekli bir telefon numarasını arar
- AI resepsiyonist, Google Calendar üzerinden doktor uygunluğunu gerçek zamanlı kontrol eder
- Randevuyu kaydeder ve onay SMS'i gönderir — insan müdahalesi olmadan

### Google Calendar Entegrasyonu
- Her doktorun Google Calendar'ı **Service Account** üzerinden senkronize edilir
- Randevular doğrudan doktorun takvimine etkinlik olarak yazılır

### Web Paneli
- **Dashboard** — günlük/haftalık istatistikler, rezervasyon kaynağı dağılımı (Web vs Ses)
- **Randevular** — durum sekmeleriyle filtrelenebilir tablo, iptal/onay işlemleri
- **Doktorlar** — doktor ekle, haftalık uygunluk ayarla, aktif/pasif geçiş
- **Hastalar** — aranabilir hasta listesi

### Bildirimler
- **Onay SMS'i** — randevu kaydedildiğinde anında gönderilir
- **24 Saat Önce Hatırlatıcı** — her sabah saat 08:00'de cron job çalışır
- **SMS ile İptal** — hasta "İPTAL" yazar; sistem randevuyu iptal edip takvim etkinliğini siler

### Kimlik Doğrulama
- E-posta + şifre ile JWT girişi (15 dakika erişim token'ı + 7 günlük yenileme token'ı)
- Rol tabanlı erişim (ADMIN / STAFF)

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, TypeScript, Express |
| Veritabanı | PostgreSQL, Prisma ORM |
| Kimlik Doğrulama | Özel JWT (bcrypt şifreleme) |
| Ses AI | Vapi |
| Takvim | Google Calendar API (Service Account) |
| SMS | Twilio |
| Zamanlayıcı | node-cron |
| Monorepo | pnpm workspaces |

---

## Kurulum

```bash
git clone https://github.com/ahmethamdiozen/clinic-appointment-system.git
cd clinic-appointment-system
pnpm install
cp .env.example apps/api/.env   # değerleri doldurun
echo "VITE_API_URL=http://localhost:3001" > apps/web/.env
docker-compose up -d            # yerel Postgres
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed
pnpm dev
```

Varsayılan admin: `admin@dentabook.com` / `admin123`

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## Sesli Randevu Akışı

```
Hasta Vapi numarasını arar
        │
        ▼
AI: ad, telefon, şikayet, tercih edilen tarih bilgilerini toplar
        │
        ▼ POST /api/webhooks/vapi { toolName: "checkAvailability" }
Backend Google Calendar'ı sorgular → uygun slotları döndürür
        │
        ▼ POST /api/webhooks/vapi { toolName: "bookAppointment" }
Backend: hasta kaydını günceller → Randevu oluşturur → Takvime ekler → Twilio SMS gönderir
        │
        ▼
AI randevuyu onaylayarak görüşmeyi sonlandırır
```

---

## API Özeti

```
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/appointments         # ?status=&doctorId=&date=
POST   /api/appointments
PATCH  /api/appointments/:id
DELETE /api/appointments/:id

GET    /api/doctors
POST   /api/doctors
GET    /api/doctors/:id/availability   # ?date=YYYY-MM-DD

GET    /api/patients             # ?search=ad|telefon
POST   /api/patients

GET    /api/stats

POST   /api/webhooks/vapi
POST   /api/webhooks/twilio
```

---

## Lisans

MIT
