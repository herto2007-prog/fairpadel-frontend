import { useState, useEffect, useCallback } from 'react';
import { instructoresService } from '@/services/instructoresService';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import {
  Clock,
  Save,
  Loader2,
  Plus,
  Trash2,
  CalendarOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { InstructorDisponibilidad, InstructorBloqueo } from '@/types';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS: string[] = [];
for (let h = 7; h <= 21; h++) {
  HORAS.push(`${String(h).padStart(2, '0')}:00`);
}

// Grid cell key: "dia-hora" e.g. "1-08:00"
type CellKey = string;
const cellKey = (dia: number, hora: string): CellKey => `${dia}-${hora}`;

const DisponibilidadConfig = () => {
  const [activeCells, setActiveCells] = useState<Set<CellKey>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');

  // Bloqueos
  const [bloqueos, setBloqueos] = useState<InstructorBloqueo[]>([]);
  const [showBloqueoForm, setShowBloqueoForm] = useState(false);
  const [bloqueoInicio, setBloqueoInicio] = useState('');
  const [bloqueoFin, setBloqueoFin] = useState('');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('');
  const [savingBloqueo, setSavingBloqueo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dispsRaw, bloqsRaw] = await Promise.all([
        instructoresService.obtenerDisponibilidad(),
        instructoresService.obtenerBloqueos(),
      ]);
      const disps = Array.isArray(dispsRaw) ? dispsRaw : [];
      const bloqs = Array.isArray(bloqsRaw) ? bloqsRaw : [];
      // Convert disponibilidades to cell keys
      const cells = new Set<CellKey>();
      disps.forEach((d: InstructorDisponibilidad) => {
        // Each disp is a range — expand to hourly cells
        const startMin = parseHora(d.horaInicio);
        const endMin = parseHora(d.horaFin);
        for (let m = startMin; m < endMin; m += 60) {
          const h = String(Math.floor(m / 60)).padStart(2, '0');
          cells.add(cellKey(d.diaSemana, `${h}:00`));
        }
      });
      setActiveCells(cells);
      setBloqueos(bloqs);
    } catch (err) {
      console.error('Error loading disponibilidad:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseHora = (hora: string): number => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const toggleCell = useCallback((dia: number, hora: string) => {
    setActiveCells((prev) => {
      const key = cellKey(dia, hora);
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleMouseDown = useCallback((dia: number, hora: string) => {
    const key = cellKey(dia, hora);
    setIsDragging(true);
    setDragMode(activeCells.has(key) ? 'remove' : 'add');
    toggleCell(dia, hora);
  }, [activeCells, toggleCell]);

  const handleMouseEnter = useCallback((dia: number, hora: string) => {
    if (!isDragging) return;
    const key = cellKey(dia, hora);
    setActiveCells((prev) => {
      const next = new Set(prev);
      if (dragMode === 'add') {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, [isDragging, dragMode]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert active cells back to slot ranges
      // Group by dia, then merge consecutive hours into ranges
      const byDia: Record<number, number[]> = {};
      activeCells.forEach((key) => {
        const [diaStr, hora] = key.split('-');
        const dia = parseInt(diaStr);
        if (!byDia[dia]) byDia[dia] = [];
        byDia[dia].push(parseHora(hora));
      });

      const slots: Array<{ diaSemana: number; horaInicio: string; horaFin: string }> = [];
      Object.entries(byDia).forEach(([diaStr, minutes]) => {
        const dia = parseInt(diaStr);
        const sorted = [...minutes].sort((a, b) => a - b);
        let rangeStart = sorted[0];
        let rangeEnd = sorted[0] + 60;

        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] === rangeEnd) {
            rangeEnd = sorted[i] + 60;
          } else {
            slots.push({
              diaSemana: dia,
              horaInicio: minutesToHora(rangeStart),
              horaFin: minutesToHora(rangeEnd),
            });
            rangeStart = sorted[i];
            rangeEnd = sorted[i] + 60;
          }
        }
        slots.push({
          diaSemana: dia,
          horaInicio: minutesToHora(rangeStart),
          horaFin: minutesToHora(rangeEnd),
        });
      });

      await instructoresService.actualizarDisponibilidad(slots);
      toast.success('Disponibilidad guardada');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const minutesToHora = (m: number): string => {
    const h = String(Math.floor(m / 60)).padStart(2, '0');
    const min = String(m % 60).padStart(2, '0');
    return `${h}:${min}`;
  };

  const handleCrearBloqueo = async () => {
    if (!bloqueoInicio || !bloqueoFin) {
      toast.error('Ingresá fecha inicio y fin');
      return;
    }
    setSavingBloqueo(true);
    try {
      await instructoresService.crearBloqueo({
        fechaInicio: bloqueoInicio,
        fechaFin: bloqueoFin,
        motivo: bloqueoMotivo.trim() || undefined,
      });
      toast.success('Bloqueo creado');
      setBloqueoInicio('');
      setBloqueoFin('');
      setBloqueoMotivo('');
      setShowBloqueoForm(false);
      const bloqs = await instructoresService.obtenerBloqueos();
      setBloqueos(bloqs);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al crear bloqueo');
    } finally {
      setSavingBloqueo(false);
    }
  };

  const handleEliminarBloqueo = async (id: string) => {
    try {
      await instructoresService.eliminarBloqueo(id);
      setBloqueos((prev) => prev.filter((b) => b.id !== id));
      toast.success('Bloqueo eliminado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al eliminar');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              Horario Semanal
            </CardTitle>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
          </div>
          <p className="text-xs text-light-muted mt-1">
            Hacé click o arrastrá para marcar los horarios en los que estás disponible
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Header row */}
            <div className="grid grid-cols-8 gap-px mb-px">
              <div className="p-1.5 text-[10px] text-light-muted text-center">Hora</div>
              {DIAS.map((dia, i) => (
                <div key={i} className="p-1.5 text-[10px] font-semibold text-light-text text-center">
                  {dia}
                </div>
              ))}
            </div>
            {/* Time rows */}
            {HORAS.map((hora) => (
              <div key={hora} className="grid grid-cols-8 gap-px mb-px">
                <div className="p-1 text-[10px] text-light-muted text-center flex items-center justify-center">
                  {hora}
                </div>
                {DIAS.map((_dia, diaIdx) => {
                  const key = cellKey(diaIdx, hora);
                  const isActive = activeCells.has(key);
                  return (
                    <div
                      key={diaIdx}
                      className={`h-8 rounded-sm cursor-pointer transition-colors select-none border ${
                        isActive
                          ? 'bg-primary-500/30 border-primary-500/50'
                          : 'bg-dark-surface border-dark-border hover:bg-dark-hover'
                      }`}
                      onMouseDown={() => handleMouseDown(diaIdx, hora)}
                      onMouseEnter={() => handleMouseEnter(diaIdx, hora)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-light-muted">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-primary-500/30 border border-primary-500/50 inline-block" />
              Disponible
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-dark-surface border border-dark-border inline-block" />
              No disponible
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Bloqueos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarOff className="h-5 w-5" />
              Bloqueos de Fechas
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBloqueoForm(!showBloqueoForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
          <p className="text-xs text-light-muted mt-1">
            Bloqueá fechas en las que no estés disponible (vacaciones, viajes, etc.)
          </p>
        </CardHeader>
        <CardContent>
          {showBloqueoForm && (
            <div className="p-3 bg-dark-surface rounded-lg mb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-light-muted mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={bloqueoInicio}
                    onChange={(e) => setBloqueoInicio(e.target.value)}
                    className="w-full px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-light-muted mb-1">Fecha fin</label>
                  <input
                    type="date"
                    value={bloqueoFin}
                    onChange={(e) => setBloqueoFin(e.target.value)}
                    className="w-full px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-light-muted mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  value={bloqueoMotivo}
                  onChange={(e) => setBloqueoMotivo(e.target.value)}
                  placeholder="Ej: Vacaciones"
                  className="w-full px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowBloqueoForm(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" onClick={handleCrearBloqueo} disabled={savingBloqueo}>
                  {savingBloqueo ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Crear Bloqueo
                </Button>
              </div>
            </div>
          )}

          {bloqueos.length === 0 ? (
            <p className="text-sm text-light-muted text-center py-4">
              No tenés bloqueos de fechas configurados
            </p>
          ) : (
            <div className="space-y-2">
              {bloqueos.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 bg-dark-surface rounded-lg"
                >
                  <div>
                    <p className="text-sm text-light-text font-medium">
                      {new Date(b.fechaInicio).toLocaleDateString('es-PY')} → {new Date(b.fechaFin).toLocaleDateString('es-PY')}
                    </p>
                    {b.motivo && (
                      <p className="text-xs text-light-muted">{b.motivo}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEliminarBloqueo(b.id)}
                    className="p-1.5 text-light-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DisponibilidadConfig;
