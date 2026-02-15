import api from './api';

export interface PublicacionFeed {
  id: string;
  userId: string;
  tipo: 'FOTO' | 'RESULTADO' | 'LOGRO' | 'ASCENSO';
  contenido: string | null;
  fotoId: string | null;
  matchId: string | null;
  tournamentId: string | null;
  categoriaId: string | null;
  datosExtra: string | null;
  likesCount: number;
  comentariosCount: number;
  createdAt: string;
  likedByMe: boolean;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl: string | null;
    esPremium: boolean;
  };
  foto?: {
    id: string;
    urlImagen: string;
    urlThumbnail: string | null;
    descripcion: string | null;
  } | null;
  match?: {
    id: string;
    ronda: string;
    set1Pareja1: number | null;
    set1Pareja2: number | null;
    set2Pareja1: number | null;
    set2Pareja2: number | null;
    set3Pareja1: number | null;
    set3Pareja2: number | null;
    pareja1: {
      jugador1: { id: string; nombre: string; apellido: string };
      jugador2: { id: string; nombre: string; apellido: string };
    } | null;
    pareja2: {
      jugador1: { id: string; nombre: string; apellido: string };
      jugador2: { id: string; nombre: string; apellido: string };
    } | null;
    parejaGanadora: {
      jugador1: { id: string; nombre: string; apellido: string };
      jugador2: { id: string; nombre: string; apellido: string };
    } | null;
  } | null;
  tournament?: {
    id: string;
    nombre: string;
  } | null;
}

export interface ComentarioPublicacion {
  id: string;
  publicacionId: string;
  contenido: string;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl: string | null;
  };
}

export const feedService = {
  obtenerFeed: async (page = 1, limit = 20): Promise<PublicacionFeed[]> => {
    const { data } = await api.get(`/feed?page=${page}&limit=${limit}`);
    return data;
  },

  publicar: async (contenido?: string, fotoId?: string): Promise<PublicacionFeed> => {
    const { data } = await api.post('/feed/publicar', { contenido, fotoId });
    return data;
  },

  toggleLike: async (publicacionId: string): Promise<{ liked: boolean }> => {
    const { data } = await api.post(`/feed/${publicacionId}/like`);
    return data;
  },

  comentar: async (publicacionId: string, contenido: string): Promise<ComentarioPublicacion> => {
    const { data } = await api.post(`/feed/${publicacionId}/comentar`, { contenido });
    return data;
  },

  obtenerComentarios: async (publicacionId: string, page = 1): Promise<ComentarioPublicacion[]> => {
    const { data } = await api.get(`/feed/${publicacionId}/comentarios?page=${page}`);
    return data;
  },

  eliminar: async (publicacionId: string): Promise<{ deleted: boolean }> => {
    const { data } = await api.delete(`/feed/${publicacionId}`);
    return data;
  },
};
