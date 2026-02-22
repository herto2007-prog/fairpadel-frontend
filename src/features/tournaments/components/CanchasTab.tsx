import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, Button, Loading, Badge } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';
import { sedesService } from '@/services';
import type { Tournament, Sede, SedeCancha, TorneoCancha, TournamentCategory } from '@/types';
import { CanchasCalendarGrid } from './CanchasCalendarGrid';
import {
  MapPin,
  Clock,
  Save,
  Plus,
  ChevronRight,
  Check,
  X,
  CircleDot,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Calendar,
  CheckCheck,
  Star,
} from 'lucide-react';

// ─── Stats type (matches ManageTournamentPage) ─────────────────────
interface TournamentStats {
  inscripcionesTotal: number;
  partidosTotal: number;
  canchasConfiguradas: number;
  categorias: (TournamentCategory & { inscripcionesCount: number })[];
}

// ─── Types ─────────────────────────────────────────────────────────
type CanchasStep = 'sedes' | 'canchas' | 'calendario';

// ─── Conversion helpers ────────────────────────────────────────────
function horariosToSlotSet(
  horarios: { fecha: string; horaInicio: string; horaFin: string }[],
  slotMinutes: 30 | 60,
): Set<string> {
  const slots = new Set<string>();
  for (const h of horarios) {
    const fecha = h.fecha.split('T')[0];
    const [startH, startM] = h.horaInicio.split(':').map(Number);
    const [endH, endM] = h.horaFin.split(':').map(Number);
    let cur = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (cur < end) {
      const hh = String(Math.floor(cur / 60)).padStart(2, '0');
      const mm = String(cur % 60).padStart(2, '0');
      slots.add(`${fecha}|${hh}:${mm}`);
      cur += slotMinutes;
    }
  }
  return slots;
}

function slotSetToHorarios(
  slots: Set<string>,
  slotMinutes: 30 | 60,
): { fecha: string; horaInicio: string; horaFin: string }[] {
  const byDate = new Map<string, string[]>();
  for (const slot of slots) {
    const [fecha, time] = slot.split('|');
    if (!byDate.has(fecha)) byDate.set(fecha, []);
    byDate.get(fecha)!.push(time);
  }
  const horarios: { fecha: string; horaInicio: string; horaFin: string }[] = [];
  for (const [fecha, times] of byDate) {
    times.sort();
    let rangeStart = times[0];
    let prev = timeToMin(times[0]);
    for (let i = 1; i < times.length; i++) {
      const cur = timeToMin(times[i]);
      if (cur !== prev + slotMinutes) {
        horarios.push({ fecha, horaInicio: rangeStart, horaFin: minToTime(prev + slotMinutes) });
        rangeStart = times[i];
      }
      prev = cur;
    }
    horarios.push({ fecha, horaInicio: rangeStart, horaFin: minToTime(prev + slotMinutes) });
  }
  return horarios;
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minToTime(mins: number): string {
  // Cap at 23:59 to avoid "24:00" which is invalid HH:MM
  if (mins >= 1440) return '23:59';
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

// ─── Component ─────────────────────────────────────────────────────
export function CanchasTab({ tournament, stats, onSaved }: { tournament: Tournament; stats?: TournamentStats | null; onSaved?: () => void }) {
  // Data state
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [allSedes, setAllSedes] = useState<Sede[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddSede, setShowAddSede] = useState(false);
  const [addingSedeId, setAddingSedeId] = useState('');
  const [minutosPorPartido, setMinutosPorPartido] = useState<number>(
    (tournament as any).minutosPorPartido || 60,
  );
  const [savingMinutos, setSavingMinutos] = useState(false);
  const [slotMinutes, setSlotMinutes] = useState<30 | 60>(60);

  // Navigation state
  const [step, setStep] = useState<CanchasStep>('sedes');
  const [selectedSedeId, setSelectedSedeId] = useState<string | null>(null);
  const [selectedCanchaId, setSelectedCanchaId] = useState<string | null>(null);

  // Batch selection state
  const [batchCanchaIds, setBatchCanchaIds] = useState<string[]>([]);
  const [calendarMode, setCalendarMode] = useState<'single' | 'batch'>('single');

  // Cancha principal state (for finals scheduling)
  const [principalCanchaId, setPrincipalCanchaId] = useState<string | null>(null);

  // Derived
  const selectedSede = useMemo(() => sedes.find((s) => s.id === selectedSedeId), [sedes, selectedSedeId]);
  const selectedCancha = useMemo(() => {
    if (!selectedSede) return null;
    return (selectedSede.canchas || []).find((c: SedeCancha) => c.id === selectedCanchaId) || null;
  }, [selectedSede, selectedCanchaId]);

  // ── Load data ──────────────────────────────────────────────────
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data: any = await sedesService.getTorneoCanchas(tournament.id);
      const torneoCanchas: TorneoCancha[] = Array.isArray(data)
        ? data
        : data?.canchasConfiguradas || data?.torneoCanchas || [];
      setSelectedIds(torneoCanchas.map((tc) => tc.sedeCanchaId));

      // Load cancha principal
      const principalTc = torneoCanchas.find((tc) => tc.esPrincipal);
      setPrincipalCanchaId(principalTc?.sedeCanchaId || null);

      const horariosMap: Record<string, Set<string>> = {};
      torneoCanchas.forEach((tc) => {
        if (tc.horarios && tc.horarios.length > 0) {
          horariosMap[tc.sedeCanchaId] = horariosToSlotSet(
            tc.horarios.map((h) => ({
              fecha: h.fecha,
              horaInicio: h.horaInicio,
              horaFin: h.horaFin,
            })),
            slotMinutes,
          );
        }
      });
      setHorarios(horariosMap);

      const sedesData = await sedesService.getSedesDeTorneo(tournament.id).catch(() => []);
      if (sedesData.length === 0 && tournament.sedeId) {
        const sedePrincipal = await sedesService.getById(tournament.sedeId);
        setSedes([sedePrincipal]);
      } else {
        setSedes(sedesData);
      }

      const todasLasSedes = await sedesService.getAll({ activo: true });
      setAllSedes(todasLasSedes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-skip sedes step if only 1 sede
  useEffect(() => {
    if (!loading && sedes.length === 1 && step === 'sedes') {
      setSelectedSedeId(sedes[0].id);
      setStep('canchas');
    }
  }, [loading, sedes, step]);

  // ── Save handlers ──────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const canchas = selectedIds.map((sedeCanchaId) => ({
        sedeCanchaId,
        esPrincipal: sedeCanchaId === principalCanchaId,
        horarios: slotSetToHorarios(horarios[sedeCanchaId] || new Set(), slotMinutes),
      }));
      await sedesService.configurarTorneoCanchas(tournament.id, { canchas });
      setMessage('Configuración guardada exitosamente');
      // Return to canchas view after saving
      if (step === 'calendario') {
        setStep('canchas');
        setSelectedCanchaId(null);
        setCalendarMode('single');
      }
      await loadData();
      // Notify parent to reload stats (canchasConfiguradas count)
      onSaved?.();
    } catch (error: any) {
      console.error('Error saving:', error);
      setMessage(error?.response?.data?.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMinutos = async () => {
    setSavingMinutos(true);
    try {
      await tournamentsService.update(tournament.id, { minutosPorPartido } as any);
      setMessage('Minutos por partido actualizados');
    } catch {
      setMessage('Error al guardar minutos por partido');
    } finally {
      setSavingMinutos(false);
    }
  };

  const handleAddSede = async () => {
    if (!addingSedeId) return;
    setMessage('');
    try {
      await sedesService.agregarSedeATorneo(tournament.id, addingSedeId);
      setShowAddSede(false);
      setAddingSedeId('');
      setMessage('Sede agregada exitosamente');
      await loadData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error al agregar la sede');
    }
  };

  // ── Cancha click (toggle batch selection) ──────────────────────
  const handleCanchaClick = useCallback((canchaId: string) => {
    // Toggle batch selection
    setBatchCanchaIds((prev) =>
      prev.includes(canchaId) ? prev.filter((id) => id !== canchaId) : [...prev, canchaId],
    );
    // Also ensure cancha is in selectedIds (for save)
    if (!selectedIds.includes(canchaId)) {
      setSelectedIds((prev) => [...prev, canchaId]);
    }
  }, [selectedIds]);

  // ── Open calendar for single cancha ──────────────────────────
  const handleEditSingleCancha = useCallback((e: React.MouseEvent, canchaId: string) => {
    e.stopPropagation();
    if (!selectedIds.includes(canchaId)) {
      setSelectedIds((prev) => [...prev, canchaId]);
    }
    setSelectedCanchaId(canchaId);
    setCalendarMode('single');
    setStep('calendario');
  }, [selectedIds]);

  // ── Open calendar for batch ──────────────────────────────────
  const handleOpenBatchCalendar = useCallback(() => {
    if (batchCanchaIds.length === 0) return;
    setCalendarMode('batch');
    setSelectedCanchaId(null);
    setStep('calendario');
  }, [batchCanchaIds]);

  // ── Batch slots change ───────────────────────────────────────
  const handleBatchSlotsChange = useCallback((slots: Set<string>) => {
    setHorarios((prev) => {
      const next = { ...prev };
      for (const id of batchCanchaIds) {
        next[id] = new Set(slots);
      }
      return next;
    });
  }, [batchCanchaIds]);

  // ── Merged slots for batch view ──────────────────────────────
  const mergedBatchSlots = useMemo(() => {
    if (calendarMode !== 'batch' || batchCanchaIds.length === 0) return new Set<string>();
    const merged = new Set<string>();
    for (const id of batchCanchaIds) {
      const s = horarios[id];
      if (s) s.forEach((slot) => merged.add(slot));
    }
    return merged;
  }, [calendarMode, batchCanchaIds, horarios]);

  const handleDeselectCancha = useCallback((e: React.MouseEvent, canchaId: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => prev.filter((id) => id !== canchaId));
    setBatchCanchaIds((prev) => prev.filter((id) => id !== canchaId));
    // Clear principal if deselecting the principal cancha
    setPrincipalCanchaId((prev) => prev === canchaId ? null : prev);
    // Also remove its horarios
    setHorarios((prev) => {
      const next = { ...prev };
      delete next[canchaId];
      return next;
    });
  }, []);

  // ── Calendar slot change ───────────────────────────────────────
  const handleSlotsChange = useCallback((canchaId: string, slots: Set<string>) => {
    setHorarios((prev) => ({ ...prev, [canchaId]: slots }));
  }, []);

  // ── Capacity calculation (must be before early returns — hooks rule) ──
  const capacityCalc = useMemo(() => {
    if (!stats?.categorias || stats.categorias.length === 0) return null;

    // nextPowerOf2: bracket size for N parejas
    const nextPow2 = (n: number): number => {
      let p = 1;
      while (p < n) p <<= 1;
      return p;
    };

    // Exact match count for acomodación paraguaya:
    // R1 = n - bracket/2, R2 = bracket/2 - byes, Bracket = bracket/2 - 1
    // Combined: 2n - bracket/2 - 1 (for n >= 4)
    const calcMatches = (n: number): number => {
      if (n <= 1) return 0;
      if (n <= 3) return n - 1; // straight elimination for tiny brackets
      const bracket = nextPow2(n);
      return 2 * n - bracket / 2 - 1;
    };

    let totalParejas = 0;
    let totalMatches = 0;
    const catDetails: { nombre: string; parejas: number; partidos: number }[] = [];

    for (const cat of stats.categorias) {
      const n = cat.inscripcionesCount || 0;
      if (n < 2) continue;
      totalParejas += n;
      const matches = calcMatches(n);
      totalMatches += matches;
      catDetails.push({
        nombre: cat.category?.nombre || cat.nombre || '?',
        parejas: n,
        partidos: matches,
      });
    }

    if (totalMatches === 0) return null;

    // Court-hours needed:
    // Each match = 1 slot on 1 court. Add 20% overhead for:
    // - 2h30m rest rule gaps (some slots unusable due to pareja conflicts)
    // - Round sequencing (bracket rounds wait for previous results)
    const SCHEDULING_OVERHEAD = 1.20;
    const courtHoursNeeded = (totalMatches * minutosPorPartido / 60) * SCHEDULING_OVERHEAD;

    // Court-hours available (total across all configured courts)
    const totalAvailableSlots = Object.entries(horarios)
      .filter(([id]) => selectedIds.includes(id))
      .reduce((sum, [, set]) => sum + set.size, 0);
    const courtHoursAvailable = (totalAvailableSlots * slotMinutes) / 60;

    // Coverage: court-hours available vs needed
    const coverage = courtHoursAvailable > 0 && courtHoursNeeded > 0
      ? Math.min(100, Math.round((courtHoursAvailable / courtHoursNeeded) * 100))
      : 0;

    return {
      totalParejas,
      totalMatches,
      courtHoursNeeded: Math.round(courtHoursNeeded),
      courtHoursAvailable: Math.round(courtHoursAvailable),
      canchasConfiguradas: selectedIds.length,
      coverage,
      catDetails,
    };
  }, [stats, horarios, selectedIds, slotMinutes, minutosPorPartido]);

  // ── Render ─────────────────────────────────────────────────────
  if (loading) return <div className="flex justify-center py-12"><Loading size="lg" /></div>;

  if (!tournament.sedeId && sedes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MapPin className="w-12 h-12 text-light-secondary mx-auto mb-4" />
        <h3 className="text-lg font-bold text-light-text mb-2">Sin sede configurada</h3>
        <p className="text-light-secondary">Primero debes seleccionar una sede en la pestaña de edición para poder configurar canchas.</p>
      </Card>
    );
  }

  const sedeIdsVinculadas = sedes.map((s) => s.id);
  const sedesDisponiblesParaAgregar = allSedes.filter((s) => !sedeIdsVinculadas.includes(s.id));

  // Count total horario blocks across all canchas
  const totalBlocks = Object.values(horarios).reduce((sum, set) => sum + set.size, 0);

  return (
    <div className="space-y-4">
      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md text-sm ${message.includes('Error') ? 'bg-red-900/30 text-red-400 border border-red-500/50' : 'bg-green-900/30 text-green-400 border border-green-500/50'}`}>
          {message}
        </div>
      )}

      {/* Minutos por partido */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Duración estimada por partido
            </h3>
            <p className="text-sm text-light-secondary">Minutos promedio por partido (para calcular horarios)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMinutosPorPartido((p) => Math.max(15, p - 15))}
                className="w-8 h-8 rounded-full bg-dark-surface hover:bg-dark-hover flex items-center justify-center font-bold"
              >-</button>
              <span className="w-16 text-center font-bold text-lg">{minutosPorPartido} min</span>
              <button
                onClick={() => setMinutosPorPartido((p) => Math.min(180, p + 15))}
                className="w-8 h-8 rounded-full bg-dark-surface hover:bg-dark-hover flex items-center justify-center font-bold"
              >+</button>
            </div>
            <Button variant="primary" onClick={handleSaveMinutos} loading={savingMinutos}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Capacity indicator */}
      {capacityCalc && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              capacityCalc.coverage >= 100
                ? 'bg-green-500/20'
                : capacityCalc.coverage >= 60
                  ? 'bg-yellow-500/20'
                  : 'bg-red-500/20'
            }`}>
              {capacityCalc.coverage >= 100 ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className={`w-5 h-5 ${capacityCalc.coverage >= 60 ? 'text-yellow-400' : 'text-red-400'}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                Estimación de capacidad
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-light-secondary uppercase tracking-wide">Parejas</p>
                  <p className="text-lg font-bold text-light-text">{capacityCalc.totalParejas}</p>
                </div>
                <div>
                  <p className="text-[10px] text-light-secondary uppercase tracking-wide">Partidos est.</p>
                  <p className="text-lg font-bold text-light-text">{capacityCalc.totalMatches}</p>
                </div>
                <div>
                  <p className="text-[10px] text-light-secondary uppercase tracking-wide">Cancha-hrs nec.</p>
                  <p className="text-lg font-bold text-light-text">{capacityCalc.courtHoursNeeded}h</p>
                </div>
                <div>
                  <p className="text-[10px] text-light-secondary uppercase tracking-wide">Cancha-hrs disp.</p>
                  <p className={`text-lg font-bold ${capacityCalc.coverage >= 100 ? 'text-green-400' : capacityCalc.coverage >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {capacityCalc.courtHoursAvailable}h
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-light-secondary mt-1">
                Incluye +20% por descansos (2h30m) y secuencia de rondas
              </p>

              {/* Progress bar */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-light-secondary">
                    Cobertura: {capacityCalc.coverage}%
                  </span>
                  <span className="text-light-secondary">
                    {capacityCalc.canchasConfiguradas} cancha{capacityCalc.canchasConfiguradas !== 1 ? 's' : ''} configurada{capacityCalc.canchasConfiguradas !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="h-2 bg-dark-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      capacityCalc.coverage >= 100 ? 'bg-green-500' : capacityCalc.coverage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, capacityCalc.coverage)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Sedes del torneo + agregar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Sedes del Torneo</h3>
            <p className="text-sm text-light-secondary">{sedes.length} sede(s) vinculada(s)</p>
          </div>
          {sedesDisponiblesParaAgregar.length > 0 && (
            <button
              onClick={() => setShowAddSede(!showAddSede)}
              className="flex items-center gap-1 text-sm px-3 py-1.5 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" /> Agregar Sede
            </button>
          )}
        </div>
        {showAddSede && (
          <div className="mt-4 p-3 bg-dark-surface rounded-lg border border-dark-border flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-light-secondary mb-1">Seleccionar sede</label>
              <select
                value={addingSedeId}
                onChange={(e) => setAddingSedeId(e.target.value)}
                className="w-full text-sm border border-dark-border bg-dark-card rounded px-2 py-1.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">-- Seleccionar --</option>
                {sedesDisponiblesParaAgregar.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre} - {s.ciudad} ({s.canchas?.length || 0} canchas)</option>
                ))}
              </select>
            </div>
            <Button variant="primary" onClick={handleAddSede} disabled={!addingSedeId}>
              Agregar
            </Button>
          </div>
        )}
      </Card>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm px-1">
        <button
          onClick={() => { setStep('sedes'); setSelectedSedeId(null); setSelectedCanchaId(null); setBatchCanchaIds([]); setCalendarMode('single'); }}
          className={`hover:underline ${step === 'sedes' && !selectedSedeId ? 'text-primary-400 font-medium' : 'text-light-secondary'}`}
        >
          Sedes
        </button>
        {selectedSedeId && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-light-secondary/50" />
            <button
              onClick={() => { setStep('canchas'); setSelectedCanchaId(null); setCalendarMode('single'); }}
              className={`hover:underline ${step === 'canchas' ? 'text-primary-400 font-medium' : 'text-light-secondary'}`}
            >
              {selectedSede?.nombre || 'Sede'}
            </button>
          </>
        )}
        {step === 'calendario' && calendarMode === 'single' && selectedCanchaId && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-light-secondary/50" />
            <span className="text-primary-400 font-medium">{selectedCancha?.nombre || 'Cancha'}</span>
          </>
        )}
        {step === 'calendario' && calendarMode === 'batch' && batchCanchaIds.length > 0 && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-light-secondary/50" />
            <span className="text-primary-400 font-medium">{batchCanchaIds.length} canchas</span>
          </>
        )}
      </div>

      {/* ═══ Step: Sedes ═══ */}
      {step === 'sedes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sedes.map((sede) => {
            const canchasActivas = (sede.canchas || []).filter((c: SedeCancha) => c.activa);
            const canchasSeleccionadas = canchasActivas.filter((c: SedeCancha) => selectedIds.includes(c.id));
            return (
              <Card
                key={sede.id}
                className="p-5 cursor-pointer hover:border-primary-500/50 transition-all group"
                onClick={() => { setSelectedSedeId(sede.id); setStep('canchas'); }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    {sede.logoUrl ? (
                      <img src={sede.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <MapPin className="w-6 h-6 text-primary-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-light-text group-hover:text-primary-400 transition-colors truncate">{sede.nombre}</h4>
                    <p className="text-xs text-light-secondary truncate">{sede.direccion || sede.ciudad}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-light-secondary">
                        <CircleDot className="w-3 h-3 inline mr-1" />
                        {canchasActivas.length} cancha{canchasActivas.length !== 1 ? 's' : ''}
                      </span>
                      {canchasSeleccionadas.length > 0 && (
                        <Badge variant="default" className="text-[10px]">
                          {canchasSeleccionadas.length} configurada{canchasSeleccionadas.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-light-secondary/30 group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ Step: Canchas ═══ */}
      {step === 'canchas' && selectedSede && (
        <div className="space-y-3">
          {(() => {
            const canchasActivas = (selectedSede.canchas || []).filter((c: SedeCancha) => c.activa);
            if (canchasActivas.length === 0) {
              return (
                <Card className="p-8 text-center">
                  <CircleDot className="w-10 h-10 text-light-secondary mx-auto mb-3" />
                  <p className="text-light-secondary">No hay canchas activas en esta sede</p>
                </Card>
              );
            }
            const allBatchSelected = canchasActivas.every((c: SedeCancha) => batchCanchaIds.includes(c.id));
            return (
              <>
                {/* Select all / deselect all */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-light-secondary">
                    Click en las canchas para seleccionar, luego configurá horarios
                  </p>
                  <button
                    onClick={() => {
                      if (allBatchSelected) {
                        setBatchCanchaIds([]);
                      } else {
                        const allIds = canchasActivas.map((c: SedeCancha) => c.id);
                        setBatchCanchaIds(allIds);
                        // Also ensure all are in selectedIds
                        setSelectedIds((prev) => {
                          const set = new Set(prev);
                          allIds.forEach((id: string) => set.add(id));
                          return [...set];
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs text-light-secondary hover:text-light-text transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {allBatchSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>
                </div>

                {/* Canchas grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {canchasActivas.map((cancha: SedeCancha) => {
                    const isSelected = selectedIds.includes(cancha.id);
                    const isBatchSelected = batchCanchaIds.includes(cancha.id);
                    const canchaSlots = horarios[cancha.id];
                    const slotCount = canchaSlots ? canchaSlots.size : 0;
                    const hoursCount = (slotCount * slotMinutes) / 60;
                    return (
                      <div
                        key={cancha.id}
                        onClick={() => handleCanchaClick(cancha.id)}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all group ${
                          isBatchSelected
                            ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                            : isSelected
                              ? 'border-primary-500/40 bg-primary-500/5'
                              : 'border-dark-border hover:border-dark-hover bg-dark-card hover:bg-dark-surface'
                        }`}
                      >
                        {/* Top-right actions */}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          {/* Batch check */}
                          {isBatchSelected && (
                            <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {/* Principal court star */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrincipalCanchaId((prev) => prev === cancha.id ? null : cancha.id);
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              principalCanchaId === cancha.id
                                ? 'bg-yellow-500/30'
                                : 'bg-dark-surface hover:bg-yellow-500/20 opacity-0 group-hover:opacity-100'
                            }`}
                            title={principalCanchaId === cancha.id ? 'Quitar como cancha principal' : 'Marcar como cancha principal (para finales)'}
                          >
                            <Star className={`w-3.5 h-3.5 ${
                              principalCanchaId === cancha.id
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-yellow-400/60'
                            }`} />
                          </button>
                          {/* Individual edit button */}
                          <button
                            onClick={(e) => handleEditSingleCancha(e, cancha.id)}
                            className="w-6 h-6 rounded-full bg-dark-surface hover:bg-blue-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Editar horarios individualmente"
                          >
                            <Pencil className="w-3 h-3 text-blue-400" />
                          </button>
                          {/* Deselect from selectedIds */}
                          {isSelected && (
                            <button
                              onClick={(e) => handleDeselectCancha(e, cancha.id)}
                              className="w-5 h-5 rounded-full bg-dark-surface hover:bg-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Quitar cancha"
                            >
                              <X className="w-3 h-3 text-red-400" />
                            </button>
                          )}
                        </div>

                        <div className="text-center">
                          <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                            isBatchSelected ? 'bg-primary-500/30' : isSelected ? 'bg-primary-500/20' : 'bg-dark-surface'
                          }`}>
                            <CircleDot className={`w-5 h-5 ${isBatchSelected || isSelected ? 'text-primary-400' : 'text-light-secondary'}`} />
                          </div>
                          <h4 className={`font-bold text-sm ${isBatchSelected ? 'text-primary-400' : isSelected ? 'text-primary-400/70' : 'text-light-text'}`}>
                            {cancha.nombre}
                          </h4>
                          <Badge
                            variant={cancha.tipo === 'INDOOR' ? 'default' : cancha.tipo === 'OUTDOOR' ? 'secondary' : 'outline'}
                            className="text-[10px] mt-1"
                          >
                            {cancha.tipo === 'SEMI_TECHADA' ? 'Semi' : cancha.tipo}
                          </Badge>
                          {principalCanchaId === cancha.id && (
                            <p className="text-[10px] text-yellow-400 font-medium mt-1.5 flex items-center justify-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400" /> Principal
                            </p>
                          )}
                          {isSelected && slotCount > 0 && (
                            <p className="text-[10px] text-primary-400 mt-1.5">{hoursCount}h configuradas</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Batch action bar */}
                {batchCanchaIds.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                    <span className="text-sm font-medium text-primary-400">
                      {batchCanchaIds.length} cancha{batchCanchaIds.length !== 1 ? 's' : ''} seleccionada{batchCanchaIds.length !== 1 ? 's' : ''}
                    </span>
                    <Button variant="primary" onClick={handleOpenBatchCalendar}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Configurar horarios
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ═══ Step: Calendario ═══ */}
      {step === 'calendario' && (calendarMode === 'single' ? selectedCanchaId : batchCanchaIds.length > 0) && (
        <Card className="p-4">
          {/* Batch header */}
          {calendarMode === 'batch' && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-dark-border">
              <Badge variant="default" className="text-xs">
                {batchCanchaIds.length} canchas
              </Badge>
              <span className="text-sm text-light-secondary">
                Aplicando a: {batchCanchaIds.map((id) => {
                  for (const sede of sedes) {
                    const c = (sede.canchas || []).find((c: SedeCancha) => c.id === id);
                    if (c) return c.nombre;
                  }
                  return '?';
                }).join(', ')}
              </span>
            </div>
          )}
          <CanchasCalendarGrid
            fechaInicio={tournament.fechaInicio}
            fechaFin={tournament.fechaFin}
            selectedSlots={
              calendarMode === 'batch'
                ? mergedBatchSlots
                : (horarios[selectedCanchaId!] || new Set())
            }
            onSlotsChange={
              calendarMode === 'batch'
                ? handleBatchSlotsChange
                : (slots) => handleSlotsChange(selectedCanchaId!, slots)
            }
            slotMinutes={slotMinutes}
            onSlotMinutesChange={setSlotMinutes}
          />
        </Card>
      )}

      {/* Footer: summary + save */}
      <div className="flex items-center justify-between pt-2 border-t border-dark-border">
        <p className="text-sm text-light-secondary">
          <span className="font-medium text-light-text">{selectedIds.length}</span> cancha{selectedIds.length !== 1 ? 's' : ''} seleccionada{selectedIds.length !== 1 ? 's' : ''}
          {totalBlocks > 0 && (
            <span> · <span className="font-medium text-primary-400">{Math.round((totalBlocks * slotMinutes) / 60)}h</span> de horarios</span>
          )}
        </p>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4 mr-2" /> Guardar Configuración
        </Button>
      </div>
    </div>
  );
}
