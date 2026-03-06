# Kimi Context - FairPadel V2

> **Documento de respaldo de acciones realizadas**  
> **Propósito:** Mantener registro de decisiones técnicas, entregables completados y estado del proyecto para continuidad entre conversaciones.
> **Última actualización:** 2026-03-06  
> **Conversación actual:** Inicio reconstrucción FairPadel V2

---

## 📋 RESUMEN EJECUTIVO

**Proyecto:** FairPadel - Sistema de gestión de torneos de pádel para Paraguay  
**Estado:** Reconstrucción completa desde cero (V2)  
**Stack:** NestJS + React + PostgreSQL + Prisma  
**Metodología:** Entregables pequeños, atómicos y desplegables

---

## 🎯 ROADMAP V2 - ENTREGABLES

### FASE 0: Limpieza y Fundación
- [x] 0.0 Crear documento de contexto (este archivo)
- [x] 0.1 Archivar documentación legacy
- [x] 0.2 Eliminar archivos rotos/inútiles
- [ ] 0.3 Setup base V2

### FASE 1: Núcleo de Autenticación
- [ ] 1.1 Schema mínimo User/Role/UserRole
- [ ] 1.2 Auth Backend (Register, Login, JWT)
- [ ] 1.3 Auth Frontend (LoginPage, RegisterPage)
- [ ] 1.4 Deploy inicial Railway

### FASE 2: Gestión de Torneos
- [ ] 2.1 Modelo Tournament
- [ ] 2.2 Modelo Category
- [ ] 2.3 Relación TournamentCategory
- [ ] 2.4 Frontend Torneos

### FASE 3: Inscripciones
- [ ] 3.1 Modelo Inscripción (sin Pareja separada)
- [ ] 3.2 Sistema de Invitación
- [ ] 3.3 Máquina de Estados
- [ ] 3.4 Frontend Inscripciones

### FASE 4: Fixture Versionado
- [ ] 4.1 FixtureVersion inmutable
- [ ] 4.2 Algoritmo Sorteo
- [ ] 4.3 Sistema Acomodación Paraguaya
- [ ] 4.4 Visual Fixture

### FASE 5: Partidos y Rankings
- [ ] 5.1 Modelo Match
- [ ] 5.2 Carga Resultados
- [ ] 5.3 Rankings
- [ ] 5.4 Frontend Partidos

### FASE 6: Pagos
- [ ] 6.1 Entidad Pago independiente
- [ ] 6.2 Integración Bancard
- [ ] 6.3 Transferencias
- [ ] 6.4 Frontend Pagos

---

## 📝 REGISTRO DE ACCIONES

### 2026-03-06 - Inicio Proyecto

#### Acción: 0.1 Archivar Documentación Legacy
**Hora:** 11:22

**Archivos movidos a `archive/`:**

`archive/docs/:`
- FairPadel_Features_Premium_Especificacion.md
- FairPadel_Modulo_Instructores_Premium.md
- Arquitectura_Tecnica_FairPadel.docx
- Manual_de_Funcionalidad_FairPadel.docx
- MIGRACION_ARQUITECTURA_v2.md
- MIGRACION_V2_SIMPLIFICADA.md
- CLAUDE_v1.md (renombrado)
- CLAUDE_CONTEXT_v1.md (renombrado)
- ANALISIS_SEDES_ALQUILERES.md
- manual_temp.md

`archive/assets/:`
- Captura de pantalla 2026-02-15 000026.png
- PlaceholderPhotoBackground.jpg

`archive/scripts/:`
- fix-railway.ps1
- update-db-url.ps1

`archive/backups/:`
- BACKUP_ADMIN_CREDENCIALES.json

**Archivos conservados en root (útiles para V2):**
- AGENTS.md
- FAIRPADEL_CONTEXT_TRANSFER.md
- Kimi_Context_Fairpadel.md (este archivo)
- .gitignore

#### Acción: 0.2 Eliminar Archivos Rotos/Inútiles
**Hora:** 11:25

**Eliminados:**
- `nul` - archivo corrupto
- `package-lock.json` - dependencias obsoletas
- `backend/dist/` - 580 archivos compilados (se regeneran)
- `backend/node_modules/` - dependencias (reinstalar en V2)
- `frontend/node_modules/` - dependencias (reinstalar en V2)

**Estructura limpia:**
```
fairpadel/
├── .gitignore
├── AGENTS.md
├── FAIRPADEL_CONTEXT_TRANSFER.md
├── Kimi_Context_Fairpadel.md
├── archive/          # Documentación legacy
├── backend/          # Código fuente (limpio)
└── frontend/         # Código fuente (limpio)
```

---

### 2026-03-06 - Inicio Proyecto

**Contexto:** Sistema crasheado en producción, BD corrupta. Decisión de reconstrucción completa.

**Decisiones arquitectónicas aprobadas:**
1. NO hay entidad Pareja separada - inscripción directa
2. Fixture Versionado (inmutable) - permite re-sorteo con historial
3. Máquina de Estados explícita - transiciones definidas
4. Cola de Notificaciones async - Redis + Bull
5. Pagos como entidad independiente - desacoplado

**Estructura de entregables aprobada por usuario.**

**Archivos identificados para archivo:**
- FairPadel_Features_Premium_Especificacion.md
- FairPadel_Modulo_Instructores_Premium.md
- Arquitectura_Tecnica_FairPadel.docx
- Manual_de_Funcionalidad_FairPadel.docx
- MIGRACION_ARQUITECTURA_v2.md
- MIGRACION_V2_SIMPLIFICADA.md
- CLAUDE.md, CLAUDE_CONTEXT.md
- ANALISIS_SEDES_ALQUILERES.md
- Captura de pantalla 2026-02-15 000026.png
- PlaceholderPhotoBackground.jpg
- BACKUP_ADMIN_CREDENCIALES.json
- fix-railway.ps1, update-db-url.ps1
- manual_temp.md

**Archivos útiles a conservar:**
- AGENTS.md (actualizar a V2)
- FAIRPADEL_CONTEXT_TRANSFER.md (contexto negocio)
- backend/prisma/schema.prisma (referencia enums)
- backend/package.json (dependencias base)
- frontend/package.json
- frontend/src/components/ui/* (reutilizar componentes)

---

## 🗂️ ESTRUCTURA DE CARPETAS

```
fairpadel/
├── docs/                    # Documentación consolidada
│   ├── AGENTS_V2.md
│   └── ROADMAP_V2.md
├── archive/                 # Legacy renombrado
├── v2/                      # CÓDIGO NUEVO
│   ├── backend/
│   └── frontend/
├── Kimi_Context_Fairpadel.md   # Este archivo
└── docker-compose.yml
```

---

## 🔐 VARIABLES DE ENTORNO NECESARIAS

### Backend
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRATION=24h
FRONTEND_URL=...
PORT=3000
NODE_ENV=development
```

### Frontend
```
VITE_API_URL=http://localhost:3000/api
```

---

## ⚠️ DECISIONES TÉCNICAS PENDIENTES

- [ ] Versión Node.js exacta (recomendado: 20 LTS)
- [ ] Versión PostgreSQL en Railway
- [ ] Esquema de nombres para tablas (snake_case vs camelCase)
- [ ] Estrategia de migraciones (timestamp vs nombre descriptivo)

---

## 🚀 ESTADO ACTUAL

**Entregable completado:** 0.0 - Documento de contexto creado
**Entregables completados:** 0.0, 0.1, 0.2

**Próximo:** 0.3 - Setup base V2

---

*Documento mantenido por Kimi Code CLI - Actualizado en cada acción significativa*
