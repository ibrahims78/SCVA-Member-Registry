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
- Session cookie is `httpOnly`, `sameSite: lax`, and `secure` in production.
- `SESSION_SECRET` env var is required in production (warning in development).
- Default admin user is created **only** when `ADMIN_INITIAL_PASSWORD` (≥ 8 chars) env var is set on first boot. There is no hardcoded password.
- Login responses, `/api/user`, and user listings strip the `password` field.
- Logging redacts any `password` field in API response bodies.

### Pages
- `/` — Dashboard with member stats and charts
- `/members` — Member listing with search and Excel export
- `/add-member`, `/edit-member/:id` — Member form
- `/member/:id` — Member details + subscriptions + PDF/Word export
- `/settings` — User management (admin) and theme/language

## External Dependencies

- **PostgreSQL** (required) via `DATABASE_URL`
- **Chromium** (optional, for `/api/members/:id/pdf`) — path can be overridden via `CHROME_PATH` (default `/usr/bin/chromium`). Without Chromium installed, the PDF endpoint will return 500. The Word export works entirely client-side and has no extra runtime dependencies.
- **Google Fonts**: Cairo (Arabic) and Inter (English) via CDN

## Required Environment Variables

| Variable | When | Purpose |
|---|---|---|
| `DATABASE_URL` | Always | PostgreSQL connection string |
| `SESSION_SECRET` | Required in production, recommended in dev | Signs session cookies |
| `ADMIN_INITIAL_PASSWORD` | First boot only | Creates the default `admin` user (only if no admin exists yet, ≥ 8 chars) |
| `CHROME_PATH` | Optional | Custom Chromium path for PDF export |
| `PORT` | Optional | Defaults to `5000` |

## Build & Run

- Dev: `npm run dev` (Express + Vite middleware on port 5000)
- Type check: `npm run check`
- DB sync: `npm run db:push`
- Build: `npm run build` (Vite + esbuild bundle into `dist/`)
- Production: `npm start`
