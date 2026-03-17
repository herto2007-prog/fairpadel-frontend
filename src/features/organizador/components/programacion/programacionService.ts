import { api } from '../../../../services/api';

export interface Cancha {
  id: string;
  nombre: string;
  sede: string;
}

export const programacionService = {
  /**
   * Obtiene las canchas disponibles para un torneo
   */
  async getCanchas(tournamentId: string): Promise<{ success: boolean; canchas: Cancha[] }> {
    const { data } = await api.get(`/programacion/torneos/${tournamentId}/canchas`);
    return data;
  },

  /**
   * Actualiza la programación de un partido
   */
  async actualizarPartido(
    partidoId: string,
    fecha: string,
    horaInicio: string,
    torneoCanchaId: string,
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await api.put(`/programacion/partidos/${partidoId}`, {
      fecha,
      horaInicio,
      torneoCanchaId,
    });
    return data;
  },

  /**
   * Desprograma un partido (limpia fecha/hora/cancha)
   */
  async desprogramarPartido(partidoId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete(`/programacion/partidos/${partidoId}`);
    return data;
  },
};
