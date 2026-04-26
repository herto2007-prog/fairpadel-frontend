import { api } from '../../services/api';

export interface PerfilJugador {
  id: string;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  fotoUrl?: string;
  bannerUrl?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  telefono?: string;
  ciudad?: string;
  pais?: string;
  categoria?: {
    id: string;
    nombre: string;
    tipo: string;
    orden: number;
  };
  edad?: number | null;
  estado: string;
  esPremium: boolean;
  roles: string[];
  seguidores: number;
  siguiendo: number;
  stats: {
    torneosJugados: number;
    torneosGanados: number;
    finalesJugadas: number;
    semifinalesJugadas: number;
  };
  partidos: {
    jugados: number;
    ganados: number;
    perdidos: number;
    efectividad: number;
    rachaActual: number;
    mejorRacha: number;
  };
  ranking: Array<{
    tipo: string;
    alcance: string;
    alcanceNombre?: string;
    posicion: number;
    puntosTotales: number;
    torneosJugados: number;
    victorias: number;
    temporada: string;
  }>;
  historialPuntos: Array<{
    torneo: string;
    categoria: string;
    posicion: string;
    puntos: number;
    fecha: string;
  }>;
  actividadReciente: Array<{
    id: string;
    tipo: string;
    titulo: string;
    fecha: string;
    detalle: string;
  }>;
  logros: Array<{
    id: string;
    icon: string;
    nombre: string;
    descripcion: string;
    nivel: 'oro' | 'plata' | 'bronce' | 'especial';
    progreso: number;
  }>;
  circuitos: Array<{
    id: string;
    nombre: string;
    slug: string;
    logoUrl?: string;
    posicion: number;
    puntosTotales: number;
    torneosJugados: number;
    temporada: string;
  }>;
  whatsapp?: {
    consentCheckbox: boolean;
    consentStatus: string | null;
    consentDate: string | null;
    preferenciaNotificacion: string;
  };
  privado?: {
    inscripcionesPendientes: number;
    notificacionesNoLeidas: number;
  };
  destacadoTorneo?: {
    torneoId: string;
    nombre: string;
    flyerUrl?: string;
    categoria: string;
    posicionFinal: string;
    puntosGanados: number;
    fecha: string;
    partidosJugados: number;
    faseMasLejana: 'ZONA' | 'CUARTOS' | 'SEMIS' | 'FINAL';
    pareja: { nombre: string; apellido: string; fotoUrl?: string } | null;
    esPrimerTorneo: boolean;
  } | null;
}

export interface PreferenciasNotificacionResponse {
  success: boolean;
  message: string;
}

export const perfilService = {
  /**
   * Obtiene el perfil público de cualquier jugador
   */
  getPerfilJugador: async (userId: string): Promise<PerfilJugador> => {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data.data;
  },

  /**
   * Obtiene el perfil del usuario autenticado (con datos privados)
   */
  getMiPerfil: async (): Promise<PerfilJugador> => {
    const response = await api.get('/users/profile/me');
    return response.data.data;
  },

  /**
   * Actualiza las preferencias de notificación del usuario
   */
  updatePreferenciasNotificacion: async (preferencia: 'EMAIL' | 'WHATSAPP' | 'AMBOS'): Promise<PreferenciasNotificacionResponse> => {
    const response = await api.put('/users/profile/preferencias-notificacion', {
      preferenciaNotificacion: preferencia,
    });
    return response.data;
  },

  /**
   * Solicita consentimiento de WhatsApp para usuarios existentes
   */
  solicitarConsentimientoWhatsapp: async (): Promise<PreferenciasNotificacionResponse> => {
    const response = await api.post('/users/profile/whatsapp/solicitar-consentimiento');
    return response.data;
  },

  /**
   * Revoca el consentimiento de WhatsApp
   */
  revocarConsentimientoWhatsapp: async (): Promise<PreferenciasNotificacionResponse> => {
    const response = await api.post('/users/profile/whatsapp/revocar');
    return response.data;
  },
};
