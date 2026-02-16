import api from './api';
import type {
  Sede,
  SedeCancha,
  TorneoCancha,
  CreateSedeDto,
  UpdateSedeDto,
  CreateSedeCanchaDto,
  UpdateSedeCanchaDto,
  ConfigurarTorneoCanchasDto,
} from '@/types';

export const sedesService = {
  // ═══════════════════════════════════════════
  // SEDES (Admin: CRUD / Organizador: solo lectura)
  // ═══════════════════════════════════════════

  getAll: async (filters?: { ciudad?: string; nombre?: string; activo?: boolean }): Promise<Sede[]> => {
    const params = new URLSearchParams();
    if (filters?.ciudad) params.append('ciudad', filters.ciudad);
    if (filters?.nombre) params.append('nombre', filters.nombre);
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    const response = await api.get(`/sedes?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Sede> => {
    const response = await api.get(`/sedes/${id}`);
    return response.data;
  },

  create: async (data: CreateSedeDto): Promise<Sede> => {
    const response = await api.post('/sedes', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSedeDto): Promise<Sede> => {
    const response = await api.put(`/sedes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/sedes/${id}`);
  },

  reactivar: async (id: string): Promise<Sede> => {
    const response = await api.put(`/sedes/${id}/reactivar`);
    return response.data;
  },

  // ═══════════════════════════════════════════
  // CANCHAS DE SEDE (Solo Admin)
  // ═══════════════════════════════════════════

  getCanchas: async (sedeId: string, includeInactive = true): Promise<SedeCancha[]> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await api.get(`/sedes/${sedeId}/canchas${params}`);
    return response.data;
  },

  createCancha: async (sedeId: string, data: CreateSedeCanchaDto): Promise<SedeCancha> => {
    const response = await api.post(`/sedes/${sedeId}/canchas`, data);
    return response.data;
  },

  updateCancha: async (sedeId: string, canchaId: string, data: UpdateSedeCanchaDto): Promise<SedeCancha> => {
    const response = await api.put(`/sedes/${sedeId}/canchas/${canchaId}`, data);
    return response.data;
  },

  deleteCancha: async (sedeId: string, canchaId: string): Promise<void> => {
    await api.delete(`/sedes/${sedeId}/canchas/${canchaId}`);
  },

  updateCanchasBulk: async (sedeId: string, canchas: UpdateSedeCanchaDto[]): Promise<SedeCancha[]> => {
    const response = await api.put(`/sedes/${sedeId}/canchas-bulk`, canchas);
    return response.data;
  },

  // ═══════════════════════════════════════════
  // CONFIGURACION TORNEO-CANCHAS (Organizador)
  // ═══════════════════════════════════════════

  configurarTorneoCanchas: async (tournamentId: string, data: ConfigurarTorneoCanchasDto): Promise<TorneoCancha[]> => {
    const response = await api.post(`/sedes/torneos/${tournamentId}/configurar-canchas`, data);
    return response.data;
  },

  getTorneoCanchas: async (tournamentId: string): Promise<TorneoCancha[]> => {
    const response = await api.get(`/sedes/torneos/${tournamentId}/canchas`);
    return response.data;
  },

  agregarSedeATorneo: async (tournamentId: string, sedeId: string): Promise<void> => {
    await api.post(`/sedes/torneos/${tournamentId}/sedes/${sedeId}`);
  },

  removerSedeDeTorneo: async (tournamentId: string, sedeId: string): Promise<void> => {
    await api.delete(`/sedes/torneos/${tournamentId}/sedes/${sedeId}`);
  },

  getSedesDeTorneo: async (tournamentId: string): Promise<Sede[]> => {
    const response = await api.get(`/sedes/torneos/${tournamentId}/sedes`);
    return response.data;
  },
};

export default sedesService;
