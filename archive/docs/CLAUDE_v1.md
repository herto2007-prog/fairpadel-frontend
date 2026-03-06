# CLAUDE.md — FairPadel

## Project Overview

FairPadel is a full-stack paddle tennis tournament management platform. It handles tournaments, player registrations, match scheduling, rankings, payments, social features, and photo galleries.

**Monorepo structure:** Two independent packages (`backend/` and `frontend/`) with no shared workspace config.

---

## Tech Stack

### Backend (`backend/`)
- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS 10.x + TypeScript 5.1
- **ORM:** Prisma 5.8
- **Database:** PostgreSQL 15+
- **Auth:** JWT + Passport (Bearer token, 24h expiry)
- **Validation:** class-validator + class-transformer
- **Image uploads:** Cloudinary
- **Email:** Resend
- **SMS:** Tigo Business (Beekun) — Paraguay
- **Payments:** Bancard (Paraguay)

### Frontend (`frontend/`)
- **Framework:** React 19.2 + TypeScript 5.9
- **Build:** Vite 7.2.4
- **Styling:** TailwindCSS 3.4 (dark theme, custom palette)
- **State:** Zustand 5.0 (with persist middleware)
- **Forms:** React Hook Form 7.71
- **Routing:** React Router v7
- **Data fetching:** TanStack React Query 5.90
- **HTTP:** Axios 1.13 with auth interceptors
- **UI primitives:** Radix UI
- **Icons:** Lucide React
- **Toasts:** React Hot Toast

---

## Quick Commands

### Backend
```bash
cd backend
npm install --legacy-peer-deps
npm run start:dev          # Dev server (watch mode, port 3000)
npm run build              # Build to dist/
npm run start:prod         # Production: node dist/src/main.js
npm run lint               # ESLint with autofix
npm test                   # Jest unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Create/apply migrations (dev)
npx prisma migrate deploy  # Apply migrations (prod)
npx prisma studio          # Visual DB explorer
npm run seed               # Seed database (ts-node prisma/seed.ts)
```

### Frontend
```bash
cd frontend
npm install
npm run dev                # Vite dev server (port 5173, HMR)
npm run build              # TypeScript check + Vite production build
npm run preview            # Preview production build
npm run lint               # ESLint
```

---

## Architecture

### Backend Module Pattern (NestJS)
Each feature follows: `<feature>.module.ts` + `<feature>.controller.ts` + `<feature>.service.ts` + `dto/`

**Modules (17 total):**
- `auth` — Registration, login, JWT, email verification, password reset
- `users` — User profiles, document search
- `tournaments` — CRUD, categories, filtering by country/city/status
- `inscripciones` — Tournament registrations with state machine
- `parejas` — Doubles pairs/teams
- `matches` — Scheduling, results (3 sets), status management
- `rankings` — Global/country/city rankings, individual player stats
- `pagos` — Payments, confirmations, proofs
- `fotos` — Photo gallery, likes, comments (Cloudinary)
- `social` — Follows, direct messages, play requests
- `notificaciones` — System notifications
- `suscripciones` — Premium subscriptions
- `sedes` — Venues/clubs and courts
- `circuitos` — Circuits/leagues: group tournaments, aggregate standings, admin CRUD + public views
- `categorias` — Promotion rules, automatic/manual category changes, inscription validation, player category history
- `admin` — Dashboard, tournament approvals, organizer requests (+ promote by documento), content moderation, subscriptions, coupons, system config (comisión % configurable)
- `prisma` — Shared Prisma service

### Frontend Feature Structure
```
src/
├── features/           # Domain modules (auth, tournaments, matches, rankings, profile, admin, etc.)
│   └── <feature>/
│       ├── components/ # Feature-specific components
│       └── pages/      # Route pages
├── components/
│   ├── layout/         # Layout, Header, Footer, Sidebar
│   └── ui/             # Reusable: Button, Card, Input, Modal, Table, Badge, etc.
├── store/              # Zustand stores (authStore, tournamentStore, uiStore)
├── services/           # Axios API service layer (one per backend module)
├── types/              # Centralized TypeScript interfaces and enums
├── config/             # API config
├── App.tsx             # Router definition
└── main.tsx            # Entry point
```

### API Conventions
- Global prefix: `/api`
- CORS: Allows `FRONTEND_URL` with credentials
- Auth: `Authorization: Bearer <JWT>` header
- Validation: Global `ValidationPipe` (whitelist, transform, forbidNonWhitelisted)
- Guards: `JwtAuthGuard` + `RolesGuard` with `@Roles()` decorator
- Roles: `jugador`, `organizador`, `admin`

### Frontend Data Flow
```
Component → Service (e.g. authService.login)
  → Axios (api.post) → Interceptor (adds token)
    → Backend API → Response
  → Zustand store update → Re-render
```

---

## Database Schema (Prisma)

**Schema file:** `backend/prisma/schema.prisma` (~968 lines)

### Core Models
| Domain | Models |
|--------|--------|
| Auth/Users | `User`, `Role`, `UserRole`, `SolicitudOrganizador`, `EmailVerification`, `PasswordReset` |
| Tournaments | `Tournament`, `Category`, `TournamentCategory`, `TournamentModalidad`, `TournamentSponsor`, `TournamentPremio`, `Circuito` |
| Venues | `Sede`, `SedeCancha`, `TorneoSede`, `TorneoCancha`, `TorneoCanchaHorario` |
| Inscriptions | `Pareja`, `Inscripcion`, `Pago`, `ComprobantePago`, `Cupon` |
| Matches | `Match`, `Ranking`, `HistorialPuntos`, `ConfiguracionPuntos`, `ConfiguracionSistema` |
| Social | `Seguimiento`, `MensajePrivado`, `SolicitudJugar`, `Logro`, `UsuarioLogro`, `Bloqueo`, `Reporte` |
| Photos | `Foto`, `FotoJugador`, `Like`, `Comentario`, `Album`, `AlbumFoto`, `ReporteFoto` |
| Subscriptions | `PlanPremium`, `Suscripcion` |
| Categories | `ReglaAscenso`, `HistorialCategoria` |
| Notifications | `Notificacion` |

### Key Conventions
- All IDs: UUID (`@default(uuid())`)
- Timestamps: `createdAt` + `updatedAt` on all models
- Cascade deletes on all foreign keys
- Status fields use Prisma enums (not strings)
- Compound unique constraints for relationship tables

### Seed Data
- 3 roles: jugador, organizador, admin
- 16 categories (8 damas + 8 caballeros skill levels)
- Default admin user
- Point configuration templates
- 14 promotion rules (7 per gender: 8va→7ma through 2da→1ra)

---

## Authentication Flow

1. **Register:** Email/documento/telefono uniqueness → bcrypt hash → assign "jugador" role → send verification email
2. **Login:** Verify credentials → generate JWT (payload: id, documento, email, nombre, apellido, roles) → 24h expiry
3. **Protected routes:** `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('organizador')`
4. **Frontend:** Token persisted in localStorage, attached via Axios interceptor, cleared on logout

---

## API Routes Summary

| Module | Base Path | Auth |
|--------|-----------|------|
| Auth | `/api/auth` | Public (register, login) / Protected (profile) |
| Tournaments | `/api/tournaments` | Public (list, detail) / Protected (create, edit, delete) |
| Users | `/api/users` | Mixed |
| Inscripciones | `/api/inscripciones` | Protected |
| Parejas | `/api/parejas` | Protected |
| Matches | `/api/matches` | Protected |
| Rankings | `/api/rankings` | Public |
| Circuitos | `/api/circuitos` | Public (list, detail, standings) / Protected (admin CRUD, manage tournaments, finalize) |
| Pagos | `/api/pagos` | Protected |
| Fotos | `/api/fotos` | Protected |
| Social | `/api/social` | Protected |
| Notificaciones | `/api/notificaciones` | Protected |
| Suscripciones | `/api/suscripciones` | Mixed |
| Sedes | `/api/sedes` | Mixed (admin for create) |
| Categorías | `/api/admin/categorias` | Protected (admin only) |
| Admin | `/api/admin` | Protected (admin only) |

---

## Frontend Routes

| Path | Page | Access |
|------|------|--------|
| `/` | HomePage | Public |
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/verify-email` | VerifyEmailPage | Public |
| `/forgot-password` | ForgotPasswordPage | Public |
| `/tournaments` | TournamentsListPage | Public |
| `/tournaments/:id` | TournamentDetailPage | Public |
| `/tournaments/create` | CreateTournamentPage | Organizador |
| `/tournaments/:id/edit` | EditTournamentPage | Organizador |
| `/tournaments/:id/manage` | ManageTournamentPage | Organizador |
| `/rankings` | RankingsPage | Public |
| `/profile` | ProfilePage | Jugador |
| `/profile/edit` | EditProfilePage | Jugador |
| `/inscripciones` | MisInscripcionesPage | Jugador |
| `/inscripciones/nueva` | NuevaInscripcionPage | Jugador |
| `/admin` | AdminPage | Admin |
| `/admin/sedes` | AdminSedesPage | Admin |
| `/admin/organizadores` | AdminOrganizadoresPage | Admin |
| `/admin/moderacion` | AdminModeracionPage | Admin |
| `/admin/suscripciones` | AdminSuscripcionesPage | Admin |
| `/admin/circuitos` | AdminCircuitosPage | Admin |
| `/admin/categorias` | AdminCategoriasPage | Admin |
| `/admin/configuracion` | AdminConfiguracionPage | Admin |
| `/circuitos` | CircuitosListPage | Public |
| `/circuitos/:id` | CircuitoDetailPage | Public |
| `/tournaments/:tournamentId/fixture` | FixturePage | Public |

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/fairpadel
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
RESEND_API_KEY=...
FROM_EMAIL=onboarding@resend.dev
TIGO_BEEKUN_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
BANCARD_PUBLIC_KEY=...
BANCARD_PRIVATE_KEY=...
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:3000/api
```

---

## Deployment

**Platform:** Railway (backend) + Railway/static host (frontend)

### Backend (railway.json)
- **Build:** `npm install --legacy-peer-deps && npx prisma generate && npm run build`
- **Start:** `npx prisma migrate deploy && npm run seed && node dist/src/main.js`
- Restart on failure (max 10 retries)

### Heroku alternative (Procfile)
```
web: npx prisma migrate deploy && npm run start:prod
```

---

## Coding Conventions

### General
- Language: Spanish for domain terms (torneos, parejas, inscripciones, sedes, pagos) — English for technical code
- All IDs are UUIDs
- TypeScript strict mode in both packages
- ESLint + Prettier enforced

### Backend
- One NestJS module per domain feature
- DTOs in `dto/` subfolder with class-validator decorators
- Services handle business logic, controllers handle HTTP
- PrismaService injected via constructor DI
- Custom decorators: `@Roles()`, `@GetUser()`
- Error handling: NestJS built-in exceptions (BadRequest, NotFound, Forbidden, Conflict)
- `--legacy-peer-deps` required for npm install
- **NEVER commit `dist/`** — it's in `.gitignore`. Railway rebuilds from source via `npm run build`

### Frontend
- Feature-based directory structure under `src/features/`
- Shared UI components in `src/components/ui/`
- One Zustand store per domain (authStore persisted to localStorage)
- One service file per backend module in `src/services/`
- Centralized types in `src/types/index.ts`
- Tailwind utility classes, dark theme via `dark.*` custom colors
- Component variants via `class-variance-authority` (CVA)
- Protected routes via `<ProtectedRoute>` wrapper component

### Database
- Prisma schema at `backend/prisma/schema.prisma`
- Migrations in `backend/prisma/migrations/`
- Always run `npx prisma generate` after schema changes
- Seed with `npm run seed` after fresh migrations
