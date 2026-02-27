import { useState, useEffect } from 'react';
import { instructoresService } from '@/services/instructoresService';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
} from 'lucide-react';
import type { ReservaInstructor, InstructorBloqueo, InstructorDisponibilidad } from '@/types';

const DIAS_NOMBRES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS: string[] = [];
for (let h = 7; h <= 21; h++) {
  HORAS.push(`${String(h).padStart(2, '0')}:00`);
}

const parseHora = (hora: string): number => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

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

const estadoColor: Record<string, string> = {
  PENDIENTE: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
  CONFIRMADA: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  COMPLETADA: 'bg-green-500/20 border-green-500/50 text-green-400',
  RECHAZADA: 'bg-red-500/20 border-red-500/50 text-red-400',
  CANCELADA: 'bg-gray-500/20 border-gray-500/50 text-gray-400',
};

const AgendaSemanal = () => {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [reservas, setReservas] = useState<ReservaInstructor[]>([]);
  const [bloqueos, setBloqueos] = useState<InstructorBloqueo[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<InstructorDisponibilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReserva, setSelectedReserva] = useState<ReservaInstructor | null>(null);

  useEffect(() => {
    loadAgenda();
  }, [weekStart]);

  const loadAgenda = async () => {
    setLoading(true);
    try {
      const data = await instructoresService.obtenerAgenda(formatDateISO(weekStart));
      setReservas(data.reservas);
      setBloqueos(data.bloqueos);
      setDisponibilidades(data.disponibilidades);
    } catch (err) {
      console.error('Error loading agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  const prevWeek = () => setWeekStart((prev) => addDays(prev, -7));
  const nextWeek = () => setWeekStart((prev) => addDays(prev, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  // Build 7 days array (lun-dom)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Helper: get cell state for a day/hour
  const getCellState = (dayDate: Date, hora: string) => {
    const dateStr = formatDateISO(dayDate);
    const dayOfWeek = dayDate.getDay();
    const horaMin = parseHora(hora);
    const horaFinMin = horaMin + 60;

    // Check bloqueos
    const isBlocked = bloqueos.some((b) => {
      const bStart = b.fechaInicio.split('T')[0];
      const bEnd = b.fechaFin.split('T')[0];
      return dateStr >= bStart && dateStr <= bEnd;
    });
    if (isBlocked) return 'blocked';

    // Check reservas
    const reserva = reservas.find((r) => {
      const rDate = r.fecha.split('T')[0];
      if (rDate !== dateStr) return false;
      const rStart = parseHora(r.horaInicio);
      const rEnd = parseHora(r.horaFin);
      return horaMin < rEnd && horaFinMin > rStart;
    });
    if (reserva) return reserva;

    // Check disponibilidad
    const isAvailable = disponibilidades.some((d) => {
      if (d.diaSemana !== dayOfWeek) return false;
      const dStart = parseHora(d.horaInicio);
      const dEnd = parseHora(d.horaFin);
      return horaMin >= dStart && horaFinMin <= dEnd;
    });
    if (isAvailable) return 'available';

    return 'empty';
  };

  const today = formatDateISO(new Date());

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" />
              Agenda Semanal
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={prevWeek}
                className="p-1.5 rounded-lg hover:bg-dark-hover text-light-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToday}
                className="px-2.5 py-1 text-xs rounded-lg bg-dark-surface text-light-secondary hover:bg-dark-hover transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={nextWeek}
                className="p-1.5 rounded-lg hover:bg-dark-hover text-light-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-light-muted mt-1">
            {weekDays[0].toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })} — {weekDays[6].toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
            </div>
          ) : (
            <div className="min-w-[500px]">
              {/* Header */}
              <div className="grid grid-cols-8 gap-px mb-px">
                <div className="p-1.5 text-[10px] text-light-muted text-center">Hora</div>
                {weekDays.map((d, i) => {
                  const isToday = formatDateISO(d) === today;
                  return (
                    <div
                      key={i}
                      className={`p-1.5 text-center ${isToday ? 'bg-primary-500/10 rounded-t-lg' : ''}`}
                    >
                      <p className={`text-[10px] font-semibold ${isToday ? 'text-primary-400' : 'text-light-text'}`}>
                        {DIAS_NOMBRES[d.getDay()]}
                      </p>
                      <p className={`text-[10px] ${isToday ? 'text-primary-400' : 'text-light-muted'}`}>
                        {d.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>
              {/* Time rows */}
              {HORAS.map((hora) => (
                <div key={hora} className="grid grid-cols-8 gap-px mb-px">
                  <div className="p-1 text-[10px] text-light-muted text-center flex items-center justify-center">
                    {hora}
                  </div>
                  {weekDays.map((d, i) => {
                    const state = getCellState(d, hora);
                    let cellClass = 'h-8 rounded-sm text-[9px] flex items-center justify-center border transition-colors ';

                    if (state === 'blocked') {
                      cellClass += 'bg-gray-500/10 border-gray-500/30 cursor-default';
                    } else if (state === 'available') {
                      cellClass += 'bg-green-500/10 border-green-500/20 cursor-default';
                    } else if (state === 'empty') {
                      cellClass += 'bg-dark-surface border-dark-border cursor-default';
                    } else {
                      // It's a reserva
                      const reserva = state as ReservaInstructor;
                      const colors = estadoColor[reserva.estado] || 'bg-dark-surface border-dark-border';
                      cellClass += `${colors} cursor-pointer`;
                    }

                    const isReserva = typeof state === 'object';

                    return (
                      <div
                        key={i}
                        className={cellClass}
                        onClick={() => {
                          if (isReserva) setSelectedReserva(state as ReservaInstructor);
                        }}
                        title={
                          state === 'blocked'
                            ? 'Bloqueado'
                            : state === 'available'
                            ? 'Disponible'
                            : isReserva
                            ? `${(state as ReservaInstructor).solicitante?.nombre || 'Alumno'} - ${(state as ReservaInstructor).estado}`
                            : ''
                        }
                      >
                        {isReserva && (
                          <span className="truncate px-0.5">
                            {(state as ReservaInstructor).solicitante?.nombre?.charAt(0) || '?'}
                          </span>
                        )}
                        {state === 'blocked' && <span className="text-gray-500">×</span>}
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
                  <span className="w-3 h-3 rounded-sm bg-yellow-500/20 border border-yellow-500/50 inline-block" />
                  Pendiente
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-blue-500/20 border border-blue-500/50 inline-block" />
                  Confirmada
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-gray-500/10 border border-gray-500/30 inline-block" />
                  Bloqueado
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Reserva Detail */}
      {selectedReserva && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-light-text text-sm">Detalle de Reserva</h3>
              <button
                onClick={() => setSelectedReserva(null)}
                className="text-light-muted hover:text-light-text text-xs"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-light-muted" />
                <span className="text-light-text">
                  {selectedReserva.solicitante?.nombre} {selectedReserva.solicitante?.apellido}
                </span>
              </div>
              <div className="flex items-center gap-2 text-light-secondary">
                <Calendar className="h-4 w-4 text-light-muted" />
                {new Date(selectedReserva.fecha).toLocaleDateString('es-PY')} — {selectedReserva.horaInicio} a {selectedReserva.horaFin}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={
                  selectedReserva.estado === 'CONFIRMADA' ? 'success' :
                  selectedReserva.estado === 'PENDIENTE' ? 'warning' :
                  selectedReserva.estado === 'COMPLETADA' ? 'success' : 'danger'
                }>
                  {selectedReserva.estado}
                </Badge>
                <span className="text-xs text-light-muted">
                  {selectedReserva.tipo} — Gs. {selectedReserva.precio.toLocaleString()}
                </span>
              </div>
              {selectedReserva.mensaje && (
                <p className="text-xs text-light-muted bg-dark-surface p-2 rounded">
                  &quot;{selectedReserva.mensaje}&quot;
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgendaSemanal;
