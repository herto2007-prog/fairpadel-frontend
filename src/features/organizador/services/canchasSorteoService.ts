import { api } from '../../../services/api';

export interface ConfigurarFinalesPayload {
  tournamentId: string;
  // Semifinales
  horaInicioSemifinales: string;
  horaFinSemifinales: string;
  canchasSemifinalesIds: string[];
  // Finales
  horaInicioFinales: string;
  horaFinFinales: string;
  canchasFinalesIds: string[];
}

export interface ConfigurarDiaJuegoPayload {
  tournamentId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  minutosSlot: number;
  canchasIds: string[];
}

export interface CerrarInscripcionesPayload {
  tournamentId: string;
  categoriasIds: string[];
}

export interface CalculoSlotsResponse {
  totalSlotsNecesarios: number;
  slotsDisponibles: number;
  slotsFaltantes: number;
  horasNecesarias: number;
  horasDisponibles: number;
  duracionPromedioMinutos: number;
  detallePorCategoria: {
    categoriaId: string;
    nombre: string;
    parejas: number;
    slotsNecesarios: number;
    partidosPorFase: { fase: string; partidos: number }[];
  }[];
  valido: boolean;
  mensaje?: string;
}

export interface SorteoMasivoResponse {
  success: boolean;
  message: string;
  categoriasSorteadas: {
    categoriaId: string;
    nombre: string;
    fixtureVersionId: string;
    totalPartidos: number;
    slotsReservados: number;
  }[];
  slotsTotalesReservados: number;
  distribucionPorDia: {
    fecha: string;
    slotsReservados: number;
    categorias: string[];
  }[];
}

export const canchasSorteoService = {
  // PASO 1.a: Configurar horarios de finales
  configurarFinales: async (data: ConfigurarFinalesPayload) => {
    const response = await api.post('/admin/canchas-sorteo/finales', data);
    return response.data;
  },

  // PASO 1.b: Configurar días de juego
  configurarDiaJuego: async (data: ConfigurarDiaJuegoPayload) => {
    const response = await api.post('/admin/canchas-sorteo/dias', data);
    return response.data;
  },

  // Obtener configuración actual
  obtenerConfiguracion: async (tournamentId: string) => {
    const response = await api.get(`/admin/canchas-sorteo/${tournamentId}/configuracion`);
    return response.data;
  },

  // PASO 2: Calcular slots necesarios
  calcularSlotsNecesarios: async (
    tournamentId: string,
    categoriasIds: string[]
  ): Promise<CalculoSlotsResponse> => {
    const response = await api.post('/admin/canchas-sorteo/calcular-slots', {
      tournamentId,
      categoriasIds,
    });
    return response.data;
  },

  // PASO 2: Cerrar inscripciones y sortear
  cerrarInscripcionesYsortear: async (
    data: CerrarInscripcionesPayload
  ): Promise<SorteoMasivoResponse> => {
    const response = await api.post('/admin/canchas-sorteo/cerrar-y-sortear', data);
    return response.data;
  },
};
