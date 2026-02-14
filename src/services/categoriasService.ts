import api from './api';
import type { ReglaAscenso, HistorialCategoria, User } from '@/types';

export const categoriasService = {
  // ═══════════════════════════════════════════
  // REGLAS DE ASCENSO
  // ═══════════════════════════════════════════

  getReglas: async (genero?: string): Promise<ReglaAscenso[]> => {
    const params: any = {};
    if (genero) params.genero = genero;
    const response = await api.get('/admin/categorias/reglas', { params });
    return response.data;
  },

  crearRegla: async (data: {
    categoriaOrigenId: string;
    categoriaDestinoId: string;
    campeonatosConsecutivos?: number;
    campeonatosAlternados?: number;
    finalistaCalifica?: boolean;
    activa?: boolean;
  }): Promise<ReglaAscenso> => {
    const response = await api.post('/admin/categorias/reglas', data);
    return response.data;
  },

  actualizarRegla: async (
    id: string,
    data: {
      campeonatosConsecutivos?: number;
      campeonatosAlternados?: number;
      finalistaCalifica?: boolean;
      activa?: boolean;
    },
  ): Promise<ReglaAscenso> => {
    const response = await api.put(`/admin/categorias/reglas/${id}`, data);
    return response.data;
  },

  eliminarRegla: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/categorias/reglas/${id}`);
    return response.data;
  },

  // ═══════════════════════════════════════════
  // GESTIÓN DE JUGADORES
  // ═══════════════════════════════════════════

  buscarJugadores: async (search: string): Promise<User[]> => {
    const response = await api.get('/admin/categorias/jugadores', { params: { search } });
    return response.data;
  },

  obtenerJugador: async (id: string): Promise<{ user: User; historial: HistorialCategoria[] }> => {
    const response = await api.get(`/admin/categorias/jugadores/${id}`);
    return response.data;
  },

  cambiarCategoria: async (
    id: string,
    data: { nuevaCategoriaId: string; tipo: string; motivo: string },
  ): Promise<{ message: string }> => {
    const response = await api.put(`/admin/categorias/jugadores/${id}/cambiar`, data);
    return response.data;
  },

  // ═══════════════════════════════════════════
  // HISTORIAL
  // ═══════════════════════════════════════════

  getHistorial: async (params?: {
    userId?: string;
    tipo?: string;
    desde?: string;
    hasta?: string;
  }): Promise<HistorialCategoria[]> => {
    const response = await api.get('/admin/categorias/historial', { params });
    return response.data;
  },
};

export default categoriasService;
