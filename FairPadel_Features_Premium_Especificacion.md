# 🎯 FAIRPADEL — ESPECIFICACIÓN DE FEATURES PREMIUM

> Documento de diseño para las funcionalidades Premium de jugadores.
> Cada feature incluye: concepto, UX/UI, datos requeridos, estructura técnica y presentación.

---

## 📋 ÍNDICE DE FEATURES

| # | Feature | Complejidad | Prioridad Sugerida |
|---|---------|-------------|-------------------|
| 1 | Match de Pareja Inteligente | 🔴 Alta | ⭐⭐⭐ Crítica |
| 2 | Scout de Rivales | 🟡 Media | ⭐⭐⭐ Crítica |
| 3 | Ligas Privadas | 🔴 Alta | ⭐⭐ Alta |
| 4 | Coach IA | 🟡 Media | ⭐⭐ Alta |
| 5 | Apuestas de Puntos | 🟡 Media | ⭐ Media |
| 6 | Resumen Semanal Premium | 🟢 Baja | ⭐⭐ Alta |
| 7 | Alertas Personalizadas | 🟢 Baja | ⭐⭐⭐ Crítica |
| 8 | Historial de Torneos Visual | 🟢 Baja | ⭐ Media |
| 9 | Badges Exclusivos | 🟢 Baja | ⭐⭐ Alta |
| 10 | Perfil Verificado/Premium | 🟢 Baja | ⭐⭐⭐ Crítica |
| 11 | Análisis Post-Partido | 🟡 Media | ⭐⭐ Alta |

---

# 1. 🤝 MATCH DE PAREJA INTELIGENTE

## Concepto
Sistema de matchmaking que sugiere parejas compatibles basándose en múltiples factores. Resuelve el problema #1 del jugador amateur: "No tengo con quién jugar".

## Cómo Funciona

### Paso 1: El jugador activa "Busco Pareja"
```
┌─────────────────────────────────────────┐
│  🔍 BUSCO PAREJA                        │
├─────────────────────────────────────────┤
│                                         │
│  ¿Para qué torneo?                      │
│  ┌─────────────────────────────────┐    │
│  │ 🏆 Torneo Verano CDE - 7ma     │▼   │
│  └─────────────────────────────────┘    │
│                                         │
│  Mi estilo de juego:                    │
│  ○ Agresivo (drive/remate)              │
│  ● Defensivo (bandeja/lob)              │
│  ○ Equilibrado                          │
│                                         │
│  Posición preferida:                    │
│  ○ Derecha                              │
│  ● Revés                                │
│  ○ Ambas                                │
│                                         │
│  Disponibilidad para entrenar:          │
│  ☑ Lunes    ☑ Miércoles    ☐ Viernes   │
│  ☐ Martes   ☑ Jueves      ☑ Sábado    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     🚀 BUSCAR PAREJAS          │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Paso 2: El algoritmo calcula compatibilidad
```
Factores del algoritmo (pesos configurables):

┌────────────────────────────────────────────────────┐
│ COMPATIBILIDAD = Σ (Factor × Peso)                 │
├────────────────────────────────────────────────────┤
│                                                    │
│ 📊 Nivel similar (±1 categoría)         Peso: 30% │
│ 📍 Misma ciudad/zona                    Peso: 25% │
│ 🎯 Posiciones complementarias           Peso: 20% │
│    (Si busca revés → mostrar derechas)            │
│ 📅 Disponibilidad coincidente           Peso: 15% │
│ ⚔️ Estilos complementarios              Peso: 10% │
│    (Agresivo + Defensivo = buena dupla)           │
│                                                    │
│ BONUS:                                             │
│ +10% si ya jugaron juntos antes                   │
│ +5% si tienen amigos en común                     │
│ -20% si tienen historial de conflicto             │
└────────────────────────────────────────────────────┘
```

### Paso 3: Resultados con % de compatibilidad
```
┌─────────────────────────────────────────────────────┐
│  🎯 PAREJAS SUGERIDAS                    Premium ⭐ │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📷 CARLOS MENDEZ              95% Match 💚  │   │
│  │ ────────────────────────────────────────    │   │
│  │ 📊 7ma Categoría | 🏆 Ranking #45           │   │
│  │ 📍 Ciudad del Este | 🎾 Posición: Derecha   │   │
│  │ ⚔️ Estilo: Agresivo                         │   │
│  │ 📅 Disponible: Lun, Mié, Sáb               │   │
│  │                                             │   │
│  │ 💡 "Complementa tu estilo defensivo"       │   │
│  │                                             │   │
│  │ [💬 Contactar]  [👁️ Ver Perfil]           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📷 ROBERTO SILVA              87% Match 💛  │   │
│  │ ────────────────────────────────────────    │   │
│  │ 📊 6ta Categoría | 🏆 Ranking #28           │   │
│  │ 📍 Hernandarias | 🎾 Posición: Ambas        │   │
│  │ ⚔️ Estilo: Equilibrado                      │   │
│  │ 📅 Disponible: Mar, Jue, Sáb               │   │
│  │                                             │   │
│  │ ⚠️ "Categoría superior - buen desafío"     │   │
│  │                                             │   │
│  │ [💬 Contactar]  [👁️ Ver Perfil]           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📷 MIGUEL TORRES              72% Match 🔶  │   │
│  │ ... (más resultados)                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Datos Requeridos

### Nuevos campos en perfil de usuario:
```sql
-- Agregar a tabla users o crear tabla user_preferences
ALTER TABLE users ADD COLUMN estilo_juego TEXT; -- 'AGRESIVO', 'DEFENSIVO', 'EQUILIBRADO'
ALTER TABLE users ADD COLUMN posicion_preferida TEXT; -- 'DERECHA', 'REVES', 'AMBAS'
ALTER TABLE users ADD COLUMN disponibilidad JSONB; -- {"lunes": true, "martes": false, ...}
ALTER TABLE users ADD COLUMN busca_pareja BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN busca_pareja_torneo_id TEXT; -- FK opcional
```

### Nueva tabla para tracking de compatibilidad:
```sql
CREATE TABLE match_pareja_log (
    id TEXT PRIMARY KEY,
    usuario_buscador_id TEXT NOT NULL,
    usuario_sugerido_id TEXT NOT NULL,
    porcentaje_match INTEGER,
    contactado BOOLEAN DEFAULT false,
    resultado TEXT, -- 'ACEPTADO', 'RECHAZADO', 'PENDIENTE'
    creado_en TIMESTAMP DEFAULT NOW()
);
```

## Presentación Atractiva

### En el perfil del usuario FREE:
```
┌─────────────────────────────────────────┐
│  🔒 MATCH DE PAREJA INTELIGENTE         │
│                                         │
│  "Encontrá tu pareja ideal con IA"      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🔓 DESBLOQUEAR CON PREMIUM     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ✓ Algoritmo de compatibilidad          │
│  ✓ Filtros avanzados                    │
│  ✓ Sugerencias personalizadas           │
└─────────────────────────────────────────┘
```

### Notificación cuando alguien te elige:
```
┌─────────────────────────────────────────┐
│ 🎾 ¡ALGUIEN QUIERE JUGAR CONTIGO!       │
│                                         │
│ Carlos M. te seleccionó como pareja     │
│ para el Torneo Verano CDE               │
│                                         │
│ Compatibilidad: 95% 💚                  │
│                                         │
│ [Aceptar]  [Ver Perfil]  [Rechazar]    │
└─────────────────────────────────────────┘
```

---

# 2. 🎯 SCOUT DE RIVALES

## Concepto
Antes de cada partido, el jugador Premium puede ver un "informe de inteligencia" sobre sus rivales: historial, estadísticas, puntos fuertes y débiles.

## Cómo Funciona

### Trigger: Cuando se publica el fixture
```
El sistema detecta:
- Usuario Premium tiene partido programado
- Se identifican los rivales
- Se genera automáticamente el informe scout
- Se envía notificación: "Tu informe de rivales está listo"
```

### Pantalla de Scout
```
┌──────────────────────────────────────────────────────┐
│  🎯 SCOUT DE RIVALES                      Premium ⭐ │
│  Torneo: Verano CDE | Ronda: Cuartos de Final       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  TUS PRÓXIMOS RIVALES                               │
│  ══════════════════════════════════════════════════ │
│                                                      │
│  ┌────────────────────┐  ┌────────────────────┐     │
│  │ 📷 JUAN LÓPEZ      │  │ 📷 PEDRO GÓMEZ     │     │
│  │ Posición: Derecha  │  │ Posición: Revés    │     │
│  │ Ranking: #23       │  │ Ranking: #31       │     │
│  └────────────────────┘  └────────────────────┘     │
│                                                      │
│  📊 ESTADÍSTICAS DE LA PAREJA                       │
│  ┌──────────────────────────────────────────────┐   │
│  │ Torneos juntos:     8                        │   │
│  │ Victorias:          12 (60%)                 │   │
│  │ Derrotas:           8 (40%)                  │   │
│  │ Sets ganados:       28 / 45 (62%)            │   │
│  │ Mejor resultado:    🥈 Finalistas (2 veces) │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  💪 PUNTOS FUERTES                                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ • Saque potente de Juan (75% 1er saque in)  │   │
│  │ • Defensa sólida de Pedro en pared          │   │
│  │ • Buena comunicación (juegan hace 2 años)   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ⚠️ PUNTOS DÉBILES                                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ • Juan comete errores bajo presión          │   │
│  │   (40% victorias en 3er set)                │   │
│  │ • Pedro débil en globos altos               │   │
│  │ • Pierden contra parejas defensivas         │   │
│  │   (2-5 récord vs estilos defensivos)        │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ⚔️ TU HISTORIAL VS ELLOS                          │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │   TÚ  2 - 1  ELLOS                          │   │
│  │                                              │   │
│  │   ✅ Ganaste 6-4, 6-3 (Mar 2025)            │   │
│  │   ❌ Perdiste 4-6, 6-7 (Ene 2025)           │   │
│  │   ✅ Ganaste 7-5, 6-4 (Nov 2024)            │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  💡 RECOMENDACIÓN TÁCTICA                           │
│  ┌──────────────────────────────────────────────┐   │
│  │ "Atacá el revés de Juan con globos altos.   │   │
│  │  Mantené intercambios largos para forzar    │   │
│  │  errores bajo presión. Evitá el duelo       │   │
│  │  de potencia con Pedro."                    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [📤 Compartir con mi pareja]  [🖨️ Imprimir]       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Datos Requeridos

### Cálculos automáticos desde datos existentes:
```
Ya tenemos en el sistema:
✓ Historial de partidos (resultados)
✓ Ranking de cada jugador
✓ Torneos jugados juntos como pareja

Necesitamos trackear:
- Sets ganados/perdidos (no solo partido)
- Resultado por set (para calcular rendimiento en sets decisivos)
```

### Nueva tabla para estadísticas detalladas:
```sql
CREATE TABLE partido_stats (
    id TEXT PRIMARY KEY,
    partido_id TEXT NOT NULL,
    set_numero INTEGER,
    games_pareja1 INTEGER,
    games_pareja2 INTEGER,
    tiebreak BOOLEAN DEFAULT false,
    -- Futuro: puntos clave, errores no forzados, etc.
    creado_en TIMESTAMP DEFAULT NOW()
);
```

### Generación de insights:
```javascript
// Pseudocódigo para generar puntos fuertes/débiles
function generarInsights(jugador) {
    const stats = obtenerEstadisticas(jugador);
    
    const puntosFuertes = [];
    const puntosDebiles = [];
    
    // Análisis de rendimiento bajo presión
    if (stats.victoriasEnTercerSet > 60%) {
        puntosFuertes.push("Fuerte bajo presión");
    } else if (stats.victoriasEnTercerSet < 40%) {
        puntosDebiles.push("Comete errores bajo presión");
    }
    
    // Análisis vs estilos de juego
    if (stats.victorias_vs_defensivos < 40%) {
        puntosDebiles.push("Pierden contra parejas defensivas");
    }
    
    // ... más reglas
    
    return { puntosFuertes, puntosDebiles };
}
```

## Presentación para FREE (Teaser)
```
┌──────────────────────────────────────────┐
│  🎯 SCOUT DE RIVALES           🔒 PREMIUM │
│                                          │
│  Tus próximos rivales:                   │
│  Juan López & Pedro Gómez                │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │ ░░ ESTADÍSTICAS OCULTAS ░░░░░░░░ │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Con Premium verías:                     │
│  ✓ Su récord como pareja                │
│  ✓ Puntos fuertes y débiles             │
│  ✓ Tu historial vs ellos                │
│  ✓ Recomendaciones tácticas             │
│                                          │
│  [🔓 DESBLOQUEAR CON PREMIUM]           │
└──────────────────────────────────────────┘
```

---

# 3. 🏅 LIGAS PRIVADAS

## Concepto
Crear competencias cerradas entre un grupo de amigos/conocidos con ranking interno, reglas personalizadas y tabla de posiciones propia.

## Cómo Funciona

### Paso 1: Crear Liga
```
┌─────────────────────────────────────────────────────┐
│  🏅 CREAR LIGA PRIVADA                   Premium ⭐ │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Nombre de la liga:                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ Los Capos del Pádel                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Descripción:                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ Liga entre amigos del trabajo. El que      │   │
│  │ termine último paga el asado.              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  📷 Logo de la liga:                               │
│  [Subir imagen]                                    │
│                                                     │
│  Tipo de liga:                                      │
│  ○ Todos contra todos (Round Robin)                │
│  ● Acumulación de puntos (como FairPadel)          │
│  ○ Eliminación directa                             │
│                                                     │
│  Privacidad:                                        │
│  ● Privada (solo con invitación)                   │
│  ○ Pública (cualquiera puede pedir unirse)         │
│                                                     │
│  Duración:                                          │
│  ○ Permanente                                       │
│  ● Temporada (Fecha inicio - Fecha fin)            │
│    Inicio: [15/03/2026]  Fin: [15/06/2026]        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           🚀 CREAR LIGA                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Paso 2: Invitar Miembros
```
┌─────────────────────────────────────────────────────┐
│  👥 INVITAR A LA LIGA                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔗 Link de invitación:                            │
│  ┌─────────────────────────────────────────────┐   │
│  │ fairpadel.com/liga/abc123xyz               │📋 │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  O buscá jugadores:                                │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🔍 Buscar por nombre o documento...        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Miembros actuales (4/20):                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ 👑 Héctor V. (Admin)                   ─────│   │
│  │ 👤 Carlos M.                      [Expulsar]│   │
│  │ 👤 Roberto S.                     [Expulsar]│   │
│  │ 👤 Juan P.                        [Expulsar]│   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Invitaciones pendientes (2):                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ ⏳ Miguel T.                     [Cancelar] │   │
│  │ ⏳ Ana R.                        [Cancelar] │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [📤 Compartir en WhatsApp]                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Paso 3: Vista de Liga Activa
```
┌────────────────────────────────────────────────────────┐
│  🏅 LOS CAPOS DEL PÁDEL                                │
│  Temporada: Mar - Jun 2026 | 12 miembros               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📊 TABLA DE POSICIONES                                │
│  ┌────────────────────────────────────────────────┐   │
│  │ #  │ Jugador        │ Pts │ PJ │ PG │ PP │ Dif │   │
│  ├────┼────────────────┼─────┼────┼────┼────┼─────┤   │
│  │ 1  │ 🥇 Héctor V.   │ 450 │ 8  │ 7  │ 1  │ +12 │   │
│  │ 2  │ 🥈 Carlos M.   │ 380 │ 8  │ 6  │ 2  │ +8  │   │
│  │ 3  │ 🥉 Roberto S.  │ 320 │ 7  │ 5  │ 2  │ +5  │   │
│  │ 4  │    Juan P.     │ 290 │ 8  │ 4  │ 4  │ +1  │   │
│  │ 5  │    Miguel T.   │ 250 │ 6  │ 4  │ 2  │ +3  │   │
│  │ ...│ ...            │ ... │ ...│ ...│ ...│ ... │   │
│  │ 12 │ 💀 Pedro G.    │ 85  │ 8  │ 1  │ 7  │ -15 │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  📅 PRÓXIMOS PARTIDOS DE LA LIGA                       │
│  ┌────────────────────────────────────────────────┐   │
│  │ Torneo Verano CDE (cuenta para la liga)        │   │
│  │ 📅 20 Mar | Héctor vs Miguel | Cuartos         │   │
│  │ 📅 20 Mar | Carlos vs Juan | Cuartos           │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  🏆 LOGROS DE LA LIGA                                  │
│  ┌────────────────────────────────────────────────┐   │
│  │ 🔥 Racha más larga: Héctor (5 victorias)       │   │
│  │ 💪 Mayor goleada: Carlos 6-0, 6-1 vs Pedro     │   │
│  │ 😅 Más derrotas: Pedro (7)                     │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  [📊 Estadísticas]  [⚙️ Config]  [📤 Compartir]       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Datos Requeridos

### Nuevas tablas:
```sql
CREATE TABLE ligas_privadas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    logo_url TEXT,
    creador_id TEXT NOT NULL, -- FK a users
    tipo TEXT NOT NULL, -- 'ROUND_ROBIN', 'ACUMULACION', 'ELIMINACION'
    privacidad TEXT DEFAULT 'PRIVADA',
    fecha_inicio DATE,
    fecha_fin DATE,
    activa BOOLEAN DEFAULT true,
    config JSONB, -- reglas personalizadas
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE liga_miembros (
    id TEXT PRIMARY KEY,
    liga_id TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    rol TEXT DEFAULT 'MIEMBRO', -- 'ADMIN', 'MIEMBRO'
    puntos_liga INTEGER DEFAULT 0,
    partidos_jugados INTEGER DEFAULT 0,
    partidos_ganados INTEGER DEFAULT 0,
    fecha_union TIMESTAMP DEFAULT NOW(),
    UNIQUE(liga_id, usuario_id)
);

CREATE TABLE liga_invitaciones (
    id TEXT PRIMARY KEY,
    liga_id TEXT NOT NULL,
    invitado_id TEXT, -- puede ser null si es por link
    codigo_invitacion TEXT UNIQUE,
    estado TEXT DEFAULT 'PENDIENTE',
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Los partidos de torneos oficiales se vinculan automáticamente
-- si ambos jugadores son de la misma liga
CREATE TABLE liga_partidos (
    id TEXT PRIMARY KEY,
    liga_id TEXT NOT NULL,
    partido_id TEXT NOT NULL, -- FK a partidos de torneos
    puntos_ganador INTEGER,
    creado_en TIMESTAMP DEFAULT NOW()
);
```

## Modelo de Negocio
```
FREE:
- Puede UNIRSE a ligas privadas (máximo 2)
- NO puede CREAR ligas

PREMIUM:
- Puede CREAR ligas ilimitadas
- Puede unirse a ligas ilimitadas
- Acceso a estadísticas avanzadas de liga
- Personalización completa (logo, reglas, etc.)
```

---

# 4. 🤖 COACH IA

## Concepto
Un asistente inteligente que analiza tus estadísticas y te da consejos personalizados para mejorar tu juego y subir en el ranking.

## Cómo Funciona

### Interfaz de Chat con el Coach
```
┌─────────────────────────────────────────────────────┐
│  🤖 COACH IA                             Premium ⭐ │
│  Tu entrenador personal de pádel                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🤖 ¡Hola Héctor! He analizado tu última     │   │
│  │    semana y tengo algunas observaciones:    │   │
│  │                                             │   │
│  │    📈 Subiste 3 posiciones en el ranking   │   │
│  │    🏆 Ganaste 4 de 5 partidos              │   │
│  │    ⚠️ Perdiste los 2 partidos vs parejas  │   │
│  │       agresivas                            │   │
│  │                                             │   │
│  │    Mi recomendación: Trabajá en tu         │   │
│  │    respuesta a ataques rápidos. ¿Querés    │   │
│  │    que te sugiera ejercicios?              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 👤 Sí, dame ejercicios para mejorar        │   │
│  │    contra parejas agresivas                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🤖 Perfecto, te recomiendo:                │   │
│  │                                             │   │
│  │    1. 🎾 Práctica de bloqueo               │   │
│  │       15 min de defensa pura contra       │   │
│  │       smashes. Objetivo: devolver 7/10    │   │
│  │                                             │   │
│  │    2. 🦶 Posicionamiento                   │   │
│  │       Contra agresivos, parate 1 metro    │   │
│  │       más atrás de lo normal              │   │
│  │                                             │   │
│  │    3. 🎯 Contraataque con globo           │   │
│  │       Practicá globos defensivos que      │   │
│  │       lleguen al fondo. Quebrás su ritmo  │   │
│  │                                             │   │
│  │    ¿Querés que te recuerde practicar      │   │
│  │    esto antes de tu próximo torneo?       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Escribí tu pregunta...                  📤 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  💡 Sugerencias rápidas:                           │
│  [¿Cómo subo de categoría?]                        │
│  [Analiza mi último torneo]                        │
│  [¿Con quién debería jugar?]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Widgets del Coach en Dashboard
```
┌─────────────────────────────────────────┐
│  🤖 CONSEJO DEL DÍA                     │
│                                         │
│  "Tu % de victorias baja los domingos   │
│   (45% vs 68% otros días). ¿Cansancio   │
│   acumulado? Considerá descansar los    │
│   sábados antes de torneos domingo."    │
│                                         │
│  [Ver análisis completo →]              │
└─────────────────────────────────────────┘
```

## Implementación Técnica

### Backend: Llamadas a API de Claude
```javascript
// Endpoint: POST /api/coach/consulta
async function consultaCoach(usuarioId, pregunta) {
    // 1. Obtener contexto del usuario
    const stats = await obtenerEstadisticasCompletas(usuarioId);
    const historial = await obtenerUltimosPartidos(usuarioId, 10);
    const ranking = await obtenerPosicionRanking(usuarioId);
    
    // 2. Construir prompt con contexto
    const prompt = `
        Eres un coach profesional de pádel. 
        
        Datos del jugador:
        - Nombre: ${stats.nombre}
        - Categoría: ${stats.categoria}
        - Ranking: #${ranking.posicion}
        - Victorias: ${stats.victorias}/${stats.totalPartidos} (${stats.porcentajeVictorias}%)
        - Últimos resultados: ${historial.map(p => p.resultado).join(', ')}
        - Puntos fuertes detectados: ${stats.puntosFuertes}
        - Puntos débiles detectados: ${stats.puntosDebiles}
        
        El jugador pregunta: "${pregunta}"
        
        Responde de forma concisa, práctica y motivadora.
        Usa datos específicos del jugador cuando sea relevante.
        Máximo 150 palabras.
    `;
    
    // 3. Llamar a Claude API
    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }]
    });
    
    return response.content[0].text;
}
```

### Análisis Automático Semanal
```javascript
// Cron job: Todos los lunes a las 8am
async function generarAnalisisSemanal(usuarioId) {
    const statsSemanaPasada = await getStatsUltimos7Dias(usuarioId);
    const comparacionSemanaAnterior = await compararConSemanaAnterior(usuarioId);
    
    const insights = {
        partidosJugados: statsSemanaPasada.partidos,
        victorias: statsSemanaPasada.victorias,
        cambioRanking: comparacionSemanaAnterior.ranking,
        patronesDetectados: detectarPatrones(statsSemanaPasada),
        recomendacion: await generarRecomendacionIA(statsSemanaPasada)
    };
    
    await guardarAnalisisSemanal(usuarioId, insights);
    await enviarNotificacion(usuarioId, "Tu análisis semanal está listo");
}
```

## Costos y Límites
```
Para controlar costos de API:

PREMIUM:
- 20 consultas al Coach por mes
- Análisis semanal automático incluido
- Consejos diarios (pregenerados, no cuestan API)

Costo estimado por usuario Premium activo:
- ~5 consultas reales/mes × $0.003 = $0.015/mes
- Análisis semanal × 4 = $0.012/mes
- Total: ~$0.03/mes por usuario Premium
```

---

# 5. 🎰 APUESTAS DE PUNTOS

## Concepto
Sistema de gamificación donde los usuarios apuestan "FairCoins" (puntos virtuales) en resultados de partidos. No es dinero real, es pura diversión y engagement.

## Cómo Funciona

### Moneda Virtual: FairCoins 🪙
```
Cada usuario recibe:
- 100 FairCoins al registrarse
- 10 FairCoins por cada partido que juega
- 5 FairCoins por login diario
- Bonus por rachas de aciertos

Los FairCoins NO se pueden comprar con dinero real
Los FairCoins NO se pueden convertir a dinero real
```

### Pantalla de Apuestas
```
┌─────────────────────────────────────────────────────────┐
│  🎰 PREDICCIONES                          Premium ⭐    │
│  Tus FairCoins: 🪙 450                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔥 PARTIDOS DE HOY                                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  CUARTOS DE FINAL - Torneo Verano CDE           │   │
│  │  ─────────────────────────────────────────────  │   │
│  │                                                 │   │
│  │  Héctor V. / Carlos M.                         │   │
│  │         VS                                      │   │
│  │  Juan P. / Miguel T.                           │   │
│  │                                                 │   │
│  │  ┌──────────────┐     ┌──────────────┐         │   │
│  │  │  HÉCTOR/     │     │  JUAN/       │         │   │
│  │  │  CARLOS      │     │  MIGUEL      │         │   │
│  │  │              │     │              │         │   │
│  │  │  Cuota: 1.5x │     │  Cuota: 2.3x │         │   │
│  │  │              │     │              │         │   │
│  │  │  [APOSTAR]   │     │  [APOSTAR]   │         │   │
│  │  └──────────────┘     └──────────────┘         │   │
│  │                                                 │   │
│  │  📊 65% apostó por Héctor/Carlos               │   │
│  │  ⏰ Cierre: 2 horas                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SEMIFINAL - Torneo Nacional                    │   │
│  │  ... (más partidos)                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Modal de Apuesta
```
┌─────────────────────────────────────────┐
│  🎰 HACER PREDICCIÓN                    │
├─────────────────────────────────────────┤
│                                         │
│  Apostando a: Héctor V. / Carlos M.     │
│  Cuota: 1.5x                            │
│                                         │
│  ¿Cuántos FairCoins apostás?            │
│                                         │
│  [10] [25] [50] [100] [____]           │
│                                         │
│  Tu apuesta: 🪙 50                       │
│  Ganancia potencial: 🪙 75              │
│                                         │
│  Tus FairCoins: 🪙 450 → 🪙 400         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      ✅ CONFIRMAR APUESTA       │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Ranking de Apostadores
```
┌─────────────────────────────────────────────────────┐
│  🏆 TOP PREDICTORES DEL MES                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  #  │ Jugador         │ 🪙 Coins │ Aciertos │ %    │
│  ───┼─────────────────┼──────────┼──────────┼───── │
│  1  │ 🥇 Roberto S.   │ 2,450    │ 18/23    │ 78%  │
│  2  │ 🥈 Ana M.       │ 1,890    │ 15/20    │ 75%  │
│  3  │ 🥉 Pedro G.     │ 1,650    │ 14/22    │ 64%  │
│  ...│                 │          │          │      │
│  45 │ 👤 Tú           │ 450      │ 8/15     │ 53%  │
│                                                     │
│  🎁 Premio fin de mes:                              │
│  Top 1: Badge "Oráculo del Pádel" + 500 FairCoins  │
│  Top 3: Badge "Vidente" + 200 FairCoins            │
│  Top 10: 100 FairCoins                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Datos Requeridos

```sql
CREATE TABLE fair_coins (
    id TEXT PRIMARY KEY,
    usuario_id TEXT UNIQUE NOT NULL,
    balance INTEGER DEFAULT 100,
    total_ganado INTEGER DEFAULT 0,
    total_apostado INTEGER DEFAULT 0,
    aciertos INTEGER DEFAULT 0,
    total_apuestas INTEGER DEFAULT 0,
    actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE apuestas (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    partido_id TEXT NOT NULL,
    pareja_apostada INTEGER, -- 1 o 2
    cantidad INTEGER NOT NULL,
    cuota DECIMAL(3,2) NOT NULL,
    estado TEXT DEFAULT 'PENDIENTE', -- 'GANADA', 'PERDIDA', 'CANCELADA'
    ganancia INTEGER, -- null hasta resolver
    creado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, partido_id)
);

CREATE TABLE fair_coins_transacciones (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'APUESTA', 'GANANCIA', 'BONUS_DIARIO', 'REGISTRO', etc.
    cantidad INTEGER NOT NULL, -- positivo o negativo
    referencia_id TEXT, -- partido_id o null
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT NOW()
);
```

## Modelo Premium
```
FREE:
- 3 predicciones por semana
- Gana FairCoins pero no puede canjear badges

PREMIUM:
- Predicciones ilimitadas
- Participa en ranking de predictores
- Puede ganar badges exclusivos
- Bonus de FairCoins por suscripción
```

---

# 6. 📧 RESUMEN SEMANAL PREMIUM

## Concepto
Cada lunes, los usuarios Premium reciben un email personalizado con su rendimiento, cambios de ranking, próximos torneos recomendados y tips.

## Diseño del Email

```html
┌─────────────────────────────────────────────────────────┐
│                    [LOGO FAIRPADEL]                     │
│                                                         │
│        📊 TU RESUMEN SEMANAL                           │
│        Semana del 10 al 16 de Marzo 2026               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ¡Hola Héctor! 👋                                      │
│                                                         │
│  Esta fue tu semana en FairPadel:                      │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  📈 TU RANKING                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │    #42  →  #38                                 │   │
│  │    ⬆️ Subiste 4 posiciones                     │   │
│  │                                                 │   │
│  │    Puntos: 1,250 (+120 esta semana)           │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🎾 TUS PARTIDOS                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ✅ Victoria vs Juan/Pedro      6-3, 6-4        │   │
│  │ ✅ Victoria vs Miguel/Carlos   7-5, 6-2        │   │
│  │ ❌ Derrota vs Roberto/Ana      4-6, 3-6        │   │
│  │                                                 │   │
│  │ Balance: 2-1 (67% victorias)                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🏆 PRÓXIMOS TORNEOS RECOMENDADOS                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │ 🎯 Torneo Primavera CDE                        │   │
│  │    22-24 Mar | 7ma Categoría | 35 parejas     │   │
│  │    💡 Puntos potenciales: +85 (si campeón)    │   │
│  │    [INSCRIBIRME →]                            │   │
│  │                                                 │   │
│  │ 🎯 Liga Itapuense - Fecha 3                   │   │
│  │    28 Mar | Abierto | 20 parejas              │   │
│  │    💡 Varios rivales de tu liga privada       │   │
│  │    [VER DETALLES →]                           │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 TIP DE LA SEMANA                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ "Notamos que tus derrotas suelen ser en 2     │   │
│  │  sets. Trabajá en arrancar fuerte el primer   │   │
│  │  set para ganar confianza."                   │   │
│  │                          - Coach IA 🤖        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  👀 MOVIMIENTOS EN TU ZONA                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⬆️ Carlos M. subió al #35 (te pasó)           │   │
│  │ ⬆️ Roberto S. subió al #40 (cerca de vos)     │   │
│  │ ⬇️ Juan P. bajó al #45                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  ¡Seguí así! Estás a 120 puntos del Top 30.           │
│                                                         │
│  [VER MI PERFIL COMPLETO]                              │
│                                                         │
│  ───────────────────────────────────────────────────── │
│  📱 Descargá la app | 📞 Soporte | ⚙️ Configuración   │
│                                                         │
│  © 2026 FairPadel - De Paraguay, para Paraguay        │
└─────────────────────────────────────────────────────────┘
```

## Implementación

```javascript
// Cron: Todos los lunes 7:00 AM
async function enviarResumenSemanal() {
    const usuariosPremium = await getUsuariosPremiumActivos();
    
    for (const usuario of usuariosPremium) {
        const resumen = {
            rankingActual: await getRanking(usuario.id),
            rankingAnterior: await getRankingHaceUnaSemana(usuario.id),
            partidos: await getPartidosUltimos7Dias(usuario.id),
            puntosGanados: await getPuntosGanados(usuario.id, 7),
            torneosRecomendados: await getTorneosRecomendados(usuario),
            movimientosZona: await getMovimientosRankingZona(usuario.id),
            tipSemanal: await generarTipPersonalizado(usuario.id)
        };
        
        const html = await renderEmailTemplate('resumen-semanal', resumen);
        
        await resend.emails.send({
            from: 'FairPadel <resumen@fairpadel.com>',
            to: usuario.email,
            subject: `📊 Tu semana en FairPadel: ${resumen.rankingActual > resumen.rankingAnterior ? '⬆️' : '⬇️'} Ranking #${resumen.rankingActual}`,
            html: html
        });
    }
}
```

---

# 7. 🔔 ALERTAS PERSONALIZADAS

## Concepto
El usuario configura exactamente qué notificaciones quiere recibir y bajo qué condiciones. Mucho más granular que notificaciones genéricas.

## Pantalla de Configuración

```
┌─────────────────────────────────────────────────────────┐
│  🔔 MIS ALERTAS                           Premium ⭐    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TORNEOS                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │ ☑️ Nuevo torneo en mi ciudad                   │   │
│  │    Ciudad: [Ciudad del Este ▼]                 │   │
│  │                                                 │   │
│  │ ☑️ Nuevo torneo de mi categoría               │   │
│  │    Categorías: [7ma ✓] [6ta ✓] [5ta ☐]       │   │
│  │                                                 │   │
│  │ ☑️ Torneo con pocos cupos (últimos 5)         │   │
│  │                                                 │   │
│  │ ☐ Cualquier torneo nuevo (puede ser mucho)    │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  RANKING                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │ ☑️ Alguien me superó en el ranking             │   │
│  │                                                 │   │
│  │ ☑️ Entré/salí del Top [10 ▼]                  │   │
│  │                                                 │   │
│  │ ☑️ Mi rival de liga subió/bajó                │   │
│  │    Rivales vigilados: [+ Agregar]             │   │
│  │    • Carlos M. (#35)                          │   │
│  │    • Roberto S. (#40)                         │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  PARTIDOS                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │ ☑️ Recordatorio 24h antes de mi partido       │   │
│  │                                                 │   │
│  │ ☑️ Fixture publicado (saber contra quién)     │   │
│  │                                                 │   │
│  │ ☑️ Cambio de horario de mi partido            │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  SOCIAL                                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │ ☑️ Alguien quiere ser mi pareja               │   │
│  │                                                 │   │
│  │ ☑️ Mensaje de organizador                      │   │
│  │                                                 │   │
│  │ ☐ Cualquier mensaje nuevo                      │   │
│  │                                                 │   │
│  │ ☐ Nuevo seguidor                               │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  CANALES DE NOTIFICACIÓN                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │ 📱 Push (App)           [Activado ✓]          │   │
│  │ 📧 Email                [Activado ✓]          │   │
│  │ 💬 WhatsApp             [Conectar →]          │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [💾 GUARDAR PREFERENCIAS]                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Datos Requeridos

```sql
CREATE TABLE alertas_config (
    id TEXT PRIMARY KEY,
    usuario_id TEXT UNIQUE NOT NULL,
    
    -- Torneos
    alerta_torneo_ciudad BOOLEAN DEFAULT true,
    alerta_torneo_ciudad_valor TEXT,
    alerta_torneo_categoria BOOLEAN DEFAULT true,
    alerta_torneo_categorias JSONB, -- ["7ma", "6ta"]
    alerta_torneo_pocos_cupos BOOLEAN DEFAULT false,
    alerta_cualquier_torneo BOOLEAN DEFAULT false,
    
    -- Ranking
    alerta_superado_ranking BOOLEAN DEFAULT true,
    alerta_top_n BOOLEAN DEFAULT false,
    alerta_top_n_valor INTEGER DEFAULT 10,
    alerta_rivales_vigilados BOOLEAN DEFAULT false,
    rivales_vigilados JSONB, -- [userId1, userId2]
    
    -- Partidos
    alerta_recordatorio_24h BOOLEAN DEFAULT true,
    alerta_fixture_publicado BOOLEAN DEFAULT true,
    alerta_cambio_horario BOOLEAN DEFAULT true,
    
    -- Social
    alerta_solicitud_pareja BOOLEAN DEFAULT true,
    alerta_mensaje_organizador BOOLEAN DEFAULT true,
    alerta_cualquier_mensaje BOOLEAN DEFAULT false,
    alerta_nuevo_seguidor BOOLEAN DEFAULT false,
    
    -- Canales
    canal_push BOOLEAN DEFAULT true,
    canal_email BOOLEAN DEFAULT true,
    canal_whatsapp BOOLEAN DEFAULT false,
    whatsapp_numero TEXT,
    
    actualizado_en TIMESTAMP DEFAULT NOW()
);
```

---

# 8. 📍 HISTORIAL DE TORNEOS VISUAL

## Concepto
Un mapa interactivo que muestra todos los torneos donde el jugador participó, con pins de colores según resultado.

## Diseño de Pantalla

```
┌─────────────────────────────────────────────────────────┐
│  📍 MI MAPA DE TORNEOS                     Premium ⭐   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │          🗺️ MAPA DE PARAGUAY                   │   │
│  │                                                 │   │
│  │     ┌────────────────────────────────┐         │   │
│  │     │                                │         │   │
│  │     │    Concepción                  │         │   │
│  │     │        🟡                       │         │   │
│  │     │                                │         │   │
│  │     │              Pedro Juan        │         │   │
│  │     │                  🟢            │         │   │
│  │     │                                │         │   │
│  │     │    Asunción    Ciudad del Este │         │   │
│  │     │      🟢🟢🔴      🏆🟢🟢🟢      │         │   │
│  │     │                                │         │   │
│  │     │         Encarnación            │         │   │
│  │     │             🟡🟢               │         │   │
│  │     │                                │         │   │
│  │     └────────────────────────────────┘         │   │
│  │                                                 │   │
│  │  Leyenda:                                      │   │
│  │  🏆 Campeón  🟢 Ganaste  🟡 Perdiste  🔴 1ra R │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📊 ESTADÍSTICAS POR CIUDAD                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │  Ciudad del Este    12 torneos   83% victorias │   │
│  │  ████████████████████░░░░                      │   │
│  │                                                 │   │
│  │  Asunción           5 torneos    60% victorias │   │
│  │  ████████████░░░░░░░░                          │   │
│  │                                                 │   │
│  │  Encarnación        3 torneos    67% victorias │   │
│  │  █████████████░░░░░░                           │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🏟️ SEDES FAVORITAS (donde mejor te va)               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. La Quinta Sport (CDE)      90% victorias    │   │
│  │ 2. Blue Padel (Asunción)      75% victorias    │   │
│  │ 3. Mburicao (Asunción)        70% victorias    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Implementación

### Datos necesarios (ya existen):
```
✓ Torneos con ubicación (ciudad)
✓ Inscripciones del usuario
✓ Resultados de partidos
```

### Agregaciones nuevas:
```sql
-- Vista para estadísticas por ciudad
CREATE VIEW stats_por_ciudad AS
SELECT 
    u.id as usuario_id,
    t.ciudad,
    COUNT(DISTINCT t.id) as torneos_jugados,
    SUM(CASE WHEN p.ganador_id = u.id THEN 1 ELSE 0 END) as partidos_ganados,
    COUNT(p.id) as partidos_totales,
    ROUND(SUM(CASE WHEN p.ganador_id = u.id THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(p.id), 0) * 100, 0) as porcentaje_victorias
FROM users u
JOIN inscripciones i ON u.id = i.jugador_id
JOIN torneos t ON i.torneo_id = t.id
LEFT JOIN partidos p ON (p.pareja1_jugador1_id = u.id OR p.pareja1_jugador2_id = u.id OR p.pareja2_jugador1_id = u.id OR p.pareja2_jugador2_id = u.id)
GROUP BY u.id, t.ciudad;
```

### Frontend: Librería de mapas
```javascript
// Usar Leaflet.js con mapa de Paraguay
import L from 'leaflet';

const mapaParaguay = L.map('mapa').setView([-23.5, -58.5], 6);

// Agregar pins por cada torneo
torneos.forEach(torneo => {
    const color = torneo.resultado === 'CAMPEON' ? 'gold' : 
                  torneo.ganoPartidos ? 'green' : 
                  torneo.rondaEliminado === 1 ? 'red' : 'yellow';
    
    L.marker([torneo.lat, torneo.lng], {
        icon: crearIcono(color)
    }).addTo(mapaParaguay)
      .bindPopup(`${torneo.nombre}<br>${torneo.fecha}<br>Resultado: ${torneo.resultado}`);
});
```

---

# 9. 🏅 BADGES EXCLUSIVOS

## Concepto
Sistema de logros desbloqueables que aparecen en el perfil. Algunos son automáticos, otros requieren acciones específicas.

## Catálogo de Badges

### Badges de Ranking
```
┌─────────────────────────────────────────────────────┐
│  🏅 BADGES DE RANKING                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [🥇] TOP 1        - Llegaste al #1 del ranking    │
│  [🥈] TOP 3        - Llegaste al Top 3             │
│  [🥉] TOP 10       - Llegaste al Top 10            │
│  [📈] ESCALADOR    - Subiste 20+ posiciones/mes    │
│  [🔥] EN RACHA     - 5 victorias consecutivas      │
│  [💪] IMBATIBLE    - 10 victorias consecutivas     │
│  [🎯] CONSISTENTE  - 6 meses en Top 50            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Badges de Torneos
```
┌─────────────────────────────────────────────────────┐
│  🏅 BADGES DE TORNEOS                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [🏆] CAMPEÓN       - Ganaste tu primer torneo     │
│  [🏆🏆] BICAMPEÓN   - 2 torneos seguidos           │
│  [👑] TRICAMPEÓN   - 3 torneos seguidos           │
│  [🌟] 10 TÍTULOS   - Ganaste 10 torneos           │
│  [🗺️] VIAJERO     - Torneos en 5+ ciudades       │
│  [📅] VETERANO    - 50+ torneos jugados           │
│  [🎪] SHOWMAN     - Jugaste final con público     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Badges Sociales
```
┌─────────────────────────────────────────────────────┐
│  🏅 BADGES SOCIALES                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [🤝] TEAM PLAYER  - 10+ parejas diferentes        │
│  [👯] DUPLA FIEL   - 20 torneos con misma pareja  │
│  [📸] FOTOGÉNICO   - 50+ fotos subidas            │
│  [💬] POPULAR      - 100+ mensajes recibidos      │
│  [⭐] INFLUENCER   - 50+ seguidores               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Badges Especiales (Premium)
```
┌─────────────────────────────────────────────────────┐
│  🏅 BADGES PREMIUM                     Premium ⭐    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [💎] PREMIUM OG    - Primer mes como Premium      │
│  [🔮] ORÁCULO       - Top 3 en predicciones/mes   │
│  [🧠] ESTRATEGA     - Usaste Scout 20 veces       │
│  [👑] LÍDER         - Creaste liga con 10+ miembros│
│  [📊] ANALÍTICO     - Revisaste Coach IA 30 veces │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Visualización en Perfil

```
┌─────────────────────────────────────────────────────┐
│  📷 HÉCTOR VELÁZQUEZ                    Premium ⭐  │
│  #38 Ranking | 7ma Categoría                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🏅 MIS BADGES (12/45)                             │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  [🥉] [🏆] [🔥] [🤝] [💎] [📅]            │   │
│  │  Top10  Camp  Racha Team  OG   Vete         │   │
│  │                                             │   │
│  │  [🗺️] [📸] [👯] [🎯] [📈] [🧠]            │   │
│  │  Viaj  Foto  Fiel  Cons  Esca Estr         │   │
│  │                                             │   │
│  │  [Ver todos →]                             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  🔓 PRÓXIMO BADGE                                  │
│  ┌─────────────────────────────────────────────┐   │
│  │ [🏆🏆] BICAMPEÓN                            │   │
│  │ Ganá 2 torneos seguidos                    │   │
│  │ Progreso: 1/2 ████████░░░░░░░░ 50%        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Datos Requeridos

```sql
CREATE TABLE badges (
    id TEXT PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL, -- 'TOP_10', 'CAMPEON', etc.
    nombre TEXT NOT NULL,
    descripcion TEXT,
    icono TEXT, -- emoji o URL de imagen
    categoria TEXT, -- 'RANKING', 'TORNEOS', 'SOCIAL', 'PREMIUM'
    condicion JSONB, -- reglas para desbloquear
    es_premium BOOLEAN DEFAULT false,
    orden INTEGER
);

CREATE TABLE usuario_badges (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    desbloqueado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, badge_id)
);

-- Ejemplo de condición en JSON
-- { "tipo": "ranking_posicion", "valor": 10, "operador": "<=" }
-- { "tipo": "torneos_ganados", "valor": 1, "operador": ">=" }
-- { "tipo": "victorias_consecutivas", "valor": 5, "operador": ">=" }
```

---

# 10. ⭐ PERFIL VERIFICADO/PREMIUM

## Concepto
Los usuarios Premium tienen un distintivo visual que los diferencia en toda la plataforma.

## Elementos Visuales

### Badge en el nombre
```
Normal:    Héctor Velázquez
Premium:   Héctor Velázquez ⭐
Verificado: Héctor Velázquez ✓ (jugadores oficiales/pros)
```

### Tarjeta de perfil diferenciada
```
┌─────────────────────────────────────────┐
│ ╔═══════════════════════════════════╗   │  ← Borde dorado
│ ║  📷 HÉCTOR VELÁZQUEZ         ⭐  ║   │
│ ║  #38 Ranking | 7ma Categoría      ║   │
│ ║                                   ║   │
│ ║  🏆 5 títulos | 📊 68% victorias  ║   │
│ ║                                   ║   │
│ ║  [Ver perfil]  [Contactar]        ║   │
│ ╚═══════════════════════════════════╝   │
└─────────────────────────────────────────┘

vs usuario normal:

┌─────────────────────────────────────────┐
│  📷 JUAN PÉREZ                          │  ← Sin borde especial
│  #45 Ranking | 7ma Categoría            │
│                                         │
│  🏆 2 títulos | 📊 55% victorias        │
│                                         │
│  [Ver perfil]  [Contactar]              │
└─────────────────────────────────────────┘
```

### En Rankings
```
┌────┬─────────────────────────┬────────┐
│ #  │ Jugador                 │ Puntos │
├────┼─────────────────────────┼────────┤
│ 1  │ ⭐ Roberto S.           │ 1,450  │  ← Premium
│ 2  │    María G.             │ 1,380  │  ← Normal
│ 3  │ ⭐ Héctor V.            │ 1,250  │  ← Premium
│ 4  │    Juan P.              │ 1,180  │  ← Normal
└────┴─────────────────────────┴────────┘
```

### En búsqueda de pareja
```
Los Premium aparecen primero en resultados de búsqueda
(boost de visibilidad)
```

### Estadísticas públicas extendidas
```
FREE: Solo básicas (ranking, victorias, torneos)
PREMIUM: Todo público (gráficos, historial, badges)
```

---

# 11. 📊 ANÁLISIS POST-PARTIDO

## Concepto
Después de cada partido, el sistema genera un análisis detallado del rendimiento.

## Pantalla de Análisis

```
┌─────────────────────────────────────────────────────────┐
│  📊 ANÁLISIS DEL PARTIDO               Premium ⭐       │
│  Torneo Verano CDE | Cuartos de Final                   │
│  12 Mar 2026 | La Quinta Sport                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  RESULTADO                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │   Héctor V. / Carlos M.                        │   │
│  │              6-4, 6-3                           │   │
│  │   Juan P. / Miguel T.                          │   │
│  │                                                 │   │
│  │   ✅ VICTORIA en 1h 15min                      │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📈 PUNTOS GANADOS                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │   Base (Cuartos):           +15 pts            │   │
│  │   Multiplicador torneo:     ×1.3               │   │
│  │   ─────────────────────────────────            │   │
│  │   TOTAL:                    +20 pts            │   │
│  │                                                 │   │
│  │   Tu ranking: #40 → #38 (⬆️ +2)               │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📊 ESTADÍSTICAS DEL PARTIDO                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │              TÚ          ELLOS                 │   │
│  │   Games:     12          7                     │   │
│  │   ████████████████      ████████░░░░░░░░      │   │
│  │                                                 │   │
│  │   Puntos set 1: 24      18                     │   │
│  │   Puntos set 2: 22      14                     │   │
│  │                                                 │   │
│  │   Duración:   1h 15min                         │   │
│  │   Promedio:   4.2 min/game                     │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🎯 MOMENTOS CLAVE                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │   Set 1, 4-4: Break decisivo                   │   │
│  │   "Rompiste el servicio cuando más importaba"  │   │
│  │                                                 │   │
│  │   Set 2, 0-2: Remontada                        │   │
│  │   "Arrancaste abajo pero ganaste 6 games      │   │
│  │    seguidos"                                   │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 APRENDIZAJES (Coach IA)                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │   "Buen partido. Dominaste el segundo set     │   │
│  │    después de ajustar. Tu capacidad de        │   │
│  │    adaptación es tu fortaleza. Seguí          │   │
│  │    confiando en el juego largo."              │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  COMPARACIÓN VS TU PROMEDIO                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │   Este partido    Tu promedio    Diferencia    │   │
│  │   ─────────────────────────────────────────    │   │
│  │   63% games       58% games      +5% ⬆️       │   │
│  │   1h 15min        1h 30min       -15min ⬆️    │   │
│  │                                                 │   │
│  │   ✅ Mejor que tu promedio                    │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [📤 Compartir]  [💾 Guardar PDF]  [🔗 Ver torneo]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Trigger y Generación

```javascript
// Se ejecuta cuando el organizador carga resultado
async function onResultadoCargado(partidoId) {
    const partido = await getPartido(partidoId);
    
    // Solo para usuarios Premium
    const jugadoresPremium = await getJugadoresPremiumDelPartido(partido);
    
    for (const jugador of jugadoresPremium) {
        const analisis = await generarAnalisis(partido, jugador);
        await guardarAnalisis(jugador.id, partido.id, analisis);
        await notificar(jugador.id, "Tu análisis post-partido está listo");
    }
}

async function generarAnalisis(partido, jugador) {
    const esGanador = partido.ganador_id === jugador.pareja_id;
    const statsPromedio = await getPromedioJugador(jugador.id);
    
    // Calcular momentos clave (games donde cambió momentum)
    const momentosClave = detectarMomentosClave(partido.sets);
    
    // Generar insight con IA
    const insight = await generarInsightIA(partido, jugador, esGanador);
    
    return {
        resultado: esGanador ? 'VICTORIA' : 'DERROTA',
        puntosGanados: calcularPuntos(partido, jugador),
        cambioRanking: await calcularCambioRanking(jugador.id),
        estadisticas: {
            gamesGanados: contarGames(partido, jugador),
            gamesTotales: getTotalGames(partido),
            duracion: partido.duracion_minutos,
            promedioMinutosPorGame: partido.duracion_minutos / getTotalGames(partido)
        },
        momentosClave,
        insight,
        comparacionPromedio: {
            porcentajeGames: {
                estePartido: (contarGames(partido, jugador) / getTotalGames(partido)) * 100,
                promedio: statsPromedio.porcentajeGames,
            },
            duracion: {
                estePartido: partido.duracion_minutos,
                promedio: statsPromedio.duracionPromedio
            }
        }
    };
}
```

---

# 📋 RESUMEN DE PRIORIDADES

## Fase 1: MVP Premium (Lanzamiento)
```
1. ⭐ Perfil Verificado/Premium     → Fácil, alto impacto visual
2. 🔔 Alertas Personalizadas        → Fácil, valor real inmediato
3. 🏅 Badges Exclusivos             → Fácil, gamificación básica
4. 📧 Resumen Semanal Premium       → Medio, diferenciador claro
```

## Fase 2: Valor Competitivo
```
5. 🎯 Scout de Rivales              → Medio, único en mercado
6. 📊 Análisis Post-Partido         → Medio, complementa Scout
7. 🤝 Match de Pareja Inteligente   → Alto, resuelve dolor real
```

## Fase 3: Engagement Avanzado
```
8. 🏅 Ligas Privadas                → Alto, viralización
9. 📍 Historial Visual              → Bajo, diferenciador visual
10. 🎰 Apuestas de Puntos           → Medio, engagement
11. 🤖 Coach IA                     → Medio, innovación
```

---

# 💰 PRICING SUGERIDO

```
┌─────────────────────────────────────────────────────┐
│  PLAN FREE                              Gs. 0      │
├─────────────────────────────────────────────────────┤
│  ✓ Inscripción a torneos                           │
│  ✓ Perfil completo con fotos                       │
│  ✓ Mensajes ilimitados                             │
│  ✓ Estadísticas básicas                            │
│  ✓ Ranking público                                  │
│  ✓ Unirse a 2 ligas privadas                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  PLAN PREMIUM ⭐                    Gs. 49.900/mes │
│                              o Gs. 399.000/año     │
├─────────────────────────────────────────────────────┤
│  Todo de FREE más:                                 │
│                                                     │
│  ⭐ Perfil verificado con badge                    │
│  🤝 Match de Pareja Inteligente                    │
│  🎯 Scout de Rivales completo                      │
│  📊 Análisis Post-Partido                          │
│  🔔 Alertas Personalizadas ilimitadas              │
│  📧 Resumen Semanal personalizado                  │
│  🏅 Crear Ligas Privadas ilimitadas                │
│  🏅 Badges exclusivos Premium                      │
│  📍 Historial de Torneos Visual                    │
│  🤖 Coach IA (20 consultas/mes)                    │
│  🎰 Predicciones ilimitadas                        │
│  🚫 Sin publicidad                                 │
│  ⏰ Inscripción anticipada a torneos              │
└─────────────────────────────────────────────────────┘
```

---

> Documento generado para FairPadel
> Versión 1.0 | Febrero 2026
