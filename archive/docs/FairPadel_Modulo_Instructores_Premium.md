# 🎾 FAIRPADEL — MÓDULO INSTRUCTORES PREMIUM

> Especificación completa del vertical de negocio para profesores/instructores de pádel.
> Incluye: features detallados, flujos de usuario, estructura de base de datos y modelo de negocio.

---

## 📋 ÍNDICE

1. [Visión General](#1-visión-general)
2. [Registro y Perfil del Instructor](#2-registro-y-perfil-del-instructor)
3. [Calendario y Agenda](#3-calendario-y-agenda)
4. [Sistema de Reservas](#4-sistema-de-reservas)
5. [Gestión de Alumnos](#5-gestión-de-alumnos)
6. [Sistema Financiero](#6-sistema-financiero)
7. [Comunicación y Notificaciones](#7-comunicación-y-notificaciones)
8. [Perfil Público y Marketing](#8-perfil-público-y-marketing)
9. [Dashboard y Reportes](#9-dashboard-y-reportes)
10. [Herramientas de Enseñanza](#10-herramientas-de-enseñanza)
11. [Estructura de Base de Datos](#11-estructura-de-base-de-datos)
12. [API Endpoints](#12-api-endpoints)
13. [Modelo de Precios](#13-modelo-de-precios)
14. [Roadmap de Implementación](#14-roadmap-de-implementación)

---

# 1. VISIÓN GENERAL

## 1.1 Propuesta de Valor

**Para Instructores:**
> "Gestioná todas tus clases, alumnos y cobros desde un solo lugar. 
> Dejá de usar WhatsApp para agendar y Excel para cobrar."

**Para Alumnos:**
> "Encontrá el instructor perfecto cerca tuyo y reservá clases en segundos."

## 1.2 Flujo General del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   INSTRUCTOR                           ALUMNO                       │
│   ──────────                           ──────                       │
│                                                                     │
│   1. Se registra como instructor       1. Busca instructores        │
│          ↓                                    ↓                     │
│   2. Configura perfil y tarifas        2. Ve perfil público         │
│          ↓                                    ↓                     │
│   3. Define disponibilidad             3. Elige horario disponible  │
│          ↓                                    ↓                     │
│   4. Recibe solicitud de reserva  ←──  4. Solicita reserva          │
│          ↓                                    ↓                     │
│   5. Confirma/rechaza                  5. Recibe confirmación       │
│          ↓                                    ↓                     │
│   6. Da la clase                       6. Toma la clase             │
│          ↓                                    ↓                     │
│   7. Cobra (online o presencial)       7. Paga                      │
│          ↓                                    ↓                     │
│   8. Ve reportes de ingresos           8. Deja reseña               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 1.3 Tipos de Usuario en el Módulo

| Tipo | Descripción | Acceso |
|------|-------------|--------|
| **Instructor Free** | Perfil básico, sin gestión | Solo perfil público |
| **Instructor Básico** | Gestión limitada | 20 alumnos, 50 SMS/mes |
| **Instructor Pro** | Gestión completa | Ilimitado, pago online |
| **Academia** | Multi-instructor | Hasta 5 instructores |
| **Alumno** | Cualquier usuario FairPadel | Buscar y reservar |

---

# 2. REGISTRO Y PERFIL DEL INSTRUCTOR

## 2.1 Flujo de Registro

### Paso 1: Solicitar ser Instructor
```
┌─────────────────────────────────────────────────────────────────┐
│  🎾 ¿ERES INSTRUCTOR DE PÁDEL?                                  │
│                                                                 │
│  Conocé nuestro sistema especial para vos:                      │
│                                                                 │
│  ✓ Gestioná tu agenda de clases                                │
│  ✓ Administrá tus alumnos                                       │
│  ✓ Cobrá online con Bancard                                    │
│  ✓ Enviá recordatorios automáticos                             │
│  ✓ Aparecé en el buscador de instructores                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            🚀 QUIERO SER INSTRUCTOR                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ¿Ya sos instructor? [Iniciar sesión]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Paso 2: Formulario de Registro
```
┌─────────────────────────────────────────────────────────────────┐
│  📝 REGISTRO DE INSTRUCTOR                          Paso 1 de 3 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DATOS PERSONALES                                               │
│  ─────────────────                                              │
│                                                                 │
│  Nombre completo: *                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Héctor Velázquez                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Documento de identidad: *                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4.567.890                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Teléfono (WhatsApp): *                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ +595 982 985 928                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Email: *                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ hector@email.com                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Ciudad principal: *                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Ciudad del Este                                      ▼  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                          [Siguiente →]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Paso 3: Experiencia y Certificaciones
```
┌─────────────────────────────────────────────────────────────────┐
│  📝 REGISTRO DE INSTRUCTOR                          Paso 2 de 3 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  EXPERIENCIA Y CERTIFICACIONES                                  │
│  ─────────────────────────────                                  │
│                                                                 │
│  Años de experiencia como instructor: *                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 5 años                                               ▼  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ¿Tenés certificaciones? (opcional)                            │
│  ☑ Certificación FEPARPA                                       │
│  ☐ Certificación FIP                                           │
│  ☐ Certificación WPT                                           │
│  ☑ Otra: [Curso Academia XYZ]                                  │
│                                                                 │
│  📎 Subir certificados (PDF o imagen):                         │
│  [+ Agregar archivo]                                           │
│  • certificado_feparpa.pdf ✓                                   │
│                                                                 │
│  Breve descripción de tu experiencia: *                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Ex jugador profesional con 5 años de experiencia      │   │
│  │ enseñando. Especialista en técnica de volea y         │   │
│  │ trabajo con principiantes.                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ¿Qué niveles enseñás? *                                       │
│  ☑ Principiante                                                │
│  ☑ Intermedio                                                  │
│  ☑ Avanzado                                                    │
│  ☐ Competitivo/Profesional                                     │
│                                                                 │
│                              [← Anterior]  [Siguiente →]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Paso 4: Ubicaciones y Tarifas
```
┌─────────────────────────────────────────────────────────────────┐
│  📝 REGISTRO DE INSTRUCTOR                          Paso 3 de 3 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  UBICACIONES DONDE DAS CLASES                                   │
│  ────────────────────────────                                   │
│                                                                 │
│  Seleccioná los clubes donde das clases:                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 Buscar club...                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Clubes seleccionados:                                         │
│  • La Quinta Sport (Ciudad del Este) [×]                       │
│  • Blue Padel (Asunción) [×]                                   │
│  [+ Agregar club]                                              │
│                                                                 │
│  ☐ También doy clases a domicilio                              │
│                                                                 │
│  TARIFAS                                                        │
│  ───────                                                        │
│                                                                 │
│  Precio por clase individual (1 hora): *                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Gs. 150.000                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Precio clase grupal (2-4 personas, por persona): *             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Gs. 80.000                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ☑ Ofrezco paquetes con descuento                              │
│    10 clases por: Gs. 1.200.000 (20% descuento)                │
│                                                                 │
│                              [← Anterior]  [Enviar solicitud]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Paso 5: Verificación y Aprobación
```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ SOLICITUD ENVIADA                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ¡Gracias por registrarte como instructor!                      │
│                                                                 │
│  Tu solicitud está siendo revisada por nuestro equipo.          │
│  Te notificaremos por email en un máximo de 48 horas.           │
│                                                                 │
│  Mientras tanto, podés:                                         │
│                                                                 │
│  • Completar tu perfil de jugador                               │
│  • Explorar torneos disponibles                                 │
│  • Conocer otros instructores                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              🏠 IR AL INICIO                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2.2 Panel de Administración (Aprobar Instructores)

```
┌─────────────────────────────────────────────────────────────────┐
│  👨‍💼 ADMIN: SOLICITUDES DE INSTRUCTORES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Pendientes (3) | Aprobados | Rechazados                        │
│  ═══════════════════════════════════════                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📷 HÉCTOR VELÁZQUEZ                                     │   │
│  │ Solicitado: 15 Feb 2026 | Ciudad del Este              │   │
│  │                                                         │   │
│  │ Experiencia: 5 años                                     │   │
│  │ Certificaciones: FEPARPA ✓                             │   │
│  │ Clubes: La Quinta, Blue Padel                          │   │
│  │                                                         │   │
│  │ 📎 Ver certificados                                    │   │
│  │                                                         │   │
│  │ [✅ Aprobar]  [❌ Rechazar]  [💬 Pedir más info]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 3. CALENDARIO Y AGENDA

## 3.1 Vista Principal del Calendario

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📅 MI AGENDA                                         Instructor Pro ⭐ │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [< Anterior]     MARZO 2026     [Siguiente >]                          │
│                                                                         │
│  [Día]  [Semana]  [Mes]                    [+ Nueva Clase]              │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │     LUN 16    MAR 17    MIÉ 18    JUE 19    VIE 20    SÁB 21    │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │ 08:00                   🟢        🟢                   🟢        │ │
│  │       ░░░░░░░░ Juan P.  Disp.     Disp.     ░░░░░░░░  Disp.      │ │
│  │                                                                   │ │
│  │ 09:00 🟢       🔵       🟢        🟢        ░░░░░░░░  🔵         │ │
│  │       Disp.    María G. Disp.     Disp.               Carlos M.  │ │
│  │               (Grupal)                                (Individual)│ │
│  │                                                                   │ │
│  │ 10:00 🔵       🔵       🟢        🟢        ░░░░░░░░  🔵         │ │
│  │       Pedro S. María G. Disp.     Disp.               Ana R.     │ │
│  │       (Indiv)  (cont.)                                (Indiv)    │ │
│  │                                                                   │ │
│  │ 11:00 🟢       🟢       🟡        🟢        ░░░░░░░░  🟢         │ │
│  │       Disp.    Disp.    Pendiente Disp.               Disp.      │ │
│  │                        (Roberto)                                  │ │
│  │                                                                   │ │
│  │ 12:00 ░░░░░░░░ ░░░░░░░░ ░░░░░░░░ ░░░░░░░░ ░░░░░░░░  ░░░░░░░░   │ │
│  │       ALMUERZO ─────────────────────────────────────────────     │ │
│  │                                                                   │ │
│  │ ...                                                               │ │
│  │                                                                   │ │
│  │ 16:00 🔵       🟢       🔵        🟢        🟢        ░░░░░░░░   │ │
│  │       Grupo    Disp.    Laura H.  Disp.     Disp.               │ │
│  │       Princ.            (Indiv)                                  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  LEYENDA:                                                               │
│  🟢 Disponible  🔵 Clase confirmada  🟡 Pendiente  ░░░ Bloqueado       │
│                                                                         │
│  📊 RESUMEN DE LA SEMANA:                                              │
│  • Clases programadas: 12                                               │
│  • Horas de trabajo: 14h                                               │
│  • Ingresos esperados: Gs. 1.650.000                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Configurar Disponibilidad

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ CONFIGURAR DISPONIBILIDAD                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HORARIOS REGULARES                                             │
│  ──────────────────                                             │
│                                                                 │
│  Define tus horarios de trabajo semanales:                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ LUNES                                                   │   │
│  │ ☑ Activo                                               │   │
│  │ Mañana:  [08:00 ▼] a [12:00 ▼]                        │   │
│  │ Tarde:   [16:00 ▼] a [20:00 ▼]                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ MARTES                                                  │   │
│  │ ☑ Activo                                               │   │
│  │ Mañana:  [08:00 ▼] a [12:00 ▼]                        │   │
│  │ Tarde:   [16:00 ▼] a [20:00 ▼]                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ MIÉRCOLES                                               │   │
│  │ ☑ Activo                                               │   │
│  │ Mañana:  [08:00 ▼] a [12:00 ▼]                        │   │
│  │ Tarde:   [──:── ▼] a [──:── ▼] (sin tarde)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ... (Jueves, Viernes, Sábado, Domingo)                        │
│                                                                 │
│  DURACIÓN DE CLASES                                             │
│  ──────────────────                                             │
│                                                                 │
│  Duración estándar de clase: [60 min ▼]                        │
│  Tiempo entre clases (descanso): [15 min ▼]                    │
│                                                                 │
│  BLOQUEOS ESPECIALES                                            │
│  ────────────────────                                           │
│                                                                 │
│  [+ Bloquear fechas específicas]                               │
│                                                                 │
│  Fechas bloqueadas:                                             │
│  • 20-27 Marzo 2026 (Vacaciones) [×]                           │
│  • 1 Abril 2026 (Feriado) [×]                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               💾 GUARDAR CONFIGURACIÓN                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3.3 Crear Nueva Clase

```
┌─────────────────────────────────────────────────────────────────┐
│  ➕ NUEVA CLASE                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TIPO DE CLASE                                                  │
│  ─────────────                                                  │
│                                                                 │
│  ○ Clase Individual (1 alumno)                                  │
│  ● Clase Grupal (2-4 alumnos)                                  │
│  ○ Clase de Parejas (2 alumnos que juegan juntos)              │
│                                                                 │
│  FECHA Y HORA                                                   │
│  ────────────                                                   │
│                                                                 │
│  Fecha: [18/03/2026]  Hora: [09:00 ▼]                          │
│  Duración: [60 min ▼]                                          │
│                                                                 │
│  ☐ Repetir semanalmente                                        │
│    Hasta: [____/____/______]                                    │
│                                                                 │
│  ALUMNO(S)                                                      │
│  ─────────                                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 Buscar alumno...                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Alumnos seleccionados (2/4):                                  │
│  • María González [×]                                          │
│  • Carlos Mendez [×]                                           │
│  [+ Agregar alumno]                                            │
│                                                                 │
│  UBICACIÓN                                                      │
│  ─────────                                                      │
│                                                                 │
│  Club: [La Quinta Sport ▼]                                     │
│  Cancha: [Cancha 3 ▼] (opcional)                               │
│                                                                 │
│  PRECIO                                                         │
│  ──────                                                         │
│                                                                 │
│  Precio por persona: Gs. 80.000 (grupal)                       │
│  Total de la clase: Gs. 160.000                                │
│                                                                 │
│  ☐ Cobrar ahora                                                │
│  ● Cobrar después                                               │
│  ☐ Descontar de paquete                                        │
│                                                                 │
│  NOTAS (opcional)                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Trabajar técnica de bandeja                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Cancelar]                    [✅ CREAR CLASE]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3.4 Clases Recurrentes

```
┌─────────────────────────────────────────────────────────────────┐
│  🔄 CONFIGURAR CLASE RECURRENTE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Alumno: María González                                         │
│  Horario: Martes y Jueves, 09:00 - 10:00                       │
│                                                                 │
│  PATRÓN DE REPETICIÓN                                           │
│  ────────────────────                                           │
│                                                                 │
│  Repetir: [Semanalmente ▼]                                     │
│                                                                 │
│  Días: ☐Lu  ☑Ma  ☐Mi  ☑Ju  ☐Vi  ☐Sá  ☐Do                     │
│                                                                 │
│  FIN DE LA RECURRENCIA                                          │
│  ─────────────────────                                          │
│                                                                 │
│  ○ Nunca (indefinido)                                           │
│  ○ Después de [12] clases                                       │
│  ● Hasta fecha: [30/06/2026]                                   │
│                                                                 │
│  VISTA PREVIA                                                   │
│  ────────────                                                   │
│                                                                 │
│  Se crearán 28 clases:                                         │
│  • Mar 17, 19, 24, 26 Marzo                                    │
│  • Mar 2, 7, 9, 14... (continúa)                               │
│                                                                 │
│  Total: 28 clases × Gs. 150.000 = Gs. 4.200.000                │
│                                                                 │
│  FACTURACIÓN                                                    │
│  ──────────                                                     │
│                                                                 │
│  ○ Cobrar clase por clase                                       │
│  ● Cobrar mensualmente (4 clases × Gs. 150.000 = Gs. 600.000) │
│  ○ Cobrar todo por adelantado (10% descuento)                  │
│                                                                 │
│  [Cancelar]                    [✅ CREAR SERIE]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 4. SISTEMA DE RESERVAS

## 4.1 Vista del Alumno: Reservar Clase

```
┌─────────────────────────────────────────────────────────────────┐
│  🎾 RESERVAR CLASE CON HÉCTOR VELÁZQUEZ                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📷 Héctor Velázquez                                           │
│  ⭐ 4.9 (45 reseñas) | 📍 Ciudad del Este                      │
│  💰 Individual: Gs. 150.000 | Grupal: Gs. 80.000/persona       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  PASO 1: Elegí el tipo de clase                                │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ 👤 INDIVIDUAL    │  │ 👥 GRUPAL        │                    │
│  │                  │  │                  │                    │
│  │ Solo vos con el  │  │ 2-4 personas    │                    │
│  │ instructor       │  │ (más económico)  │                    │
│  │                  │  │                  │                    │
│  │ Gs. 150.000      │  │ Gs. 80.000/pers │                    │
│  │                  │  │                  │                    │
│  │ [SELECCIONAR]    │  │ [SELECCIONAR]    │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  PASO 2: Elegí fecha y hora                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [< Mar]           MARZO 2026            [Abr >]        │   │
│  │                                                         │   │
│  │  Lu  Ma  Mi  Ju  Vi  Sá  Do                            │   │
│  │  16  17  18  19  20  21  22                            │   │
│  │  ○   ○   ●   ○   ○   ○   ─                             │   │
│  │  23  24  25  26  27  28  29                            │   │
│  │  ○   ○   ○   ○   ○   ○   ─                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Horarios disponibles el Mié 18:                               │
│                                                                 │
│  [08:00] [09:00] [10:00] [11:00]                               │
│  [16:00] [17:00] [18:00] [19:00]                               │
│                                                                 │
│  Seleccionado: Miércoles 18 Marzo, 10:00                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  PASO 3: Elegí ubicación                                       │
│                                                                 │
│  ● La Quinta Sport (Ciudad del Este)                           │
│  ○ Blue Padel (Asunción)                                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  RESUMEN                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Clase individual con Héctor Velázquez                   │   │
│  │ 📅 Miércoles 18 Marzo, 10:00 - 11:00                   │   │
│  │ 📍 La Quinta Sport                                      │   │
│  │ 💰 Total: Gs. 150.000                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            📩 ENVIAR SOLICITUD DE RESERVA               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ La reserva queda sujeta a confirmación del instructor      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4.2 Vista del Instructor: Solicitudes Pendientes

```
┌─────────────────────────────────────────────────────────────────┐
│  📥 SOLICITUDES DE RESERVA                          3 pendientes │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🆕 NUEVA SOLICITUD                      Hace 5 minutos  │   │
│  │ ───────────────────────────────────────────────────────│   │
│  │                                                         │   │
│  │ 📷 ROBERTO SILVA                                        │   │
│  │ 📱 +595 981 234 567                                    │   │
│  │                                                         │   │
│  │ 📅 Miércoles 18 Marzo, 11:00 - 12:00                   │   │
│  │ 📍 La Quinta Sport                                      │   │
│  │ 👤 Clase Individual                                     │   │
│  │ 💰 Gs. 150.000                                         │   │
│  │                                                         │   │
│  │ 💬 Mensaje: "Soy principiante, quiero mejorar mi      │   │
│  │            técnica básica"                             │   │
│  │                                                         │   │
│  │ ℹ️ Alumno nuevo (primera clase contigo)                │   │
│  │                                                         │   │
│  │ [✅ Confirmar]  [❌ Rechazar]  [📅 Proponer otro hora] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🟡 PENDIENTE                            Hace 2 horas    │   │
│  │ ───────────────────────────────────────────────────────│   │
│  │                                                         │   │
│  │ 📷 MARÍA GONZÁLEZ (Alumna regular)                     │   │
│  │ 📅 Jueves 19 Marzo, 09:00 - 10:00                      │   │
│  │ 📍 La Quinta Sport                                      │   │
│  │ 👥 Clase Grupal (ella + 1 amiga)                       │   │
│  │ 💰 Gs. 160.000 (80.000 × 2)                           │   │
│  │                                                         │   │
│  │ ⚠️ Conflicto: Ya tenés clase con Pedro a esa hora      │   │
│  │                                                         │   │
│  │ [✅ Confirmar]  [❌ Rechazar]  [📅 Proponer otro hora] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4.3 Confirmación Automática vs Manual

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ CONFIGURACIÓN DE RESERVAS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MODO DE CONFIRMACIÓN                                           │
│  ────────────────────                                           │
│                                                                 │
│  ○ Confirmación manual                                          │
│    Revisás cada solicitud antes de aceptar                     │
│                                                                 │
│  ● Confirmación automática                                      │
│    Las reservas se confirman solas si el horario está libre    │
│                                                                 │
│    Condiciones para auto-confirmar:                            │
│    ☑ Solo alumnos que ya tuve antes                            │
│    ☐ Cualquier alumno con perfil verificado                    │
│    ☑ Solo si tiene paquete/crédito disponible                 │
│                                                                 │
│  POLÍTICA DE CANCELACIÓN                                        │
│  ────────────────────────                                       │
│                                                                 │
│  Cancelación gratuita hasta: [24 horas ▼] antes                │
│                                                                 │
│  Después de ese plazo:                                          │
│  ● Se cobra el 100% de la clase                                │
│  ○ Se cobra el 50% de la clase                                 │
│  ○ Se pierde 1 clase del paquete                               │
│                                                                 │
│  RECORDATORIOS AUTOMÁTICOS                                      │
│  ─────────────────────────                                      │
│                                                                 │
│  Enviar recordatorio al alumno:                                │
│  ☑ 24 horas antes (SMS)                                        │
│  ☑ 2 horas antes (Push)                                        │
│                                                                 │
│  [💾 GUARDAR]                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 5. GESTIÓN DE ALUMNOS

## 5.1 Lista de Alumnos

```
┌─────────────────────────────────────────────────────────────────────────┐
│  👥 MIS ALUMNOS                                    Total: 28 alumnos   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔍 Buscar alumno...                [Todos ▼] [Activos ▼] [+ Nuevo]    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  📷  NOMBRE           NIVEL     CLASES   SALDO      ÚLTIMA     │   │
│  │  ─── ──────────────── ───────── ──────── ────────── ─────────  │   │
│  │                                                                 │   │
│  │  👤  María González   Intermedio  32     🟢 3 clases  Hoy      │   │
│  │      ⭐ Alumna estrella                   (paquete)             │   │
│  │                                                                 │   │
│  │  👤  Carlos Mendez    Principiante 8     🔴 Debe      Hace 3d  │   │
│  │      🏷️ Grupo Martes                     Gs. 150.000           │   │
│  │                                                                 │   │
│  │  👤  Roberto Silva    Principiante 1     🟡 Sin       Hace 7d  │   │
│  │      🆕 Nuevo                             paquete               │   │
│  │                                                                 │   │
│  │  👤  Ana Rodríguez    Avanzado    45     🟢 5 clases  Hace 2d  │   │
│  │      ⭐ Alumna estrella                   (paquete)             │   │
│  │                                                                 │   │
│  │  👤  Pedro Gómez      Intermedio  15     ⚠️ 1 clase   Hace 14d │   │
│  │      ⚠️ Inactivo (2 semanas)             (último)              │   │
│  │                                                                 │   │
│  │  ... (más alumnos)                                             │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  📊 RESUMEN:                                                           │
│  • Activos (última clase < 2 semanas): 22                              │
│  • Inactivos (2-4 semanas): 4                                          │
│  • Perdidos (> 4 semanas): 2                                           │
│  • Con deuda pendiente: 3 (Gs. 380.000 total)                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Ficha del Alumno

```
┌─────────────────────────────────────────────────────────────────────────┐
│  👤 FICHA DE ALUMNO: MARÍA GONZÁLEZ                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  [General]  [Clases]  [Pagos]  [Progreso]  [Notas]                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  DATOS PERSONALES                           ESTADO                      │
│  ─────────────────                          ──────                      │
│  📷                                         🟢 Activa                   │
│  María González                             Alumna desde: Mar 2025      │
│  📱 +595 981 567 890                        Total clases: 32            │
│  📧 maria@email.com                         Este mes: 6 clases          │
│  📍 Ciudad del Este                                                     │
│                                                                         │
│  NIVEL ACTUAL                               ETIQUETAS                   │
│  ────────────                               ──────────                  │
│  ⭐⭐⭐☆☆ Intermedio                        🏷️ Grupo Martes            │
│  Subnivel: 3/5                              🏷️ Competitiva              │
│  Última evaluación: Feb 2026                ⭐ Alumna estrella          │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  💰 ESTADO FINANCIERO                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Paquete activo: 10 clases (comprado 01/03/2026)               │   │
│  │  ████████░░░░░░░░░░░░  Usadas: 7 | Restantes: 3               │   │
│  │                                                                 │   │
│  │  Precio paquete: Gs. 1.200.000 (pagado ✓)                      │   │
│  │  Próximo vencimiento: 01/04/2026                               │   │
│  │                                                                 │   │
│  │  [📦 Vender nuevo paquete]  [💵 Registrar pago]                │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  📅 PRÓXIMAS CLASES                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Mar 17 Mar, 09:00  │  Grupal  │  La Quinta  │  [Cancelar]     │   │
│  │  Jue 19 Mar, 09:00  │  Grupal  │  La Quinta  │  [Cancelar]     │   │
│  │  Mar 24 Mar, 09:00  │  Grupal  │  La Quinta  │  [Cancelar]     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  📝 ÚLTIMA NOTA DE CLASE (Mar 10)                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  "Excelente progreso en la bandeja. Próxima clase trabajar    │   │
│  │   la salida de pared del lado revés."                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [💬 Enviar mensaje]  [📅 Agendar clase]  [📊 Ver progreso completo]   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5.3 Notas de Clase

```
┌─────────────────────────────────────────────────────────────────┐
│  📝 NOTAS DE CLASE - MARÍA GONZÁLEZ                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📅 10 Marzo 2026 | Clase Individual                     │   │
│  │                                                         │   │
│  │ Temas trabajados:                                       │   │
│  │ ☑ Bandeja                                              │   │
│  │ ☑ Posicionamiento                                      │   │
│  │ ☐ Volea                                                │   │
│  │ ☐ Saque                                                │   │
│  │                                                         │   │
│  │ Observaciones:                                          │   │
│  │ "Excelente progreso en la bandeja. El timing mejoró    │   │
│  │  mucho. Próxima clase trabajar la salida de pared     │   │
│  │  del lado revés que le cuesta."                        │   │
│  │                                                         │   │
│  │ Calificación de la sesión: ⭐⭐⭐⭐⭐                    │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📅 5 Marzo 2026 | Clase Grupal                          │   │
│  │                                                         │   │
│  │ Compañeros: Carlos M., Roberto S.                      │   │
│  │                                                         │   │
│  │ Temas trabajados:                                       │   │
│  │ ☑ Juego en equipo                                      │   │
│  │ ☑ Comunicación                                         │   │
│  │ ☑ Movimientos cruzados                                 │   │
│  │                                                         │   │
│  │ Observaciones:                                          │   │
│  │ "Buen trabajo en equipo. María lidera bien las        │   │
│  │  jugadas. Debe trabajar en dejar más espacio a su     │   │
│  │  compañero en la red."                                 │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [+ Agregar nota]                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 5.4 Seguimiento de Progreso

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📈 PROGRESO DE MARÍA GONZÁLEZ                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  EVOLUCIÓN DE NIVEL                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Avanzado  ─                                              ·    │   │
│  │            │                                            ·      │   │
│  │            │                                          ·        │   │
│  │  Intermedio─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ·─·─·─·─·─·          │   │
│  │            │                     ·─·─·─·                       │   │
│  │            │               ·─·─·                               │   │
│  │  Principian─         ·─·─·                                     │   │
│  │            │   ·─·─·                                           │   │
│  │            │ ·                                                 │   │
│  │            └────────────────────────────────────────────────   │   │
│  │              Mar   Abr   May   Jun   Jul   Ago   Sep   Oct     │   │
│  │              2025                                      2025    │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  HABILIDADES ACTUALES                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Derecha        ████████████████████░░░░░  80%                 │   │
│  │  Revés          ██████████████░░░░░░░░░░░  60%                 │   │
│  │  Volea          ███████████████████░░░░░░  75%                 │   │
│  │  Bandeja        ████████████████████████░  90%  ⬆️ Mejoró     │   │
│  │  Saque          █████████████░░░░░░░░░░░░  55%                 │   │
│  │  Posición       ██████████████████░░░░░░░  70%                 │   │
│  │  Táctica        █████████████████░░░░░░░░  65%                 │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  HITOS ALCANZADOS                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🏅 10 clases completadas (Abr 2025)                           │   │
│  │  🏅 Pasó a Intermedio (Jun 2025)                               │   │
│  │  🏅 25 clases completadas (Sep 2025)                           │   │
│  │  🏅 Primer torneo jugado (Oct 2025)                            │   │
│  │  🏅 50% victorias en torneos (Dic 2025)                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [📄 Exportar reporte]  [🎓 Generar certificado]                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 6. SISTEMA FINANCIERO

## 6.1 Dashboard Financiero

```
┌─────────────────────────────────────────────────────────────────────────┐
│  💰 MIS FINANZAS                                   Marzo 2026          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RESUMEN DEL MES                                                        │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐        │
│  │ 💵 INGRESOS      │ │ 📅 CLASES        │ │ ⏱️ HORAS         │        │
│  │                  │ │                  │ │                  │        │
│  │ Gs. 4.350.000    │ │ 32 clases        │ │ 38 horas         │        │
│  │ ⬆️ +15% vs Feb   │ │ ⬆️ +4 vs Feb     │ │ ⬆️ +5h vs Feb    │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘        │
│                                                                         │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐        │
│  │ 📦 PAQUETES      │ │ 🔴 PENDIENTES    │ │ 💳 ONLINE        │        │
│  │                  │ │                  │ │                  │        │
│  │ 5 vendidos       │ │ Gs. 380.000      │ │ Gs. 2.100.000    │        │
│  │ Gs. 6.000.000    │ │ 3 alumnos deben  │ │ 48% del total    │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘        │
│                                                                         │
│  GRÁFICO DE INGRESOS (últimos 6 meses)                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  5M ─│                                              ┌───┐       │   │
│  │      │                                    ┌───┐     │   │       │   │
│  │  4M ─│                          ┌───┐     │   │     │   │       │   │
│  │      │                ┌───┐     │   │     │   │     │   │       │   │
│  │  3M ─│      ┌───┐     │   │     │   │     │   │     │   │       │   │
│  │      │      │   │     │   │     │   │     │   │     │   │       │   │
│  │  2M ─│      │   │     │   │     │   │     │   │     │   │       │   │
│  │      │      │   │     │   │     │   │     │   │     │   │       │   │
│  │      └──────┴───┴─────┴───┴─────┴───┴─────┴───┴─────┴───┴────   │   │
│  │           Oct    Nov    Dic    Ene    Feb    Mar                │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ACCIONES RÁPIDAS                                                       │
│  [💵 Registrar cobro]  [📦 Vender paquete]  [📊 Ver detalle]          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Gestión de Paquetes

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📦 PAQUETES DE CLASES                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MIS PAQUETES CONFIGURADOS                                              │
│  ─────────────────────────                                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📦 PAQUETE 5 CLASES                                             │   │
│  │                                                                 │   │
│  │ Precio normal: Gs. 750.000 (5 × 150.000)                       │   │
│  │ Precio paquete: Gs. 650.000                                    │   │
│  │ Descuento: 13%                                                 │   │
│  │ Validez: 2 meses desde la compra                               │   │
│  │                                                                 │   │
│  │ Vendidos este mes: 2                                           │   │
│  │                                                                 │   │
│  │ [Editar]  [Desactivar]                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📦 PAQUETE 10 CLASES ⭐ MÁS POPULAR                             │   │
│  │                                                                 │   │
│  │ Precio normal: Gs. 1.500.000 (10 × 150.000)                    │   │
│  │ Precio paquete: Gs. 1.200.000                                  │   │
│  │ Descuento: 20%                                                 │   │
│  │ Validez: 3 meses desde la compra                               │   │
│  │                                                                 │   │
│  │ Vendidos este mes: 3                                           │   │
│  │                                                                 │   │
│  │ [Editar]  [Desactivar]                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📦 MENSUALIDAD (4 clases/semana)                                │   │
│  │                                                                 │   │
│  │ Precio: Gs. 500.000/mes                                        │   │
│  │ Incluye: 4 clases grupales por semana                          │   │
│  │ Cobro: Automático el día 1 de cada mes                         │   │
│  │                                                                 │   │
│  │ Alumnos suscritos: 4                                           │   │
│  │                                                                 │   │
│  │ [Editar]  [Desactivar]                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [+ Crear nuevo paquete]                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6.3 Vender Paquete a Alumno

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 VENDER PAQUETE                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ALUMNO                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 Buscar alumno...                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Seleccionado: María González                                  │
│                                                                 │
│  PAQUETE                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Paquete 5 clases - Gs. 650.000                       │   │
│  │ ● Paquete 10 clases - Gs. 1.200.000                    │   │
│  │ ○ Mensualidad - Gs. 500.000/mes                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  MÉTODO DE PAGO                                                 │
│  ○ Efectivo                                                    │
│  ○ Transferencia bancaria                                       │
│  ● Pago online (Bancard)                                       │
│  ○ Cobrar después (deuda)                                       │
│                                                                 │
│  RESUMEN                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Alumno: María González                                  │   │
│  │ Paquete: 10 clases individuales                        │   │
│  │ Precio: Gs. 1.200.000                                  │   │
│  │ Validez: Hasta 17/06/2026 (3 meses)                    │   │
│  │                                                         │   │
│  │ Se enviará link de pago por SMS y email               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Cancelar]                    [📧 ENVIAR LINK DE PAGO]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 6.4 Control de Deudas

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🔴 PAGOS PENDIENTES                              Total: Gs. 380.000   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 👤 CARLOS MENDEZ                                                │   │
│  │                                                                 │   │
│  │ Debe: Gs. 150.000                                              │   │
│  │ Concepto: Clase individual (10 Mar 2026)                       │   │
│  │ Días de mora: 7 días                                           │   │
│  │                                                                 │   │
│  │ [💬 Enviar recordatorio]  [💵 Registrar pago]  [❌ Anular]     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 👤 PEDRO GÓMEZ                                                  │   │
│  │                                                                 │   │
│  │ Debe: Gs. 80.000                                               │   │
│  │ Concepto: Clase grupal (8 Mar 2026)                            │   │
│  │ Días de mora: 9 días                                           │   │
│  │                                                                 │   │
│  │ ⚠️ Ya se envió 1 recordatorio (hace 5 días)                   │   │
│  │                                                                 │   │
│  │ [💬 Enviar recordatorio]  [💵 Registrar pago]  [❌ Anular]     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 👤 LAURA HERNÁNDEZ                                              │   │
│  │                                                                 │   │
│  │ Debe: Gs. 150.000                                              │   │
│  │ Concepto: Clase individual (5 Mar 2026)                        │   │
│  │ Días de mora: 12 días                                          │   │
│  │                                                                 │   │
│  │ ⚠️ Ya se enviaron 2 recordatorios                             │   │
│  │                                                                 │   │
│  │ [💬 Enviar recordatorio]  [💵 Registrar pago]  [❌ Anular]     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [📧 Enviar recordatorio masivo a todos]                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6.5 Historial de Transacciones

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📋 HISTORIAL DE TRANSACCIONES                      Marzo 2026         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filtros: [Todos ▼]  [Este mes ▼]  [🔍 Buscar alumno...]              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ FECHA      │ ALUMNO         │ CONCEPTO        │ MONTO    │ ESTADO│   │
│  ├────────────┼────────────────┼─────────────────┼──────────┼───────┤   │
│  │ 15 Mar     │ María González │ Clase grupal    │ 80.000   │ ✅    │   │
│  │ 15 Mar     │ Carlos Mendez  │ Clase grupal    │ 80.000   │ ✅    │   │
│  │ 14 Mar     │ Ana Rodríguez  │ Paquete 10      │1.200.000 │ ✅💳  │   │
│  │ 12 Mar     │ Roberto Silva  │ Clase indiv.    │ 150.000  │ ✅    │   │
│  │ 10 Mar     │ Carlos Mendez  │ Clase indiv.    │ 150.000  │ 🔴    │   │
│  │ 10 Mar     │ María González │ Clase indiv.    │ 150.000  │ ✅💳  │   │
│  │ 8 Mar      │ Pedro Gómez    │ Clase grupal    │ 80.000   │ 🔴    │   │
│  │ 5 Mar      │ Laura Hernández│ Clase indiv.    │ 150.000  │ 🔴    │   │
│  │ ...        │ ...            │ ...             │ ...      │ ...   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  LEYENDA: ✅ Pagado  🔴 Pendiente  💳 Pago online                      │
│                                                                         │
│  TOTALES DEL PERÍODO:                                                   │
│  • Total facturado: Gs. 4.730.000                                      │
│  • Total cobrado: Gs. 4.350.000                                        │
│  • Pendiente: Gs. 380.000                                              │
│                                                                         │
│  [📥 Exportar a Excel]  [📄 Generar reporte]                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 7. COMUNICACIÓN Y NOTIFICACIONES

## 7.1 Centro de Mensajes

```
┌─────────────────────────────────────────────────────────────────────────┐
│  💬 MENSAJES                                           5 sin leer      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Todos]  [Alumnos]  [Solicitudes]  [Sistema]                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔵 María González                               Hoy, 10:30      │   │
│  │ "Hola profe! Puedo cambiar la clase del martes al..."         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔵 Roberto Silva                                Hoy, 09:15      │   │
│  │ "Buenos días, confirmo la clase de mañana..."                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔵 SOLICITUD DE RESERVA                         Hoy, 08:45      │   │
│  │ Nueva solicitud de Juan Pérez para el Miércoles 18...          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │    Carlos Mendez                                Ayer, 18:20     │   │
│  │ "Gracias por la clase de hoy!"                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔵 SISTEMA - Pago recibido                      Ayer, 15:00     │   │
│  │ Ana Rodríguez pagó Gs. 1.200.000 (Paquete 10 clases)           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 7.2 Enviar Mensaje Masivo

```
┌─────────────────────────────────────────────────────────────────┐
│  📢 MENSAJE MASIVO                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DESTINATARIOS                                                  │
│  ─────────────                                                  │
│                                                                 │
│  ● Todos mis alumnos (28)                                       │
│  ○ Solo alumnos con clase esta semana (12)                     │
│  ○ Solo alumnos con paquete activo (15)                        │
│  ○ Grupo específico: [Seleccionar ▼]                           │
│  ○ Selección manual                                             │
│                                                                 │
│  CANALES                                                        │
│  ───────                                                        │
│                                                                 │
│  ☑ SMS (costo: ~Gs. 500/mensaje)                               │
│  ☑ Notificación push (gratis)                                  │
│  ☑ Email (gratis)                                              │
│                                                                 │
│  Tu saldo SMS: 45 mensajes restantes                           │
│                                                                 │
│  MENSAJE                                                        │
│  ───────                                                        │
│                                                                 │
│  Plantillas rápidas:                                           │
│  [Aviso de cancelación]  [Recordatorio]  [Promoción]           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚠️ AVISO IMPORTANTE                                     │   │
│  │                                                         │   │
│  │ Hola! Les aviso que mañana martes 17 se suspenden      │   │
│  │ las clases por lluvia. Los que tenían clase agendada   │   │
│  │ serán reprogramados. Disculpen las molestias!          │   │
│  │                                                         │   │
│  │ - Héctor                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Caracteres: 187/160 (2 SMS por destinatario)                  │
│  Costo total estimado: 56 SMS (Gs. 28.000)                     │
│                                                                 │
│  [Vista previa]              [📤 ENVIAR A 28 ALUMNOS]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 7.3 Recordatorios Automáticos

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ CONFIGURAR RECORDATORIOS AUTOMÁTICOS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RECORDATORIO DE CLASE                                          │
│  ─────────────────────                                          │
│                                                                 │
│  ☑ Enviar recordatorio 24 horas antes                          │
│    Canal: [SMS ▼]                                              │
│    Mensaje:                                                     │
│    ┌─────────────────────────────────────────────────────┐     │
│    │ Hola {nombre}! Te recordamos tu clase de pádel     │     │
│    │ mañana {fecha} a las {hora} en {ubicacion}.        │     │
│    │ ¡Te esperamos! - {instructor}                      │     │
│    └─────────────────────────────────────────────────────┘     │
│                                                                 │
│  ☑ Enviar recordatorio 2 horas antes                           │
│    Canal: [Push ▼]                                             │
│    Mensaje: "Tu clase es en 2 horas. ¡No te olvides!"         │
│                                                                 │
│  RECORDATORIO DE PAGO                                           │
│  ────────────────────                                           │
│                                                                 │
│  ☑ Recordar pagos pendientes                                   │
│    Frecuencia: [Cada 5 días ▼]                                 │
│    Canal: [SMS ▼]                                              │
│    Mensaje:                                                     │
│    ┌─────────────────────────────────────────────────────┐     │
│    │ Hola {nombre}! Te recordamos que tenés un pago     │     │
│    │ pendiente de Gs. {monto}. Podés pagar en:          │     │
│    │ {link_pago}                                        │     │
│    └─────────────────────────────────────────────────────┘     │
│                                                                 │
│  RECORDATORIO DE PAQUETE POR VENCER                             │
│  ──────────────────────────────────                             │
│                                                                 │
│  ☑ Avisar cuando quedan pocas clases                           │
│    Avisar cuando quedan: [2 clases ▼]                          │
│    Mensaje: "Te quedan solo {clases} clases de tu paquete..."  │
│                                                                 │
│  ☑ Avisar vencimiento próximo                                  │
│    Avisar [7 días ▼] antes del vencimiento                     │
│                                                                 │
│  [💾 GUARDAR CONFIGURACIÓN]                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 8. PERFIL PÚBLICO Y MARKETING

## 8.1 Perfil Público del Instructor

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🌐 fairpadel.com/instructor/hector-velazquez                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  ┌────────┐                                                     │   │
│  │  │        │   HÉCTOR VELÁZQUEZ                                 │   │
│  │  │  📷    │   Instructor de Pádel ⭐ Verificado                │   │
│  │  │        │                                                     │   │
│  │  └────────┘   ⭐ 4.9 (45 reseñas) | 📍 Ciudad del Este        │   │
│  │               📅 5 años de experiencia                         │   │
│  │               🎓 Certificado FEPARPA                           │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │              📅 RESERVAR CLASE                          │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  SOBRE MÍ                                                              │
│  ────────                                                               │
│  Ex jugador profesional con 5 años de experiencia enseñando.           │
│  Especialista en técnica de volea y trabajo con principiantes.         │
│  Me apasiona ver el progreso de mis alumnos y ayudarlos a             │
│  disfrutar del pádel.                                                  │
│                                                                         │
│  ESPECIALIDADES                                                         │
│  ──────────────                                                         │
│  🎯 Principiantes  🎯 Técnica  🎯 Táctica  🎯 Competitivo             │
│                                                                         │
│  TARIFAS                                                                │
│  ───────                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Clase Individual (1h)              Gs. 150.000              │   │
│  │ 👥 Clase Grupal (1h, por persona)     Gs. 80.000               │   │
│  │ 📦 Paquete 10 clases                  Gs. 1.200.000 (20% off)  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  UBICACIONES                                                            │
│  ───────────                                                            │
│  📍 La Quinta Sport (Ciudad del Este)                                  │
│  📍 Blue Padel (Asunción)                                              │
│                                                                         │
│  GALERÍA                                                                │
│  ───────                                                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                  │
│  │ 📷   │ │ 📷   │ │ 📷   │ │ 📷   │                                  │
│  │      │ │      │ │      │ │      │                                  │
│  └──────┘ └──────┘ └──────┘ └──────┘                                  │
│  [Ver todas las fotos →]                                               │
│                                                                         │
│  RESEÑAS (45)                                                          │
│  ────────────                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⭐⭐⭐⭐⭐  María G.                              Hace 1 semana │   │
│  │ "Excelente profe! En 3 meses pasé de no saber nada a jugar    │   │
│  │  torneos. Muy paciente y explica super bien."                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⭐⭐⭐⭐⭐  Carlos M.                              Hace 2 semanas│   │
│  │ "Las clases grupales son muy divertidas. Se nota que le       │   │
│  │  apasiona enseñar."                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  [Ver todas las reseñas →]                                             │
│                                                                         │
│  DISPONIBILIDAD                                                         │
│  ──────────────                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │      Lun    Mar    Mié    Jue    Vie    Sáb                    │   │
│  │ AM   ✅     ✅     ✅     ✅     ❌     ✅                     │   │
│  │ PM   ✅     ✅     ❌     ✅     ✅     ❌                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    📅 RESERVAR CLASE AHORA                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 8.2 Búsqueda de Instructores (Vista Alumno)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🔍 ENCONTRAR INSTRUCTOR                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📍 Ciudad del Este ▼ │ Nivel: Cualquiera ▼ │ Precio: Todos ▼  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  12 instructores encontrados                                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⭐ DESTACADO                                                    │   │
│  │ ┌────────┐                                                      │   │
│  │ │  📷    │  HÉCTOR VELÁZQUEZ ✓                                 │   │
│  │ │        │  ⭐ 4.9 (45) | 5 años exp. | FEPARPA                │   │
│  │ └────────┘  📍 La Quinta, Blue Padel                           │   │
│  │             💰 Desde Gs. 80.000                                │   │
│  │             🎯 Principiantes, Técnica, Competitivo             │   │
│  │                                                                 │   │
│  │             [Ver perfil]  [📅 Reservar]                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ┌────────┐                                                      │   │
│  │ │  📷    │  SANTIAGO CASTAÑEYRA ✓                              │   │
│  │ │        │  ⭐ 4.8 (32) | 8 años exp. | FIP                    │   │
│  │ └────────┘  📍 La Quinta                                       │   │
│  │             💰 Desde Gs. 120.000                               │   │
│  │             🎯 Avanzado, Competitivo, Alto Rendimiento         │   │
│  │                                                                 │   │
│  │             [Ver perfil]  [📅 Reservar]                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ┌────────┐                                                      │   │
│  │ │  📷    │  ANA RODRÍGUEZ                                      │   │
│  │ │        │  ⭐ 4.7 (18) | 3 años exp.                          │   │
│  │ └────────┘  📍 Mburicao, Blue Padel                            │   │
│  │             💰 Desde Gs. 70.000                                │   │
│  │             🎯 Principiantes, Niños, Mujeres                   │   │
│  │                                                                 │   │
│  │             [Ver perfil]  [📅 Reservar]                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ... (más resultados)                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 8.3 Sistema de Reseñas

```
┌─────────────────────────────────────────────────────────────────┐
│  ⭐ DEJAR RESEÑA                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Clase con: Héctor Velázquez                                    │
│  Fecha: 15 Marzo 2026                                          │
│                                                                 │
│  ¿Cómo calificarías la clase?                                  │
│                                                                 │
│  ⭐ ⭐ ⭐ ⭐ ⭐                                                  │
│  (Click para calificar)                                        │
│                                                                 │
│  Tu experiencia:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Excelente clase! Héctor tiene mucha paciencia y        │   │
│  │ explica muy bien los fundamentos. En una sola clase    │   │
│  │ noté mejora en mi volea. Muy recomendado!              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ¿Qué destacarías? (opcional)                                  │
│  ☑ Puntualidad                                                 │
│  ☑ Paciencia                                                   │
│  ☑ Conocimiento técnico                                        │
│  ☐ Instalaciones                                               │
│  ☑ Relación calidad-precio                                     │
│                                                                 │
│  ☑ Publicar con mi nombre                                      │
│  ☐ Publicar anónimamente                                       │
│                                                                 │
│  [Cancelar]                    [⭐ PUBLICAR RESEÑA]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 9. DASHBOARD Y REPORTES

## 9.1 Dashboard Principal del Instructor

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏠 DASHBOARD                                  Hola, Héctor! 👋         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  HOY - Lunes 16 Marzo                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  📅 AGENDA DE HOY                           💰 INGRESOS HOY     │   │
│  │  ┌───────────────────────────────────┐     ┌─────────────────┐ │   │
│  │  │ 08:00 ░░░░░░░░ (libre)           │     │                 │ │   │
│  │  │ 09:00 🔵 Juan P. - Individual    │     │  Gs. 310.000    │ │   │
│  │  │ 10:00 🔵 Pedro S. - Individual   │     │                 │ │   │
│  │  │ 11:00 🟡 Roberto - Pendiente     │     │  2 clases       │ │   │
│  │  │ 12:00 ░░░░░░░░ (almuerzo)        │     │  pagadas        │ │   │
│  │  │ ...                              │     │                 │ │   │
│  │  │ 16:00 🔵 Grupo Princ. (4 pers)   │     │  1 pendiente    │ │   │
│  │  │ 17:00 ░░░░░░░░ (libre)           │     │                 │ │   │
│  │  └───────────────────────────────────┘     └─────────────────┘ │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ACCIONES PENDIENTES                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔔 3 solicitudes de reserva pendientes                [Ver →]  │   │
│  │ 🔴 2 pagos pendientes de cobro (Gs. 230.000)          [Ver →]  │   │
│  │ ⚠️ 1 alumno inactivo hace 2 semanas                   [Ver →]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  RESUMEN DE LA SEMANA                                                   │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐        │
│  │ 📅 12 CLASES     │ │ 💰 Gs. 1.650.000 │ │ 👥 8 ALUMNOS     │        │
│  │ programadas      │ │ ingresos esperado│ │ esta semana      │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘        │
│                                                                         │
│  ALERTAS                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ María González: le quedan solo 2 clases del paquete         │   │
│  │ ⚠️ Paquete de Ana R. vence en 5 días                           │   │
│  │ 💡 Pedro G. no viene hace 14 días - ¿enviar mensaje?           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ACCESOS RÁPIDOS                                                        │
│  [📅 Ver Agenda]  [👥 Mis Alumnos]  [💰 Finanzas]  [📊 Reportes]       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 9.2 Reportes Detallados

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 REPORTES                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Período: [Marzo 2026 ▼]                        [📥 Exportar Excel]    │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  RESUMEN FINANCIERO                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Ingresos brutos:           Gs. 4.350.000                      │   │
│  │  (-) Comisión FairPadel:    Gs.   217.500 (5%)                 │   │
│  │  (-) Comisión Bancard:      Gs.    87.000 (2% online)          │   │
│  │  ════════════════════════════════════════                      │   │
│  │  Ingresos netos:            Gs. 4.045.500                      │   │
│  │                                                                 │   │
│  │  Pendiente de cobro:        Gs.   380.000                      │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  DESGLOSE POR TIPO DE CLASE                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Tipo              Clases    Ingresos      % del total         │   │
│  │  ─────────────────────────────────────────────────────         │   │
│  │  Individual        18        Gs. 2.700.000    62%              │   │
│  │  ████████████████████████████████████░░░░░░░░░░░░              │   │
│  │                                                                 │   │
│  │  Grupal            14        Gs. 1.120.000    26%              │   │
│  │  █████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░              │   │
│  │                                                                 │   │
│  │  Paquetes          -         Gs.   530.000    12%              │   │
│  │  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░              │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ESTADÍSTICAS DE ALUMNOS                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Alumnos activos:           22                                 │   │
│  │  Alumnos nuevos este mes:   3                                  │   │
│  │  Alumnos perdidos:          1                                  │   │
│  │  Tasa de retención:         95%                                │   │
│  │                                                                 │   │
│  │  Promedio clases/alumno:    1.5/semana                         │   │
│  │  Alumno más activo:         María González (8 clases)          │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  OCUPACIÓN HORARIA                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Horas disponibles:         160h                               │   │
│  │  Horas ocupadas:            38h                                │   │
│  │  Tasa de ocupación:         24%                                │   │
│  │                                                                 │   │
│  │  Horarios más demandados:                                      │   │
│  │  1. Sábados 09:00-11:00 (100% ocupado)                        │   │
│  │  2. Martes 17:00-19:00 (90% ocupado)                          │   │
│  │  3. Jueves 09:00-11:00 (80% ocupado)                          │   │
│  │                                                                 │   │
│  │  Horarios con disponibilidad:                                  │   │
│  │  • Lunes tarde (70% libre)                                     │   │
│  │  • Miércoles mañana (80% libre)                               │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 10. HERRAMIENTAS DE ENSEÑANZA

## 10.1 Biblioteca de Ejercicios

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📚 BIBLIOTECA DE EJERCICIOS                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Todos]  [Mis ejercicios]  [FairPadel]  [Favoritos]                   │
│                                                                         │
│  🔍 Buscar ejercicio...        Filtrar: [Volea ▼] [Principiante ▼]    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎥 VOLEA BÁSICA - POSICIÓN Y GRIP                               │   │
│  │                                                                 │   │
│  │ ┌────────────────┐  Nivel: Principiante                        │   │
│  │ │                │  Duración: 10 min                           │   │
│  │ │   ▶️ VIDEO    │  Jugadores: 1-2                             │   │
│  │ │                │                                              │   │
│  │ └────────────────┘  📖 Enseña la posición básica de volea,    │   │
│  │                     el grip continental y el movimiento        │   │
│  │                     corto y compacto.                          │   │
│  │                                                                 │   │
│  │ [⭐ Favorito]  [📤 Enviar a alumno]  [📝 Ver detalle]          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📝 DRILL: VOLEA CRUZADA (Mi ejercicio)                         │   │
│  │                                                                 │   │
│  │ Nivel: Intermedio | Duración: 15 min | Jugadores: 2            │   │
│  │                                                                 │   │
│  │ Descripción: Ejercicio de volea cruzada alternando lados.      │   │
│  │ El alumno debe mantener la bola en juego mínimo 10 golpes.     │   │
│  │                                                                 │   │
│  │ [✏️ Editar]  [📤 Enviar a alumno]  [🗑️ Eliminar]              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [+ Crear mi ejercicio]                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 10.2 Plan de Clase

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 CREAR PLAN DE CLASE                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Para: María González                                           │
│  Fecha: 17 Marzo 2026, 09:00                                   │
│  Objetivo: Mejorar salida de pared lado revés                  │
│                                                                 │
│  ESTRUCTURA DE LA CLASE (60 min)                               │
│  ───────────────────────────────                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⏱️ 0-10 min | CALENTAMIENTO                             │   │
│  │                                                         │   │
│  │ • Movilidad articular                                  │   │
│  │ • Peloteo suave                                        │   │
│  │ • Activación                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⏱️ 10-30 min | TÉCNICA                                  │   │
│  │                                                         │   │
│  │ Ejercicio: Salida de pared lado revés                  │   │
│  │ [+ Agregar de biblioteca]                              │   │
│  │                                                         │   │
│  │ Notas: Énfasis en el timing y posición de pies        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⏱️ 30-50 min | APLICACIÓN EN JUEGO                      │   │
│  │                                                         │   │
│  │ Ejercicio: Puntos con obligación de usar pared        │   │
│  │                                                         │   │
│  │ Notas: Simular situaciones reales de partido          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⏱️ 50-60 min | VUELTA A LA CALMA                        │   │
│  │                                                         │   │
│  │ • Estiramientos                                        │   │
│  │ • Feedback y tareas para casa                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [+ Agregar bloque]                                            │
│                                                                 │
│  [Guardar borrador]              [📤 Enviar al alumno]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 11. ESTRUCTURA DE BASE DE DATOS

## 11.1 Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐   │
│  │    users     │         │ instructores │         │   alumnos    │   │
│  │   (existente)│────────▶│              │◀────────│              │   │
│  └──────────────┘   1:1   └──────────────┘   1:N   └──────────────┘   │
│         │                        │                        │            │
│         │                        │                        │            │
│         │                        ▼                        │            │
│         │              ┌──────────────────┐               │            │
│         │              │ disponibilidad   │               │            │
│         │              │   _instructor    │               │            │
│         │              └──────────────────┘               │            │
│         │                        │                        │            │
│         │                        │                        │            │
│         │              ┌─────────┴─────────┐              │            │
│         │              ▼                   ▼              │            │
│         │     ┌──────────────┐    ┌──────────────┐       │            │
│         │     │    clases    │    │   reservas   │       │            │
│         │     │              │◀───│              │       │            │
│         │     └──────────────┘    └──────────────┘       │            │
│         │              │                   │              │            │
│         │              │                   │              │            │
│         │              ▼                   │              │            │
│         │     ┌──────────────┐             │              │            │
│         │     │ clase_alumnos│◀────────────┼──────────────┘            │
│         │     └──────────────┘             │                           │
│         │              │                   │                           │
│         │              ▼                   │                           │
│         │     ┌──────────────┐             │                           │
│         │     │    pagos     │◀────────────┘                           │
│         │     └──────────────┘                                         │
│         │              │                                               │
│         │              ▼                                               │
│         │     ┌──────────────┐    ┌──────────────┐                    │
│         │     │   paquetes   │───▶│paquete_alumno│                    │
│         │     └──────────────┘    └──────────────┘                    │
│         │                                                              │
│         │     ┌──────────────┐    ┌──────────────┐                    │
│         └────▶│   reseñas    │    │ notificaciones│                   │
│               └──────────────┘    │  _instructor │                    │
│                                   └──────────────┘                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 11.2 Tablas SQL Completas

```sql
-- ============================================
-- MÓDULO INSTRUCTORES - ESTRUCTURA DE BD
-- FairPadel v1.0
-- ============================================

-- ============================================
-- 1. TABLA PRINCIPAL: INSTRUCTORES
-- ============================================

CREATE TABLE instructores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Estado y verificación
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, APROBADO, RECHAZADO, SUSPENDIDO
    verificado BOOLEAN DEFAULT FALSE,
    fecha_aprobacion TIMESTAMP,
    aprobado_por UUID REFERENCES users(id),
    
    -- Información profesional
    anos_experiencia INTEGER,
    biografia TEXT,
    especialidades TEXT[], -- ARRAY de especialidades
    niveles_ensenanza TEXT[], -- ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO', 'COMPETITIVO']
    
    -- Certificaciones
    certificaciones JSONB DEFAULT '[]',
    -- Ejemplo: [{"nombre": "FEPARPA", "fecha": "2023-01-15", "archivo_url": "..."}]
    
    -- Configuración de clases
    duracion_clase_default INTEGER DEFAULT 60, -- minutos
    tiempo_entre_clases INTEGER DEFAULT 15, -- minutos
    
    -- Tarifas
    precio_clase_individual INTEGER NOT NULL, -- en guaraníes
    precio_clase_grupal INTEGER, -- por persona
    max_alumnos_grupal INTEGER DEFAULT 4,
    acepta_pago_online BOOLEAN DEFAULT TRUE,
    
    -- Ubicaciones
    ciudades TEXT[], -- ciudades donde da clases
    acepta_domicilio BOOLEAN DEFAULT FALSE,
    
    -- Plan y suscripción
    plan VARCHAR(20) DEFAULT 'BASICO', -- BASICO, PRO, ACADEMIA
    plan_fecha_inicio DATE,
    plan_fecha_fin DATE,
    sms_disponibles INTEGER DEFAULT 50,
    
    -- Configuraciones
    confirmacion_automatica BOOLEAN DEFAULT FALSE,
    politica_cancelacion_horas INTEGER DEFAULT 24,
    cobro_cancelacion_tardia DECIMAL(3,2) DEFAULT 1.00, -- 1.00 = 100%
    
    -- Estadísticas (cache para rendimiento)
    total_clases_dadas INTEGER DEFAULT 0,
    total_alumnos INTEGER DEFAULT 0,
    rating_promedio DECIMAL(2,1) DEFAULT 0.0,
    total_resenas INTEGER DEFAULT 0,
    
    -- Metadata
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_instructores_user_id ON instructores(user_id);
CREATE INDEX idx_instructores_estado ON instructores(estado);
CREATE INDEX idx_instructores_ciudades ON instructores USING GIN(ciudades);
CREATE INDEX idx_instructores_verificado ON instructores(verificado);

-- ============================================
-- 2. UBICACIONES DEL INSTRUCTOR
-- ============================================

CREATE TABLE instructor_ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id) ON DELETE CASCADE,
    
    -- Puede ser un club registrado o dirección custom
    club_id UUID REFERENCES clubes(id), -- si existe tabla de clubes
    nombre_ubicacion VARCHAR(200) NOT NULL,
    direccion TEXT,
    ciudad VARCHAR(100) NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    es_principal BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_instructor_ubicaciones ON instructor_ubicaciones(instructor_id);

-- ============================================
-- 3. DISPONIBILIDAD SEMANAL
-- ============================================

CREATE TABLE instructor_disponibilidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id) ON DELETE CASCADE,
    
    dia_semana INTEGER NOT NULL, -- 0=Domingo, 1=Lunes, ..., 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    
    ubicacion_id UUID REFERENCES instructor_ubicaciones(id),
    activo BOOLEAN DEFAULT TRUE,
    
    creado_en TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_horario CHECK (hora_fin > hora_inicio)
);

CREATE INDEX idx_disponibilidad_instructor ON instructor_disponibilidad(instructor_id);
CREATE INDEX idx_disponibilidad_dia ON instructor_disponibilidad(dia_semana);

-- ============================================
-- 4. BLOQUEOS DE AGENDA (vacaciones, etc.)
-- ============================================

CREATE TABLE instructor_bloqueos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id) ON DELETE CASCADE,
    
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME, -- null = todo el día
    hora_fin TIME,
    
    motivo VARCHAR(200),
    
    creado_en TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_fechas CHECK (fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_bloqueos_instructor ON instructor_bloqueos(instructor_id);
CREATE INDEX idx_bloqueos_fechas ON instructor_bloqueos(fecha_inicio, fecha_fin);

-- ============================================
-- 5. ALUMNOS DEL INSTRUCTOR
-- ============================================

CREATE TABLE instructor_alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id) ON DELETE CASCADE,
    alumno_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Nivel y progreso
    nivel VARCHAR(20) DEFAULT 'PRINCIPIANTE', -- PRINCIPIANTE, INTERMEDIO, AVANZADO, COMPETITIVO
    subnivel INTEGER DEFAULT 1, -- 1-5 dentro del nivel
    fecha_ultima_evaluacion DATE,
    
    -- Estado de la relación
    estado VARCHAR(20) DEFAULT 'ACTIVO', -- ACTIVO, INACTIVO, PERDIDO
    fecha_primera_clase DATE,
    fecha_ultima_clase DATE,
    
    -- Etiquetas personalizadas
    etiquetas TEXT[],
    
    -- Notas generales del instructor sobre el alumno
    notas TEXT,
    
    -- Habilidades (escala 1-10)
    habilidades JSONB DEFAULT '{}',
    -- Ejemplo: {"derecha": 7, "reves": 5, "volea": 6, "bandeja": 8, "saque": 4}
    
    -- Preferencias
    posicion_preferida VARCHAR(20), -- DERECHA, REVES, AMBAS
    estilo_juego VARCHAR(20), -- AGRESIVO, DEFENSIVO, EQUILIBRADO
    disponibilidad JSONB, -- días/horarios preferidos
    
    -- Estadísticas
    total_clases INTEGER DEFAULT 0,
    clases_canceladas INTEGER DEFAULT 0,
    
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(instructor_id, alumno_user_id)
);

CREATE INDEX idx_alumnos_instructor ON instructor_alumnos(instructor_id);
CREATE INDEX idx_alumnos_user ON instructor_alumnos(alumno_user_id);
CREATE INDEX idx_alumnos_estado ON instructor_alumnos(estado);

-- ============================================
-- 6. PAQUETES DE CLASES
-- ============================================

CREATE TABLE instructor_paquetes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id) ON DELETE CASCADE,
    
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    
    -- Configuración del paquete
    tipo VARCHAR(20) NOT NULL, -- CLASES, MENSUALIDAD
    cantidad_clases INTEGER, -- para tipo CLASES
    clases_por_semana INTEGER, -- para tipo MENSUALIDAD
    
    -- Precios
    precio_normal INTEGER NOT NULL, -- precio sin descuento
    precio_paquete INTEGER NOT NULL, -- precio con descuento
    
    -- Validez
    validez_dias INTEGER, -- días desde la compra
    
    -- Tipo de clase incluida
    tipo_clase VARCHAR(20) DEFAULT 'INDIVIDUAL', -- INDIVIDUAL, GRUPAL, AMBOS
    
    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 0, -- para ordenar en la UI
    
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_paquetes_instructor ON instructor_paquetes(instructor_id);

-- ============================================
-- 7. PAQUETES COMPRADOS POR ALUMNOS
-- ============================================

CREATE TABLE alumno_paquetes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_alumno_id UUID NOT NULL REFERENCES instructor_alumnos(id),
    paquete_id UUID NOT NULL REFERENCES instructor_paquetes(id),
    
    -- Estado del paquete comprado
    clases_totales INTEGER NOT NULL,
    clases_usadas INTEGER DEFAULT 0,
    clases_restantes INTEGER GENERATED ALWAYS AS (clases_totales - clases_usadas) STORED,
    
    -- Fechas
    fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    
    -- Pago
    monto_pagado INTEGER NOT NULL,
    estado_pago VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADO, PARCIAL
    metodo_pago VARCHAR(20), -- EFECTIVO, TRANSFERENCIA, BANCARD
    
    estado VARCHAR(20) DEFAULT 'ACTIVO', -- ACTIVO, VENCIDO, AGOTADO, CANCELADO
    
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alumno_paquetes_alumno ON alumno_paquetes(instructor_alumno_id);
CREATE INDEX idx_alumno_paquetes_estado ON alumno_paquetes(estado);

-- ============================================
-- 8. CLASES
-- ============================================

CREATE TABLE clases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id) ON DELETE CASCADE,
    
    -- Tipo y configuración
    tipo VARCHAR(20) NOT NULL, -- INDIVIDUAL, GRUPAL, PAREJAS
    max_alumnos INTEGER DEFAULT 1,
    
    -- Fecha y hora
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_minutos INTEGER NOT NULL,
    
    -- Ubicación
    ubicacion_id UUID REFERENCES instructor_ubicaciones(id),
    ubicacion_nombre VARCHAR(200), -- cache para mostrar
    
    -- Estado
    estado VARCHAR(20) DEFAULT 'PROGRAMADA', 
    -- PROGRAMADA, CONFIRMADA, EN_PROGRESO, COMPLETADA, CANCELADA, NO_SHOW
    
    -- Recurrencia
    es_recurrente BOOLEAN DEFAULT FALSE,
    serie_id UUID, -- para agrupar clases de una serie recurrente
    
    -- Precio
    precio_total INTEGER NOT NULL,
    
    -- Notas
    notas_instructor TEXT,
    plan_clase_id UUID, -- referencia a plan de clase si existe
    
    -- Cancelación
    cancelada_por VARCHAR(20), -- INSTRUCTOR, ALUMNO
    motivo_cancelacion TEXT,
    fecha_cancelacion TIMESTAMP,
    
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clases_instructor ON clases(instructor_id);
CREATE INDEX idx_clases_fecha ON clases(fecha);
CREATE INDEX idx_clases_estado ON clases(estado);
CREATE INDEX idx_clases_serie ON clases(serie_id);

-- ============================================
-- 9. ALUMNOS EN CADA CLASE
-- ============================================

CREATE TABLE clase_alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clase_id UUID NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
    instructor_alumno_id UUID NOT NULL REFERENCES instructor_alumnos(id),
    
    -- Estado del alumno en la clase
    estado VARCHAR(20) DEFAULT 'CONFIRMADO', -- PENDIENTE, CONFIRMADO, CANCELADO, ASISTIO, NO_ASISTIO
    
    -- Pago
    precio_alumno INTEGER NOT NULL,
    paquete_usado_id UUID REFERENCES alumno_paquetes(id), -- si paga con paquete
    estado_pago VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADO
    
    -- Notas específicas del alumno en esta clase
    notas TEXT,
    
    creado_en TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(clase_id, instructor_alumno_id)
);

CREATE INDEX idx_clase_alumnos_clase ON clase_alumnos(clase_id);
CREATE INDEX idx_clase_alumnos_alumno ON clase_alumnos(instructor_alumno_id);

-- ============================================
-- 10. SOLICITUDES DE RESERVA
-- ============================================

CREATE TABLE reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id),
    solicitante_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Clase solicitada
    tipo_clase VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    duracion_minutos INTEGER NOT NULL,
    ubicacion_id UUID REFERENCES instructor_ubicaciones(id),
    
    -- Alumnos (para grupales)
    alumnos_adicionales JSONB, -- [{user_id, nombre}]
    
    -- Estado
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, APROBADA, RECHAZADA, CANCELADA
    
    -- Mensaje del solicitante
    mensaje TEXT,
    
    -- Respuesta del instructor
    respuesta TEXT,
    fecha_respuesta TIMESTAMP,
    
    -- Si se aprueba, se crea la clase
    clase_id UUID REFERENCES clases(id),
    
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reservas_instructor ON reservas(instructor_id);
CREATE INDEX idx_reservas_estado ON reservas(estado);

-- ============================================
-- 11. PAGOS Y TRANSACCIONES
-- ============================================

CREATE TABLE instructor_pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id),
    instructor_alumno_id UUID REFERENCES instructor_alumnos(id),
    
    -- Concepto
    tipo VARCHAR(20) NOT NULL, -- CLASE, PAQUETE, MENSUALIDAD
    concepto TEXT NOT NULL,
    
    -- Referencias
    clase_id UUID REFERENCES clases(id),
    paquete_compra_id UUID REFERENCES alumno_paquetes(id),
    
    -- Montos
    monto INTEGER NOT NULL,
    
    -- Método y estado
    metodo_pago VARCHAR(20), -- EFECTIVO, TRANSFERENCIA, BANCARD
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADO, CANCELADO
    
    -- Bancard
    bancard_transaccion_id VARCHAR(100),
    bancard_estado VARCHAR(50),
    
    -- Fechas
    fecha_vencimiento DATE,
    fecha_pago TIMESTAMP,
    
    -- Recordatorios enviados
    recordatorios_enviados INTEGER DEFAULT 0,
    ultimo_recordatorio TIMESTAMP,
    
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pagos_instructor ON instructor_pagos(instructor_id);
CREATE INDEX idx_pagos_alumno ON instructor_pagos(instructor_alumno_id);
CREATE INDEX idx_pagos_estado ON instructor_pagos(estado);

-- ============================================
-- 12. NOTAS DE CLASE
-- ============================================

CREATE TABLE clase_notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clase_id UUID NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
    instructor_alumno_id UUID REFERENCES instructor_alumnos(id), -- null si aplica a todos
    
    -- Contenido
    temas_trabajados TEXT[],
    observaciones TEXT,
    tareas_para_casa TEXT,
    
    -- Calificación de la sesión
    calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
    
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notas_clase ON clase_notas(clase_id);

-- ============================================
-- 13. RESEÑAS DE ALUMNOS
-- ============================================

CREATE TABLE instructor_resenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id),
    autor_user_id UUID NOT NULL REFERENCES users(id),
    clase_id UUID REFERENCES clases(id), -- opcional, puede ser reseña general
    
    -- Calificación
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    
    -- Contenido
    comentario TEXT,
    aspectos_positivos TEXT[], -- puntualidad, paciencia, conocimiento, etc.
    
    -- Moderación
    visible BOOLEAN DEFAULT TRUE,
    reportada BOOLEAN DEFAULT FALSE,
    
    -- Respuesta del instructor
    respuesta_instructor TEXT,
    fecha_respuesta TIMESTAMP,
    
    creado_en TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(autor_user_id, clase_id) -- solo una reseña por clase
);

CREATE INDEX idx_resenas_instructor ON instructor_resenas(instructor_id);
CREATE INDEX idx_resenas_visible ON instructor_resenas(visible);

-- ============================================
-- 14. NOTIFICACIONES DEL INSTRUCTOR
-- ============================================

CREATE TABLE instructor_notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id),
    
    tipo VARCHAR(50) NOT NULL,
    -- RESERVA_NUEVA, RESERVA_CANCELADA, PAGO_RECIBIDO, RESENA_NUEVA, etc.
    
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    
    -- Referencias
    referencia_tipo VARCHAR(50), -- RESERVA, CLASE, PAGO, ALUMNO
    referencia_id UUID,
    
    -- Estado
    leida BOOLEAN DEFAULT FALSE,
    fecha_leida TIMESTAMP,
    
    -- Canales enviados
    enviado_push BOOLEAN DEFAULT FALSE,
    enviado_email BOOLEAN DEFAULT FALSE,
    enviado_sms BOOLEAN DEFAULT FALSE,
    
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_instructor ON instructor_notificaciones(instructor_id);
CREATE INDEX idx_notif_leida ON instructor_notificaciones(leida);

-- ============================================
-- 15. LOG DE SMS ENVIADOS
-- ============================================

CREATE TABLE instructor_sms_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id),
    
    destinatario_user_id UUID REFERENCES users(id),
    telefono VARCHAR(20) NOT NULL,
    
    mensaje TEXT NOT NULL,
    caracteres INTEGER NOT NULL,
    segmentos INTEGER NOT NULL, -- 1 SMS = 160 caracteres
    
    tipo VARCHAR(50), -- RECORDATORIO_CLASE, RECORDATORIO_PAGO, MASIVO, MANUAL
    referencia_id UUID,
    
    -- Estado del envío
    estado VARCHAR(20) DEFAULT 'ENVIADO', -- ENVIADO, FALLIDO
    error_mensaje TEXT,
    
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sms_instructor ON instructor_sms_log(instructor_id);

-- ============================================
-- 16. BIBLIOTECA DE EJERCICIOS
-- ============================================

CREATE TABLE ejercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Autoría
    instructor_id UUID REFERENCES instructores(id), -- null = ejercicio de FairPadel
    es_publico BOOLEAN DEFAULT FALSE,
    
    -- Contenido
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    instrucciones TEXT,
    
    -- Clasificación
    categoria VARCHAR(50), -- VOLEA, BANDEJA, SAQUE, TACTICA, etc.
    nivel VARCHAR(20), -- PRINCIPIANTE, INTERMEDIO, AVANZADO
    duracion_minutos INTEGER,
    jugadores_min INTEGER DEFAULT 1,
    jugadores_max INTEGER DEFAULT 4,
    
    -- Media
    video_url TEXT,
    imagen_url TEXT,
    
    -- Estadísticas
    veces_usado INTEGER DEFAULT 0,
    
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ejercicios_instructor ON ejercicios(instructor_id);
CREATE INDEX idx_ejercicios_categoria ON ejercicios(categoria);

-- ============================================
-- 17. CONFIGURACIÓN DE NOTIFICACIONES
-- ============================================

CREATE TABLE instructor_config_notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL UNIQUE REFERENCES instructores(id),
    
    -- Recordatorio de clase
    recordatorio_clase_24h BOOLEAN DEFAULT TRUE,
    recordatorio_clase_24h_canal VARCHAR(10) DEFAULT 'SMS',
    recordatorio_clase_24h_mensaje TEXT,
    
    recordatorio_clase_2h BOOLEAN DEFAULT TRUE,
    recordatorio_clase_2h_canal VARCHAR(10) DEFAULT 'PUSH',
    
    -- Recordatorio de pago
    recordatorio_pago BOOLEAN DEFAULT TRUE,
    recordatorio_pago_dias INTEGER DEFAULT 5, -- cada X días
    recordatorio_pago_canal VARCHAR(10) DEFAULT 'SMS',
    recordatorio_pago_mensaje TEXT,
    
    -- Alerta de paquete por vencer
    alerta_paquete_clases INTEGER DEFAULT 2, -- cuando quedan X clases
    alerta_paquete_dias INTEGER DEFAULT 7, -- X días antes de vencer
    
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 18. PLANES Y SUSCRIPCIONES
-- ============================================

CREATE TABLE instructor_planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    
    -- Precios
    precio_mensual INTEGER NOT NULL,
    precio_anual INTEGER,
    
    -- Límites
    max_alumnos INTEGER, -- null = ilimitado
    sms_mensuales INTEGER NOT NULL,
    
    -- Features
    pago_online BOOLEAN DEFAULT FALSE,
    perfil_destacado BOOLEAN DEFAULT FALSE,
    reportes_avanzados BOOLEAN DEFAULT FALSE,
    multi_instructor BOOLEAN DEFAULT FALSE,
    max_instructores INTEGER DEFAULT 1,
    
    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 0,
    
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Insertar planes por defecto
INSERT INTO instructor_planes (nombre, descripcion, precio_mensual, precio_anual, max_alumnos, sms_mensuales, pago_online, perfil_destacado, reportes_avanzados) VALUES
('BASICO', 'Plan básico para empezar', 99000, 990000, 20, 50, FALSE, FALSE, FALSE),
('PRO', 'Plan profesional completo', 199000, 1990000, NULL, 200, TRUE, TRUE, TRUE),
('ACADEMIA', 'Para academias con múltiples instructores', 399000, 3990000, NULL, 500, TRUE, TRUE, TRUE);

-- ============================================
-- 19. HISTORIAL DE SUSCRIPCIONES
-- ============================================

CREATE TABLE instructor_suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES instructores(id),
    plan_id UUID NOT NULL REFERENCES instructor_planes(id),
    
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    -- Pago
    monto_pagado INTEGER NOT NULL,
    metodo_pago VARCHAR(20),
    bancard_transaccion_id VARCHAR(100),
    
    estado VARCHAR(20) DEFAULT 'ACTIVA', -- ACTIVA, VENCIDA, CANCELADA
    
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_suscripciones_instructor ON instructor_suscripciones(instructor_id);

-- ============================================
-- TRIGGERS Y FUNCIONES
-- ============================================

-- Trigger para actualizar estadísticas del instructor
CREATE OR REPLACE FUNCTION actualizar_stats_instructor()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE instructores SET
        total_clases_dadas = (
            SELECT COUNT(*) FROM clases 
            WHERE instructor_id = NEW.instructor_id 
            AND estado = 'COMPLETADA'
        ),
        total_alumnos = (
            SELECT COUNT(*) FROM instructor_alumnos 
            WHERE instructor_id = NEW.instructor_id 
            AND estado = 'ACTIVO'
        ),
        actualizado_en = NOW()
    WHERE id = NEW.instructor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stats_clase
AFTER INSERT OR UPDATE ON clases
FOR EACH ROW EXECUTE FUNCTION actualizar_stats_instructor();

-- Trigger para actualizar rating promedio
CREATE OR REPLACE FUNCTION actualizar_rating_instructor()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE instructores SET
        rating_promedio = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM instructor_resenas 
            WHERE instructor_id = NEW.instructor_id 
            AND visible = TRUE
        ),
        total_resenas = (
            SELECT COUNT(*) 
            FROM instructor_resenas 
            WHERE instructor_id = NEW.instructor_id 
            AND visible = TRUE
        ),
        actualizado_en = NOW()
    WHERE id = NEW.instructor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_rating
AFTER INSERT OR UPDATE OR DELETE ON instructor_resenas
FOR EACH ROW EXECUTE FUNCTION actualizar_rating_instructor();

-- Trigger para descontar clase de paquete
CREATE OR REPLACE FUNCTION descontar_clase_paquete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.paquete_usado_id IS NOT NULL AND NEW.estado = 'ASISTIO' THEN
        UPDATE alumno_paquetes SET
            clases_usadas = clases_usadas + 1
        WHERE id = NEW.paquete_usado_id;
        
        -- Verificar si se agotó
        UPDATE alumno_paquetes SET
            estado = 'AGOTADO'
        WHERE id = NEW.paquete_usado_id
        AND clases_usadas >= clases_totales;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_descontar_paquete
AFTER UPDATE ON clase_alumnos
FOR EACH ROW 
WHEN (OLD.estado != 'ASISTIO' AND NEW.estado = 'ASISTIO')
EXECUTE FUNCTION descontar_clase_paquete();
```

---

# 12. API ENDPOINTS

## 12.1 Endpoints del Módulo

```
INSTRUCTORES
────────────────────────────────────────────────────────────────
POST   /api/instructores/solicitar          Solicitar ser instructor
GET    /api/instructores/mi-perfil          Obtener mi perfil instructor
PUT    /api/instructores/mi-perfil          Actualizar perfil
GET    /api/instructores/:id                Perfil público
GET    /api/instructores                    Buscar instructores (público)
POST   /api/instructores/:id/resena         Dejar reseña

ADMIN
────────────────────────────────────────────────────────────────
GET    /api/admin/instructores/pendientes   Solicitudes pendientes
POST   /api/admin/instructores/:id/aprobar  Aprobar instructor
POST   /api/admin/instructores/:id/rechazar Rechazar instructor

DISPONIBILIDAD
────────────────────────────────────────────────────────────────
GET    /api/instructores/disponibilidad     Mi disponibilidad
PUT    /api/instructores/disponibilidad     Actualizar disponibilidad
POST   /api/instructores/bloqueos           Crear bloqueo
DELETE /api/instructores/bloqueos/:id       Eliminar bloqueo
GET    /api/instructores/:id/horarios       Horarios disponibles (público)

ALUMNOS
────────────────────────────────────────────────────────────────
GET    /api/instructores/alumnos            Listar mis alumnos
POST   /api/instructores/alumnos            Agregar alumno
GET    /api/instructores/alumnos/:id        Ficha del alumno
PUT    /api/instructores/alumnos/:id        Actualizar alumno
DELETE /api/instructores/alumnos/:id        Eliminar alumno
POST   /api/instructores/alumnos/:id/nota   Agregar nota

CLASES
────────────────────────────────────────────────────────────────
GET    /api/instructores/clases             Listar mis clases
POST   /api/instructores/clases             Crear clase
GET    /api/instructores/clases/:id         Detalle de clase
PUT    /api/instructores/clases/:id         Actualizar clase
DELETE /api/instructores/clases/:id         Cancelar clase
POST   /api/instructores/clases/:id/completar   Marcar completada
POST   /api/instructores/clases/serie       Crear serie recurrente

RESERVAS
────────────────────────────────────────────────────────────────
GET    /api/instructores/reservas           Mis solicitudes pendientes
POST   /api/instructores/:id/reservar       Solicitar reserva (alumno)
PUT    /api/instructores/reservas/:id       Aprobar/rechazar
GET    /api/mis-reservas                    Mis reservas como alumno

PAQUETES
────────────────────────────────────────────────────────────────
GET    /api/instructores/paquetes           Mis paquetes configurados
POST   /api/instructores/paquetes           Crear paquete
PUT    /api/instructores/paquetes/:id       Actualizar paquete
DELETE /api/instructores/paquetes/:id       Eliminar paquete
POST   /api/instructores/paquetes/vender    Vender paquete a alumno

PAGOS
────────────────────────────────────────────────────────────────
GET    /api/instructores/pagos              Historial de pagos
POST   /api/instructores/pagos              Registrar pago manual
GET    /api/instructores/pagos/pendientes   Pagos pendientes
POST   /api/instructores/pagos/:id/recordatorio  Enviar recordatorio
POST   /api/instructores/pagos/link         Generar link de pago Bancard

COMUNICACIÓN
────────────────────────────────────────────────────────────────
POST   /api/instructores/mensajes           Enviar mensaje
POST   /api/instructores/mensajes/masivo    Mensaje masivo
GET    /api/instructores/sms/saldo          Saldo SMS disponible

REPORTES
────────────────────────────────────────────────────────────────
GET    /api/instructores/dashboard          Dashboard resumen
GET    /api/instructores/reportes/financiero    Reporte financiero
GET    /api/instructores/reportes/alumnos       Reporte de alumnos
GET    /api/instructores/reportes/ocupacion     Reporte de ocupación
GET    /api/instructores/reportes/export        Exportar a Excel
```

---

# 13. MODELO DE PRECIOS

## 13.1 Planes para Instructores

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   PLAN BÁSICO                    PLAN PRO ⭐               ACADEMIA    │
│   Gs. 99.000/mes                 Gs. 199.000/mes          Gs. 399.000  │
│                                  Gs. 1.990.000/año                      │
│   ─────────────                  ───────────────          ───────────  │
│                                                                         │
│   ✓ Hasta 20 alumnos            ✓ Alumnos ilimitados     ✓ Ilimitado  │
│   ✓ 50 SMS/mes                  ✓ 200 SMS/mes            ✓ 500 SMS    │
│   ✓ Calendario básico           ✓ Calendario completo    ✓ Completo   │
│   ✓ Gestión de clases          ✓ Clases recurrentes     ✓ Recurrente │
│   ✓ Perfil público             ✓ Perfil destacado ⭐     ✓ Destacado  │
│   ✗ Pago online                ✓ Pago con Bancard       ✓ Bancard    │
│   ✗ Reportes avanzados         ✓ Reportes completos     ✓ Reportes   │
│   ✗ Multi-instructor           ✗ Solo 1 instructor      ✓ Hasta 5    │
│                                                                         │
│   [Elegir]                      [Elegir]                 [Contactar]   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 13.2 Comisiones y Costos

```
COMISIONES FAIRPADEL
────────────────────────────────────────────────────────────────

Pagos online (Bancard):
• FairPadel: 5% del monto
• Bancard: ~2.5% (lo paga el instructor o el alumno, configurable)

SMS:
• Incluidos según plan
• SMS adicionales: Gs. 500/mensaje

EJEMPLO DE LIQUIDACIÓN
────────────────────────────────────────────────────────────────

Instructor cobra clase de Gs. 150.000 por Bancard:

  Monto cobrado:           Gs. 150.000
  (-) Comisión FairPadel:  Gs.   7.500 (5%)
  (-) Comisión Bancard:    Gs.   3.750 (2.5%)
  ────────────────────────────────────
  Neto instructor:         Gs. 138.750
```

---

# 14. ROADMAP DE IMPLEMENTACIÓN

## 14.1 Fases de Desarrollo

```
FASE 1: MVP (4-6 semanas)
════════════════════════════════════════════════════════════════
Semana 1-2:
  □ Modelo de datos (migraciones Prisma)
  □ Registro y aprobación de instructores
  □ Perfil básico del instructor

Semana 3-4:
  □ Calendario y disponibilidad
  □ Creación de clases manuales
  □ Gestión básica de alumnos

Semana 5-6:
  □ Sistema de reservas
  □ Perfil público y búsqueda
  □ Notificaciones básicas (email)

FASE 2: CORE FEATURES (4 semanas)
════════════════════════════════════════════════════════════════
Semana 7-8:
  □ Sistema de pagos (paquetes, cobros)
  □ Integración Bancard
  □ Control de deudas

Semana 9-10:
  □ SMS (integración proveedor)
  □ Recordatorios automáticos
  □ Mensajes masivos

FASE 3: AVANZADO (4 semanas)
════════════════════════════════════════════════════════════════
Semana 11-12:
  □ Dashboard y reportes
  □ Exportaciones
  □ Clases recurrentes

Semana 13-14:
  □ Sistema de reseñas
  □ Biblioteca de ejercicios
  □ Notas y progreso de alumnos

FASE 4: PULIDO (2 semanas)
════════════════════════════════════════════════════════════════
Semana 15-16:
  □ Optimizaciones de UX
  □ Testing completo
  □ Documentación
  □ Lanzamiento beta
```

## 14.2 Prioridad de Features

```
CRÍTICO (Lanzamiento)
─────────────────────
1. Registro de instructor
2. Calendario y disponibilidad
3. Creación de clases
4. Gestión de alumnos
5. Sistema de reservas
6. Perfil público
7. Pagos manuales

IMPORTANTE (Mes 2)
──────────────────
8. Paquetes de clases
9. Pago online Bancard
10. SMS recordatorios
11. Dashboard básico
12. Reseñas

DESEABLE (Mes 3+)
─────────────────
13. Reportes avanzados
14. Clases recurrentes
15. Biblioteca ejercicios
16. Progreso de alumnos
17. Plan Academia (multi-instructor)
```

---

# 15. CONCLUSIÓN

Este módulo de Instructores Premium representa un nuevo vertical de negocio significativo para FairPadel, con potencial de:

**Ingresos estimados:**
- 50 instructores × Gs. 150.000 promedio/mes = Gs. 7.500.000/mes
- Comisiones sobre pagos online (5%) = Variable según volumen
- SMS adicionales = Ingreso marginal

**Valor agregado:**
- Diferenciación vs competencia (ninguno ofrece esto)
- Ecosistema completo: jugadores + torneos + instructores
- Retención de usuarios (alumnos se vuelven jugadores de torneos)
- Datos valiosos sobre el mercado de enseñanza de pádel

---

> Documento generado para FairPadel
> Módulo: Instructores Premium
> Versión: 1.0 | Febrero 2026
