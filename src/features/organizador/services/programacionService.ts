import { api } from '../../../services/api';

export interface ResumenReprogramacion {
  totalJugables: number; // partidos con ambas parejas definidas
  asignados: number; // los que entran en una franja
  sinFranja: number; // jugables que no entran por falta de franjas
}

export interface ConflictoProgramacion {
  tipo: string;
  severidad: 'BLOQUEANTE' | 'ADVERTENCIA' | 'INFO';
  partidoId: string;
  mensaje: string;
  sugerencia?: string;
}

export interface ReprogramarPreviewResponse {
  resumen: ResumenReprogramacion;
  conflictos: ConflictoProgramacion[];
}

export interface ReprogramarAplicarResponse {
  success: boolean;
  message: string;
  resumen: ResumenReprogramacion;
  conflictos: ConflictoProgramacion[];
}

export const programacionService = {
  // Vista previa: simula reacomodar todos los pendientes desde cero (no toca la BD)
  reprogramarGeneralPreview: async (
    tournamentId: string,
  ): Promise<ReprogramarPreviewResponse> => {
    const { data } = await api.get(
      `/programacion/torneos/${tournamentId}/reprogramar-general/preview`,
    );
    return data;
  },

  // Aplica: libera la agenda de los pendientes y la reacomoda desde cero
  reprogramarGeneral: async (
    tournamentId: string,
  ): Promise<ReprogramarAplicarResponse> => {
    const { data } = await api.post(
      `/programacion/torneos/${tournamentId}/reprogramar-general`,
    );
    return data;
  },
};
