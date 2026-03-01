import api from './api';
import type {
  SedeAlquilerResumen,
  AlquilerConfig,
  AlquilerPrecio,
  AlquilerDisponibilidad,
  AlquilerBloqueo,
  ReservaCancha,
  DisponibilidadDia,
  AlquileresDashboard,
  BuscarDisponibilidadResponse,
} from '@/types';

export const alquileresService = {
  // ── Público ──
  getCiudadesConAlquiler: async (): Promise<string[]> => {
    const { data } = await api.get('/alquileres/ciudades');
    return data;
  },

  buscarDisponibilidad: async (ciudad: string, fecha: string, horaInicio: string): Promise<BuscarDisponibilidadResponse> => {
    const params = new URLSearchParams({ ciudad, fecha, horaInicio });
    const { data } = await api.get(`/alquileres/buscar-disponibilidad?${params.toString()}`);
    return data;
  },

  getSedesConAlquiler: async (filters?: { ciudad?: string; nombre?: string }): Promise<SedeAlquilerResumen[]> => {
    const params = new URLSearchParams();
    if (filters?.ciudad) params.append('ciudad', filters.ciudad);
    if (filters?.nombre) params.append('nombre', filters.nombre);
    const { data } = await api.get(`/alquileres?${params.toString()}`);
    return data;
  },

  getSedeDetalle: async (sedeId: string) => {
    const { data } = await api.get(`/alquileres/${sedeId}`);
    return data;
  },

  getDisponibilidadDia: async (sedeId: string, fecha: string): Promise<DisponibilidadDia> => {
    const { data } = await api.get(`/alquileres/${sedeId}/disponibilidad?fecha=${fecha}`);
    return data;
  },

  getCalendarioSemanal: async (sedeId: string, fechaInicio: string) => {
    const { data } = await api.get(`/alquileres/${sedeId}/calendario?fechaInicio=${fechaInicio}`);
    return data;
  },

  // ── Usuario ──
  crearReserva: async (sedeId: string, dto: { sedeCanchaId: string; fecha: string; horaInicio: string; notas?: string }): Promise<ReservaCancha> => {
    const { data } = await api.post(`/alquileres/${sedeId}/reservar`, dto);
    return data;
  },

  getMisReservas: async (estado?: string): Promise<ReservaCancha[]> => {
    const params = estado ? `?estado=${estado}` : '';
    const { data } = await api.get(`/alquileres/mis-reservas${params}`);
    return data;
  },

  cancelarReserva: async (reservaId: string): Promise<ReservaCancha> => {
    const { data } = await api.put(`/alquileres/mis-reservas/${reservaId}/cancelar`);
    return data;
  },

  // ── Encargado ──
  getMiSede: async (): Promise<AlquilerConfig> => {
    const { data } = await api.get('/alquileres/encargado/mi-sede');
    return data;
  },

  getReservasSede: async (sedeId: string, filters?: { estado?: string; fecha?: string }): Promise<ReservaCancha[]> => {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.fecha) params.append('fecha', filters.fecha);
    const { data } = await api.get(`/alquileres/encargado/${sedeId}/reservas?${params.toString()}`);
    return data;
  },

  confirmarReserva: async (reservaId: string): Promise<ReservaCancha> => {
    const { data } = await api.put(`/alquileres/encargado/reservas/${reservaId}/confirmar`);
    return data;
  },

  rechazarReserva: async (reservaId: string, motivo?: string): Promise<ReservaCancha> => {
    const { data } = await api.put(`/alquileres/encargado/reservas/${reservaId}/rechazar`, { motivo });
    return data;
  },

  completarReserva: async (reservaId: string): Promise<ReservaCancha> => {
    const { data } = await api.put(`/alquileres/encargado/reservas/${reservaId}/completar`);
    return data;
  },

  marcarNoShow: async (reservaId: string): Promise<ReservaCancha> => {
    const { data } = await api.put(`/alquileres/encargado/reservas/${reservaId}/no-show`);
    return data;
  },

  marcarPago: async (reservaId: string, pagado: boolean, metodoPago?: string): Promise<ReservaCancha> => {
    const { data } = await api.put(`/alquileres/encargado/reservas/${reservaId}/pago`, { pagado, metodoPago });
    return data;
  },

  crearReservaManual: async (sedeId: string, dto: {
    sedeCanchaId: string;
    fecha: string;
    horaInicio: string;
    userId?: string;
    nombreExterno?: string;
    telefonoExterno?: string;
    notas?: string;
  }): Promise<ReservaCancha> => {
    const { data } = await api.post(`/alquileres/encargado/${sedeId}/reserva-manual`, dto);
    return data;
  },

  getConfig: async (sedeId: string): Promise<AlquilerConfig> => {
    const { data } = await api.get(`/alquileres/encargado/${sedeId}/config`);
    return data;
  },

  actualizarConfig: async (sedeId: string, dto: Partial<AlquilerConfig>): Promise<AlquilerConfig> => {
    const { data } = await api.put(`/alquileres/encargado/${sedeId}/config`, dto);
    return data;
  },

  configurarPrecios: async (sedeId: string, precios: { tipoCancha: string; tipoDia: string; franja: string; precio: number }[]): Promise<AlquilerPrecio[]> => {
    const { data } = await api.put(`/alquileres/encargado/${sedeId}/precios`, { precios });
    return data;
  },

  getPrecios: async (sedeId: string): Promise<AlquilerPrecio[]> => {
    const { data } = await api.get(`/alquileres/encargado/${sedeId}/precios`);
    return data;
  },

  configurarDisponibilidad: async (sedeId: string, slots: { sedeCanchaId: string; diaSemana: number; horaInicio: string; horaFin: string }[]): Promise<AlquilerDisponibilidad[]> => {
    const { data } = await api.put(`/alquileres/encargado/${sedeId}/disponibilidad`, { slots });
    return data;
  },

  getDisponibilidad: async (sedeId: string): Promise<AlquilerDisponibilidad[]> => {
    const { data } = await api.get(`/alquileres/encargado/${sedeId}/disponibilidad`);
    return data;
  },

  crearBloqueo: async (sedeId: string, dto: { fechaInicio: string; fechaFin: string; sedeCanchaId?: string; motivo?: string }): Promise<AlquilerBloqueo> => {
    const { data } = await api.post(`/alquileres/encargado/${sedeId}/bloqueos`, dto);
    return data;
  },

  eliminarBloqueo: async (sedeId: string, bloqueoId: string) => {
    const { data } = await api.delete(`/alquileres/encargado/${sedeId}/bloqueos/${bloqueoId}`);
    return data;
  },

  getBloqueos: async (sedeId: string): Promise<AlquilerBloqueo[]> => {
    const { data } = await api.get(`/alquileres/encargado/${sedeId}/bloqueos`);
    return data;
  },

  // ── Admin ──
  habilitarAlquiler: async (dto: {
    sedeId: string;
    encargadoId?: string;
    requiereAprobacion?: boolean;
    duracionSlotMinutos?: number;
    anticipacionMaxDias?: number;
    cancelacionMinHoras?: number;
    mensajeBienvenida?: string;
  }): Promise<AlquilerConfig> => {
    const { data } = await api.post('/alquileres/admin/habilitar', dto);
    return data;
  },

  deshabilitarAlquiler: async (sedeId: string) => {
    const { data } = await api.put(`/alquileres/admin/${sedeId}/deshabilitar`);
    return data;
  },

  getDashboard: async (): Promise<AlquileresDashboard> => {
    const { data } = await api.get('/alquileres/admin/dashboard');
    return data;
  },
};
