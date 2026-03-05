# CLAUDE CONTEXT — FairPadel Project Knowledge Base

> Última actualización: Marzo 2025
> Estado: En desarrollo — Migración v2 en progreso

---

## 1. ¿QUÉ ES FAIRPADEL?

**FairPadel** es una plataforma full-stack para gestión de torneos de pádel (padel tennis) enfocada en el mercado paraguayo.

**Funcionalidades principales:**
- Gestión de torneos (crear, publicar, inscribir, sortear fixture)
- Inscripciones de parejas con pagos (Bancard, transferencia, efectivo)
- Fixture con acomodación paraguaya (R1 → R2 → Bracket)
- Rankings globales y por categoría
- Gestión de sedes y canchas
- Circuitos/ligas de torneos
- Galería de fotos (Cloudinary)
- Sistema de notificaciones
- Subscripciones Premium
- Instructores y reservas de canchas

---

## 2. ESTRUCTURA TÉCNICA

### Monorepo
```
d:\fairpadel/
├── backend/          # API NestJS (puerto 3000)
│   ├── prisma/
│   │   ├── schema.prisma    # Schema actual (V2 en desarrollo)
│   │   ├── seed.ts          # Seed de datos iniciales
│   │   └── migrations/      # Migraciones de BD
│   └── src/
│       ├── auth/
│       ├── tournaments/
│       ├── inscripciones/   # ✅ NUEVO: Invitaciones
│       ├── matches/         # ✅ NUEVO: R2 Engine + Scheduling Engine
│       ├── commands/        # ✅ NUEVO: API v2 CQRS
│       └── ...
├── frontend/         # React + Vite (puerto 5173)
└── [docs]
```

### Tech Stack
- **Backend:** NestJS 10, Prisma 5, PostgreSQL, JWT Auth, Cloudinary, Resend
- **Frontend:** React 19, TailwindCSS, Zustand, React Query, Axios

---

## 3. PROBLEMA ACTUAL — CRÍTICO

### Situación
La base de datos en Railway (producción) **NO COINCIDE** con el schema de Prisma.

**BD Real (railway):**
```sql
users: id, documento, nombre, apellido, genero, email, telefono, 
       password_hash, fecha_nacimiento, ciudad, bio, foto_url, 
       estado, email_verificado, es_premium, ultima_sesion, 
       created_at, updated_at, categoria_actual_id
```

**Schema (prisma):**
```prisma
model User {
  id                      String
  email                   String       @unique
  password                String       // ❌ NO EXISTE EN BD
  nombre                  String
  apellido                String
  documento               String       @unique
  telefono                String?
  fechaNacimiento         DateTime?    @map("fecha_nacimiento")
  genero                  Gender
  ciudad                  String?
  pais                    String       @default("Paraguay")  // ❌ NO EXISTE EN BD
  fotoUrl                 String?      @map("foto_url")
  estado                  UserStatus   @default(NO_VERIFICADO)
  categoriaActualId       String?      @map("categoria_actual_id")
  esPremium               Boolean      @default(false) @map("es_premium")
  fechaFinPremium         DateTime?    @map("fecha_fin_premium")  // ❌ NO EXISTE
  stripeCustomerId        String?      @map("stripe_customer_id") // ❌ NO EXISTE
  stripeSubscriptionId    String?      @map("stripe_subscription_id") // ❌ NO EXISTE
  notificacionesEmail     Boolean      @default(true)  // ❌ NO EXISTE
  notificacionesSms       Boolean      @default(false) // ❌ NO EXISTE
  notificacionesPush      Boolean      @default(true)  // ❌ NO EXISTE
  ...
}
```

### Errores Actuales
1. ❌ `users.password` does not exist
2. ❌ `users.pais` does not exist
3. ❌ Seed falla porque espera campos que no existen

### Causa Probable
- Alguien modificó el schema agregando campos nuevos (pais, password, etc.)
- No se crearon migraciones para la BD existente
- Railway tiene la BD antigua, el código espera la BD nueva

---

## 4. HISTORIAL DE CAMBIOS RECIENTES (MIGRACIÓN V2)

### Semana 1-3: Fundamentos
- Corrección de enums (RECHAZADO/RECHAZADA, etc.)
- Actualización de tipos en frontend
- Tests pasando

### Semana 4: R2 Engine + Scheduling Engine ✅
- `src/matches/r2-engine/` — Motor de reglas para Zona 2
- `src/matches/scheduling-engine/` — Motor de scheduling de partidos

### Semana 5: Sistema de Invitaciones ✅
- `src/inscripciones/invitaciones.service.ts`
- Tabla `InvitacionJugador` en schema
- Sistema de email tokens para jugador2

### Semana 6: API de Comandos (CQRS) ✅
- `src/commands/` — Command Bus + Handlers
- API v2 en `/api/v2/commands/*`

---

## 5. DECISIONES PENDIENTES

### CRÍTICO: Schema vs BD — ✅ DECIDIDO
**Decisión:** El schema de Prisma es la fuente de verdad.

**Acción:** Migrar BD al nuevo schema (Opción B)

**Campos a agregar en BD:**
- `password` (String) — Reemplazará o coexistirá con `password_hash`
- `pais` (String, default: 'Paraguay')
- `fecha_fin_premium` (DateTime?)
- `stripe_customer_id` (String?)
- `stripe_subscription_id` (String?)
- `notificaciones_email` (Boolean, default: true)
- `notificaciones_sms` (Boolean, default: false)
- `notificaciones_push` (Boolean, default: true)

**Estado:** En progreso — Creando migración SQL

---

## 6. ARCHIVOS CLAVE PARA REFERENCIA

### Schema Original (backup)
Existe: `backend/prisma/schema.prisma.backup.20260304_171415`
Este es el schema ANTES de mis cambios. Debería coincidir con la BD.

### Schema Actual
`backend/prisma/schema.prisma` — Con cambios de migración v2

### Seed
`backend/prisma/seed.ts` — Falla porque usa campos que no existen en BD

### Servicios Modificados
- `auth.service.ts` — Usa `password` (debería usar `password_hash`?)
- `inscripciones.service.ts` — Nuevo sistema sin tabla Pareja
- `matches/fixture.service.ts` — Integra R2 Engine

---

## 7. REGLAS PARA MI (CLAUDE)

### ❌ PROHIBIDO HACER:
1. **NO** asumir que el schema es correcto
2. **NO** crear migraciones sin verificar BD real primero
3. **NO** cambiar campos en schema sin comparar con BD
4. **NO** agregar "auto-fixes" al código
5. **NO** eliminar campos existentes sin confirmar

### ✅ OBLIGATORIO HACER:
1. **SIEMPRE** comparar schema vs BD real antes de cambiar
2. **SIEMPRE** revisar backups del schema
3. **SIEMPRE** preguntar cuando haya inconsistencias
4. **SIEMPRE** probar en local antes de pushear
5. **SIEMPRE** documentar cambios en este archivo

### 🔍 INVESTIGAR PRIMERO:
- ¿Existe backup del schema original?
- ¿Qué campos tiene la BD real?
- ¿Cuál es el objetivo final de la migración v2?

---

## 8. ESTADO ACTUAL DE REPOS

| Repo | Commit | Estado |
|------|--------|--------|
| fairpadel-backend | `09d607c` | ⚠️ Schema inconsistente con BD |
| fairpadel-frontend | `7fc8003` | ✅ Tipos actualizados |

---

## 9. PROGRESO ACTUAL — MIGRACIÓN V2

### ✅ Completado:
1. **Decisión tomada:** Schema es fuente de verdad (migrar BD al schema)
2. **Migración SQL creada:** `20260305000001_migrate_to_v2_schema/migration.sql`
   - Agrega: `password`, `pais`, `fecha_fin_premium`, `stripe_customer_id`, etc.
3. **Seed limpiado:** Removido código de "auto-fix" innecesario

### 🔄 En progreso:
1. Commit y push de cambios
2. Deploy en Railway (ejecutará `migrate deploy` automáticamente)
3. Verificar que seed funcione

---

## NOTAS ADICIONALES

- Railway ejecuta: `npx prisma migrate deploy && npm run seed`
- La migración SQL verifica si cada columna existe antes de crearla (idempotente)
- Datos existentes se preservan (solo se agregan columnas, no se eliminan)

---

**Documento preparado por Claude después de revisar:**
- CLAUDE.md (306 líneas)
- AGENTS.md (200+ líneas)
- FairPadel_Features_Premium_Especificacion.md
- backend/prisma/schema.prisma
- backend/prisma/seed.ts
- .git/config (URLs de repos)
