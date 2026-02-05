import api from './api';
import type { Tournament, Category, CreateTournamentDto, UpdateTournamentDto } from '@/types';

export const tournamentsService = {
  // GET /tournaments - Obtener todos los torneos (público)
  getAll: async (filters?: { pais?: string; ciudad?: string; estado?: string }): Promise<Tournament[]> => {
    const params = new URLSearchParams();
    if (filters?.pais) params.append('pais', filters.pais);
    if (filters?.ciudad) params.append('ciudad', filters.ciudad);
    if (filters?.estado) params.append('estado', filters.estado);
    
    const response = await api.get(`/tournaments?${params.toString()}`);
    return response.data;
  },

  // GET /tournaments?estado=PUBLICADO - Obtener torneos por estado
  getByStatus: async (estado: string): Promise<Tournament[]> => {
    const response = await api.get(`/tournaments?estado=${estado}`);
    return response.data;
  },

  // GET /tournaments/categories - Obtener categorías
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/tournaments/categories');
    return response.data;
  },

  // GET /tournaments/my-tournaments - Obtener mis torneos (requiere auth + organizador/admin)
  getMyTournaments: async (): Promise<Tournament[]> => {
    const response = await api.get('/tournaments/my-tournaments');
    return response.data;
  },

  // GET /tournaments/:id - Obtener un torneo por ID (público)
  getById: async (id: string): Promise<Tournament> => {
    const response = await api.get(`/tournaments/${id}`);
    return response.data;
  },

  // POST /tournaments - Crear torneo (requiere auth + organizador/admin)
  create: async (data: CreateTournamentDto): Promise<Tournament> => {
    const response = await api.post('/tournaments', data);
    return response.data;
  },

  // PATCH /tournaments/:id - Actualizar torneo (requiere auth + ser el organizador)
  update: async (id: string, data: UpdateTournamentDto): Promise<Tournament> => {
    const response = await api.patch(`/tournaments/${id}`, data);
    return response.data;
  },

  // POST /tournaments/:id/publish - Publicar torneo (requiere auth + ser el organizador)
  publish: async (id: string): Promise<Tournament> => {
    const response = await api.post(`/tournaments/${id}/publish`);
    return response.data;
  },

  // DELETE /tournaments/:id - Eliminar torneo (requiere auth + ser el organizador, solo en BORRADOR)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tournaments/${id}`);
  },

  // Alias para compatibilidad
  start: async (id: string): Promise<Tournament> => {
    // TODO: Implementar en backend si es necesario
    // Por ahora, esto podría ser un cambio de estado
    const response = await api.patch(`/tournaments/${id}`, { estado: 'EN_CURSO' });
    return response.data;
  },
};

export default tournamentsService;