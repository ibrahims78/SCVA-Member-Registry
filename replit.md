# SCVA Members Management System

## Overview

This is a bilingual (Arabic/English) member management system for the Syrian Cardiovascular Association (SCVA). It allows managing member records including personal information, specialties, membership types, and subscription/payment tracking. The app features a dashboard with statistics, member listing with search and Excel export, member detail views with subscription history, and add/edit member forms.

Currently, the application stores all data client-side using React context with mock data (in-memory). There is no backend API implementation yet — the server routes file is empty and the storage layer uses an in-memory Map. The database schema exists but is minimal (just a users table for auth), and no member-related tables have been created yet.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming (light/dark mode via `next-themes`)
- **State Management**: React Context for members data (`MembersContext`) and language (`LanguageContext`); TanStack React Query is set up but not actively used since there are no API calls yet
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: Custom i18n via `LanguageContext` with Arabic (RTL) and English (LTR) support. Arabic is the default language (`lang="ar" dir="rtl"`)
- **Charts**: Recharts for dashboard statistics
- **Excel Export**: xlsx library for exporting member data
- **Fonts**: Cairo (Arabic) and Inter (English) from Google Fonts

### Backend (server/)
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript, compiled with tsx (development) and esbuild (production)
- **API Pattern**: RESTful routes under `/api` prefix (currently empty — needs implementation)
- **Storage Interface**: `IStorage` interface defined in `server/storage.ts` with a `MemStorage` in-memory implementation. This is designed to be swapped for a database-backed implementation.

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts` — currently only has a `users` table with id, username, password
- **Migrations**: Drizzle Kit with `db:push` command; migrations output to `./migrations`
- **Connection**: Uses `DATABASE_URL` environment variable
- **Note**: Member-related tables (members, subscriptions) have NOT been created yet. The member data model exists only as TypeScript types in `client/src/lib/types.ts` and needs to be translated into Drizzle schema tables.

### Key Design Decisions

1. **Client-side data storage (current state)**: All member data lives in React context with localStorage persistence and mock seed data. This needs to be migrated to server-side storage with proper API endpoints.

2. **Shared schema directory**: The `shared/` directory contains database schema and types accessible by both client and server, enabling type safety across the stack.

3. **Bilingual RTL/LTR support**: The app defaults to Arabic (RTL) and supports toggling to English (LTR). All UI text goes through the `t()` translation function.

4. **Build process**: Custom build script (`script/build.ts`) uses Vite for client and esbuild for server, outputting to `dist/`. The server serves the built client in production.

5. **Development setup**: Vite dev server runs with HMR through the Express server (middleware mode). The server proxies to Vite in development.

### Pages
- `/` — Dashboard with member stats and charts
- `/members` — Member listing with search and Excel export
- `/add-member` — Add new member form
- `/edit-member/:id` — Edit member (reuses AddMember component)
- `/member/:id` — Member detail view with subscription management

### Data Model (client-side, needs DB schema)
- **Member**: fullName, fatherName, englishName, birthDate, gender, specialty, email, phone, workAddress, joinDate, membershipType, subscriptions[]
- **Subscription**: year, amount, receiptNumber, date
- **Gender**: male, female
- **MembershipType**: original, associate
- **Specialty**: cardiac_surgery, cardiology, pediatric_cardiology

## External Dependencies

- **PostgreSQL**: Database (via `DATABASE_URL` env var), configured with Drizzle ORM but not yet fully utilized
- **Google Fonts**: Cairo and Inter fonts loaded via CDN
- **No external APIs**: No third-party API integrations currently; the build script allowlist includes packages like `nodemailer`, `stripe`, `openai`, `@google/generative-ai` but none are actively used
- **Key npm packages**: express, drizzle-orm, drizzle-zod, react-hook-form, zod, xlsx, recharts, wouter, next-themes, radix-ui components, tanstack/react-query