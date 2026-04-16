import { api } from '../../services/api';

// ═══════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════

export interface Circuito {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  ciudad: string;
  region?: string;
  temporada: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'FINALIZADO';
  logoUrl?: string;
  bannerUrl?: string;
  colorPrimario?: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaLimiteInscripcion?: string;
  tipoAcumulacion?: string;
  torneosMinimosContar?: number;
  torneosParaClasificar: number;
  multiplicadorGlobal?: number;
  tieneFinal: boolean;
  torneoFinalId?: string;
  orden?: number;
  destacado?: boolean;
  _count?: {
    torneos: number;
    clasificados: number;
  };
}

export interface TorneoCircuito {
  id: string;
  orden: number;
  estado: string;
  puntosValidos: boolean;
  esFinal: boolean;
  multiplicador?: number;
  notas?: string;
  torneo: {
    id: string;
    nombre: string;
    slug: string;
    fechaInicio: string;
    fechaFin?: string;
    ciudad: string;
    estado: string;
    flyerUrl?: string;
  };
}

export interface Solicitud {
  id: string;
  orden: number;
  estado: string;
  puntosValidos: boolean;
  torneo: {
    id: string;
    nombre: string;
    fechaInicio: string;
    ciudad: string;
    organizador: {
      id: string;
      nombre: string;
      apellido: string;
    };
  };
  circuito: {
    id: string;
    nombre: string;
  };
}

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
  fechaInicio?: string;
  fechaFin?: string;
  tipoAcumulacion?: string;
  torneosMinimosContar?: number;
  torneosParaClasificar?: number;
  multiplicadorGlobal?: number;
  tieneFinal?: boolean;
  estado?: string;
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

export interface AsignarTorneoDirectoPayload {
  circuitoId: string;
  torneoId: string;
  orden?: number;
  puntosValidos?: boolean;
  notas?: string;
}

// ═══════════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════════

export const circuitosService = {
  // ═══════════════════════════════════════════════════════════
  // PÚBLICOS
  // ═══════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════
  // ORGANIZADOR - Solicitar inclusión
  // ═══════════════════════════════════════════════════════════

  solicitarInclusion: async (torneoId: string, data: SolicitarInclusionPayload) => {
    const response = await api.post(`/circuitos/torneo/${torneoId}/solicitar`, data);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════
  // ADMIN - CRUD Circuitos
  // ═══════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════
  // ADMIN - Gestión de Solicitudes (Legacy)
  // ═══════════════════════════════════════════════════════════

  getSolicitudesPendientes: async () => {
    const response = await api.get('/circuitos/admin/solicitudes-pendientes');
    return response.data;
  },

  procesarSolicitud: async (id: string, data: ProcesarSolicitudPayload) => {
    const response = await api.post(`/circuitos/admin/solicitud/${id}/procesar`, data);
    return response.data;
  },

  configurarTorneoCircuito: async (id: string, data: { puntosValidos?: boolean; orden?: number; esFinal?: boolean; multiplicador?: number; notas?: string }) => {
    const response = await api.post(`/circuitos/admin/torneo-circuito/${id}/configurar`, data);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════
  // ADMIN - Gestión Directa de Torneos (NUEVO)
  // ═══════════════════════════════════════════════════════════

  getTorneosDeCircuito: async (circuitoId: string) => {
    const response = await api.get(`/circuitos/${circuitoId}/torneos`);
    return response.data;
  },

  getTorneosDisponibles: async (circuitoId: string) => {
    const response = await api.get(`/circuitos/admin/torneos-disponibles?circuitoId=${circuitoId}`);
    return response.data;
  },

  asignarTorneoDirecto: async (data: AsignarTorneoDirectoPayload) => {
    const response = await api.post('/circuitos/admin/asignar-torneo', data);
    return response.data;
  },

  eliminarTorneoDeCircuito: async (circuitoId: string, torneoId: string) => {
    const response = await api.delete(`/circuitos/admin/${circuitoId}/torneo/${torneoId}`);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════
  // ADMIN - Clasificados (por categoría)
  // ═══════════════════════════════════════════════════════════

  calcularClasificados: async (id: string, categoryId: string) => {
    const response = await api.post(`/circuitos/admin/${id}/calcular-clasificados`, { categoryId });
    return response.data;
  },

  marcarAsistencia: async (clasificadoId: string, asistencia: boolean) => {
    const response = await api.post(`/circuitos/admin/clasificado/${clasificadoId}/asistencia`, { asistencia });
    return response.data;
  },

  getClasificados: async (circuitoId: string, categoryId?: string) => {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    const response = await api.get(`/circuitos/${circuitoId}/clasificados${params}`);
    return response.data;
  },

  asignarTorneoFinal: async (circuitoId: string, torneoId: string) => {
    const response = await api.post(`/circuitos/admin/${circuitoId}/asignar-final`, { torneoId });
    return response.data;
  },

  quitarTorneoFinal: async (circuitoId: string) => {
    const response = await api.delete(`/circuitos/admin/${circuitoId}/quitar-final`);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORÍAS
  // ═══════════════════════════════════════════════════════════

  getCategorias: async () => {
    const response = await api.get('/tournaments/categories');
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════

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
