import { api } from './api';

export type TipoAlerta =
  | 'TORNEO_EN_MI_CIUDAD'
  | 'TORNEO_MI_CATEGORIA'
  | 'RIVAL_INSCRITO'
  | 'RANKING_CAMBIO';

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  activa: boolean;
  config?: { ciudad?: string } | null;
  createdAt: string;
}

export const alertaService = {
  /** Crea o actualiza una alerta del usuario logueado. */
  crear: (tipo: TipoAlerta, ciudad?: string) =>
    api.post('/alertas', { tipo, ciudad }).then((r) => r.data as Alerta),

  /** Lista las alertas del usuario logueado. */
  listar: () => api.get('/alertas').then((r) => r.data as Alerta[]),

  /** Elimina una alerta por id. */
  eliminar: (id: string) => api.delete(`/alertas/${id}`).then((r) => r.data),
};
