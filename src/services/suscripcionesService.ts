import api from './api';

export interface PlanPremium {
  id: string;
  nombre: string;
  precioMensual: number;
  caracteristicas: string; // JSON string
  activo: boolean;
}

export interface Suscripcion {
  id: string;
  userId: string;
  planId: string;
  periodo: 'MENSUAL';
  precio: number;
  estado: 'ACTIVA' | 'VENCIDA' | 'CANCELADA' | 'PENDIENTE_PAGO';
  fechaInicio: string;
  fechaFin: string;
  fechaRenovacion: string | null;
  autoRenovar: boolean;
  cuponAplicado: string | null;
  plan?: PlanPremium;
}

export const suscripcionesService = {
  obtenerPlanes: async (): Promise<PlanPremium[]> => {
    const { data } = await api.get('/suscripciones/planes');
    return data;
  },

  crearSuscripcion: async (planId: string, cuponCodigo?: string) => {
    const { data } = await api.post('/suscripciones/crear', { planId, cuponCodigo });
    return data as { suscripcion: Suscripcion; checkoutUrl: string | null; transactionId: string };
  },

  obtenerMiSuscripcion: async (): Promise<Suscripcion | null> => {
    const { data } = await api.get('/suscripciones/mi-suscripcion');
    return data;
  },

  obtenerHistorial: async (): Promise<Suscripcion[]> => {
    const { data } = await api.get('/suscripciones/historial');
    return data;
  },

  cancelarSuscripcion: async () => {
    const { data } = await api.put('/suscripciones/cancelar');
    return data as { message: string; fechaFin: string };
  },

  reactivarSuscripcion: async () => {
    const { data } = await api.put('/suscripciones/reactivar');
    return data as { message: string };
  },

  validarCupon: async (codigo: string) => {
    const { data } = await api.post('/suscripciones/validar-cupon', { codigo });
    return data as { valido: boolean; mensaje: string; cupon?: any };
  },
};
