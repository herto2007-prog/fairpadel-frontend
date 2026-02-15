import api from './api';

export interface Foto {
  id: string;
  userId: string;
  urlImagen: string;
  urlThumbnail?: string;
  cloudinaryPublicId?: string;
  descripcion?: string;
  tipo: string;
  estadoModeracion: string;
  likesCount: number;
  comentariosCount: number;
  createdAt: string;
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl: string | null;
  };
}

export interface FotoComentario {
  id: string;
  contenido: string;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl: string | null;
  };
}

export interface FotoLike {
  id: string;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl: string | null;
  };
}

export interface FotoCount {
  count: number;
  limit: number | null;
  esPremium: boolean;
}

class FotosService {
  async subirFoto(file: File, descripcion?: string, tipo: string = 'PERSONAL'): Promise<Foto> {
    const formData = new FormData();
    formData.append('file', file);
    if (descripcion) formData.append('descripcion', descripcion);
    formData.append('tipo', tipo);
    const response = await api.post<Foto>('/fotos/subir', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async obtenerFotos(userId?: string, tipo?: string): Promise<Foto[]> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (tipo) params.append('tipo', tipo);
    const response = await api.get<Foto[]>(`/fotos?${params.toString()}`);
    return response.data;
  }

  async obtenerFoto(id: string): Promise<Foto> {
    const response = await api.get<Foto>(`/fotos/${id}`);
    return response.data;
  }

  async contarMisFotos(): Promise<FotoCount> {
    const response = await api.get<FotoCount>('/fotos/mis-fotos/count');
    return response.data;
  }

  async eliminarFoto(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/fotos/${id}`);
    return response.data;
  }

  async darLike(fotoId: string): Promise<{ message: string }> {
    const response = await api.post(`/fotos/${fotoId}/like`);
    return response.data;
  }

  async obtenerLikes(fotoId: string): Promise<FotoLike[]> {
    const response = await api.get<FotoLike[]>(`/fotos/${fotoId}/likes`);
    return response.data;
  }

  async comentar(fotoId: string, contenido: string): Promise<FotoComentario> {
    const response = await api.post<FotoComentario>(`/fotos/${fotoId}/comentar`, { contenido });
    return response.data;
  }

  async obtenerComentarios(fotoId: string): Promise<FotoComentario[]> {
    const response = await api.get<FotoComentario[]>(`/fotos/${fotoId}/comentarios`);
    return response.data;
  }

  async eliminarComentario(comentarioId: string): Promise<{ message: string }> {
    const response = await api.delete(`/fotos/comentarios/${comentarioId}`);
    return response.data;
  }

  async reportarFoto(fotoId: string, motivo: string): Promise<{ message: string }> {
    const response = await api.post(`/fotos/${fotoId}/reportar`, { motivo });
    return response.data;
  }
}

export const fotosService = new FotosService();
export default fotosService;
