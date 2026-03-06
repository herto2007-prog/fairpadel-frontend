import { api } from './api';

export interface Tournament {
  id: string;
  nombre: string;
  descripcion: string | null;
  slug: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioInscripcion: string | null;
  fechaFinInscripcion: string | null;
  maxParejas: number | null;
  minParejas: number | null;
  puntosRanking: number | null;
  premio: string | null;
  flyerUrl: string | null;
  estado: string;
  organizador: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  categories: {
    id: string;
    inscripcionAbierta: boolean;
    estado: string;
    category: {
      id: string;
      nombre: string;
      tipo: string;
      orden: number;
    };
  }[];
  inscripciones?: {
    id: string;
    estado: string;
    jugador1: {
      id: string;
      nombre: string;
      apellido: string;
    };
    jugador2: {
      id: string;
      nombre: string;
      apellido: string;
    } | null;
  }[];
  _count?: {
    inscripciones: number;
  };
  createdAt: string;
}

export interface Category {
  id: string;
  nombre: string;
  tipo: string;
  orden: number;
}

export interface CreateTournamentData {
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioInscripcion?: string;
  fechaFinInscripcion?: string;
  maxParejas?: number;
  minParejas?: number;
  puntosRanking?: number;
  premio?: string;
  flyerUrl?: string;
  categoryIds?: string[];
}

export const tournamentService = {
  async getAll(): Promise<Tournament[]> {
    const response = await api.get('/tournaments');
    return response.data;
  },

  async getById(id: string): Promise<Tournament> {
    const response = await api.get(`/tournaments/${id}`);
    return response.data;
  },

  async getBySlug(slug: string): Promise<Tournament> {
    const response = await api.get(`/tournaments/by-slug/${slug}`);
    return response.data;
  },

  async getMyTournaments(): Promise<Tournament[]> {
    const response = await api.get('/tournaments/my-tournaments');
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    const response = await api.get('/tournaments/categories');
    return response.data;
  },

  async create(data: CreateTournamentData): Promise<Tournament> {
    const response = await api.post('/tournaments', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateTournamentData>): Promise<Tournament> {
    const response = await api.patch(`/tournaments/${id}`, data);
    return response.data;
  },

  async publish(id: string): Promise<Tournament> {
    const response = await api.patch(`/tournaments/${id}/publish`);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/tournaments/${id}`);
    return response.data;
  },
};
