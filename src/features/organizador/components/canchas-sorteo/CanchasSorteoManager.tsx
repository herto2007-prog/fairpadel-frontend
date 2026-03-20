import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Trophy, Calendar, 
  CheckCircle2, MapPin, Plus, X,
  Calculator, Shuffle, AlertTriangle, Info
} from 'lucide-react';
import { canchasSorteoService, CalculoSlotsResponse } from '../../services/canchasSorteoService';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';

interface Props {
  tournamentId: string;
}

interface Categoria {
  id: string;
  nombre: string;
  parejas: number;
  minimoParejas: number;
  estado: string;
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
// COMPONENTE PRINCIPAL
// ============================================
export function CanchasSorteoManager({ tournamentId }: Props) {
  const { showSuccess, showError } = useToast();
  
  // Estados de pasos (colapsables)
  const [paso1aAbierto, setPaso1aAbierto] = useState(true);
  const [paso1bAbierto, setPaso1bAbierto] = useState(false);
  const [paso2Abierto, setPaso2Abierto] = useState(false);

  // Estado Paso 1.a: Finales
  const [finales, setFinales] = useState({
    horaInicio: '09:00',
    horaFin: '14:00',
    canchasFinalesIds: [] as string[],
  });

  // Estado Paso 1.b: Días y Canchas
  const [dias, setDias] = useState<DiaConfigurado[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [nuevoDia, setNuevoDia] = useState({
    fecha: '',
    horaInicio: '18:00',
    horaFin: '23:00',
    minutosSlot: 90,
    canchasIds: [] as string[],
  });

  // Estado Paso 2: Categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [calculoSlots, setCalculoSlots] = useState<CalculoSlotsResponse | null>(null);
  
  // Modales
  const [mostrarModalSedes, setMostrarModalSedes] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mostrarModalAdvertencia, setMostrarModalAdvertencia] = useState(false);

  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [loadingCalculo, setLoadingCalculo] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadDatosIniciales();
  }, [tournamentId]);

  const loadDatosIniciales = async () => {
    await Promise.all([
      loadCategorias(),
      loadDiasConfigurados(),
      loadCanchas(),
      loadConfiguracionFinales(),
    ]);
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

  const loadConfiguracionFinales = async () => {
    try {
      const { data } = await api.get(`/admin/canchas-sorteo/${tournamentId}/configuracion`);
      if (data.success && data.data?.finales) {
        setFinales({
          horaInicio: data.data.finales.horaInicio || '09:00',
          horaFin: data.data.finales.horaFin || '14:00',
          canchasFinalesIds: data.data.finales.canchasIds || [],
        });
      }
    } catch (err) {
      console.error('Error cargando configuración de finales:', err);
    }
  };

  // ============================================
  // PASO 1.a: Guardar configuración de finales
  // ============================================
  const guardarFinales = async () => {
    if (finales.canchasFinalesIds.length === 0) {
      showError('Selecciona al menos una cancha para las finales');
      return;
    }
    
    setLoading(true);
    try {
      await canchasSorteoService.configurarFinales({
        tournamentId,
        ...finales,
      });
      showSuccess(
        'Configuración de finales guardada', 
        `${finales.canchasFinalesIds.length} cancha(s) seleccionada(s) • ${finales.horaInicio} a ${finales.horaFin}`
      );
      setPaso1aAbierto(false);
      setPaso1bAbierto(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error guardando finales';
      showError('Error al guardar', msg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PASO 1.b: Agregar día
  // ============================================
  const agregarDia = async () => {
    if (!nuevoDia.fecha) {
      showError('Datos incompletos', 'Selecciona una fecha');
      return;
    }
    if (nuevoDia.canchasIds.length === 0) {
      showError('Datos incompletos', 'Selecciona al menos una cancha');
      return;
    }

    setLoading(true);
    try {
      const response = await canchasSorteoService.configurarDiaJuego({
        tournamentId,
        ...nuevoDia,
      });
      
      if (response.success) {
        showSuccess(
          'Día configurado', 
          `${nuevoDia.fecha} • ${response.data.slotsGenerados} slots generados`
        );
        await loadDiasConfigurados();
        setNuevoDia({
          fecha: '',
          horaInicio: '18:00',
          horaFin: '23:00',
          minutosSlot: 90,
          canchasIds: [],
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
  // PASO 2: Calcular slots necesarios
  // ============================================
  const calcularSlots = async () => {
    if (categoriasSeleccionadas.length === 0) {
      showError('Selecciona al menos una categoría');
      return;
    }

    setLoadingCalculo(true);
    try {
      const resultado = await canchasSorteoService.calcularSlotsNecesarios(
        tournamentId,
        categoriasSeleccionadas
      );
      setCalculoSlots(resultado);
      
      if (resultado.valido) {
        setMostrarModalConfirmacion(true);
      } else {
        setMostrarModalAdvertencia(true);
      }
    } catch (err: any) {
      showError('Error en cálculo', err.response?.data?.message || 'Error desconocido');
    } finally {
      setLoadingCalculo(false);
    }
  };

  // ============================================
  // PASO 2: Cerrar inscripciones y sortear
  // ============================================
  const ejecutarCierreYSorteo = async () => {
    setLoading(true);
    setMostrarModalConfirmacion(false);
    
    try {
      const resultado = await canchasSorteoService.cerrarInscripcionesYsortear({
        tournamentId,
        categoriasIds: categoriasSeleccionadas,
      });
      
      showSuccess(
        '¡Sorteo completado!',
        `${resultado.categoriasSorteadas.length} categorías sorteadas • ${resultado.slotsTotalesReservados} slots reservados`
      );
      
      // Recargar datos
      await loadCategorias();
      await loadDiasConfigurados();
      setCategoriasSeleccionadas([]);
      setCalculoSlots(null);
      
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
    const disponibles = categorias
      .filter(c => c.parejas >= c.minimoParejas && c.estado !== 'CERRADA')
      .map(c => c.id);
    setCategoriasSeleccionadas(disponibles);
  };

  const irAPaso1b = () => {
    setMostrarModalAdvertencia(false);
    setPaso2Abierto(false);
    setPaso1bAbierto(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          Configura canchas, cierra inscripciones y sortea en un solo lugar
        </p>
      </div>

      {/* ============================================
          PASO 1.a: CONFIGURAR FINALES
      ============================================ */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setPaso1aAbierto(!paso1aAbierto)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              finales.canchasFinalesIds.length > 0 ? 'bg-emerald-500/20' : 'bg-[#df2531]/20'
            }`}>
              <span className={`font-bold text-sm ${
                finales.canchasFinalesIds.length > 0 ? 'text-emerald-400' : 'text-[#df2531]'
              }`}>1.a</span>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Configurar Finales</h3>
              <p className="text-sm text-gray-500">
                {finales.canchasFinalesIds.length > 0 
                  ? `${finales.canchasFinalesIds.length} cancha(s) • ${finales.horaInicio} a ${finales.horaFin}`
                  : 'Horario y canchas para la final'}
              </p>
            </div>
          </div>
          {paso1aAbierto ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        <AnimatePresence>
          {paso1aAbierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10"
            >
              <div className="p-6 space-y-4">
                {/* Horarios */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Hora inicio</label>
                    <input
                      type="time"
                      value={finales.horaInicio}
                      onChange={(e) => setFinales({ ...finales, horaInicio: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Hora fin</label>
                    <input
                      type="time"
                      value={finales.horaFin}
                      onChange={(e) => setFinales({ ...finales, horaFin: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                    />
                  </div>
                </div>

                {/* Selector de canchas para finales */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Canchas para las finales <span className="text-[#df2531]">*</span>
                  </label>
                  {canchas.length === 0 ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        No hay canchas asignadas a este torneo.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Primero asigne canchas desde la pestaña "Canchas"
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {canchas.map((cancha) => (
                        <label
                          key={cancha.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            finales.canchasFinalesIds.includes(cancha.id)
                              ? 'bg-[#df2531]/10 border-[#df2531]/50'
                              : 'bg-[#0B0E14] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={finales.canchasFinalesIds.includes(cancha.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFinales({ ...finales, canchasFinalesIds: [...finales.canchasFinalesIds, cancha.id] });
                              } else {
                                setFinales({ ...finales, canchasFinalesIds: finales.canchasFinalesIds.filter(id => id !== cancha.id) });
                              }
                            }}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            finales.canchasFinalesIds.includes(cancha.id)
                              ? 'bg-[#df2531] border-[#df2531]'
                              : 'border-gray-500'
                          }`}>
                            {finales.canchasFinalesIds.includes(cancha.id) && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{cancha.nombre}</p>
                            <p className="text-xs text-gray-500">{cancha.sede?.nombre}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {finales.canchasFinalesIds.length} cancha(s) seleccionada(s)
                  </p>
                </div>

                <button
                  onClick={guardarFinales}
                  disabled={loading || finales.canchasFinalesIds.length === 0}
                  className="w-full py-3 bg-[#df2531] hover:bg-[#df2531]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Guardando...' : 'Guardar Configuración de Finales'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================
          PASO 1.b: CONFIGURAR DÍAS
      ============================================ */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setPaso1bAbierto(!paso1bAbierto)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              dias.length > 0 ? 'bg-emerald-500/20' : 'bg-[#df2531]/20'
            }`}>
              <span className={`font-bold text-sm ${
                dias.length > 0 ? 'text-emerald-400' : 'text-[#df2531]'
              }`}>1.b</span>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Configurar Días de Juego</h3>
              <p className="text-sm text-gray-500">
                {dias.length > 0 
                  ? `${dias.length} día(s) configurado(s) • ${dias.reduce((acc, d) => acc + d.slotsLibres, 0)} slots`
                  : 'Agrega días disponibles para el torneo'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMostrarModalSedes(true);
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
            >
              <MapPin className="w-4 h-4 inline mr-1" />
              Gestionar Sedes
            </button>
            {paso1bAbierto ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </button>

        <AnimatePresence>
          {paso1bAbierto && (
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
                            <span className="text-white font-medium">{dia.fecha}</span>
                            <span className="text-gray-500 text-sm">
                              {dia.horaInicio} - {dia.horaFin}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-400 text-sm">
                              {dia.slotsLibres} slots
                            </span>
                            <span className="text-gray-500 text-sm">
                              {dia.canchas} canchas
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulario nuevo día */}
                <div className="border-t border-white/10 pt-4 space-y-4">
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
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Hora inicio</label>
                      <input
                        type="time"
                        value={nuevoDia.horaInicio}
                        onChange={(e) => setNuevoDia({ ...nuevoDia, horaInicio: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Hora fin</label>
                      <input
                        type="time"
                        value={nuevoDia.horaFin}
                        onChange={(e) => setNuevoDia({ ...nuevoDia, horaFin: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Duración por slot</label>
                      <select
                        value={nuevoDia.minutosSlot}
                        onChange={(e) => setNuevoDia({ ...nuevoDia, minutosSlot: Number(e.target.value) })}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                      >
                        <option value={60}>60 minutos</option>
                        <option value={90}>90 minutos</option>
                        <option value={120}>120 minutos</option>
                      </select>
                    </div>
                  </div>

                  {/* Selector de canchas para el día */}
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">
                      Canchas disponibles este día <span className="text-[#df2531]">*</span>
                    </label>
                    {canchas.length === 0 ? (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-sm text-yellow-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          No hay canchas asignadas
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {canchas.map((cancha) => (
                          <label
                            key={cancha.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              nuevoDia.canchasIds.includes(cancha.id)
                                ? 'bg-[#df2531]/10 border-[#df2531]/50'
                                : 'bg-[#0B0E14] border-white/10 hover:border-white/20'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={nuevoDia.canchasIds.includes(cancha.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNuevoDia({ ...nuevoDia, canchasIds: [...nuevoDia.canchasIds, cancha.id] });
                                } else {
                                  setNuevoDia({ ...nuevoDia, canchasIds: nuevoDia.canchasIds.filter(id => id !== cancha.id) });
                                }
                              }}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              nuevoDia.canchasIds.includes(cancha.id)
                                ? 'bg-[#df2531] border-[#df2531]'
                                : 'border-gray-500'
                            }`}>
                              {nuevoDia.canchasIds.includes(cancha.id) && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{cancha.nombre}</p>
                              <p className="text-xs text-gray-500">{cancha.sede?.nombre}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={agregarDia}
                    disabled={loading || nuevoDia.canchasIds.length === 0 || !nuevoDia.fecha}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-white rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Agregando...' : 'Agregar Día'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================
          PASO 2: CERRAR Y SORTEAR
      ============================================ */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setPaso2Abierto(!paso2Abierto)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              categorias.some(c => c.estado === 'CERRADA') ? 'bg-emerald-500/20' : 'bg-[#df2531]/20'
            }`}>
              <span className={`font-bold text-sm ${
                categorias.some(c => c.estado === 'CERRADA') ? 'text-emerald-400' : 'text-[#df2531]'
              }`}>2</span>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Cerrar Inscripciones y Sortear</h3>
              <p className="text-sm text-gray-500">
                {categoriasSeleccionadas.length > 0 
                  ? `${categoriasSeleccionadas.length} categoría(s) seleccionada(s)`
                  : 'Selecciona categorías y ejecuta el sorteo'}
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
              <div className="p-6 space-y-6">
                {/* Categorías disponibles */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-400">Categorías disponibles:</h4>
                    <button
                      onClick={seleccionarTodas}
                      className="text-xs text-[#df2531] hover:text-[#df2531]/80 transition-colors"
                    >
                      Seleccionar todas las válidas
                    </button>
                  </div>

                  <div className="space-y-2">
                    {categorias.map((cat) => {
                      const puedeSortear = cat.parejas >= cat.minimoParejas && cat.estado !== 'CERRADA';
                      const seleccionada = categoriasSeleccionadas.includes(cat.id);
                      
                      return (
                        <button
                          key={cat.id}
                          onClick={() => puedeSortear && toggleCategoria(cat.id)}
                          disabled={!puedeSortear}
                          className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                            seleccionada
                              ? 'bg-[#df2531]/10 border-[#df2531]/50'
                              : puedeSortear
                              ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                              : 'opacity-50 cursor-not-allowed bg-white/[0.01] border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                              seleccionada ? 'bg-[#df2531] border-[#df2531]' : 'border-gray-500'
                            }`}>
                              {seleccionada && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className="text-left">
                              <p className="text-white font-medium">{cat.nombre}</p>
                              <p className="text-sm text-gray-500">
                                {cat.parejas} parejas inscriptas
                                {cat.estado === 'CERRADA' && (
                                  <span className="text-emerald-400 ml-2">• Sorteo completado</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {!puedeSortear && cat.estado !== 'CERRADA' && (
                              <span className="text-xs text-yellow-500">
                                Mínimo {cat.minimoParejas} parejas
                              </span>
                            )}
                            {cat.estado === 'CERRADA' && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Botón calcular y sortear */}
                {categoriasSeleccionadas.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <button
                      onClick={calcularSlots}
                      disabled={loadingCalculo}
                      className="w-full py-4 bg-[#df2531] hover:bg-[#df2531]/80 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      {loadingCalculo ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Calculando...
                        </>
                      ) : (
                        <>
                          <Calculator className="w-5 h-5" />
                          Calcular necesidad y preparar sorteo
                          <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                            {categoriasSeleccionadas.length}
                          </span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Se calcularán los slots necesarios para todas las fases (Zona a Final)
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================
          MODALES
      ============================================ */}
      
      {/* Modal: Gestionar Sedes */}
      <ModalSedes 
        isOpen={mostrarModalSedes}
        onClose={() => setMostrarModalSedes(false)}
        tournamentId={tournamentId}
        onSedesUpdated={loadCanchas}
      />

      {/* Modal: Confirmación de Sorteo */}
      <ModalConfirmacionSorteo
        isOpen={mostrarModalConfirmacion}
        onClose={() => setMostrarModalConfirmacion(false)}
        calculo={calculoSlots}
        onConfirm={ejecutarCierreYSorteo}
        loading={loading}
      />

      {/* Modal: Advertencia - Faltan Canchas */}
      <ModalAdvertenciaCanchas
        isOpen={mostrarModalAdvertencia}
        onClose={() => setMostrarModalAdvertencia(false)}
        calculo={calculoSlots}
        onAgregarDias={irAPaso1b}
      />
    </div>
  );
}

// ============================================
// MODAL: GESTIONAR SEDES
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
  const [sedesDisponibles, setSedesDisponibles] = useState<any[]>([]);
  const [sedesAsignadas, setSedesAsignadas] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadSedes();
    }
  }, [isOpen]);

  const loadSedes = async () => {
    try {
      const [disp, asig] = await Promise.all([
        api.get('/admin/sedes?activas=true'),
        api.get(`/admin/torneos/${tournamentId}/sedes`),
      ]);
      setSedesDisponibles(disp.data.sedes || []);
      setSedesAsignadas(asig.data.sedes || []);
    } catch (err) {
      showError('Error cargando sedes');
    }
  };

  const asignarSede = async (sedeId: string) => {
    setLoading(true);
    try {
      await api.post(`/admin/torneos/${tournamentId}/sedes`, { sedeId });
      showSuccess('Sede asignada');
      await loadSedes();
      onSedesUpdated();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error asignando sede');
    } finally {
      setLoading(false);
    }
  };

  const removerSede = async (sedeId: string) => {
    setLoading(true);
    try {
      await api.delete(`/admin/torneos/${tournamentId}/sedes/${sedeId}`);
      showSuccess('Sede removida');
      await loadSedes();
      onSedesUpdated();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error removiendo sede');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0B0E14] border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#df2531]" />
            Gestionar Sedes
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Sedes asignadas */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Sedes asignadas al torneo:</h4>
            {sedesAsignadas.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay sedes asignadas</p>
            ) : (
              <div className="space-y-2">
                {sedesAsignadas.map((sede) => (
                  <div key={sede.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                    <div>
                      <p className="text-white font-medium">{sede.nombre}</p>
                      <p className="text-xs text-gray-500">{sede.ciudad}</p>
                    </div>
                    <button
                      onClick={() => removerSede(sede.id)}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sedes disponibles */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Sedes disponibles:</h4>
            <div className="space-y-2">
              {sedesDisponibles
                .filter((s) => !sedesAsignadas.some((sa) => sa.id === s.id))
                .map((sede) => (
                  <div key={sede.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                    <div>
                      <p className="text-white font-medium">{sede.nombre}</p>
                      <p className="text-xs text-gray-500">{sede.ciudad} • {sede.canchas?.length || 0} canchas</p>
                    </div>
                    <button
                      onClick={() => asignarSede(sede.id)}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm bg-[#df2531]/20 text-[#df2531] hover:bg-[#df2531]/30 rounded-lg transition-colors"
                    >
                      Asignar
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// MODAL: CONFIRMACIÓN DE SORTEO
// ============================================
function ModalConfirmacionSorteo({
  isOpen,
  onClose,
  calculo,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  calculo: CalculoSlotsResponse | null;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!isOpen || !calculo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0B0E14] border border-white/10 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-emerald-500/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Todo listo para el sorteo
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/[0.03] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{calculo.totalSlotsNecesarios}</p>
              <p className="text-xs text-gray-500">Slots necesarios</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{calculo.slotsDisponibles}</p>
              <p className="text-xs text-gray-500">Slots disponibles</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-[#df2531]">{calculo.horasNecesarias}h</p>
              <p className="text-xs text-gray-500">Tiempo total</p>
            </div>
          </div>

          {/* Detalle por categoría */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">Detalle por categoría:</h4>
            <div className="space-y-3">
              {calculo.detallePorCategoria.map((cat) => (
                <div key={cat.categoriaId} className="bg-white/[0.03] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{cat.nombre}</p>
                    <p className="text-sm text-gray-400">{cat.parejas} parejas</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{cat.slotsNecesarios} slots totales</span>
                    <span className="text-gray-600">|</span>
                    <span className="text-gray-500">
                      {cat.partidosPorFase.map(f => `${f.fase}: ${f.partidos}`).join(' • ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium">¿Qué sucederá al confirmar?</p>
              <ul className="text-sm text-blue-300/80 mt-1 space-y-1 list-disc list-inside">
                <li>Se cerrarán las inscripciones de las categorías seleccionadas</li>
                <li>Se sortearán las parejas en sus zonas (aleatorio)</li>
                <li>Se reservarán slots para TODAS las fases (Zona → Final)</li>
                <li>Se generará el bracket completo listo para jugar</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-[#df2531] hover:bg-[#df2531]/80 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sorteando...
              </>
            ) : (
              <>
                <Shuffle className="w-5 h-5" />
                Confirmar y Sortear
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// MODAL: ADVERTENCIA - FALTAN CANCHAS
// ============================================
function ModalAdvertenciaCanchas({
  isOpen,
  onClose,
  calculo,
  onAgregarDias,
}: {
  isOpen: boolean;
  onClose: () => void;
  calculo: CalculoSlotsResponse | null;
  onAgregarDias: () => void;
}) {
  if (!isOpen || !calculo) return null;

  const horasFaltantes = Math.ceil((calculo.slotsFaltantes * calculo.duracionPromedioMinutos) / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0B0E14] border border-amber-500/30 rounded-xl w-full max-w-lg"
      >
        <div className="p-4 border-b border-amber-500/30 flex items-center gap-3 bg-amber-500/10">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Faltan canchas disponibles</h3>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-300">
            Para sortear las categorías seleccionadas necesitas más días de juego configurados.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.03] rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-white">{calculo.totalSlotsNecesarios}</p>
              <p className="text-xs text-gray-500">Slots necesarios</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-amber-400">{calculo.slotsFaltantes}</p>
              <p className="text-xs text-gray-500">Slots faltantes</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-300 font-medium text-center">
              Faltan aproximadamente {horasFaltantes} horas de canchas
            </p>
          </div>

          <p className="text-sm text-gray-500">
            Tip: Agrega más días en el Paso 1.b o aumenta el horario de los días existentes.
          </p>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onAgregarDias}
            className="flex-1 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar más días
          </button>
        </div>
      </motion.div>
    </div>
  );
}
