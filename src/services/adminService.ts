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

  promoverOrganizador: async (documento: string): Promise<{ message: string; usuario?: any }> => {
    const response = await api.post('/admin/promover-organizador', { documento });
    return response.data;
  },

  // ============ MODERACIÓN FOTOS ============
  getFotosModeracion: async (): Promise<any[]> => {
    const response = await api.get('/admin/fotos-moderacion');
    return response.data;
  },

  aprobarFoto: async (id: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/fotos/${id}/aprobar`);
    return response.data;
  },

  eliminarFoto: async (id: string, motivo: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/fotos/${id}/eliminar`, { motivo });
    return response.data;
  },

  // ============ REPORTES ============
  getReportesFotos: async (estado?: string): Promise<any[]> => {
    const params = estado ? `?estado=${estado}` : '';
    const response = await api.get(`/admin/reportes/fotos${params}`);
    return response.data;
  },

  getReportesUsuarios: async (estado?: string): Promise<any[]> => {
    const params = estado ? `?estado=${estado}` : '';
    const response = await api.get(`/admin/reportes/usuarios${params}`);
    return response.data;
  },

  resolverReporteFoto: async (id: string, accion: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/reportes/fotos/${id}/resolver`, { accion });
    return response.data;
  },

  resolverReporteUsuario: async (id: string, accion: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/reportes/usuarios/${id}/resolver`, { accion });
    return response.data;
  },

  // ============ SUSCRIPCIONES ============
  getSuscripciones: async (estado?: string): Promise<any[]> => {
    const params = estado ? `?estado=${estado}` : '';
    const response = await api.get(`/admin/suscripciones${params}`);
    return response.data;
  },

  extenderSuscripcion: async (id: string, dias: number): Promise<{ message: string }> => {
    const response = await api.put(`/admin/suscripciones/${id}/extender`, { dias });
    return response.data;
  },

  // ============ CUPONES ============
  getCupones: async (): Promise<any[]> => {
    const response = await api.get('/admin/cupones');
    return response.data;
  },

  crearCupon: async (data: {
    codigo: string;
    tipo: string;
    valor: number;
    fechaInicio: string;
    fechaExpiracion: string;
    limiteUsos: number;
  }): Promise<any> => {
    const response = await api.post('/admin/cupones', data);
    return response.data;
  },

  desactivarCupon: async (id: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/cupones/${id}/desactivar`);
    return response.data;
  },

  // ============ MÉTRICAS INGRESOS ============
  getMetricasIngresos: async (): Promise<{
    mrr: number;
    totalComisiones: number;
    suscripcionesActivas: number;
  }> => {
    const response = await api.get('/admin/metricas/ingresos');
    return response.data;
  },

  // ============ CONFIGURACIÓN ============
  getConfiguracionPuntos: async (): Promise<any[]> => {
    const response = await api.get('/admin/configuracion/puntos');
    return response.data;
  },

  actualizarConfiguracionPuntos: async (id: string, data: { puntosBase: number; multiplicador: number }): Promise<{ message: string }> => {
    const response = await api.put(`/admin/configuracion/puntos/${id}`, data);
    return response.data;
  },

  // ============ CONFIGURACIÓN SISTEMA ============
  getConfiguracionSistema: async (): Promise<any[]> => {
    const response = await api.get('/admin/configuracion/sistema');
    return response.data;
  },

  actualizarConfiguracionSistema: async (clave: string, valor: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/configuracion/sistema/${clave}`, { valor });
    return response.data;
  },

  getMetricasUsuarios: async (): Promise<any> => {
    const response = await api.get('/admin/metricas/usuarios');
    return response.data;
  },

  getMetricasTorneos: async (): Promise<any> => {
    const response = await api.get('/admin/metricas/torneos');
    return response.data;
  },
};

export default adminService;