# 🚀 FairPadel v2 - Plan Simplificado (4 Semanas)

## Contexto
- No hay usuarios reales en el sistema
- Breaking changes permitidos
- No se requiere Redis ni infraestructura adicional
- Único requisito: preservar perfil admin (`admin@fairpadel.com`)

---

## 📅 CRONOGRAMA

### Semana 1: Schema y Modelos
**Objetivo:** Nuevo schema de BD con las entidades revisadas

| Día | Tarea |
|-----|-------|
| 1-2 | Nuevo schema.prisma (sin tabla Pareja, Fixture versionado, Pagos separados) |
| 3 | Scripts de migración de datos (preservar solo admin) |
| 4 | Regenerar Prisma client y validar |
| 5 | Tests básicos de conexión |

**Entregable:** BD con nuevo schema, solo admin presente.

---

### Semana 2: Backend Core
**Objetivo:** Servicios reescritos con nueva arquitectura

| Día | Tarea |
|-----|-------|
| 1 | TournamentService (sin cambios mayores) |
| 2 | FixtureService v2 (versionado, inmutable) |
| 3 | InscripcionService v2 (sin entidad Pareja) |
| 4 | PagoService independiente |
| 5 | MatchService con avance de bracket corregido |

**Entregable:** Backend funcional con nuevos servicios.

---

### Semana 3: API y Comandos
**Objetivo:** API orientada a comandos, endpoints actualizados

| Día | Tarea |
|-----|-------|
| 1 | Command handlers (CrearTorneo, Inscribirse, CargarResultado) |
| 2 | Controllers refactorizados |
| 3 | DTOs y validaciones actualizadas |
| 4 | Integración completa backend |
| 5 | Tests de integración críticos |

**Entregable:** API v2 funcionando end-to-end.

---

### Semana 4: Frontend y Polish
**Objetivo:** Frontend adaptado y sistema completo

| Día | Tarea |
|-----|-------|
| 1 | Servicios de frontend actualizados |
| 2 | Componentes de inscripción refactorizados |
| 3 | Componentes de fixture actualizados |
| 4 | Flujo completo testeado |
| 5 | Documentación y cleanup |

**Entregable:** Sistema completo funcionando.

---

## ✅ CHECKPOINT SEMANAL

Antes de pasar a la siguiente semana:
1. [ ] Build exitoso
2. [ ] TypeScript sin errores
3. [ ] Admin puede loguearse
4. [ ] Flujo básico funciona (crear torneo → inscribirse → sortear)

---

## 🚨 ROLLBACK

Si algo falla gravemente:
```bash
# Restaurar desde backup admin
# Recrear BD con schema anterior
# Re-seed con admin únicamente
```

---

**¿Procedemos con Semana 1?**
