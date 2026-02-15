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

export enum CategoriaEstado {
  INSCRIPCIONES_ABIERTAS = 'INSCRIPCIONES_ABIERTAS',
  INSCRIPCIONES_CERRADAS = 'INSCRIPCIONES_CERRADAS',
  FIXTURE_BORRADOR = 'FIXTURE_BORRADOR',
  SORTEO_REALIZADO = 'SORTEO_REALIZADO',
  EN_CURSO = 'EN_CURSO',
  FINALIZADA = 'FINALIZADA',
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
  LIGA = 'LIGA',
}

export enum CircuitoEstado {
  ACTIVO = 'ACTIVO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum PagoEstado {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  RECHAZADO = 'RECHAZADO',
}

export enum ModerationStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
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
  categoriaActualId?: string;
  categoriaActual?: Category;
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
  inscripcionAbierta: boolean;
  estado: CategoriaEstado;
  category: Category;
  inscripcionesCount?: number;
  nombre?: string;
}

export interface TournamentModalidad {
  id: string;
  tournamentId: string;
  modalidad: Modalidad;
}

export interface TorneoPelotasRonda {
  id: string;
  tournamentId: string;
  ronda: string;
  cantidadPelotas: number;
  createdAt?: string;
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
  // Circuito
  circuitoId?: string;
  circuito?: Circuito;
  // Pagos
  habilitarBancard?: boolean;
  cuentasBancarias?: CuentaBancaria[];
  // Shortlink
  slug?: string;
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

export interface Pago {
  id: string;
  inscripcionId: string;
  metodoPago: MetodoPago;
  monto: number;
  comision: number;
  estado: PagoEstado;
  transactionId?: string;
  fechaPago?: string;
  fechaConfirm?: string;
  createdAt?: string;
}

export interface ComprobantePago {
  id: string;
  inscripcionId: string;
  url: string;
  estado: ModerationStatus;
  motivoRechazo?: string;
  createdAt?: string;
}

export interface CuentaBancaria {
  id: string;
  tournamentId: string;
  banco: string;
  titular: string;
  cedulaRuc: string;
  nroCuenta?: string;
  aliasSpi?: string;
  telefonoComprobante?: string;
  activa: boolean;
  createdAt?: string;
}

export interface Inscripcion {
  id: string;
  tournamentId: string;
  categoryId: string;
  parejaId: string;
  modalidad?: Modalidad;
  estado: InscripcionEstado;
  metodoPago?: MetodoPago;
  pagoId?: string;
  pago?: Pago;
  comprobantes?: ComprobantePago[];
  tournament?: Tournament;
  category?: Category;
  pareja?: Pareja;
  createdAt?: string;
  updatedAt?: string;
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
  partidoSiguienteId?: string;
  posicionEnSiguiente?: number;
  // Routing de perdedores (acomodación)
  partidoPerdedorSiguienteId?: string;
  posicionEnPerdedor?: number;
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
  categoriaActualId?: string;
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
  habilitarBancard?: boolean;
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
  nombre?: string;
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
  set1Pareja1?: number;
  set1Pareja2?: number;
  set2Pareja1?: number;
  set2Pareja2?: number;
  set3Pareja1?: number;
  set3Pareja2?: number;
  esWalkOver: boolean;
  esRetiro?: boolean;
  parejaGanadoraId?: string;
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

// Circuitos
export interface Circuito {
  id: string;
  nombre: string;
  descripcion?: string;
  pais: string;
  region?: string;
  ciudad?: string;
  temporada: string;
  fechaInicio: string;
  fechaFin: string;
  estado: CircuitoEstado;
  logoUrl?: string;
  torneos?: Tournament[];
  _count?: { torneos: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface CircuitoStanding {
  posicion: number;
  jugador: {
    id: string;
    nombre: string;
    apellido: string;
    ciudad?: string;
    genero: Gender;
  };
  puntosTotales: number;
  torneosJugados: number;
}

// ==================== PERFIL COMPLETO ====================

export interface UserBrief {
  id: string;
  nombre: string;
  apellido: string;
  fotoUrl?: string;
}

export interface EstadisticasJugador {
  efectividad: number;
  consistencia: number;
  potenciaOfensiva: number;
  solidezDefensiva: number;
  clutch: number;
  regularidad: number;
  overall: number;
}

export interface MatchResumen {
  id: string;
  fecha: string;
  torneo: { id: string; nombre: string } | null;
  categoria: { id: string; nombre: string } | null;
  ronda: string;
  resultado: {
    set1: string | null;
    set2: string | null;
    set3: string | null;
  };
  companero: UserBrief | null;
  oponentes: { jugador1: UserBrief | null; jugador2: UserBrief | null } | null;
  victoria: boolean;
  esWO: boolean;
}

export interface HistorialPuntosExtended {
  id: string;
  jugadorId: string;
  tournamentId: string;
  categoryId: string;
  puntos: number;
  posicionFinal: string;
  fechaTorneo: string;
  tournament: { id: string; nombre: string; ciudad: string; fechaInicio: string } | null;
  category: { id: string; nombre: string } | null;
}

export interface FotoResumen {
  id: string;
  urlImagen: string;
  urlThumbnail?: string;
  descripcion?: string;
  likesCount: number;
  comentariosCount: number;
  createdAt: string;
}

export interface PerfilCompleto {
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    genero: Gender;
    ciudad?: string;
    bio?: string;
    fotoUrl?: string;
    esPremium: boolean;
    createdAt: string;
  };
  ranking: Ranking | null;
  estadisticas: EstadisticasJugador;
  partidosRecientes: MatchResumen[];
  historialTorneos: HistorialPuntosExtended[];
  social: {
    seguidores: number;
    siguiendo: number;
    isFollowing: boolean;
    isOwnProfile: boolean;
  };
  fotos: FotoResumen[];
}

// ==================== SOCIAL DTOs ====================

export interface SeguirResponse {
  message: string;
}

export interface MensajeDto {
  receptorId: string;
  contenido: string;
}

export interface SolicitudJugarDto {
  receptorId: string;
  mensaje?: string;
  fechaPropuesta?: string;
  lugarPropuesto?: string;
}

export interface MensajePrivado {
  id: string;
  emisorId: string;
  receptorId: string;
  contenido: string;
  leido: boolean;
  emisor?: UserBrief;
  receptor?: UserBrief;
  createdAt: string;
}

export interface Conversacion {
  otroUsuario: UserBrief;
  ultimoMensaje: MensajePrivado;
  noLeidos: number;
}

export interface SolicitudJugar {
  id: string;
  solicitanteId: string;
  receptorId: string;
  mensaje?: string;
  fechaPropuesta?: string;
  lugarPropuesto?: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  solicitante?: UserBrief;
  receptor?: UserBrief;
  createdAt: string;
}

export interface ReporteDto {
  motivo: string;
  descripcion?: string;
}

export interface CreateCircuitoDto {
  nombre: string;
  descripcion?: string;
  pais: string;
  region?: string;
  ciudad?: string;
  temporada: string;
  fechaInicio: string;
  fechaFin: string;
  logoUrl?: string;
}

// ═══════════════════════════════════════════
// CATEGORÍAS Y ASCENSOS
// ═══════════════════════════════════════════

export type TipoCambioCategoria =
  | 'ASCENSO_AUTOMATICO'
  | 'ASCENSO_POR_DEMOSTRACION'
  | 'ASCENSO_MANUAL'
  | 'DESCENSO_MANUAL'
  | 'ASIGNACION_INICIAL';

export interface ReglaAscenso {
  id: string;
  categoriaOrigenId: string;
  categoriaDestinoId: string;
  campeonatosConsecutivos?: number | null;
  campeonatosAlternados?: number | null;
  finalistaCalifica: boolean;
  activa: boolean;
  categoriaOrigen?: Category;
  categoriaDestino?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface HistorialCategoria {
  id: string;
  userId: string;
  categoriaAnteriorId?: string | null;
  categoriaNuevaId: string;
  tipo: TipoCambioCategoria;
  motivo: string;
  tournamentId?: string | null;
  realizadoPor?: string | null;
  createdAt?: string;
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    documento: string;
    genero: Gender;
  };
}

export interface PromocionResult {
  jugadorId: string;
  jugadorNombre: string;
  categoriaAnterior: string;
  categoriaNueva: string;
  tipo: string;
}

// ==================== NOTIFICACIONES ====================

export enum TipoNotificacion {
  SISTEMA = 'SISTEMA',
  TORNEO = 'TORNEO',
  INSCRIPCION = 'INSCRIPCION',
  PARTIDO = 'PARTIDO',
  RANKING = 'RANKING',
  SOCIAL = 'SOCIAL',
  PAGO = 'PAGO',
  MENSAJE = 'MENSAJE',
}

export interface Notificacion {
  id: string;
  userId: string;
  tipo: TipoNotificacion;
  titulo: string | null;
  contenido: string;
  enlace: string | null;
  leida: boolean;
  emailEnviado: boolean;
  smsEnviado: boolean;
  createdAt: string;
}

export interface PreferenciaNotificacion {
  tipoNotificacion: TipoNotificacion;
  recibirEmail: boolean;
  recibirSms: boolean;
}