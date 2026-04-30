# Selor

Selor is a barber shop operations and booking platform built with Next.js 16, React 19, Tailwind CSS v4, Supabase, and TypeScript. It combines a customer booking flow, a protected admin workspace, real-time-ish queue handling, availability calculation, staff and service management, analytics, and basic inventory support in a single App Router application.

## What the Project Does

- Customer-facing booking flow for selecting services, barber, date, and slot.
- Authenticated customer dashboard for upcoming appointments and loyalty progress.
- Google sign-in with Supabase Auth.
- Admin-only management area for analytics, queue, bookings, staff, services, clients, inventory, and shop settings.
- Slot generation based on weekly hours, service durations, buffers, and barber conflicts.
- Queue join, assign, and complete workflows.
- Appointment creation and updates through RPC-backed booking flows.
- Invite generation with QR code support.
- PWA support with manifest, icons, service worker output, and production security headers.

## Tech Stack

### Core

- Next.js `16.2.4` with App Router
- React `19.2.4`
- TypeScript `5`
- Tailwind CSS `4`
- ESLint `9`

### Backend and Data

- Supabase SSR and Supabase JS
- Supabase Auth for session handling and Google OAuth
- PostgreSQL schema and migrations under `db/` and `supabase/`
- Zod for request and env validation

### UI and App Utilities

- Zustand for booking state
- `date-fns` for date and time operations
- `lucide-react`
- Material Symbols via Google Fonts
- `qrcode` for invite QR generation
- `next-pwa` for Progressive Web App support

## Current Feature Set

### Customer experience

- Service selection flow at `/book/service`
- Barber and timeslot selection at `/book/time`
- Appointment review and confirmation at `/book/confirm`
- Dashboard at `/dashboard` with:
  - upcoming appointment summary
  - loyalty progress
  - barber listing
  - booking CTA
- Sign in and sign out from the shared customer navigation

### Admin experience

- `/admin` analytics overview with revenue, bookings, queue served, and utilization
- `/admin/bookings` daily schedule view
- `/admin/queue` queue operations
- `/admin/staff` barber management
- `/admin/services` service catalog management
- `/admin/clients` client directory and loyalty summary
- `/admin/inventory` product and stock management
- `/admin/settings` shop configuration management

### Platform capabilities

- Role-aware access control for `customer`, `barber`, and `admin`
- Rate limiting for write-heavy routes
- Idempotency support hooks for booking and queue actions
- Soft deletion for several admin-managed entities
- Response helpers and centralized route error handling
- Timezone-aware slot generation using shop settings
- Security headers configured in `next.config.ts`

## Functional Modules

- `auth`: current user lookup, role guards, OAuth login callback
- `appointments`: create, list, cancel/reschedule/payment update flows
- `availability`: calculate open slots from services, hours, appointments, and overrides
- `queue`: join, assign, complete, and list queue tokens
- `analytics`: admin/barber reporting from analytics views
- `services`: list and manage service catalog
- `staff`: create, update, activate/deactivate barbers
- `clients`: customer directory with computed loyalty data
- `inventory`: product CRUD and stock overview
- `settings`: shop metadata, timezone, hours, buffers, slot interval, reminders
- `invites`: create tokenized invites and QR assets

## API Surface

### Auth

- `GET /api/auth/login`
- `GET /api/auth/callback`
- `GET /api/auth/me`

### Booking and availability

- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/[id]`
- `GET /api/availability`

### Queue

- `GET /api/queue`
- `POST /api/queue`
- `PATCH /api/queue/[id]/assign`
- `PATCH /api/queue/[id]/complete`

### Admin resources

- `GET, POST /api/barbers`
- `PATCH, DELETE /api/barbers/[id]`
- `GET, POST /api/services`
- `PATCH, DELETE /api/services/[id]`
- `GET /api/clients`
- `GET, POST /api/products`
- `PATCH, DELETE /api/products/[id]`
- `GET, PATCH /api/settings`
- `POST /api/invites`
- `GET /api/invites/[id]`
- `GET /api/invites/[id]/qr`
- `GET /api/analytics/overview`

## Database Domains

The schema currently models:

- `users`
- `barbers`
- `services`
- `shop_settings`
- `appointments`
- `appointment_services`
- `barber_availability_overrides`
- `queue_tokens`
- `invites`
- `idempotency_keys`
- `audit_logs`
- `notification_events`
- `products`

The database also includes:

- enum-based roles and statuses
- overlap protection for barber appointments
- queue position uniqueness per day
- update timestamp triggers
- seed data for shop settings and services

## Project Structure

```text
app/
  admin/                 Admin dashboard and management pages
  api/                   Route handlers for auth, bookings, queue, analytics, CRUD
  book/                  Customer booking flow
  components/            Shared UI, auth, theme, toast, error boundary, navigation
  dashboard/             Customer dashboard shell and page

lib/
  auth/                  Current-user lookup and role guards
  http/                  API error and response helpers
  services/              Business logic for appointments, queue, analytics, etc.
  stores/                Zustand booking stores
  supabase/              Browser, server, and admin Supabase clients
  validators/            Zod schemas for route inputs
  env.ts                 Environment validation
  time.ts                Timezone and slot helpers
  rate-limit.ts          In-memory request throttling
  idempotency.ts         Idempotency header helper

types/
  database.ts            Database and enum types
  domain.ts              App-level DTOs

db/                      SQL schema and product migration
supabase/                Supabase config, migrations, and seed data
public/                  PWA assets, icons, and generated service worker files
```

## State and Data Flow

- Booking selections are stored in Zustand via `lib/stores/booking-store.ts`.
- Server and admin data access is handled through Supabase clients in `lib/supabase/`.
- Route inputs are validated with Zod before hitting service-layer logic.
- Most business logic lives in `lib/services/` rather than directly in route handlers.

## Environment Variables

The app currently expects these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL_ALLOWLIST=
APP_BASE_URL=
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

`package.json` also supports the equivalent `npm` script names.

## Local Development

1. Install dependencies.
2. Add the required environment variables.
3. Run the database schema or Supabase migrations.
4. Seed initial shop settings and services if needed.
5. Start the app with `pnpm dev`.

Example:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Supabase Notes

- SQL schema lives in [`db/schema.sql`](/run/media/aditya/CODE/selor/db/schema.sql).
- Supabase migrations live in [`supabase/migrations`](/run/media/aditya/CODE/selor/supabase/migrations).
- Seed data lives in [`supabase/seed.sql`](/run/media/aditya/CODE/selor/supabase/seed.sql).
- Google OAuth is used for sign-in.
- Some booking and queue operations rely on Supabase RPC functions.

## PWA and Security

- Web manifest at `/public/manifest.json`
- App icons in `/public/icons`
- Service worker assets generated into `/public`
- Production headers include HSTS, CSP, X-Frame-Options, Referrer-Policy, and Permissions-Policy

## Testing and Utilities

- `test-availability.ts` is a local script for checking slot generation against Supabase data.
- `lib/time.ts` is the main source of truth for shop-time calculations and should be reused for scheduling logic.

## License

MIT
