import api from './api';
import type { SolicitudInstructor, Instructor } from '@/types';

export const instructoresService = {
  // ── Solicitud ──────────────────────────────────────────

  solicitarSerInstructor: async (dto: {
    experienciaAnios: number;
    certificaciones?: string;
    especialidades?: string;
    nivelesEnsenanza?: string;
    descripcion?: string;
    precioIndividual?: number;
    precioGrupal?: number;
    ciudades?: string;
  }): Promise<{ message: string; solicitud: SolicitudInstructor }> => {
    const response = await api.post('/instructores/solicitar', dto);
    return response.data;
  },

  obtenerMiSolicitud: async (): Promise<SolicitudInstructor | null> => {
    const response = await api.get('/instructores/mi-solicitud');
    return response.data;
  },

  // ── Perfil (instructor logueado) ──────────────────────

  obtenerMiPerfil: async (): Promise<Instructor> => {
    const response = await api.get('/instructores/mi-perfil');
    return response.data;
  },

  actualizarPerfil: async (dto: {
    experienciaAnios?: number;
    certificaciones?: string;
    especialidades?: string;
    nivelesEnsenanza?: string;
    descripcion?: string;
    precioIndividual?: number;
    precioGrupal?: number;
    aceptaDomicilio?: boolean;
  }): Promise<Instructor> => {
    const response = await api.put('/instructores/mi-perfil', dto);
    return response.data;
  },

  actualizarUbicaciones: async (ubicaciones: Array<{
    sedeId?: string;
    nombreCustom?: string;
    ciudad: string;
    esPrincipal?: boolean;
  }>): Promise<{ message: string }> => {
    const response = await api.put('/instructores/ubicaciones', { ubicaciones });
    return response.data;
  },

  // ── Público ────────────────────────────────────────────

  buscarInstructores: async (params?: {
    ciudad?: string;
    especialidad?: string;
    page?: number;
    limit?: number;
  }): Promise<{ instructores: Instructor[]; total: number; page: number; limit: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.ciudad) searchParams.append('ciudad', params.ciudad);
    if (params?.especialidad) searchParams.append('especialidad', params.especialidad);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    const response = await api.get(`/instructores${query ? `?${query}` : ''}`);
    return response.data;
  },

  obtenerInstructor: async (id: string): Promise<Instructor> => {
    const response = await api.get(`/instructores/${id}`);
    return response.data;
  },
};
