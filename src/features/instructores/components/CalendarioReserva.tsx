import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instructoresService } from '@/services/instructoresService';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
} from 'lucide-react';
import type { Instructor, HorarioSlot } from '@/types';
import ConfirmarReservaModal from './ConfirmarReservaModal';

const DIAS_NOMBRES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const HORAS: string[] = [];
for (let h = 7; h <= 21; h++) {
  HORAS.push(`${String(h).padStart(2, '0')}:00`);
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function formatDateISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

interface Props {
  instructor: Instructor;
}

const CalendarioReserva = ({ instructor }: Props) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Start on current week's Monday, but at least tomorrow
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    return getMonday(today);
  });

  const [semana, setSemana] = useState<Array<{ fecha: string; slots: HorarioSlot[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{ fecha: string; horaInicio: string; horaFin: string } | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadSemana();
  }, [weekStart, instructor.id]);

  const loadSemana = async () => {
    setLoading(true);
    try {
      const data = await instructoresService.getHorariosSemana(instructor.id, formatDateISO(weekStart));
      setSemana(Array.isArray(data?.semana) ? data.semana : []);
    } catch (err) {
      console.error('Error loading horarios semana:', err);
      setSemana([]);
    } finally {
      setLoading(false);
    }
  };

  const prevWeek = () => setWeekStart((prev) => addDays(prev, -7));
  const nextWeek = () => setWeekStart((prev) => addDays(prev, 7));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = formatDateISO(new Date());
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // Build a lookup: fecha -> Map<horaInicio, slot>
  const slotMap = new Map<string, Map<string, HorarioSlot>>();
  for (const dia of semana) {
    const hMap = new Map<string, HorarioSlot>();
    for (const slot of dia.slots) {
      hMap.set(slot.horaInicio, slot);
    }
    slotMap.set(dia.fecha, hMap);
  }

  const handleSlotClick = (fecha: string, slot: HorarioSlot) => {
    // Don't allow selecting past dates
    const slotDate = new Date(fecha + 'T00:00:00');
    if (slotDate < todayDate) return;
    // Don't allow selecting today (must be at least tomorrow)
    if (fecha === today) return;
    if (!slot.disponible) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSelectedSlot({ fecha, horaInicio: slot.horaInicio, horaFin: slot.horaFin });
    setShowModal(true);
  };

  const handleReservaCreada = () => {
    setShowModal(false);
    setSelectedSlot(null);
    loadSemana(); // Refresh
  };

  // Check if we can go to previous week (don't go before current week)
  const currentMonday = getMonday(new Date());
  const canGoPrev = weekStart > currentMonday;

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-light-text flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary-400" />
            Reservar Clase
          </h3>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevWeek}
              disabled={!canGoPrev}
              className="p-1.5 rounded-lg hover:bg-dark-hover text-light-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-light-text font-medium">
              {weekDays[0].toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })} — {weekDays[6].toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={nextWeek}
              className="p-1.5 rounded-lg hover:bg-dark-hover text-light-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Day Headers */}
                <div className="grid grid-cols-8 gap-px mb-px">
                  <div className="p-1.5 text-center">
                    <Clock className="h-3.5 w-3.5 text-light-muted mx-auto" />
                  </div>
                  {weekDays.map((d, i) => {
                    const dateStr = formatDateISO(d);
                    const isToday = dateStr === today;
                    const isPast = d < todayDate || dateStr === today;
                    return (
                      <div
                        key={i}
                        className={`p-1.5 text-center ${isToday ? 'bg-primary-500/10 rounded-t-lg' : ''}`}
                      >
                        <p className={`text-[10px] font-semibold ${
                          isToday ? 'text-primary-400' : isPast ? 'text-light-muted/50' : 'text-light-text'
                        }`}>
                          {DIAS_NOMBRES[d.getDay()]}
                        </p>
                        <p className={`text-[10px] ${
                          isToday ? 'text-primary-400' : isPast ? 'text-light-muted/50' : 'text-light-muted'
                        }`}>
                          {d.getDate()}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Time Rows */}
                {HORAS.map((hora) => (
                  <div key={hora} className="grid grid-cols-8 gap-px mb-px">
                    <div className="p-1 text-[10px] text-light-muted text-center flex items-center justify-center">
                      {hora}
                    </div>
                    {weekDays.map((d, i) => {
                      const dateStr = formatDateISO(d);
                      const isPast = d < todayDate || dateStr === today;
                      const daySlots = slotMap.get(dateStr);
                      const slot = daySlots?.get(hora);

                      let cellClass = 'h-8 rounded-sm text-[9px] flex items-center justify-center border transition-all ';

                      if (!slot) {
                        // No slot = not available at this hour
                        cellClass += 'bg-dark-surface border-dark-border cursor-default';
                      } else if (isPast) {
                        // Past date - show but greyed out
                        cellClass += 'bg-dark-surface border-dark-border cursor-default opacity-40';
                      } else if (slot.disponible) {
                        // Available - clickable
                        cellClass += 'bg-green-500/10 border-green-500/20 cursor-pointer hover:bg-green-500/20 hover:border-green-500/40';
                      } else {
                        // Occupied
                        cellClass += 'bg-blue-500/10 border-blue-500/20 cursor-default';
                      }

                      // Highlight selected slot
                      const isSelected = selectedSlot?.fecha === dateStr && selectedSlot?.horaInicio === hora;
                      if (isSelected) {
                        cellClass = 'h-8 rounded-sm text-[9px] flex items-center justify-center border-2 border-primary-500 bg-primary-500/20 text-primary-400 cursor-pointer transition-all';
                      }

                      return (
                        <div
                          key={i}
                          className={cellClass}
                          onClick={() => {
                            if (slot && slot.disponible && !isPast) {
                              handleSlotClick(dateStr, slot);
                            }
                          }}
                          title={
                            !slot ? '' :
                            isPast ? 'Fecha pasada' :
                            slot.disponible ? `Disponible ${hora} - ${slot.horaFin}` :
                            'Ocupado'
                          }
                        >
                          {slot && !isPast && slot.disponible && !isSelected && (
                            <span className="text-green-400/60">●</span>
                          )}
                          {slot && !slot.disponible && !isPast && (
                            <span className="text-blue-400/60">—</span>
                          )}
                          {isSelected && <span>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-light-muted">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-green-500/10 border border-green-500/20 inline-block" />
                    Disponible
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-blue-500/10 border border-blue-500/20 inline-block" />
                    Ocupado
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-dark-surface border border-dark-border inline-block" />
                    Sin horario
                  </span>
                </div>

                {/* Hint */}
                <p className="text-[11px] text-light-muted mt-2">
                  Hacé click en un horario verde para reservar
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmar Reserva Modal */}
      {showModal && selectedSlot && (
        <ConfirmarReservaModal
          instructor={instructor}
          fecha={selectedSlot.fecha}
          horaInicio={selectedSlot.horaInicio}
          horaFin={selectedSlot.horaFin}
          onClose={() => { setShowModal(false); setSelectedSlot(null); }}
          onCreated={handleReservaCreada}
        />
      )}
    </>
  );
};

export default CalendarioReserva;
