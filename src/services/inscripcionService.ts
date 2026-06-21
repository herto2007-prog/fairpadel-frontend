import { api } from './api';

export interface Inscripcion {
  id: string;
  tournamentId: string;
  categoryId: string;
  jugador1Id: string;
  jugador2Id?: string;
  estado: 'PENDIENTE_PAGO' | 'PENDIENTE_CONFIRMACION' | 'CONFIRMADA' | 'CANCELADA';
  modalidad: string;
  tournament?: { nombre: string; fechaInicio: string; ciudad: string };
  category?: { nombre: string };
  jugador1?: { nombre: string; apellido: string };
  jugador2?: { nombre: string; apellido: string };
  /** Calculado por el back: ¿puede ESTE jugador auto-cancelar? (solo jugador 1, antes del sorteo) */
  puedeCancelar?: boolean;
}

export const inscripcionService = {
  getAll: () => api.get('/inscripciones').then(r => r.data),
  getById: (id: string) => api.get(`/inscripciones/${id}`).then(r => r.data),
  getByTournament: (tournamentId: string) => api.get(`/inscripciones/tournament/${tournamentId}`).then(r => r.data),
  getMyInscripciones: () => api.get('/inscripciones/my').then(r => r.data),
  create: (data: any) => api.post('/inscripciones', data).then(r => r.data),
  confirmar: (id: string) => api.post(`/inscripciones/${id}/confirmar`).then(r => r.data),
  cancelar: (id: string) => api.patch(`/inscripciones/${id}/cancelar`).then(r => r.data),

  // Descarga el Excel de inscripciones del torneo (Fase 7 - reportes).
  // El backend devuelve el archivo; acá disparamos la descarga en el navegador.
  descargarInscripcionesExcel: async (tournamentId: string) => {
    const res = await api.get(`/reportes/torneos/${tournamentId}/inscripciones`, {
      responseType: 'blob',
    });
    const cd = (res.headers['content-disposition'] as string) || '';
    const match = cd.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'inscripciones.xlsx';
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
