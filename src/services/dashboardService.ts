import { api } from './api';
import { PerfilJugador } from '../features/perfil/perfilService';

// ═══════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════

export interface TorneoDestacado {
  id: string;
  nombre: string;
  slug: string;
  flyerUrl?: string;
  fechaInicio: string;
  fechaLimiteInscripcion: string;
  ciudad: string;
  costoInscripcion: number;
  cuposDisponibles: number;
  cuposTotales: number;
  inscripcionesUltimas24h: number;
  sedeNombre: string;
  categorias: string[];
  modalidades: string[];
  esUrgente: boolean;
  diasRestantes: number;
}

export interface ActividadSocial {
  id: string;
  tipo: 'ASCENSO' | 'TORNEO_GANADO' | 'INSCRIPCION' | 'RACHA' | 'LOGRO';
  jugador: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl?: string;
    categoriaNombre?: string;
  };
  detalle: {
    titulo: string;
    descripcion: string;
    metadata?: any;
  };
  fecha: string;
  tiempoTranscurrido: string;
}

export interface DashboardStats {
  perfil: PerfilJugador;
  torneosUrgentes: TorneoDestacado[];
  torneosRecomendados: TorneoDestacado[];
  actividadSocial: ActividadSocial[];
  proximosPartidos: Array<{
    id: string;
    torneoNombre: string;
    categoriaNombre: string;
    fecha: string;
    hora: string;
    sedeNombre: string;
    rival?: string;
    ronda?: string;
  }>;
  notificaciones: Array<{
    id: string;
    tipo: 'URGENTE' | 'INFO' | 'SUCCESS';
    titulo: string;
    mensaje: string;
    accion?: {
      texto: string;
      link: string;
    };
    fecha: string;
  }>;
}

// ═══════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════

export const dashboardService = {
  /**
   * Obtiene todos los datos del dashboard del usuario autenticado
   */
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/me');
    return response.data.data;
  },

  /**
   * Obtiene solo la actividad social (para actualizaciones en tiempo real)
   */
  getActividadSocial: async (limit: number = 10): Promise<ActividadSocial[]> => {
    const response = await api.get(`/dashboard/actividad-social?limit=${limit}`);
    return response.data.data;
  },

  /**
   * Obtiene torneos urgentes (cierre de inscripción próximo)
   */
  getTorneosUrgentes: async (): Promise<TorneoDestacado[]> => {
    const response = await api.get('/dashboard/torneos-urgentes');
    return response.data.data;
  },
};
