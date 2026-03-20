import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Trophy, Calendar, 
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { canchasSorteoService, CalculoSlotsResponse } from '../../services/canchasSorteoService';
import { api } from '../../../../services/api';

interface Props {
  tournamentId: string;
}

interface Categoria {
  id: string;
  nombre: string;
  parejas: number;
  minimoParejas: number;
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

export function CanchasSorteoManager({ tournamentId }: Props) {
  // Estados de pasos (colapsables)
  const [paso1aAbierto, setPaso1aAbierto] = useState(true);
  const [paso1bAbierto, setPaso1bAbierto] = useState(false);
  const [paso2Abierto, setPaso2Abierto] = useState(false);

  // Estado Paso 1.a: Finales
  const [finales, setFinales] = useState({
    horaInicio: '18:00',
    horaFin: '23:00',
    canchasFinalesIds: [] as string[],
  });

  // Estado Paso 1.b: Días
  const [dias, setDias] = useState<DiaConfigurado[]>([]);
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
  const [mostrarCalculo, setMostrarCalculo] = useState(false);

  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadCategorias();
    loadDiasConfigurados();
  }, [tournamentId]);

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
      const { data } = await api.get(`/admin/torneos/${tournamentId}/disponibilidad`);
      if (data.success && data.dias) {
        setDias(data.dias.map((d: any) => ({
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

  // PASO 1.a: Guardar configuración de finales
  const guardarFinales = async () => {
    setLoading(true);
    setError(null);
    try {
      await canchasSorteoService.configurarFinales({
        tournamentId,
        ...finales,
      });
      setSuccess('Configuración de finales guardada');
      setPaso1aAbierto(false);
      setPaso1bAbierto(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error guardando finales');
    } finally {
      setLoading(false);
    }
  };

  // PASO 1.b: Agregar día
  const agregarDia = async () => {
    if (!nuevoDia.fecha || nuevoDia.canchasIds.length === 0) {
      setError('Selecciona fecha y al menos una cancha');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await canchasSorteoService.configurarDiaJuego({
        tournamentId,
        ...nuevoDia,
      });
      
      if (response.success) {
        setSuccess(`Día agregado con ${response.data.slotsGenerados} slots`);
        await loadDiasConfigurados();
        setNuevoDia({
          fecha: '',
          horaInicio: '18:00',
          horaFin: '23:00',
          minutosSlot: 90,
          canchasIds: [],
        });
        if (dias.length >= 2) {
          setPaso1bAbierto(false);
          setPaso2Abierto(true);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error agregando día');
    } finally {
      setLoading(false);
    }
  };

  // PASO 2: Calcular slots necesarios
  const calcularSlots = async () => {
    if (categoriasSeleccionadas.length === 0) {
      setError('Selecciona al menos una categoría');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resultado = await canchasSorteoService.calcularSlotsNecesarios(
        tournamentId,
        categoriasSeleccionadas
      );
      setCalculoSlots(resultado);
      setMostrarCalculo(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error calculando slots');
    } finally {
      setLoading(false);
    }
  };

  // PASO 2: Cerrar y sortear
  const cerrarYSortear = async () => {
    if (!calculoSlots?.valido) {
      setError('No hay suficientes slots disponibles');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resultado = await canchasSorteoService.cerrarInscripcionesYsortear({
        tournamentId,
        categoriasIds: categoriasSeleccionadas,
      });
      
      if (resultado.success) {
        setSuccess(`¡Sorteo completado! ${resultado.categoriasSorteadas.length} categorías sorteadas`);
        await loadCategorias();
        setCategoriasSeleccionadas([]);
        setCalculoSlots(null);
        setMostrarCalculo(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en el sorteo');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoria = (categoriaId: string) => {
    setCategoriasSeleccionadas(prev =>
      prev.includes(categoriaId)
        ? prev.filter(id => id !== categoriaId)
        : [...prev, categoriaId]
    );
    setMostrarCalculo(false);
    setCalculoSlots(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#df2531]" />
            Canchas y Sorteo
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Configura canchas, cierra inscripciones y sortea en un solo lugar
          </p>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {/* PASO 1.a: Finales */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setPaso1aAbierto(!paso1aAbierto)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#df2531]/20 flex items-center justify-center">
              <span className="text-[#df2531] font-bold text-sm">1.a</span>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Configurar Finales</h3>
              <p className="text-sm text-gray-500">Horario y canchas para la final</p>
            </div>
          </div>
          {paso1aAbierto ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        <AnimatePresence>
          {paso1aAbierto && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="border-t border-white/10"
            >
              <div className="p-6 space-y-4">
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
                <button
                  onClick={guardarFinales}
                  disabled={loading}
                  className="w-full py-3 bg-[#df2531] hover:bg-[#df2531]/80 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PASO 1.b: Días */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setPaso1bAbierto(!paso1bAbierto)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#df2531]/20 flex items-center justify-center">
              <span className="text-[#df2531] font-bold text-sm">1.b</span>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Configurar Días</h3>
              <p className="text-sm text-gray-500">{dias.length} días configurados</p>
            </div>
          </div>
          {paso1bAbierto ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        <AnimatePresence>
          {paso1bAbierto && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="border-t border-white/10"
            >
              <div className="p-6 space-y-4">
                {dias.length > 0 && (
                  <div className="space-y-2">
                    {dias.map((dia) => (
                      <div key={dia.id} className="bg-white/[0.03] rounded-lg p-3 flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-[#df2531]" />
                        <span className="text-white">{dia.fecha}</span>
                        <span className="text-gray-500 text-sm">
                          {dia.horaInicio} - {dia.horaFin} • {dia.slotsLibres} slots
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-white/10 pt-4 space-y-4">
                  <h4 className="text-sm font-medium text-gray-400">Agregar día:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={nuevoDia.fecha}
                      onChange={(e) => setNuevoDia({ ...nuevoDia, fecha: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                    />
                    <select
                      value={nuevoDia.minutosSlot}
                      onChange={(e) => setNuevoDia({ ...nuevoDia, minutosSlot: Number(e.target.value) })}
                      className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                    >
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>120 min</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="time"
                      value={nuevoDia.horaInicio}
                      onChange={(e) => setNuevoDia({ ...nuevoDia, horaInicio: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                    />
                    <input
                      type="time"
                      value={nuevoDia.horaFin}
                      onChange={(e) => setNuevoDia({ ...nuevoDia, horaFin: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                    />
                  </div>
                  <button
                    onClick={agregarDia}
                    disabled={loading}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Agregando...' : 'Agregar Día'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PASO 2: Sorteo */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setPaso2Abierto(!paso2Abierto)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#df2531]/20 flex items-center justify-center">
              <span className="text-[#df2531] font-bold text-sm">2</span>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Cerrar y Sortear</h3>
              <p className="text-sm text-gray-500">
                {categoriasSeleccionadas.length} categorías seleccionadas
              </p>
            </div>
          </div>
          {paso2Abierto ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        <AnimatePresence>
          {paso2Abierto && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="border-t border-white/10"
            >
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  {categorias.map((cat) => {
                    const puedeSortear = cat.parejas >= cat.minimoParejas;
                    const seleccionada = categoriasSeleccionadas.includes(cat.id);
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => puedeSortear && toggleCategoria(cat.id)}
                        disabled={!puedeSortear}
                        className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                          seleccionada
                            ? 'bg-[#df2531]/10 border-[#df2531]/30'
                            : puedeSortear
                            ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                            seleccionada ? 'bg-[#df2531] border-[#df2531]' : 'border-white/30'
                          }`}>
                            {seleccionada && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className="text-left">
                            <span className="text-white font-medium">{cat.nombre}</span>
                            <span className="text-gray-500 text-sm ml-2">({cat.parejas} parejas)</span>
                          </div>
                        </div>
                        {!puedeSortear && (
                          <span className="text-xs text-red-400">Mínimo {cat.minimoParejas}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {categoriasSeleccionadas.length > 0 && (
                  <button
                    onClick={calcularSlots}
                    disabled={loading}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Calculando...' : 'Calcular slots necesarios'}
                  </button>
                )}

                {mostrarCalculo && calculoSlots && (
                  <div className={`rounded-lg p-4 ${calculoSlots.valido ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <div className="flex items-start gap-3">
                      {calculoSlots.valido ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                      <div>
                        <h5 className={calculoSlots.valido ? 'text-green-400' : 'text-red-400'}>
                          {calculoSlots.valido ? '¡Listo para sortear!' : 'Faltan canchas'}
                        </h5>
                        <p className="text-sm text-gray-400 mt-1">
                          Necesitas {calculoSlots.totalSlotsNecesarios} slots ({calculoSlots.horasNecesarias}h) 
                          • Tienes {calculoSlots.slotsDisponibles} ({calculoSlots.horasDisponibles}h)
                        </p>
                        
                        {calculoSlots.valido ? (
                          <button
                            onClick={cerrarYSortear}
                            disabled={loading}
                            className="mt-4 w-full py-3 bg-[#df2531] hover:bg-[#df2531]/80 text-white rounded-lg font-medium disabled:opacity-50"
                          >
                            {loading ? 'Sorteando...' : 'Cerrar y Sortear'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setPaso2Abierto(false);
                              setPaso1bAbierto(true);
                            }}
                            className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium"
                          >
                            Agregar más días
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
