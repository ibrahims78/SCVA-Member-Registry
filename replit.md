# SCVA Members Management System

## Overview

A bilingual (Arabic/English) member management system for the Syrian Cardiovascular Association (SCVA). Manages member records (personal info, specialties, membership types, subscription/payment tracking), with a dashboard, member listing with search and Excel export, member detail views, add/edit forms, user management, and PDF/Word export.

The application is a full-stack TypeScript app with a PostgreSQL backend, session-based authentication (Passport + bcrypt), and a React + Vite frontend.

## User Preferences

Preferred communication style: Simple, everyday language (Arabic).

## System Architecture

### Frontend (`client/`)
- **Framework**: React 19 with TypeScript
- **Routing**: Wouter
- **UI Components**: shadcn/ui (new-york style) on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables, light/dark mode via `next-themes`
- **State**: TanStack React Query for all server state. `MembersContext` is a thin wrapper around React Query for convenience.
- **Forms**: React Hook Form + Zod (`zodResolver`)
- **i18n**: Custom via `LanguageContext`. Arabic (RTL) is the default.
- **Charts**: Recharts. **Excel**: xlsx. **Word**: docx + file-saver.

### Backend (`server/`)
- **Framework**: Express 5
- **Auth**: Passport (local strategy) + bcryptjs. Sessions are persisted in PostgreSQL via `connect-pg-simple` (table `session`, auto-created).
- **API**: RESTful under `/api`, all write endpoints validated with Zod schemas from `@shared/schema`.
- **Storage**: `IStorage` interface with `DatabaseStorage` (Drizzle/Postgres) implementation in `server/storage.ts`.

### Database
- **ORM**: Drizzle ORM, driver `node-postgres`
- **Schema**: `shared/schema.ts` — `users`, `members`, `subscriptions`, plus session table managed by connect-pg-simple
- **Connection**: `DATABASE_URL` env var (required)
- **Migrations**: `npm run db:push`

### Auth & Security
- All `/api/*` routes (except `/api/login` and `/api/user`) require authentication.
- `/api/users*` and admin-only operations require `role === "admin"`.
- `/api/members/:id/pdf` requires authentication (no public access).
- Session cookie is `httpOnly`; `sameSite: "strict"` and `secure` in production, `sameSite: "lax"` in development.
- `SESSION_SECRET` env var is required in production (warning in development).
- Default admin user is auto-created on first boot with username `admin`. Password comes from `ADMIN_INITIAL_PASSWORD` (must be ≥ 8 chars) or, if absent, a cryptographically random 24-char password generated at boot via `crypto.randomBytes`. The generated password is printed **once** to stderr inside a bilingual highlighted box at startup so the operator can capture it. The user is flagged `mustChangePassword: true`, so the app forces a password change on the first successful login before allowing any other action.
- **Last-admin protection**: The server refuses (HTTP 409) to delete or demote the last remaining admin (`role !== "admin"` PATCH or DELETE). The Settings UI also disables the destructive button on the last admin and on the current user, with an Arabic tooltip explaining why.
- Login responses, `/api/user`, and user listings strip the `password` field.
- Logging redacts any `password` field in API response bodies.
- **HTTP headers**: Helmet middleware applied globally (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, etc.).
- **Rate limiting**: `/api/login` is limited to 10 attempts per 15-min window per IP via `express-rate-limit`.
- **Body size limits**: 5 MB for JSON, 1 MB for `urlencoded` (mitigates payload-bombing).
- **CSRF defense (production)**: Same-origin guard rejects any `/api/*` write whose `Origin`/`Referer` doesn't match the host (skips `/api/login`). The `sameSite: strict` cookie is the primary defense; this is belt-and-braces.

### Pages
- `/` — Dashboard with member stats and charts
- `/members` — Member listing with search and Excel export
- `/add-member`, `/edit-member/:id` — Member form
- `/member/:id` — Member details + subscriptions + PDF/Word export
- `/settings` — User management (admin) and theme/language

## External Dependencies

- **PostgreSQL** (required) via `DATABASE_URL`
- **Chromium** (optional, for `/api/members/:id/pdf`) — path can be overridden via `CHROME_PATH` (default `/usr/bin/chromium`). Without Chromium installed, the PDF endpoint returns **HTTP 503** with a bilingual (Arabic/English) JSON message instructing the user to use the Word export instead, or contact the administrator. The Word export works entirely client-side and has no extra runtime dependencies.
- **Google Fonts**: Cairo (Arabic) and Inter (English) via CDN

## Required Environment Variables

| Variable | When | Purpose |
|---|---|---|
| `DATABASE_URL` | Always | PostgreSQL connection string |
| `SESSION_SECRET` | Required in production, recommended in dev | Signs session cookies |
| `ADMIN_INITIAL_PASSWORD` | Optional, first boot only | Initial password for the auto-created `admin` user (must be ≥ 8 characters). If absent, a 24-character random password is generated and printed once to stderr at startup. The app forces a password change on first login regardless. |
| `NODE_ENV` | Optional | `production` enables HTTPS-only cookies, strict same-site, and the same-origin CSRF guard |
| `CHROME_PATH` | Optional | Custom Chromium path for PDF export |
| `PORT` | Optional | Defaults to `5000` |

## Build & Run

- Dev: `npm run dev` (Express + Vite middleware on port 5000)
- Type check: `npm run check`
- DB sync: `npm run db:push`
- Seed (verifies admin exists, prints DB summary): `npm run seed`
- Build: `npm run build` (Vite + esbuild bundle into `dist/`)
- Production: `npm start`

## Performance Notes

- `IStorage.getSubscriptionsByMemberIds(ids)` returns a `Map<memberId, Subscription[]>` from a single `IN (...)` query. Used by `/api/members`, `/api/backup`, and `/api/subscriptions/import` to avoid N+1 query patterns. Measured ~7.7× speed-up on a 99-member dataset; gap widens with larger datasets.
- TanStack Query default `staleTime` is 30 seconds (no longer `Infinity`), so stale data refreshes automatically while still benefiting from cache hits during navigation.

## Code Review Audit

A full Arabic code review and a phase-by-phase remediation log are at `docs/CODE_REVIEW.md` (security, TypeScript, performance, code quality, architecture).
