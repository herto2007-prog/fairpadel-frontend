import api from './api';
import type { Logro } from '@/types';

class LogrosService {
  /**
   * Get all logros (public, no auth required)
   */
  async getAll(): Promise<Logro[]> {
    const response = await api.get<Logro[]>('/logros');
    return response.data;
  }

  /**
   * Get my logros with unlock status (auth required)
   */
  async getMisLogros(): Promise<Logro[]> {
    const response = await api.get<Logro[]>('/logros/mis-logros');
    return response.data;
  }

  /**
   * Get public logros of another user
   */
  async getLogrosUsuario(userId: string): Promise<Logro[]> {
    const response = await api.get<Logro[]>(`/logros/usuario/${userId}`);
    return response.data;
  }
}

export const logrosService = new LogrosService();
export default logrosService;
