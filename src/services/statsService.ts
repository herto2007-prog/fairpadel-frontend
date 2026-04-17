import { api } from './api';

export interface StatsGlobales {
  usuarios: { total: number };
  torneos: { total: number; activos: number };
  partidos: { total: number };
  sedes: { total: number; ciudades: number };
  reservas: { total: number };
  inscripciones: { total: number };
}

export const statsService = {
  getGlobal: async (): Promise<StatsGlobales> => {
    const { data } = await api.get('/stats/global');
    return data.data;
  },
};
