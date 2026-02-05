import api from './api';
import type { Ranking, RankingFilters, HistorialPuntos, Gender } from '@/types';

export const rankingsService = {
  // GET /rankings - Obtener rankings con filtros
  getAll: async (filters?: RankingFilters): Promise<Ranking[]> => {
    const params = new URLSearchParams();
    if (filters?.genero) params.append('genero', filters.genero);
    if (filters?.tipoRanking) params.append('tipoRanking', filters.tipoRanking);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/rankings?${params.toString()}`);
    return response.data;
  },

  // GET /rankings/top10 - Obtener top 10
  getTop10: async (genero: Gender): Promise<Ranking[]> => {
    const response = await api.get(`/rankings?genero=${genero}&limit=10`);
    return response.data;
  },

  // GET /rankings/user/:userId - Obtener ranking de un usuario
  getByUser: async (userId: string): Promise<Ranking[]> => {
    const response = await api.get(`/rankings/user/${userId}`);
    return response.data;
  },

  // GET /rankings/historial/:userId - Obtener historial de puntos
  getHistorial: async (userId: string): Promise<HistorialPuntos[]> => {
    const response = await api.get(`/rankings/historial/${userId}`);
    return response.data;
  },
};

export default rankingsService;