import { api } from '../../services/api';

export interface CreateCircuitoPayload {
  nombre: string;
  descripcion?: string;
  ciudad: string;
  region?: string;
  temporada?: string;
  colorPrimario?: string;
  logoUrl?: string;
  bannerUrl?: string;
  destacado?: boolean;
}

export interface SolicitarInclusionPayload {
  circuitoId: string;
  orden?: number;
  notas?: string;
}

export interface ProcesarSolicitudPayload {
  estado: 'APROBADO' | 'RECHAZADO';
  puntosValidos?: boolean;
  orden?: number;
  notas?: string;
}

export const circuitosService = {
  // Públicos
  getCircuitos: async () => {
    const response = await api.get('/circuitos');
    return response.data;
  },

  getCircuitoBySlug: async (slug: string) => {
    const response = await api.get(`/circuitos/slug/${slug}`);
    return response.data;
  },

  getCircuito: async (id: string) => {
    const response = await api.get(`/circuitos/${id}`);
    return response.data;
  },

  getRankingCircuito: async (id: string, categoriaId?: string) => {
    const params = categoriaId ? `?categoriaId=${categoriaId}` : '';
    const response = await api.get(`/circuitos/${id}/ranking${params}`);
    return response.data;
  },

  getTorneosCircuito: async (id: string) => {
    const response = await api.get(`/circuitos/${id}/torneos`);
    return response.data;
  },

  // Organizador - Solicitar inclusión
  solicitarInclusion: async (torneoId: string, data: SolicitarInclusionPayload) => {
    const response = await api.post(`/circuitos/torneo/${torneoId}/solicitar`, data);
    return response.data;
  },

  // Admin - CRUD Circuitos
  createCircuito: async (data: CreateCircuitoPayload) => {
    const response = await api.post('/circuitos', data);
    return response.data;
  },

  updateCircuito: async (id: string, data: Partial<CreateCircuitoPayload>) => {
    const response = await api.put(`/circuitos/${id}`, data);
    return response.data;
  },

  deleteCircuito: async (id: string) => {
    const response = await api.delete(`/circuitos/${id}`);
    return response.data;
  },

  // Admin - Gestión de solicitudes
  getSolicitudesPendientes: async () => {
    const response = await api.get('/circuitos/admin/solicitudes-pendientes');
    return response.data;
  },

  procesarSolicitud: async (id: string, data: ProcesarSolicitudPayload) => {
    const response = await api.post(`/circuitos/admin/solicitud/${id}/procesar`, data);
    return response.data;
  },

  configurarTorneoCircuito: async (id: string, data: { puntosValidos?: boolean; orden?: number; esFinal?: boolean; notas?: string }) => {
    const response = await api.post(`/circuitos/admin/torneo-circuito/${id}/configurar`, data);
    return response.data;
  },

  // Admin - Clasificados
  calcularClasificados: async (id: string) => {
    const response = await api.post(`/circuitos/admin/${id}/calcular-clasificados`);
    return response.data;
  },

  confirmarClasificacion: async (circuitoId: string, jugadorId: string) => {
    const response = await api.post(`/circuitos/admin/${circuitoId}/confirmar-clasificacion/${jugadorId}`);
    return response.data;
  },

  // Upload logo
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'circuitos');
    const response = await api.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
