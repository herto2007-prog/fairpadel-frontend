import { useEffect, useState, useMemo } from 'react';
import matchesService from '@/services/matchesService';
import type { Tournament, Match, MatchStatus } from '@/types';
import { Loading } from '@/components/ui';
import { RefreshCw } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────
interface CanchaSlotInfo {
  sedeCanchaId: string;
  nombre: string;
  sedeName: string;
  horarios: Set<string>; // "YYYY-MM-DD|HH:MM"
}

interface OcupacionGridProps {
  tournament: Tournament;
  torneoCanchas: CanchaSlotInfo[];
  slotMinutes: 30 | 60;
}

interface CellMatch {
  match: Match;
  isFirst: boolean; // first slot of this match (show label)
  span: number; // total slots this match occupies
}

// ─── Helpers ───────────────────────────────────────────────────────
function formatDayHeader(dateStr: string): { dayName: string; dayNum: number; monthName: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  const dayName = date.toLocaleDateString('es-PY', { weekday: 'short' });
  const monthName = date.toLocaleDateString('es-PY', { month: 'short' });
  return { dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1), dayNum: d, monthName };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

function isFinishedStatus(estado: MatchStatus | string): boolean {
  return ['FINALIZADO', 'WO', 'CANCELADO', 'SUSPENDIDO'].includes(estado);
}

function isActiveStatus(estado: MatchStatus | string): boolean {
  return ['PROGRAMADO', 'EN_JUEGO'].includes(estado);
}

function getParejaLabel(pareja: any): string {
  if (!pareja) return '?';
  const j1 = pareja.jugador1;
  const j2 = pareja.jugador2;
  if (j1 && j2) {
    return `${j1.apellido || '?'}/${j2.apellido || '?'}`;
  }
  if (j1) return j1.apellido || j1.nombre || '?';
  return pareja.nombre || '?';
}

// ─── Component ─────────────────────────────────────────────────────
export function OcupacionGrid({ tournament, torneoCanchas, slotMinutes }: OcupacionGridProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all matches across all categories
  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await matchesService.obtenerFixtureInterno(tournament.id);
      if (!data || typeof data !== 'object') {
        setMatches([]);
        return;
      }
      // Flatten: { [catId]: { category, rondas: { [ronda]: Match[] } } }
      const allMatches: Match[] = [];
      for (const catData of Object.values(data) as any[]) {
        if (catData?.rondas) {
          for (const rondaMatches of Object.values(catData.rondas) as any[]) {
            if (Array.isArray(rondaMatches)) {
              allMatches.push(...rondaMatches);
            }
          }
        }
      }
      setMatches(allMatches);
    } catch (err: any) {
      console.error('OcupacionGrid fetch error:', err);
      setError('Error al cargar partidos');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [tournament.id]);

  // Build a map: "sedeCanchaId|YYYY-MM-DD|HH:MM" → Match
  const matchSlotMap = useMemo(() => {
    const map = new Map<string, CellMatch>();

    for (const match of matches) {
      if (!match.fechaProgramada || !match.horaProgramada || !match.torneoCancha?.sedeCanchaId) continue;

      const sedeCanchaId = match.torneoCancha.sedeCanchaId;
      const fecha = match.fechaProgramada.split('T')[0];
      const startMin = timeToMinutes(match.horaProgramada);
      const endMin = match.horaFinEstimada ? timeToMinutes(match.horaFinEstimada) : startMin + (tournament.minutosPorPartido || 60);

      // Calculate how many slots this match spans
      const totalSlots = Math.max(1, Math.ceil((endMin - startMin) / slotMinutes));

      let slotIdx = 0;
      let curMin = startMin;
      while (curMin < endMin) {
        const slotKey = `${sedeCanchaId}|${fecha}|${minutesToTime(curMin)}`;
        map.set(slotKey, {
          match,
          isFirst: slotIdx === 0,
          span: totalSlots,
        });
        curMin += slotMinutes;
        slotIdx++;
      }
    }

    return map;
  }, [matches, slotMinutes, tournament.minutosPorPartido]);

  // Collect all dates and time slots that exist in any cancha
  const { dates, timeSlotsByDate } = useMemo(() => {
    const dateSet = new Set<string>();
    const slotsByDate = new Map<string, Set<string>>();

    for (const cancha of torneoCanchas) {
      for (const slot of cancha.horarios) {
        const [date, time] = slot.split('|');
        dateSet.add(date);
        if (!slotsByDate.has(date)) slotsByDate.set(date, new Set());
        slotsByDate.get(date)!.add(time);
      }
    }

    const sortedDates = Array.from(dateSet).sort();
    const timeSlotsByDateMap: Record<string, string[]> = {};
    for (const date of sortedDates) {
      const times = Array.from(slotsByDate.get(date) || []).sort();
      timeSlotsByDateMap[date] = times;
    }

    return { dates: sortedDates, timeSlotsByDate: timeSlotsByDateMap };
  }, [torneoCanchas]);

  // Stats
  const stats = useMemo(() => {
    let libre = 0;
    let programado = 0;
    let finalizado = 0;
    let sinHorario = 0;

    for (const cancha of torneoCanchas) {
      for (const slot of cancha.horarios) {
        const [date, time] = slot.split('|');
        const key = `${cancha.sedeCanchaId}|${date}|${time}`;
        const cellMatch = matchSlotMap.get(key);
        if (cellMatch) {
          if (isFinishedStatus(cellMatch.match.estado)) {
            finalizado++;
          } else {
            programado++;
          }
        } else {
          libre++;
        }
      }
    }

    // Count matches without scheduled time
    sinHorario = matches.filter(m => !m.fechaProgramada || !m.horaProgramada).length;

    const total = libre + programado + finalizado;
    const ocupacionPct = total > 0 ? Math.round(((programado + finalizado) / total) * 100) : 0;

    return { libre, programado, finalizado, sinHorario, total, ocupacionPct };
  }, [torneoCanchas, matchSlotMap, matches]);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ x: number; y: number; match: Match } | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <Loading size="sm" />
        <span className="text-sm text-light-secondary">Cargando partidos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <button
          onClick={fetchMatches}
          className="text-sm text-primary-400 hover:underline flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reintentar
        </button>
      </div>
    );
  }

  if (torneoCanchas.length === 0 || dates.length === 0) {
    return (
      <p className="text-sm text-light-secondary text-center py-6">
        No hay canchas/horarios configurados para mostrar ocupación.
      </p>
    );
  }

  const cellH = slotMinutes === 30 ? 'h-7' : 'h-10';

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500/50 border border-green-500/70" />
          <span className="text-light-secondary">Libre ({stats.libre})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-500/50 border border-amber-500/70" />
          <span className="text-light-secondary">Programado ({stats.programado})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/50 border border-red-500/70" />
          <span className="text-light-secondary">Finalizado ({stats.finalizado})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-dark-surface border border-dark-border" />
          <span className="text-light-secondary">Sin slot</span>
        </div>
        <div className="ml-auto font-medium text-light-text">
          {stats.ocupacionPct}% ocupado
        </div>
        {stats.sinHorario > 0 && (
          <span className="text-amber-400">
            {stats.sinHorario} partido{stats.sinHorario !== 1 ? 's' : ''} sin horario
          </span>
        )}
        <button
          onClick={fetchMatches}
          className="p-1 hover:bg-dark-hover rounded transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="w-3.5 h-3.5 text-light-secondary" />
        </button>
      </div>

      {/* Grid */}
      <div className="relative overflow-x-auto rounded-lg border border-dark-border">
        <div
          className="grid min-w-max"
          style={{
            gridTemplateColumns: `56px repeat(${torneoCanchas.length}, minmax(80px, 1fr))`,
          }}
        >
          {/* Header row — sticky */}
          <div className="sticky top-0 z-20 bg-dark-card border-b border-dark-border flex items-center justify-center px-1 text-[10px] text-light-secondary font-medium h-10">
            Hora
          </div>
          {torneoCanchas.map((cancha) => (
            <div
              key={cancha.sedeCanchaId}
              className="sticky top-0 z-20 bg-dark-card border-b border-l border-dark-border flex flex-col items-center justify-center px-1 text-center h-10"
            >
              <span className="text-[10px] font-bold text-light-text truncate max-w-full">
                {cancha.nombre}
              </span>
              {torneoCanchas.some(c => c.sedeName !== torneoCanchas[0]?.sedeName) && (
                <span className="text-[8px] text-light-muted truncate max-w-full">
                  {cancha.sedeName}
                </span>
              )}
            </div>
          ))}

          {/* Date groups */}
          {dates.map((date) => {
            const header = formatDayHeader(date);
            const timeSlots = timeSlotsByDate[date] || [];

            return (
              <div key={date} className="contents">
                {/* Date separator */}
                <div
                  className="bg-dark-surface/80 border-b border-dark-border px-2 py-1.5 text-xs font-bold text-light-text flex items-center"
                  style={{ gridColumn: `1 / -1` }}
                >
                  {header.dayName} {header.dayNum} {header.monthName}
                </div>

                {/* Time slot rows */}
                {timeSlots.map((time) => (
                  <div key={`${date}|${time}`} className="contents">
                    {/* Time label */}
                    <div className={`sticky left-0 z-10 bg-dark-card border-b border-r border-dark-border flex items-center justify-center text-[10px] text-light-secondary font-mono ${cellH}`}>
                      {time}
                    </div>

                    {/* Cancha cells */}
                    {torneoCanchas.map((cancha) => {
                      const slotKey = `${date}|${time}`;
                      const hasSlot = cancha.horarios.has(slotKey);
                      const matchKey = `${cancha.sedeCanchaId}|${date}|${time}`;
                      const cellMatch = matchSlotMap.get(matchKey);

                      let bgClass = 'bg-dark-card'; // no slot (gray)
                      let textContent: string | null = null;

                      if (!hasSlot) {
                        bgClass = 'bg-dark-surface/30';
                      } else if (cellMatch) {
                        if (isFinishedStatus(cellMatch.match.estado)) {
                          bgClass = 'bg-red-500/30 hover:bg-red-500/50';
                        } else if (isActiveStatus(cellMatch.match.estado)) {
                          bgClass = 'bg-amber-500/30 hover:bg-amber-500/50';
                        }
                        if (cellMatch.isFirst) {
                          const p1 = getParejaLabel(cellMatch.match.pareja1);
                          const p2 = getParejaLabel(cellMatch.match.pareja2);
                          textContent = `${p1} vs ${p2}`;
                        }
                      } else if (hasSlot) {
                        bgClass = 'bg-green-500/20';
                      }

                      return (
                        <div
                          key={`${cancha.sedeCanchaId}|${date}|${time}`}
                          className={`border-b border-l border-dark-border ${cellH} ${bgClass} relative flex items-center justify-center cursor-default transition-colors`}
                          onMouseEnter={(e) => {
                            if (cellMatch) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                                match: cellMatch.match,
                              });
                            }
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          {textContent && (
                            <span className="text-[8px] leading-tight truncate px-0.5 text-light-text/80 font-medium">
                              {textContent}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-dark-card border border-dark-border rounded-lg shadow-xl p-3 max-w-xs"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-bold text-sm text-light-text">
            {getParejaLabel(tooltip.match.pareja1)} vs {getParejaLabel(tooltip.match.pareja2)}
          </p>
          <p className="text-xs text-light-secondary mt-0.5">
            {tooltip.match.category?.nombre || tooltip.match.ronda}
            {tooltip.match.category?.nombre && ` · ${tooltip.match.ronda}`}
          </p>
          <p className="text-xs mt-0.5">
            <span className={`font-medium ${
              isFinishedStatus(tooltip.match.estado)
                ? 'text-red-400'
                : tooltip.match.estado === 'EN_JUEGO'
                  ? 'text-yellow-400'
                  : 'text-amber-400'
            }`}>
              {tooltip.match.estado}
            </span>
            {tooltip.match.horaProgramada && (
              <span className="text-light-muted ml-1">
                {tooltip.match.horaProgramada}
                {tooltip.match.horaFinEstimada && ` - ${tooltip.match.horaFinEstimada}`}
              </span>
            )}
          </p>
          {tooltip.match.set1Pareja1 != null && (
            <p className="text-xs text-light-muted mt-1 font-mono">
              {tooltip.match.set1Pareja1}-{tooltip.match.set1Pareja2}
              {tooltip.match.set2Pareja1 != null && ` / ${tooltip.match.set2Pareja1}-${tooltip.match.set2Pareja2}`}
              {tooltip.match.set3Pareja1 != null && ` / ${tooltip.match.set3Pareja1}-${tooltip.match.set3Pareja2}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
