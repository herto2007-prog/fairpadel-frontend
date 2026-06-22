import { api } from './api';

export interface SolicitudSede {
  id: string;
  nombreContacto: string;
  email: string;
  telefono: string;
  nombreSede: string;
  ciudad: string;
  mensaje?: string | null;
  estado: 'NUEVO' | 'CONTACTADO' | 'CONVERTIDO' | 'RECHAZADO';
  notaAdmin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrearSolicitudSedeData {
  nombreContacto: string;
  email: string;
  telefono: string;
  nombreSede: string;
  ciudad: string;
  mensaje?: string;
}

export const solicitudesSedeService = {
  // Público: enviar solicitud para sumar una sede
  crear: (data: CrearSolicitudSedeData) =>
    api.post('/solicitudes-sede', data).then((r) => r.data),

  // Admin: bandeja
  listar: (estado?: string): Promise<{ solicitudes: SolicitudSede[]; nuevas: number; total: number }> =>
    api.get('/admin/solicitudes-sede', { params: estado ? { estado } : {} }).then((r) => r.data),

  actualizar: (id: string, data: { estado?: string; notaAdmin?: string }): Promise<SolicitudSede> =>
    api.patch(`/admin/solicitudes-sede/${id}`, data).then((r) => r.data),
};
