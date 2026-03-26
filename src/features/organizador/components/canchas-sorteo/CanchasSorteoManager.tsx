import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Trophy, Calendar, 
  CheckCircle2, MapPin, Plus, X, Trash2,
  Shuffle, ArrowUp, ArrowDown, GripVertical
} from 'lucide-react';
import { canchasSorteoService } from '../../services/canchasSorteoService';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { formatDatePY } from '../../../../utils/date';

interface Props {
  tournamentId: string;
}

interface Categoria {
  id: string;
  nombre: string;
  parejas: number;
  minimoParejas: number;
  estado: string;
  fixtureVersionId?: string | null; // NUEVO: Si tiene fixture, ya fue sorteada
}

interface DiaConfigurado {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  minutosSlot: number;
  slotsLibres: number;
  canchas: number;
}

interface Cancha {
  id: string;
  nombre: string;
  sede: { id: string; nombre: string };
}

// ============================================
// COMPONENTE PRINCIPAL - MVP SIMPLIFICADO
// ============================================
export function CanchasSorteoManager({ tournamentId }: Props) {
  const { showSuccess, showError } = useToast();
  const confirmState = useConfirm();
  const { confirm } = confirmState;
  
  // Estados de pasos (colapsables) - MVP simplificado
  const [paso1Abierto, setPaso1Abierto] = useState(true);  // Asignar Sede
  const [paso2Abierto, setPaso2Abierto] = useState(false); // Agregar Días
  const [paso3Abierto, setPaso3Abierto] = useState(false); // Sortear

  // Estado Paso 1: Sedes Asignadas (múltiples con orden)
  const [sedesAsignadas, setSedesAsignadas] = useState<{ id: string; nombre: string; ciudad: string; canchas: number; orden: number }[]>([]);

  // Estado Paso 2: Días y Canchas
  const [dias, setDias] = useState<DiaConfigurado[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [canchasInicializadas, setCanchasInicializadas] = useState(false);
  const [nuevoDia, setNuevoDia] = useState({
    fecha: '',
    horaInicio: '18:00',
    horaFin: '23:00',
    minutosSlot: 90,
    canchasIds: [] as string[],
  });

  // Inicializar canchasIds UNA SOLA VEZ cuando se cargan las canchas
  useEffect(() => {
    if (canchas.length > 0 && !canchasInicializadas) {
      setNuevoDia(prev => ({ ...prev, canchasIds: canchas.map(c => c.id) }));
      setCanchasInicializadas(true);
    }
  }, [canchas, canchasInicializadas]);

  // Estado Paso 3: Categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  // MVP: Eliminado calculoSlots - sorteo directo sin validación previa compleja
  
  // Modales
  const [mostrarModalSedes, setMostrarModalSedes] = useState(false);
  
  // Modal confirmación eliminar sede
  const [modalEliminar, setModalEliminar] = useState<{
    isOpen: boolean;
    sede: { id: string; nombre: string } | null;
    isLoading: boolean;
  }>({ isOpen: false, sede: null, isLoading: false });
  
  // Modal cambiar sede
  const [modalCambiar, setModalCambiar] = useState<{
    isOpen: boolean;
    sedeActual: { id: string; nombre: string } | null;
    sedesDisponibles: any[];
    isLoading: boolean;
  }>({ isOpen: false, sedeActual: null, sedesDisponibles: [], isLoading: false });

  // Modal error de slots faltantes
  const [modalSlotsFaltantes, setModalSlotsFaltantes] = useState<{
    isOpen: boolean;
    mensaje: string;
    detalle: {
      totalSlotsNecesarios?: number;
      slotsDisponibles?: number;
      slotsFaltantes?: number;
      horasNecesarias?: number;
      horasDisponibles?: number;
      categoriasAfectadas?: Array<{
        nombre: string;
        slotsFaltantes: number;
        fasesFaltantes: string[];
      }>;
      fasesAfectadas?: string[];
      diasSugeridos?: string[];
      sugerencia?: string;
    };
  }>({ 
    isOpen: false, 
    mensaje: '', 
    detalle: {} 
  });

  // Estados de carga
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadDatosIniciales();
  }, [tournamentId]);

  const loadDatosIniciales = async () => {
    await Promise.all([
      loadSedesAsignadas(),
      loadCategorias(),
      loadDiasConfigurados(),
      loadCanchas(),
    ]);
  };

  const loadSedesAsignadas = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/sedes`);
      if (data.sedes?.length > 0) {
        // Ordenar por orden ascendente
        const sedesOrdenadas = data.sedes
          .map((s: any) => ({
            id: s.id,
            nombre: s.nombre,
            ciudad: s.ciudad,
            canchas: s.canchas || 0,
            orden: s.orden ?? 0,
          }))
          .sort((a: any, b: any) => a.orden - b.orden);
        setSedesAsignadas(sedesOrdenadas);
      } else {
        // No hay sedes asignadas
        setSedesAsignadas([]);
      }
    } catch (err) {
      console.error('Error cargando sedes asignadas:', err);
      setSedesAsignadas([]);
    }
  };

  const loadCategorias = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/categorias`);
      if (data.success) {
        setCategorias(data.categorias || []);
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  const loadDiasConfigurados = async () => {
    try {
      const { data } = await api.get(`/admin/canchas-sorteo/${tournamentId}/configuracion`);
      if (data.success && data.data?.dias) {
        setDias(data.data.dias.map((d: any) => ({
          id: d.id,
          fecha: d.fecha,
          horaInicio: d.horaInicio,
          horaFin: d.horaFin,
          minutosSlot: d.minutosSlot,
          slotsLibres: d.slotsLibres || 0,
          canchas: d.canchas || 0,
        })));
      }
    } catch (err) {
      console.error('Error cargando días:', err);
    }
  };

  const loadCanchas = async () => {
    try {
      const { data } = await api.get(`/admin/canchas-sorteo/${tournamentId}/canchas`);
      if (data.success) {
        setCanchas(data.canchas || []);
      }
    } catch (err) {
      console.error('Error cargando canchas:', err);
    }
  };

  // ============================================
  // PASO 2: Agregar día con selección de canchas
  // ============================================
  const agregarDia = async () => {
    if (!nuevoDia.fecha) {
      showError('Datos incompletos', 'Selecciona una fecha');
      return;
    }
    if (canchas.length === 0) {
      showError('Sin canchas', 'No hay canchas disponibles. Asigna una sede primero.');
      return;
    }
    if (nuevoDia.canchasIds.length === 0) {
      showError('Sin canchas seleccionadas', 'Selecciona al menos una cancha para este día');
      return;
    }

    setLoading(true);
    try {
      // Usar solo las canchas seleccionadas para este día
      const response = await canchasSorteoService.configurarDiaJuego({
        tournamentId,
        fecha: nuevoDia.fecha,
        horaInicio: nuevoDia.horaInicio,
        horaFin: nuevoDia.horaFin,
        minutosSlot: 90,
        canchasIds: nuevoDia.canchasIds, // Solo las seleccionadas
      });
      
      if (response.success) {
        showSuccess(
          'Día configurado', 
          `${nuevoDia.fecha} • ${response.data.slotsGenerados} slots generados`
        );
        await loadDiasConfigurados();
        // Resetear formulario con todas las canchas seleccionadas por defecto
        setNuevoDia({
          fecha: '',
          horaInicio: '18:00',
          horaFin: '23:00',
          minutosSlot: 90,
          canchasIds: canchas.map(c => c.id),
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error agregando día';
      showError('Error al agregar día', msg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PASO 2: Eliminar día
  // ============================================
  const eliminarDia = async (diaId: string, fecha: string) => {
    const confirmed = await confirm({
      title: '¿Eliminar día?',
      message: `Se eliminará el día ${fecha} y todos sus slots. Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });

    if (!confirmed) return;
    
    setLoading(true);
    try {
      await api.delete(`/admin/canchas-sorteo/dias/${diaId}`);
      showSuccess('Día eliminado', `El día ${fecha} y sus slots han sido eliminados`);
      await loadDiasConfigurados();
    } catch (err: any) {
      showError('Error al eliminar', err.response?.data?.message || 'No se pudo eliminar el día');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PASO 3: Sortear Directo (MVP Simplificado)
  // ============================================
  const MINIMO_PAREJAS_MVP = 8; // MVP: Mínimo 8 parejas para sortear

  const sortearDirecto = async () => {
    if (categoriasSeleccionadas.length === 0) {
      showError('Selecciona al menos una categoría');
      return;
    }

    // Validación simple MVP: mínimo 8 parejas por categoría
    const categoriasInvalidas = categorias
      .filter(c => categoriasSeleccionadas.includes(c.id))
      .filter(c => c.parejas < MINIMO_PAREJAS_MVP);
    
    if (categoriasInvalidas.length > 0) {
      showError(
        'No se puede sortear',
        `${categoriasInvalidas.map(c => c.nombre).join(', ')}: necesita al menos ${MINIMO_PAREJAS_MVP} parejas`
      );
      return;
    }

    // Confirmación simple
    const confirmed = await confirm({
      title: '¿Sortear ahora?',
      message: `Se sortearán ${categoriasSeleccionadas.length} categoría(s). Las inscripciones se cerrarán.`,
      variant: 'danger',
      confirmText: 'Sortear',
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const resultado = await canchasSorteoService.cerrarInscripcionesYsortear({
        tournamentId,
        categoriasIds: categoriasSeleccionadas,
      });
      
      // NUEVO: Mostrar mensaje incluyendo categorías ignoradas (ya sorteadas)
      const msgBase = `${resultado.categoriasSorteadas.length} categorías sorteadas`;
      const msgIgnoradas = resultado.categoriasIgnoradas?.length 
        ? ` (${resultado.categoriasIgnoradas.length} ya sorteadas ignoradas)` 
        : '';
      
      showSuccess(
        '¡Sorteo completado!',
        `${msgBase}${msgIgnoradas}`
      );
      
      // Recargar datos
      await loadCategorias();
      setCategoriasSeleccionadas([]);
      
    } catch (err: any) {
      // Verificar si es error de slots faltantes
      const errorData = err.response?.data;
      if (errorData?.detalle?.slotsFaltantes > 0 || 
          errorData?.detalle?.fasesFaltantesPorCategoria ||
          errorData?.message?.includes('slots')) {
        
        // Transformar la respuesta del backend al formato esperado por el modal
        const detalle = errorData.detalle || {};
        const categoriasAfectadas = detalle.fasesFaltantesPorCategoria?.map((cat: any) => ({
          nombre: cat.categoria,
          fasesFaltantes: cat.fasesFaltantes,
          slotsFaltantes: cat.slotsFaltantes,
        })) || detalle.categoriasAfectadas;
        
        setModalSlotsFaltantes({
          isOpen: true,
          mensaje: errorData.message || 'No hay suficientes slots disponibles',
          detalle: {
            ...detalle,
            categoriasAfectadas,
          },
        });
      } else {
        showError('Error en sorteo', errorData?.message || 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Helpers UI
  // ============================================
  const toggleCategoria = (id: string) => {
    setCategoriasSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const seleccionarTodas = () => {
    // FIX: Mínimo 8 parejas y que no esté ya sorteada (por fixtureVersionId o estado)
    const estadosSorteados = ['CERRADA', 'INSCRIPCIONES_CERRADAS', 'FIXTURE_BORRADOR', 'SORTEO_REALIZADO', 'EN_CURSO'];
    const disponibles = categorias
      .filter(c => c.parejas >= MINIMO_PAREJAS_MVP && !c.fixtureVersionId && !estadosSorteados.includes(c.estado))
      .map(c => c.id);
    setCategoriasSeleccionadas(disponibles);
  };

  // MVP: Eliminada función irAPaso2 - no se necesita con sorteo directo

  // ============================================
  // PASO 1: Reordenar sedes
  // ============================================
  const moverSede = async (sedeId: string, direccion: 'arriba' | 'abajo') => {
    try {
      const sedesOrdenadas = [...sedesAsignadas].sort((a, b) => a.orden - b.orden);
      const indexActual = sedesOrdenadas.findIndex((s: any) => s.id === sedeId);
      if (indexActual === -1) return;

      const nuevoIndex = direccion === 'arriba' ? indexActual - 1 : indexActual + 1;
      if (nuevoIndex < 0 || nuevoIndex >= sedesOrdenadas.length) return;

      // Intercambiar orden
      const sedeActual = sedesOrdenadas[indexActual];
      const sedeSwap = sedesOrdenadas[nuevoIndex];
      const ordenActual = sedeActual.orden;
      const ordenSwap = sedeSwap.orden;

      // Preparar array con nuevo orden
      const ordenSedes = sedesOrdenadas.map(s => {
        if (s.id === sedeId) return { sedeId: s.id, orden: ordenSwap };
        if (s.id === sedeSwap.id) return { sedeId: s.id, orden: ordenActual };
        return { sedeId: s.id, orden: s.orden };
      });

      await api.put(`/admin/torneos/${tournamentId}/sedes/reordenar`, { ordenSedes });
      await loadSedesAsignadas();
      showSuccess('Orden actualizado', 'La prioridad de sedes se ha actualizado');
    } catch (err) {
      console.error('Error reordenando sede:', err);
      showError('Error', 'No se pudo actualizar el orden');
    }
  };

  // ============================================
  // PASO 1: Confirmar y eliminar sede
  // ============================================
  const confirmarEliminarSede = (sede: { id: string; nombre: string }) => {
    setModalEliminar({ isOpen: true, sede, isLoading: false });
  };

  const ejecutarEliminarSede = async () => {
    if (!modalEliminar.sede) return;
    
    setModalEliminar(prev => ({ ...prev, isLoading: true }));
    try {
      await api.delete(`/admin/torneos/${tournamentId}/sedes/${modalEliminar.sede.id}`);
      showSuccess('Sede eliminada', `La sede ${modalEliminar.sede.nombre} ha sido removida`);
      await loadSedesAsignadas();
      await loadCanchas();
      setModalEliminar({ isOpen: false, sede: null, isLoading: false });
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo eliminar la sede');
      setModalEliminar(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ============================================
  // PASO 1: Cambiar sede
  // ============================================
  const iniciarCambioSede = async (sede: { id: string; nombre: string }) => {
    setModalCambiar({ isOpen: true, sedeActual: sede, sedesDisponibles: [], isLoading: true });
    try {
      // Cargar sedes disponibles
      const { data } = await api.get('/admin/sedes?activas=true');
      // Filtrar las que ya están asignadas (excepto la actual)
      const disponibles = (data.sedes || []).filter(
        (s: any) => !sedesAsignadas.some(sa => sa.id === s.id) || s.id === sede.id
      );
      setModalCambiar(prev => ({ ...prev, sedesDisponibles: disponibles, isLoading: false }));
    } catch (err) {
      showError('Error', 'No se pudieron cargar las sedes disponibles');
      setModalCambiar({ isOpen: false, sedeActual: null, sedesDisponibles: [], isLoading: false });
    }
  };

  const ejecutarCambioSede = async (nuevaSedeId: string) => {
    if (!modalCambiar.sedeActual) return;
    
    setModalCambiar(prev => ({ ...prev, isLoading: true }));
    try {
      await api.put(`/admin/torneos/${tournamentId}/sedes/${modalCambiar.sedeActual.id}/cambiar`, {
        nuevaSedeId,
      });
      showSuccess('Sede cambiada', 'La sede ha sido reemplazada exitosamente');
      await loadSedesAsignadas();
      await loadCanchas();
      setModalCambiar({ isOpen: false, sedeActual: null, sedesDisponibles: [], isLoading: false });
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo cambiar la sede');
      setModalCambiar(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#df2531]" />
          Canchas y Sorteo
        </h2>
        <p className="text-gray-400 text-sm">
          MVP: Asigna sede, agrega días y sortea
        </p>
      </div>

      {/* ============================================
          PASO 1: ASIGNAR SEDES (Múltiples con orden)
      ============================================ */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setPaso1Abierto(!paso1Abierto)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              sedesAsignadas.length > 0 ? 'bg-emerald-500/20' : 'bg-[#df2531]/20'
            }`}>
              <span className={`font-bold text-sm ${
                sedesAsignadas.length > 0 ? 'text-emerald-400' : 'text-[#df2531]'
              }`}>1</span>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Asignar Sedes</h3>
              <p className="text-sm text-gray-500">
                {sedesAsignadas.length > 0 
                  ? `${sedesAsignadas.length} sede(s) • ${sedesAsignadas.reduce((acc, s) => acc + s.canchas, 0)} canchas total`
                  : 'Selecciona las sedes donde se jugará el torneo'}
              </p>
            </div>
          </div>
          {paso1Abierto ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        <AnimatePresence>
          {paso1Abierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10"
            >
              <div className="p-6 space-y-4">
                {/* Info de prioridad */}
                {sedesAsignadas.length > 1 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-xs text-blue-400 flex items-center gap-2">
                      <GripVertical className="w-4 h-4" />
                      Usa las flechas para reordenar. La sede #1 se llenará primero durante el sorteo.
                    </p>
                  </div>
                )}

                {/* Lista de sedes ordenadas */}
                {sedesAsignadas.length > 0 && (
                  <div className="space-y-2">
                    {sedesAsignadas.map((sede, index) => {
                      const isFirst = index === 0;
                      const isLast = index === sedesAsignadas.length - 1;
                      
                      return (
                        <motion.div
                          key={sede.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 border rounded-lg transition-all ${
                            isFirst ? 'bg-[#df2531]/5 border-[#df2531]/30' : 'bg-white/[0.02] border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Número de orden */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                              isFirst ? 'bg-[#df2531] text-white' : 'bg-white/10 text-gray-400'
                            }`}>
                              {index + 1}
                            </div>

                            {/* Icono sede */}
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-5 h-5 text-emerald-400" />
                            </div>

                            {/* Info sede */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium">{sede.nombre}</h4>
                              <p className="text-sm text-gray-400">{sede.ciudad}</p>
                              <p className="text-xs text-emerald-400 mt-0.5">{sede.canchas} canchas</p>
                            </div>

                            {/* Controles: Orden + Acciones */}
                            <div className="flex items-center gap-1">
                              {/* Reordenar (solo si hay múltiples) */}
                              {sedesAsignadas.length > 1 && (
                                <>
                                  <button
                                    onClick={() => moverSede(sede.id, 'arriba')}
                                    disabled={isFirst}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Mover arriba"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => moverSede(sede.id, 'abajo')}
                                    disabled={isLast}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Mover abajo"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {/* Cambiar sede */}
                              <button
                                onClick={() => iniciarCambioSede(sede)}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                                title="Cambiar por otra sede"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </button>

                              {/* Eliminar sede */}
                              <button
                                onClick={() => confirmarEliminarSede(sede)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                title="Eliminar sede"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Badge de prioridad */}
                          {isFirst && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-[#df2531]">
                              <span className="w-1.5 h-1.5 bg-[#df2531] rounded-full animate-pulse" />
                              Prioridad alta - Se llena primero en el sorteo
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Botón agregar/cambiar sede */}
                <button
                  onClick={() => setMostrarModalSedes(true)}
                  className={`w-full p-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-all ${
                    sedesAsignadas.length > 0 
                      ? 'border-[#df2531]/40 text-[#df2531] hover:bg-[#df2531]/5' 
                      : 'border-white/20 text-gray-400 hover:border-[#df2531]/40 hover:text-[#df2531]'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">
                    {sedesAsignadas.length > 0 ? 'Agregar Otra Sede' : 'Seleccionar Sede'}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================
          PASO 2: CONFIGURAR DÍAS (MVP)
      ============================================ */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setPaso2Abierto(!paso2Abierto)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              dias.length > 0 ? 'bg-emerald-500/20' : 'bg-[#df2531]/20'
            }`}>
              <span className={`font-bold text-sm ${
                dias.length > 0 ? 'text-emerald-400' : 'text-[#df2531]'
              }`}>2</span>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Configurar Días de Juego</h3>
              <p className="text-sm text-gray-500">
                {dias.length > 0 
                  ? `${dias.length} día(s) • ${dias.reduce((acc, d) => acc + d.slotsLibres, 0)} slots libres`
                  : 'Agrega días disponibles para el torneo'}
              </p>
            </div>
          </div>
          {paso2Abierto ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        <AnimatePresence>
          {paso2Abierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10"
            >
              <div className="p-6 space-y-4">
                {/* Días ya configurados */}
                {dias.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-400">Días configurados:</h4>
                    <div className="grid gap-2">
                      {dias.map((dia) => (
                        <div key={dia.id} className="bg-white/[0.03] rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-[#df2531]" />
                            <span className="text-white font-medium">
                              {formatDatePY(dia.fecha)}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {dia.horaInicio} - {dia.horaFin}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm ${dia.slotsLibres === 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                              {dia.slotsLibres === 0 ? 'Sin slots - elimina y vuelve a agregar' : `${dia.slotsLibres} slots`}
                            </span>
                            <button
                              onClick={() => eliminarDia(dia.id, dia.fecha)}
                              disabled={loading}
                              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Eliminar día"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulario para agregar día - MVP Simplificado */}
                <div className="bg-[#0B0E14] rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#df2531]" />
                    Agregar nuevo día
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Fecha</label>
                      <input
                        type="date"
                        value={nuevoDia.fecha}
                        onChange={(e) => setNuevoDia({ ...nuevoDia, fecha: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Hora inicio</label>
                      <input
                        type="time"
                        value={nuevoDia.horaInicio}
                        onChange={(e) => setNuevoDia({ ...nuevoDia, horaInicio: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Hora fin</label>
                      <input
                        type="time"
                        value={nuevoDia.horaFin}
                        onChange={(e) => setNuevoDia({ ...nuevoDia, horaFin: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200"
      />
                    </div>
                  </div>

                  {/* Selector de canchas para este día */}
                  {canchas.length === 0 ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-400">
                        No hay canchas disponibles. Asigna una sede primero.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-sm text-gray-400 block">
                        Canchas disponibles este día 
                        <span className="text-gray-600 ml-1">
                          (desmarca las que estén en mantenimiento)
                        </span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[...canchas].sort((a, b) => {
                          // Primero ordenar por sede, luego por nombre de cancha
                          const sedeCompare = a.sede.nombre.localeCompare(b.sede.nombre);
                          if (sedeCompare !== 0) return sedeCompare;
                          return a.nombre.localeCompare(b.nombre);
                        }).map((cancha) => (
                          <label
                            key={cancha.id}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                              nuevoDia.canchasIds.includes(cancha.id)
                                ? 'bg-[#df2531]/10 border-[#df2531]/30'
                                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={nuevoDia.canchasIds.includes(cancha.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNuevoDia(prev => ({
                                    ...prev,
                                    canchasIds: [...prev.canchasIds, cancha.id]
                                  }));
                                } else {
                                  setNuevoDia(prev => ({
                                    ...prev,
                                    canchasIds: prev.canchasIds.filter(id => id !== cancha.id)
                                  }));
                                }
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-[#0B0E14] text-[#df2531] focus:ring-[#df2531]/50"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className={`text-sm truncate ${
                                nuevoDia.canchasIds.includes(cancha.id) ? 'text-white' : 'text-gray-400'
                              }`}>
                                {cancha.nombre}
                              </span>
                              <span className={`text-[10px] truncate ${
                                nuevoDia.canchasIds.includes(cancha.id) ? 'text-[#df2531]/70' : 'text-gray-600'
                              }`}>
                                {cancha.sede.nombre}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      {nuevoDia.canchasIds.length === 0 && (
                        <p className="text-sm text-yellow-400">
                          Selecciona al menos una cancha
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {nuevoDia.canchasIds.length} de {canchas.length} canchas seleccionadas • Slots de 90 min
                      </p>
                    </div>
                  )}

                  <button
                    onClick={agregarDia}
                    disabled={loading || canchas.length === 0}
                    className="w-full py-3 bg-[#df2531] hover:bg-[#df2531]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {loading ? 'Agregando...' : 'Agregar Día'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================
          PASO 3: SORTEAR (MVP)
      ============================================ */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setPaso3Abierto(!paso3Abierto)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              categorias.some(c => c.estado === 'CERRADA') ? 'bg-emerald-500/20' : 'bg-[#df2531]/20'
            }`}>
              <span className={`font-bold text-sm ${
                categorias.some(c => c.estado === 'CERRADA') ? 'text-emerald-400' : 'text-[#df2531]'
              }`}>3</span>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Cerrar Inscripciones y Sortear</h3>
              <p className="text-sm text-gray-500">
                {categorias.filter(c => c.estado === 'CERRADA').length > 0
                  ? `${categorias.filter(c => c.estado === 'CERRADA').length} categoría(s) sorteada(s)`
                  : 'Selecciona categorías y ejecuta el sorteo'}
              </p>
            </div>
          </div>
          {paso3Abierto ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        <AnimatePresence>
          {paso3Abierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10"
            >
              <div className="p-6 space-y-4">
                {/* Lista de categorías */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-400">Categorías disponibles:</h4>
                    <button
                      onClick={seleccionarTodas}
                      className="text-xs text-[#df2531] hover:underline"
                    >
                      Seleccionar todas las válidas
                    </button>
                  </div>

                  {categorias.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay categorías configuradas</p>
                  ) : (
                    <div className="grid gap-2">
                      {categorias.map((cat) => {
                        // MVP: Mínimo 8 parejas para poder sortear
                        // FIX: Una categoría está sorteada si tiene fixtureVersionId O está en estado sorteado
                        const estadosSorteados = ['CERRADA', 'INSCRIPCIONES_CERRADAS', 'FIXTURE_BORRADOR', 'SORTEO_REALIZADO', 'EN_CURSO'];
                        const estaSorteada = !!cat.fixtureVersionId || estadosSorteados.includes(cat.estado);
                        const puedeSortear = cat.parejas >= MINIMO_PAREJAS_MVP && !estaSorteada;
                        const isSeleccionada = categoriasSeleccionadas.includes(cat.id);
                        
                        return (
                          <div
                            key={cat.id}
                            onClick={() => puedeSortear && toggleCategoria(cat.id)}
                            className={`p-3 rounded-lg border transition-all ${
                              estaSorteada
                                ? 'bg-emerald-500/10 border-emerald-500/30 cursor-default'
                                : puedeSortear
                                  ? isSeleccionada
                                    ? 'bg-[#df2531]/10 border-[#df2531]/50 cursor-pointer'
                                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 cursor-pointer'
                                  : 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {estaSorteada ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                    isSeleccionada ? 'bg-[#df2531] border-[#df2531]' : 'border-gray-500'
                                  }`}>
                                    {isSeleccionada && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                )}
                                <div>
                                  <p className="text-white font-medium">{cat.nombre}</p>
                                  <p className="text-xs text-gray-500">
                                    {cat.parejas} parejas (mín: {MINIMO_PAREJAS_MVP})
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {estaSorteada ? (
                                  <span className="text-xs text-emerald-400 font-medium">Sorteada</span>
                                ) : cat.parejas < MINIMO_PAREJAS_MVP ? (
                                  <span className="text-xs text-red-400">Necesita {MINIMO_PAREJAS_MVP} parejas</span>
                                ) : (
                                  <span className="text-xs text-gray-500">Disponible</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Botón de sorteo MVP - Directo sin verificación compleja */}
                <button
                  onClick={sortearDirecto}
                  disabled={loading || categoriasSeleccionadas.length === 0}
                  className="w-full py-3 bg-[#df2531] hover:bg-[#df2531]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sorteando...
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-4 h-4" />
                      Sortear Ahora {categoriasSeleccionadas.length > 0 && `(${categoriasSeleccionadas.length})`}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================
          MODALES
      ============================================ */}
      <ModalSedes
        isOpen={mostrarModalSedes}
        onClose={() => setMostrarModalSedes(false)}
        tournamentId={tournamentId}
        onSedesUpdated={() => {
          loadSedesAsignadas();
          loadCanchas();
        }}
      />

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

      {/* ============================================
          MODAL: CONFIRMAR ELIMINAR SEDE
      ============================================ */}
      <ConfirmModal
        isOpen={modalEliminar.isOpen}
        onClose={() => setModalEliminar({ isOpen: false, sede: null, isLoading: false })}
        onConfirm={ejecutarEliminarSede}
        title="¿Eliminar sede?"
        message={modalEliminar.sede 
          ? `Se eliminará la sede "${modalEliminar.sede.nombre}" y todas sus canchas configuradas. Los días de juego que usen estas canchas perderán sus slots. Esta acción no se puede deshacer.`
          : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={modalEliminar.isLoading}
      />

      {/* ============================================
          MODAL: CAMBIAR SEDE
      ============================================ */}
      {modalCambiar.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0B0E14] border border-white/10 rounded-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Cambiar Sede
              </h3>
              <button 
                onClick={() => setModalCambiar({ isOpen: false, sedeActual: null, sedesDisponibles: [], isLoading: false })}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4">
              {modalCambiar.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-[#df2531]/30 border-t-[#df2531] rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4">
                    Sede actual: <span className="text-white font-medium">{modalCambiar.sedeActual?.nombre}</span>
                  </p>
                  <p className="text-sm text-gray-400 mb-3">
                    Selecciona la nueva sede:
                  </p>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {modalCambiar.sedesDisponibles
                      .filter((s: any) => s.id !== modalCambiar.sedeActual?.id)
                      .map((sede: any) => (
                        <button
                          key={sede.id}
                          onClick={() => ejecutarCambioSede(sede.id)}
                          disabled={modalCambiar.isLoading}
                          className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#df2531]/30 rounded-lg text-left transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{sede.nombre}</p>
                              <p className="text-sm text-gray-500">{sede.ciudad}</p>
                              <p className="text-xs text-emerald-400 mt-1">
                                {Array.isArray(sede.canchas) ? sede.canchas.length : 0} canchas
                              </p>
                            </div>
                            <span className="text-sm text-[#df2531]">Seleccionar →</span>
                          </div>
                        </button>
                      ))}
                    
                    {modalCambiar.sedesDisponibles.filter((s: any) => s.id !== modalCambiar.sedeActual?.id).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No hay otras sedes disponibles
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ============================================
          MODAL: SLOTS FALTANTES - ERROR CUSTOM
      ============================================ */}
      {modalSlotsFaltantes.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#151921] border border-amber-500/30 rounded-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="h-2 w-full bg-amber-500" />
            
            <div className="p-6">
              {/* Icono y título */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white pr-8">No hay suficientes slots</h3>
                  <p className="text-gray-400 text-sm mt-1">{modalSlotsFaltantes.mensaje}</p>
                </div>
                <button 
                  onClick={() => setModalSlotsFaltantes({ isOpen: false, mensaje: '', detalle: {} })}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Detalle de categorías afectadas */}
              {modalSlotsFaltantes.detalle.categoriasAfectadas && modalSlotsFaltantes.detalle.categoriasAfectadas.length > 0 && (
                <div className="bg-white/[0.03] rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-medium text-white mb-3">Categorías con slots faltantes:</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {modalSlotsFaltantes.detalle.categoriasAfectadas.map((cat, idx) => (
                      <div key={idx} className="bg-white/[0.02] rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white font-medium text-sm">{cat.nombre}</span>
                          <span className="text-[#df2531] text-xs font-medium">{cat.slotsFaltantes} slots faltantes</span>
                        </div>
                        <div className="text-xs text-gray-400 flex flex-wrap gap-1">
                          Fases faltantes:
                          {cat.fasesFaltantes.map((f, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalle de slots (fallback para errores antiguos) */}
              {!modalSlotsFaltantes.detalle.categoriasAfectadas && modalSlotsFaltantes.detalle.totalSlotsNecesarios && (
                <div className="bg-white/[0.03] rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Slots necesarios:</span>
                    <span className="text-white font-medium">{modalSlotsFaltantes.detalle.totalSlotsNecesarios}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Slots disponibles:</span>
                    <span className="text-emerald-400 font-medium">{modalSlotsFaltantes.detalle.slotsDisponibles}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Slots faltantes:</span>
                    <span className="text-[#df2531] font-medium">{modalSlotsFaltantes.detalle.slotsFaltantes}</span>
                  </div>
                </div>
              )}

              {/* Solución */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2 mb-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-300 font-medium text-sm">Solución:</span>
                </div>
                <p className="text-blue-400 text-sm pl-7">
                  {modalSlotsFaltantes.detalle.sugerencia || 'Agrega más sedes o configura más días de juego en el Paso 2. Cada sede agregada aporta sus canchas disponibles.'}
                </p>
                {modalSlotsFaltantes.detalle.fasesAfectadas && modalSlotsFaltantes.detalle.fasesAfectadas.length > 0 && (
                  <div className="mt-3 pl-7 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">Fases afectadas:</span>
                    {modalSlotsFaltantes.detalle.fasesAfectadas.map((fase, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">
                        {fase}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón */}
              <button
                onClick={() => setModalSlotsFaltantes({ isOpen: false, mensaje: '', detalle: {} })}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-all"
              >
                Entendido, agregaré más sedes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MODAL: ASIGNAR SEDE (MVP - Simplificado)
// ============================================
function ModalSedes({ 
  isOpen, 
  onClose, 
  tournamentId,
  onSedesUpdated 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  tournamentId: string;
  onSedesUpdated: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [sedes, setSedes] = useState<any[]>([]);
  const [sedesAsignadas, setSedesAsignadas] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) loadSedes();
  }, [isOpen]);

  const loadSedes = async () => {
    try {
      // Cargar sedes disponibles
      const { data: dispData } = await api.get('/admin/sedes?activas=true');
      setSedes(dispData.sedes || []);
      
      // Cargar sedes ya asignadas
      const { data: asigData } = await api.get(`/admin/torneos/${tournamentId}/sedes`);
      if (asigData.sedes?.length > 0) {
        setSedesAsignadas(asigData.sedes);
      } else {
        setSedesAsignadas([]);
      }
    } catch (err) {
      showError('Error cargando sedes');
    }
  };

  const asignarSede = async (sede: any) => {
    setLoading(true);
    try {
      const { data: result } = await api.post(`/admin/torneos/${tournamentId}/sedes`, { sedeId: sede.id });
      // Usar el conteo de canchas que devuelve el backend (canchas activas del torneo)
      const canchasAgregadas = result.canchasAgregadas || result.sede?.canchas || sede.canchas?.length || 0;
      showSuccess('Sede agregada', `Se agregó ${sede.nombre} con ${canchasAgregadas} canchas`);
      
      // Recargar sedes para obtener el nuevo orden
      const { data: sedesData } = await api.get(`/admin/torneos/${tournamentId}/sedes`);
      if (sedesData.sedes?.length > 0) {
        const sedesOrdenadas = sedesData.sedes
          .map((s: any) => ({
            id: s.id,
            nombre: s.nombre,
            ciudad: s.ciudad,
            canchas: s.canchas || 0,
            orden: s.orden ?? 0,
          }))
          .sort((a: any, b: any) => a.orden - b.orden);
        setSedesAsignadas(sedesOrdenadas);
      }
      
      onSedesUpdated();
      // No cerramos el modal para permitir agregar más sedes
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error agregando sede');
    } finally {
      setLoading(false);
    }
  };

  const quitarSede = async (sedeId: string) => {
    if (!confirm('¿Eliminar esta sede del torneo?')) return;
    
    try {
      await api.delete(`/admin/torneos/${tournamentId}/sedes/${sedeId}`);
      showSuccess('Sede eliminada');
      
      // Actualizar lista local
      setSedesAsignadas(prev => prev.filter(s => s.id !== sedeId));
      onSedesUpdated();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error eliminando sede');
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0B0E14] border border-white/10 rounded-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#df2531]" />
            Gestionar Sedes
          </h3>
          <button onClick={handleClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {/* Sedes ya asignadas */}
          {sedesAsignadas.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Sedes asignadas ({sedesAsignadas.length})
              </h4>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {sedesAsignadas.map((sede, idx) => (
                  <div
                    key={sede.id}
                    className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-emerald-500/20 rounded flex items-center justify-center text-xs text-emerald-400 font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-white text-sm font-medium">{sede.nombre}</p>
                        <p className="text-xs text-gray-400">{sede.canchas} canchas</p>
                      </div>
                    </div>
                    <button
                      onClick={() => quitarSede(sede.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Quitar sede"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Separador */}
          {sedesAsignadas.length > 0 && (
            <div className="border-t border-white/10 my-4" />
          )}

          {/* Agregar nueva sede */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">
              {sedesAsignadas.length > 0 ? 'Agregar otra sede:' : 'Selecciona una sede:'}
            </h4>
            
            {sedes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay más sedes disponibles
              </p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {sedes
                  .filter((s: any) => !sedesAsignadas.some(sa => sa.id === s.id))
                  .map((sede: any) => (
                    <button
                      key={sede.id}
                      onClick={() => asignarSede(sede)}
                      disabled={loading}
                      className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#df2531]/30 rounded-lg text-left transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{sede.nombre}</p>
                          <p className="text-sm text-gray-500">{sede.ciudad}</p>
                          <p className="text-xs text-emerald-400 mt-1">
                            {Array.isArray(sede.canchas) ? sede.canchas.length : 0} canchas
                          </p>
                        </div>
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="text-sm text-[#df2531]">Agregar →</span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Botón cerrar */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={handleClose}
              className="w-full px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              {sedesAsignadas.length > 0 ? 'Listo' : 'Cerrar'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// MVP: Eliminados ModalConfirmacionSorteo y ModalAdvertenciaSlots
// Ahora se usa confirm() simple del sistema para confirmación
