import { api } from './api';

export interface RegistrarResultadoData {
  set1Pareja1: number;
  set1Pareja2: number;
  set2Pareja1: number;
  set2Pareja2: number;
  set3Pareja1?: number;
  set3Pareja2?: number;
  tiebreakSet3?: boolean;
  wo?: boolean;
  woPareja1?: boolean;
  woPareja2?: boolean;
  notas?: string;
}

export const matchService = {
  getById: (id: string) => api.get(`/matches/${id}`).then(r => r.data),
  registrarResultado: (id: string, data: RegistrarResultadoData) =>
    api.post(`/matches/${id}/resultado`, data).then(r => r.data),
  getByTournament: (tournamentId: string) =>
    api.get(`/matches/tournament/${tournamentId}`).then(r => r.data),

  // Descarga el Excel de partidos/fixture del torneo (Fase 7 - reportes).
  descargarPartidosExcel: async (tournamentId: string) => {
    const res = await api.get(`/reportes/torneos/${tournamentId}/partidos`, {
      responseType: 'blob',
    });
    const cd = (res.headers['content-disposition'] as string) || '';
    const match = cd.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'partidos.xlsx';
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
