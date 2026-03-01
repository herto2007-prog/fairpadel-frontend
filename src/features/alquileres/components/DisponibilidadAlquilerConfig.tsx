import { useState, useEffect, useCallback } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  sedeId: string;
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS: string[] = [];
for (let h = 7; h <= 22; h++) {
  HORAS.push(`${String(h).padStart(2, '0')}:00`);
}

type CellKey = string;
const cellKey = (dia: number, hora: string): CellKey => `${dia}-${hora}`;

interface CanchaInfo {
  id: string;
  nombre: string;
}

export default function DisponibilidadAlquilerConfig({ sedeId }: Props) {
  const [canchas, setCanchas] = useState<CanchaInfo[]>([]);
  const [selectedCancha, setSelectedCancha] = useState('');
  const [activeCells, setActiveCells] = useState<Record<string, Set<CellKey>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');

  useEffect(() => {
    loadData();
  }, [sedeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sedeData, dispData] = await Promise.all([
        alquileresService.getSedeDetalle(sedeId),
        alquileresService.getDisponibilidad(sedeId),
      ]);
      const canchasList: CanchaInfo[] = Array.isArray(sedeData.canchas)
        ? sedeData.canchas.map((c: any) => ({ id: c.id, nombre: c.nombre }))
        : [];
      setCanchas(canchasList);
      if (canchasList.length > 0 && !selectedCancha) {
        setSelectedCancha(canchasList[0].id);
      }

      // Build cell maps per cancha
      const cellMaps: Record<string, Set<CellKey>> = {};
      const disps = Array.isArray(dispData) ? dispData : [];
      disps.forEach((d: any) => {
        const cid = d.sedeCanchaId;
        if (!cellMaps[cid]) cellMaps[cid] = new Set();
        const startMin = parseHora(d.horaInicio);
        const endMin = parseHora(d.horaFin);
        for (let m = startMin; m < endMin; m += 60) {
          const h = String(Math.floor(m / 60)).padStart(2, '0');
          cellMaps[cid].add(cellKey(d.diaSemana, `${h}:00`));
        }
      });
      setActiveCells(cellMaps);
    } catch (err: any) {
      toast.error('Error cargando disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  const parseHora = (h: string): number => {
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + (mm || 0);
  };

  const toggleCell = useCallback((key: CellKey, mode: 'add' | 'remove') => {
    setActiveCells((prev) => {
      const cells = new Set(prev[selectedCancha] || []);
      if (mode === 'add') cells.add(key);
      else cells.delete(key);
      return { ...prev, [selectedCancha]: cells };
    });
  }, [selectedCancha]);

  const handleMouseDown = (dia: number, hora: string) => {
    const key = cellKey(dia, hora);
    const cells = activeCells[selectedCancha] || new Set();
    const mode = cells.has(key) ? 'remove' : 'add';
    setDragMode(mode);
    setIsDragging(true);
    toggleCell(key, mode);
  };

  const handleMouseEnter = (dia: number, hora: string) => {
    if (!isDragging) return;
    toggleCell(cellKey(dia, hora), dragMode);
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert all cell maps to API format
      const slots: { sedeCanchaId: string; diaSemana: number; horaInicio: string; horaFin: string }[] = [];
      Object.entries(activeCells).forEach(([canchaId, cells]) => {
        // Group consecutive hours per day
        const daysMap: Record<number, number[]> = {};
        cells.forEach((key) => {
          const [d, h] = key.split('-');
          const dia = parseInt(d);
          const hora = parseInt(h);
          if (!daysMap[dia]) daysMap[dia] = [];
          daysMap[dia].push(hora);
        });

        Object.entries(daysMap).forEach(([dia, horas]) => {
          horas.sort((a, b) => a - b);
          // Merge consecutive hours into ranges
          let start = horas[0];
          let end = horas[0] + 1;
          for (let i = 1; i < horas.length; i++) {
            if (horas[i] === end) {
              end = horas[i] + 1;
            } else {
              slots.push({
                sedeCanchaId: canchaId,
                diaSemana: parseInt(dia),
                horaInicio: `${String(start).padStart(2, '0')}:00`,
                horaFin: `${String(end).padStart(2, '0')}:00`,
              });
              start = horas[i];
              end = horas[i] + 1;
            }
          }
          slots.push({
            sedeCanchaId: canchaId,
            diaSemana: parseInt(dia),
            horaInicio: `${String(start).padStart(2, '0')}:00`,
            horaFin: `${String(end).padStart(2, '0')}:00`,
          });
        });
      });

      await alquileresService.configurarDisponibilidad(sedeId, slots);
      toast.success('Disponibilidad guardada');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (canchas.length === 0) {
    return <div className="text-center py-12 text-dark-muted text-sm">No hay canchas configuradas en esta sede.</div>;
  }

  const currentCells = activeCells[selectedCancha] || new Set<CellKey>();

  return (
    <div>
      {/* Cancha selector */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 flex-wrap flex-1">
          {canchas.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCancha(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCancha === c.id
                  ? 'bg-primary text-white'
                  : 'bg-dark-card border border-dark-border text-dark-muted hover:text-dark-text'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </button>
      </div>

      <p className="text-xs text-dark-muted mb-3">Hacé click y arrastrá para pintar/borrar horas disponibles</p>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid select-none" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
          {/* Header */}
          <div className="h-8" />
          {DIAS.map((d, i) => (
            <div key={i} className="h-8 flex items-center justify-center text-xs font-medium text-dark-muted min-w-[80px]">
              {d}
            </div>
          ))}

          {/* Grid rows */}
          {HORAS.map((hora) => (
            <>
              <div key={`label-${hora}`} className="h-8 flex items-center justify-end pr-2 text-xs text-dark-muted">
                {hora}
              </div>
              {DIAS.map((_, dia) => {
                const key = cellKey(dia, hora);
                const isActive = currentCells.has(key);
                return (
                  <div
                    key={`${dia}-${hora}`}
                    onMouseDown={() => handleMouseDown(dia, hora)}
                    onMouseEnter={() => handleMouseEnter(dia, hora)}
                    className={`h-8 border border-dark-border/30 cursor-pointer transition-colors ${
                      isActive ? 'bg-green-500/30' : 'bg-dark-card hover:bg-dark-hover'
                    }`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
