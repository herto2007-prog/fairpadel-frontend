import { api } from './api';

export interface Match {
  id: string;
  tournamentId: string;
  categoryId: string;
  ronda: string;
  numeroRonda: number;
  ordenEnRonda: number;
  pareja1Id?: string;
  pareja2Id?: string;
  pareja1Nombre?: string;
  pareja2Nombre?: string;
  canchaId?: string;
  canchaNombre?: string;
  fechaProgramada?: string;
  horaProgramada?: string;
  estado: 'PROGRAMADO' | 'EN_JUEGO' | 'FINALIZADO' | 'WO' | 'SUSPENDIDO' | 'CANCELADO';
  set1Pareja1?: number;
  set1Pareja2?: number;
  set2Pareja1?: number;
  set2Pareja2?: number;
  set3Pareja1?: number;
  set3Pareja2?: number;
  parejaGanadoraId?: string;
  parejaPerdedoraId?: string;
  esBye: boolean;
  notas?: string;
  pareja1?: {
    id: string;
    jugador1: { nombre: string; apellido: string };
    jugador2?: { nombre: string; apellido: string };
  };
  pareja2?: {
    id: string;
    jugador1: { nombre: string; apellido: string };
    jugador2?: { nombre: string; apellido: string };
  };
  parejaGanadora?: {
    id: string;
    jugador1: { nombre: string; apellido: string };
    jugador2?: { nombre: string; apellido: string };
  };
  partidoSiguiente?: {
    id: string;
    ronda: string;
    ordenEnRonda: number;
  };
}

export interface RegistrarResultadoData {
  set1Pareja1: number;
  set1Pareja2: number;
  set2Pareja1: number;
  set2Pareja2: number;
  set3Pareja1?: number;
  set3Pareja2?: number;
  notas?: string;
}

export const matchService = {
  listar: async (tournamentId: string, categoryId?: string): Promise<Match[]> => {
    const params = categoryId ? `?tournamentId=${tournamentId}&categoryId=${categoryId}` : `?tournamentId=${tournamentId}`;
    const response = await api.get(`/matches${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Match> => {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  },

  registrarResultado: async (id: string, data: RegistrarResultadoData): Promise<Match> => {
    const response = await api.patch(`/matches/${id}/resultado`, data);
    return response.data;
  },

  programar: async (id: string, data: {
    canchaId?: string;
    canchaNombre?: string;
    fechaProgramada?: Date;
    horaProgramada?: string;
    horaFinEstimada?: string;
  }): Promise<Match> => {
    const response = await api.patch(`/matches/${id}/programar`, data);
    return response.data;
  },

  registrarWO: async (id: string, parejaGanadoraId: string): Promise<Match> => {
    const response = await api.patch(`/matches/${id}/wo`, { parejaGanadoraId });
    return response.data;
  },
};
