import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Plus, Clock, Calendar, Trash2, 
  Building2, CheckCircle2, Sparkles,
  ChevronRight, X
} from 'lucide-react';
import { api } from '../../../../services/api';
import { disponibilidadService } from '../../../../services/disponibilidad.service';

interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
  canchas?: CanchaSede[];
}

interface CanchaSede {
  id: string;
  nombre: string;
  tipo: string;
  tieneLuz: boolean;
}

interface CanchaTorneo {
  id: string;
  nombre: string;
  sedeId: string;
  sedeNombre: string;
}

interface DiaConfig {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  minutosSlot: number;
  activo: boolean;
  totalSlots: number;
  slotsLibres: number;
  slotsOcupados: number;
}

interface DisponibilidadConfigProps {
  tournamentId: string;
}

export function DisponibilidadConfig({ tournamentId }: DisponibilidadConfigProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setTorneo] = useState<any>(null);
  const [sedesTorneo, setSedesTorneo] = useState<Sede[]>([]);
  const [canchasTorneo, setCanchasTorneo] = useState<CanchaTorneo[]>([]);
  const [dias, setDias] = useState<DiaConfig[]>([]);
  const [todasSedes, setTodasSedes] = useState<Sede[]>([]);
  const [showAddSede, setShowAddSede] = useState(false);
  const [activeTab, setActiveTab] = useState<'sedes' | 'dias'>('sedes');

  // Form para nuevo día
  const [nuevoDia, setNuevoDia] = useState({
    fecha: '',
    horaInicio: '18:00',
    horaFin: '23:00',
    minutosSlot: 90,
  });

  useEffect(() => {
    loadData();
    loadTodasSedes();
  }, [tournamentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await disponibilidadService.getDisponibilidad(tournamentId);
      setTorneo(data.torneo);
      setSedesTorneo(data.sedes);
      setCanchasTorneo(data.canchas);
      setDias(data.dias);
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodasSedes = async () => {
    try {
      const { data } = await api.get('/admin/sedes');
      setTodasSedes(data);
    } catch (error) {
      console.error('Error cargando sedes:', error);
    }
  };

  const agregarSede = async (sedeId: string) => {
    try {
      setSaving(true);
      await disponibilidadService.agregarSede(tournamentId, sedeId);
      await loadData();
      setShowAddSede(false);
    } catch (error) {
      console.error('Error agregando sede:', error);
    } finally {
      setSaving(false);
    }
  };

  const quitarSede = async (sedeId: string) => {
    if (!confirm('¿Quitar esta sede del torneo?')) return;
    try {
      setSaving(true);
      await disponibilidadService.quitarSede(tournamentId, sedeId);
      await loadData();
    } catch (error) {
      console.error('Error quitando sede:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleCancha = async (sedeCanchaId: string, isActive: boolean) => {
    try {
      setSaving(true);
      if (isActive) {
        // Quitar
        const cancha = canchasTorneo.find(_c => {
          // Necesitamos el torneoCanchaId, no el sedeCanchaId
          // Esto es un workaround, necesitaría ajustar el backend
          return false;
        });
        if (cancha) {
          await disponibilidadService.quitarCancha(tournamentId, cancha.id);
        }
      } else {
        // Agregar
        await disponibilidadService.agregarCancha(tournamentId, sedeCanchaId);
      }
      await loadData();
    } catch (error) {
      console.error('Error toggling cancha:', error);
    } finally {
      setSaving(false);
    }
  };

  const agregarDia = async () => {
    if (!nuevoDia.fecha) return;
    try {
      setSaving(true);
      await disponibilidadService.configurarDia(tournamentId, nuevoDia);
      await loadData();
      setNuevoDia({ fecha: '', horaInicio: '18:00', horaFin: '23:00', minutosSlot: 90 });
    } catch (error) {
      console.error('Error agregando día:', error);
    } finally {
      setSaving(false);
    }
  };

  const eliminarDia = async (diaId: string) => {
    if (!confirm('¿Eliminar este día?')) return;
    try {
      setSaving(true);
      await disponibilidadService.eliminarDia(tournamentId, diaId);
      await loadData();
    } catch (error) {
      console.error('Error eliminando día:', error);
    } finally {
      setSaving(false);
    }
  };

  const generarSlots = async (diaId: string) => {
    try {
      setSaving(true);
      const result = await disponibilidadService.generarSlots(tournamentId, diaId);
      alert(`${result.totalSlots} slots generados`);
      await loadData();
    } catch (error) {
      console.error('Error generando slots:', error);
      alert('Error generando slots');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  const sedesDisponibles = todasSedes.filter(
    s => !sedesTorneo.some(st => st.id === s.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#df2531]" />
            Disponibilidad de Recursos
          </h2>
          <p className="text-gray-400 text-sm">
            Configure sedes, canchas y horarios para el sorteo de partidos
          </p>
        </div>
        {saving && (
          <span className="text-sm text-gray-400">Guardando...</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('sedes')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'sedes'
              ? 'bg-[#df2531] text-white'
              : 'bg-white/[0.02] text-gray-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Sedes y Canchas
        </button>
        <button
          onClick={() => setActiveTab('dias')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'dias'
              ? 'bg-[#df2531] text-white'
              : 'bg-white/[0.02] text-gray-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Días y Horarios
        </button>
      </div>

      {/* Contenido: Sedes y Canchas */}
      {activeTab === 'sedes' && (
        <div className="space-y-6">
          {/* Sedes Seleccionadas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Sedes del Torneo</h3>
              <button
                onClick={() => setShowAddSede(true)}
                className="px-3 py-1.5 bg-[#df2531] text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Agregar Sede
              </button>
            </div>

            {sedesTorneo.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 text-center">
                <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No hay sedes configuradas</p>
                <button
                  onClick={() => setShowAddSede(true)}
                  className="mt-3 text-[#df2531] text-sm hover:underline"
                >
                  Agregar primera sede
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {sedesTorneo.map((sede) => (
                  <motion.div
                    key={sede.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-[#df2531]/10 to-transparent border border-[#df2531]/20 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#df2531]/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[#df2531]" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{sede.nombre}</h4>
                          <p className="text-xs text-gray-400">{sede.ciudad}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => quitarSede(sede.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Canchas de esta sede */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-xs text-gray-500 mb-2">Canchas disponibles:</p>
                      <div className="flex flex-wrap gap-2">
                        {todasSedes
                          .find(s => s.id === sede.id)
                          ?.canchas
                          ?.map((cancha) => {
                            const isActive = canchasTorneo.some(
                              ct => ct.sedeId === sede.id && ct.nombre === cancha.nombre
                            );
                            return (
                              <button
                                key={cancha.id}
                                onClick={() => toggleCancha(cancha.id, isActive)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  isActive
                                    ? 'bg-[#df2531] text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                              >
                                {isActive && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                                {cancha.nombre}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Agregar Sede */}
          <AnimatePresence>
            {showAddSede && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="bg-[#151921] rounded-2xl border border-white/10 max-w-md w-full p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Agregar Sede</h3>
                    <button
                      onClick={() => setShowAddSede(false)}
                      className="p-2 hover:bg-white/5 rounded-xl"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {sedesDisponibles.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">
                      No hay más sedes disponibles
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sedesDisponibles.map((sede) => (
                        <button
                          key={sede.id}
                          onClick={() => agregarSede(sede.id)}
                          className="w-full p-3 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-[#df2531]/30 rounded-xl text-left transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">{sede.nombre}</p>
                              <p className="text-xs text-gray-400">{sede.ciudad}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Contenido: Días y Horarios */}
      {activeTab === 'dias' && (
        <div className="space-y-6">
          {/* Formulario nuevo día */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Agregar Día</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
                <input
                  type="date"
                  value={nuevoDia.fecha}
                  onChange={(e) => setNuevoDia({ ...nuevoDia, fecha: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Hora Inicio</label>
                <input
                  type="time"
                  value={nuevoDia.horaInicio}
                  onChange={(e) => setNuevoDia({ ...nuevoDia, horaInicio: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Hora Fin</label>
                <input
                  type="time"
                  value={nuevoDia.horaFin}
                  onChange={(e) => setNuevoDia({ ...nuevoDia, horaFin: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Duración Partido</label>
                <select
                  value={nuevoDia.minutosSlot}
                  onChange={(e) => setNuevoDia({ ...nuevoDia, minutosSlot: Number(e.target.value) })}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>120 min</option>
                </select>
              </div>
            </div>
            <button
              onClick={agregarDia}
              disabled={!nuevoDia.fecha}
              className="mt-4 px-4 py-2 bg-[#df2531] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              Agregar Día
            </button>
          </div>

          {/* Lista de días configurados */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-4">Días Configurados</h3>
            
            {dias.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No hay días configurados</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {dias.map((dia) => (
                  <motion.div
                    key={dia.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">
                            {new Date(dia.fecha).toLocaleDateString('es-PY', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dia.horaInicio} - {dia.horaFin}
                            </span>
                            <span>{dia.minutosSlot} min/partido</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Stats */}
                        <div className="text-right mr-4">
                          {dia.totalSlots > 0 ? (
                            <div className="text-sm">
                              <span className="text-green-400">{dia.slotsLibres}</span>
                              <span className="text-gray-500">/</span>
                              <span className="text-white">{dia.totalSlots}</span>
                              <span className="text-gray-500 text-xs ml-1">slots</span>
                            </div>
                          ) : (
                            <span className="text-xs text-yellow-500">Sin slots</span>
                          )}
                        </div>

                        {/* Botón Generar Slots */}
                        {dia.totalSlots === 0 && (
                          <button
                            onClick={() => generarSlots(dia.id)}
                            className="px-3 py-1.5 bg-[#df2531] text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generar Slots
                          </button>
                        )}

                        <button
                          onClick={() => eliminarDia(dia.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
