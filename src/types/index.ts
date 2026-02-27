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

export enum ModoPagoInscripcion {
  COMPLETO = 'COMPLETO',
  INDIVIDUAL = 'INDIVIDUAL',
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
  esPrincipal?: boolean;
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
  minutosPorPartido?: number;
  precioPelota?: number;
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
  comisionPorcentaje?: number;
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
  jugadorId?: string;
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
  modoPago?: ModoPagoInscripcion;
  metodoPago?: MetodoPago;
  pagoId?: string;
  pago?: Pago;
  pagos?: Pago[];
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
  rachaActual?: number;
  mejorPosicion?: number;
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
    esPrincipal?: boolean;
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
  circuitoId?: string;
  inscripcionesAbiertas?: boolean;
}

// Inscripcion DTOs
export interface CreateInscripcionDto {
  tournamentId: string;
  categoryId: string;
  modalidad: Modalidad;
  jugador2Documento: string;
  metodoPago: MetodoPago;
  modoPagoInscripcion?: 'COMPLETO' | 'INDIVIDUAL';
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
  esDescalificacion?: boolean;
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
  multiplicador?: number;
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
  esPremium?: boolean;
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

// ==================== ESTADÍSTICAS AVANZADAS ====================

export interface H2HRecord {
  opponent: UserBrief;
  partidos: number;
  victorias: number;
  derrotas: number;
  winRate: number;
}

export interface SinergiaCompanero {
  partner: UserBrief;
  partidos: number;
  victorias: number;
  winRate: number;
}

export interface TendenciaMensual {
  mes: string;
  puntos: number;
  victorias: number;
  derrotas: number;
}

export interface EstadisticasAvanzadas {
  h2h: H2HRecord[];
  sinergia: SinergiaCompanero[];
  tendencia: TendenciaMensual[];
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
  totalFotos?: number;
}

// ==================== SOCIAL DTOs ====================

export interface SeguirResponse {
  message: string;
}

export interface MensajeDto {
  destinatarioId: string;
  contenido: string;
}

export interface SolicitudJugarDto {
  receptorId: string;
  fechaPropuesta: string;
  hora: string;
  lugar: string;
  mensaje?: string;
}

export interface MensajePrivado {
  id: string;
  remitenteId: string;
  destinatarioId: string;
  contenido: string;
  leido: boolean;
  remitente?: UserBrief;
  destinatario?: UserBrief;
  createdAt: string;
}

export interface Conversacion {
  usuario: UserBrief;
  ultimoMensaje: MensajePrivado;
  noLeidos: number;
}

export interface SolicitudJugar {
  id: string;
  emisorId: string;
  receptorId: string;
  fechaPropuesta: string;
  hora: string;
  lugar: string;
  mensaje?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  emisor?: UserBrief;
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
  multiplicador?: number;
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

// ==================== LOGROS / BADGES ====================

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string; // Lucide icon name (e.g., "Trophy", "Star", "Crown")
  condicion: string;
  categoria: string; // "torneo" | "racha" | "ranking" | "social"
  requierePremium: boolean;
  orden: number;
  createdAt: string;
  // Added by /mis-logros endpoint:
  desbloqueado?: boolean;
  fechaDesbloqueo?: string | null;
}

// ==================== ALERTAS PERSONALIZADAS ====================

export enum TipoAlertaPersonalizada {
  TORNEO_EN_MI_CIUDAD = 'TORNEO_EN_MI_CIUDAD',
  TORNEO_MI_CATEGORIA = 'TORNEO_MI_CATEGORIA',
  RIVAL_INSCRITO = 'RIVAL_INSCRITO',
  RANKING_CAMBIO = 'RANKING_CAMBIO',
}

export interface AlertaPersonalizada {
  id: string;
  userId: string;
  tipo: TipoAlertaPersonalizada;
  activa: boolean;
  config: any;
  createdAt: string;
  updatedAt: string;
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

// ═══════════════════════════════════════════════════════
// FINANZAS: Movimientos y Auspiciantes
// ═══════════════════════════════════════════════════════

export type TipoMovimiento = 'INGRESO' | 'EGRESO';

export type CategoriaMovimiento =
  | 'PREMIO'
  | 'ARBITRAJE'
  | 'ALQUILER_CANCHA'
  | 'PELOTAS'
  | 'PUBLICIDAD'
  | 'LOGISTICA'
  | 'ALIMENTACION'
  | 'AUSPICIO_EFECTIVO'
  | 'OTRO';

export interface MovimientoFinanciero {
  id: string;
  tournamentId: string;
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  concepto: string;
  monto: number;
  fecha: string;
  observaciones?: string;
  creadoPor: string;
  creador?: { nombre: string; apellido: string };
  createdAt: string;
  updatedAt: string;
}

export interface AuspicianteEspecie {
  id: string;
  tournamentId: string;
  sponsorId?: string;
  nombre: string;
  descripcion: string;
  valorEstimado: number;
  fecha: string;
  observaciones?: string;
  sponsor?: { id: string; nombre: string; logoUrl: string };
  creador?: { nombre: string; apellido: string };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardFinanciero {
  costoInscripcion: number;
  totalInscripciones: number;
  totalRecaudado: number;
  totalComisiones: number;
  totalNeto: number;
  pagosConfirmados: number;
  pagosPendientes: number;
  pagosRechazados: number;
  inscripcionesGratis: number;
  porCategoria: {
    categoryId: string;
    categoryNombre: string;
    totalInscritas: number;
    confirmadas: number;
    pendientes: number;
    rechazadas: number;
    montoRecaudado: number;
    montoComisiones: number;
  }[];
  movimientos: {
    totalIngresos: number;
    totalEgresos: number;
    porCategoria: { categoria: string; tipo: string; total: number; count: number }[];
  };
  auspiciosEspecie: {
    totalEstimado: number;
    count: number;
  };
  resumenGeneral: {
    ingresosEfectivo: number;
    egresosEfectivo: number;
    balanceEfectivo: number;
    valorEspecie: number;
  };
}

// ═══════════════════════════════════════════════════════
// INSTRUCTORES
// ═══════════════════════════════════════════════════════

export interface SolicitudInstructor {
  id: string;
  userId: string;
  experienciaAnios: number;
  certificaciones: string | null;
  especialidades: string | null;
  nivelesEnsenanza: string | null;
  descripcion: string | null;
  precioIndividual: number | null;
  precioGrupal: number | null;
  ciudades: string | null;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  motivo: string | null;
  createdAt: string;
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    ciudad: string;
    fotoUrl: string | null;
  };
}

export interface Instructor {
  id: string;
  userId: string;
  estado: 'APROBADO' | 'SUSPENDIDO';
  experienciaAnios: number;
  certificaciones: string | null;
  especialidades: string | null;
  nivelesEnsenanza: string | null;
  descripcion: string | null;
  precioIndividual: number | null;
  precioGrupal: number | null;
  aceptaDomicilio: boolean;
  verificado: boolean;
  ubicaciones?: InstructorUbicacion[];
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    ciudad: string | null;
    fotoUrl: string | null;
  };
  createdAt: string;
}

export interface InstructorUbicacion {
  id: string;
  instructorId: string;
  sedeId: string | null;
  nombreCustom: string | null;
  ciudad: string;
  esPrincipal: boolean;
  sede?: { id: string; nombre: string; ciudad: string };
}

// ==================== INSTRUCTOR AGENDA & RESERVAS ====================

export enum TipoClase {
  INDIVIDUAL = 'INDIVIDUAL',
  GRUPAL = 'GRUPAL',
}

export enum ReservaEstado {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  RECHAZADA = 'RECHAZADA',
  CANCELADA = 'CANCELADA',
  COMPLETADA = 'COMPLETADA',
}

export interface InstructorDisponibilidad {
  id: string;
  instructorId: string;
  diaSemana: number; // 0=dom..6=sab
  horaInicio: string; // "HH:MM"
  horaFin: string;
  activo: boolean;
}

export interface InstructorBloqueo {
  id: string;
  instructorId: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string | null;
  createdAt: string;
}

export interface HorarioSlot {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

export interface ReservaInstructor {
  id: string;
  instructorId: string;
  solicitanteId: string;
  tipo: TipoClase;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  precio: number;
  estado: ReservaEstado;
  mensaje: string | null;
  respuesta: string | null;
  createdAt: string;
  updatedAt: string;
  instructor?: Instructor & { user?: { nombre: string; apellido: string; fotoUrl: string | null } };
  solicitante?: { id: string; nombre: string; apellido: string; email: string; fotoUrl: string | null };
}