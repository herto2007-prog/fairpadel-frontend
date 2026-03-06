import { api } from './api';

export interface Inscripcion {
  id: string;
  tournamentId: string;
  categoryId: string;
  jugador1Id: string;
  jugador2Id: string | null;
  jugador2Documento: string | null;
  jugador2Email: string | null;
  estado: 'PENDIENTE_CONFIRMACION' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA';
  modoPago: 'COMPLETO' | 'INDIVIDUAL' | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  tournament: {
    id: string;
    nombre: string;
    slug: string;
    estado: string;
    fechaInicio: string;
    fechaFin: string;
    organizador: {
      id: string;
      nombre: string;
      apellido: string;
    };
  };
  category: {
    id: string;
    nombre: string;
    tipo: string;
  };
  jugador1: {
    id: string;
    nombre: string;
    apellido: string;
    documento: string;
  };
  jugador2: {
    id: string;
    nombre: string;
    apellido: string;
    documento: string;
  } | null;
}

export interface CreateInscripcionData {
  tournamentId: string;
  categoryId: string;
  jugador2Id?: string;
  jugador2Documento?: string;
  jugador2Email?: string;
  modoPago?: 'COMPLETO' | 'INDIVIDUAL';
}

export interface UpdateInscripcionData {
  estado?: 'PENDIENTE_CONFIRMACION' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA';
  notas?: string;
}

export const inscripcionService = {
  getAll: async (): Promise<Inscripcion[]> => {
    const response = await api.get('/inscripciones');
    return response.data;
  },

  getMyInscripciones: async (): Promise<Inscripcion[]> => {
    const response = await api.get('/inscripciones/my');
    return response.data;
  },

  getByTournament: async (tournamentId: string): Promise<Inscripcion[]> => {
    const response = await api.get(`/inscripciones/tournament/${tournamentId}`);
    return response.data;
  },

  getById: async (id: string): Promise<Inscripcion> => {
    const response = await api.get(`/inscripciones/${id}`);
    return response.data;
  },

  create: async (data: CreateInscripcionData): Promise<Inscripcion> => {
    const response = await api.post('/inscripciones', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInscripcionData): Promise<Inscripcion> => {
    const response = await api.patch(`/inscripciones/${id}`, data);
    return response.data;
  },

  confirmar: async (id: string, estado: 'CONFIRMADA' | 'RECHAZADA', motivo?: string): Promise<Inscripcion> => {
    const response = await api.patch(`/inscripciones/${id}/confirmar`, { estado, motivo });
    return response.data;
  },

  cancelar: async (id: string, motivo?: string): Promise<Inscripcion> => {
    const response = await api.patch(`/inscripciones/${id}/cancelar`, { motivo });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/inscripciones/${id}`);
  },
};
