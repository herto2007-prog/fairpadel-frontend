import { api } from './api';

export interface JugadorComunidad {
  id: string;
  nombre: string;
  apellido: string;
  fotoUrl: string | null;
  ciudad: string | null;
  pais: string | null;
  estado: string;
  categoria: {
    id: string;
    nombre: string;
  } | null;
  seguidores: number;
}

export interface ComunidadResponse {
  success: boolean;
  count: number;
  data: JugadorComunidad[];
}

export const comunidadService = {
  /**
   * Obtener jugadores sin filtros complejos
   */
  getJugadores: async (): Promise<ComunidadResponse> => {
    const response = await api.get<ComunidadResponse>('/comunidad/jugadores');
    return response.data;
  },

  /**
   * Stats básicas
   */
  getStats: async () => {
    const response = await api.get('/comunidad/stats');
    return response.data;
  },
};
