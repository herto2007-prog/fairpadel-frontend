import { api } from '../../../../services/api';

export interface RegistrarResultadoPayload {
  set1Pareja1: number;
  set1Pareja2: number;
  set2Pareja1: number;
  set2Pareja2: number;
  set3Pareja1?: number;
  set3Pareja2?: number;
  formatoSet3: 'SUPER_TIE_BREAK' | 'SET_COMPLETO';
  observaciones?: string;
  duracionMinutos?: number;
}

export interface RegistrarPuntoPayload {
  tipo: 'PUNTO' | 'FALTA_DIRECTA' | 'ACE' | 'DOBLE_FALTA';
  ganador: number; // 1 o 2
  detalle?: string;
}

export interface ResultadoEspecialPayload {
  tipo: 'RETIRO_LESION' | 'RETIRO_OTRO' | 'DESCALIFICACION' | 'WO';
  parejaAfectada: number; // 1 o 2
  razon?: string;
  duracionMinutos?: number;
  observaciones?: string;
}

export const resultadosService = {
  // Carga directa de resultado
  registrarResultado: async (matchId: string, data: RegistrarResultadoPayload) => {
    const response = await api.post(`/admin/resultados/matches/${matchId}/resultado`, data);
    return response.data;
  },

  // Resultado especial (retiro, descalificación, WO)
  registrarResultadoEspecial: async (matchId: string, data: ResultadoEspecialPayload) => {
    const response = await api.post(`/admin/resultados/matches/${matchId}/resultado-especial`, data);
    return response.data;
  },

  // Marcador en vivo
  iniciarPartido: async (
    matchId: string, 
    formatoSet3?: 'SUPER_TIE_BREAK' | 'SET_COMPLETO', 
    modoPunto?: 'VENTAJA' | 'PUNTO_ORO',
    jugadorSacaP1?: 1 | 2,
    jugadorSacaP2?: 1 | 2,
    saqueInicial?: 1 | 2
  ) => {
    const response = await api.post(`/admin/resultados/matches/${matchId}/iniciar`, { 
      formatoSet3, 
      modoPunto,
      jugadorSacaP1,
      jugadorSacaP2,
      saqueInicial
    });
    return response.data;
  },

  cambiarConfiguracion: async (matchId: string, data: { formatoSet3?: 'SUPER_TIE_BREAK' | 'SET_COMPLETO'; modoPunto?: 'VENTAJA' | 'PUNTO_ORO' }) => {
    const response = await api.post(`/admin/resultados/matches/${matchId}/configuracion`, data);
    return response.data;
  },

  obtenerMarcador: async (matchId: string) => {
    const response = await api.get(`/admin/resultados/matches/${matchId}/marcador`);
    return response.data;
  },

  registrarPunto: async (matchId: string, data: RegistrarPuntoPayload) => {
    const response = await api.post(`/admin/resultados/matches/${matchId}/punto`, data);
    return response.data;
  },

  deshacerUltimoPunto: async (matchId: string) => {
    const response = await api.post(`/admin/resultados/matches/${matchId}/deshacer`);
    return response.data;
  },

  finalizarPartido: async (matchId: string, observaciones?: string, duracionMinutos?: number) => {
    const response = await api.post(`/admin/resultados/matches/${matchId}/finalizar`, {
      observaciones,
      duracionMinutos,
    });
    return response.data;
  },
};
