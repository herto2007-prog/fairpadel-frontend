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
  costoInscripcion?: number;
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

  /**
   * Marca el torneo como terminado. Fija la comisión a cobrar (jugadores que
   * jugaron × tarifa) y avisa al organizador. No bloquea nada.
   */
  finalizarTorneo: async (
    tournamentId: string,
  ): Promise<{ jugaronCount: number; monto: number }> => {
    const response = await api.post(`/admin/torneos/${tournamentId}/finalizar`);
    return response.data.comision;
  },

  /**
   * Envía el torneo (BORRADOR o RECHAZADO) a aprobación del admin. NO publica:
   * lo deja PENDIENTE_APROBACION. El admin lo aprueba y recién ahí sale público.
   * Lo usa el paso "Abrir inscripciones" del roadmap.
   */
  enviarAprobacion: async (tournamentId: string): Promise<void> => {
    await api.post(`/admin/torneos/${tournamentId}/enviar-aprobacion`);
  },

  /**
   * Indica si el cuadro (bracket) ya es visible para los jugadores. Sirve para
   * el paso "Publicar el cuadro" del roadmap: el cuadro puede estar armado pero
   * todavía en borrador invisible.
   */
  getBracketPublicado: async (tournamentId: string): Promise<boolean> => {
    const { data } = await api.get(`/admin/torneos/${tournamentId}/estado-publicacion`);
    return data?.torneo?.bracketPublicado ?? data?.publicado ?? false;
  },
};
