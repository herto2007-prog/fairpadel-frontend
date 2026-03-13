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
  edad?: number;
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
  privado?: {
    inscripcionesPendientes: number;
    notificacionesNoLeidas: number;
  };
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
};
