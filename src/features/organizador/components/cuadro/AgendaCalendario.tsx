import { Fragment, useEffect, useMemo, useState } from 'react';
import { Loader2, CalendarDays, Clock, CheckCircle2, AlertTriangle, RefreshCw, Hand } from 'lucide-react';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';
import { formatDatePY } from '../../../../utils/date';
import { faseLabel, parseFases } from '../../utils/horarioDia';

interface Props {
  tournamentId: string;
}

// Mismos estados terminales que el back (match-estados.ts): decidido = ancla.
const TERMINALES = ['FINALIZADO', 'WO', 'RETIRADO', 'DESCALIFICADO'];

// Colores por categoría (se asignan por orden de aparición)
const COLORES = ['#df2531', '#a78bfa', '#38bdf8', '#4ade80', '#fbbf24', '#f472b6', '#fb923c'];

interface SlotData {
  id: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  cancha: { id: string; nombre: string } | null;
  ocupadoPor: { partidoId: string; fase: string; categoria: string; pareja1: string; pareja2: string } | null;
}

interface DiaSlots {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  minutosSlot: number;
  fasesPermitidas: string | null;
  slots: SlotData[];
}

interface PartidoInfo {
  id: string;
  fase: string;
  estado: string;
  esBye: boolean;
  categoria: { id: string; nombre: string };
  pareja1: string;
  pareja2: string;
  programacion: { fecha: string; hora: string; cancha?: string } | null;
  resultado: { set1: string; set2: string | null; set3: string | null } | null;
}

/**
 * Calendario visual de la agenda (Fase 2 de horarios/canchas): grilla
 * canchas × franjas del día, con huecos a la vista. Los partidos pendientes
 * se arrastran a un hueco libre (cambiar-slot) o sobre otro pendiente para
 * intercambiar (intercambiar-slots) — el back valida descanso y dependencias.
 * Fallback sin drag: tocar un partido y después tocar el destino.
 */
export function AgendaCalendario({ tournamentId }: Props) {
  const { showSuccess, showError } = useToast();
  const [cargando, setCargando] = useState(true);
  const [dias, setDias] = useState<DiaSlots[]>([]);
  const [partidos, setPartidos] = useState<PartidoInfo[]>([]);
  const [diaSel, setDiaSel] = useState('');
  const [seleccionado, setSeleccionado] = useState<string | null>(null); // matchId elegido (drag o tap)
  const [procesando, setProcesando] = useState(false);

  const cargar = async () => {
    try {
      const [slotsRes, partRes] = await Promise.all([
        api.get(`/admin/auditoria/torneos/${tournamentId}/slots`),
        api.get(`/admin/auditoria/torneos/${tournamentId}/partidos`),
      ]);
      const ds: DiaSlots[] = slotsRes.data?.data || [];
      setDias(ds);
      setPartidos(partRes.data?.data || []);
      setDiaSel((prev) => (prev && ds.some((d) => d.fecha === prev) ? prev : ds[0]?.fecha || ''));
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo cargar la agenda');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [tournamentId]);

  const partidoById = useMemo(() => new Map(partidos.map((p) => [p.id, p])), [partidos]);

  // Color estable por categoría (orden de aparición en los partidos)
  const colorCategoria = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of partidos) {
      if (p.categoria && !m.has(p.categoria.nombre)) m.set(p.categoria.nombre, COLORES[m.size % COLORES.length]);
    }
    return m;
  }, [partidos]);

  const dia = dias.find((d) => d.fecha === diaSel);

  const canchas = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of dia?.slots || []) if (s.cancha) m.set(s.cancha.id, s.cancha.nombre);
    return [...m.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [dia]);

  const horas = useMemo(() => [...new Set((dia?.slots || []).map((s) => s.horaInicio))].sort(), [dia]);

  const slotEn = (canchaId: string, hora: string) =>
    dia?.slots.find((s) => s.cancha?.id === canchaId && s.horaInicio === hora);

  const sinHorario = useMemo(
    () => partidos.filter((p) => !p.esBye && !TERMINALES.includes(p.estado) && !p.programacion?.hora),
    [partidos],
  );

  // Partidos CON horario pero sin franja en la grilla (ej. el god-panel de
  // Auditoría les puso una hora a medida). Si no los mostramos, el calendario
  // los "pierde" — van en su propia lista, arrastrables a una franja.
  const partidosEnGrilla = useMemo(() => {
    const s = new Set<string>();
    for (const d of dias) for (const sl of d.slots) if (sl.ocupadoPor) s.add(sl.ocupadoPor.partidoId);
    return s;
  }, [dias]);
  const fueraDeGrilla = useMemo(
    () =>
      partidos.filter(
        (p) => !p.esBye && !TERMINALES.includes(p.estado) && p.programacion?.hora && !partidosEnGrilla.has(p.id),
      ),
    [partidos, partidosEnGrilla],
  );

  const esAncla = (matchId: string) => TERMINALES.includes(partidoById.get(matchId)?.estado || '');

  // ── Operaciones (el back valida; acá solo cableamos) ──
  const moverASlot = async (matchId: string, slotId: string) => {
    setProcesando(true);
    try {
      await api.put(`/admin/canchas-sorteo/${tournamentId}/partidos/${matchId}/cambiar-slot`, { nuevoSlotId: slotId });
      showSuccess('Movido', 'El partido cambió de franja.');
      await cargar();
    } catch (err: any) {
      showError('No se pudo mover', err.response?.data?.message || 'El horario elegido no es válido para este partido.');
    } finally {
      setProcesando(false);
      setSeleccionado(null);
    }
  };

  const intercambiar = async (matchId1: string, matchId2: string) => {
    if (matchId1 === matchId2) { setSeleccionado(null); return; }
    setProcesando(true);
    try {
      await api.put(`/admin/canchas-sorteo/${tournamentId}/intercambiar-slots`, { matchId1, matchId2 });
      showSuccess('Intercambiados', 'Los partidos cambiaron de lugar.');
      await cargar();
    } catch (err: any) {
      showError('No se pudo intercambiar', err.response?.data?.message || 'El intercambio no es válido.');
    } finally {
      setProcesando(false);
      setSeleccionado(null);
    }
  };

  const soltarEn = (destino: { slotId?: string; matchId?: string }) => {
    if (!seleccionado || procesando) return;
    if (destino.matchId) {
      if (esAncla(destino.matchId)) { showError('Partido jugado', 'Ese partido ya está decidido; no se puede intercambiar.'); setSeleccionado(null); return; }
      intercambiar(seleccionado, destino.matchId);
    } else if (destino.slotId) {
      moverASlot(seleccionado, destino.slotId);
    }
  };

  if (cargando) {
    return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#df2531]" /></div>;
  }

  if (dias.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 text-center">
        <CalendarDays className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Todavía no hay agenda</p>
        <p className="text-gray-500 text-sm">Configurá los días y sorteá en “Configurar y sortear”; acá vas a ver el calendario resultante.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado: días + recarga */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          {dias.map((d) => (
            <button key={d.fecha} onClick={() => { setDiaSel(d.fecha); setSeleccionado(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${diaSel === d.fecha ? 'bg-[#df2531] border-[#df2531] text-white' : 'bg-[#0B0E14] border-white/10 text-gray-400 hover:text-white'}`}>
              {formatDatePY(d.fecha)}
            </button>
          ))}
        </div>
        <button onClick={() => cargar()} disabled={procesando}
          className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50">
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      {dia && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {dia.horaInicio}–{dia.horaFin} · franjas de {dia.minutosSlot}' · fases:{' '}
            <span className="text-gray-300">{parseFases(dia.fasesPermitidas).map(faseLabel).join(', ') || 'todas'}</span>
          </span>
        </div>
      )}

      {/* Ayuda de interacción */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Hand className="w-3.5 h-3.5 text-[#df2531]" />
        <span>Arrastrá un partido a un hueco libre para moverlo, o sobre otro partido para intercambiarlos. También podés tocarlo y después tocar el destino.</span>
      </div>

      {/* Grilla canchas × franjas */}
      <div className="overflow-x-auto">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `52px repeat(${canchas.length}, minmax(150px, 1fr))`, minWidth: canchas.length * 160 + 60 }}>
          <div />
          {canchas.map((c) => (
            <div key={c.id} className="text-center text-xs text-gray-400 py-1">{c.nombre}</div>
          ))}

          {horas.map((hora) => (
            <Fragment key={hora}>
              <div className="text-[11px] text-gray-600 pt-2.5">{hora}</div>
              {canchas.map((c) => {
                const slot = slotEn(c.id, hora);
                if (!slot) return <div key={`${c.id}-${hora}`} />;
                const ocup = slot.ocupadoPor;
                const info = ocup ? partidoById.get(ocup.partidoId) : undefined;
                const jugado = info ? TERMINALES.includes(info.estado) : false;
                const color = ocup ? colorCategoria.get(ocup.categoria) || '#df2531' : undefined;
                const elegido = ocup && seleccionado === ocup.partidoId;

                if (!ocup) {
                  const esDestino = !!seleccionado;
                  return (
                    <div key={slot.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => soltarEn({ slotId: slot.id })}
                      onClick={() => esDestino && soltarEn({ slotId: slot.id })}
                      className={`rounded-lg border-[1.5px] border-dashed min-h-[64px] flex items-center justify-center text-[11px] transition-colors ${esDestino ? 'border-[#df2531]/70 bg-[#df2531]/5 text-[#f0999b] cursor-pointer' : 'border-white/10 text-gray-600'}`}>
                      {esDestino ? 'Soltar acá' : 'Libre'}
                    </div>
                  );
                }

                return (
                  <div key={slot.id}
                    draggable={!jugado && !procesando}
                    onDragStart={() => setSeleccionado(ocup.partidoId)}
                    onDragEnd={() => setSeleccionado((s) => (s === ocup.partidoId ? null : s))}
                    onDragOver={(e) => { if (seleccionado && seleccionado !== ocup.partidoId) e.preventDefault(); }}
                    onDrop={() => soltarEn({ matchId: ocup.partidoId })}
                    onClick={() => {
                      if (procesando) return;
                      if (seleccionado && seleccionado !== ocup.partidoId) { soltarEn({ matchId: ocup.partidoId }); return; }
                      if (!jugado) setSeleccionado(elegido ? null : ocup.partidoId);
                    }}
                    className={`rounded-r-lg rounded-l-none border bg-[#1c2230] px-2.5 py-2 min-h-[64px] transition-all ${jugado ? 'opacity-80' : 'cursor-grab active:cursor-grabbing hover:border-white/30'} ${elegido ? 'ring-2 ring-[#df2531] border-transparent' : 'border-white/10'}`}
                    style={{ borderLeft: `3px solid ${color}`, borderRadius: '0 8px 8px 0' }}>
                    <div className="text-[10.5px] mb-0.5 truncate" style={{ color }}>{ocup.categoria} · {faseLabel(ocup.fase)}</div>
                    <div className="text-[11.5px] text-gray-200 leading-snug truncate">{ocup.pareja1}</div>
                    <div className="text-[11.5px] text-gray-200 leading-snug truncate">vs {ocup.pareja2}</div>
                    {jugado && info?.resultado && (
                      <div className="text-[10.5px] text-emerald-400 mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {[info.resultado.set1, info.resultado.set2, info.resultado.set3].filter(Boolean).join(' ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Pie: leyenda + sin horario */}
      <div className="flex items-start justify-between gap-3 flex-wrap pt-3 border-t border-white/10">
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-gray-400">
          {[...colorCategoria.entries()].map(([nombre, color]) => (
            <span key={nombre} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />{nombre}
            </span>
          ))}
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />Jugado (anclado)</span>
        </div>

        <div className="flex flex-col gap-2 max-w-full">
          {sinHorario.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              <p className="text-amber-300 text-[11.5px] flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Sin horario ({sinHorario.length}) — arrastralos a un hueco libre:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sinHorario.map((p) => (
                  <button key={p.id}
                    draggable={!procesando}
                    onDragStart={() => setSeleccionado(p.id)}
                    onDragEnd={() => setSeleccionado((s) => (s === p.id ? null : s))}
                    onClick={() => !procesando && setSeleccionado(seleccionado === p.id ? null : p.id)}
                    className={`text-[11px] px-2 py-1 rounded-md border bg-[#0B0E14] transition-all cursor-grab ${seleccionado === p.id ? 'ring-2 ring-[#df2531] border-transparent text-white' : 'border-white/10 text-gray-300'}`}>
                    {p.categoria?.nombre} · {faseLabel(p.fase)} · {p.pareja1} vs {p.pareja2}
                  </button>
                ))}
              </div>
            </div>
          )}

          {fueraDeGrilla.length > 0 && (
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg px-3 py-2">
              <p className="text-sky-300 text-[11.5px] flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5" /> Con horario propio, fuera de la grilla ({fueraDeGrilla.length}) — arrastralos a una franja si querés que ocupen cancha:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {fueraDeGrilla.map((p) => (
                  <button key={p.id}
                    draggable={!procesando}
                    onDragStart={() => setSeleccionado(p.id)}
                    onDragEnd={() => setSeleccionado((s) => (s === p.id ? null : s))}
                    onClick={() => !procesando && setSeleccionado(seleccionado === p.id ? null : p.id)}
                    className={`text-[11px] px-2 py-1 rounded-md border bg-[#0B0E14] transition-all cursor-grab ${seleccionado === p.id ? 'ring-2 ring-[#df2531] border-transparent text-white' : 'border-white/10 text-gray-300'}`}>
                    {p.categoria?.nombre} · {faseLabel(p.fase)} · {p.pareja1} vs {p.pareja2} · {formatDatePY(p.programacion!.fecha)} {p.programacion!.hora}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {procesando && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#df2531]" /> Guardando…
        </div>
      )}
    </div>
  );
}
