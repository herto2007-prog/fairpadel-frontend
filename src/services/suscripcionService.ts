import { api } from './api';

export interface EstadoSuscripcion {
  activa: boolean;
  venceEn: string | null;
  tipo: string | null;
  habilitado: boolean;
}

export interface PagoSuscripcion {
  id: string;
  sedeId: string;
  monto: number;
  moneda: string;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO';
  metodo: string | null;
  referencia: string | null;
  fechaPago: string | null;
  periodoDesde: string;
  periodoHasta: string;
  createdAt: string;
}

export interface IniciarPagoResponse {
  pagoId: string;
  processId: string;
  monto: number;
  montoFormateado: string;
  tipo: 'MENSUAL' | 'ANUAL';
  periodoDesde: string;
  periodoHasta: string;
}

export interface ConfigBancard {
  publicKey: string;
  baseUrl: string;
  scriptUrl: string;
}

export const suscripcionService = {
  // Verificar estado de suscripción de una sede
  getEstado: (sedeId: string): Promise<EstadoSuscripcion> =>
    api.get(`/alquileres/suscripcion/${sedeId}/estado`).then(r => r.data),

  // Iniciar proceso de pago
  iniciarPago: (sedeId: string, tipo: 'MENSUAL' | 'ANUAL' = 'MENSUAL'): Promise<IniciarPagoResponse> =>
    api.post(`/alquileres/suscripcion/${sedeId}/iniciar-pago`, { tipo }).then(r => r.data),

  // Obtener historial de pagos
  getHistorialPagos: (sedeId: string): Promise<PagoSuscripcion[]> =>
    api.get(`/alquileres/suscripcion/${sedeId}/pagos`).then(r => r.data),

  // Obtener configuración de Bancard para el frontend
  getConfigBancard: (): Promise<ConfigBancard> =>
    api.get('/alquileres/suscripcion/config/bancard').then(r => r.data),

  // Activar suscripción manualmente (solo admin/testing)
  activarManual: (sedeId: string, tipo: 'MENSUAL' | 'ANUAL' = 'MENSUAL'): Promise<any> =>
    api.post(`/alquileres/suscripcion/${sedeId}/activar-manual`, { tipo }).then(r => r.data),

  // Verificar estado de un pago específico (después de completar checkout de Bancard)
  verificarPago: (sedeId: string, pagoId: string): Promise<{ status: string; pago: PagoSuscripcion }> =>
    api.get(`/alquileres/suscripcion/${sedeId}/verificar-pago/${pagoId}`).then(r => r.data),

  // Verificar estado del pago directamente en Bancard (cuando el webhook no llegó)
  verificarEnBancard: (shopProcessId: string): Promise<{ status: string; mensaje: string; pago?: PagoSuscripcion }> =>
    api.post('/alquileres/suscripcion/verificar-en-bancard', { shopProcessId }).then(r => r.data),

  // Simular pago exitoso (SOLO PARA TESTING)
  simularPago: (pagoId: string): Promise<{ status: string; mensaje: string; pago: PagoSuscripcion }> =>
    api.post(`/alquileres/suscripcion/simular-pago/${pagoId}`).then(r => r.data),

  // Test webhook de Bancard (SOLO PARA TESTING)
  testWebhook: (shopProcessId: string, response?: 'S' | 'N'): Promise<any> =>
    api.post('/alquileres/suscripcion/test/webhook', { 
      shopProcessId, 
      response: response || 'S',
      amount: '60000.00',
      currency: 'PYG'
    }).then(r => r.data),
};
