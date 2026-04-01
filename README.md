# DentaBook — AI-Powered Dental Clinic Appointment System

A full-stack clinic management system where patients call an AI phone assistant to book appointments, and clinic staff manage everything through a modern web dashboard.

> Built as a portfolio project showcasing AI voice integration, Google Calendar sync, and automated SMS notifications.

![Dashboard Preview](https://placehold.co/1200x600/f8fafc/3b82f6?text=DentaBook+Dashboard)

---

## Features

### AI Voice Booking
- Patients call a phone number powered by **Vapi**
- The AI receptionist ("Sophie") asks for the patient's name, phone number, dental concern, and preferred date
- It checks real doctor availability via Google Calendar in real-time
- Books the appointment and sends a confirmation SMS — all without human intervention

### Google Calendar Integration
- Each doctor's Google Calendar is synced via a **Service Account**
- Free/busy slots are queried live when patients call or when staff use the booking form
- Appointments are written directly to the doctor's calendar as events

### Web Dashboard
- **Dashboard** — daily/weekly stats, booking source breakdown (Web vs Voice), last 7 days chart
- **Appointments** — filterable table with status tabs, cancel/confirm actions, new appointment modal
- **Doctors** — add doctors, set weekly availability, toggle active/inactive
- **Patients** — searchable patient list, add new patients
- **Settings** — Vapi system prompt, service configuration guide

### Notifications
- **Confirmation SMS** — sent immediately when an appointment is booked (web or voice)
- **24h Reminder SMS** — daily cron job at 8:00 AM sends reminders for next-day appointments
- **Cancel via SMS** — patients text "CANCEL" to the Twilio number; the system cancels the appointment and removes the Google Calendar event automatically

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
| Voice AI | [Vapi](https://vapi.ai) |
| Calendar | Google Calendar API (Service Account) |
| SMS | Twilio |
| Scheduler | node-cron (runs inside the API process) |
| Monorepo | pnpm workspaces |
| Deployment | Coolify on Hetzner VPS |

---

## Project Structure

```
clinic-appointment-system/
├── apps/
│   ├── api/                    # Express backend (port 3001)
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   └── src/
│   │       ├── config/         # Env validation, Prisma singleton
│   │       ├── middleware/     # JWT auth, error handler, Zod validation
│   │       ├── routes/         # appointments, doctors, patients, auth, webhooks
│   │       └── services/
│   │           ├── calendar.service.ts     # Google Calendar freebusy + event creation
│   │           ├── vapi.service.ts         # Vapi tool call handlers
│   │           ├── notification.service.ts # Twilio SMS
│   │           └── reminder.service.ts     # Daily cron job
│   └── web/                    # React frontend (port 5173)
│       └── src/
│           ├── components/     # shadcn/ui components + layout
│           ├── pages/          # Dashboard, Appointments, Doctors, Patients, Settings
│           ├── hooks/          # TanStack Query data hooks
│           ├── store/          # Zustand auth store
│           └── lib/            # Axios instance, utilities
└── packages/
    └── shared/                 # Shared Zod schemas + TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker (for local Postgres)

### 1. Clone & Install

```bash
git clone https://github.com/ahmethamdiozen/clinic-appointment-system.git
cd clinic-appointment-system
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env` and fill in your values (see [Environment Variables](#environment-variables) below).

Create `apps/web/.env`:
```bash
echo "VITE_API_URL=http://localhost:3001" > apps/web/.env
```

### 3. Start the Database

```bash
docker-compose up -d
```

### 4. Run Migrations & Seed

```bash
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed
```

This creates an admin account:
- **Email:** `admin@dentabook.com`
- **Password:** `admin123`

### 5. Start Development

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health

---

## Environment Variables

### `apps/api/.env`

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dentabook

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Google Calendar (Service Account JSON, base64 encoded)
# Encode: base64 -i service-account.json | tr -d '\n'
GOOGLE_SERVICE_ACCOUNT_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Vapi
VAPI_WEBHOOK_SECRET=
```

---

## External Service Setup

### Vapi (AI Voice)

1. Sign up at [vapi.ai](https://vapi.ai) and create an **Assistant**
2. Set the system prompt (copy from the Settings page in the dashboard)
3. Register two **Server-side Tools**:

**`checkAvailability`**
```json
{
  "name": "checkAvailability",
  "description": "Check available appointment slots for a doctor specialty and date",
  "parameters": {
    "type": "object",
    "properties": {
      "specialty": { "type": "string" },
      "preferredDate": { "type": "string", "description": "YYYY-MM-DD" }
    }
  }
}
```

**`bookAppointment`**
```json
{
  "name": "bookAppointment",
  "description": "Book a dental appointment for the patient",
  "parameters": {
    "type": "object",
    "required": ["patientName", "patientPhone", "doctorId", "startTime"],
    "properties": {
      "patientName": { "type": "string" },
      "patientPhone": { "type": "string", "description": "E.164 format" },
      "doctorId": { "type": "string" },
      "startTime": { "type": "string", "description": "ISO 8601 datetime" },
      "reason": { "type": "string" }
    }
  }
}
```

4. Set **Server URL** to: `https://api.yourdomain.com/api/webhooks/vapi`
5. Copy the webhook secret to `VAPI_WEBHOOK_SECRET`

---

### Google Calendar (Service Account)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Calendar API**
3. Create a **Service Account** → Download the JSON key
4. Base64-encode the key:
   ```bash
   base64 -i service-account.json | tr -d '\n'
   ```
5. Paste the result into `GOOGLE_SERVICE_ACCOUNT_KEY`
6. For each doctor: open their Google Calendar settings → **Share with specific people** → add the service account email with **"Make changes to events"** permission
7. Copy the Calendar ID (found in calendar settings) into the `googleCalendarId` field when adding a doctor

---

### Twilio (SMS)

1. Sign up at [twilio.com](https://twilio.com) and get a phone number
2. Copy `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` to your `.env`
3. For SMS cancel replies: in the Twilio console, set the **inbound webhook** for your number to:
   ```
   https://api.yourdomain.com/api/webhooks/twilio
   ```
   Method: `POST`

---

## API Reference

```
# Auth
POST   /api/auth/login          # { email, password } → { accessToken, refreshToken, user }
POST   /api/auth/refresh        # { refreshToken } → { accessToken, refreshToken }

# Appointments (JWT required)
GET    /api/appointments         # ?status=&doctorId=&date=&page=&limit=
POST   /api/appointments
GET    /api/appointments/:id
PATCH  /api/appointments/:id
DELETE /api/appointments/:id     # Cancels the appointment

# Doctors (JWT required)
GET    /api/doctors
POST   /api/doctors
GET    /api/doctors/:id
PATCH  /api/doctors/:id
GET    /api/doctors/:id/availability   # ?date=YYYY-MM-DD → available time slots

# Patients (JWT required)
GET    /api/patients             # ?search=name|phone
POST   /api/patients
GET    /api/patients/:id
PATCH  /api/patients/:id

# Stats (JWT required)
GET    /api/stats                # Dashboard metrics

# Webhooks (no JWT — secret-based)
POST   /api/webhooks/vapi        # Vapi tool call events
POST   /api/webhooks/twilio      # Inbound SMS (CANCEL handling)
```

---

## How the Voice Call Works

```
Patient calls Vapi phone number
        │
        ▼
Vapi AI greets patient, collects:
  name, phone, dental concern, preferred date
        │
        ▼ HTTP POST → /api/webhooks/vapi
{
  toolName: "checkAvailability",
  parameters: { specialty: "General Dentistry", preferredDate: "2026-04-02" }
}
        │
        ▼
Backend queries Google Calendar freebusy API
Returns available 30-minute slots
        │
        ▼
Vapi AI reads slots to patient, patient picks one
        │
        ▼ HTTP POST → /api/webhooks/vapi
{
  toolName: "bookAppointment",
  parameters: { patientName, patientPhone, doctorId, startTime, reason }
}
        │
        ▼
Backend:
  1. Upserts patient by phone number
  2. Creates Appointment in database (source: VOICE)
  3. Creates event on doctor's Google Calendar
  4. Sends Twilio confirmation SMS to patient
        │
        ▼
Vapi AI confirms booking, ends call
```

---

## Deployment (Coolify on Hetzner)

This project is designed to self-host on a Hetzner VPS managed via [Coolify](https://coolify.io).

### Steps

1. **PostgreSQL** — Add a Postgres resource in Coolify → copy the `DATABASE_URL`

2. **API** — Create a new service in Coolify:
   - Source: this GitHub repo
   - Build pack: **Dockerfile** → path: `apps/api/Dockerfile`
   - Port: `3001`
   - Add all environment variables from `apps/api/.env`

3. **Web** — Create a static site service:
   - Build command: `pnpm --filter web build`
   - Publish directory: `apps/web/dist`
   - Add `VITE_API_URL=https://api.yourdomain.com`

4. **Domains** — Assign custom domains in Coolify. SSL via Let's Encrypt is automatic.

> On first deploy, the Dockerfile runs `prisma migrate deploy` automatically before starting the server.

---

## Database Schema

```
User          — clinic staff accounts (email, passwordHash, role)
Doctor        — doctor profiles with weekly availability schedule
Patient       — patient records identified by phone number (E.164)
Appointment   — links patient + doctor, tracks status, calendar event ID, SMS flags
```

Appointment statuses: `SCHEDULED` → `CONFIRMED` → `COMPLETED` / `CANCELLED` / `NO_SHOW`

Booking sources: `WEB` (dashboard) | `VOICE` (Vapi call)

---

## License

MIT
