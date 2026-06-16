import { api } from '../../../services/api';

export interface ReprogramarGeneralResponse {
  success: boolean;
  message: string;
  asignados: number; // partidos que quedaron con horario (incluye rondas futuras)
  sinFranja: number; // partidos que no entraron por falta de franjas
  distribucionPorDia: Record<string, number>;
}

export const programacionService = {
  // Reprograma TODA la agenda desde cero con el motor predictivo.
  // Incluye las rondas futuras (slot determinístico) y respeta los partidos ya jugados.
  reprogramarGeneral: async (
    tournamentId: string,
  ): Promise<ReprogramarGeneralResponse> => {
    const { data } = await api.post(
      `/admin/canchas-sorteo/${tournamentId}/reprogramar-general`,
    );
    return data;
  },
};
