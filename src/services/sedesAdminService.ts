import { api } from './api';

export interface SedeConDueno {
  id: string;
  nombre: string;
  ciudad: string;
  activa: boolean;
  dueno?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  encargado?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  alquilerConfig?: {
    suscripcionActiva: boolean;
    suscripcionVenceEn: string;
  };
}

export const sedesAdminService = {
  // Obtener todas las sedes con dueños
  getSedesConDuenos: (): Promise<SedeConDueno[]> =>
    api.get('/admin/sedes').then(r => r.data),

  // Asignar dueño a una sede
  asignarDueno: (sedeId: string, userId: string): Promise<SedeConDueno> =>
    api.post(`/admin/sedes/${sedeId}/asignar-dueno`, { userId }).then(r => r.data),

  // Asignar encargado a una sede
  asignarEncargado: (sedeId: string, userId: string): Promise<SedeConDueno> =>
    api.post(`/admin/sedes/${sedeId}/asignar-encargado`, { userId }).then(r => r.data),

  // Obtener sedes donde el usuario es dueño
  getMisSedesComoDueno: (): Promise<SedeConDueno[]> =>
    api.get('/sedes/mis-sedes/dueno').then(r => r.data),
};
