import { api } from './api';

export interface Jugador {
  id: string;
  nombre: string;
  apellido: string;
  fotoUrl: string | null;
  ciudad: string | null;
  pais: string | null;
  categoria: {
    id: string;
    nombre: string;
  } | null;
  seguidores: number;
  stats: {
    torneosJugados: number;
    torneosGanados: number;
    victorias: number;
    efectividad: number;
  };
}

export interface FiltrosJugadores {
  q?: string;
  ciudad?: string;
  categoriaId?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CategoriaFiltro {
  id: string;
  nombre: string;
  tipo: string;
}

export const jugadoresService = {
  /**
   * Buscar jugadores con filtros
   */
  buscar: (filtros: FiltrosJugadores & { page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filtros.q) params.append('q', filtros.q);
    if (filtros.ciudad) params.append('ciudad', filtros.ciudad);
    if (filtros.categoriaId) params.append('categoriaId', filtros.categoriaId);
    if (filtros.page) params.append('page', filtros.page.toString());
    if (filtros.limit) params.append('limit', filtros.limit.toString());
    // Cache buster para evitar CDN cache
    params.append('_t', Date.now().toString());

    return api.get<{ success: boolean; data: Jugador[]; pagination: Pagination }>(
      `/users/buscar?${params.toString()}`
    ).then(r => r.data);
  },

  /**
   * Obtener datos para filtros (ciudades y categorías)
   */
  getDatosFiltros: () => {
    return api.get<{ success: boolean; data: { ciudades: string[]; categorias: CategoriaFiltro[] } }>(
      '/users/filtros/datos'
    ).then(r => r.data);
  },
};
