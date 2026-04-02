import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Users, Calendar, Trophy, CheckCircle2, AlertCircle,
  Download, RefreshCw, Database, UserX, Shield, Wrench, AlertTriangle, Info,
  Edit3, ArrowRightLeft
} from 'lucide-react';
import { api } from '../../../../services/api';
import { formatDatePY, formatDatePYLong } from '../../../../utils/date';
import { useAuth } from '../../../../features/auth/context/AuthContext';

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
      alert(err.response?.data?.message || 'Error al cambiar slot');
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
      alert('Slots intercambiados correctamente');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al intercambiar');
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
      alert(err.response?.data?.message || 'Error al asignar cancha');
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
                                alert(`Re-sortear categoría: ${problema.categoria}`);
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
    </div>
  );
}
