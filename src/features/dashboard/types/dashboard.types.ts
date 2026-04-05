// ═══════════════════════════════════════════════════════
// TYPES - Dashboard Evolutivo por Fase de Usuario
// ═══════════════════════════════════════════════════════

export type UserFase = 'NOVATO' | 'ACTIVO' | 'REGULAR' | 'PREMIUM';

// Datos necesarios para determinar la fase
export interface UserStats {
  torneosJugados: number;
  torneosUltimos30Dias: number;
  diasDesdeRegistro: number;
  seguidores: number;
  perfilCompleto: boolean; // tiene foto + bio
}

// Datos del dashboard que vienen del backend
export interface DashboardData {
  perfil: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl?: string;
    bio?: string;
    emailVerificado: boolean;
    categoria?: string;
  };
  stats: UserStats;
  // Torneos
  torneosAbiertos: TorneoAbierto[];
  torneosUrgentes: TorneoAbierto[]; // cierran en < 24h
  miProximoPartido?: ProximoPartido;
  // Social
  actividadRed: ActividadRed[];
  jugadoresSugeridos: JugadorSugerido[];
  // Progreso
  puntosTotales: number;
  posicionRanking?: number;
  rachaActual: number;
}

export interface TorneoAbierto {
  id: string;
  nombre: string;
  slug: string;
  flyerUrl?: string;
  fechaInicio: string;
  fechaCierreInscripcion?: string;
  ciudad: string;
  sedeNombre: string;
  costoInscripcion: number;
  cuposDisponibles: number;
  cuposTotales: number;
  categorias: string[];
  inscripcionesAbiertas: boolean;
  cierraEnHoras?: number; // calculado frontend
}

export interface ProximoPartido {
  id: string;
  torneoNombre: string;
  categoriaNombre: string;
  fecha: string;
  hora: string;
  sedeNombre: string;
  cancha?: string;
  rival?: {
    nombre: string;
    apellido: string;
    fotoUrl?: string;
  };
  ronda?: string;
}

export interface ActividadRed {
  id: string;
  tipo: 'ASCENSO' | 'TORNEO_GANADO' | 'INSCRIPCION' | 'RACHA' | 'LOGRO' | 'INVITACION';
  jugador: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl?: string;
    categoriaNombre?: string;
  };
  titulo: string;
  descripcion: string;
  tiempoTranscurrido: string;
  metadata?: any;
}

export interface JugadorSugerido {
  id: string;
  nombre: string;
  apellido: string;
  fotoUrl?: string;
  categoria?: string;
  ciudad?: string;
  torneosComun?: number; // cuántos torneos han jugado juntos
  motivo: 'MISMA_CATEGORIA' | 'MISMA_CIUDAD' | 'TORNEOS_COMUN';
}

// Checklist de onboarding
export interface ChecklistItem {
  id: string;
  titulo: string;
  descripcion: string;
  completado: boolean;
  accion?: {
    texto: string;
    link: string;
  };
}
