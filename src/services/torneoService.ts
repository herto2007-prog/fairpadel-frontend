import { api } from './api';

// ═══════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════

export interface TorneoPublic {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion: string;
  ciudad: string;
  costoInscripcion: number;
  flyerUrl?: string;
  estado: string;
  sedePrincipal?: {
    id: string;
    nombre: string;
    ciudad: string;
    direccion?: string;
  };
  categorias: Array<{
    id: string;
    category: {
      id: string;
      nombre: string;
    };
  }>;
  modalidades: Array<{
    id: string;
    modalidadConfig: {
      id: string;
      nombre: string;
    };
  }>;
  organizador: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface TorneosPublicResponse {
  torneos: TorneoPublic[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TorneoFilters {
  q?: string;
  ciudad?: string;
  categoria?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: 'proximos' | 'en-curso' | 'finalizados' | 'todos' | 'ABIERTO';
  page?: number;
  limit?: number;
}

// ═══════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════

export const torneoService = {
  /**
   * Obtiene la lista de torneos públicos con filtros
   * GET /t/public
   */
  getPublicTorneos: async (filters: TorneoFilters = {}): Promise<TorneosPublicResponse> => {
    const params = new URLSearchParams();
    
    if (filters.q) params.append('q', filters.q);
    if (filters.ciudad) params.append('ciudad', filters.ciudad);
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/t/public?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtiene el detalle de un torneo público por su slug
   * GET /t/:slug
   */
  getTorneoBySlug: async (slug: string): Promise<{ torneo: TorneoPublic; related: TorneoPublic[] }> => {
    const response = await api.get(`/t/${slug}`);
    return response.data;
  },
};
