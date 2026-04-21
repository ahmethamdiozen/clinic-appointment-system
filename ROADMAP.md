# Clinic Appointment (DentaBook) — Deployment Roadmap

**Target subdomain**: `dentabook.ahmethamdiozen.site` (web) + `api.dentabook.ahmethamdiozen.site` (API)
**Deploy order in pipeline**: 1st (easiest — already Coolify-designed in README)
**Status**: full-stack Coolify-ready; needs production hardening, external service trial setup, and demo-friendly UX.

---

## North Star

Proves real-world integration chops — an AI voice receptionist (Vapi), Google Calendar orchestration, Twilio SMS (both in- and outbound), cron-based reminders, JWT auth, pnpm monorepo. When "done", a recruiter can log into the staff dashboard with demo credentials, see a populated clinic with doctors/patients/appointments, and either (a) place a test call to the Vapi number or (b) watch the 2-minute video showing a real AI-booked appointment.

---

## Phase 0 — Deploy Blockers

### Security / Production config

- [ ] **Fail fast on missing env** — `apps/api/src/config/env.ts` (or wherever config validation lives) should throw if any of `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `TWILIO_*`, `VAPI_WEBHOOK_SECRET` is missing. No dev-string fallbacks.
- [ ] **CORS allowlist** — restrict to `dentabook.ahmethamdiozen.site` only in prod (not `*`).
- [ ] **Vapi webhook signature verification** — verify every `POST /api/webhooks/vapi` request carries a valid HMAC signature with `VAPI_WEBHOOK_SECRET`. If missing, return 401.
- [ ] **Twilio webhook signature verification** — same for `POST /api/webhooks/twilio` using Twilio's `X-Twilio-Signature` header.
- [ ] **Rate limit webhook endpoints** — even with signature verification, add IP-based rate limit to prevent DoS.
- [ ] **Log redaction** — ensure phone numbers, patient names, calendar IDs don't appear in raw logs (PII/GDPR concern since you're targeting EU).

### External service setup

- [ ] **Vapi production assistant** — create a separate Vapi assistant for prod (not reusing dev one). Set server URL to `https://api.dentabook.ahmethamdiozen.site/api/webhooks/vapi`. Store the assistant phone number in README.
- [ ] **Google Calendar service account** — create a dedicated service account for prod, download key, base64-encode into `GOOGLE_SERVICE_ACCOUNT_KEY`. Share demo doctor calendars with it.
- [ ] **Twilio trial vs paid** — Twilio trial allows only verified numbers to receive SMS. Either (a) upgrade to paid (~$10 load), or (b) document "demo SMS only visible in Twilio logs".
- [ ] **Confirm cron runs on Coolify** — `node-cron` inside the API process (`reminder.service.ts`) works only if API container is running continuously. Verify Coolify doesn't put the service to sleep.

### Operability

- [ ] **`/health` endpoint** returns 200 + DB ping + Twilio credential check + Google API reachability.
- [ ] **Structured JSON logging** — swap `console.log` for `pino` or similar. Include request correlation IDs.
- [ ] **Graceful shutdown** — cron jobs and DB connections must drain on SIGTERM for Coolify rolling deploys.

### Demo data

- [ ] **Seed script: 3 doctors (General, Ortho, Pedo)** with realistic weekly availability, 15 patients with E.164 phone numbers, 25 appointments across past/future dates, varied statuses.
- [ ] **Demo admin**: `admin@dentabook.ahmethamdiozen.site` / `demo1234` (README).

### Deploy wiring

- [ ] **Two Coolify services** — API (Dockerfile: `apps/api/Dockerfile`, port 3001) + Web (static: `pnpm --filter web build` → `apps/web/dist`).
- [ ] **VITE_API_URL in Web build** = `https://api.dentabook.ahmethamdiozen.site`.
- [ ] **Prisma migrations auto-run on API boot** — verify Dockerfile CMD includes `prisma migrate deploy` before `node` start (README claims this).
- [ ] **Postgres Coolify resource** with daily backup enabled.

---

## Phase 1 — Post-Deploy MVP Gaps

### Voice AI robustness

- [ ] **Vapi system prompt — edge cases** — currently only happy path. Add handling for: patient asks for a day without availability, patient gives invalid phone, patient changes mind mid-call, patient is existing patient (don't re-ask name).
- [ ] **Vapi call log storage** — on each webhook, persist `call_id`, duration, transcript summary to a `VoiceCall` table. Lets admin see what happened without going to Vapi dashboard.
- [ ] **Fallback for Google Calendar API failure** — if freebusy call fails (network, quota), Vapi should say "I'll have our team call you back" instead of silently booking.

### SMS flow

- [ ] **CANCEL reply parsing — fuzzy match** — today exact "CANCEL" required. Accept "cancel", "iptal", "kaldır", " CANCEL ". Regex normalize.
- [ ] **Cancel confirmation SMS** — after CANCEL, send "Appointment on [date] cancelled. Reply YES within 1h to restore." (safety net for fat-finger cancels).
- [ ] **SMS deliverability logging** — Twilio gives delivery status via webhook; currently we fire-and-forget. Track delivered/failed per appointment.

### Calendar sync

- [ ] **Two-way sync** — if a doctor moves an appointment in Google Calendar, detect via Calendar webhook and update DB. Currently one-way (DB → Calendar).
- [ ] **Deleted event reconciliation** — if event is deleted in Calendar, mark appointment CANCELLED and notify patient.

### Dashboard gaps

- [ ] **Appointment detail modal** — click an appointment row → see full patient history, past appointments, voice call transcript (if VOICE source).
- [ ] **Patient merge** — two appointments booked under slightly different phone formats get separate Patient rows. Add admin merge UI.
- [ ] **Audit log** — who cancelled/confirmed what + when. `AuditEvent` table. Nice for "I take GDPR seriously" in interviews.

### Auth

- [ ] **Password reset flow** — forgot password → email link (uses the same SMTP/Resend you'll add to wp-order-bot).
- [ ] **Role permissions** — STAFF role cannot delete doctors or change settings; today the code may not enforce this per-endpoint. Audit all PATCH/DELETE routes.

---

## Phase 2 — Polish / Portfolio Readiness

- [ ] **Screenshot pack** — dashboard, appointments list, doctor availability editor, booking modal, settings page. 6 shots, seeded data.
- [ ] **2-minute demo video** — screen+voice: "let's book an appointment by calling…", play Vapi call audio, show DB row appear, show calendar event appear, show SMS on your phone.
- [ ] **Portfolio card on ahmethamdiozen.site**:
  - Title: "DentaBook — AI Voice Dental Clinic"
  - Tech: Vapi, Google Calendar, Twilio, JWT, pnpm monorepo, Coolify
  - Links: live staff dashboard (with demo creds), GitHub, YouTube demo, test phone number
  - TR + EN copy
- [ ] **Public read-only demo mode** — a `/public` route on the dashboard that shows today's schedule + stats without login. Lets visitors peek without registering.
- [ ] **Custom 404 / loading / error pages** — not default React error screens.
- [ ] **Empty-states polish** — "No appointments yet — book one by calling +X…"

### CI/CD

- [ ] **GitHub Actions**: type-check, lint, prisma validate, web build. On main merge → Coolify webhook triggers deploy.
- [ ] **Zod schema tests** — verify shared package schemas accept valid + reject invalid samples.
- [ ] **One integration test per webhook** — POST with signed payload → expect DB side-effect.

---

## Phase 3 — Stretch

- [ ] **Multi-clinic tenancy** — `Clinic` root entity; `Doctor` and `Appointment` scoped by clinic. Would take the project from "demo" to "could-be-a-real-SaaS".
- [ ] **Stripe subscription** — bill clinics monthly per doctor seat.
- [ ] **Waiting list** — if fully booked, Vapi offers to text patient when a slot opens.
- [ ] **Analytics** — booking source breakdown over time, peak hours, no-show rate, doctor utilization.
- [ ] **i18n** — Turkish + English for UI, Vapi prompt in both.
- [ ] **WhatsApp channel** — reuse patterns from `wp-order-bot`.

---

## Deploy Checklist (Coolify)

1. DNS: A records for `dentabook.ahmethamdiozen.site` and `api.dentabook.ahmethamdiozen.site`.
2. Coolify Postgres resource + copy `DATABASE_URL`.
3. API service: Dockerfile `apps/api/Dockerfile`, port 3001, all env vars set.
4. Web service: static build from `apps/web`, publish `dist/`, `VITE_API_URL=https://api.dentabook.ahmethamdiozen.site`.
5. Domains + Let's Encrypt SSL.
6. Vapi dashboard: update Server URL to prod API.
7. Twilio console: update inbound webhook to prod API.
8. Run seed script once.
9. Smoke test: login, view dashboard, call Vapi number, verify appointment appears.

---

## Demo Setup

- Staff dashboard login: `admin@dentabook.ahmethamdiozen.site` / `demo1234`
- Vapi test number: `[TBD — set after Vapi prod assistant]`
- README notes: "SMS sent only to verified Twilio trial numbers; watch video demo for full flow."
- Seeded: 3 doctors, 15 patients, 25 appointments (past + upcoming).
