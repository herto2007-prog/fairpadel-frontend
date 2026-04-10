import { api } from './api';

export interface SeguimientoResponse {
  success: boolean;
  message: string;
  data?: {
    siguiendo: boolean;
    seguidoresCount: number;
    siguiendoCount: number;
  };
}

export interface CheckSeguimientoResponse {
  siguiendo: boolean;
}

export const seguimientoService = {
  /**
   * Seguir a un usuario
   */
  seguirUsuario: async (usuarioId: string): Promise<SeguimientoResponse> => {
    const response = await api.post<SeguimientoResponse>(`/users/${usuarioId}/seguir`);
    return response.data;
  },

  /**
   * Dejar de seguir a un usuario
   */
  dejarDeSeguir: async (usuarioId: string): Promise<SeguimientoResponse> => {
    const response = await api.delete<SeguimientoResponse>(`/users/${usuarioId}/seguir`);
    return response.data;
  },

  /**
   * Verificar si sigue al usuario
   */
  checkSiguiendo: async (usuarioId: string): Promise<CheckSeguimientoResponse> => {
    const response = await api.get<CheckSeguimientoResponse>(`/users/${usuarioId}/siguiendo`);
    return response.data;
  },
};
