import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, AlertTriangle, CheckCircle2, 
  Calculator, Save, ChevronDown, ChevronUp, Eye, 
  Filter, Search, Clock, X, RotateCcw, Edit2
} from 'lucide-react';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { ParejaAvatar } from '../../../../components/ui/ParejaAvatar';

interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
  orden: number;
  totalParejas: number;
}

interface Prediccion {
  totalPartidos: number;
  horasNecesarias: number;
  slotsDisponibles: number;
  deficit: number;
  suficiente: boolean;
  sugerencias: string[];
}

interface PartidoAsignado {
  partidoId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  torneoCanchaId: string;
  sedeNombre: string;
  canchaNombre: string;
  fase: string;
  categoriaNombre: string;
  pareja1?: string;
  pareja2?: string;
}



interface DistribucionDia {
  fecha: string;
  diaSemana: string;
  horarioInicio: string;
  horarioFin: string;
  slotsDisponibles: number;
  slotsAsignados: number;
  partidos: PartidoAsignado[];
}

interface Conflicto {
  tipo: 'MISMA_PAREJA' | 'CANCHA_OCUPADA' | 'SIN_DISPONIBILIDAD' | 'ADVERTENCIA' | 'INFO';
  severidad: 'BLOQUEANTE' | 'ADVERTENCIA' | 'INFO';
  partidoId: string;
  mensaje: string;
  sugerencia?: string;
  accion?: 'AGREGAR_DIAS' | 'EXTENDER_HORARIOS' | 'REDUCIR_PARTIDOS_DIA' | 'ACEPTAR_RIESGO';
}

interface LogAsignacion {
  tipo: 'SALTADO' | 'ASIGNADO' | 'ADELANTADO' | 'INFO';
  partidoId: string;
  categoriaNombre: string;
  fase: string;
  fecha: string;
  hora: string;
  mensaje: string;
}

interface ResultadoProgramacion {
  prediccion: Prediccion;
  distribucion: DistribucionDia[];
  conflictos: Conflicto[];
  logs?: LogAsignacion[];
}

interface ProgramacionManagerProps {
  tournamentId: string;
  categoriasSorteadas: Categoria[];
}

interface Cancha {
  id: string;
  nombre: string;
  sede: string;
}

// Importar componentes
import { ModalEditarProgramacion } from './ModalEditarProgramacion';
import { VistaCalendario } from './VistaCalendario';
import { VistaDragDrop } from './VistaDragDrop';
import { getColorFase } from '../../utils/faseColors';
import { formatDatePY } from '../../../../utils/date';

// ═══════════════════════════════════════════════════════════
// INTERFACES PARA VISTA DE ESTADO ACTUAL (FASE 1)
// ═══════════════════════════════════════════════════════════

export interface PartidoReal {
  id: string;
  fase: string;
  orden: number;
  categoriaId: string;
  categoriaNombre: string;
  esBye: boolean;
  estado: string;
  fechaProgramada?: string | null;
  horaProgramada?: string | null;
  torneoCanchaId?: string | null;
  canchaNombre?: string | null;
  sedeNombre?: string | null;
  inscripcion1?: {
    id: string;
    jugador1: { nombre: string; apellido: string; fotoUrl?: string | null };
    jugador2?: { nombre: string; apellido: string; fotoUrl?: string | null };
  } | null;
  inscripcion2?: {
    id: string;
    jugador1: { nombre: string; apellido: string; fotoUrl?: string | null };
    jugador2?: { nombre: string; apellido: string; fotoUrl?: string | null };
  } | null;
}

export function ProgramacionManager({ tournamentId, categoriasSorteadas }: ProgramacionManagerProps) {
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmState } = useConfirm();
  const [calculando, setCalculando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProgramacion | null>(null);
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());
  
  // ═══════════════════════════════════════════════════════════
  // ESTADO PARA MODO EDICIÓN HÍBRIDA
  // ═══════════════════════════════════════════════════════════
  const [modoEdicion, setModoEdicion] = useState(false);
  const [asignacionesEditadas, setAsignacionesEditadas] = useState<PartidoAsignado[]>([]);
  const [modalEditarSlot, setModalEditarSlot] = useState<{ 
    open: boolean; 
    partido: PartidoAsignado | null;
    diaFecha?: string;
  }>({ open: false, partido: null });
  
  // ═══════════════════════════════════════════════════════════
  // ESTADO PARA LOGS DE ASIGNACIÓN
  // ═══════════════════════════════════════════════════════════
  const [logsAsignacion, setLogsAsignacion] = useState<LogAsignacion[]>([]);
  const [mostrarLogs, setMostrarLogs] = useState(false);
  
  // ═══════════════════════════════════════════════════════════
  // ESTADO PARA VISTA DE ESTADO ACTUAL (FASE 1)
  // ═══════════════════════════════════════════════════════════
  const [vistaActiva, setVistaActiva] = useState<'actual' | 'calendario' | 'dragdrop' | 'calculadora'>('actual');
  const [partidos, setPartidos] = useState<PartidoReal[]>([]);
  const [cargandoPartidos, setCargandoPartidos] = useState(false);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [cargandoCanchas, setCargandoCanchas] = useState(false);
  
  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroFase, setFiltroFase] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para edición
  const [modalEditar, setModalEditar] = useState<{ open: boolean; partido: PartidoReal | null }>({ 
    open: false, 
    partido: null 
  });

  // Cargar partidos y categorías al montar o cambiar torneo
  useEffect(() => {
    if (tournamentId) {
      cargarPartidos();
      cargarCategorias();
      cargarCanchas();
    }
  }, [tournamentId]);

  // Cargar categorías si no vienen por props
  const [categoriasLocales, setCategoriasLocales] = useState<Categoria[]>([]);
  
  const categorias = categoriasSorteadas.length > 0 ? categoriasSorteadas : categoriasLocales;

  const cargarCategorias = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/categorias`);
      if (data.success) {
        const sorteadas = data.categorias.filter((c: any) => c.fixtureVersionId);
        // Mapear al formato correcto usando category.id (no tournamentCategory.id)
        const mapeadas = sorteadas.map((c: any) => ({
          id: c.category?.id || c.categoryId, // ID de la categoría real (para filtrar con partidos)
          nombre: c.category?.nombre || 'Sin nombre',
          tipo: c.category?.tipo || '',
          orden: c.category?.orden || 0,
          totalParejas: c.inscripcionesCount || 0,
        }));
        console.log('[Programacion] Categorías cargadas:', mapeadas);
        setCategoriasLocales(mapeadas);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  // Cargar canchas del torneo
  const cargarCanchas = async () => {
    setCargandoCanchas(true);
    try {
      const { data } = await api.get(`/programacion/torneos/${tournamentId}/canchas`);
      if (data.success) {
        setCanchas(data.canchas || []);
      }
    } catch (error) {
      console.error('Error cargando canchas:', error);
    } finally {
      setCargandoCanchas(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // FUNCIONES PARA VISTA DE ESTADO ACTUAL (FASE 1)
  // ═══════════════════════════════════════════════════════════
  
  const cargarPartidos = async () => {
    setCargandoPartidos(true);
    try {
      // Obtener todos los partidos del torneo con sus fixtureVersion
      const { data } = await api.get(`/admin/torneos/${tournamentId}/partidos`);
      if (data.success) {
        setPartidos(data.partidos || []);
      }
    } catch (error: any) {
      console.error('Error cargando partidos:', error);
      // No mostramos error, solo log - la API puede no existir aún
    } finally {
      setCargandoPartidos(false);
    }
  };

  // Filtrar partidos
  const partidosFiltrados = partidos.filter(p => {
    if (filtroCategoria !== 'todas' && p.categoriaId !== filtroCategoria) return false;
    if (filtroFase !== 'todas' && p.fase !== filtroFase) return false;
    if (filtroEstado === 'programados' && (!p.fechaProgramada || !p.horaProgramada)) return false;
    if (filtroEstado === 'pendientes' && p.fechaProgramada && p.horaProgramada) return false;
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      const textoPartido = `${p.inscripcion1?.jugador1.nombre} ${p.inscripcion1?.jugador1.apellido} ${p.inscripcion1?.jugador2?.nombre} ${p.inscripcion1?.jugador2?.apellido} ${p.inscripcion2?.jugador1.nombre} ${p.inscripcion2?.jugador1.apellido} ${p.inscripcion2?.jugador2?.nombre} ${p.inscripcion2?.jugador2?.apellido}`.toLowerCase();
      if (!textoPartido.includes(busquedaLower)) return false;
    }
    return true;
  });

  const partidosProgramados = partidos.filter(p => p.fechaProgramada && p.horaProgramada);
  const partidosPendientes = partidos.filter(p => !p.fechaProgramada || !p.horaProgramada);

  const fasesDisponibles = [...new Set(partidos.map(p => p.fase))].sort();

  // ═══════════════════════════════════════════════════════════
  // LÓGICA DE ESTADO DE PROGRAMACIÓN POR CATEGORÍA
  // ═══════════════════════════════════════════════════════════
  
  // Determinar qué categorías tienen partidos pendientes de programar
  const categoriasConPartidosPendientes = categorias.filter(cat => {
    const partidosDeCategoria = partidos.filter(p => p.categoriaId === cat.id);
    const pendientesDeCategoria = partidosDeCategoria.filter(p => !p.fechaProgramada || !p.horaProgramada);
    return pendientesDeCategoria.length > 0;
  });

  // Determinar si hay categorías sorteadas pero sin partidos cargados aún
  const categoriasSinPartidos = categorias.filter(cat => {
    const partidosDeCategoria = partidos.filter(p => p.categoriaId === cat.id);
    return partidosDeCategoria.length === 0;
  });

  // Estados del sistema de programación
  const todasLasCategoriasProgramadas = categorias.length > 0 && 
    categoriasConPartidosPendientes.length === 0 && 
    categoriasSinPartidos.length === 0;
  
  const hayCategoriasPendientes = categoriasConPartidosPendientes.length > 0 || categoriasSinPartidos.length > 0;
  
  // Nota: hayCategoriasSinSortear = categorias.length === 0 (ya cubierto arriba)

  const calcularProgramacion = async () => {
    if (categorias.length === 0) {
      showError('Sin categorías', 'No hay categorías sorteadas para programar');
      return;
    }

    setCalculando(true);
    try {
      // Obtener configuración de finales del torneo
      const { data: torneoData } = await api.get(`/tournaments/${tournamentId}`);
      const torneo = torneoData.tournament || torneoData;
      
      const { data } = await api.post(`/programacion/torneos/${tournamentId}/calcular`, {
        categoriasSorteadas: categorias.map(c => c.id),
        canchasFinales: torneo.canchasFinales || [],
        horaInicioFinales: torneo.horaInicioFinales || null,
      });
      
      setResultado(data);
      // Inicializar asignaciones editadas con el resultado del cálculo
      const todasLasAsignaciones = data.distribucion.flatMap((d: DistribucionDia) => d.partidos);
      setAsignacionesEditadas(todasLasAsignaciones);
      setLogsAsignacion(data.logs || []);
      setModoEdicion(false); // Resetear modo edición
      setDiasExpandidos(new Set(data.distribucion.map((d: DistribucionDia) => d.fecha)));
      showSuccess('Programación calculada', `Se calcularon ${data.distribucion.length} días de programación`);
    } catch (error: any) {
      console.error('Error calculando programación:', error);
      showError('Error', error.response?.data?.message || 'Error calculando programación');
    } finally {
      setCalculando(false);
    }
  };

  const aplicarProgramacion = async () => {
    if (!resultado || resultado.distribucion.length === 0) return;

    const confirmed = await confirm({
      title: 'Aplicar programación',
      message: modoEdicion 
        ? '¿Aplicar la programación con los cambios realizados? Esta acción no se puede deshacer.'
        : '¿Aplicar esta programación? Los partidos serán asignados a las fechas/horas/canchas indicadas. Esta acción no se puede deshacer.',
      confirmText: 'Aplicar',
      cancelText: 'Cancelar',
      variant: 'info',
    });
    if (!confirmed) return;

    setAplicando(true);
    try {
      // Usar asignaciones editadas si estamos en modo edición
      const asignaciones = modoEdicion ? asignacionesEditadas : resultado.distribucion.flatMap(d => d.partidos);
      await api.post(`/programacion/torneos/${tournamentId}/aplicar`, {
        asignaciones,
      });
      showSuccess('Programación aplicada', 'Los partidos fueron asignados exitosamente');
      // Recargar partidos y volver a vista actual
      await cargarPartidos();
      setVistaActiva('actual');
      setResultado(null);
      setModoEdicion(false);
      setAsignacionesEditadas([]);
    } catch (error: any) {
      console.error('Error aplicando programación:', error);
      showError('Error', error.response?.data?.message || 'Error aplicando programación');
    } finally {
      setAplicando(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // FUNCIONES PARA MODO EDICIÓN HÍBRIDA
  // ═══════════════════════════════════════════════════════════
  
  const activarModoEdicion = () => {
    setModoEdicion(true);
    // Expandir todos los días para facilitar la edición
    if (resultado) {
      setDiasExpandidos(new Set(resultado.distribucion.map(d => d.fecha)));
    }
  };

  const cancelarModoEdicion = () => {
    if (resultado) {
      // Restaurar asignaciones originales
      const todasLasAsignaciones = resultado.distribucion.flatMap(d => d.partidos);
      setAsignacionesEditadas(todasLasAsignaciones);
    }
    setModoEdicion(false);
  };

  const abrirEditarSlot = (partido: PartidoAsignado, fecha: string) => {
    setModalEditarSlot({ open: true, partido, diaFecha: fecha });
  };

  const guardarSlotEditado = (partidoId: string, nuevaFecha: string, nuevaHora: string, nuevoCanchaId: string) => {
    setAsignacionesEditadas(prev => prev.map(a => {
      if (a.partidoId !== partidoId) return a;
      
      // Buscar información de la cancha
      const cancha = canchas.find(c => c.id === nuevoCanchaId);
      
      return {
        ...a,
        fecha: nuevaFecha,
        horaInicio: nuevaHora,
        // Calcular hora fin (aprox 1.5h después)
        horaFin: calcularHoraFin(nuevaHora),
        torneoCanchaId: nuevoCanchaId,
        sedeNombre: cancha?.sede || a.sedeNombre,
        canchaNombre: cancha?.nombre || a.canchaNombre,
      };
    }));
  };

  const calcularHoraFin = (horaInicio: string): string => {
    const [h, m] = horaInicio.split(':').map(Number);
    const totalMinutos = h * 60 + m + 90; // 90 min = 1.5h
    const horaFin = Math.floor(totalMinutos / 60);
    const minutosFin = totalMinutos % 60;
    return `${horaFin.toString().padStart(2, '0')}:${minutosFin.toString().padStart(2, '0')}`;
  };

  // Obtener distribución actual (editada o original)
  const getDistribucionActual = (): DistribucionDia[] => {
    if (!resultado) return [];
    if (!modoEdicion) return resultado.distribucion;
    
    // Reconstruir distribución desde asignaciones editadas
    const porFecha: Record<string, PartidoAsignado[]> = {};
    for (const a of asignacionesEditadas) {
      if (!porFecha[a.fecha]) porFecha[a.fecha] = [];
      porFecha[a.fecha].push(a);
    }
    
    return Object.keys(porFecha)
      .sort()
      .map(fecha => {
        const partidos = porFecha[fecha].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        const horas = partidos.map(p => p.horaInicio);
        
        // Buscar slots disponibles para este día en el resultado original
        const diaOriginal = resultado.distribucion.find(d => d.fecha === fecha);
        
        return {
          fecha,
          diaSemana: diaOriginal?.diaSemana || getDiaSemana(fecha),
          horarioInicio: horas[0] || '18:00',
          horarioFin: horas[horas.length - 1] || '23:00',
          slotsDisponibles: diaOriginal?.slotsDisponibles || partidos.length,
          slotsAsignados: partidos.length,
          partidos,
        };
      });
  };

  const getDiaSemana = (fecha: string): string => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const date = new Date(fecha + 'T12:00:00-03:00');
    return dias[date.getDay()];
  };

  const toggleDia = (fecha: string) => {
    const nuevos = new Set(diasExpandidos);
    if (nuevos.has(fecha)) {
      nuevos.delete(fecha);
    } else {
      nuevos.add(fecha);
    }
    setDiasExpandidos(nuevos);
  };

  // getColorFase se importa desde utils/faseColors

  // ═══════════════════════════════════════════════════════════
  // ESTADOS ESPECIALES DEL SISTEMA
  // ═══════════════════════════════════════════════════════════
  
  // 1. Sin categorías sorteadas
  if (categorias.length === 0) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-8 text-center">
        <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Sin categorías sorteadas</h3>
        <p className="text-sm text-neutral-500">
          Primero debes sortear las categorías en la pestaña "Fixture" para poder programar los partidos.
        </p>
      </div>
    );
  }

  // 2. Todas las categorías están completamente programadas
  if (todasLasCategoriasProgramadas && !resultado) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h2 className="text-xl font-light text-white tracking-tight">Programación</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {partidosProgramados.length} programados • {categorias.length} categorías
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">Programación completa</span>
          </div>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">¡Todas las categorías están programadas!</h3>
          <p className="text-sm text-neutral-400 mb-4 max-w-md mx-auto">
            Todas las categorías sorteadas tienen sus partidos asignados a fechas, horas y canchas.
            Puedes usar las pestañas de Lista, Calendario o Arrastrar para ver y editar manualmente si es necesario.
          </p>
        </div>

        {/* Tabs de navegación (solo vistas de visualización/edición) */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setVistaActiva('actual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActiva === 'actual'
                ? 'bg-[#df2531] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Eye className="w-4 h-4" />
            Lista
          </button>
          <button
            onClick={() => setVistaActiva('calendario')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActiva === 'calendario'
                ? 'bg-[#df2531] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendario
          </button>
          <button
            onClick={() => setVistaActiva('dragdrop')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActiva === 'dragdrop'
                ? 'bg-[#df2531] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Arrastrar
          </button>
        </div>

        {/* Vistas disponibles */}
        {vistaActiva === 'actual' && (
          <VistaActual 
            partidos={partidos}
            partidosFiltrados={partidosFiltrados}
            partidosProgramados={partidosProgramados}
            partidosPendientes={partidosPendientes}
            cargando={cargandoPartidos}
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
            filtroFase={filtroFase}
            setFiltroFase={setFiltroFase}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            fasesDisponibles={fasesDisponibles}
            categoriasSorteadas={categorias}
            onRecargar={cargarPartidos}
            onEditar={(partido) => setModalEditar({ open: true, partido })}
          />
        )}

        {vistaActiva === 'calendario' && (
          <VistaCalendario
            partidos={partidos}
            canchas={canchas}
            cargando={cargandoPartidos || cargandoCanchas}
            onEditar={(partido) => setModalEditar({ open: true, partido })}
            onProgramarNuevo={(fecha, hora, canchaId) => {
              setModalEditar({ 
                open: true, 
                partido: {
                  id: '',
                  fase: '',
                  categoriaNombre: '',
                  esBye: false,
                  fechaProgramada: fecha,
                  horaProgramada: hora,
                  torneoCanchaId: canchaId,
                } as PartidoReal
              });
            }}
          />
        )}

        {vistaActiva === 'dragdrop' && (
          <VistaDragDrop
            partidos={partidos}
            canchas={canchas}
            cargando={cargandoPartidos || cargandoCanchas}
            onActualizar={cargarPartidos}
          />
        )}

        {/* Modal de Edición */}
        <ModalEditarProgramacion
          isOpen={modalEditar.open}
          onClose={() => setModalEditar({ open: false, partido: null })}
          partido={modalEditar.partido}
          tournamentId={tournamentId}
          onSuccess={() => {
            cargarPartidos();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-light text-white tracking-tight">Programación</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {partidosProgramados.length} programados • {partidosPendientes.length} pendientes • {categorias.length} categorías
            {todasLasCategoriasProgramadas && (
              <span className="ml-2 text-emerald-400">✓ Todas programadas</span>
            )}
            {categoriasConPartidosPendientes.length > 0 && (
              <span className="ml-2 text-amber-400">
                • {categoriasConPartidosPendientes.length} categoría{categoriasConPartidosPendientes.length > 1 ? 's' : ''} con partidos pendientes
              </span>
            )}
            {categoriasSinPartidos.length > 0 && (
              <span className="ml-2 text-blue-400">
                • {categoriasSinPartidos.length} categoría{categoriasSinPartidos.length > 1 ? 's' : ''} sin cargar
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mensaje cuando todo está programado */}
          {todasLasCategoriasProgramadas && !resultado && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">Programación completa</span>
            </div>
          )}
          
          {!resultado ? (
            // Mostrar botón solo si hay categorías pendientes
            hayCategoriasPendientes ? (
              <button
                onClick={calcularProgramacion}
                disabled={calculando}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {calculando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Calcular Automáticamente
                  </>
                )}
              </button>
            ) : null
          ) : (
            <>
              {!modoEdicion ? (
                <>
                  <button
                    onClick={calcularProgramacion}
                    disabled={calculando}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <Calculator className="w-4 h-4" />
                    Recalcular
                  </button>
                  <button
                    onClick={activarModoEdicion}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modo Edición
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={cancelarModoEdicion}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancelar Edición
                  </button>
                  <button
                    onClick={aplicarProgramacion}
                    disabled={aplicando}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {aplicando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Aplicar Cambios
                      </>
                    )}
                  </button>
                </>
              )}
              {!modoEdicion && (
                <button
                  onClick={aplicarProgramacion}
                  disabled={aplicando || (resultado?.conflictos?.some(c => c.severidad === 'BLOQUEANTE'))}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {aplicando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Aplicar
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setVistaActiva('actual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vistaActiva === 'actual'
              ? 'bg-[#df2531] text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Eye className="w-4 h-4" />
          Lista
          {partidosPendientes.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {partidosPendientes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setVistaActiva('calendario')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vistaActiva === 'calendario'
              ? 'bg-[#df2531] text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendario
        </button>
        <button
          onClick={() => setVistaActiva('dragdrop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vistaActiva === 'dragdrop'
              ? 'bg-[#df2531] text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Arrastrar
        </button>
        <button
          onClick={() => {
            setVistaActiva('calculadora');
            if (!resultado && !calculando) {
              calcularProgramacion();
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vistaActiva === 'calculadora'
              ? 'bg-[#df2531] text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Calculadora Automática
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          VISTA LISTA (FASE 1)
          ═══════════════════════════════════════════════════════════ */}
      {vistaActiva === 'actual' && (
        <VistaActual 
          partidos={partidos}
          partidosFiltrados={partidosFiltrados}
          partidosProgramados={partidosProgramados}
          partidosPendientes={partidosPendientes}
          cargando={cargandoPartidos}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          filtroFase={filtroFase}
          setFiltroFase={setFiltroFase}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          fasesDisponibles={fasesDisponibles}
          categoriasSorteadas={categorias}
          onRecargar={cargarPartidos}
          onEditar={(partido) => setModalEditar({ open: true, partido })}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          VISTA CALENDARIO (FASE 3)
          ═══════════════════════════════════════════════════════════ */}
      {vistaActiva === 'calendario' && (
        <VistaCalendario
          partidos={partidos}
          canchas={canchas}
          cargando={cargandoPartidos || cargandoCanchas}
          onEditar={(partido) => setModalEditar({ open: true, partido })}
          onProgramarNuevo={(fecha, hora, canchaId) => {
            // Abrir modal con datos pre-llenados
            setModalEditar({ 
              open: true, 
              partido: {
                id: '', // Se seleccionará de los pendientes
                fase: '',
                categoriaNombre: '',
                esBye: false,
                fechaProgramada: fecha,
                horaProgramada: hora,
                torneoCanchaId: canchaId,
              } as PartidoReal
            });
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          VISTA DRAG & DROP (FASE 4)
          ═══════════════════════════════════════════════════════════ */}
      {vistaActiva === 'dragdrop' && (
        <VistaDragDrop
          partidos={partidos}
          canchas={canchas}
          cargando={cargandoPartidos || cargandoCanchas}
          onActualizar={cargarPartidos}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          VISTA CALCULADORA (EXISTENTE)
          ═══════════════════════════════════════════════════════════ */}
      {vistaActiva === 'calculadora' && (
        <>
          {/* Sin cálculo aún */}
      {!resultado && !calculando && (
        <div className="bg-white/[0.02] rounded-xl p-8 text-center">
          <Calculator className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Programación automática</h3>
          <p className="text-sm text-neutral-500 mb-4 max-w-md mx-auto">
            El sistema calculará la distribución óptima de partidos considerando:
            disponibilidad de canchas, horarios y descansos entre partidos.
          </p>
          <button
            onClick={calcularProgramacion}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors mx-auto"
          >
            <Calculator className="w-4 h-4" />
            Calcular Ahora
          </button>
        </div>
      )}

      {/* Calculando */}
      {calculando && (
        <div className="bg-white/[0.02] rounded-xl p-12 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-neutral-700 border-t-white rounded-full mx-auto mb-4"
          />
          <p className="text-neutral-400">Calculando distribución óptima...</p>
        </div>
      )}

      {/* Resultado */}
      {resultado && !calculando && (
        <div className="space-y-6">
          {/* Predicción de Recursos */}
          <div className={`rounded-xl p-4 border ${
            resultado.prediccion.suficiente 
              ? 'bg-emerald-500/5 border-emerald-500/20' 
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {resultado.prediccion.suficiente ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <h3 className="text-sm font-medium text-white">
                Predicción de Recursos
              </h3>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-light text-white">{resultado.prediccion.totalPartidos}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Partidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-white">{Math.round(resultado.prediccion.horasNecesarias)}h</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Necesarias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-white">{Math.round(resultado.prediccion.slotsDisponibles)}h</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Disponibles</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-light ${resultado.prediccion.deficit > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {resultado.prediccion.deficit > 0 ? `-${Math.round(resultado.prediccion.deficit)}h` : 'OK'}
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Déficit</div>
              </div>
            </div>

            {resultado.prediccion.sugerencias.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-neutral-400">Sugerencias:</p>
                {resultado.prediccion.sugerencias.map((sugerencia, idx) => (
                  <p key={idx} className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {sugerencia}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Conflictos y Advertencias */}
          {resultado.conflictos.length > 0 && (
            <div className="space-y-3">
              {/* Conflictos Bloqueantes */}
              {resultado.conflictos.some(c => c.severidad === 'BLOQUEANTE') && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Conflictos detectados ({resultado.conflictos.filter(c => c.severidad === 'BLOQUEANTE').length})
                  </h3>
                  <div className="space-y-2">
                    {resultado.conflictos.filter(c => c.severidad === 'BLOQUEANTE').map((conflicto, idx) => (
                      <div key={idx} className="text-xs text-red-300">
                        • {conflicto.mensaje}
                        {conflicto.sugerencia && (
                          <p className="text-red-400/70 ml-3 mt-0.5">💡 {conflicto.sugerencia}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Advertencias */}
              {resultado.conflictos.some(c => c.severidad === 'ADVERTENCIA') && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Advertencias ({resultado.conflictos.filter(c => c.severidad === 'ADVERTENCIA').length})
                  </h3>
                  <div className="space-y-2">
                    {resultado.conflictos.filter(c => c.severidad === 'ADVERTENCIA').map((conflicto, idx) => (
                      <div key={idx} className="text-xs text-amber-300">
                        <p>• {conflicto.mensaje}</p>
                        {conflicto.sugerencia && (
                          <p className="text-amber-400/70 ml-3 mt-0.5">💡 {conflicto.sugerencia}</p>
                        )}
                        {conflicto.accion === 'AGREGAR_DIAS' && (
                          <button
                            onClick={() => setVistaActiva('actual')}
                            className="ml-3 mt-1 text-[10px] px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded transition-colors"
                          >
                            → Ir a agregar días
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-400/50 mt-3 pt-2 border-t border-amber-500/10">
                    Puedes aplicar la programación igualmente, pero ten en cuenta estas advertencias.
                  </p>
                </div>
              )}

              {/* Logs de Asignación */}
              {logsAsignacion.length > 0 && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Logs de Asignación
                    </h3>
                    <button
                      onClick={() => setMostrarLogs(!mostrarLogs)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {mostrarLogs ? 'Ocultar' : 'Ver'} ({logsAsignacion.filter(l => l.tipo !== 'ASIGNADO').length})
                    </button>
                  </div>
                  {mostrarLogs && (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {logsAsignacion.map((log, idx) => (
                        <div 
                          key={idx} 
                          className={`text-xs ${
                            log.tipo === 'SALTADO' ? 'text-amber-400' : 
                            log.tipo === 'ASIGNADO' ? 'text-emerald-400' : 
                            log.tipo === 'INFO' ? 'text-neutral-400' :
                            'text-blue-400'
                          }`}
                        >
                          <span className="font-medium">{log.tipo}:</span> {log.mensaje}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Distribución por Día */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                Distribución por Día
              </h3>
              {modoEdicion && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" />
                  Modo edición activo - Haz clic en un partido para editar
                </span>
              )}
            </div>

            {getDistribucionActual().length === 0 ? (
              <p className="text-sm text-neutral-500">No se pudo distribuir los partidos en los días disponibles.</p>
            ) : (
              getDistribucionActual().map((dia) => (
                <motion.div
                  key={dia.fecha}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden"
                >
                  {/* Header del día */}
                  <button
                    onClick={() => toggleDia(dia.fecha)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">
                          {dia.diaSemana}, {formatDatePY(dia.fecha)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {dia.horarioInicio} - {dia.horarioFin} • {dia.slotsAsignados} partidos
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-neutral-500">
                          {Math.round((dia.slotsAsignados / Math.max(dia.slotsDisponibles, 1)) * 100)}% ocupado
                        </div>
                      </div>
                      {diasExpandidos.has(dia.fecha) ? (
                        <ChevronUp className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                  </button>

                  {/* Partidos del día */}
                  <AnimatePresence>
                    {diasExpandidos.has(dia.fecha) && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-2">
                          {dia.partidos.map((partido) => (
                            <div
                              key={partido.partidoId}
                              onClick={() => modoEdicion && abrirEditarSlot(partido, dia.fecha)}
                              className={`flex items-center gap-4 p-3 bg-white/[0.03] rounded-lg transition-colors ${
                                modoEdicion 
                                  ? 'cursor-pointer hover:bg-[#df2531]/10 border border-transparent hover:border-[#df2531]/30' 
                                  : 'hover:bg-white/[0.05]'
                              }`}
                            >
                              {/* Hora */}
                              <div className="text-center min-w-[80px]">
                                <div className="text-sm font-medium text-white">{partido.horaInicio}</div>
                                <div className="text-xs text-neutral-600">{partido.horaFin}</div>
                              </div>

                              {/* Separador */}
                              <div className="w-px h-8 bg-white/10" />

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] px-2 py-0.5 rounded border ${getColorFase(partido.fase)}`}>
                                    {partido.fase}
                                  </span>
                                  <span className="text-xs text-neutral-500">{partido.categoriaNombre}</span>
                                </div>
                                <div className="text-sm text-white truncate">
                                  {partido.pareja1 || 'Por definir'} vs {partido.pareja2 || 'Por definir'}
                                </div>
                              </div>

                              {/* Cancha */}
                              <div className="text-right min-w-[120px]">
                                <div className="text-xs text-neutral-400 flex items-center gap-1 justify-end">
                                  <MapPin className="w-3 h-3" />
                                  {partido.canchaNombre}
                                </div>
                                <div className="text-[10px] text-neutral-600">{partido.sedeNombre}</div>
                              </div>

                              {/* Icono de editar en modo edición */}
                              {modoEdicion && (
                                <div className="flex-shrink-0">
                                  <Edit2 className="w-4 h-4 text-[#df2531]" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
        </>
      )}
      
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={confirmState.close}
        onConfirm={confirmState.handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />

      {/* Modal de Edición de Partido Real */}
      <ModalEditarProgramacion
        isOpen={modalEditar.open}
        onClose={() => setModalEditar({ open: false, partido: null })}
        partido={modalEditar.partido}
        tournamentId={tournamentId}
        onSuccess={() => {
          cargarPartidos();
        }}
      />

      {/* Modal de Edición de Slot (Modo Híbrido) */}
      <ModalEditarSlot
        isOpen={modalEditarSlot.open}
        onClose={() => setModalEditarSlot({ open: false, partido: null })}
        partido={modalEditarSlot.partido}
        tournamentId={tournamentId}
        canchas={canchas}
        onGuardar={guardarSlotEditado}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL PARA EDITAR SLOT (MODO HÍBRIDO)
// ═══════════════════════════════════════════════════════════

interface ModalEditarSlotProps {
  isOpen: boolean;
  onClose: () => void;
  partido: PartidoAsignado | null;
  tournamentId: string;
  canchas: Cancha[];
  onGuardar: (partidoId: string, fecha: string, hora: string, canchaId: string) => void;
}

function ModalEditarSlot({ isOpen, onClose, partido, canchas, onGuardar }: ModalEditarSlotProps) {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [canchaId, setCanchaId] = useState('');

  useEffect(() => {
    if (partido) {
      setFecha(partido.fecha);
      setHora(partido.horaInicio);
      setCanchaId(partido.torneoCanchaId);
    }
  }, [partido]);

  const handleGuardar = () => {
    if (!partido || !fecha || !hora || !canchaId) return;
    onGuardar(partido.partidoId, fecha, hora, canchaId);
    onClose();
  };

  if (!isOpen || !partido) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#151921] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Edit2 className="w-5 h-5 text-[#df2531]" />
            <h2 className="text-lg font-bold text-white">Editar Slot</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Info del partido */}
          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] px-2 py-0.5 rounded border ${getColorFase(partido.fase)}`}>
                {partido.fase}
              </span>
              <span className="text-xs text-neutral-500">{partido.categoriaNombre}</span>
            </div>
            <div className="text-sm text-white">
              {partido.pareja1 || 'Por definir'} vs {partido.pareja2 || 'Por definir'}
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-3">
            {/* Fecha */}
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-400 mb-1.5">
                <Calendar className="w-4 h-4" />
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none"
              />
            </div>

            {/* Hora */}
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-400 mb-1.5">
                <Clock className="w-4 h-4" />
                Hora de inicio
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none"
              />
            </div>

            {/* Cancha */}
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-400 mb-1.5">
                <MapPin className="w-4 h-4" />
                Cancha
              </label>
              <select
                value={canchaId}
                onChange={(e) => setCanchaId(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none"
              >
                <option value="">Seleccionar cancha...</option>
                {canchas.map(cancha => (
                  <option key={cancha.id} value={cancha.id}>
                    {cancha.sede} - {cancha.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={!fecha || !hora || !canchaId}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE VISTA ACTUAL (FASE 1)
// ═══════════════════════════════════════════════════════════

interface VistaActualProps {
  partidos: PartidoReal[];
  partidosFiltrados: PartidoReal[];
  partidosProgramados: PartidoReal[];
  partidosPendientes: PartidoReal[];
  cargando: boolean;
  filtroCategoria: string;
  setFiltroCategoria: (v: string) => void;
  filtroFase: string;
  setFiltroFase: (v: string) => void;
  filtroEstado: string;
  setFiltroEstado: (v: string) => void;
  busqueda: string;
  setBusqueda: (v: string) => void;
  fasesDisponibles: string[];
  categoriasSorteadas: Categoria[];
  onRecargar: () => void;
  onEditar: (partido: PartidoReal) => void;
}

function VistaActual({
  partidos,
  partidosFiltrados,
  partidosProgramados,
  partidosPendientes,
  cargando,
  filtroCategoria,
  setFiltroCategoria,
  filtroFase,
  setFiltroFase,
  filtroEstado,
  setFiltroEstado,
  busqueda,
  setBusqueda,
  fasesDisponibles,
  categoriasSorteadas,
  onRecargar,
  onEditar,
}: VistaActualProps) {
  const getColorFase = (fase: string) => {
    switch (fase) {
      case 'ZONA': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'REPECHAJE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'OCTAVOS': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'CUARTOS': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'SEMIS': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'FINAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (cargando) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-neutral-700 border-t-white rounded-full mx-auto mb-4"
        />
        <p className="text-neutral-400">Cargando partidos...</p>
      </div>
    );
  }

  if (partidos.length === 0) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-8 text-center">
        <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Sin partidos</h3>
        <p className="text-sm text-neutral-500">
          No hay partidos sorteados aún. Ve al tab "Fixture" para sortear las categorías primero.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
          <div className="text-2xl font-light text-white">{partidos.length}</div>
          <div className="text-xs text-neutral-500">Total Partidos</div>
        </div>
        <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
          <div className="text-2xl font-light text-emerald-400">{partidosProgramados.length}</div>
          <div className="text-xs text-emerald-400/70">Programados</div>
        </div>
        <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20">
          <div className="text-2xl font-light text-amber-400">{partidosPendientes.length}</div>
          <div className="text-xs text-amber-400/70">Pendientes</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-neutral-400 text-sm mb-2">
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-[#df2531] focus:outline-none"
            />
          </div>

          {/* Filtro Categoría */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1rem',
              paddingRight: '2rem'
            }}
          >
            <option value="todas">Todas las categorías</option>
            {categoriasSorteadas.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-[#151921]">{cat.nombre}</option>
            ))}
          </select>

          {/* Filtro Fase */}
          <select
            value={filtroFase}
            onChange={(e) => setFiltroFase(e.target.value)}
            className="bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1rem',
              paddingRight: '2rem'
            }}
          >
            <option value="todas">Todas las fases</option>
            {fasesDisponibles.map(fase => (
              <option key={fase} value={fase} className="bg-[#151921]">{fase}</option>
            ))}
          </select>

          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1rem',
              paddingRight: '2rem'
            }}
          >
            <option value="todos">Todos los estados</option>
            <option value="programados">Programados</option>
            <option value="pendientes">Pendientes</option>
          </select>
        </div>

        {/* Botón limpiar filtros */}
        {(filtroCategoria !== 'todas' || filtroFase !== 'todas' || filtroEstado !== 'todos' || busqueda) && (
          <button
            onClick={() => {
              setFiltroCategoria('todas');
              setFiltroFase('todas');
              setFiltroEstado('todos');
              setBusqueda('');
            }}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista de Partidos */}
      <div className="space-y-2">
        {partidosFiltrados.length === 0 ? (
          <div className="bg-white/[0.02] rounded-xl p-8 text-center">
            <p className="text-neutral-500">No hay partidos que coincidan con los filtros</p>
          </div>
        ) : (
          partidosFiltrados.map((partido) => (
            <motion.div
              key={partido.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white/[0.02] rounded-xl border p-3 hover:bg-white/[0.04] transition-colors ${
                partido.fechaProgramada 
                  ? 'border-emerald-500/20' 
                  : 'border-amber-500/20'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Estado */}
                <div className="flex-shrink-0">
                  {partido.fechaProgramada ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                  )}
                </div>

                {/* Info del partido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getColorFase(partido.fase)}`}>
                      {partido.fase}
                    </span>
                    <span className="text-xs text-neutral-500">{partido.categoriaNombre}</span>
                    {partido.esBye && (
                      <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                        BYE
                      </span>
                    )}
                  </div>
                  
                  {/* Parejas */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <ParejaAvatar 
                        jugador1={partido.inscripcion1?.jugador1}
                        jugador2={partido.inscripcion1?.jugador2}
                        size="sm"
                      />
                      <span className="text-sm text-white truncate max-w-[120px]">
                        {partido.inscripcion1?.jugador1.apellido}
                        {partido.inscripcion1?.jugador2 && `/${partido.inscripcion1.jugador2.apellido}`}
                      </span>
                    </div>
                    
                    <span className="text-neutral-500 text-xs">vs</span>
                    
                    <div className="flex items-center gap-2">
                      <ParejaAvatar 
                        jugador1={partido.inscripcion2?.jugador1}
                        jugador2={partido.inscripcion2?.jugador2}
                        size="sm"
                      />
                      <span className="text-sm text-white truncate max-w-[120px]">
                        {partido.inscripcion2?.jugador1.apellido}
                        {partido.inscripcion2?.jugador2 && `/${partido.inscripcion2.jugador2.apellido}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fecha/Hora/Cancha */}
                <div className="text-right flex-shrink-0 min-w-[140px]">
                  {partido.fechaProgramada ? (
                    <>
                      <div className="flex items-center gap-1 justify-end text-sm text-white">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        {formatDatePY(partido.fechaProgramada)}
                      </div>
                      <div className="flex items-center gap-1 justify-end text-xs text-neutral-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {partido.horaProgramada}
                      </div>
                      <div className="flex items-center gap-1 justify-end text-xs text-neutral-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {partido.canchaNombre}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-amber-400">Sin programar</span>
                  )}
                </div>

                {/* Botón Editar */}
                <button
                  onClick={() => onEditar(partido)}
                  className="flex-shrink-0 p-2 bg-white/5 hover:bg-[#df2531]/20 text-neutral-400 hover:text-[#df2531] rounded-lg transition-colors"
                  title="Editar programación"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Botón recargar */}
      <div className="flex justify-center">
        <button
          onClick={onRecargar}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-neutral-400 rounded-lg text-sm hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          Recargar
        </button>
      </div>
    </div>
  );
}
