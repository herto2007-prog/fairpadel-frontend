import api from './api';
import type { Ranking, RankingFilters, HistorialPuntos, Gender } from '@/types';

export const rankingsService = {
  // GET /rankings/temporadas - Obtener temporadas disponibles
  getTemporadas: async (): Promise<string[]> => {
    const response = await api.get('/rankings/temporadas');
    return response.data;
  },

  // GET /rankings - Obtener rankings con filtros
  getAll: async (filters?: RankingFilters & { temporada?: string }): Promise<Ranking[]> => {
    const params = new URLSearchParams();
    if (filters?.genero) params.append('genero', filters.genero);
    if (filters?.tipoRanking) params.append('tipoRanking', filters.tipoRanking);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.temporada) params.append('temporada', filters.temporada);

    const response = await api.get(`/rankings?${params.toString()}`);
    return response.data;
  },

  // GET /rankings/top10 - Obtener top 10
  getTop10: async (genero: Gender): Promise<Ranking[]> => {
    const response = await api.get(`/rankings?genero=${genero}&limit=10`);
    return response.data;
  },

  // GET /rankings/jugador/:jugadorId - Obtener ranking de un usuario
  getByUser: async (userId: string): Promise<Ranking[]> => {
    const response = await api.get(`/rankings/jugador/${userId}`);
    return response.data;
  },

  // GET /rankings/jugador/:jugadorId/historial - Obtener historial de puntos
  getHistorial: async (userId: string): Promise<HistorialPuntos[]> => {
    const response = await api.get(`/rankings/jugador/${userId}/historial`);
    return response.data;
  },

  // Export career PDF (Premium)
  exportCareerPdf: async (): Promise<void> => {
    const response = await api.get('/rankings/me/export-pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FairPadel_Carrera_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Export history Excel (Premium)
  exportHistoryExcel: async (): Promise<void> => {
    const response = await api.get('/rankings/me/export-excel', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FairPadel_Historial_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default rankingsService;