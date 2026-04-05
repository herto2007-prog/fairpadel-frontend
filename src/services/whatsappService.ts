import { api } from './api';

export interface WhatsAppStatusResponse {
  enabled: boolean;
}

export interface ConsentStatusResponse {
  canSend: boolean;
  phone?: string;
  consentStatus?: string;
  preference?: string;
  reason?: string;
}

export interface SendNotificationRequest {
  userId: string;
  template: string;
  variables?: Record<string, string>;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
}

export interface RequestConsentRequest {
  userId: string;
}

export const whatsappService = {
  /**
   * Verifica si WhatsApp está habilitado en el sistema
   */
  getStatus: async (): Promise<WhatsAppStatusResponse> => {
    const response = await api.get('/whatsapp/status');
    return response.data as WhatsAppStatusResponse;
  },

  /**
   * Verifica el estado de consentimiento de WhatsApp de un usuario
   */
  getConsentStatus: async (userId: string): Promise<ConsentStatusResponse> => {
    const response = await api.get(`/whatsapp/consent-status/${userId}`);
    return response.data as ConsentStatusResponse;
  },

  /**
   * Solicita consentimiento de WhatsApp a un usuario
   * Envia el mensaje "Responde SI para confirmar"
   */
  requestConsent: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/whatsapp/request-consent', { userId });
    return response.data as { success: boolean; message: string };
  },

  /**
   * Envía una notificación por WhatsApp a un usuario
   * Solo para uso admin/organizador
   */
  sendNotification: async (data: SendNotificationRequest): Promise<SendNotificationResponse> => {
    const response = await api.post('/whatsapp/send-notification', data);
    return response.data as SendNotificationResponse;
  },
};
