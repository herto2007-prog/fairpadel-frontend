import api from './api';
import type { Tournament, Category, CreateTournamentDto, UpdateTournamentDto, CuentaBancaria } from '@/types';

export const tournamentsService = {
  // GET /tournaments - Obtener todos los torneos (público)
  getAll: async (filters?: { pais?: string; ciudad?: string; estado?: string; nombre?: string }): Promise<Tournament[]> => {
    const params = new URLSearchParams();
    if (filters?.pais) params.append('pais', filters.pais);
    if (filters?.ciudad) params.append('ciudad', filters.ciudad);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.nombre) params.append('nombre', filters.nombre);

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

  // PATCH /tournaments/:id/categorias/:tcId/toggle-inscripcion
  toggleInscripcionCategoria: async (tournamentId: string, tournamentCategoryId: string) => {
    const response = await api.patch(`/tournaments/${tournamentId}/categorias/${tournamentCategoryId}/toggle-inscripcion`);
    return response.data;
  },

  // GET /tournaments/:id/stats
  getStats: async (tournamentId: string) => {
    const response = await api.get(`/tournaments/${tournamentId}/stats`);
    return response.data;
  },

  // GET /tournaments/:id/pelotas-ronda
  getPelotasRonda: async (tournamentId: string) => {
    const response = await api.get(`/tournaments/${tournamentId}/pelotas-ronda`);
    return response.data;
  },

  // PUT /tournaments/:id/pelotas-ronda
  updatePelotasRonda: async (tournamentId: string, rondas: { ronda: string; cantidadPelotas: number }[]) => {
    const response = await api.put(`/tournaments/${tournamentId}/pelotas-ronda`, { rondas });
    return response.data;
  },

  // POST /tournaments/:id/finalizar - Finalizar torneo
  finalizarTorneo: async (id: string) => {
    const response = await api.post(`/tournaments/${id}/finalizar`);
    return response.data;
  },

  // PUT /tournaments/:id/cancelar - Cancelar torneo
  cancelarTorneo: async (id: string, motivo: string): Promise<{ message: string; inscripcionesCanceladas: number }> => {
    const response = await api.put(`/tournaments/${id}/cancelar`, { motivo });
    return response.data;
  },

  // POST /tournaments/:id/flyer - Upload flyer image
  uploadFlyer: async (id: string, file: File): Promise<{ flyerUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/tournaments/${id}/flyer`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Ayudantes
  getAyudantes: async (tournamentId: string) => {
    const response = await api.get(`/tournaments/${tournamentId}/ayudantes`);
    return response.data;
  },

  addAyudante: async (tournamentId: string, data: { documento: string; nombre?: string; rol?: string }) => {
    const response = await api.post(`/tournaments/${tournamentId}/ayudantes`, data);
    return response.data;
  },

  removeAyudante: async (tournamentId: string, ayudanteId: string) => {
    const response = await api.delete(`/tournaments/${tournamentId}/ayudantes/${ayudanteId}`);
    return response.data;
  },

  // Cuentas bancarias
  getCuentasBancarias: async (tournamentId: string): Promise<CuentaBancaria[]> => {
    const response = await api.get<CuentaBancaria[]>(`/tournaments/${tournamentId}/cuentas-bancarias`);
    return response.data;
  },

  createCuentaBancaria: async (
    tournamentId: string,
    data: {
      banco: string;
      titular: string;
      cedulaRuc: string;
      nroCuenta?: string;
      aliasSpi?: string;
      telefonoComprobante?: string;
    },
  ): Promise<CuentaBancaria> => {
    const response = await api.post<CuentaBancaria>(`/tournaments/${tournamentId}/cuentas-bancarias`, data);
    return response.data;
  },

  updateCuentaBancaria: async (
    tournamentId: string,
    cuentaId: string,
    data: Partial<CuentaBancaria>,
  ): Promise<CuentaBancaria> => {
    const response = await api.put<CuentaBancaria>(`/tournaments/${tournamentId}/cuentas-bancarias/${cuentaId}`, data);
    return response.data;
  },

  deleteCuentaBancaria: async (tournamentId: string, cuentaId: string): Promise<void> => {
    await api.delete(`/tournaments/${tournamentId}/cuentas-bancarias/${cuentaId}`);
  },
};

export default tournamentsService;