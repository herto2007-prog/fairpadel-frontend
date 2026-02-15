import api from './api';
import type { Notificacion, PreferenciaNotificacion } from '@/types';

export const notificacionesService = {
  // ═══════════════════════════════════════════
  // NOTIFICACIONES CRUD
  // ═══════════════════════════════════════════

  obtenerNotificaciones: async (leida?: boolean): Promise<Notificacion[]> => {
    const params: any = {};
    if (leida !== undefined) params.leida = leida;
    const response = await api.get('/notificaciones', { params });
    return response.data;
  },

  contarNoLeidas: async (): Promise<{ count: number }> => {
    const response = await api.get('/notificaciones/no-leidas/count');
    return response.data;
  },

  marcarComoLeida: async (id: string): Promise<Notificacion> => {
    const response = await api.put(`/notificaciones/${id}/leer`);
    return response.data;
  },

  marcarTodasComoLeidas: async (): Promise<{ message: string }> => {
    const response = await api.put('/notificaciones/leer-todas');
    return response.data;
  },

  // ═══════════════════════════════════════════
  // PREFERENCIAS
  // ═══════════════════════════════════════════

  obtenerPreferencias: async (): Promise<PreferenciaNotificacion[]> => {
    const response = await api.get('/notificaciones/preferencias');
    return response.data;
  },

  actualizarPreferencia: async (data: {
    tipoNotificacion: string;
    recibirEmail?: boolean;
    recibirSms?: boolean;
  }): Promise<PreferenciaNotificacion> => {
    const response = await api.put('/notificaciones/preferencias', data);
    return response.data;
  },
};
