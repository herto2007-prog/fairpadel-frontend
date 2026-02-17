import api from './api';
import type { AlertaPersonalizada, TipoAlertaPersonalizada } from '@/types';

class AlertasService {
  async getMisAlertas(): Promise<AlertaPersonalizada[]> {
    const response = await api.get<AlertaPersonalizada[]>('/alertas');
    return response.data;
  }

  async crearAlerta(data: { tipo: TipoAlertaPersonalizada; activa?: boolean }): Promise<AlertaPersonalizada> {
    const response = await api.post<AlertaPersonalizada>('/alertas', data);
    return response.data;
  }

  async actualizarAlerta(id: string, data: { activa?: boolean }): Promise<AlertaPersonalizada> {
    const response = await api.put<AlertaPersonalizada>(`/alertas/${id}`, data);
    return response.data;
  }

  async eliminarAlerta(id: string): Promise<void> {
    await api.delete(`/alertas/${id}`);
  }
}

export const alertasService = new AlertasService();
export default alertasService;
