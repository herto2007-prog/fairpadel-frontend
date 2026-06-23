import { api } from './api';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  documento: string;
  estado: string;
  genero?: 'MASCULINO' | 'FEMENINO';
  ciudad?: string;
  fechaNacimiento?: string;
  roles: string[];
  fotoUrl?: string;
  categoriaActual?: {
    id: string;
    nombre: string;
  };
  consentWhatsappStatus?: string | null;
}

export interface UpdateUserAdminData {
  nombre?: string;
  apellido?: string;
  email?: string;
  documento?: string;
  categoriaActualId?: string;
  telefono?: string;
  ciudad?: string;
  fechaNacimiento?: string;
  genero?: 'MASCULINO' | 'FEMENINO';
  estado?: string;
  motivoCambioCategoria?: string;
}

export interface InscripcionActiva {
  id: string;
  estado: string;
  tournament: { id: string; nombre: string; estado: string; fechaInicio: string };
  category: { id: string; nombre: string };
  jugador1: { id: string; nombre: string; apellido: string };
  jugador2?: { id: string; nombre: string; apellido: string };
}

export interface RankingItem {
  id: string;
  tipoRanking: string;
  alcance: string;
  genero: string;
  puntosTotales: number;
  posicion: number;
  torneosJugados: number;
  victorias: number;
  derrotas: number;
  porcentajeVictorias: string | null;
  rachaActual: number;
  mejorPosicion: number | null;
  campeonatos: number;
  temporada: string;
}

export interface PuntosItem {
  id: string;
  posicionFinal: string;
  puntosGanados: number;
  fechaTorneo: string;
  tournament: { nombre: string };
  category: { nombre: string };
}

export interface FichaJugador {
  inscripciones: InscripcionActiva[];
  rankings: RankingItem[];
  historialPuntos: PuntosItem[];
}

export interface HistorialCategoriaItem {
  id: string;
  userId: string;
  categoriaAnteriorId: string | null;
  categoriaNuevaId: string;
  tipo: string;
  motivo: string;
  realizadoPor: string | null;
  createdAt: string;
  categoriaAnterior: { id: string; nombre: string } | null;
  categoriaNueva: { id: string; nombre: string };
}

export interface UpdateRolesData {
  userId: string;
  roles: string[];
}

export interface UsuarioDuplicado {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  documento: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  fotoUrl?: string | null;
  estado: string;
}

export interface GrupoDuplicado {
  motivo: string;
  clave: string;
  usuarios: UsuarioDuplicado[];
}

export interface MovimientoCategoria {
  id: string;
  userId: string;
  tipo: string;
  motivo: string;
  createdAt: string;
  jugador: { id: string; nombre: string; apellido: string; fotoUrl?: string } | null;
  categoriaAnterior: { id: string; nombre: string } | null;
  categoriaNueva: { id: string; nombre: string } | null;
}

export interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
  direccion?: string;
  mapsUrl?: string;
  telefono?: string;
  activa: boolean;
  canchas: {
    id: string;
    nombre: string;
    tipo: string;
    tieneLuz: boolean;
    activa: boolean;
  }[];
  _count?: {
    canchas: number;
    torneosPrincipal: number;
  };
}

export interface CreateSedeData {
  nombre: string;
  ciudad: string;
  direccion?: string;
  mapsUrl?: string;
  telefono?: string;
}

export interface UpdateSedeData extends Partial<CreateSedeData> {
  activa?: boolean;
}

// CANCHAS
export interface Cancha {
  id: string;
  nombre: string;
  tipo: string;
  tieneLuz: boolean;
  cubierta?: boolean;
  activa: boolean;
  sedeId: string;
  notas?: string;
}

export interface CreateCanchaData {
  nombre: string;
  tipo?: string; // Siempre SINTETICO en 2026
  tieneLuz?: boolean;
  cubierta?: boolean; // Techada
  notas?: string; // Opcional: gradas, acceso, etc.
}

export interface UpdateCanchaData {
  nombre?: string;
  tipo?: string;
  tieneLuz?: boolean;
  cubierta?: boolean;
  activa?: boolean;
  notas?: string;
}

// MODALIDADES
export interface Modalidad {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
  reglas: {
    variante: 'PY' | 'MUNDIAL';
    tipoEmparejamiento: string;
    generoRequerido: string;
    sistemaPuntos: string;
    formatoBracket: string;
    setsPorPartido: number;
    puntosPorVictoria: number;
    puntosPorDerrota: number;
    requierePareja: boolean;
    permiteIndividual: boolean;
    minimoPartidosGarantizados: number;
    descripcionLarga: string;
  };
  _count?: {
    torneos: number;
  };
}

export interface CreateModalidadData {
  nombre: string;
  descripcion: string;
  reglas?: any;
}

export interface UpdateModalidadData {
  nombre?: string;
  descripcion?: string;
  activa?: boolean;
  reglas?: any;
}

export const adminService = {
  // USUARIOS
  getUsers: () => api.get('/admin/users').then(r => r.data),
  updateUserRoles: (data: UpdateRolesData) => 
    api.post('/admin/users/update-roles', data).then(r => r.data),
  getStats: () => api.get('/admin/stats').then(r => r.data),
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }).then(r => r.data),
  requestPasswordReset: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),
  confirmarConsentimientoWhatsapp: (userId: string) =>
    api.post(`/admin/users/${userId}/whatsapp/confirmar-consentimiento`).then(r => r.data),
  updateUser: (userId: string, data: UpdateUserAdminData) =>
    api.put(`/admin/users/${userId}`, data).then(r => r.data),
  setUserPassword: (userId: string, password: string) =>
    api.post(`/admin/users/${userId}/set-password`, { password }).then(r => r.data),
  getUserFicha: (userId: string): Promise<{ success: boolean; data: FichaJugador }> =>
    api.get(`/admin/users/${userId}/ficha`).then(r => r.data),
  getUserInscripcionesActivas: (userId: string) =>
    api.get(`/admin/users/${userId}/inscripciones-activas`).then(r => r.data),
  getUserHistorialCategorias: (userId: string) =>
    api.get(`/admin/users/${userId}/historial-categorias`).then(r => r.data),
  getHistorialCategoriasRecientes: (limit = 20) =>
    api.get(`/admin/historial-categorias?limit=${limit}`).then(r => r.data),
  getPosiblesDuplicados: () =>
    api.get('/admin/posibles-duplicados').then(r => r.data),

  // SEDES
  getSedes: () => api.get('/admin/sedes').then(r => r.data),
  getSede: (id: string) => api.get(`/admin/sedes/${id}`).then(r => r.data),
  createSede: (data: CreateSedeData) => api.post('/admin/sedes', data).then(r => r.data),
  updateSede: (id: string, data: UpdateSedeData) => api.put(`/admin/sedes/${id}`, data).then(r => r.data),
  deleteSede: (id: string) => api.delete(`/admin/sedes/${id}`).then(r => r.data),
  activateSede: (id: string) => api.put(`/admin/sedes/${id}/activate`, {}).then(r => r.data),
  
  // CANCHAS
  getCanchas: (sedeId: string) => api.get(`/admin/sedes/${sedeId}/canchas`).then(r => r.data),
  createCancha: (sedeId: string, data: CreateCanchaData) => api.post(`/admin/sedes/${sedeId}/canchas`, data).then(r => r.data),
  updateCancha: (canchaId: string, data: UpdateCanchaData) => api.put(`/admin/sedes/canchas/${canchaId}`, data).then(r => r.data),
  deleteCancha: (canchaId: string) => api.delete(`/admin/sedes/canchas/${canchaId}`).then(r => r.data),
  activateCancha: (canchaId: string) => api.put(`/admin/sedes/canchas/${canchaId}/activate`, {}).then(r => r.data),
  
  // MODALIDADES
  getModalidades: () => api.get('/admin/modalidades').then(r => r.data),
  getModalidad: (id: string) => api.get(`/admin/modalidades/${id}`).then(r => r.data),
  createModalidad: (data: CreateModalidadData) => api.post('/admin/modalidades', data).then(r => r.data),
  updateModalidad: (id: string, data: UpdateModalidadData) => api.put(`/admin/modalidades/${id}`, data).then(r => r.data),
  deleteModalidad: (id: string) => api.delete(`/admin/modalidades/${id}`).then(r => r.data),
  seedModalidades: () => api.post('/admin/modalidades/seed-defaults', {}).then(r => r.data),
};
