import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Eraser, PaintBucket } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────
interface CanchasCalendarGridProps {
  fechaInicio: string;
  fechaFin: string;
  selectedSlots: Set<string>;
  onSlotsChange: (slots: Set<string>) => void;
  slotMinutes: 30 | 60;
  onSlotMinutesChange: (v: 30 | 60) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────
function getTournamentDays(fechaInicio: string, fechaFin: string): string[] {
  const days: string[] = [];
  const start = fechaInicio.split('T')[0];
  const end = fechaFin.split('T')[0];
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const cur = new Date(sy, sm - 1, sd, 12);
  const last = new Date(ey, em - 1, ed, 12);
  while (cur <= last) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getTimeSlots(slotMinutes: 30 | 60): string[] {
  const slots: string[] = [];
  for (let h = 7; h < 24; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (slotMinutes === 30) {
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
  }
  return slots;
}

function formatDayHeader(dateStr: string): { dayName: string; dayNum: number; monthName: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  const dayName = date.toLocaleDateString('es-PY', { weekday: 'short' });
  const monthName = date.toLocaleDateString('es-PY', { month: 'short' });
  return { dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1), dayNum: d, monthName };
}

function parseCellKey(key: string): { day: string; slot: string } {
  const [day, slot] = key.split('|');
  return { day, slot };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// ─── Component ─────────────────────────────────────────────────────
export function CanchasCalendarGrid({
  fechaInicio,
  fechaFin,
  selectedSlots,
  onSlotsChange,
  slotMinutes,
  onSlotMinutesChange,
}: CanchasCalendarGridProps) {
  const days = useMemo(() => getTournamentDays(fechaInicio, fechaFin), [fechaInicio, fechaFin]);
  const timeSlots = useMemo(() => getTimeSlots(slotMinutes), [slotMinutes]);

  // Paint state
  const [isPainting, setIsPainting] = useState(false);
  const [paintMode, setPaintMode] = useState<'add' | 'remove'>('add');
  const [paintStart, setPaintStart] = useState<{ dayIdx: number; slotIdx: number } | null>(null);
  const [paintCurrent, setPaintCurrent] = useState<{ dayIdx: number; slotIdx: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Preview cells calculated from paint rectangle
  const previewCells = useMemo(() => {
    if (!paintStart || !paintCurrent) return new Set<string>();
    const dayMin = Math.min(paintStart.dayIdx, paintCurrent.dayIdx);
    const dayMax = Math.max(paintStart.dayIdx, paintCurrent.dayIdx);
    const slotMin = Math.min(paintStart.slotIdx, paintCurrent.slotIdx);
    const slotMax = Math.max(paintStart.slotIdx, paintCurrent.slotIdx);
    const cells = new Set<string>();
    for (let d = dayMin; d <= dayMax; d++) {
      for (let s = slotMin; s <= slotMax; s++) {
        if (days[d] && timeSlots[s]) {
          cells.add(`${days[d]}|${timeSlots[s]}`);
        }
      }
    }
    return cells;
  }, [paintStart, paintCurrent, days, timeSlots]);

  // Commit paint on mouseup
  const commitPaint = useCallback(() => {
    if (!isPainting || previewCells.size === 0) {
      setIsPainting(false);
      setPaintStart(null);
      setPaintCurrent(null);
      return;
    }
    const newSlots = new Set(selectedSlots);
    previewCells.forEach((cell) => {
      if (paintMode === 'add') newSlots.add(cell);
      else newSlots.delete(cell);
    });
    onSlotsChange(newSlots);
    setIsPainting(false);
    setPaintStart(null);
    setPaintCurrent(null);
  }, [isPainting, previewCells, paintMode, selectedSlots, onSlotsChange]);

  // Global mouseup
  useEffect(() => {
    const handler = () => { if (isPainting) commitPaint(); };
    window.addEventListener('mouseup', handler);
    window.addEventListener('touchend', handler);
    return () => {
      window.removeEventListener('mouseup', handler);
      window.removeEventListener('touchend', handler);
    };
  }, [isPainting, commitPaint]);

  // Cell event handlers
  const handleCellMouseDown = (e: React.MouseEvent, dayIdx: number, slotIdx: number) => {
    e.preventDefault();
    const cellKey = `${days[dayIdx]}|${timeSlots[slotIdx]}`;
    const mode = selectedSlots.has(cellKey) ? 'remove' : 'add';
    setPaintMode(mode);
    setPaintStart({ dayIdx, slotIdx });
    setPaintCurrent({ dayIdx, slotIdx });
    setIsPainting(true);
  };

  const handleCellMouseEnter = (_e: React.MouseEvent, dayIdx: number, slotIdx: number) => {
    if (!isPainting) return;
    setPaintCurrent({ dayIdx, slotIdx });
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent, dayIdx: number, slotIdx: number) => {
    e.preventDefault();
    const cellKey = `${days[dayIdx]}|${timeSlots[slotIdx]}`;
    const mode = selectedSlots.has(cellKey) ? 'remove' : 'add';
    setPaintMode(mode);
    setPaintStart({ dayIdx, slotIdx });
    setPaintCurrent({ dayIdx, slotIdx });
    setIsPainting(true);
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPainting) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    if (!el) return;
    const cellAttr = el.getAttribute('data-cell');
    if (!cellAttr) return;
    const { day, slot } = parseCellKey(cellAttr);
    const dayIdx = days.indexOf(day);
    const slotIdx = timeSlots.indexOf(slot);
    if (dayIdx >= 0 && slotIdx >= 0) {
      setPaintCurrent({ dayIdx, slotIdx });
    }
  }, [isPainting, days, timeSlots]);

  // Quick-fill: fill all slots for a specific day (8-22)
  const fillDay = (dayStr: string) => {
    const newSlots = new Set(selectedSlots);
    for (const slot of timeSlots) {
      const mins = timeToMinutes(slot);
      if (mins >= 480 && mins < 1380) { // 8:00 to 23:00
        newSlots.add(`${dayStr}|${slot}`);
      }
    }
    onSlotsChange(newSlots);
  };

  // Clear all slots for this cancha
  const clearAll = () => {
    onSlotsChange(new Set());
  };

  // Fill all days
  const fillAll = () => {
    const newSlots = new Set(selectedSlots);
    for (const day of days) {
      for (const slot of timeSlots) {
        const mins = timeToMinutes(slot);
        if (mins >= 480 && mins < 1380) {
          newSlots.add(`${day}|${slot}`);
        }
      }
    }
    onSlotsChange(newSlots);
  };

  // Summary stats
  const totalSlots = selectedSlots.size;
  const totalHours = (totalSlots * slotMinutes) / 60;
  const daysWithSlots = new Set([...selectedSlots].map((s) => s.split('|')[0])).size;

  // Cell styling
  const getCellClasses = (dayIdx: number, slotIdx: number): string => {
    const cellKey = `${days[dayIdx]}|${timeSlots[slotIdx]}`;
    const isSelected = selectedSlots.has(cellKey);
    const isPreview = previewCells.has(cellKey);

    if (isPreview && paintMode === 'add' && !isSelected) {
      return 'bg-primary-500/40';
    }
    if (isPreview && paintMode === 'remove' && isSelected) {
      return 'bg-red-500/40';
    }
    if (isSelected) {
      return 'bg-primary-500/60 hover:bg-primary-500/70';
    }
    return 'bg-dark-surface hover:bg-dark-hover';
  };

  const cellH = slotMinutes === 30 ? 'h-7' : 'h-10';

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Granularity toggle */}
        <div className="flex items-center gap-1 bg-dark-surface rounded-lg p-1">
          <button
            onClick={() => onSlotMinutesChange(60)}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${slotMinutes === 60 ? 'bg-primary-500 text-white' : 'text-light-secondary hover:text-light-text'}`}
          >
            60 min
          </button>
          <button
            onClick={() => onSlotMinutesChange(30)}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${slotMinutes === 30 ? 'bg-primary-500 text-white' : 'text-light-secondary hover:text-light-text'}`}
          >
            30 min
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={fillAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-dark-surface text-light-secondary hover:text-light-text rounded-lg border border-dark-border hover:border-dark-hover transition-colors"
          >
            <PaintBucket className="w-3.5 h-3.5" /> Llenar todo (8-23h)
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-dark-surface text-red-400 hover:text-red-300 rounded-lg border border-dark-border hover:border-red-500/50 transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" /> Limpiar
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-lg border border-dark-border" ref={gridRef}>
        <div
          className="grid min-w-max select-none"
          style={{
            gridTemplateColumns: `56px repeat(${days.length}, minmax(80px, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="sticky left-0 z-20 bg-dark-card border-b border-r border-dark-border" />
          {days.map((day) => {
            const { dayName, dayNum, monthName } = formatDayHeader(day);
            return (
              <div
                key={day}
                className="border-b border-dark-border text-center py-2 bg-dark-card cursor-pointer hover:bg-dark-hover transition-colors"
                onClick={() => fillDay(day)}
                title="Click para llenar este día (8-23h)"
              >
                <div className="text-[10px] text-light-secondary uppercase tracking-wide">{dayName}</div>
                <div className="text-sm font-bold text-light-text">{dayNum}</div>
                <div className="text-[10px] text-light-secondary">{monthName}</div>
              </div>
            );
          })}

          {/* Time rows */}
          {timeSlots.map((slot, slotIdx) => {
            const isHour = slot.endsWith(':00');
            return (
              <div key={slot} className="contents">
                {/* Time label */}
                <div
                  className={`sticky left-0 z-10 bg-dark-card flex items-center justify-end pr-2 text-[11px] font-mono border-r border-dark-border ${cellH} ${isHour ? 'text-light-secondary border-t border-dark-border/60' : 'text-light-secondary/50'}`}
                >
                  {isHour ? slot : ''}
                </div>

                {/* Day cells */}
                {days.map((day, dayIdx) => {
                  const cellKey = `${day}|${slot}`;
                  return (
                    <div
                      key={cellKey}
                      data-cell={cellKey}
                      className={`${cellH} border-t border-l border-dark-border/30 cursor-crosshair transition-colors duration-75 ${getCellClasses(dayIdx, slotIdx)}`}
                      onMouseDown={(e) => handleCellMouseDown(e, dayIdx, slotIdx)}
                      onMouseEnter={(e) => handleCellMouseEnter(e, dayIdx, slotIdx)}
                      onTouchStart={(e) => handleTouchStart(e, dayIdx, slotIdx)}
                      onTouchMove={handleTouchMove}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-light-secondary">
        <span>
          {totalSlots > 0 ? (
            <>
              <span className="font-medium text-primary-400">{totalHours}h</span> configuradas en{' '}
              <span className="font-medium text-light-text">{daysWithSlots}</span> día{daysWithSlots !== 1 ? 's' : ''}
            </>
          ) : (
            'Click y arrastra sobre el calendario para pintar horarios disponibles'
          )}
        </span>
        <span className="text-[10px]">
          Click en el encabezado del día para llenar 8-23h
        </span>
      </div>
    </div>
  );
}
