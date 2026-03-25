import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Trophy, Calendar, 
  CheckCircle2, MapPin, Plus, X, Trash2,
  Shuffle
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

  // Estado Paso 1: Sede Asignada
  const [sedeAsignada, setSedeAsignada] = useState<{ id: string; nombre: string; ciudad: string; canchas: number } | null>(null);

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
  // MVP: Eliminados modales complejos de confirmación - uso confirm() simple

  // Estados de carga
  const [loading, setLoading] = useState(false);
  // MVP: Eliminado loadingCalculo - sorteo directo

  // Cargar datos iniciales
  useEffect(() => {
    loadDatosIniciales();
  }, [tournamentId]);

  const loadDatosIniciales = async () => {
    await Promise.all([
      loadSedeAsignada(),
      loadCategorias(),
      loadDiasConfigurados(),
      loadCanchas(),
    ]);
  };

  const loadSedeAsignada = async () => {
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/sedes`);
      if (data.sedes?.length > 0) {
        const sede = data.sedes[0];
        // El backend ya devuelve el conteo de canchas activas del torneo
        setSedeAsignada({
          id: sede.id,
          nombre: sede.nombre,
          ciudad: sede.ciudad,
          canchas: sede.canchas || 0,
        });
      } else {
        // No hay sede asignada
        setSedeAsignada(null);
      }
    } catch (err) {
      console.error('Error cargando sede asignada:', err);
      setSedeAsignada(null);
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
      
      showSuccess(
        '¡Sorteo completado!',
        `${resultado.categoriasSorteadas.length} categorías sorteadas`
      );
      
      // Recargar datos
      await loadCategorias();
      setCategoriasSeleccionadas([]);
      
    } catch (err: any) {
      showError('Error en sorteo', err.response?.data?.message || 'Error desconocido');
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
          PASO 1: ASIGNAR SEDE (MVP)
      ============================================ */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setPaso1Abierto(!paso1Abierto)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              sedeAsignada ? 'bg-emerald-500/20' : 'bg-[#df2531]/20'
            }`}>
              <span className={`font-bold text-sm ${
                sedeAsignada ? 'text-emerald-400' : 'text-[#df2531]'
              }`}>1</span>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Asignar Sede</h3>
              <p className="text-sm text-gray-500">
                {sedeAsignada 
                  ? `${sedeAsignada.nombre} • ${sedeAsignada.canchas} canchas`
                  : 'Selecciona la sede donde se jugará el torneo'}
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
              <div className="p-6">
                {sedeAsignada ? (
                  <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{sedeAsignada.nombre}</h4>
                        <p className="text-sm text-gray-400">{sedeAsignada.ciudad}</p>
                        <p className="text-xs text-emerald-400 mt-1">{sedeAsignada.canchas} canchas disponibles</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMostrarModalSedes(true)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-gray-500" />
                    </div>
                    <h4 className="text-white font-medium mb-2">No hay sede asignada</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Selecciona la sede para copiar automáticamente todas sus canchas
                    </p>
                    <button
                      onClick={() => setMostrarModalSedes(true)}
                      className="px-6 py-2.5 bg-[#df2531] hover:bg-[#df2531]/80 text-white rounded-lg font-medium transition-colors"
                    >
                      Seleccionar Sede
                    </button>
                  </div>
                )}
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
                        {[...canchas].sort((a, b) => a.nombre.localeCompare(b.nombre)).map((cancha) => (
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
                            <span className={`text-sm ${
                              nuevoDia.canchasIds.includes(cancha.id) ? 'text-white' : 'text-gray-400'
                            }`}>
                              {cancha.nombre}
                            </span>
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
          loadSedeAsignada();
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
  const [sedeAsignada, setSedeAsignada] = useState<any>(null);
  const [mostrarSelector, setMostrarSelector] = useState(false);

  useEffect(() => {
    if (isOpen) loadSedes();
  }, [isOpen]);

  const loadSedes = async () => {
    try {
      // Cargar sedes disponibles
      const { data: dispData } = await api.get('/admin/sedes?activas=true');
      setSedes(dispData.sedes || []);
      
      // Verificar si ya hay sede asignada
      const { data: asigData } = await api.get(`/admin/torneos/${tournamentId}/sedes`);
      if (asigData.sedes?.length > 0) {
        setSedeAsignada(asigData.sedes[0]);
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
      showSuccess('Sede asignada', `Se asignó ${sede.nombre} con ${canchasAgregadas} canchas`);
      setSedeAsignada({
        ...sede,
        canchas: canchasAgregadas,
      });
      setMostrarSelector(false);
      onSedesUpdated();
      onClose();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error asignando sede');
    } finally {
      setLoading(false);
    }
  };

  // Resetear mostrarSelector cuando se cierra el modal
  const handleClose = () => {
    setMostrarSelector(false);
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
            {sedeAsignada ? 'Sede Asignada' : 'Seleccionar Sede'}
          </h3>
          <button onClick={handleClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {sedeAsignada && !mostrarSelector ? (
            // Ya hay sede asignada - mostrar info con opción de cambiar
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-white font-medium text-lg">{sedeAsignada.nombre}</h4>
              <p className="text-gray-400 text-sm">{sedeAsignada.ciudad}</p>
              <p className="text-emerald-400 text-sm mt-2">
                {typeof sedeAsignada.canchas === 'number' ? sedeAsignada.canchas : Array.isArray(sedeAsignada.canchas) ? sedeAsignada.canchas.length : 0} canchas disponibles
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => setMostrarSelector(true)}
                  className="px-6 py-2 bg-[#df2531] hover:bg-[#df2531]/80 text-white rounded-lg transition-colors"
                >
                  Cambiar Sede
                </button>
              </div>
            </div>
          ) : (
            // Seleccionar sede - lista simple
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <p className="text-sm text-gray-400 mb-3">
                Selecciona la sede donde se jugará el torneo:
              </p>
              {sedes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay sedes disponibles
                </p>
              ) : (
                sedes.map((sede: any) => (
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
                        <span className="text-sm text-[#df2531]">Usar esta sede →</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// MVP: Eliminados ModalConfirmacionSorteo y ModalAdvertenciaSlots
// Ahora se usa confirm() simple del sistema para confirmación
