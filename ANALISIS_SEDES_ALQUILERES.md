# Análisis Completo: Gestión de Sedes y Alquileres

## 🔴 BUGS ENCONTRADOS

### 1. **Inconsistencia en Conteo de Canchas**
**Ubicación:** `AdminSedesPage.tsx` línea 580 y `AdminAlquileresPage.tsx` línea 78

**Problema:** El conteo de canchas se calcula de diferentes maneras:
- En AdminSedesPage: `canchas.filter((c) => c.activa !== false).length` (client-side)
- En AdminAlquileresPage: `s._count?.canchas` (server-side, incluye TODAS)

**Impacto:** El admin ve números inconsistentes entre páginas.

**Fix:** Usar siempre el mismo criterio - canchas activas.

### 2. **Validación Faltante en Creación de Cancha**
**Ubicación:** `sedes.service.ts` línea 262

**Problema:** No se valida que el nombre de la cancha sea único dentro de la sede.

**Impacto:** Pueden existir dos "Cancha 1" en la misma sede, causando confusión.

### 3. **Race Condition en Upload de Imágenes**
**Ubicación:** `AdminSedesPage.tsx` línea 720-746

**Problema:** Si el upload de imagen falla, la sede queda creada sin logo.

**Impacto:** Sedes sin imágenes que requieren edición manual posterior.

**Fix:** Usar transacción o rollback manual.

### 4. **Filtro de Canchas Inconsistente**
**Ubicación:** `sedes.service.ts` línea 121-123 vs línea 143-144

**Problema:** 
- `findAllSedes` incluye solo canchas activas
- `findOneSede` incluye TODAS las canchas

**Impacto:** Comportamiento inconsistente según el endpoint usado.

### 5. **Missing Index en Búsqueda de Sedes**
**Ubicación:** `sedes.service.ts` línea 100-112

**Problema:** Búsqueda por nombre/ciudad usa `contains` sin índices.

**Impacto:** Performance degradada con muchas sedes.

---

## 🟡 INCONSISTENCIAS ENCONTRADAS

### 1. **Campo `activa` vs `activo`**
**Problema:** 
- Sede usa `activo` (masculino)
- SedeCancha usa `activa` (femenino)

**Impacto:** Confusión en el código y filtros.

### 2. **Telefono en Múltiples Lugares**
**Ubicación:** 
- `Sede.telefono` - Teléfono general de la sede
- `AlquilerConfig.telefonoNotificaciones` - Teléfono específico para alquileres
- `User.telefono` - Teléfono del encargado/usuario

**Problema:** No está claro cuál se usa para qué.

### 3. **Relación Sede-AlquilerConfig**
**Problema:** La relación es 1:1 pero no está claro en la UI que una sede necesita ser "habilitada" para alquileres aparte de estar activa.

### 4. **Canchas en Admin Alquileres**
**Problema:** En `AdminAlquileresPage.tsx` se muestra `canchasCount` pero no se puede ver qué canchas específicas tiene cada sede desde esa vista.

---

## 🟠 ERRORES POTENCIALES

### 1. **No hay Validación de Torneos al Desactivar Cancha**
**Ubicación:** `sedes.service.ts` línea 339

**Problema:** El mensaje dice "Las canchas con partidos programados no pueden desactivarse" pero el código NO valida esto.

**Fix:** Agregar validación antes de desactivar.

### 2. **Soft Delete sin Verificación de Alquileres**
**Ubicación:** `sedes.service.ts` línea 205

**Problema:** Al desactivar una sede, no se verifica si tiene:
- Alquileres activos
- Reservas pendientes
- Configuración de alquiler

**Impacto:** Datos huérfanos en la BD.

### 3. **Memory Leak en Preview de Imágenes**
**Ubicación:** `AdminSedesPage.tsx` línea 47-49

**Problema:** `FileReader` crea URLs de objeto que nunca se revocan.

---

## 💡 MEJORAS UX SUGERIDAS

### Para Gestión de Sedes:

#### 1. **Wizard de Creación en 3 Pasos**
```
Paso 1: Datos Básicos (nombre, ciudad, dirección)
Paso 2: Imágenes (logo, fondo) con preview
Paso 3: Canchas (agregar múltiples canchas de una vez)
```

#### 2. **Indicador Visual de Estado Completo**
Cada sede debería mostrar:
- ✅ Sede activa
- ⚠️ Sin canchas registradas
- 🏷️ Sin logo
- 🔑 Sin alquiler habilitado

#### 3. **Búsqueda con Autocomplete de Ciudad**
Usar el `CityAutocomplete` existente en lugar de input libre.

#### 4. **Vista Kanban de Canchas**
Mostrar canchas como cards arrastrables en un canvas visual.

#### 5. **Validación en Tiempo Real**
- Nombre único por sede
- Teléfono válido paraguayo
- URL de maps válida

### Para Admin Alquileres:

#### 1. **Integrar Ambas Vistas**
**Propuesta:** Unificar "Gestión de Sedes" y "Admin Alquileres" en una sola página con tabs:

```
┌─────────────────────────────────────────┐
│ SEDE: Club Coliseo                      │
│ [Tab: General] [Tab: Canchas] [Tab: Alquiler] │
└─────────────────────────────────────────┘
```

#### 2. **Flujo de Habilitación Mejorado**
```
1. Admin selecciona sede existente
2. Sistema verifica: ¿Tiene canchas activas? 
   - NO → Mensaje: "Registre canchas primero"
   - SÍ → Continuar
3. Buscar encargado por documento
4. Configurar opciones (duración turno, anticipación, etc.)
5. Habilitar
```

#### 3. **Validación de Canchas antes de Habilitar**
No permitir habilitar alquiler si la sede no tiene canchas activas.

#### 4. **Indicador de Estado de Conexión**
Mostrar claramente:
- Sede física existe ✓
- Canchas registradas: N ✓
- Alquiler habilitado: Sí/No
- Encargado asignado: Nombre ✓

#### 5. **Preview de Configuración**
Antes de habilitar, mostrar resumen:
```
Resumen de habilitación:
- Sede: Club Coliseo
- Canchas disponibles: 8
- Encargado: Juan Pérez
- Duración turno: 90 min
- Notificaciones SMS a: +595971...
```

---

## 🔧 ARQUITECTURA RECOMENDADA

### Opción 1: Consolidar en Un Solo Flujo
```
Admin Sedes
├── Lista de Sedes
│   └── Cada sede muestra:
│       ├── Estado: Activa/Inactiva
│       ├── Canchas: N activas
│       └── Alquiler: Habilitado/Sin habilitar
│
└── Detalle de Sede (drawer/modal)
    ├── Tab: Información General
    ├── Tab: Canchas (CRUD completo)
    └── Tab: Configuración de Alquiler
        └── Si no está habilitado: Botón "Habilitar Alquiler"
```

### Opción 2: Mantener Separado pero Conectar
- Agregar botón "Ir a Configuración de Alquiler" en cada sede
- En Admin Alquileres, agregar "Ver Sedes" para ver canchas detalladas
- Mostrar warning si se intenta habilitar sede sin canchas

---

## 📝 SCHEMA RECOMENDADO (Mejoras)

### Agregar Campos de Auditoría:
```prisma
model Sede {
  // ... campos existentes ...
  
  // Nuevos campos
  alquilerHabilitado    Boolean   @default(false)
  totalCanchasActivas   Int       @default(0)  // Denormalizado para performance
  
  @@index([ciudad, activo])
  @@index([nombre])
}
```

### Constraints:
```prisma
// Cancha nombre único por sede
model SedeCancha {
  // ... campos ...
  
  @@unique([sedeId, nombre])
}
```

---

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### Alta Prioridad (Bugs Críticos):
1. ✅ Validar canchas antes de habilitar alquiler
2. ✅ Fix conteo inconsistente de canchas
3. ✅ Validar nombre único de cancha

### Media Prioridad (Mejoras UX):
1. Indicador visual de estado completo
2. Integrar vistas de sede y alquiler
3. Wizard de habilitación mejorado

### Baja Prioridad (Optimizaciones):
1. Índices en BD
2. Denormalización de conteos
3. Optimización de queries

---

## 📊 FLUJO RECOMENDADO FINAL

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN CREA SEDE                                          │
│    ├── Completa datos básicos                              │
│    └── Sube logo/fondo (Cloudinary)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ADMIN REGISTRA CANCHAS                                   │
│    └── Agrega N canchas a la sede                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ADMIN HABILITA ALQUILER                                  │
│    ├── Sistema valida: ¿Tiene canchas?                     │
│    ├── Busca encargado por documento                       │
│    ├── Configura opciones                                  │
│    └── Habilita                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ENCARGADO GESTIONA                                       │
│    ├── Configura disponibilidad horaria                    │
│    ├── Configura precios                                   │
│    └── Gestiona reservas                                   │
└─────────────────────────────────────────────────────────────┘
```

---

*Análisis realizado el 02/03/2026*
*Estado: Pendiente de revisión y priorización*
