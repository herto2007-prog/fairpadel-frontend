import { api } from '../../../services/api';

export interface ReprogramarGeneralResponse {
  success: boolean;
  message: string;
  asignados: number; // partidos que quedaron con horario (incluye rondas futuras)
  sinFranja: number; // partidos que no entraron por falta de franjas
  distribucionPorDia: Record<string, number>;
}

export interface AtrasarAgendaResponse {
  success: boolean;
  message: string;
  movidos: number;
  sinHorario: number;
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

  // Atrasa la agenda de UN día (lluvia/demora): corre los partidos no jugados
  // X minutos, conservando cancha y orden. Los jugados no se tocan.
  atrasarAgenda: async (
    tournamentId: string,
    fecha: string,
    minutos: number,
  ): Promise<AtrasarAgendaResponse> => {
    const { data } = await api.post(
      `/admin/canchas-sorteo/${tournamentId}/atrasar-agenda`,
      { fecha, minutos },
    );
    return data;
  },
};
