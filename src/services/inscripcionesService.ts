import api from './api';
import type { Inscripcion, MetodoPago } from '@/types';

export interface CreateInscripcionDto {
  tournamentId: string;
  categoryId: string;
  modalidad: 'TRADICIONAL' | 'MIXTO' | 'SUMA';
  jugador2Documento: string;
  metodoPago: 'BANCARD' | 'TRANSFERENCIA' | 'EFECTIVO';
}

export interface PaymentResponse {
  success: boolean;
  redirectUrl?: string;
  checkoutUrl?: string;
  message?: string;
}

class InscripcionesService {
  // Mis inscripciones
  async getMyInscripciones(): Promise<Inscripcion[]> {
    const response = await api.get<Inscripcion[]>('/inscripciones/mis-inscripciones');
    return response.data;
  }

  // Inscripciones de un torneo
  async getByTournament(tournamentId: string, estado?: string): Promise<Inscripcion[]> {
    const params = estado ? `?estado=${estado}` : '';
    const response = await api.get<Inscripcion[]>(`/inscripciones/torneo/${tournamentId}${params}`);
    return response.data;
  }

  // Obtener inscripción por ID
  async getById(id: string): Promise<Inscripcion> {
    const response = await api.get<Inscripcion>(`/inscripciones/${id}`);
    return response.data;
  }

  // Crear inscripción
  async create(data: CreateInscripcionDto): Promise<Inscripcion> {
    const response = await api.post<Inscripcion>('/inscripciones', data);
    return response.data;
  }

  // Cancelar inscripción
  async cancel(id: string): Promise<Inscripcion> {
    const response = await api.put<Inscripcion>(`/inscripciones/${id}/cancelar`);
    return response.data;
  }

  // Subir comprobante de pago
  async uploadComprobante(inscripcionId: string, comprobanteUrl: string): Promise<Inscripcion> {
    const response = await api.post<Inscripcion>(`/inscripciones/${inscripcionId}/comprobante`, {
      comprobanteUrl,
    });
    return response.data;
  }

  // Iniciar proceso de pago (para Bancard o registrar método seleccionado)
  async initPayment(inscripcionId: string, metodoPago: MetodoPago): Promise<PaymentResponse> {
    const response = await api.post<PaymentResponse>(`/inscripciones/${inscripcionId}/pago`, {
      metodoPago,
    });
    return response.data;
  }
}

export const inscripcionesService = new InscripcionesService();
export default inscripcionesService;