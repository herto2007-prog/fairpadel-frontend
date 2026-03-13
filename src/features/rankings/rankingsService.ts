import { api } from '../../services/api';

export interface QueryRankingsParams {
  categoriaId?: string;
  ciudad?: string;
  temporada?: string;
  circuitoId?: string;
  genero?: 'MASCULINO' | 'FEMENINO';
}

export interface ConfigPuntos {
  id: string;
  posicion: string;
  descripcion: string;
  puntosBase: number;
  orden: number;
  activo: boolean;
}

export interface ReglaAscenso {
  id: string;
  categoriaOrigen: { id: string; nombre: string };
  categoriaDestino: { id: string; nombre: string };
  campeonatosRequeridos: number;
  tipoConteo: 'CONSECUTIVOS' | 'ALTERNADOS';
  mesesVentana: number;
  finalistaCalifica: boolean;
  activa: boolean;
}

export const rankingsService = {
  // Rankings públicos
  getRankings: async (params: QueryRankingsParams) => {
    const query = new URLSearchParams();
    if (params.categoriaId) query.append('categoriaId', params.categoriaId);
    if (params.ciudad) query.append('ciudad', params.ciudad);
    if (params.temporada) query.append('temporada', params.temporada);
    if (params.circuitoId) query.append('circuitoId', params.circuitoId);
    if (params.genero) query.append('genero', params.genero);
    
    const response = await api.get(`/rankings?${query}`);
    return response.data;
  },

  getRankingJugador: async (jugadorId: string) => {
    const response = await api.get(`/rankings/jugador/${jugadorId}`);
    return response.data;
  },

  // Admin - Configuración de puntos
  getConfigPuntos: async () => {
    const response = await api.get('/rankings/admin/config-puntos');
    return response.data;
  },

  createConfigPuntos: async (data: Partial<ConfigPuntos>) => {
    const response = await api.post('/rankings/admin/config-puntos', data);
    return response.data;
  },

  updateConfigPuntos: async (id: string, data: Partial<ConfigPuntos>) => {
    const response = await api.put(`/rankings/admin/config-puntos/${id}`, data);
    return response.data;
  },

  // Admin - Reglas de ascenso
  getReglasAscenso: async () => {
    const response = await api.get('/rankings/admin/reglas-ascenso');
    return response.data;
  },

  createReglaAscenso: async (data: Partial<ReglaAscenso>) => {
    const response = await api.post('/rankings/admin/reglas-ascenso', data);
    return response.data;
  },

  updateReglaAscenso: async (id: string, data: Partial<ReglaAscenso>) => {
    const response = await api.put(`/rankings/admin/reglas-ascenso/${id}`, data);
    return response.data;
  },

  // Admin - Calcular puntos de torneo
  calcularPuntosTorneo: async (tournamentId: string, categoryId: string) => {
    const response = await api.post(`/rankings/admin/calcular/${tournamentId}/${categoryId}`);
    return response.data;
  },

  // Admin - Ascensos
  getAscensosPendientes: async () => {
    const response = await api.get('/rankings/admin/ascensos-pendientes');
    return response.data;
  },

  calcularAscensos: async () => {
    const response = await api.post('/rankings/admin/ascensos-calcular');
    return response.data;
  },

  procesarAscenso: async (id: string, estado: 'CONFIRMADO' | 'RECHAZADO', notas?: string) => {
    const response = await api.post(`/rankings/admin/ascensos-procesar/${id}`, { estado, notas });
    return response.data;
  },
};
