import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { alquileresService } from '@/services/alquileresService';
import { Loading, Button } from '@/components/ui';
import type { DisponibilidadDia, CanchaDisponibilidad, SlotAlquiler, TipoCancha } from '@/types';

const tipoCanchaColors: Record<TipoCancha, string> = {
  INDOOR: 'bg-blue-500/80 hover:bg-blue-500',
  OUTDOOR: 'bg-green-500/80 hover:bg-green-500',
  SEMI_TECHADA: 'bg-yellow-500/80 hover:bg-yellow-500',
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDayLabel(date: Date): string {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${dias[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
}

function formatPrecio(precio: number): string {
  return precio > 0 ? (precio / 1000) + 'k' : '-';
}

interface Props {
  sedeId: string;
  onSelectSlot: (canchaId: string, canchaNombre: string, canchaTipo: TipoCancha, fecha: string, slot: SlotAlquiler) => void;
}

export default function CalendarioAlquiler({ sedeId, onSelectSlot }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [data, setData] = useState<DisponibilidadDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await alquileresService.getCalendarioSemanal(sedeId, formatDateISO(weekStart));
        if (!cancelled) {
          setData(Array.isArray(result?.semana) ? result.semana : []);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.message || 'Error cargando disponibilidad');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [sedeId, weekStart]);

  const canGoPrev = useMemo(() => {
    const today = getMonday(new Date());
    return weekStart > today;
  }, [weekStart]);

  // Collect all unique time slots across the week
  const allTimeSlots = useMemo(() => {
    const times = new Set<string>();
    for (const dia of data) {
      for (const cancha of (dia.canchas || [])) {
        for (const slot of (cancha.slots || [])) {
          times.add(slot.horaInicio);
        }
      }
    }
    return [...times].sort();
  }, [data]);

  // Group canchas (same across days)
  const canchasList = useMemo(() => {
    if (data.length === 0) return [];
    const first = data[0];
    return (first?.canchas || []).map((c: CanchaDisponibilidad) => ({
      id: c.canchaId,
      nombre: c.canchaNombre,
      tipo: c.canchaTipo,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">{error}</div>;
  }

  if (allTimeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-light-muted">
        No hay horarios disponibles para esta semana.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="font-medium text-light-text text-sm sm:text-base">
          {formatDayLabel(weekStart)} — {formatDayLabel(addDays(weekStart, 6))}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-xs border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="p-2 text-left text-light-muted font-normal border-b border-dark-border w-16">Hora</th>
              {Array.from({ length: 7 }).map((_, i) => {
                const day = addDays(weekStart, i);
                const isToday = formatDateISO(day) === formatDateISO(new Date());
                return (
                  <th
                    key={i}
                    className={`p-2 text-center font-medium border-b border-dark-border ${isToday ? 'text-primary-400' : 'text-light-text'}`}
                  >
                    {formatDayLabel(day)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {allTimeSlots.map((time) => (
              <tr key={time} className="border-b border-dark-border/50">
                <td className="p-1.5 text-light-muted font-mono">{time}</td>
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const dia = data[dayIdx];
                  const fechaStr = dia?.fecha || formatDateISO(addDays(weekStart, dayIdx));

                  // Get slots for this time across all canchas
                  const canchaSlots = (dia?.canchas || []).map((cancha: CanchaDisponibilidad) => {
                    const slot = (cancha.slots || []).find((s: SlotAlquiler) => s.horaInicio === time);
                    return { cancha, slot };
                  }).filter((cs) => cs.slot);

                  if (canchaSlots.length === 0) {
                    return <td key={dayIdx} className="p-1.5 text-center text-light-muted">-</td>;
                  }

                  return (
                    <td key={dayIdx} className="p-1">
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {canchaSlots.map(({ cancha, slot }) => {
                          if (!slot) return null;
                          if (!slot.disponible) {
                            return (
                              <span
                                key={cancha.canchaId}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-dark-hover text-light-muted cursor-not-allowed"
                                title={`${cancha.canchaNombre} - ${slot.motivo || 'Ocupado'}`}
                              >
                                {cancha.canchaNombre.substring(0, 6)}
                              </span>
                            );
                          }
                          return (
                            <button
                              key={cancha.canchaId}
                              onClick={() => onSelectSlot(cancha.canchaId, cancha.canchaNombre, cancha.canchaTipo, fechaStr, slot)}
                              className={`px-1.5 py-0.5 rounded text-[10px] text-white cursor-pointer transition-colors ${tipoCanchaColors[cancha.canchaTipo]}`}
                              title={`${cancha.canchaNombre} - ${formatPrecio(slot.precio)} Gs`}
                            >
                              {cancha.canchaNombre.substring(0, 6)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-light-muted">
        {canchasList.map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${tipoCanchaColors[c.tipo]}`} />
            {c.nombre} ({c.tipo === 'INDOOR' ? 'Indoor' : c.tipo === 'OUTDOOR' ? 'Outdoor' : 'Semi-techada'})
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-dark-hover" />
          Ocupado
        </span>
      </div>
    </div>
  );
}
