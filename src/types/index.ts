// ==================== USER TYPES ====================

export enum UserRole {
  JUGADOR = 'jugador',
  ORGANIZADOR = 'organizador',
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  ENCARGADO = 'encargado',
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono?: string;
  fechaNacimiento?: string;
  fotoUrl?: string;
  roles: UserRole[];
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  documento: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
}

// ==================== TOURNAMENT TYPES ====================

export enum TournamentStatus {
  BORRADOR = 'BORRADOR',
  PUBLICADO = 'PUBLICADO',
  INSCRIPCION_ABIERTA = 'INSCRIPCION_ABIERTA',
  INSCRIPCION_CERRADA = 'INSCRIPCION_CERRADA',
  EN_CURSO = 'EN_CURSO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum TournamentFormat {
  ELIMINACION_DIRECTA = 'ELIMINACION_DIRECTA',
  ELIMINACION_DIRECTA_DOBLE = 'ELIMINACION_DIRECTA_DOBLE',
  ROUND_ROBIN = 'ROUND_ROBIN',
  SUIZO = 'SUIZO',
}

export enum TournamentModalidad {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
  MIXTO = 'MIXTO',
}

export interface Category {
  id: string;
  nombre: string;
  nivel: number;
  tipo: string;
}

export interface TournamentCategory {
  id: string;
  categoria: Category;
  categoriaId: string;
  precioInscripcion: number;
  premio?: string;
}

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  lat?: number;
  lng?: number;
}

export interface Tournament {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  estado: TournamentStatus;
  formato: TournamentFormat;
  modalidad: TournamentModalidad;
  
  // Fechas
  fechaInicio: string;
  fechaFin: string;
  fechaInicioInscripcion?: string;
  fechaFinInscripcion?: string;
  fechaPublicacion?: string;
  
  // Configuración
  maxParejas?: number;
  minParejas?: number;
  puntosRanking?: number;
  premio?: string;
  flyerUrl?: string;
  
  // Relaciones
  organizadorId: string;
  organizador: User;
  
  circuitoId?: string;
  sedePrincipalId?: string;
  sedePrincipal?: Sede;
  
  categorias: TournamentCategory[];
  sedes: Sede[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreateTournamentData {
  nombre: string;
  descripcion?: string;
  formato: TournamentFormat;
  modalidad: TournamentModalidad;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioInscripcion?: string;
  fechaFinInscripcion?: string;
  maxParejas?: number;
  minParejas?: number;
  puntosRanking?: number;
  premio?: string;
  sedePrincipalId?: string;
  circuitoId?: string;
  categorias: {
    categoriaId: string;
    precioInscripcion: number;
    premio?: string;
  }[];
}

// ==================== API TYPES ====================

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  modalidad?: string;
  formato?: string;
  ciudad?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}
