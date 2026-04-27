[🇹🇷 Türkçe](README.md)

# DentaBook — AI-Powered Dental Clinic Appointment System

A full-stack clinic management system where patients call an AI phone assistant to book appointments, and clinic staff manage everything through a modern web dashboard.

> Portfolio project showcasing AI voice integration, Google Calendar sync, and automated SMS notifications.

---

## Features

### AI Voice Booking
- Patients call a phone number powered by **Vapi**
- The AI receptionist checks real doctor availability via Google Calendar in real-time
- Books the appointment and sends a confirmation SMS — all without human intervention

### Google Calendar Integration
- Each doctor's Google Calendar is synced via a **Service Account**
- Appointments are written directly to the doctor's calendar as events

### Web Dashboard
- **Dashboard** — daily/weekly stats, booking source breakdown (Web vs Voice)
- **Appointments** — filterable table with status tabs, cancel/confirm actions
- **Doctors** — add doctors, set weekly availability, toggle active/inactive
- **Patients** — searchable patient list

### Notifications
- **Confirmation SMS** — sent immediately when an appointment is booked
- **24h Reminder SMS** — daily cron job at 8:00 AM
- **Cancel via SMS** — patients text "CANCEL"; system cancels and removes the calendar event

### Authentication
- Email + password login with JWT (15-minute access tokens + 7-day refresh tokens)
- Role-based access (ADMIN / STAFF)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, TypeScript, Express |
| Database | PostgreSQL, Prisma ORM |
| Auth | Custom JWT (bcrypt passwords) |
| Voice AI | Vapi |
| Calendar | Google Calendar API (Service Account) |
| SMS | Twilio |
| Scheduler | node-cron |
| Monorepo | pnpm workspaces |

---

## Getting Started

```bash
git clone https://github.com/ahmethamdiozen/clinic-appointment-system.git
cd clinic-appointment-system
pnpm install
cp .env.example apps/api/.env   # fill in values
echo "VITE_API_URL=http://localhost:3001" > apps/web/.env
docker-compose up -d            # local Postgres
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed
pnpm dev
```

Default admin: `admin@dentabook.com` / `admin123`

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## How the Voice Call Works

```
Patient calls Vapi number
        │
        ▼
AI collects: name, phone, concern, preferred date
        │
        ▼ POST /api/webhooks/vapi { toolName: "checkAvailability" }
Backend queries Google Calendar freebusy → returns available slots
        │
        ▼ POST /api/webhooks/vapi { toolName: "bookAppointment" }
Backend: upserts patient → creates Appointment → Google Calendar event → Twilio SMS
        │
        ▼
AI confirms booking, ends call
```

---

## API Reference

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

GET    /api/patients             # ?search=name|phone
POST   /api/patients

GET    /api/stats

POST   /api/webhooks/vapi
POST   /api/webhooks/twilio
```

---

## License

MIT
