// ==================== ENUMS ====================

export enum Gender {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
}

export enum TournamentStatus {
  BORRADOR = 'BORRADOR',
  PENDIENTE_APROBACION = 'PENDIENTE_APROBACION',
  PUBLICADO = 'PUBLICADO',
  EN_CURSO = 'EN_CURSO',
  FINALIZADO = 'FINALIZADO',
  RECHAZADO = 'RECHAZADO',
  CANCELADO = 'CANCELADO',
}

export enum Modalidad {
  TRADICIONAL = 'TRADICIONAL',
  MIXTO = 'MIXTO',
  SUMA = 'SUMA',
}

export enum InscripcionEstado {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  PENDIENTE_CONFIRMACION = 'PENDIENTE_CONFIRMACION',
  PENDIENTE_PAGO_PRESENCIAL = 'PENDIENTE_PAGO_PRESENCIAL',
  CONFIRMADA = 'CONFIRMADA',
  RECHAZADA = 'RECHAZADA',
  CANCELADA = 'CANCELADA',
}

export enum MatchStatus {
  PROGRAMADO = 'PROGRAMADO',
  EN_JUEGO = 'EN_JUEGO',
  FINALIZADO = 'FINALIZADO',
  SUSPENDIDO = 'SUSPENDIDO',
  WO = 'WO',
  CANCELADO = 'CANCELADO',
}

export enum MetodoPago {
  BANCARD = 'BANCARD',
  TRANSFERENCIA = 'TRANSFERENCIA',
  EFECTIVO = 'EFECTIVO',
}

export enum TipoRanking {
  GLOBAL = 'GLOBAL',
  PAIS = 'PAIS',
  CIUDAD = 'CIUDAD',
}

export enum TipoCancha {
  INDOOR = 'INDOOR',
  OUTDOOR = 'OUTDOOR',
  SEMI_TECHADA = 'SEMI_TECHADA',
}

// ==================== INTERFACES BASE ====================

export interface Role {
  id: string;
  nombre: string;
}

export interface User {
  id: string;
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  genero: Gender;
  fechaNacimiento?: string;
  ciudad?: string;
  bio?: string;
  fotoUrl?: string;
  esPremium: boolean;
  roles: string[] | Role[];
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  nombre: string;
  tipo: 'MASCULINO' | 'FEMENINO';
  orden: number;
  createdAt?: string;
}

export interface TournamentCategory {
  id: string;
  tournamentId: string;
  categoryId: string;
  category: Category;
  // Alias para acceso directo
  nombre?: string;
}

export interface TournamentModalidad {
  id: string;
  tournamentId: string;
  modalidad: Modalidad;
}

// ==================== SEDES Y CANCHAS ====================

export interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
  direccion?: string;
  mapsUrl?: string;
  telefono?: string;
  logoUrl?: string;
  imagenFondo?: string;
  horarioAtencion?: string;
  contactoEncargado?: string;
  canvasWidth: number;
  canvasHeight: number;
  activo: boolean;
  canchas?: SedeCancha[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SedeCancha {
  id: string;
  sedeId: string;
  nombre: string;
  tipo: TipoCancha;
  posicionX: number;
  posicionY: number;
  ancho: number;
  alto: number;
  rotacion: number;
  imagenUrl?: string;
  activa: boolean;
  sede?: Sede;
  createdAt?: string;
  updatedAt?: string;
}

export interface TorneoCancha {
  id: string;
  tournamentId: string;
  sedeCanchaId: string;
  sedeCancha?: SedeCancha;
  horarios?: TorneoCanchaHorario[];
  createdAt?: string;
}

export interface TorneoCanchaHorario {
  id: string;
  torneoCanchaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  createdAt?: string;
}

export interface TorneoSede {
  id: string;
  tournamentId: string;
  sedeId: string;
  sede?: Sede;
  createdAt?: string;
}

export interface Tournament {
  id: string;
  nombre: string;
  descripcion?: string;
  pais: string;
  region: string;
  ciudad: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscr: string;
  flyerUrl: string;
  costoInscripcion: number;
  // Campos legacy
  sede?: string;
  direccion?: string;
  mapsUrl?: string;
  // Nuevo sistema de sedes
  sedeId?: string;
  sedePrincipal?: Sede;
  torneoCanchas?: TorneoCancha[];
  torneoSedes?: TorneoSede[];
  estado: TournamentStatus;
  organizadorId: string;
  organizador?: Partial<User>;
  categorias?: TournamentCategory[];
  modalidades?: TournamentModalidad[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Pareja {
  id: string;
  jugador1Id: string;
  jugador2Id?: string;
  jugador2Documento?: string;
  jugador1?: User;
  jugador2?: User;
}

export interface Inscripcion {
  id: string;
  tournamentId: string;
  categoryId: string;
  parejaId: string;
  estado: InscripcionEstado;
  metodoPago?: MetodoPago;
  pagoId?: string;
  tournament?: Tournament;
  category?: Category;
  pareja?: Pareja;
  createdAt?: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  categoryId: string;
  ronda: string;
  numeroRonda: number;
  pareja1Id?: string;
  pareja2Id?: string;
  parejaGanadoraId?: string;
  set1Pareja1?: number;
  set1Pareja2?: number;
  set2Pareja1?: number;
  set2Pareja2?: number;
  set3Pareja1?: number;
  set3Pareja2?: number;
  fechaProgramada?: string;
  horaProgramada?: string;
  horaFinEstimada?: string;
  torneoCanchaId?: string;
  torneoCancha?: TorneoCancha;
  observaciones?: string;
  estado: MatchStatus;
  pareja1?: Pareja;
  pareja2?: Pareja;
  parejaGanadora?: Pareja;
  category?: Category;
}

export interface Ranking {
  id: string;
  jugadorId: string;
  tipoRanking: TipoRanking;
  genero: Gender;
  posicion: number;
  posicionAnterior?: number;
  puntosTotales: number;
  torneosJugados: number;
  victorias: number;
  derrotas: number;
  campeonatos: number;
  porcentajeVictorias?: number;
  jugador?: User;
}

export interface HistorialPuntos {
  id: string;
  jugadorId: string;
  tournamentId: string;
  puntos: number;
  posicionFinal: number;
  fecha: string;
}

// ==================== DTOs ====================

// Auth DTOs
export interface LoginDto {
  documento: string;
  password: string;
}

export interface RegisterDto {
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  confirmPassword: string;
  genero: Gender;
  fechaNacimiento?: string;
  ciudad?: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  access_token?: string;
  accessToken?: string;
}

// Tournament DTOs
export interface CreateTournamentDto {
  nombre: string;
  descripcion?: string;
  pais: string;
  region: string;
  ciudad: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion: string;
  flyerUrl: string;
  costoInscripcion: number;
  sede?: string;
  direccion?: string;
  mapsUrl?: string;
  sedeId?: string;
  categorias: string[];
  modalidades: Modalidad[];
}

export interface UpdateTournamentDto {
  nombre?: string;
  descripcion?: string;
  pais?: string;
  region?: string;
  ciudad?: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaLimiteInscripcion?: string;
  flyerUrl?: string;
  costoInscripcion?: number;
  sede?: string;
  direccion?: string;
  mapsUrl?: string;
  sedeId?: string;
  categorias?: string[];
  modalidades?: Modalidad[];
}

// Sede DTOs
export interface CreateSedeDto {
  nombre: string;
  ciudad: string;
  direccion?: string;
  mapsUrl?: string;
  telefono?: string;
  logoUrl?: string;
  imagenFondo?: string;
  horarioAtencion?: string;
  contactoEncargado?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface UpdateSedeDto extends Partial<CreateSedeDto> {
  activo?: boolean;
}

export interface CreateSedeCanchaDto {
  nombre: string;
  tipo?: TipoCancha;
  posicionX?: number;
  posicionY?: number;
  ancho?: number;
  alto?: number;
  rotacion?: number;
  imagenUrl?: string;
}

export interface UpdateSedeCanchaDto extends Partial<CreateSedeCanchaDto> {
  id?: string;
  activa?: boolean;
}

export interface ConfigurarTorneoCanchasDto {
  canchas: {
    sedeCanchaId: string;
    horarios: {
      fecha: string;
      horaInicio: string;
      horaFin: string;
    }[];
  }[];
}

export interface TournamentFilters {
  pais?: string;
  ciudad?: string;
  estado?: TournamentStatus;
  modalidad?: Modalidad;
}

// Inscripcion DTOs
export interface CreateInscripcionDto {
  tournamentId: string;
  categoryId: string;
  modalidad: Modalidad;
  jugador2Documento: string;
  metodoPago: MetodoPago;
}

// User DTOs
export interface UpdateProfileDto {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  fechaNacimiento?: string;
  ciudad?: string;
  bio?: string;
}

// Match DTOs
export interface CargarResultadoDto {
  matchId: string;
  set1Pareja1: number;
  set1Pareja2: number;
  set2Pareja1: number;
  set2Pareja2: number;
  set3Pareja1?: number;
  set3Pareja2?: number;
  observaciones?: string;
}

// Rankings DTOs
export interface RankingFilters {
  genero?: Gender;
  tipoRanking?: TipoRanking;
  alcance?: string;
  limit?: number;
}

// Payment DTOs
export interface PaymentResponse {
  success: boolean;
  redirectUrl?: string;
  checkoutUrl?: string;
  message?: string;
}