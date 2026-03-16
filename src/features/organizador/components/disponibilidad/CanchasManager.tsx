import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, MapPin,
  Calendar, Grid3X3, List, Building2, CheckCircle2,
  X, Copy, BarChart3, Clock
} from 'lucide-react';
import { disponibilidadService } from '../../../../services/disponibilidad.service';
import { sedesService } from '../../../../services/sedesService';
import { api } from '../../../../services/api';
import { getDatesRangePY, formatDatePY } from '../../../../utils/date';
import { useConfirm } from '../../../../hooks/useConfirm';
import { useToast } from '../../../../components/ui/ToastProvider';

interface Slot {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'LIBRE' | 'OCUPADO' | 'BLOQUEADO';
  cancha: {
    id: string;
    nombre: string;
    sedeId: string;
    sedeNombre: string;
  };
  match: {
    id: string;
    ronda: string;
    pareja1: string;
    pareja2: string;
  } | null;
}

interface CanchaColor {
  bg: string;
  border: string;
  text: string;
  hover: string;
}

interface Cancha {
  id: string;
  nombre: string;
  sedeId: string;
  sedeNombre: string;
  color: CanchaColor;
}

interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
}

interface DiaConfig {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  minutosSlot: number;
  totalSlots: number;
  slotsLibres: number;
  activo: boolean;
}

interface CanchasManagerProps {
  tournamentId: string;
  fechaInicio?: string;
  fechaFin?: string;
}

const CANCHA_COLORS = [
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/30' },
  { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', hover: 'hover:bg-blue-500/30' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', hover: 'hover:bg-purple-500/30' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', hover: 'hover:bg-amber-500/30' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/40', text: 'text-pink-400', hover: 'hover:bg-pink-500/30' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400', hover: 'hover:bg-cyan-500/30' },
];



export function CanchasManager({ tournamentId, fechaInicio, fechaFin }: CanchasManagerProps) {
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(() => {
    if (fechaInicio) return new Date(fechaInicio);
    return new Date();
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [, setSedes] = useState<Sede[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [dias, setDias] = useState<DiaConfig[]>([]);
  const [canchasFiltradas, setCanchasFiltradas] = useState<Set<string>>(new Set());
  const [vista, setVista] = useState<'semana' | 'lista'>('semana');
  const [showConfigDia, setShowConfigDia] = useState(false);
  const [showAgregarSede, setShowAgregarSede] = useState(false);
  const [showCopiarDia, setShowCopiarDia] = useState(false);
  
  // Form para nuevo día
  const [nuevoDia, setNuevoDia] = useState({
    fecha: '',
    horaInicio: '18:00',
    horaFin: '23:00',
    minutosSlot: 90,
  });
  const [guardandoDia, setGuardandoDia] = useState(false);
  
  // Datos para gestionar sedes
  const [todasSedes, setTodasSedes] = useState<any[]>([]);
  const [sedesLoading, setSedesLoading] = useState(false);
  const [diaOrigen, setDiaOrigen] = useState('');
  const [diaDestino, setDiaDestino] = useState('');

  // Stats
  const stats = useMemo(() => {
    const totalSlots = slots.length;
    const slotsLibres = slots.filter(s => s.estado === 'LIBRE').length;
    const slotsOcupados = slots.filter(s => s.estado === 'OCUPADO').length;
    const canchasActivas = canchas.length;
    const diasConfigurados = dias.filter(d => d.activo).length;
    
    return {
      totalSlots,
      slotsLibres,
      slotsOcupados,
      porcentajeOcupacion: totalSlots > 0 ? Math.round((slotsOcupados / totalSlots) * 100) : 0,
      canchasActivas,
      diasConfigurados,
    };
  }, [slots, canchas, dias]);

  // Week calculation
  const weekStart = useMemo(() => {
    const d = new Date(currentWeek);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentWeek]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekStart]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  useEffect(() => {
    loadData();
  }, [tournamentId, currentWeek]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, sedesData] = await Promise.all([
        disponibilidadService.getDisponibilidad(tournamentId),
        sedesService.getAll(),
      ]);
      
      setSedes(data.sedes);
      setTodasSedes(sedesData || []);
      
      const canchasConColor = data.canchas.map((c: any, i: number) => ({
        ...c,
        color: CANCHA_COLORS[i % CANCHA_COLORS.length],
      }));
      setCanchas(canchasConColor);
      setDias(data.dias || []);
      
      // Load slots for current week
      const slotsRes = await disponibilidadService.getSlotsPorSemana(
        tournamentId,
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      );
      setSlots(slotsRes.slots || []);
      
      // Init filter with all canchas
      if (canchasConColor.length > 0 && canchasFiltradas.size === 0) {
        setCanchasFiltradas(new Set(canchasConColor.map((c: Cancha) => c.id)));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarDia = async () => {
    if (!diaOrigen || !diaDestino) return;
    
    try {
      console.log('[CanchasManager] Copiando día:', { diaOrigen, diaDestino });
      
      const diaOrigenConfig = dias.find(d => d.fecha === diaOrigen);
      if (!diaOrigenConfig) {
        alert('Día origen no encontrado');
        return;
      }
      
      // 1. Crear nuevo día con misma config
      const result = await disponibilidadService.configurarDia(tournamentId, {
        fecha: diaDestino,
        horaInicio: diaOrigenConfig.horaInicio,
        horaFin: diaOrigenConfig.horaFin,
        minutosSlot: diaOrigenConfig.minutosSlot,
      });
      console.log('[CanchasManager] Día creado:', result);
      
      // 2. Generar slots usando el ID del resultado (no buscar en estado)
      if (result?.dia?.id) {
        console.log('[CanchasManager] Generando slots para:', result.dia.id);
        await disponibilidadService.generarSlots(tournamentId, result.dia.id);
      } else {
        console.error('[CanchasManager] No se recibió ID del día creado');
      }
      
      // 3. Recargar datos
      await loadData();
      setShowCopiarDia(false);
      setDiaOrigen('');
      setDiaDestino('');
    } catch (error: any) {
      console.error('[CanchasManager] Error copiando día:', error);
      alert(error.response?.data?.message || 'Error copiando día');
    }
  };

  // AGREGAR DÍA
  const handleGuardarDia = async () => {
    if (!nuevoDia.fecha) return;
    
    setGuardandoDia(true);
    try {
      console.log('[CanchasManager] Guardando día:', nuevoDia);
      
      // 1. Configurar el día
      const result = await disponibilidadService.configurarDia(tournamentId, nuevoDia);
      console.log('[CanchasManager] Día guardado:', result);
      
      // 2. Generar slots para ese día (usar el ID del resultado)
      if (result?.dia?.id) {
        console.log('[CanchasManager] Generando slots para día:', result.dia.id);
        await disponibilidadService.generarSlots(tournamentId, result.dia.id);
      } else {
        console.error('[CanchasManager] No se recibió ID del día');
      }
      
      // 3. Recargar datos
      await loadData();
      setShowConfigDia(false);
      setNuevoDia({ fecha: '', horaInicio: '18:00', horaFin: '23:00', minutosSlot: 90 });
    } catch (error: any) {
      console.error('[CanchasManager] Error guardando día:', error);
      alert(error.response?.data?.message || 'Error guardando día');
    } finally {
      setGuardandoDia(false);
    }
  };

  // GESTIONAR SEDES
  const loadTodasSedes = async () => {
    setSedesLoading(true);
    try {
      const { data } = await api.get('/admin/sedes');
      setTodasSedes(data);
    } catch (error) {
      console.error('Error cargando sedes:', error);
    } finally {
      setSedesLoading(false);
    }
  };

  const handleAgregarSede = async (sedeId: string) => {
    try {
      await disponibilidadService.agregarSede(tournamentId, sedeId);
      await loadData();
      setShowAgregarSede(false);
    } catch (error: any) {
      console.error('Error agregando sede:', error);
      alert(error.response?.data?.message || 'Error agregando sede');
    }
  };

  const toggleCanchaFilter = (canchaId: string) => {
    const newSet = new Set(canchasFiltradas);
    if (newSet.has(canchaId)) {
      newSet.delete(canchaId);
    } else {
      newSet.add(canchaId);
    }
    setCanchasFiltradas(newSet);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Slots"
          value={stats.totalSlots}
          subtext={`${stats.diasConfigurados} días`}
          color="blue"
          icon={Grid3X3}
        />
        <StatCard
          label="Libres"
          value={stats.slotsLibres}
          subtext="Disponibles"
          color="green"
          icon={CheckCircle2}
        />
        <StatCard
          label="Ocupados"
          value={stats.slotsOcupados}
          subtext={`${stats.porcentajeOcupacion}% uso`}
          color="amber"
          icon={BarChart3}
        />
        <StatCard
          label="Canchas"
          value={stats.canchasActivas}
          subtext="Activas"
          color="purple"
          icon={MapPin}
        />
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowConfigDia(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Agregar Día
        </button>
        
        {dias.length > 0 && (
          <button
            onClick={() => setShowCopiarDia(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#151921] hover:bg-[#232838] border border-[#232838] text-white rounded-xl transition-colors text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            Copiar Configuración
          </button>
        )}
        
        <button
          onClick={() => {
            loadTodasSedes();
            setShowAgregarSede(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#151921] hover:bg-[#232838] border border-[#232838] text-white rounded-xl transition-colors text-sm font-medium"
        >
          <Building2 className="w-4 h-4" />
          Gestionar Sedes
        </button>

        <div className="flex-1" />

        {/* Vista toggle */}
        <div className="flex bg-[#151921] rounded-xl border border-[#232838] overflow-hidden">
          <button
            onClick={() => setVista('semana')}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              vista === 'semana' ? 'bg-[#df2531] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Semana
          </button>
          <button
            onClick={() => setVista('lista')}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              vista === 'lista' ? 'bg-[#df2531] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
        </div>
      </div>

      {/* FILTRO DE CANCHAS */}
      {canchas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-400 py-2">Filtrar canchas:</span>
          {canchas.map((cancha) => (
            <button
              key={cancha.id}
              onClick={() => toggleCanchaFilter(cancha.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                canchasFiltradas.has(cancha.id)
                  ? `${cancha.color.bg} ${cancha.color.text} border ${cancha.color.border}`
                  : 'bg-[#151921] text-gray-500 border border-[#232838]'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${cancha.color.text.replace('text-', 'bg-')}`} />
              {cancha.nombre}
            </button>
          ))}
        </div>
      )}

      {/* CALENDARIO */}
      <div className="bg-[#151921] border border-[#232838] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#232838]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const d = new Date(currentWeek);
                d.setDate(d.getDate() - 7);
                setCurrentWeek(d);
              }}
              className="p-2 hover:bg-[#232838] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <span className="text-white font-medium">
              {weekStart.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })} - {weekEnd.toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={() => {
                const d = new Date(currentWeek);
                d.setDate(d.getDate() + 7);
                setCurrentWeek(d);
              }}
              className="p-2 hover:bg-[#232838] rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px] p-4">
            {/* Vista SEGÚN estado */}
            {vista === 'semana' ? (
              <VistaSemana 
                slots={slots} 
                weekDays={weekDays} 
                canchasFiltradas={canchasFiltradas}
                canchas={canchas}
                dias={dias}
              />
            ) : (
              <VistaLista 
                slots={slots} 
                canchas={canchas}
                dias={dias}
                tournamentId={tournamentId}
                onRefresh={loadData}
              />
            )}
          </div>
        </div>
      </div>

      {/* MODALES */}
      <AnimatePresence>
        {/* MODAL: Agregar Día */}
        {showConfigDia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#151921] rounded-2xl border border-[#232838] max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#df2531]" />
                  Agregar Día de Juego
                </h3>
                <button
                  onClick={() => setShowConfigDia(false)}
                  className="p-2 hover:bg-white/5 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Fecha</label>
                  <input
                    type="date"
                    value={nuevoDia.fecha}
                    onChange={(e) => setNuevoDia({ ...nuevoDia, fecha: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={nuevoDia.horaInicio}
                      onChange={(e) => setNuevoDia({ ...nuevoDia, horaInicio: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      value={nuevoDia.horaFin}
                      onChange={(e) => setNuevoDia({ ...nuevoDia, horaFin: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Duración Partido</label>
                  <select
                    value={nuevoDia.minutosSlot}
                    onChange={(e) => setNuevoDia({ ...nuevoDia, minutosSlot: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white"
                  >
                    <option value={60}>60 minutos</option>
                    <option value={90}>90 minutos</option>
                    <option value={120}>120 minutos</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowConfigDia(false)}
                    className="flex-1 py-3 bg-[#232838] hover:bg-[#2a3042] text-white rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardarDia}
                    disabled={!nuevoDia.fecha || guardandoDia}
                    className="flex-1 py-3 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 text-white rounded-xl"
                  >
                    {guardandoDia ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: Gestionar Sedes */}
        {showAgregarSede && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAgregarSede(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#151921] rounded-2xl border border-[#232838] max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#df2531]" />
                  Gestionar Sedes
                </h3>
                <button
                  onClick={() => setShowAgregarSede(false)}
                  className="p-2 hover:bg-white/5 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sedesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
                    />
                  </div>
                ) : todasSedes.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No hay sedes disponibles</p>
                ) : (
                  todasSedes.map((sede: any) => (
                      <button
                        key={sede.id}
                        onClick={() => handleAgregarSede(sede.id)}
                        className="w-full p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-[#df2531]/30 rounded-xl text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#df2531]/20 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-[#df2531]" />
                            </div>
                            <div>
                              <p className="font-medium text-white group-hover:text-[#df2531] transition-colors">
                                {sede.nombre}
                              </p>
                              <p className="text-xs text-gray-500">{sede.ciudad}</p>
                              <p className="text-xs text-gray-600">{sede.canchas?.length || 0} canchas</p>
                            </div>
                          </div>
                          <Plus className="w-5 h-5 text-gray-600 group-hover:text-[#df2531]" />
                        </div>
                      </button>
                    ))
                )}
              </div>

              <button
                onClick={() => setShowAgregarSede(false)}
                className="w-full mt-4 py-3 bg-[#232838] hover:bg-[#2a3042] text-white rounded-xl"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: Copiar Día */}
        {showCopiarDia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Copy className="w-5 h-5 text-[#df2531]" />
                  Copiar Configuración
                </h3>
                <button onClick={() => setShowCopiarDia(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Día origen (configurado)</label>
                  <select
                    value={diaOrigen}
                    onChange={(e) => setDiaOrigen(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white"
                  >
                    <option value="">Seleccionar...</option>
                    {dias.filter(d => d.activo).map((dia) => (
                      <option key={dia.id} value={dia.fecha}>
                        {formatDatePY(dia.fecha)} ({dia.horaInicio} - {dia.horaFin})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Día destino</label>
                  <select
                    value={diaDestino}
                    onChange={(e) => setDiaDestino(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white"
                  >
                    <option value="">Seleccionar...</option>
                    {fechaInicio && fechaFin && getDatesRangePY(fechaInicio, fechaFin)
                      .filter(f => !dias.find(d => d.fecha === f.fecha))
                      .map((f) => (
                        <option key={f.fecha} value={f.fecha}>
                          {formatDatePY(f.fecha)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCopiarDia(false)}
                    className="flex-1 py-3 bg-[#232838] hover:bg-[#2a3042] text-white rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCopiarDia}
                    disabled={!diaOrigen || !diaDestino}
                    className="flex-1 py-3 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 text-white rounded-xl"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// StatCard component
function StatCard({ label, value, subtext, color, icon: Icon }: {
  label: string;
  value: number;
  subtext: string;
  color: 'blue' | 'green' | 'amber' | 'purple';
  icon: React.ElementType;
}) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`glass rounded-2xl p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-xs">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs opacity-70">{subtext}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VISTA SEMANA - Grid tipo Google Calendar (horas x días)
// ═══════════════════════════════════════════════════════════
interface VistaSemanaProps {
  slots: Slot[];
  weekDays: Date[];
  canchasFiltradas: Set<string>;
  canchas: Cancha[];
  dias: DiaConfig[];
}

// Horas a mostrar en el calendario (06:00 a 23:00)
const HORAS_CALENDARIO = Array.from({ length: 18 }, (_, i) => {
  const h = (i + 6).toString().padStart(2, '0');
  return `${h}:00`;
});

function VistaSemana({ slots, weekDays, canchasFiltradas, canchas, dias }: VistaSemanaProps) {
  // Si no hay canchas filtradas, mostrar todas
  const canchasToShow = canchasFiltradas.size > 0 
    ? canchasFiltradas 
    : new Set(canchas.map(c => c.id));

  // Normalizar fechas de slots a formato YYYY-MM-DD
  const normalizedSlots = slots.map(s => ({
    ...s,
    fecha: s.fecha.split('T')[0] // Extraer solo YYYY-MM-DD
  }));
  
  const filteredSlots = normalizedSlots.filter(s => canchasToShow.has(s.cancha.id));

  // Función para obtener slots de un día y hora específicos
  // Usar UTC consistente para evitar desfases de timezone
  const getSlotsForDayAndHour = (day: Date, hour: string) => {
    const fechaStr = day.toISOString().split('T')[0]; // UTC
    return filteredSlots.filter(s => {
      if (s.fecha !== fechaStr) return false;
      // El slot está en esta hora si su horaInicio empieza con esta hora
      return s.horaInicio.startsWith(hour.split(':')[0]);
    });
  };
  
  // Debug: mostrar qué fechas tenemos
  console.log('[VistaSemana] weekDays:', weekDays.map(d => d.toISOString().split('T')[0]));
  console.log('[VistaSemana] slots disponibles:', filteredSlots.map(s => s.fecha));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header de días */}
        <div className="grid grid-cols-8 border-b border-white/10 sticky top-0 bg-[#0B0E14] z-10">
          <div className="p-3 border-r border-white/10" /> {/* Celda vacía para esquina */}
          {weekDays.map((day, i) => {
            const fechaStr = day.toISOString().split('T')[0];
            const diaConfig = dias.find(d => d.fecha === fechaStr);
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <div key={i} className={`p-3 text-center border-r border-white/10 ${isToday ? 'bg-[#df2531]/10' : ''}`}>
                <div className={`text-xs font-medium ${isToday ? 'text-[#df2531]' : 'text-gray-500'}`}>
                  {day.toLocaleDateString('es-PY', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                  {day.getDate()}
                </div>
                {diaConfig && (
                  <div className="text-[10px] text-gray-500 mt-1">
                    {diaConfig.horaInicio}-{diaConfig.horaFin}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid de horas */}
        <div className="relative">
          {HORAS_CALENDARIO.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-white/5 min-h-[60px]">
              {/* Columna de hora */}
              <div className="p-2 border-r border-white/10 text-xs text-gray-500 text-right sticky left-0 bg-[#0B0E14]">
                {hour}
              </div>
              
              {/* Celdas de días */}
              {weekDays.map((day, dayIndex) => {
                const hourSlots = getSlotsForDayAndHour(day, hour);
                return (
                  <div
                    key={dayIndex}
                    className="border-r border-white/5 p-1 relative group hover:bg-white/[0.02] transition-colors"
                  >
                    {hourSlots.length > 0 && (
                      <div className="space-y-1">
                        {hourSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`text-[10px] px-2 py-1 rounded border truncate ${
                              slot.estado === 'OCUPADO' 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                : slot.estado === 'BLOQUEADO'
                                ? 'bg-gray-700 text-gray-500 border-gray-600'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={`${slot.cancha.nombre}: ${slot.horaInicio}-${slot.horaFin}`}
                          >
                            <div className="font-medium truncate">{slot.cancha.nombre}</div>
                            <div className="opacity-70">{slot.horaInicio}-{slot.horaFin}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {filteredSlots.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No hay slots en esta semana</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VISTA LISTA - Lista de slots agrupados por día
// ═══════════════════════════════════════════════════════════
interface VistaListaProps {
  slots: Slot[];
  canchas: Cancha[];
  dias: DiaConfig[];
  tournamentId: string;
  onRefresh: () => void;
}

function VistaLista({ slots, canchas, dias, tournamentId, onRefresh }: VistaListaProps) {
  const { confirm } = useConfirm();
  const { showSuccess, showError } = useToast();

  // Agrupar slots por fecha
  const slotsByDate = useMemo(() => {
    const grouped = new Map<string, Slot[]>();
    slots.forEach(slot => {
      const fecha = slot.fecha.split('T')[0];
      if (!grouped.has(fecha)) {
        grouped.set(fecha, []);
      }
      grouped.get(fecha)!.push(slot);
    });
    return grouped;
  }, [slots]);

  // Ordenar fechas
  const sortedDates = useMemo(() => {
    return Array.from(slotsByDate.keys()).sort();
  }, [slotsByDate]);

  const handleEliminarDia = async (fecha: string) => {
    // Normalizar fecha para comparación (fecha viene como YYYY-MM-DD)
    const fechaNormalizada = fecha.split('T')[0];
    console.log('[EliminarDia] Buscando día para fecha:', fechaNormalizada);
    console.log('[EliminarDia] Días disponibles:', dias);
    
    const diaConfig = dias.find(d => {
      const diaFecha = d.fecha.split('T')[0];
      return diaFecha === fechaNormalizada;
    });
    
    if (!diaConfig) {
      showError('Error', 'No se encontró la configuración del día');
      console.error('[EliminarDia] No encontrado. Fecha:', fechaNormalizada);
      return;
    }
    
    console.log('[EliminarDia] Día encontrado:', diaConfig);

    const confirmed = await confirm({
      title: '¿Eliminar día?',
      message: `Se eliminarán todos los slots del ${formatDatePY(fecha)}. Esta acción no se puede deshacer.`,
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await disponibilidadService.eliminarDia(tournamentId, diaConfig.id);
      showSuccess('Día eliminado', `Los slots del ${formatDatePY(fecha)} han sido eliminados`);
      onRefresh();
    } catch (error) {
      console.error('Error eliminando día:', error);
      showError('Error', 'No se pudo eliminar el día');
    }
  };

  if (slots.length === 0) {
    return (
      <div className="p-4 text-center py-12 text-gray-500">
        <p>No hay slots configurados</p>
        <p className="text-sm mt-2">Agrega días y genera slots para verlos aquí</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
      {sortedDates.map((fecha) => {
        const daySlots = slotsByDate.get(fecha) || [];
        const slotsLibres = daySlots.filter(s => s.estado === 'LIBRE').length;
        const slotsOcupados = daySlots.filter(s => s.estado === 'OCUPADO').length;
        
        // Obtener canchas únicas para este día (ordenadas)
        const canchasDelDia = [...new Set(daySlots.map(s => s.cancha.id))]
          .map(id => canchas.find(c => c.id === id))
          .filter(Boolean) as Cancha[];
        
        // Obtener horarios únicos ordenados
        const horarios = [...new Set(daySlots.map(s => s.horaInicio))].sort();
        
        // Crear mapa de slots por hora y cancha
        const slotMap = new Map<string, Map<string, Slot>>();
        daySlots.forEach(slot => {
          if (!slotMap.has(slot.horaInicio)) {
            slotMap.set(slot.horaInicio, new Map());
          }
          slotMap.get(slot.horaInicio)!.set(slot.cancha.id, slot);
        });
        
        return (
          <div key={fecha} className="bg-[#0B0E14] rounded-xl overflow-hidden">
            {/* Header del día */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#151921] border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="text-white font-medium">
                  {formatDatePY(fecha)}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-400">{slotsLibres} libres</span>
                  {slotsOcupados > 0 && (
                    <span className="text-red-400">{slotsOcupados} ocupados</span>
                  )}
                  <span className="text-gray-500">{daySlots.length} total</span>
                </div>
              </div>
              <button
                onClick={() => handleEliminarDia(fecha)}
                className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Eliminar día
              </button>
            </div>
            
            {/* Tabla de canchas x horarios */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium w-16">Hora</th>
                    {canchasDelDia.map(cancha => (
                      <th key={cancha.id} className="px-3 py-2 text-center text-xs text-gray-400 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${cancha.color.text.replace('text-', 'bg-')}`} />
                          {cancha.nombre}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {horarios.map(hora => (
                    <tr key={hora} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2 text-xs text-gray-500">{hora}</td>
                      {canchasDelDia.map(cancha => {
                        const slot = slotMap.get(hora)?.get(cancha.id);
                        return (
                          <td key={cancha.id} className="px-3 py-2 text-center">
                            {slot ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium ${
                                slot.estado === 'OCUPADO' 
                                  ? 'bg-red-500/20 text-red-400' 
                                  : slot.estado === 'BLOQUEADO'
                                  ? 'bg-gray-700 text-gray-500'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {slot.estado === 'LIBRE' ? 'Libre' : slot.estado === 'OCUPADO' ? 'Ocupado' : 'Bloqueado'}
                              </span>
                            ) : (
                              <span className="text-gray-700">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
