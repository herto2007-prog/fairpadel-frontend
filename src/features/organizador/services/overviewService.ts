import { api } from '../../../services/api';

// ═══════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════

export interface TorneoOverview {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  estadoProceso: 'configuracion' | 'inscripciones' | 'sorteo' | 'programacion' | 'en_curso' | 'finalizado';
  fechaInicio: string;
  fechaFin: string;
  ciudad: string;
  flyerUrl?: string;
  sede?: {
    id: string;
    nombre: string;
    ciudad: string;
  };
  diasHastaInicio: number | null;
}

export interface ProgresoTorneo {
  general: number;
  checklist: number;
  detalle: Array<{
    nombre: string;
    completado: boolean;
    peso: number;
  }>;
}

export interface InscripcionesStats {
  total: number;
  confirmadas: number;
  pendientesPago: number;
  pendientesConfirmacion: number;
  incompletas: number;
  ingresos: number;
  porCategoria: Array<{
    categoriaId: string;
    nombre: string;
    tipo: string;
    total: number;
    confirmadas: number;
    pendientes: number;
  }>;
}

export interface ComisionInfo {
  estado: string;
  bloqueoActivo: boolean;
  montoEstimado: number;
  montoPagado: number;
}

export interface TareaPendiente {
  id: string;
  tipo: 'urgente' | 'advertencia' | 'info';
  titulo: string;
  descripcion: string;
  accion?: {
    texto: string;
    link: string;
  };
}

export interface OverviewData {
  torneo: TorneoOverview;
  progreso: ProgresoTorneo;
  inscripciones: InscripcionesStats;
  comision: ComisionInfo | null;
  tareasPendientes: TareaPendiente[];
  linkPublico: string;
}

// ═══════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════

export const overviewService = {
  /**
   * Obtiene el resumen ejecutivo del torneo
   */
  getOverview: async (tournamentId: string): Promise<OverviewData> => {
    const response = await api.get(`/admin/torneos/${tournamentId}/overview`);
    return response.data.data;
  },
};
