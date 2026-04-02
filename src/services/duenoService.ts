import { api } from './api';

export interface SedeDelDueno {
  id: string;
  nombre: string;
  ciudad: string;
  activa: boolean;
  alquilerConfig?: {
    suscripcionActiva: boolean;
    suscripcionVenceEn: string;
  };
  _count?: {
    canchas: number;
  };
}

export const duenoService = {
  // Obtener mis sedes como dueño
  getMisSedes: (): Promise<SedeDelDueno[]> =>
    api.get('/dueno/mis-sedes').then(r => r.data),
};
