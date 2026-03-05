# 🏗️ Plan de Migración Arquitectónica FairPadel v2

## Objetivo
Transformar la arquitectura de torneos según las especificaciones técnicas definidas, manteniendo 100% de datos históricos y zero downtime.

---

## 📅 CRONOGRAMA DE 6 SEMANAS

### Semana 1: Fundamentos y Seguridad
**Objetivo:** Preparar el terreno para cambios seguros

| Día | Tarea | Entregable |
|-----|-------|------------|
| 1-2 | Tests de integración del flujo actual | Suite de tests e2e críticos |
| 3 | Feature flags infrastructure | Sistema de flags funcional |
| 4-5 | Backup automatizado y rollback | Scripts de backup/restore |

**Checkpoint:** ¿Podemos deployar con confianza?

---

### Semana 2: Notificaciones Async (Bajo Riesgo)
**Objetivo:** Desacoplar notificaciones del flujo principal

| Día | Tarea | Entregable |
|-----|-------|------------|
| 1 | Setup Redis + Bull queue | Queue funcionando en dev |
| 2 | Migrar notificaciones a cola | Notificaciones async funcionando |
| 3 | Fallback sync + monitoreo | Dashboard de queue |
| 4-5 | Tests y staging | Validación en ambiente de prueba |

**Checkpoint:** ¿Las notificaciones funcionan igual o mejor?

---

### Semana 3: Fixture Versionado (Alto Riesgo)
**Objetivo:** Hacer el fixture inmutable y versionado

| Día | Tarea | Entregable |
|-----|-------|------------|
| 1-2 | Schema nuevo: FixtureVersion | Tablas nuevas creadas |
| 3 | Dual-write (escribir en ambos) | Datos sincronizados |
| 4 | Migración histórica | Fixtures históricos migrados |
| 5 | Switch de lectura | Leer de nueva tabla |

**Checkpoint:** ¿Los sorteos funcionan igual?

---

### Semana 4: R2 Declarativo y Scheduling
**Objetivo:** Automatizar el armado de zona 2

| Día | Tarea | Entregable |
|-----|-------|------------|
| 1-2 | Motor de reglas R2 | Reglas configurables |
| 3 | Dual-run (comparar algoritmos) | Validación de paridad |
| 4 | Scheduling engine separado | Motor de scheduling |
| 5 | Integración y tests | R2 se arma automáticamente |

**Checkpoint:** ¿R2 funciona sin intervención manual?

---

### Semana 5: Refactor de Inscripciones y Pagos
**Objetivo:** Desacoplar pagos y simplificar parejas

| Día | Tarea | Entregable |
|-----|-------|------------|
| 1-2 | Entidad Pago independiente | Tabla Pagos migrada |
| 3 | Sistema de invitaciones | Invitaciones funcionando |
| 4 | Deprecar entidad Pareja (soft) | Pareja opcional |
| 5 | Tests de regresión | Inscripciones funcionando |

**Checkpoint:** ¿Los pagos funcionan igual?

---

### Semana 6: API de Comandos y Polish
**Objetivo:** API orientada a comandos y documentación

| Día | Tarea | Entregable |
|-----|-------|------------|
| 1-2 | Command handlers principales | Commands funcionando |
| 3 | Migración endpoints críticos | API v2 disponible |
| 4 | Documentación y monitoreo | Docs actualizadas |
| 5 | Performance tuning y cleanup | Sistema optimizado |

**Checkpoint:** ¿Todo funciona mejor que antes?

---

## 🚦 CRITERIOS DE ÉXITO POR FASE

1. **Tests pasan:** Suite completa verde
2. **Datos consistentes:** Validación de integridad
3. **Performance:** Igual o mejor que antes
4. **Rollback ready:** Puede revertirse en < 5 minutos

---

## 🚨 PROTOCOLO DE EMERGENCIA

Si algo sale mal en producción:

1. **Feature flag OFF** → Comportamiento anterior
2. **Rollback BD** → Último backup conocido
3. **Comunicación** → Avisar a usuarios activos

---

## 📋 DECISIONES PENDIENTES DEL PRODUCT OWNER

### 1. Conservar historial de parejas?
```
Opción A: Mantener tabla Pareja como read-only histórico
Opción B: Migrar todo a nuevo formato (pierde consultas antiguas)
```

### 2. Compatibilidad API?
```
Opción A: API v1 y v2 coexisten (doble mantenimiento temporal)
Opción B: Breaking change coordinado (aviso previo a usuarios)
```

### 3. Ventana de mantenimiento?
```
Opción A: Zero downtime (más complejo)
Opción B: Ventana programada 2-4 AM (más simple)
```

---

## ✅ CHECKPOINT INICIAL

Antes de empezar Semana 1, necesito confirmación de:

- [ ] Aprobación del plan general
- [ ] Acceso a ambiente de staging
- [ ] Backup actual de producción verificado
- [ ] Decisiones pendientes respondidas

---

**¿Procedemos con Semana 1?**
