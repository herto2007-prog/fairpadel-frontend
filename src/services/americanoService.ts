import { api } from './api';

export interface CreateAmericanoTorneoPayload {
  nombre: string;
  descripcion?: string;
  fecha: string;
  ciudad: string;
  visibilidad?: string;
  limiteInscripciones?: number;
  tipoInscripcion?: 'individual' | 'parejasFijas';
}

export interface ModoJuegoConfig {
  tipoInscripcion: 'individual' | 'parejasFijas';
  rotacion: 'automatica' | 'manual';
  sistemaPuntos: 'games' | 'sets' | 'partido' | 'diferencia';
  formatoPartido: 'tiempo' | 'games' | 'mejorDe3Sets';
  valorObjetivo: number;
  conTieBreak?: boolean;
  categorias: 'sin' | 'con';
  numRondas: number | string;
  canchasSimultaneas?: number;
  premios?: { puesto: string; descripcion: string }[];
}

export interface AmericanoTorneo {
  id: string;
  nombre: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string;
  ciudad: string;
  pais: string;
  flyerUrl: string;
  estado: string;
  formato: string;
  configAmericano: {
    visibilidad: string;
    limiteInscripciones?: number;
    modoJuegoConfigurado: boolean;
    modoJuego?: {
      tipoInscripcion: 'individual' | 'parejasFijas';
      rotacion: 'automatica' | 'manual';
      sistemaPuntos: 'games' | 'sets' | 'partido' | 'diferencia';
      formatoPartido: 'tiempo' | 'games' | 'mejorDe3Sets';
      valorObjetivo: number;
      conTieBreak?: boolean;
      categorias: 'sin' | 'con';
      numRondas: number | string;
      canchasSimultaneas?: number;
      premios?: { puesto: string; descripcion: string }[];
    };
    rondaActual: number;
    inscripcionesAbiertas: boolean;
    tipoInscripcion: 'individual' | 'parejasFijas';
  } | null;
  organizador: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl: string | null;
  };
  sedePrincipal: {
    id: string;
    nombre: string;
  } | null;
  americanosRonda: AmericanoRonda[];
  _count: {
    inscripciones: number;
  };
}

export interface AmericanoRonda {
  id: string;
  numero: number;
  estado: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  parejas: AmericanoPareja[];
  puntajes: AmericanoPuntaje[];
}

export interface AmericanoPareja {
  id: string;
  jugador1: { id: string; nombre: string; apellido: string; fotoUrl: string | null };
  jugador2: { id: string; nombre: string; apellido: string; fotoUrl: string | null };
  nombre: string | null;
  color: string | null;
}

export interface AmericanoPuntaje {
  id: string;
  jugador: { id: string; nombre: string; apellido: string; fotoUrl: string | null };
  puntos: number;
  partidosJugados: number;
  partidosGanados: number;
  partidosPerdidos: number;
  setsGanados: number;
  setsPerdidos: number;
  gamesGanados: number;
  gamesPerdidos: number;
  diferenciaGames: number;
  posicion: number | null;
}

export interface InscripcionAmericano {
  id: string;
  jugador1: { id: string; nombre: string; apellido: string; fotoUrl: string | null; categoriaActual: { nombre: string } | null };
  jugador2: { id: string; nombre: string; apellido: string; fotoUrl: string | null } | null;
  estado: string;
  createdAt: string;
}

export interface ClasificacionItem {
  jugadorId: string;
  nombre: string;
  apellido: string;
  fotoUrl: string | null;
  puntosTotal: number;
  partidosJugados: number;
  partidosGanados: number;
  partidosPerdidos: number;
  setsGanados: number;
  setsPerdidos: number;
  gamesGanados: number;
  gamesPerdidos: number;
  diferenciaGames: number;
}

export const americanoService = {
  // Torneos
  listar: () => api.get('/americano/torneos').then(r => r.data as AmericanoTorneo[]),
  
  getById: (id: string) => api.get(`/americano/torneos/${id}`).then(r => r.data as AmericanoTorneo),
  
  crear: (payload: CreateAmericanoTorneoPayload) => 
    api.post('/americano/torneos', payload).then(r => r.data as AmericanoTorneo),
  
  configurarModo: (torneoId: string, payload: ModoJuegoConfig) =>
    api.post(`/americano/torneos/${torneoId}/configurar-modo`, payload).then(r => r.data),

  eliminar: (torneoId: string) =>
    api.delete(`/americano/torneos/${torneoId}`).then(r => r.data),

  cerrarInscripciones: (torneoId: string) =>
    api.post(`/americano/torneos/${torneoId}/cerrar-inscripciones`).then(r => r.data),

  // Inscripciones
  listarInscripciones: (torneoId: string) => 
    api.get(`/americano/torneos/${torneoId}/inscripciones`).then(r => r.data as InscripcionAmericano[]),
  
  inscribir: (torneoId: string, jugadorId: string, jugador2Id?: string) => 
    api.post(`/americano/torneos/${torneoId}/inscribir`, { jugadorId, jugador2Id }).then(r => r.data),
  
  desinscribir: (torneoId: string, jugadorId: string) => 
    api.post(`/americano/torneos/${torneoId}/desinscribir`, { jugadorId }).then(r => r.data),

  // Rondas
  iniciarPrimeraRonda: (torneoId: string) => 
    api.post(`/americano/torneos/${torneoId}/rondas/iniciar-primera`).then(r => r.data as AmericanoRonda),
  
  generarSiguienteRonda: (torneoId: string) => 
    api.post(`/americano/torneos/${torneoId}/rondas/siguiente`).then(r => r.data as AmericanoRonda),
  
  finalizarRonda: (torneoId: string, rondaId: string) => 
    api.post(`/americano/torneos/${torneoId}/rondas/${rondaId}/finalizar`).then(r => r.data),
  
  getRonda: (rondaId: string) => 
    api.get(`/americano/torneos/torneos/rondas/${rondaId}`).then(r => r.data as AmericanoRonda),

  // Resultados y clasificación
  getClasificacion: (torneoId: string) => 
    api.get(`/americano/torneos/${torneoId}/clasificacion`).then(r => r.data as ClasificacionItem[]),
  
  registrarResultado: (
    torneoId: string, 
    rondaId: string, 
    parejaAId: string, 
    parejaBId: string, 
    sets: { gamesEquipoA: number; gamesEquipoB: number }[]
  ) => 
    api.post(`/americano/torneos/${torneoId}/rondas/${rondaId}/resultado`, { parejaAId, parejaBId, sets }).then(r => r.data),
};
