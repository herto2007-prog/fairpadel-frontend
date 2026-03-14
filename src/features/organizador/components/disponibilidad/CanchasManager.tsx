import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, MapPin,
  Calendar, Grid3X3, List, Building2, CheckCircle2,
  X, Copy, BarChart3
} from 'lucide-react';
import { disponibilidadService } from '../../../../services/disponibilidad.service';
import { sedesService } from '../../../../services/sedesService';

import { getDatesRangePY, formatDatePY } from '../../../../utils/date';

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

const HORAS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0');
  return `${h}:00`;
});

export function CanchasManager({ tournamentId, fechaInicio, fechaFin }: CanchasManagerProps) {
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(() => {
    if (fechaInicio) return new Date(fechaInicio);
    return new Date();
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [, setSedes] = useState<Sede[]>([]);
  const [, setTodasSedes] = useState<Sede[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [dias, setDias] = useState<DiaConfig[]>([]);
  const [canchasFiltradas, setCanchasFiltradas] = useState<Set<string>>(new Set());
  const [vista, setVista] = useState<'semana' | 'lista'>('semana');
  const [, setShowConfigDia] = useState(false);
  const [, setShowAgregarSede] = useState(false);
  const [showCopiarDia, setShowCopiarDia] = useState(false);
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
      const diaOrigenConfig = dias.find(d => d.fecha === diaOrigen);
      if (!diaOrigenConfig) {
        alert('Día origen no encontrado');
        return;
      }
      
      // Crear nuevo día con misma config
      await disponibilidadService.configurarDia(tournamentId, {
        fecha: diaDestino,
        horaInicio: diaOrigenConfig.horaInicio,
        horaFin: diaOrigenConfig.horaFin,
        minutosSlot: diaOrigenConfig.minutosSlot,
      });
      
      // Generar slots
      const nuevoDia = dias.find(d => d.fecha === diaDestino);
      if (nuevoDia) {
        await disponibilidadService.generarSlots(tournamentId, nuevoDia.id);
      }
      
      await loadData();
      setShowCopiarDia(false);
      setDiaOrigen('');
      setDiaDestino('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error copiando día');
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
          onClick={() => setShowAgregarSede(true)}
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
            {/* Días header */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-sm text-gray-500 py-2">Hora</div>
              {weekDays.map((day, i) => {
                const diaConfig = dias.find(d => d.fecha === day.toISOString().split('T')[0]);
                return (
                  <div key={i} className={`text-center py-2 rounded-lg ${
                    diaConfig?.activo ? 'bg-[#df2531]/10 border border-[#df2531]/30' : 'bg-[#0B0E14]'
                  }`}>
                    <p className="text-sm font-medium text-white">
                      {day.toLocaleDateString('es-PY', { weekday: 'short' })}
                    </p>
                    <p className={`text-xs ${diaConfig?.activo ? 'text-[#df2531]' : 'text-gray-500'}`}>
                      {day.getDate()}
                    </p>
                    {diaConfig && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        {diaConfig.horaInicio}-{diaConfig.horaFin}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Slots grid */}
            <div className="space-y-1">
              {HORAS.slice(8, 24).map((hora) => (
                <div key={hora} className="grid grid-cols-8 gap-2">
                  <div className="text-xs text-gray-500 py-2">{hora}</div>
                  {weekDays.map((day, dayIndex) => {
                    const daySlots = slots.filter(
                      s => s.fecha === day.toISOString().split('T')[0] && 
                           s.horaInicio.startsWith(hora) &&
                           canchasFiltradas.has(s.cancha.id)
                    );
                    
                    return (
                      <div key={dayIndex} className="min-h-[40px] bg-[#0B0E14] rounded-lg p-1 space-y-1">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`text-[10px] px-2 py-1 rounded ${
                              slot.estado === 'OCUPADO' 
                                ? 'bg-red-500/20 text-red-400' 
                                : slot.estado === 'BLOQUEADO'
                                ? 'bg-gray-700 text-gray-500'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                            title={`${slot.cancha.nombre} - ${slot.estado}`}
                          >
                            {slot.cancha.nombre.substring(0, 8)}...
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Copiar Día */}
      <AnimatePresence>
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
