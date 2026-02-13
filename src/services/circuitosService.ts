import api from './api';
import type { Circuito, CircuitoStanding, CreateCircuitoDto } from '@/types';

export const circuitosService = {
  // ============ PÚBLICOS ============
  getAll: async (): Promise<Circuito[]> => {
    const response = await api.get('/circuitos');
    return response.data;
  },

  getById: async (id: string): Promise<Circuito> => {
    const response = await api.get(`/circuitos/${id}`);
    return response.data;
  },

  getStandings: async (id: string, genero?: string): Promise<CircuitoStanding[]> => {
    const params = genero ? `?genero=${genero}` : '';
    const response = await api.get(`/circuitos/${id}/standings${params}`);
    return response.data;
  },

  // ============ ADMIN ============
  adminGetAll: async (estado?: string): Promise<Circuito[]> => {
    const params = estado ? `?estado=${estado}` : '';
    const response = await api.get(`/circuitos/admin/all${params}`);
    return response.data;
  },

  create: async (data: CreateCircuitoDto): Promise<Circuito> => {
    const response = await api.post('/circuitos', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCircuitoDto>): Promise<Circuito> => {
    const response = await api.put(`/circuitos/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/circuitos/${id}`);
    return response.data;
  },

  agregarTorneo: async (circuitoId: string, tournamentId: string): Promise<{ message: string }> => {
    const response = await api.put(`/circuitos/${circuitoId}/agregar-torneo`, { tournamentId });
    return response.data;
  },

  removerTorneo: async (circuitoId: string, tournamentId: string): Promise<{ message: string }> => {
    const response = await api.put(`/circuitos/${circuitoId}/remover-torneo`, { tournamentId });
    return response.data;
  },

  finalizar: async (id: string): Promise<{ message: string }> => {
    const response = await api.put(`/circuitos/${id}/finalizar`);
    return response.data;
  },

  getTorneosDisponibles: async (): Promise<any[]> => {
    const response = await api.get('/circuitos/admin/torneos-disponibles');
    return response.data;
  },
};

export default circuitosService;
