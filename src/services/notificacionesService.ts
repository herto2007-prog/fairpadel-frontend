import api from './api';
import type { Notificacion, PreferenciaNotificacion } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const notificacionesService = {
  // ═══════════════════════════════════════════
  // SSE REAL-TIME STREAM
  // ═══════════════════════════════════════════

  /**
   * Connect to SSE stream for real-time notification updates.
   * Returns an EventSource that emits when new notifications arrive.
   */
  connectStream: (token: string, onNotification: (data: { count: number; tipo: string; titulo: string; contenido: string }) => void): EventSource | null => {
    if (!token) return null;
    try {
      const url = `${API_BASE}/notificaciones/stream?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'heartbeat') return; // Ignore heartbeats
          onNotification(data);
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        // EventSource will auto-reconnect, no action needed
      };

      return eventSource;
    } catch {
      return null;
    }
  },

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
