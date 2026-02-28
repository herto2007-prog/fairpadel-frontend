import api from './api';
import type {
  SolicitudInstructor,
  Instructor,
  InstructorDisponibilidad,
  InstructorBloqueo,
  HorarioSlot,
  ReservaInstructor,
  AlumnoResumen,
  FinanzasResumen,
  FinanzasMensual,
} from '@/types';

export const instructoresService = {
  // ── Solicitud ──────────────────────────────────────────

  solicitarSerInstructor: async (dto: {
    experienciaAnios: number;
    certificaciones?: string;
    especialidades?: string;
    nivelesEnsenanza?: string;
    descripcion?: string;
    precioIndividual?: number;
    precioGrupal?: number;
    ciudades?: string;
  }): Promise<{ message: string; solicitud: SolicitudInstructor }> => {
    const response = await api.post('/instructores/solicitar', dto);
    return response.data;
  },

  obtenerMiSolicitud: async (): Promise<SolicitudInstructor | null> => {
    const response = await api.get('/instructores/mi-solicitud');
    return response.data;
  },

  // ── Perfil (instructor logueado) ──────────────────────

  obtenerMiPerfil: async (): Promise<Instructor> => {
    const response = await api.get('/instructores/mi-perfil');
    return response.data;
  },

  actualizarPerfil: async (dto: {
    experienciaAnios?: number;
    certificaciones?: string;
    especialidades?: string;
    nivelesEnsenanza?: string;
    descripcion?: string;
    precioIndividual?: number;
    precioGrupal?: number;
    aceptaDomicilio?: boolean;
  }): Promise<Instructor> => {
    const response = await api.put('/instructores/mi-perfil', dto);
    return response.data;
  },

  actualizarUbicaciones: async (ubicaciones: Array<{
    sedeId?: string;
    nombreCustom?: string;
    ciudad: string;
    esPrincipal?: boolean;
  }>): Promise<{ message: string }> => {
    const response = await api.put('/instructores/ubicaciones', { ubicaciones });
    return response.data;
  },

  // ── Disponibilidad (instructor logueado) ──────────────

  obtenerDisponibilidad: async (): Promise<InstructorDisponibilidad[]> => {
    const response = await api.get('/instructores/disponibilidad');
    return response.data;
  },

  actualizarDisponibilidad: async (slots: Array<{
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
  }>): Promise<{ message: string }> => {
    const response = await api.put('/instructores/disponibilidad', { slots });
    return response.data;
  },

  // ── Bloqueos (instructor logueado) ────────────────────

  obtenerBloqueos: async (): Promise<InstructorBloqueo[]> => {
    const response = await api.get('/instructores/bloqueos');
    return response.data;
  },

  crearBloqueo: async (dto: {
    fechaInicio: string;
    fechaFin: string;
    motivo?: string;
  }): Promise<InstructorBloqueo> => {
    const response = await api.post('/instructores/bloqueos', dto);
    return response.data;
  },

  eliminarBloqueo: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/instructores/bloqueos/${id}`);
    return response.data;
  },

  // ── Reservas: lado instructor ─────────────────────────

  obtenerReservasInstructor: async (estado?: string): Promise<ReservaInstructor[]> => {
    const query = estado ? `?estado=${estado}` : '';
    const response = await api.get(`/instructores/reservas${query}`);
    return response.data;
  },

  confirmarReserva: async (id: string): Promise<ReservaInstructor> => {
    const response = await api.put(`/instructores/reservas/${id}/confirmar`);
    return response.data;
  },

  rechazarReserva: async (id: string, motivo?: string): Promise<ReservaInstructor> => {
    const response = await api.put(`/instructores/reservas/${id}/rechazar`, { motivo });
    return response.data;
  },

  completarReserva: async (id: string): Promise<ReservaInstructor> => {
    const response = await api.put(`/instructores/reservas/${id}/completar`);
    return response.data;
  },

  // ── Agenda (instructor logueado) ──────────────────────

  obtenerAgenda: async (fechaInicio: string): Promise<{
    reservas: ReservaInstructor[];
    bloqueos: InstructorBloqueo[];
    disponibilidades: InstructorDisponibilidad[];
  }> => {
    const response = await api.get(`/instructores/agenda?fechaInicio=${fechaInicio}`);
    return response.data;
  },

  // ── Reservas: lado alumno ─────────────────────────────

  obtenerMisReservas: async (estado?: string): Promise<ReservaInstructor[]> => {
    const query = estado ? `?estado=${estado}` : '';
    const response = await api.get(`/instructores/mis-reservas${query}`);
    return response.data;
  },

  cancelarMiReserva: async (id: string): Promise<ReservaInstructor> => {
    const response = await api.put(`/instructores/mis-reservas/${id}/cancelar`);
    return response.data;
  },

  // ── Público ────────────────────────────────────────────

  buscarInstructores: async (params?: {
    ciudad?: string;
    especialidad?: string;
    page?: number;
    limit?: number;
  }): Promise<{ instructores: Instructor[]; total: number; page: number; limit: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.ciudad) searchParams.append('ciudad', params.ciudad);
    if (params?.especialidad) searchParams.append('especialidad', params.especialidad);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    const response = await api.get(`/instructores${query ? `?${query}` : ''}`);
    return response.data;
  },

  obtenerInstructor: async (id: string): Promise<Instructor> => {
    const response = await api.get(`/instructores/${id}`);
    return response.data;
  },

  getHorariosDisponibles: async (instructorId: string, fecha: string): Promise<HorarioSlot[]> => {
    const response = await api.get(`/instructores/${instructorId}/horarios-disponibles?fecha=${fecha}`);
    // Backend returns { fecha, slots: [...] } — extract the array
    return response.data?.slots || [];
  },

  crearReserva: async (instructorId: string, dto: {
    tipo: string;
    fecha: string;
    horaInicio: string;
    duracionMinutos?: number;
    mensaje?: string;
  }): Promise<ReservaInstructor> => {
    const response = await api.post(`/instructores/${instructorId}/reservar`, dto);
    return response.data;
  },

  // ── Fase 3: Gestión de instructor ───────────────────

  crearClaseManual: async (dto: {
    tipo: string;
    fecha: string;
    horaInicio: string;
    duracionMinutos?: number;
    precio?: number;
    solicitanteId?: string;
    alumnoExternoNombre?: string;
    alumnoExternoTelefono?: string;
    notas?: string;
  }): Promise<ReservaInstructor> => {
    const response = await api.post('/instructores/clases', dto);
    return response.data;
  },

  marcarAsistencia: async (id: string, asistio: boolean): Promise<ReservaInstructor> => {
    const response = await api.put(`/instructores/reservas/${id}/asistencia`, { asistio });
    return response.data;
  },

  marcarPago: async (id: string, pagado: boolean, metodoPago?: string): Promise<ReservaInstructor> => {
    const response = await api.put(`/instructores/reservas/${id}/pago`, { pagado, metodoPago });
    return response.data;
  },

  guardarNotas: async (id: string, notas: string): Promise<ReservaInstructor> => {
    const response = await api.put(`/instructores/reservas/${id}/notas`, { notas });
    return response.data;
  },

  obtenerAlumnos: async (): Promise<AlumnoResumen[]> => {
    const response = await api.get('/instructores/alumnos');
    return response.data;
  },

  obtenerHistorialAlumno: async (alumnoId: string, externoNombre?: string): Promise<ReservaInstructor[]> => {
    if (alumnoId === 'externo' && externoNombre) {
      const response = await api.get(`/instructores/alumnos/externo/historial?externoNombre=${encodeURIComponent(externoNombre)}`);
      return response.data;
    }
    const response = await api.get(`/instructores/alumnos/${alumnoId}/historial`);
    return response.data;
  },

  obtenerFinanzas: async (desde?: string, hasta?: string): Promise<FinanzasResumen> => {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const query = params.toString();
    const response = await api.get(`/instructores/finanzas${query ? `?${query}` : ''}`);
    return response.data;
  },

  obtenerFinanzasMensual: async (anio: number, mes: number): Promise<FinanzasMensual[]> => {
    const response = await api.get(`/instructores/finanzas/mensual?anio=${anio}&mes=${mes}`);
    return response.data;
  },
};
