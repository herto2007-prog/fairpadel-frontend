import { api } from './api';

// ═══════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════

export type TipoNotificacion = 
  | 'SISTEMA' 
  | 'TORNEO' 
  | 'INSCRIPCION' 
  | 'PARTIDO' 
  | 'RANKING' 
  | 'SOCIAL' 
  | 'PAGO' 
  | 'MENSAJE';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string | null;
  contenido: string;
  enlace: string | null;
  leida: boolean;
  createdAt: string;
}

export interface NotificacionesResponse {
  success: boolean;
  data: {
    notificaciones: Notificacion[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ContadorResponse {
  success: boolean;
  data: {
    count: number;
  };
}

// ═══════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════

export const notificationService = {
  /**
   * Obtiene las notificaciones del usuario
   */
  getNotificaciones: async (
    page: number = 1,
    limit: number = 20,
    soloNoLeidas: boolean = false
  ): Promise<Notificacion[]> => {
    const response = await api.get<NotificacionesResponse>('/notificaciones', {
      params: { page, limit, soloNoLeidas: soloNoLeidas ? 'true' : 'false' },
    });
    return response.data.data.notificaciones;
  },

  /**
   * Obtiene el contador de notificaciones no leídas
   */
  getContadorNoLeidas: async (): Promise<number> => {
    const response = await api.get<ContadorResponse>('/notificaciones/no-leidas');
    return response.data.data.count;
  },

  /**
   * Marca una notificación como leída
   */
  marcarComoLeida: async (id: string): Promise<void> => {
    await api.put(`/notificaciones/${id}/leer`);
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  marcarTodasComoLeidas: async (): Promise<{ marcadas: number }> => {
    const response = await api.put('/notificaciones/leer-todas');
    return response.data.data;
  },

  /**
   * Elimina una notificación
   */
  eliminarNotificacion: async (id: string): Promise<void> => {
    await api.delete(`/notificaciones/${id}`);
  },
};
