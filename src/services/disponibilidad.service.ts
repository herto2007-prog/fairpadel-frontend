import { api } from './api';

interface DiaConfig {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  minutosSlot: number;
}

interface DisponibilidadData {
  torneo: any;
  sedes: any[];
  canchas: any[];
  dias: any[];
}

export const disponibilidadService = {
  // Obtener toda la disponibilidad de un torneo
  getDisponibilidad: async (tournamentId: string): Promise<DisponibilidadData> => {
    const { data } = await api.get(`/admin/torneos/${tournamentId}/disponibilidad`);
    return data;
  },

  // Agregar sede al torneo
  agregarSede: async (tournamentId: string, sedeId: string) => {
    const { data } = await api.post(
      `/admin/torneos/${tournamentId}/disponibilidad/sedes`,
      { sedeId }
    );
    return data;
  },

  // Quitar sede del torneo
  quitarSede: async (tournamentId: string, sedeId: string) => {
    const { data } = await api.delete(
      `/admin/torneos/${tournamentId}/disponibilidad/sedes/${sedeId}`
    );
    return data;
  },

  // Agregar cancha al torneo
  agregarCancha: async (tournamentId: string, sedeCanchaId: string) => {
    const { data } = await api.post(
      `/admin/torneos/${tournamentId}/disponibilidad/canchas`,
      { sedeCanchaId }
    );
    return data;
  },

  // Quitar cancha del torneo
  quitarCancha: async (tournamentId: string, torneoCanchaId: string) => {
    const { data } = await api.delete(
      `/admin/torneos/${tournamentId}/disponibilidad/canchas/${torneoCanchaId}`
    );
    return data;
  },

  // Configurar día
  configurarDia: async (tournamentId: string, config: DiaConfig) => {
    const { data } = await api.post(
      `/admin/torneos/${tournamentId}/disponibilidad/dias`,
      config
    );
    return data;
  },

  // Eliminar día
  eliminarDia: async (tournamentId: string, diaId: string) => {
    const { data } = await api.delete(
      `/admin/torneos/${tournamentId}/disponibilidad/dias/${diaId}`
    );
    return data;
  },

  // Generar slots para un día
  generarSlots: async (tournamentId: string, diaId: string) => {
    const { data } = await api.post(
      `/admin/torneos/${tournamentId}/disponibilidad/dias/${diaId}/generar-slots`
    );
    return data;
  },

  // Obtener slots por semana (rango de fechas)
  getSlotsPorSemana: async (tournamentId: string, fechaInicio: string, fechaFin: string) => {
    const { data } = await api.get(
      `/admin/torneos/${tournamentId}/disponibilidad/slots`,
      { params: { fechaInicio, fechaFin } }
    );
    return data;
  },
};
