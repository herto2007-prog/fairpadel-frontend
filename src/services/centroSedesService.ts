import { api } from './api';

export interface CentroSedeCancha {
  id: string;
  nombre: string;
  tipo: string;
  tieneLuz: boolean;
  cubierta: boolean;
  notas?: string | null;
  activa: boolean;
}

export interface CentroSedePersona {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

export interface CentroSedeServicio {
  habilitado: boolean;
  suscripcionActiva: boolean;
  suscripcionVenceEn: string | null;
  tipoSuscripcion: string | null;
  diasRestantes: number;
}

export interface CentroSede {
  id: string;
  nombre: string;
  ciudad: string;
  direccion?: string | null;
  telefono?: string | null;
  mapsUrl?: string | null;
  logoUrl?: string | null;
  activa: boolean;
  canchas: CentroSedeCancha[];
  dueno: CentroSedePersona | null;
  encargado: CentroSedePersona | null;
  servicio: CentroSedeServicio | null;
}

export interface PagoServicio {
  id: string;
  fechaPago: string | null;
  periodoDesde: string;
  periodoHasta: string;
  monto: number;
  moneda: string;
  metodo: string | null;
  estado: string;
  createdAt: string;
}

export const centroSedesService = {
  // Lista unificada: cada sede con todo (datos, canchas, responsables, servicio)
  getSedes: (): Promise<CentroSede[]> =>
    api.get('/admin/centro-sedes').then((r) => r.data),

  // Historial de pagos del servicio de reservas de una sede
  getPagos: (sedeId: string): Promise<PagoServicio[]> =>
    api.get(`/admin/centro-sedes/${sedeId}/pagos`).then((r) => r.data),

  // Activar / regalar el servicio (crea un pago MANUAL y deja la suscripción vigente)
  activarServicio: (sedeId: string, tipo: 'MENSUAL' | 'ANUAL' = 'MENSUAL') =>
    api
      .post('/admin/suscripciones/activar-manual', {
        sedeId,
        tipo,
        nota: 'Activación manual desde Centro de Sedes',
      })
      .then((r) => r.data),

  // Desactivar el servicio
  desactivarServicio: (sedeId: string) =>
    api.post('/admin/suscripciones/desactivar', { sedeId }).then((r) => r.data),
};
