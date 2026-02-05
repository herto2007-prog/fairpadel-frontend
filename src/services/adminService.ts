import api from './api';
import type { Tournament } from '@/types';

export const adminService = {
  // ============ TORNEOS ============
  getTorneosPendientes: async (): Promise<Tournament[]> => {
    const response = await api.get('/admin/torneos-pendientes');
    return response.data;
  },

  aprobarTorneo: async (id: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/torneos/${id}/aprobar`);
    return response.data;
  },

  rechazarTorneo: async (id: string, motivo: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/torneos/${id}/rechazar`, { motivo });
    return response.data;
  },

  // ============ MÉTRICAS ============
  getMetricasDashboard: async (): Promise<{
    totalUsuarios: number;
    usuariosPremium: number;
    totalTorneos: number;
    torneosPendientes: number;
  }> => {
    const response = await api.get('/admin/metricas/dashboard');
    return response.data;
  },

  // ============ USUARIOS ============
  getUsuarios: async (search?: string, estado?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (estado) params.append('estado', estado);
    const response = await api.get(`/admin/usuarios?${params.toString()}`);
    return response.data;
  },

  suspenderUsuario: async (id: string, motivo: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/usuarios/${id}/suspender`, { motivo });
    return response.data;
  },

  activarUsuario: async (id: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/usuarios/${id}/activar`);
    return response.data;
  },

  // ============ SOLICITUDES ORGANIZADOR ============
  getSolicitudesOrganizador: async (estado?: string): Promise<any[]> => {
    const params = estado ? `?estado=${estado}` : '';
    const response = await api.get(`/admin/solicitudes-organizador${params}`);
    return response.data;
  },

  aprobarSolicitudOrganizador: async (id: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/solicitudes-organizador/${id}/aprobar`);
    return response.data;
  },

  rechazarSolicitudOrganizador: async (id: string, motivo: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/solicitudes-organizador/${id}/rechazar`, { motivo });
    return response.data;
  },
};

export default adminService;