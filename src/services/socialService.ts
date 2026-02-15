import api from './api';
import type {
  SeguirResponse,
  MensajeDto,
  MensajePrivado,
  Conversacion,
  SolicitudJugarDto,
  SolicitudJugar,
  ReporteDto,
  UserBrief,
} from '@/types';

export interface JugadorBusqueda {
  id: string;
  nombre: string;
  apellido: string;
  genero: string;
  ciudad: string | null;
  fotoUrl: string | null;
  esPremium: boolean;
  categoriaActual: { id: string; nombre: string; orden: number } | null;
}

class SocialService {
  // ============ SEGUIMIENTOS ============

  async seguir(userId: string): Promise<SeguirResponse> {
    const response = await api.post<SeguirResponse>(`/social/seguir/${userId}`);
    return response.data;
  }

  async dejarDeSeguir(userId: string): Promise<SeguirResponse> {
    const response = await api.delete<SeguirResponse>(`/social/seguir/${userId}`);
    return response.data;
  }

  async getSeguidores(userId: string): Promise<UserBrief[]> {
    const response = await api.get(`/social/seguidores/${userId}`);
    return response.data;
  }

  async getSiguiendo(userId: string): Promise<UserBrief[]> {
    const response = await api.get(`/social/siguiendo/${userId}`);
    return response.data;
  }

  async getSugerencias(): Promise<UserBrief[]> {
    const response = await api.get('/social/sugerencias');
    return response.data;
  }

  // ============ MENSAJERÍA ============

  async enviarMensaje(dto: MensajeDto): Promise<MensajePrivado> {
    const response = await api.post<MensajePrivado>('/social/mensajes', dto);
    return response.data;
  }

  async getConversaciones(): Promise<Conversacion[]> {
    const response = await api.get<Conversacion[]>('/social/mensajes/conversaciones');
    return response.data;
  }

  async getMensajes(otroUserId: string): Promise<MensajePrivado[]> {
    const response = await api.get<MensajePrivado[]>(`/social/mensajes/conversacion/${otroUserId}`);
    return response.data;
  }

  async marcarComoLeido(mensajeId: string): Promise<void> {
    await api.post(`/social/mensajes/${mensajeId}/leer`);
  }

  // ============ SOLICITUDES JUGAR ============

  async enviarSolicitudJugar(dto: SolicitudJugarDto): Promise<SolicitudJugar> {
    const response = await api.post<SolicitudJugar>('/social/solicitudes-jugar', dto);
    return response.data;
  }

  async getSolicitudesRecibidas(): Promise<SolicitudJugar[]> {
    const response = await api.get<SolicitudJugar[]>('/social/solicitudes-jugar/recibidas');
    return response.data;
  }

  async getSolicitudesEnviadas(): Promise<SolicitudJugar[]> {
    const response = await api.get<SolicitudJugar[]>('/social/solicitudes-jugar/enviadas');
    return response.data;
  }

  async aceptarSolicitud(solicitudId: string): Promise<SolicitudJugar> {
    const response = await api.post<SolicitudJugar>(`/social/solicitudes-jugar/${solicitudId}/aceptar`);
    return response.data;
  }

  async rechazarSolicitud(solicitudId: string): Promise<SolicitudJugar> {
    const response = await api.post<SolicitudJugar>(`/social/solicitudes-jugar/${solicitudId}/rechazar`);
    return response.data;
  }

  // ============ BLOQUEOS ============

  async bloquear(userId: string): Promise<{ message: string }> {
    const response = await api.post(`/social/bloquear/${userId}`);
    return response.data;
  }

  async desbloquear(userId: string): Promise<{ message: string }> {
    const response = await api.delete(`/social/bloquear/${userId}`);
    return response.data;
  }

  async getBloqueados(): Promise<UserBrief[]> {
    const response = await api.get('/social/bloqueados');
    return response.data;
  }

  // ============ REPORTES ============

  async reportar(userId: string, data: ReporteDto): Promise<{ message: string }> {
    const response = await api.post(`/social/reportar/${userId}`, data);
    return response.data;
  }

  // ============ BÚSQUEDA ============

  async buscarJugadores(
    query?: string,
    ciudad?: string,
    genero?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    jugadores: JugadorBusqueda[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (ciudad) params.append('ciudad', ciudad);
    if (genero) params.append('genero', genero);
    params.append('page', String(page));
    params.append('limit', String(limit));
    const response = await api.get(`/social/buscar-jugadores?${params.toString()}`);
    return response.data;
  }

  async obtenerCiudades(): Promise<string[]> {
    const response = await api.get('/social/ciudades');
    return response.data;
  }
}

export const socialService = new SocialService();
export default socialService;
