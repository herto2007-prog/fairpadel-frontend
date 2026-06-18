import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Users, Calendar, Trophy, CheckCircle2, AlertCircle,
  Download, RefreshCw, Database, UserX, Shield, Wrench, AlertTriangle, Info,
  Edit3, ArrowRightLeft, DollarSign, Plus, Trash2
} from 'lucide-react';
import { api } from '../../../../services/api';
import { formatDatePY, formatDatePYLong } from '../../../../utils/date';
import { useAuth } from '../../../../features/auth/context/AuthContext';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { useToast } from '../../../../components/ui/ToastProvider';

interface AuditoriaManagerProps {
  tournamentId: string;
}

type VistaTipo = 'validacion' | 'inscripciones' | 'partidos' | 'slots' | 'sin-cancha';

interface ProblemaData {
  id: string;
  tipo: 'CRITICO' | 'ADVERTENCIA' | 'INFO';
  categoria: string;
  categoriaId: string;
  mensaje: string;
  detalle: string;
  accionRecomendada: string;
  partidoId?: string;
  datos?: any;
}

interface ValidacionData {
  resumen: {
    totalCategorias: number;
    totalProblemas: number;
    criticos: number;
    advertencias: number;
    info: number;
  };
  problemas: ProblemaData[];
}

interface InscripcionData {
  id: string;
  estado: string;
  modoPago: string;
  notas: string;
  createdAt: string;
  estadoClasificacion: string;
  rondaClasificacion: string;
  pareja: {
    jugador1: string;
    jugador1Categoria: string;
    jugador2: string;
    jugador2Categoria: string;
    telefonoJ1?: string;
    telefonoJ2?: string;
    completa: boolean;
    jugador1Id: string;
    jugador2Id: string | null;
    jugador2Documento: string;
    j1: { id: string; nombre: string; apellido: string; telefono?: string; documento?: string } | null;
    j2: { id: string; nombre: string; apellido: string; telefono?: string; documento?: string } | null;
  };
  categoria: {
    id: string;
    nombre: string;
    genero: string;
  };
  pagos: Array<{
    id: string;
    estado: string;
    monto: number;
    metodo: string;
    fecha: string;
  }>;
  programacion: Array<{
    fase: string;
    fecha: string;
    hora: string;
    cancha?: string;
    sede?: string;
  }>;
  tieneSlotAsignado: boolean;
}

interface PartidoData {
  id: string;
  fase: string;
  numeroRonda: number;
  estado: string;
  categoria: {
    id: string;
    nombre: string;
    genero: string;
  };
  pareja1: string;
  pareja2: string;
  parejaGanadora: string | null;
  programacion: {
    fecha: string;
    hora: string;
    cancha?: string;
    sede?: string;
  } | null;
  estaProgramado: boolean;
  resultado: {
    set1: string;
    set2: string | null;
    set3: string | null;
    ganador: string | null;
  } | null;
  esBye: boolean;
  tipoEntrada1: string | null;
  tipoEntrada2: string | null;
  inscripcion1Id: string | null;
  inscripcion2Id: string | null;
  createdAt: string;
}

interface SlotDisponible {
  id: string;
  horaInicio: string;
  horaFin: string;
  esValido: boolean;
  restriccion: string;
  disponibilidad: {
    fecha: string;
  };
  torneoCancha: {
    id: string;
    sedeCancha: {
      nombre: string;
    };
  };
}

interface SlotData {
  id: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  fase: string | null;
  cancha: {
    id: string;
    nombre: string;
    sede?: string;
  } | null;
  ocupadoPor: {
    partidoId: string;
    fase: string;
    categoria?: string;
    pareja1: string;
    pareja2: string;
  } | null;
}

interface DiaSlotsData {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  minutosSlot: number;
  fasesPermitidas: string | null;
  slots: SlotData[];
}

export function AuditoriaManager({ tournamentId }: AuditoriaManagerProps) {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [vistaActiva, setVistaActiva] = useState<VistaTipo>('validacion');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroFase, setFiltroFase] = useState('');
  const [filtroSinPareja, setFiltroSinPareja] = useState(false);
  const [filtroSinSlot, setFiltroSinSlot] = useState(false);
  const [filtroSinProgramar, setFiltroSinProgramar] = useState(false);
  const [filtroFinalizados, setFiltroFinalizados] = useState(false);

  // Datos para filtros
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<Array<{ id: string; nombre: string }>>([]);
  const [fasesDisponibles, setFasesDisponibles] = useState<string[]>([]);

  // Datos
  const [inscripciones, setInscripciones] = useState<InscripcionData[]>([]);
  const [partidos, setPartidos] = useState<PartidoData[]>([]);
  const [partidosSinCancha, setPartidosSinCancha] = useState<PartidoData[]>([]);
  const [slotsData, setSlotsData] = useState<DiaSlotsData[]>([]);
  const [stats, setStats] = useState<{ total: number; ocupados: number; libres: number; porcentajeOcupacion: number } | null>(null);
  const [validacionData, setValidacionData] = useState<ValidacionData | null>(null);

  // Modal asignar cancha
  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<PartidoData | null>(null);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState('');
  const [canchasDisponibles, setCanchasDisponibles] = useState<Array<{ id: string; nombre: string; sede: string }>>([]);
  const [asignando, setAsignando] = useState(false);

  // Modal editar slot
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [partidoAEditar, setPartidoAEditar] = useState<PartidoData | null>(null);
  const [slotsDisponibles, setSlotsDisponibles] = useState<SlotDisponible[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState('');
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [partidoIntercambio, setPartidoIntercambio] = useState<PartidoData | null>(null);

  // Modal eliminar inscripción
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [inscripcionAEliminar, setInscripcionAEliminar] = useState<InscripcionData | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Modal cambiar estado de inscripción (emergencia)
  const [modalCambiarEstadoAbierto, setModalCambiarEstadoAbierto] = useState(false);
  const [inscripcionACambiarEstado, setInscripcionACambiarEstado] = useState<InscripcionData | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  // Modal corregir parejas de un partido (god-panel)
  const [modalParejasAbierto, setModalParejasAbierto] = useState(false);
  const [partidoParejas, setPartidoParejas] = useState<PartidoData | null>(null);
  const [inscCategoria, setInscCategoria] = useState<InscripcionData[]>([]);
  const [parejaLado1, setParejaLado1] = useState('');
  const [parejaLado2, setParejaLado2] = useState('');
  const [guardandoParejas, setGuardandoParejas] = useState(false);

  // Modal reprogramar partido puntual (god-panel)
  const [modalReprogramarAbierto, setModalReprogramarAbierto] = useState(false);
  const [partidoReprogramar, setPartidoReprogramar] = useState<PartidoData | null>(null);
  const [reproFecha, setReproFecha] = useState('');
  const [reproHora, setReproHora] = useState('');
  const [reproCancha, setReproCancha] = useState(''); // '' = sin cambiar, '__none__' = quitar
  const [guardandoRepro, setGuardandoRepro] = useState(false);

  // Modal limpiar resultado (deshacer, en cascada)
  const [modalLimpiarAbierto, setModalLimpiarAbierto] = useState(false);
  const [partidoALimpiar, setPartidoALimpiar] = useState<PartidoData | null>(null);
  const [limpiando, setLimpiando] = useState(false);

  // Modal mover inscripción de categoría (god-panel B)
  const [modalMoverAbierto, setModalMoverAbierto] = useState(false);
  const [inscMover, setInscMover] = useState<InscripcionData | null>(null);
  const [catsTorneo, setCatsTorneo] = useState<Array<{ categoryId: string; nombre: string }>>([]);
  const [catDestino, setCatDestino] = useState('');
  const [moviendo, setMoviendo] = useState(false);

  // Modal editar/corregir jugadores de una inscripción (god-panel B)
  const [modalJugadoresAbierto, setModalJugadoresAbierto] = useState(false);
  const [inscJugadores, setInscJugadores] = useState<InscripcionData | null>(null);
  const [j1Form, setJ1Form] = useState({ nombre: '', apellido: '', telefono: '', documento: '' });
  const [j2Form, setJ2Form] = useState({ nombre: '', apellido: '', telefono: '', documento: '' });
  const [guardandoJ, setGuardandoJ] = useState(false);
  // Búsqueda para cambiar/completar quién integra la pareja
  const [buscarSlot, setBuscarSlot] = useState<1 | 2 | null>(null);
  const [busquedaJug, setBusquedaJug] = useState('');
  const [resultadosJug, setResultadosJug] = useState<Array<{ id: string; nombre: string; apellido: string; documento?: string }>>([]);

  // Comisión del torneo (god-panel C)
  const [comision, setComision] = useState<{ montoEstimado: number; montoPagado: number; estado: string; bloqueoActivo: boolean } | null>(null);
  const [modalComisionAbierto, setModalComisionAbierto] = useState(false);
  const [comForm, setComForm] = useState({ montoEstimado: 0, montoPagado: 0, estado: 'PENDIENTE', bloqueoActivo: false });
  const [comBusy, setComBusy] = useState(false);

  // Modal pagos de una inscripción (god-panel C)
  const [modalPagosAbierto, setModalPagosAbierto] = useState(false);
  const [inscPagos, setInscPagos] = useState<InscripcionData | null>(null);
  const [nuevoPago, setNuevoPago] = useState({ monto: '', metodoPago: 'EFECTIVO', estado: 'CONFIRMADO' });
  const [pagoBusy, setPagoBusy] = useState(false);

  useEffect(() => {
    loadData();
  }, [tournamentId, vistaActiva]);

  const loadData = async () => {
    if (!user?.roles?.includes('admin')) {
      setError('Solo administradores pueden acceder a esta sección');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      switch (vistaActiva) {
        case 'validacion':
          await loadValidacion();
          break;
        case 'inscripciones':
          await loadInscripciones();
          break;
        case 'partidos':
          await loadPartidos();
          break;
        case 'slots':
          await loadSlots();
          break;
        case 'sin-cancha':
          await loadPartidosSinCancha();
          break;
      }
    } catch (err: any) {
      console.error('Error cargando datos de auditoría:', err);
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadInscripciones = async () => {
    const params = new URLSearchParams();
    if (busqueda) params.append('busqueda', busqueda);
    if (filtroEstado) params.append('estado', filtroEstado);
    if (filtroCategoria) params.append('categoriaId', filtroCategoria);
    if (filtroSinPareja) params.append('sinPareja', 'true');
    if (filtroSinSlot) params.append('sinSlot', 'true');

    const { data } = await api.get(`/admin/auditoria/torneos/${tournamentId}/inscripciones?${params}`);
    if (data.success) {
      setInscripciones(data.data);
    }
    loadComision();
  };

  const loadPartidos = async () => {
    const params = new URLSearchParams();
    if (busqueda) params.append('busqueda', busqueda);
    if (filtroCategoria) params.append('categoriaId', filtroCategoria);
    if (filtroFase) params.append('fase', filtroFase);
    if (filtroSinProgramar) params.append('sinProgramar', 'true');
    if (filtroFinalizados) params.append('finalizados', 'true');

    const { data } = await api.get(`/admin/auditoria/torneos/${tournamentId}/partidos?${params}`);
    if (data.success) {
      setPartidos(data.data);
      
      // Extraer categorías y fases únicas para filtros
      const cats = [...new Map(data.data.map((p: PartidoData) => [p.categoria.id, p.categoria])).values()] as { id: string; nombre: string }[];
      setCategoriasDisponibles(cats);
      const fases = [...new Set(data.data.map((p: PartidoData) => p.fase))] as string[];
      setFasesDisponibles(fases);
    }
  };

  const cargarSlotsDisponibles = async (partido: PartidoData) => {
    setCargandoSlots(true);
    try {
      const { data } = await api.get(`/admin/canchas-sorteo/${tournamentId}/partidos/${partido.id}/slots-disponibles`);
      if (data.success) {
        setSlotsDisponibles(data.data.slotsValidos);
      }
    } catch (err) {
      console.error('Error cargando slots:', err);
    } finally {
      setCargandoSlots(false);
    }
  };

  const cambiarSlot = async () => {
    if (!partidoAEditar || !slotSeleccionado) return;
    
    try {
      await api.put(`/admin/canchas-sorteo/${tournamentId}/partidos/${partidoAEditar.id}/cambiar-slot`, {
        nuevoSlotId: slotSeleccionado,
      });
      
      setModalEditarAbierto(false);
      setPartidoAEditar(null);
      setSlotSeleccionado('');
      await loadPartidos();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Error al cambiar slot');
    }
  };

  const intercambiarSlots = async () => {
    if (!partidoAEditar || !partidoIntercambio) return;
    
    try {
      await api.put(`/admin/canchas-sorteo/${tournamentId}/intercambiar-slots`, {
        matchId1: partidoAEditar.id,
        matchId2: partidoIntercambio.id,
      });
      
      setPartidoIntercambio(null);
      await loadPartidos();
      showSuccess('Éxito', 'Slots intercambiados correctamente');
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Error al intercambiar');
    }
  };

  // ── God-panel: corregir QUIÉN juega un partido ──
  const abrirModalParejas = async (p: PartidoData) => {
    setPartidoParejas(p);
    setParejaLado1(p.inscripcion1Id || '');
    setParejaLado2(p.inscripcion2Id || '');
    try {
      const { data } = await api.get(`/admin/auditoria/torneos/${tournamentId}/inscripciones?categoriaId=${p.categoria.id}`);
      if (data.success) setInscCategoria(data.data);
    } catch {
      setInscCategoria([]);
    }
    setModalParejasAbierto(true);
  };

  const guardarParejas = async () => {
    if (!partidoParejas) return;
    if (parejaLado1 && parejaLado2 && parejaLado1 === parejaLado2) {
      showError('Parejas inválidas', 'No podés poner la misma pareja en los dos lados.');
      return;
    }
    setGuardandoParejas(true);
    try {
      await api.put(`/admin/auditoria/partidos/${partidoParejas.id}/corregir-parejas`, {
        inscripcion1Id: parejaLado1 || null,
        inscripcion2Id: parejaLado2 || null,
      });
      showSuccess('Listo', 'Parejas del partido actualizadas');
      setModalParejasAbierto(false);
      setPartidoParejas(null);
      await loadPartidos();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudieron cambiar las parejas');
    } finally {
      setGuardandoParejas(false);
    }
  };

  // ── God-panel: reprogramar un partido puntual (fecha/hora/cancha) ──
  const abrirModalReprogramar = async (p: PartidoData) => {
    setPartidoReprogramar(p);
    setReproFecha(p.programacion?.fecha || '');
    setReproHora(p.programacion?.hora || '');
    setReproCancha('');
    await cargarCanchasDisponibles();
    setModalReprogramarAbierto(true);
  };

  const guardarReprogramar = async () => {
    if (!partidoReprogramar) return;
    setGuardandoRepro(true);
    try {
      await api.put(`/admin/auditoria/partidos/${partidoReprogramar.id}/reprogramar`, {
        fecha: reproFecha,
        hora: reproHora,
        ...(reproCancha === '__none__'
          ? { torneoCanchaId: null }
          : reproCancha
            ? { torneoCanchaId: reproCancha }
            : {}),
      });
      showSuccess('Listo', 'Partido reprogramado');
      setModalReprogramarAbierto(false);
      setPartidoReprogramar(null);
      await loadPartidos();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo reprogramar');
    } finally {
      setGuardandoRepro(false);
    }
  };

  // Nombre legible de una pareja para los selectores
  const nombrePareja = (i: InscripcionData) =>
    `${i.pareja.jugador1}${i.pareja.completa ? ` / ${i.pareja.jugador2}` : ' (sin pareja)'}`;

  // ── God-panel: limpiar resultado (deshacer, en cascada) ──
  const limpiarResultadoPartido = async () => {
    if (!partidoALimpiar) return;
    setLimpiando(true);
    try {
      const { data } = await api.post(`/admin/auditoria/partidos/${partidoALimpiar.id}/limpiar-resultado`);
      showSuccess('Resultado limpiado', `${data.partidosAfectados} partido(s) volvieron a "sin resultado".`);
      setModalLimpiarAbierto(false);
      setPartidoALimpiar(null);
      await loadPartidos();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo limpiar el resultado');
    } finally {
      setLimpiando(false);
    }
  };

  const partidoTieneResultado = (p: PartidoData) =>
    !!p.resultado || ['FINALIZADO', 'WO', 'RETIRADO', 'DESCALIFICADO'].includes(p.estado);

  // ── God-panel B: mover inscripción de categoría ──
  const abrirModalMover = async (insc: InscripcionData) => {
    setInscMover(insc);
    setCatDestino('');
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/categorias`);
      if (data.success) {
        setCatsTorneo((data.categorias || []).map((c: any) => ({ categoryId: c.categoryId, nombre: c.nombre || c.category?.nombre || '' })));
      }
    } catch {
      setCatsTorneo([]);
    }
    setModalMoverAbierto(true);
  };

  const guardarMover = async () => {
    if (!inscMover || !catDestino) return;
    setMoviendo(true);
    try {
      await api.patch(`/admin/auditoria/inscripciones/${inscMover.id}/categoria`, { categoryId: catDestino });
      showSuccess('Listo', 'Inscripción movida de categoría');
      setModalMoverAbierto(false);
      setInscMover(null);
      await loadInscripciones();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo mover');
    } finally {
      setMoviendo(false);
    }
  };

  // ── God-panel B: editar/corregir jugadores de una inscripción ──
  const abrirModalJugadores = (insc: InscripcionData) => {
    setInscJugadores(insc);
    setJ1Form({ nombre: insc.pareja.j1?.nombre || '', apellido: insc.pareja.j1?.apellido || '', telefono: insc.pareja.j1?.telefono || '', documento: insc.pareja.j1?.documento || '' });
    setJ2Form({ nombre: insc.pareja.j2?.nombre || '', apellido: insc.pareja.j2?.apellido || '', telefono: insc.pareja.j2?.telefono || '', documento: insc.pareja.j2?.documento || '' });
    setBuscarSlot(null);
    setBusquedaJug('');
    setResultadosJug([]);
    setModalJugadoresAbierto(true);
  };

  const guardarJugador = async (slot: 1 | 2) => {
    const insc = inscJugadores;
    const j = slot === 1 ? insc?.pareja.j1 : insc?.pareja.j2;
    if (!insc || !j) return;
    setGuardandoJ(true);
    try {
      await api.patch(`/admin/auditoria/jugadores/${j.id}`, slot === 1 ? j1Form : j2Form);
      showSuccess('Listo', 'Datos del jugador actualizados');
      await loadInscripciones();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo guardar');
    } finally {
      setGuardandoJ(false);
    }
  };

  const buscarJugadores = async (q: string) => {
    setBusquedaJug(q);
    if (q.trim().length < 2) { setResultadosJug([]); return; }
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/jugadores/buscar?q=${encodeURIComponent(q)}`);
      if (data.success) setResultadosJug(data.jugadores || []);
    } catch {
      setResultadosJug([]);
    }
  };

  const seleccionarJugador = async (slot: 1 | 2, u: { id: string; documento?: string }) => {
    const insc = inscJugadores;
    if (!insc) return;
    setGuardandoJ(true);
    try {
      const body = slot === 1 ? { jugador1Id: u.id } : { jugador2Id: u.id, jugador2Documento: u.documento };
      await api.patch(`/admin/auditoria/inscripciones/${insc.id}/pareja`, body);
      showSuccess('Listo', 'Pareja actualizada');
      setModalJugadoresAbierto(false);
      setInscJugadores(null);
      await loadInscripciones();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo cambiar la pareja');
    } finally {
      setGuardandoJ(false);
    }
  };

  const quitarJugador2 = async () => {
    const insc = inscJugadores;
    if (!insc) return;
    setGuardandoJ(true);
    try {
      await api.patch(`/admin/auditoria/inscripciones/${insc.id}/pareja`, { jugador2Id: null });
      showSuccess('Listo', 'Pareja dejada pendiente');
      setModalJugadoresAbierto(false);
      setInscJugadores(null);
      await loadInscripciones();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo quitar');
    } finally {
      setGuardandoJ(false);
    }
  };

  // ── God-panel C: comisión del torneo ──
  const loadComision = async () => {
    try {
      const { data } = await api.get(`/admin/auditoria/torneos/${tournamentId}/comision`);
      if (data.success) setComision(data.comision);
    } catch {
      setComision(null);
    }
  };

  const abrirModalComision = () => {
    if (comision) {
      setComForm({ montoEstimado: comision.montoEstimado, montoPagado: comision.montoPagado, estado: comision.estado, bloqueoActivo: comision.bloqueoActivo });
    }
    setModalComisionAbierto(true);
  };

  const guardarComision = async () => {
    setComBusy(true);
    try {
      await api.patch(`/admin/auditoria/torneos/${tournamentId}/comision`, comForm);
      showSuccess('Listo', 'Comisión actualizada');
      setModalComisionAbierto(false);
      await loadComision();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo ajustar la comisión');
    } finally {
      setComBusy(false);
    }
  };

  // ── God-panel C: pagos de una inscripción ──
  const abrirModalPagos = (insc: InscripcionData) => {
    setInscPagos(insc);
    setNuevoPago({ monto: '', metodoPago: 'EFECTIVO', estado: 'CONFIRMADO' });
    setModalPagosAbierto(true);
  };

  // Actualiza los pagos del modal localmente (sin recargar toda la tabla en vivo)
  const setPagosLocal = (updater: (ps: InscripcionData['pagos']) => InscripcionData['pagos']) =>
    setInscPagos((prev) => (prev ? { ...prev, pagos: updater(prev.pagos) } : prev));

  const marcarPago = async (pagoId: string, estado: string) => {
    setPagoBusy(true);
    try {
      await api.patch(`/admin/auditoria/pagos/${pagoId}`, { estado });
      setPagosLocal((ps) => ps.map((p) => (p.id === pagoId ? { ...p, estado } : p)));
      loadInscripciones();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo actualizar el pago');
    } finally {
      setPagoBusy(false);
    }
  };

  const guardarPago = async (pago: InscripcionData['pagos'][number]) => {
    setPagoBusy(true);
    try {
      await api.patch(`/admin/auditoria/pagos/${pago.id}`, {
        monto: Number(pago.monto) || 0,
        metodoPago: pago.metodo,
        estado: pago.estado,
      });
      showSuccess('Listo', 'Pago actualizado');
      loadInscripciones();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo guardar el pago');
    } finally {
      setPagoBusy(false);
    }
  };

  const eliminarPago = async (pagoId: string) => {
    setPagoBusy(true);
    try {
      await api.delete(`/admin/auditoria/pagos/${pagoId}`);
      setPagosLocal((ps) => ps.filter((p) => p.id !== pagoId));
      loadInscripciones();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo eliminar el pago');
    } finally {
      setPagoBusy(false);
    }
  };

  const agregarPago = async () => {
    if (!inscPagos || !nuevoPago.monto) return;
    setPagoBusy(true);
    try {
      const { data } = await api.post(`/admin/auditoria/inscripciones/${inscPagos.id}/pagos`, {
        monto: Number(nuevoPago.monto),
        metodoPago: nuevoPago.metodoPago,
        estado: nuevoPago.estado,
      });
      setPagosLocal((ps) => [...ps, { id: data.pago.id, estado: nuevoPago.estado, monto: Number(nuevoPago.monto), metodo: nuevoPago.metodoPago, fecha: data.pago.fechaPago || '' }]);
      setNuevoPago({ monto: '', metodoPago: 'EFECTIVO', estado: 'CONFIRMADO' });
      showSuccess('Listo', 'Pago agregado');
      loadInscripciones();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo agregar el pago');
    } finally {
      setPagoBusy(false);
    }
  };

  const loadSlots = async () => {
    const params = new URLSearchParams();
    if (busqueda) params.append('fecha', busqueda);

    const { data } = await api.get(`/admin/auditoria/torneos/${tournamentId}/slots?${params}`);
    if (data.success) {
      setSlotsData(data.data);
      setStats(data.stats);
    }
  };

  const loadPartidosSinCancha = async () => {
    // Traer todos los partidos y filtrar los que tienen fecha pero no cancha
    const { data } = await api.get(`/admin/auditoria/torneos/${tournamentId}/partidos`);
    if (data.success) {
      const sinCancha = data.data.filter((p: PartidoData) => 
        p.programacion?.fecha && !p.programacion?.cancha
      );
      setPartidosSinCancha(sinCancha);
    }
  };

  const loadValidacion = async () => {
    const { data } = await api.get(`/admin/canchas-sorteo/${tournamentId}/auditar`);
    if (data.success) {
      setValidacionData(data.data);
    }
  };

  const cargarCanchasDisponibles = async () => {
    const { data } = await api.get(`/admin/canchas-sorteo/${tournamentId}/canchas`);
    if (data.success) {
      setCanchasDisponibles(data.canchas || []);
    }
  };

  const abrirModalAsignar = async (partido: PartidoData) => {
    setPartidoSeleccionado(partido);
    await cargarCanchasDisponibles();
    setCanchaSeleccionada('');
    setModalAsignarAbierto(true);
  };

  const asignarCancha = async () => {
    if (!partidoSeleccionado || !canchaSeleccionada) return;
    
    setAsignando(true);
    try {
      await api.put(`/admin/auditoria/partidos/${partidoSeleccionado.id}/asignar-cancha`, {
        torneoCanchaId: canchaSeleccionada,
        fecha: partidoSeleccionado.programacion?.fecha,
        hora: partidoSeleccionado.programacion?.hora,
      });
      
      setModalAsignarAbierto(false);
      setPartidoSeleccionado(null);
      setCanchaSeleccionada('');
      
      // Recargar la lista
      await loadPartidosSinCancha();
    } catch (err: any) {
      console.error('Error asignando cancha:', err);
      showError('Error', err.response?.data?.message || 'Error al asignar cancha');
    } finally {
      setAsignando(false);
    }
  };

  const handleExportar = () => {
    let csv = '';
    let filename = '';

    if (vistaActiva === 'inscripciones') {
      filename = `auditoria-inscripciones-${tournamentId}.csv`;
      csv = 'ID,Estado,Jugador 1,Jugador 2,Categoría,Pago,Slots\n';
      inscripciones.forEach((i) => {
        csv += `${i.id},${i.estado},${i.pareja.jugador1},${i.pareja.jugador2},${i.categoria.nombre},${i.pagos.length > 0 ? 'Sí' : 'No'},${i.programacion.length}\n`;
      });
    } else if (vistaActiva === 'partidos') {
      filename = `auditoria-partidos-${tournamentId}.csv`;
      csv = 'ID,Fase,Categoría,Pareja 1,Pareja 2,Fecha,Hora,Cancha,Estado\n';
      partidos.forEach((p) => {
        csv += `${p.id},${p.fase},${p.categoria.nombre},${p.pareja1},${p.pareja2},${p.programacion?.fecha || ''},${p.programacion?.hora || ''},${p.programacion?.cancha || ''},${p.estado}\n`;
      });
    }

    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }
  };

  const abrirModalEliminar = (insc: InscripcionData) => {
    setInscripcionAEliminar(insc);
    setModalEliminarAbierto(true);
  };

  const abrirModalCambiarEstado = (insc: InscripcionData) => {
    setInscripcionACambiarEstado(insc);
    setNuevoEstado(insc.estado);
    setModalCambiarEstadoAbierto(true);
  };

  const cambiarEstadoInscripcion = async () => {
    if (!inscripcionACambiarEstado || !nuevoEstado) return;
    
    setCambiandoEstado(true);
    try {
      await api.patch(`/admin/auditoria/inscripciones/${inscripcionACambiarEstado.id}/estado`, {
        estado: nuevoEstado,
      });
      
      setModalCambiarEstadoAbierto(false);
      setInscripcionACambiarEstado(null);
      setNuevoEstado('');
      
      showSuccess('Éxito', 'Estado de inscripción actualizado correctamente');
      await loadInscripciones();
    } catch (err: any) {
      console.error('Error cambiando estado:', err);
      showError('Error', err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setCambiandoEstado(false);
    }
  };

  const eliminarInscripcion = async () => {
    if (!inscripcionAEliminar) return;
    
    setEliminando(true);
    try {
      await api.delete(`/admin/auditoria/inscripciones/${inscripcionAEliminar.id}`);
      
      setModalEliminarAbierto(false);
      setInscripcionAEliminar(null);
      
      // Recargar la lista
      await loadInscripciones();
    } catch (err: any) {
      console.error('Error eliminando inscripción:', err);
      showError('Error', err.response?.data?.message || 'Error al eliminar inscripción');
    } finally {
      setEliminando(false);
    }
  };

  // Mensaje para el modal de confirmación
  const getMensajeEliminar = () => {
    if (!inscripcionAEliminar) return '';
    const pareja = `${inscripcionAEliminar.pareja.jugador1} / ${inscripcionAEliminar.pareja.completa ? inscripcionAEliminar.pareja.jugador2 : 'Sin pareja'}`;
    const categoria = inscripcionAEliminar.categoria.nombre;
    
    if (inscripcionAEliminar.programacion.length > 0) {
      return `La pareja "${pareja}" de la categoría "${categoria}" tiene ${inscripcionAEliminar.programacion.length} partido(s) programado(s). Debes eliminar los partidos del bracket primero.`;
    }
    
    return `¿Estás seguro de que deseas eliminar la inscripción de "${pareja}" en la categoría "${categoria}"? Esta acción no se puede deshacer y la pareja perderá su lugar en el torneo.`;
  };

  const getEstadoBadge = (estado: string) => {
    const colores: Record<string, string> = {
      CONFIRMADA: 'bg-green-500/20 text-green-400',
      PENDIENTE_PAGO: 'bg-yellow-500/20 text-yellow-400',
      PENDIENTE_CONFIRMACION: 'bg-orange-500/20 text-orange-400',
      CANCELADA: 'bg-red-500/20 text-red-400',
      PROGRAMADO: 'bg-blue-500/20 text-blue-400',
      FINALIZADO: 'bg-green-500/20 text-green-400',
      EN_JUEGO: 'bg-purple-500/20 text-purple-400',
      LIBRE: 'bg-green-500/20 text-green-400',
      OCUPADO: 'bg-red-500/20 text-red-400',
    };
    return colores[estado] || 'bg-gray-500/20 text-gray-400';
  };

  const tabs = [
    { id: 'validacion', label: 'Validación', icon: Shield },
    { id: 'partidos', label: 'Partidos', icon: Trophy },
    { id: 'sin-cancha', label: 'Partidos SIN Canchas', icon: AlertCircle },
    { id: 'inscripciones', label: 'Inscripciones', icon: Users },
    { id: 'slots', label: 'Slots', icon: Calendar },
  ] as const;

  if (!user?.roles?.includes('admin')) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Acceso Restringido</h3>
        <p className="text-white/60">Solo administradores pueden acceder a la auditoría de datos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#df2531]" />
          <h2 className="text-lg font-semibold text-white">Auditoría de Datos</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportar}
            disabled={vistaActiva === 'slots'}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#df2531]/20 hover:bg-[#df2531]/30 text-[#df2531] rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setVistaActiva(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              vistaActiva === tab.id
                ? 'bg-[#df2531] text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder={
                  vistaActiva === 'slots' 
                    ? 'Buscar por fecha (YYYY-MM-DD)...' 
                    : 'Buscar por nombre...'
                }
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#df2531]/50"
              />
            </div>
          </div>

          {/* Filtros específicos por vista */}
          {vistaActiva === 'inscripciones' && (
            <>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#df2531]/50"
              >
                <option value="" className="bg-[#1a1d29]">Todos los estados</option>
                <option value="CONFIRMADA" className="bg-[#1a1d29]">Confirmada</option>
                <option value="PENDIENTE_PAGO" className="bg-[#1a1d29]">Pendiente Pago</option>
                <option value="PENDIENTE_CONFIRMACION" className="bg-[#1a1d29]">Pendiente Confirmación</option>
                <option value="CANCELADA" className="bg-[#1a1d29]">Cancelada</option>
              </select>
              <label className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm cursor-pointer hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={filtroSinPareja}
                  onChange={(e) => setFiltroSinPareja(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                />
                Sin pareja
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm cursor-pointer hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={filtroSinSlot}
                  onChange={(e) => setFiltroSinSlot(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                />
                Sin slot
              </label>
            </>
          )}

          {vistaActiva === 'partidos' && (
            <>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#df2531]/50"
              >
                <option value="" className="bg-[#1a1d29]">Todas las categorías</option>
                {categoriasDisponibles.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#1a1d29]">{cat.nombre}</option>
                ))}
              </select>
              <select
                value={filtroFase}
                onChange={(e) => setFiltroFase(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#df2531]/50"
              >
                <option value="" className="bg-[#1a1d29]">Todas las fases</option>
                {fasesDisponibles.map((fase) => (
                  <option key={fase} value={fase} className="bg-[#1a1d29]">{fase}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm cursor-pointer hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={filtroSinProgramar}
                  onChange={(e) => setFiltroSinProgramar(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                />
                Sin programar
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm cursor-pointer hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={filtroFinalizados}
                  onChange={(e) => setFiltroFinalizados(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                />
                Finalizados
              </label>
            </>
          )}

          <button
            onClick={() => {
              setBusqueda('');
              setFiltroEstado('');
              setFiltroCategoria('');
              setFiltroSinPareja(false);
              setFiltroSinSlot(false);
              setFiltroSinProgramar(false);
              setFiltroFinalizados(false);
              loadData();
            }}
            className="px-3 py-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
          />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white/60">{error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={vistaActiva}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Vista Validación */}
            {vistaActiva === 'validacion' && (
              <div className="space-y-4">
                {/* Resumen de problemas */}
                {validacionData && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5 text-center">
                      <div className="text-white/40 text-sm mb-1">Total Problemas</div>
                      <div className="text-2xl font-bold text-white">{validacionData.resumen.totalProblemas}</div>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20 text-center">
                      <div className="text-red-400 text-sm mb-1">Críticos</div>
                      <div className="text-2xl font-bold text-red-500">{validacionData.resumen.criticos}</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20 text-center">
                      <div className="text-yellow-400 text-sm mb-1">Advertencias</div>
                      <div className="text-2xl font-bold text-yellow-500">{validacionData.resumen.advertencias}</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 text-center">
                      <div className="text-blue-400 text-sm mb-1">Categorías</div>
                      <div className="text-2xl font-bold text-blue-500">{validacionData.resumen.totalCategorias}</div>
                    </div>
                  </div>
                )}

                {/* Lista de problemas */}
                {validacionData?.problemas.length === 0 ? (
                  <div className="bg-green-500/10 rounded-lg border border-green-500/20 p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">¡Todo está correcto!</h3>
                    <p className="text-white/60">No se encontraron problemas en el fixture.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {validacionData?.problemas.map((problema) => (
                      <div 
                        key={problema.id}
                        className={`bg-white/[0.02] rounded-lg border p-4 ${
                          problema.tipo === 'CRITICO' ? 'border-red-500/30' : 
                          problema.tipo === 'ADVERTENCIA' ? 'border-yellow-500/30' : 
                          'border-blue-500/30'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icono de severidad */}
                          <div className={`p-2 rounded-lg ${
                            problema.tipo === 'CRITICO' ? 'bg-red-500/20' : 
                            problema.tipo === 'ADVERTENCIA' ? 'bg-yellow-500/20' : 
                            'bg-blue-500/20'
                          }`}>
                            {problema.tipo === 'CRITICO' ? (
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                            ) : problema.tipo === 'ADVERTENCIA' ? (
                              <AlertCircle className="w-5 h-5 text-yellow-400" />
                            ) : (
                              <Info className="w-5 h-5 text-blue-400" />
                            )}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                problema.tipo === 'CRITICO' ? 'bg-red-500/20 text-red-400' : 
                                problema.tipo === 'ADVERTENCIA' ? 'bg-yellow-500/20 text-yellow-400' : 
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {problema.tipo}
                              </span>
                              <span className="text-white/40 text-sm">{problema.categoria}</span>
                            </div>
                            <h4 className="text-white font-medium mb-1">{problema.mensaje}</h4>
                            <p className="text-white/60 text-sm mb-2">{problema.detalle}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <Wrench className="w-4 h-4 text-[#df2531]" />
                              <span className="text-white/80">{problema.accionRecomendada}</span>
                            </div>
                          </div>

                          {/* Botón de acción */}
                          {problema.tipo === 'CRITICO' && (
                            <button
                              onClick={() => {
                                // Navegar a la categoría para re-sortear
                                showWarning('Re-sortear', `Re-sortear categoría: ${problema.categoria}`);
                              }}
                              className="px-4 py-2 bg-[#df2531] hover:bg-[#df2531]/80 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                              Re-sortear
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vista Partidos SIN Cancha */}
            {vistaActiva === 'sin-cancha' && (
              <div className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-white/60 text-sm">Total: <strong className="text-white">{partidosSinCancha.length}</strong> partidos sin cancha asignada</span>
                    <p className="text-white/40 text-xs mt-1">Estos partidos tienen fecha y hora programada pero necesitan una cancha asignada</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/40 border-b border-white/5 bg-white/[0.02]">
                        <th className="text-left py-3 px-4">Fase</th>
                        <th className="text-left py-3 px-4">Categoría</th>
                        <th className="text-left py-3 px-4">Pareja 1</th>
                        <th className="text-left py-3 px-4">Pareja 2</th>
                        <th className="text-left py-3 px-4">Fecha y Hora</th>
                        <th className="text-left py-3 px-4">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidosSinCancha.map((p) => (
                        <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <span className="text-white font-medium">{p.fase}</span>
                            {p.esBye && (
                              <span className="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">BYE</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-white">{p.categoria.nombre}</td>
                          <td className="py-3 px-4">
                            <span className={p.inscripcion1Id ? 'text-white' : 'text-white/40'}>
                              {p.pareja1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={p.inscripcion2Id ? 'text-white' : 'text-white/40'}>
                              {p.pareja2}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="text-white">{p.programacion?.fecha ? formatDatePY(p.programacion.fecha) : ''} {p.programacion?.hora}</div>
                              <div className="text-yellow-400 text-xs flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3" />
                                Sin cancha asignada
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => abrirModalAsignar(p)}
                              className="px-3 py-1.5 bg-[#df2531]/20 hover:bg-[#df2531]/30 text-[#df2531] rounded-lg text-xs font-medium transition-colors"
                            >
                              Asignar cancha
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {partidosSinCancha.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-white">Todos los partidos tienen cancha asignada</p>
                    <p className="text-white/40 text-sm mt-1">No hay partidos pendientes</p>
                  </div>
                )}
              </div>
            )}

            {/* Vista Inscripciones */}
            {vistaActiva === 'inscripciones' && (
              <div className="space-y-4">
              {/* Comisión del torneo (god-panel C) */}
              {comision && (
                <div className="bg-white/[0.02] rounded-lg border border-white/5 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Comisión del torneo</span>
                    </div>
                    <span className="text-white/60 text-sm">Estimado: <strong className="text-white">Gs. {comision.montoEstimado.toLocaleString('es-PY')}</strong></span>
                    <span className="text-white/60 text-sm">Pagado: <strong className="text-white">Gs. {comision.montoPagado.toLocaleString('es-PY')}</strong></span>
                    <span className={`text-xs px-2 py-0.5 rounded ${comision.estado === 'PAGADO' ? 'bg-green-500/20 text-green-400' : comision.estado === 'PARCIAL' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/60'}`}>{comision.estado}</span>
                    {comision.bloqueoActivo && <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">Bloqueo activo</span>}
                  </div>
                  <button
                    onClick={abrirModalComision}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
                  >
                    <Edit3 className="w-4 h-4" /> Ajustar
                  </button>
                </div>
              )}
              <div className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-white/60 text-sm">Total: <strong className="text-white">{inscripciones.length}</strong> inscripciones</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/40 border-b border-white/5 bg-white/[0.02]">
                        <th className="text-left py-3 px-4">Pareja</th>
                        <th className="text-left py-3 px-4">Categoría</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Pagos</th>
                        <th className="text-left py-3 px-4">Programación</th>
                        <th className="text-left py-3 px-4">Notas</th>
                        <th className="text-left py-3 px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inscripciones.map((insc) => (
                        <tr key={insc.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="text-white font-medium">{insc.pareja.jugador1}</div>
                              {insc.pareja.completa ? (
                                <div className="text-white/60">{insc.pareja.jugador2}</div>
                              ) : (
                                <div className="text-yellow-400 text-xs flex items-center gap-1">
                                  <UserX className="w-3 h-3" />
                                  Sin pareja
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white">{insc.categoria.nombre}</span>
                            <span className="text-white/40 text-xs ml-2">({insc.categoria.genero})</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${getEstadoBadge(insc.estado)}`}>
                              {insc.estado.replace(/_/g, ' ')}
                            </span>
                            {insc.estadoClasificacion && (
                              <div className="text-white/40 text-xs mt-1">
                                {insc.estadoClasificacion} {insc.rondaClasificacion && `- ${insc.rondaClasificacion}`}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {insc.pagos.length > 0 ? (
                              <div className="space-y-1">
                                {insc.pagos.map((p) => (
                                  <div key={p.id} className="text-xs">
                                    <span className={`px-1.5 py-0.5 rounded ${getEstadoBadge(p.estado)}`}>
                                      {p.estado}
                                    </span>
                                    <span className="text-white/60 ml-2">Gs. {Number(p.monto).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-white/40 text-xs">Sin pagos</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {insc.programacion.length > 0 ? (
                              <div className="space-y-1">
                                {insc.programacion.slice(0, 2).map((p, idx) => (
                                  <div key={idx} className="text-xs text-white/60">
                                    <span className="text-white">{p.fase}</span> - {p.fecha ? formatDatePY(p.fecha) : 'Sin fecha'} {p.hora}
                                  </div>
                                ))}
                                {insc.programacion.length > 2 && (
                                  <div className="text-xs text-white/40">+{insc.programacion.length - 2} más</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-yellow-400 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Sin slot
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white/40 text-xs truncate max-w-[150px] block">
                              {insc.notas || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => abrirModalJugadores(insc)}
                                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                                title="Editar / corregir jugadores"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => abrirModalMover(insc)}
                                className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                                title="Mover de categoría"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => abrirModalPagos(insc)}
                                className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                                title="Pagos"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => abrirModalCambiarEstado(insc)}
                                className="p-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
                                title="Cambiar estado (emergencia)"
                              >
                                <Wrench className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => abrirModalEliminar(insc)}
                                className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                title="Eliminar inscripción"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {inscripciones.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">No hay inscripciones</p>
                  </div>
                )}
              </div>
              </div>
            )}

            {/* Vista Partidos */}
            {vistaActiva === 'partidos' && (
              <div className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-white/60 text-sm">Total: <strong className="text-white">{partidos.length}</strong> partidos</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/40 border-b border-white/5 bg-white/[0.02]">
                        <th className="text-left py-3 px-4">Fase</th>
                        <th className="text-left py-3 px-4">Categoría</th>
                        <th className="text-left py-3 px-4">Pareja 1</th>
                        <th className="text-left py-3 px-4">Pareja 2</th>
                        <th className="text-left py-3 px-4">Programación</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Resultado</th>
                        <th className="text-left py-3 px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidos.map((p) => (
                        <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <span className="text-white font-medium">{p.fase}</span>
                            {p.esBye && (
                              <span className="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">BYE</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-white">{p.categoria.nombre}</td>
                          <td className="py-3 px-4">
                            <span className={p.inscripcion1Id ? 'text-white' : 'text-white/40'}>
                              {p.pareja1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={p.inscripcion2Id ? 'text-white' : 'text-white/40'}>
                              {p.pareja2}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {p.estaProgramado ? (
                              <div className="text-sm">
                                <div className="text-white">{p.programacion?.fecha ? formatDatePY(p.programacion.fecha) : ''} {p.programacion?.hora}</div>
                                <div className="text-white/40 text-xs">{p.programacion?.cancha} - {p.programacion?.sede}</div>
                              </div>
                            ) : (
                              <span className="text-yellow-400 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Sin programar
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${getEstadoBadge(p.estado)}`}>
                              {p.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {p.resultado ? (
                              <div className="text-sm">
                                <div className="text-white">{p.resultado.set1}</div>
                                {p.resultado.set2 && <div className="text-white/60">{p.resultado.set2}</div>}
                                {p.resultado.set3 && <div className="text-white/60">{p.resultado.set3}</div>}
                              </div>
                            ) : (
                              <span className="text-white/40 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setPartidoAEditar(p);
                                  cargarSlotsDisponibles(p);
                                  setModalEditarAbierto(true);
                                }}
                                className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                                title="Cambiar slot"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (partidoIntercambio && partidoIntercambio.id === p.id) {
                                    setPartidoIntercambio(null);
                                  } else if (partidoIntercambio) {
                                    if (confirm(`¿Intercambiar slots entre ${partidoIntercambio.pareja1} vs ${p.pareja1}?`)) {
                                      setPartidoAEditar(partidoIntercambio);
                                      intercambiarSlots();
                                      setPartidoIntercambio(null);
                                    }
                                  } else {
                                    setPartidoIntercambio(p);
                                  }
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  partidoIntercambio?.id === p.id
                                    ? 'bg-[#df2531] text-white'
                                    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                                }`}
                                title={partidoIntercambio?.id === p.id ? 'Cancelar' : 'Intercambiar slot'}
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              {/* Reprogramar puntual (fecha/hora/cancha) */}
                              <button
                                onClick={() => abrirModalReprogramar(p)}
                                className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
                                title="Reprogramar (fecha/hora/cancha)"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                              {/* Corregir parejas: solo si el partido no tiene resultado todavía */}
                              {!partidoTieneResultado(p) && (
                                <button
                                  onClick={() => abrirModalParejas(p)}
                                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                                  title="Corregir parejas (quién juega)"
                                >
                                  <Users className="w-4 h-4" />
                                </button>
                              )}
                              {/* Limpiar resultado (deshacer, en cascada): solo si tiene resultado */}
                              {partidoTieneResultado(p) && (
                                <button
                                  onClick={() => { setPartidoALimpiar(p); setModalLimpiarAbierto(true); }}
                                  className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                  title="Limpiar resultado (deshacer)"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {partidos.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">No hay partidos</p>
                  </div>
                )}
              </div>
            )}

            {/* Vista Slots */}
            {vistaActiva === 'slots' && (
              <div className="space-y-4">
                {/* Stats */}
                {stats && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5 text-center">
                      <div className="text-white/40 text-xs mb-1">Total Slots</div>
                      <div className="text-xl font-bold text-white">{stats.total}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5 text-center">
                      <div className="text-white/40 text-xs mb-1">Ocupados</div>
                      <div className="text-xl font-bold text-green-400">{stats.ocupados}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5 text-center">
                      <div className="text-white/40 text-xs mb-1">Libres</div>
                      <div className="text-xl font-bold text-white">{stats.libres}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5 text-center">
                      <div className="text-white/40 text-xs mb-1">Ocupación</div>
                      <div className="text-xl font-bold text-[#df2531]">{stats.porcentajeOcupacion}%</div>
                    </div>
                  </div>
                )}

                {/* Slots por día */}
                {slotsData.map((dia) => (
                  <div key={dia.fecha} className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#df2531]" />
                        <span className="text-white font-medium">{formatDatePYLong(dia.fecha)}</span>
                        <span className="text-white/40 text-sm">{dia.horaInicio} - {dia.horaFin}</span>
                      </div>
                      <span className="text-white/40 text-sm">{dia.slots.length} slots</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-white/40 border-b border-white/5">
                            <th className="text-left py-2 px-4">Hora</th>
                            <th className="text-left py-2 px-4">Cancha</th>
                            <th className="text-left py-2 px-4">Estado</th>
                            <th className="text-left py-2 px-4">Ocupado por</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dia.slots.map((slot) => (
                            <tr key={slot.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                              <td className="py-2 px-4 text-white">{slot.horaInicio} - {slot.horaFin}</td>
                              <td className="py-2 px-4">
                                <span className="text-white">{slot.cancha?.nombre || 'N/A'}</span>
                                {slot.cancha?.sede && (
                                  <span className="text-white/40 text-xs ml-2">({slot.cancha.sede})</span>
                                )}
                              </td>
                              <td className="py-2 px-4">
                                <span className={`px-2 py-1 rounded text-xs ${getEstadoBadge(slot.estado)}`}>
                                  {slot.estado}
                                </span>
                              </td>
                              <td className="py-2 px-4">
                                {slot.ocupadoPor ? (
                                  <div className="text-sm">
                                    <div className="text-white/60 text-xs">{slot.ocupadoPor.categoria} - {slot.ocupadoPor.fase}</div>
                                    <div className="text-white truncate max-w-[300px]">{slot.ocupadoPor.pareja1} vs {slot.ocupadoPor.pareja2}</div>
                                  </div>
                                ) : (
                                  <span className="text-white/40 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {slotsData.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">No hay slots configurados</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Modal Asignar Cancha */}
      {modalAsignarAbierto && partidoSeleccionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-xl border border-white/10 w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Asignar Cancha</h3>
              <button
                onClick={() => setModalAsignarAbierto(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Info del partido */}
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <p className="text-white/60">Fase: <span className="text-white">{partidoSeleccionado.fase}</span></p>
                <p className="text-white/60">Categoría: <span className="text-white">{partidoSeleccionado.categoria.nombre}</span></p>
                <p className="text-white/60 mt-2">Fecha: <span className="text-white">{partidoSeleccionado.programacion?.fecha ? formatDatePY(partidoSeleccionado.programacion.fecha) : ''}</span></p>
                <p className="text-white/60">Hora: <span className="text-white">{partidoSeleccionado.programacion?.hora}</span></p>
              </div>

              {/* Selector de cancha */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Seleccionar Cancha</label>
                <select
                  value={canchaSeleccionada}
                  onChange={(e) => setCanchaSeleccionada(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  <option value="" className="bg-[#1a1a2e]">Seleccionar...</option>
                  {canchasDisponibles.map((cancha) => (
                    <option key={cancha.id} value={cancha.id} className="bg-[#1a1a2e]">
                      {cancha.nombre} - {cancha.sede}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2">
              <button
                onClick={() => setModalAsignarAbierto(false)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={asignarCancha}
                disabled={!canchaSeleccionada || asignando}
                className="flex-1 px-4 py-2 bg-[#df2531] hover:bg-[#df2531]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {asignando ? 'Asignando...' : 'Asignar Cancha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Slot */}
      {modalEditarAbierto && partidoAEditar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-xl border border-white/10 w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Cambiar Slot</h3>
              <button
                onClick={() => {
                  setModalEditarAbierto(false);
                  setPartidoAEditar(null);
                  setSlotSeleccionado('');
                }}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Info del partido actual */}
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <p className="text-white/60">Fase: <span className="text-white font-medium">{partidoAEditar.fase}</span></p>
                <p className="text-white/60">Categoría: <span className="text-white">{partidoAEditar.categoria.nombre}</span></p>
                <p className="text-white/60">Parejas: <span className="text-white">{partidoAEditar.pareja1} vs {partidoAEditar.pareja2}</span></p>
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-white/60">Slot actual:</p>
                  <p className="text-white">
                    {partidoAEditar.programacion?.fecha ? formatDatePY(partidoAEditar.programacion.fecha) : 'Sin fecha'} 
                    {' '}{partidoAEditar.programacion?.hora || ''}
                    {partidoAEditar.programacion?.cancha && ` - ${partidoAEditar.programacion.cancha}`}
                  </p>
                </div>
              </div>

              {/* Lista de slots disponibles */}
              <div>
                <label className="block text-white/60 text-sm mb-2">
                  Slots Disponibles ({slotsDisponibles.length} válidos)
                </label>
                
                {cargandoSlots ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-[#df2531] border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : slotsDisponibles.length === 0 ? (
                  <p className="text-yellow-400 text-sm">No hay slots disponibles que cumplan las restricciones</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {slotsDisponibles.map((slot) => (
                      <label
                        key={slot.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          slotSeleccionado === slot.id
                            ? 'bg-[#df2531]/20 border-[#df2531]/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="slot"
                          value={slot.id}
                          checked={slotSeleccionado === slot.id}
                          onChange={() => setSlotSeleccionado(slot.id)}
                          className="w-4 h-4 text-[#df2531] bg-white/5 border-white/20"
                        />
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            {formatDatePY(slot.disponibilidad.fecha)} {slot.horaInicio} - {slot.horaFin}
                          </p>
                          <p className="text-white/40 text-xs">{slot.torneoCancha.sedeCancha.nombre}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Intercambio rápido */}
              {partidoIntercambio && partidoIntercambio.id !== partidoAEditar.id && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                  <p className="text-purple-400 text-sm mb-2">Intercambio seleccionado:</p>
                  <p className="text-white text-sm">{partidoIntercambio.pareja1} vs {partidoIntercambio.pareja2}</p>
                  <p className="text-white/60 text-xs">
                    {partidoIntercambio.programacion?.fecha ? formatDatePY(partidoIntercambio.programacion.fecha) : ''} {partidoIntercambio.programacion?.hora}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2">
              <button
                onClick={() => {
                  setModalEditarAbierto(false);
                  setPartidoAEditar(null);
                  setSlotSeleccionado('');
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              {partidoIntercambio && partidoIntercambio.id !== partidoAEditar.id ? (
                <button
                  onClick={intercambiarSlots}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-500/80 text-white rounded-lg transition-colors"
                >
                  Intercambiar
                </button>
              ) : (
                <button
                  onClick={cambiarSlot}
                  disabled={!slotSeleccionado || cargandoSlots}
                  className="flex-1 px-4 py-2 bg-[#df2531] hover:bg-[#df2531]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Cambiar Slot
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Inscripción */}
      <ConfirmModal
        isOpen={modalEliminarAbierto}
        onClose={() => {
          setModalEliminarAbierto(false);
          setInscripcionAEliminar(null);
        }}
        onConfirm={eliminarInscripcion}
        title="Eliminar Inscripción"
        message={getMensajeEliminar()}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant={inscripcionAEliminar?.programacion.length ? 'warning' : 'danger'}
        isLoading={eliminando}
      />

      {/* Modal Limpiar Resultado (deshacer, en cascada) */}
      <ConfirmModal
        isOpen={modalLimpiarAbierto}
        onClose={() => {
          setModalLimpiarAbierto(false);
          setPartidoALimpiar(null);
        }}
        onConfirm={limpiarResultadoPartido}
        title="Limpiar resultado"
        message={
          partidoALimpiar
            ? `Se borrará el resultado de "${partidoALimpiar.pareja1} vs ${partidoALimpiar.pareja2}". Si rondas posteriores ya se jugaron con este ganador, también se limpiarán y los jugadores se sacarán de esos partidos (el cuadro queda consistente para volver a cargar). Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Limpiar resultado"
        cancelText="Cancelar"
        variant="danger"
        isLoading={limpiando}
      />

      {/* Modal Cambiar Estado (Emergencia) */}
      {modalCambiarEstadoAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1d29] rounded-xl border border-yellow-500/30 p-6 max-w-md w-full shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Cambiar Estado</h3>
                <p className="text-white/60 text-sm">Modo emergencia - Use con precaución</p>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <span className="text-white/40">Pareja:</span>{' '}
                  <strong className="text-white">
                    {inscripcionACambiarEstado?.pareja.jugador1} / {inscripcionACambiarEstado?.pareja.jugador2}
                  </strong>
                </p>
                <p className="text-white/80 text-sm mt-1">
                  <span className="text-white/40">Categoría:</span>{' '}
                  <strong className="text-white">{inscripcionACambiarEstado?.categoria.nombre}</strong>
                </p>
                <p className="text-white/80 text-sm mt-1">
                  <span className="text-white/40">Estado actual:</span>{' '}
                  <span className={`px-2 py-0.5 rounded text-xs ${getEstadoBadge(inscripcionACambiarEstado?.estado || '')}`}>
                    {inscripcionACambiarEstado?.estado.replace(/_/g, ' ')}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Nuevo estado:</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="CONFIRMADA" className="bg-[#1a1d29]">CONFIRMADA</option>
                  <option value="PENDIENTE_PAGO" className="bg-[#1a1d29]">PENDIENTE PAGO</option>
                  <option value="PENDIENTE_CONFIRMACION" className="bg-[#1a1d29]">PENDIENTE CONFIRMACION</option>
                  <option value="CANCELADA" className="bg-[#1a1d29]">CANCELADA</option>
                </select>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-yellow-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Esta acción modifica directamente el estado de la inscripción. Úselo solo en casos de emergencia.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalCambiarEstadoAbierto(false);
                  setInscripcionACambiarEstado(null);
                  setNuevoEstado('');
                }}
                disabled={cambiandoEstado}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={cambiarEstadoInscripcion}
                disabled={cambiandoEstado || nuevoEstado === inscripcionACambiarEstado?.estado}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-500/80 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors"
              >
                {cambiandoEstado ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  'Cambiar Estado'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Corregir Parejas (god-panel) */}
      {modalParejasAbierto && partidoParejas && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d29] rounded-xl border border-emerald-500/30 w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-semibold">Corregir parejas</h3>
              </div>
              <button onClick={() => setModalParejasAbierto(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <p className="text-white/60">{partidoParejas.fase} · {partidoParejas.categoria.nombre}</p>
                <p className="text-white/40 text-xs mt-1">Cambiá quién juega este partido. Solo parejas de esta categoría.</p>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1.5">Lado 1</label>
                <select
                  value={parejaLado1}
                  onChange={(e) => setParejaLado1(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="" className="bg-[#1a1d29]">— Vacío —</option>
                  {inscCategoria.map((i) => (
                    <option key={i.id} value={i.id} className="bg-[#1a1d29]">{nombrePareja(i)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1.5">Lado 2</label>
                <select
                  value={parejaLado2}
                  onChange={(e) => setParejaLado2(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="" className="bg-[#1a1d29]">— Vacío —</option>
                  {inscCategoria.map((i) => (
                    <option key={i.id} value={i.id} className="bg-[#1a1d29]">{nombrePareja(i)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <button onClick={() => setModalParejasAbierto(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={guardarParejas}
                disabled={guardandoParejas}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-500/80 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {guardandoParejas ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reprogramar partido puntual (god-panel) */}
      {modalReprogramarAbierto && partidoReprogramar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d29] rounded-xl border border-amber-500/30 w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="text-white font-semibold">Reprogramar partido</h3>
              </div>
              <button onClick={() => setModalReprogramarAbierto(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <p className="text-white/60">{partidoReprogramar.fase} · {partidoReprogramar.categoria.nombre}</p>
                <p className="text-white/40 text-xs mt-1">{partidoReprogramar.pareja1} vs {partidoReprogramar.pareja2}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-sm mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={reproFecha}
                    onChange={(e) => setReproFecha(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1.5">Hora</label>
                  <input
                    type="time"
                    value={reproHora}
                    onChange={(e) => setReproHora(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1.5">Cancha</label>
                <select
                  value={reproCancha}
                  onChange={(e) => setReproCancha(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                >
                  <option value="" className="bg-[#1a1d29]">— Sin cambiar —</option>
                  {canchasDisponibles.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#1a1d29]">{c.nombre} - {c.sede}</option>
                  ))}
                  <option value="__none__" className="bg-[#1a1d29]">— Quitar cancha —</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <button onClick={() => setModalReprogramarAbierto(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={guardarReprogramar}
                disabled={guardandoRepro}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-500/80 disabled:opacity-50 text-black font-medium rounded-lg transition-colors"
              >
                {guardandoRepro ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mover de categoría (god-panel B) */}
      {modalMoverAbierto && inscMover && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d29] rounded-xl border border-blue-500/30 w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Mover de categoría</h3>
              </div>
              <button onClick={() => setModalMoverAbierto(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-white/5 rounded-lg p-3 text-sm">
                <p className="text-white">{inscMover.pareja.jugador1}{inscMover.pareja.completa ? ` / ${inscMover.pareja.jugador2}` : ''}</p>
                <p className="text-white/40 text-xs mt-1">Categoría actual: {inscMover.categoria.nombre}</p>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1.5">Mover a:</label>
                <select
                  value={catDestino}
                  onChange={(e) => setCatDestino(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="" className="bg-[#1a1d29]">Elegí una categoría…</option>
                  {catsTorneo.filter((c) => c.categoryId !== inscMover.categoria.id).map((c) => (
                    <option key={c.categoryId} value={c.categoryId} className="bg-[#1a1d29]">{c.nombre}</option>
                  ))}
                </select>
              </div>
              <p className="text-white/40 text-xs">Si la pareja ya está en el cuadro, primero hay que limpiar sus partidos.</p>
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <button onClick={() => setModalMoverAbierto(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={guardarMover}
                disabled={moviendo || !catDestino}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-500/80 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {moviendo ? 'Moviendo...' : 'Mover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar / corregir jugadores (god-panel B) */}
      {modalJugadoresAbierto && inscJugadores && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d29] rounded-xl border border-emerald-500/30 w-full max-w-lg max-h-[88vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-semibold">Editar / corregir jugadores</h3>
              </div>
              <button onClick={() => setModalJugadoresAbierto(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <p className="text-white/40 text-xs">
                Editar los datos cambia al jugador en TODA la app. "Cambiar/Completar" reemplaza quién integra la pareja en esta inscripción.
              </p>

              {([1, 2] as const).map((slot) => {
                const j = slot === 1 ? inscJugadores.pareja.j1 : inscJugadores.pareja.j2;
                const form = slot === 1 ? j1Form : j2Form;
                const setForm = slot === 1 ? setJ1Form : setJ2Form;
                return (
                  <div key={slot} className="bg-white/[0.03] rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm font-medium">Jugador {slot}{slot === 2 && !j ? ' (pendiente)' : ''}</span>
                      <button
                        onClick={() => { setBuscarSlot(buscarSlot === slot ? null : slot); setBusquedaJug(''); setResultadosJug([]); }}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        {buscarSlot === slot ? 'Cancelar' : (j ? 'Cambiar' : 'Completar')}
                      </button>
                    </div>

                    {/* Buscador para cambiar/completar quién integra la pareja */}
                    {buscarSlot === slot && (
                      <div className="mb-3">
                        <input
                          autoFocus
                          value={busquedaJug}
                          onChange={(e) => buscarJugadores(e.target.value)}
                          placeholder="Buscar por nombre, documento o email…"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                        />
                        {resultadosJug.length > 0 && (
                          <div className="mt-1 max-h-40 overflow-y-auto space-y-1">
                            {resultadosJug.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => seleccionarJugador(slot, u)}
                                disabled={guardandoJ}
                                className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                              >
                                {u.nombre} {u.apellido} {u.documento ? <span className="text-white/40">· {u.documento}</span> : null}
                              </button>
                            ))}
                          </div>
                        )}
                        {slot === 2 && j && (
                          <button
                            onClick={quitarJugador2}
                            disabled={guardandoJ}
                            className="mt-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            Quitar pareja (dejar pendiente)
                          </button>
                        )}
                      </div>
                    )}

                    {/* Datos editables del jugador (si existe) */}
                    {j ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                          <input value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} placeholder="Apellido" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                          <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                          <input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} placeholder="Documento" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                        </div>
                        <button
                          onClick={() => guardarJugador(slot)}
                          disabled={guardandoJ}
                          className="mt-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Guardar datos del jugador {slot}
                        </button>
                      </>
                    ) : (
                      <p className="text-white/40 text-sm">Sin jugador. Usá "Completar" para asignar uno.</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end">
              <button onClick={() => setModalJugadoresAbierto(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajustar Comisión (god-panel C) */}
      {modalComisionAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d29] rounded-xl border border-green-500/30 w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Ajustar comisión</h3>
              </div>
              <button onClick={() => setModalComisionAbierto(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-sm mb-1.5">Monto estimado (Gs)</label>
                  <input type="number" value={comForm.montoEstimado} onChange={(e) => setComForm({ ...comForm, montoEstimado: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50" />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1.5">Monto pagado (Gs)</label>
                  <input type="number" value={comForm.montoPagado} onChange={(e) => setComForm({ ...comForm, montoPagado: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1.5">Estado</label>
                <select value={comForm.estado} onChange={(e) => setComForm({ ...comForm, estado: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50">
                  <option value="PENDIENTE" className="bg-[#1a1d29]">PENDIENTE</option>
                  <option value="PARCIAL" className="bg-[#1a1d29]">PARCIAL</option>
                  <option value="PAGADO" className="bg-[#1a1d29]">PAGADO</option>
                  <option value="POR_COBRAR" className="bg-[#1a1d29]">POR_COBRAR</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
                <input type="checkbox" checked={comForm.bloqueoActivo} onChange={(e) => setComForm({ ...comForm, bloqueoActivo: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500" />
                Bloqueo activo
              </label>
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <button onClick={() => setModalComisionAbierto(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Cancelar</button>
              <button onClick={guardarComision} disabled={comBusy} className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-500/80 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
                {comBusy ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagos de inscripción (god-panel C) */}
      {modalPagosAbierto && inscPagos && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d29] rounded-xl border border-green-500/30 w-full max-w-lg max-h-[88vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Pagos · {inscPagos.pareja.jugador1}</h3>
              </div>
              <button onClick={() => setModalPagosAbierto(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              {inscPagos.pagos.length === 0 ? (
                <p className="text-white/40 text-sm">Sin pagos registrados.</p>
              ) : (
                inscPagos.pagos.map((pago) => (
                  <div key={pago.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/10 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={pago.monto as any}
                        onChange={(e) => setPagosLocal((ps) => ps.map((p) => (p.id === pago.id ? { ...p, monto: parseInt(e.target.value) || 0 } : p)))}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50"
                        placeholder="Monto (Gs)"
                      />
                      <select
                        value={pago.metodo}
                        onChange={(e) => setPagosLocal((ps) => ps.map((p) => (p.id === pago.id ? { ...p, metodo: e.target.value } : p)))}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50"
                      >
                        <option value="EFECTIVO" className="bg-[#1a1d29]">EFECTIVO</option>
                        <option value="TRANSFERENCIA" className="bg-[#1a1d29]">TRANSFERENCIA</option>
                        <option value="BANCARD" className="bg-[#1a1d29]">BANCARD</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => marcarPago(pago.id, pago.estado === 'CONFIRMADO' ? 'PENDIENTE' : 'CONFIRMADO')}
                        disabled={pagoBusy}
                        className={`text-xs px-2.5 py-1 rounded transition-colors disabled:opacity-50 ${pago.estado === 'CONFIRMADO' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}
                      >
                        {pago.estado === 'CONFIRMADO' ? '✓ Confirmado (marcar pendiente)' : 'Pendiente (marcar confirmado)'}
                      </button>
                      <div className="flex items-center gap-2">
                        <button onClick={() => guardarPago(pago)} disabled={pagoBusy} className="text-xs px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors disabled:opacity-50">Guardar</button>
                        <button onClick={() => eliminarPago(pago.id)} disabled={pagoBusy} className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors disabled:opacity-50" title="Eliminar pago">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Agregar pago */}
              <div className="bg-white/[0.02] rounded-lg p-3 border border-dashed border-white/10 space-y-2">
                <p className="text-white/60 text-xs font-medium">Agregar pago</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={nuevoPago.monto} onChange={(e) => setNuevoPago({ ...nuevoPago, monto: e.target.value })} placeholder="Monto (Gs)" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50" />
                  <select value={nuevoPago.metodoPago} onChange={(e) => setNuevoPago({ ...nuevoPago, metodoPago: e.target.value })} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50">
                    <option value="EFECTIVO" className="bg-[#1a1d29]">EFECTIVO</option>
                    <option value="TRANSFERENCIA" className="bg-[#1a1d29]">TRANSFERENCIA</option>
                    <option value="BANCARD" className="bg-[#1a1d29]">BANCARD</option>
                  </select>
                </div>
                <button onClick={agregarPago} disabled={pagoBusy || !nuevoPago.monto} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <Plus className="w-4 h-4" /> Agregar pago
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end">
              <button onClick={() => setModalPagosAbierto(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
