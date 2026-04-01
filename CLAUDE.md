# DentaBook — AI-Powered Dental Clinic Appointment System

Portfolio project. An AI voice assistant (Vapi) answers patient phone calls, checks doctor availability via Google Calendar, and books appointments. Sends SMS confirmations and reminders via Twilio. Clinic staff manage everything via a React dashboard.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js + TypeScript + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (custom — access + refresh tokens, bcrypt passwords) |
| Voice AI | Vapi |
| Calendar | Google Calendar API (Service Account auth) |
| SMS | Twilio |
| Scheduler | node-cron (runs inside API process) |
| Monorepo | pnpm workspaces |
| Deploy | Coolify on Hetzner VPS |

## Project Structure

```
clinic-appointment/
├── apps/
│   ├── api/                    # Express backend (port 3001)
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── config/         # env validation, prisma singleton
│   │       ├── middleware/     # auth, error handler, zod validation
│   │       ├── routes/         # appointments, doctors, patients, auth, webhooks
│   │       └── services/       # calendar, vapi, notification, reminder
│   └── web/                    # React frontend (port 5173)
│       └── src/
│           ├── components/     # shadcn/ui + custom components
│           ├── pages/          # route-level page components
│           ├── hooks/          # TanStack Query hooks
│           └── lib/            # axios instance, utils
├── packages/
│   └── shared/                 # Shared Zod schemas + TypeScript types
├── docker-compose.yml          # Local Postgres
├── .env.example
└── pnpm-workspace.yaml
```

## Development

```bash
# Prerequisites: Node 20+, pnpm, Docker

# Install all dependencies
pnpm install

# Start local Postgres
docker-compose up -d

# Run database migrations
pnpm --filter api prisma migrate dev

# Seed initial admin user (optional)
pnpm --filter api prisma db seed

# Start both apps concurrently (api on :3001, web on :5173)
pnpm dev

# Run only backend
pnpm --filter api dev

# Run only frontend
pnpm --filter web dev
```

## Environment Variables

### apps/api/.env
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dentabook

NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Google Calendar Service Account (base64-encoded service account JSON)
# Encode: base64 -i service-account.json | tr -d '\n'
GOOGLE_SERVICE_ACCOUNT_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=   # E.164 format e.g. +15005550006

# Vapi (webhook signature verification)
VAPI_WEBHOOK_SECRET=
```

### apps/web/.env
```
VITE_API_URL=http://localhost:3001
```

## Key External Services

### Vapi (AI Voice)
- Create an Assistant in the Vapi dashboard with the dental receptionist system prompt
- Register 2 server-side tools: `checkAvailability`, `bookAppointment`
- Set Server URL to: `https://api.yourdomain.com/api/webhooks/vapi`
- Webhook route: `POST /api/webhooks/vapi` (verified with `VAPI_WEBHOOK_SECRET`)

### Google Calendar (Service Account)
- Create a GCP project → enable Google Calendar API → create Service Account → download JSON key
- Encode the JSON: `base64 -i service-account.json | tr -d '\n'` → set as `GOOGLE_SERVICE_ACCOUNT_KEY`
- For each doctor: share their Google Calendar with the service account email ("Make changes to events")
- Store the calendar ID in `Doctor.googleCalendarId`

### Twilio (SMS)
- Outbound: confirmation SMS on booking, reminder SMS 24h before appointment
- Inbound: `POST /api/webhooks/twilio` — patients text "CANCEL" to cancel their appointment
- Set Twilio inbound webhook URL to: `https://api.yourdomain.com/api/webhooks/twilio`

## API Overview

```
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/appointments          # ?status=&doctorId=&date=&page=&limit=
POST   /api/appointments
GET    /api/appointments/:id
PATCH  /api/appointments/:id
DELETE /api/appointments/:id

GET    /api/doctors
POST   /api/doctors
GET    /api/doctors/:id
PATCH  /api/doctors/:id
GET    /api/doctors/:id/availability   # ?date=YYYY-MM-DD

GET    /api/patients               # ?search=name|phone
POST   /api/patients
GET    /api/patients/:id
PATCH  /api/patients/:id

GET    /api/stats

POST   /api/webhooks/vapi          # Vapi tool calls (HMAC auth)
POST   /api/webhooks/twilio        # Twilio inbound SMS
```

## Deployment (Coolify on Hetzner)

1. **PostgreSQL**: Add a Postgres resource in Coolify → copy the `DATABASE_URL`
2. **API**: Create a service pointing to this repo → set build context to `apps/api` → add all env vars from `apps/api/.env`
3. **Web**: Create a static service → build command `pnpm --filter web build` → publish directory `apps/web/dist`
4. **Domains + SSL**: Assign custom domains in Coolify — Let's Encrypt is handled automatically

The API ships with a `Dockerfile` at `apps/api/Dockerfile` for Docker-based deployment.
