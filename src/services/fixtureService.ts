import { api } from './api';

export interface FixtureVersion {
  id: string;
  tournamentId: string;
  categoryId: string;
  version: number;
  estado: 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';
  definicion: {
    slots: any[];
    rondas: { tipo: string; cantidadPartidos: number }[];
    reglas: {
      tipoAcomodacion: string;
      rondasAcomodacion: number;
      tercerPuesto: boolean;
    };
  };
  totalPartidos: number;
  publicadoAt?: string;
  createdAt: string;
  tournament?: {
    id: string;
    nombre: string;
    organizadorId: string;
  };
  category?: {
    id: string;
    nombre: string;
    tipo: string;
  };
  matches?: Match[];
}

export interface Match {
  id: string;
  tournamentId: string;
  categoryId: string;
  fixtureVersionId: string;
  ronda: 'ACOMODACION_1' | 'ACOMODACION_2' | 'OCTAVOS' | 'CUARTOS' | 'SEMIS' | 'FINAL' | 'TERCER_PUESTO';
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
}

export interface GenerarFixtureData {
  tournamentId: string;
  categoryId: string;
}

export const fixtureService = {
  generar: async (data: GenerarFixtureData): Promise<FixtureVersion> => {
    const response = await api.post('/fixture/generar', data);
    return response.data;
  },

  publicar: async (fixtureVersionId: string): Promise<FixtureVersion> => {
    const response = await api.post(`/fixture/${fixtureVersionId}/publicar`);
    return response.data;
  },

  getById: async (id: string): Promise<FixtureVersion> => {
    const response = await api.get(`/fixture/${id}`);
    return response.data;
  },

  getActivo: async (tournamentId: string, categoryId: string): Promise<FixtureVersion | null> => {
    try {
      const response = await api.get(`/fixture/tournament/${tournamentId}/category/${categoryId}`);
      return response.data;
    } catch {
      return null;
    }
  },
};
