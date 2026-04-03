import { api } from './api';

// ═══════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════

export interface CreateTorneoV2Data {
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  ciudad: string;
  costoInscripcion: number;
  sedeId?: string;
  flyerUrl?: string;
  modalidadIds?: string[];
  categoriaIds?: string[];
}

export interface Comision {
  id: string;
  tournamentId: string;
  montoEstimado: number;
  montoPagado: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'PENDIENTE_VERIFICACION';
  bloqueoActivo: boolean;
  rondaBloqueo: string;
  comprobanteUrl?: string;
  comprobanteNotas?: string;
  pagadoAt?: string;
  revisadoPor?: string;
  comisionPorJugador: number;
}

export interface ChecklistItem {
  id: string;
  tournamentId: string;
  categoria: 'PELOTAS' | 'AUSPICIANTES' | 'PREMIOS' | 'INFRAESTRUCTURA' | 'BEBIDAS' | 'OTRO';
  titulo: string;
  descripcion?: string;
  fechaRecordatorio?: string;
  recordatorioEnviado: boolean;
  completado: boolean;
  completadoAt?: string;
  notas?: string;
  valorCalculado?: number;
  valorReal?: number;
  orden: number;
}

export interface TorneoV2Response {
  id: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  inscripcionesAbiertas?: boolean;
  ciudad: string;
  costoInscripcion: number;
  estado: string;
  flyerUrl: string;
  sedePrincipal?: {
    id: string;
    nombre: string;
    ciudad: string;
  };
  categorias: {
    id: string;
    category: {
      id: string;
      nombre: string;
    };
  }[];
  modalidades: {
    id: string;
    modalidadConfig: {
      id: string;
      nombre: string;
      reglas: any;
    };
  }[];
  organizador: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  };
  _count: {
    inscripciones: number;
  };
  comision: Comision;
  checklist: ChecklistItem[];
  stats: {
    total: number;
    confirmadas: number;
    pendientesPago: number;
  };
}

export interface ChecklistProgress {
  total: number;
  completados: number;
  porcentaje: number;
}

export interface TorneoEstado {
  torneo: {
    nombre: string;
    estado: string;
  };
  bloqueo: {
    activo: boolean;
    rondaBloqueo: string;
    comisionEstado: string;
    montoPagado: number;
    montoEstimado: number;
  };
  mensaje: string;
}

export interface DatosBancarios {
  banco: string;
  numeroCuenta: string;
  alias: string;
  titular: string;
  whatsapp: string;
}

// ═══════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════

export const torneoV2Service = {
  // ═══════════════════════════════════════════════════════
  // CRUD BÁSICO
  // ═══════════════════════════════════════════════════════
  
  create: (data: CreateTorneoV2Data) => 
    api.post('/admin/torneos', data).then(r => r.data),
  
  getById: (id: string) => 
    api.get<TorneoV2Response>(`/admin/torneos/${id}/detalle`).then(r => r.data),
  
  // ═══════════════════════════════════════════════════════
  // CHECKLIST
  // ═══════════════════════════════════════════════════════
  
  getChecklist: (tournamentId: string) => 
    api.get<{ success: boolean; items: ChecklistItem[]; progreso: ChecklistProgress }>(
      `/admin/torneos/${tournamentId}/checklist`
    ).then(r => r.data),
  
  completarItem: (tournamentId: string, itemId: string, data: { notas?: string; valorReal?: number }) => 
    api.put(`/admin/torneos/${tournamentId}/checklist/${itemId}`, data).then(r => r.data),
  
  configurarRecordatorio: (tournamentId: string, itemId: string, fechaRecordatorio: string) => 
    api.put(`/admin/torneos/${tournamentId}/checklist/${itemId}/recordatorio`, { 
      fechaRecordatorio 
    }).then(r => r.data),
  
  // ═══════════════════════════════════════════════════════
  // COMISIONES Y BLOQUEO
  // ═══════════════════════════════════════════════════════
  
  subirComprobante: (tournamentId: string, data: { comprobanteUrl: string; notas?: string }) => 
    api.post(`/admin/torneos/${tournamentId}/comision/comprobante`, data).then(r => r.data),
  
  getEstado: (tournamentId: string) => 
    api.get<TorneoEstado>(`/admin/torneos/${tournamentId}/estado`).then(r => r.data),
  
  getDatosBancarios: () => 
    api.get<{ datosBancarios: DatosBancarios }>('/fairpadel/admin/datos-bancarios').then(r => r.data),
  
  // ═══════════════════════════════════════════════════════
  // ADMIN FAIRPADEL (Panel del dueño)
  // ═══════════════════════════════════════════════════════
  
  getDashboard: () => 
    api.get('/fairpadel/admin/dashboard').then(r => r.data),
  
  getConfig: () => 
    api.get('/fairpadel/admin/config').then(r => r.data),
  
  updateConfig: (clave: string, valor: string) => 
    api.put(`/fairpadel/admin/config/${clave}`, { valor }).then(r => r.data),
  
  getTorneosBloqueados: () => 
    api.get('/fairpadel/admin/torneos/bloqueados').then(r => r.data),
  
  getTorneoAdmin: (id: string) => 
    api.get(`/fairpadel/admin/torneos/${id}`).then(r => r.data),
  
  liberarTorneo: (id: string, data: { montoPagado: number; notas?: string }) => 
    api.post(`/fairpadel/admin/torneos/${id}/liberar`, data).then(r => r.data),
  
  bloquearTorneo: (id: string) => 
    api.post(`/fairpadel/admin/torneos/${id}/bloquear`, {}).then(r => r.data),
};
