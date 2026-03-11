import { api } from './api';

export interface LlenarTorneoRequest {
  parejasPorCategoria?: number;
  distribucion?: 'EQUILIBRADA' | 'ALEATORIA' | 'REALISTA';
}

export interface LlenarTorneoResponse {
  success: boolean;
  message: string;
  resumen: {
    totalCategorias: number;
    totalParejas: number;
    distribucion: Array<{
      categoria: string;
      tipo: string;
      parejasCreadas: number;
    }>;
  };
}

export const demoService = {
  async llenarTorneo(tournamentId: string, data: LlenarTorneoRequest = {}): Promise<LlenarTorneoResponse> {
    const response = await api.post(`/admin/demo/torneos/${tournamentId}/llenar`, data);
    return response.data;
  },

  async limpiarTorneo(tournamentId: string): Promise<{ success: boolean; message: string; eliminadas: number }> {
    const response = await api.delete(`/admin/demo/torneos/${tournamentId}/limpiar`);
    return response.data;
  },

  async getStatus(): Promise<any> {
    const response = await api.get('/admin/demo/status');
    return response.data;
  },
};
