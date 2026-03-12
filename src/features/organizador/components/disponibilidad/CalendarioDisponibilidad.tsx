import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, MapPin, Clock,
  Calendar, Grid3X3, List, Building2, CheckCircle2,
  X, Sparkles, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { disponibilidadService } from '../../../../services/disponibilidad.service';
import { sedesService } from '../../../../services/sedesService';

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
}

interface CalendarioDisponibilidadProps {
  tournamentId: string;
  fechaInicio?: string;
  fechaFin?: string;
}

// Colores para cada cancha
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

export function CalendarioDisponibilidad({ tournamentId, fechaInicio, fechaFin }: CalendarioDisponibilidadProps) {
  const [loading, setLoading] = useState(true);
  const [torneo, setTorneo] = useState<{ fechaInicio?: string; fechaFin?: string } | null>(null);
  
  // Inicializar currentWeek con la fecha de inicio del torneo
  const [currentWeek, setCurrentWeek] = useState(() => {
    if (fechaInicio) {
      return new Date(fechaInicio);
    }
    return new Date();
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [todasSedes, setTodasSedes] = useState<Sede[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [dias, setDias] = useState<DiaConfig[]>([]);
  const [canchasFiltradas, setCanchasFiltradas] = useState<Set<string>>(new Set());
  const [vista, setVista] = useState<'semana' | 'lista'>('semana');
  const [slotSeleccionado, setSlotSeleccionado] = useState<Slot | null>(null);
  const [showConfigDia, setShowConfigDia] = useState(false);
  const [showAgregarSede, setShowAgregarSede] = useState(false);

  // Calcular inicio y fin de semana
  const weekStart = useMemo(() => {
    const d = new Date(currentWeek);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
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
      
      setTorneo(data.torneo);
      setSedes(data.sedes);
      setTodasSedes(sedesData || []);
      
      // Asignar colores a canchas
      const canchasConColor = data.canchas.map((c: any, i: number) => ({
        ...c,
        color: CANCHA_COLORS[i % CANCHA_COLORS.length],
      }));
      setCanchas(canchasConColor);
      setCanchasFiltradas(new Set(canchasConColor.map((c: Cancha) => c.id)));
      setDias(data.dias);

      // Cargar slots de la semana
      const fechaInicio = weekStart.toISOString().split('T')[0];
      const fechaFin = weekEnd.toISOString().split('T')[0];
      const slotsData = await disponibilidadService.getSlotsPorSemana(tournamentId, fechaInicio, fechaFin);
      setSlots(slotsData.slots || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Inicializar currentWeek con la fecha de inicio del torneo
  useEffect(() => {
    if (torneo?.fechaInicio) {
      setCurrentWeek(new Date(torneo.fechaInicio));
    }
  }, [torneo?.fechaInicio]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    
    // Limitar navegación a las fechas del torneo
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      // Calcular inicio de semana para comparación
      const day = newDate.getDay();
      const weekStart = new Date(newDate);
      weekStart.setDate(newDate.getDate() - day + (day === 0 ? -6 : 1));
      
      // Calcular fin de semana
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Solo permitir navegar si hay alguna fecha del torneo en esta semana
      if (weekEnd < inicio || weekStart > fin) {
        // Fuera de rango, no navegar
        return;
      }
    }
    
    setCurrentWeek(newDate);
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

  const getSlotsForDayAndHour = (date: Date, hour: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return slots.filter(slot => {
      if (!canchasFiltradas.has(slot.cancha.id)) return false;
      const slotDate = new Date(slot.fecha).toISOString().split('T')[0];
      return slotDate === dateStr && slot.horaInicio.startsWith(hour.split(':')[0]);
    });
  };

  const getSlotStyle = (slot: Slot) => {
    const cancha = canchas.find(c => c.id === slot.cancha.id);
    const baseColor = cancha?.color || CANCHA_COLORS[0];
    
    if (slot.estado === 'OCUPADO') {
      return 'bg-[#df2531]/30 border-[#df2531]/50 text-white';
    }
    return `${baseColor.bg} ${baseColor.border} ${baseColor.text} ${baseColor.hover}`;
  };

  const formatDateHeader = (date: Date) => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return {
      dia: dias[date.getDay()],
      numero: date.getDate(),
      mes: date.toLocaleDateString('es-PY', { month: 'short' }),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] bg-[#0B0E14] rounded-2xl overflow-hidden border border-white/5">
      {/* Sidebar - Sedes y Canchas */}
      <div className="w-64 bg-[#151921] border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#df2531]" />
            Sedes y Canchas
          </h3>
          <p className="text-xs text-gray-500 mt-1">Filtrar por cancha</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {sedes.map((sede) => (
            <div key={sede.id}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-400">{sede.nombre}</span>
              </div>
              <div className="space-y-1 ml-5">
                {canchas
                  .filter(c => c.sedeId === sede.id)
                  .map((cancha) => (
                    <button
                      key={cancha.id}
                      onClick={() => toggleCanchaFilter(cancha.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                        canchasFiltradas.has(cancha.id)
                          ? 'bg-white/10 text-white'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <div 
                        className={`w-3 h-3 rounded-full border ${cancha.color.border} ${canchasFiltradas.has(cancha.id) ? cancha.color.bg.replace('/20', '') : 'bg-transparent'}`}
                      />
                      <span className="flex-1 text-left">{cancha.nombre}</span>
                      {canchasFiltradas.has(cancha.id) && (
                        <CheckCircle2 className="w-3 h-3 text-[#df2531]" />
                      )}
                    </button>
                  ))}
              </div>
            </div>
          ))}
          
          {/* Botón Agregar Sede */}
          <button
            onClick={() => setShowAgregarSede(true)}
            className="w-full mt-4 p-3 border border-dashed border-[#df2531]/40 rounded-xl text-[#df2531] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#df2531]/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Sede
          </button>
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total slots</span>
            <span className="text-white font-medium">{dias.reduce((acc, d) => acc + d.totalSlots, 0)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Libres</span>
            <span className="text-emerald-400 font-medium">{dias.reduce((acc, d) => acc + d.slotsLibres, 0)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Ocupados</span>
            <span className="text-[#df2531] font-medium">{dias.reduce((acc, d) => acc + (d.totalSlots - d.slotsLibres), 0)}</span>
          </div>
        </div>
      </div>

      {/* Main Content - Calendario */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-[#151921] rounded-xl p-1">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
              <span className="px-3 text-sm text-white min-w-[180px] text-center">
                {weekStart.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })} - {weekEnd.toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-[#151921] rounded-lg transition-colors"
            >
              Hoy
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigDia(true)}
              className="px-3 py-2 bg-[#df2531] text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Configurar Día
            </button>
            
            <div className="flex items-center bg-[#151921] rounded-xl p-1">
              <button
                onClick={() => setVista('semana')}
                className={`p-2 rounded-lg transition-colors ${
                  vista === 'semana' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVista('lista')}
                className={`p-2 rounded-lg transition-colors ${
                  vista === 'lista' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendario Grid */}
        {vista === 'semana' ? (
          <div className="flex-1 overflow-auto">
            <div className="min-w-[800px]">
              {/* Header de días */}
              <div className="grid grid-cols-8 border-b border-white/5 sticky top-0 bg-[#0B0E14] z-10">
                <div className="p-3 border-r border-white/5" />
                {weekDays.map((day, i) => {
                  const { dia, numero, mes } = formatDateHeader(day);
                  const isToday = new Date().toDateString() === day.toDateString();
                  return (
                    <div
                      key={i}
                      className={`p-3 text-center border-r border-white/5 ${isToday ? 'bg-[#df2531]/10' : ''}`}
                    >
                      <div className={`text-xs font-medium ${isToday ? 'text-[#df2531]' : 'text-gray-500'}`}>
                        {dia}
                      </div>
                      <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                        {numero}
                      </div>
                      <div className="text-[10px] text-gray-600">{mes}</div>
                    </div>
                  );
                })}
              </div>

              {/* Grid de horas */}
              <div className="relative">
                {HORAS.map((hour) => (
                  <div key={hour} className="grid grid-cols-8 border-b border-white/5 min-h-[80px]">
                    {/* Hora */}
                    <div className="p-2 border-r border-white/5 text-xs text-gray-500 text-right sticky left-0 bg-[#0B0E14]">
                      {hour}
                    </div>
                    
                    {/* Celdas de días */}
                    {weekDays.map((day, dayIndex) => {
                      const daySlots = getSlotsForDayAndHour(day, hour);
                      return (
                        <div
                          key={dayIndex}
                          className="border-r border-white/5 p-1 relative group hover:bg-white/[0.02] transition-colors"
                        >
                          {daySlots.length === 0 ? (
                            <button
                              onClick={() => {
                                // Abrir modal para agregar slot
                              }}
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          ) : (
                            <div className="space-y-1">
                              {daySlots.map((slot) => (
                                <motion.button
                                  key={slot.id}
                                  layoutId={slot.id}
                                  onClick={() => setSlotSeleccionado(slot)}
                                  className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${getSlotStyle(slot)}`}
                                >
                                  <div className="font-medium truncate">
                                    {slot.cancha.nombre}
                                  </div>
                                  <div className="text-[10px] opacity-80">
                                    {slot.horaInicio} - {slot.horaFin}
                                  </div>
                                  {slot.match && (
                                    <div className="mt-1 pt-1 border-t border-white/10 text-[10px] truncate">
                                      {slot.match.pareja1} vs {slot.match.pareja2}
                                    </div>
                                  )}
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Vista Lista */
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
              {slots
                .filter(s => canchasFiltradas.has(s.cancha.id))
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime() || a.horaInicio.localeCompare(b.horaInicio))
                .map((slot) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border flex items-center gap-4 ${getSlotStyle(slot)}`}
                  >
                    <div className="w-16 text-center">
                      <div className="text-sm font-bold">{new Date(slot.fecha).getDate()}</div>
                      <div className="text-xs opacity-70">
                        {new Date(slot.fecha).toLocaleDateString('es-PY', { month: 'short' })}
                      </div>
                    </div>
                    <div className="w-24 text-center">
                      <Clock className="w-4 h-4 mx-auto mb-1 opacity-70" />
                      <div className="text-xs">{slot.horaInicio}</div>
                      <div className="text-xs opacity-70">{slot.horaFin}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{slot.cancha.nombre}</div>
                      <div className="text-xs opacity-70">{slot.cancha.sedeNombre}</div>
                    </div>
                    {slot.match ? (
                      <div className="text-right">
                        <div className="text-xs font-medium">{slot.match.ronda}</div>
                        <div className="text-xs opacity-70">{slot.match.pareja1} vs {slot.match.pareja2}</div>
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-white/10 rounded-full text-xs">Disponible</div>
                    )}
                  </motion.div>
                ))}
              {slots.filter(s => canchasFiltradas.has(s.cancha.id)).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay slots configurados para esta semana</p>
                  <button
                    onClick={() => setShowConfigDia(true)}
                    className="mt-2 text-[#df2531] text-sm hover:underline"
                  >
                    Configurar disponibilidad
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Slot Seleccionado */}
      <AnimatePresence>
        {slotSeleccionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSlotSeleccionado(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#151921] rounded-2xl border border-white/10 w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Detalle del Slot</h3>
                <button
                  onClick={() => setSlotSeleccionado(null)}
                  className="p-2 hover:bg-white/5 rounded-xl"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Fecha</p>
                    <p className="text-white">
                      {new Date(slotSeleccionado.fecha).toLocaleDateString('es-PY', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Horario</p>
                    <p className="text-white">{slotSeleccionado.horaInicio} - {slotSeleccionado.horaFin}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Cancha</p>
                    <p className="text-white">{slotSeleccionado.cancha.nombre}</p>
                    <p className="text-xs text-gray-500">{slotSeleccionado.cancha.sedeNombre}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full ${
                    slotSeleccionado.estado === 'LIBRE' ? 'bg-emerald-500' : 'bg-[#df2531]'
                  }`} />
                  <div>
                    <p className="text-sm text-gray-400">Estado</p>
                    <p className={slotSeleccionado.estado === 'LIBRE' ? 'text-emerald-400' : 'text-[#df2531]'}>
                      {slotSeleccionado.estado === 'LIBRE' ? 'Disponible' : 'Ocupado'}
                    </p>
                  </div>
                </div>

                {slotSeleccionado.match && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-sm text-gray-400 mb-2">Partido asignado</p>
                    <p className="text-sm font-medium text-white">{slotSeleccionado.match.ronda}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {slotSeleccionado.match.pareja1} vs {slotSeleccionado.match.pareja2}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                {slotSeleccionado.estado === 'LIBRE' ? (
                  <button className="flex-1 px-4 py-2 bg-[#df2531] text-white rounded-xl text-sm font-medium">
                    Asignar Partido
                  </button>
                ) : (
                  <button className="flex-1 px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium">
                    Ver Partido
                  </button>
                )}
                <button className="px-4 py-2 border border-white/10 text-gray-400 rounded-xl text-sm hover:text-white">
                  Editar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Configurar Día */}
      <AnimatePresence>
        {showConfigDia && (
          <ConfigurarDiaModal
            tournamentId={tournamentId}
            onClose={() => setShowConfigDia(false)}
            onSave={loadData}
          />
        )}
      </AnimatePresence>

      {/* Modal Agregar Sede */}
      <AnimatePresence>
        {showAgregarSede && (
          <AgregarSedeModal
            tournamentId={tournamentId}
            sedesActuales={sedes}
            todasSedes={todasSedes}
            onClose={() => setShowAgregarSede(false)}
            onSave={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal para agregar sede al torneo
function AgregarSedeModal({
  tournamentId,
  sedesActuales,
  todasSedes,
  onClose,
  onSave,
}: {
  tournamentId: string;
  sedesActuales: Sede[];
  todasSedes: Sede[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const sedesDisponibles = todasSedes.filter(
    (s) => !sedesActuales.some((sa) => sa.id === s.id)
  );

  const handleAgregar = async (sedeId: string) => {
    try {
      setLoading(sedeId);
      await disponibilidadService.agregarSede(tournamentId, sedeId);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error agregando sede:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#151921] rounded-2xl border border-white/10 w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#df2531]" />
            Agregar Sede
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {sedesDisponibles.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay más sedes disponibles</p>
            <p className="text-xs text-gray-600 mt-1">
              Todas las sedes ya están agregadas al torneo
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sedesDisponibles.map((sede) => (
              <button
                key={sede.id}
                onClick={() => handleAgregar(sede.id)}
                disabled={loading === sede.id}
                className="w-full p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-[#df2531]/30 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white group-hover:text-[#df2531] transition-colors">
                      {sede.nombre}
                    </p>
                    <p className="text-xs text-gray-500">{sede.ciudad}</p>
                  </div>
                  {loading === sede.id ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-[#df2531]/30 border-t-[#df2531] rounded-full"
                    />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-[#df2531]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Modal para configurar un nuevo día
function ConfigurarDiaModal({ 
  tournamentId, 
  onClose, 
  onSave 
}: { 
  tournamentId: string; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    fecha: '',
    horaInicio: '18:00',
    horaFin: '23:00',
    minutosSlot: 90,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.fecha) return;
    try {
      setLoading(true);
      // 1. Crear/configurar el día
      const diaResult = await disponibilidadService.configurarDia(tournamentId, form);
      // 2. Generar slots usando el ID del día
      if (diaResult?.dia?.id) {
        await disponibilidadService.generarSlots(tournamentId, diaResult.dia.id);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#151921] rounded-2xl border border-white/10 w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#df2531]" />
            Configurar Día
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Fecha</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Hora Inicio</label>
              <input
                type="time"
                value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Hora Fin</label>
              <input
                type="time"
                value={form.horaFin}
                onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Duración por partido</label>
            <select
              value={form.minutosSlot}
              onChange={(e) => setForm({ ...form, minutosSlot: Number(e.target.value) })}
              className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white"
            >
              <option value={60}>60 minutos</option>
              <option value={90}>90 minutos</option>
              <option value={120}>120 minutos</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!form.fecha || loading}
          className="w-full mt-6 px-4 py-3 bg-[#df2531] disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generar Slots
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}
