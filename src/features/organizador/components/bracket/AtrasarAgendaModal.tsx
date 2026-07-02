import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, CloudRain, CalendarDays, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../../../services/api';
import { programacionService } from '../../services/programacionService';
import { useToast } from '../../../../components/ui/ToastProvider';
import { formatDatePY } from '../../../../utils/date';

interface Props {
  tournamentId: string;
  onClose: () => void;
  onDone: () => void;
}

// Mismos estados terminales que el back (match-estados.ts): partido decidido = ancla.
const TERMINALES = ['FINALIZADO', 'WO', 'RETIRADO', 'DESCALIFICADO'];
const MONTOS = [30, 60, 90, 120];

interface PartidoDia {
  id: string;
  fase: string;
  categoria: { nombre: string };
  pareja1: string;
  pareja2: string;
  estado: string;
  programacion: { fecha: string; hora: string; cancha?: string } | null;
}

const aMin = (h: string) => { const [a, b] = (h || '0:0').split(':').map(Number); return (a || 0) * 60 + (b || 0); };
const aHora = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * "Atrasar día" (lluvia/demora): corre los partidos NO jugados de un día X
 * minutos más tarde, conservando cancha y orden. Los jugados son anclas.
 * Lo que no entra antes del cierre queda sin horario para reubicar a mano.
 */
export function AtrasarAgendaModal({ tournamentId, onClose, onDone }: Props) {
  const { showError } = useToast();
  const [cargando, setCargando] = useState(true);
  const [dias, setDias] = useState<string[]>([]);
  const [diaSel, setDiaSel] = useState('');
  const [minutos, setMinutos] = useState(60);
  const [custom, setCustom] = useState('');
  const [partidos, setPartidos] = useState<PartidoDia[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<{ movidos: number; sinHorario: number; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [confRes, partRes] = await Promise.all([
          api.get(`/admin/canchas-sorteo/${tournamentId}/configuracion`).catch(() => ({ data: { data: { dias: [] } } })),
          api.get(`/admin/auditoria/torneos/${tournamentId}/partidos`).catch(() => ({ data: { data: [] } })),
        ]);
        const ds: string[] = (confRes.data?.data?.dias || []).map((d: any) => d.fecha);
        const unicos = [...new Set(ds)].sort();
        setDias(unicos);
        setPartidos(partRes.data?.data || []);
        // Preseleccionar el primer día con partidos pendientes (el caso típico: hoy llovió)
        const conPendientes = unicos.find((f) =>
          (partRes.data?.data || []).some(
            (p: PartidoDia) => p.programacion?.fecha === f && p.programacion?.hora && !TERMINALES.includes(p.estado),
          ),
        );
        setDiaSel(conPendientes || unicos[0] || '');
      } finally {
        setCargando(false);
      }
    })();
  }, [tournamentId]);

  const minutosEfectivos = custom !== '' ? parseInt(custom) || 0 : minutos;

  const pendientesDelDia = useMemo(
    () =>
      partidos
        .filter((p) => p.programacion?.fecha === diaSel && p.programacion?.hora && !TERMINALES.includes(p.estado))
        .sort((a, b) => aMin(a.programacion!.hora) - aMin(b.programacion!.hora)),
    [partidos, diaSel],
  );
  const jugadosDelDia = useMemo(
    () => partidos.filter((p) => p.programacion?.fecha === diaSel && TERMINALES.includes(p.estado)).length,
    [partidos, diaSel],
  );

  const atrasar = async () => {
    if (!diaSel) { showError('Sin día', 'Elegí el día que se atrasó.'); return; }
    if (!minutosEfectivos || minutosEfectivos <= 0) { showError('Sin minutos', 'Indicá cuántos minutos se atrasó.'); return; }
    setProcesando(true);
    try {
      const r = await programacionService.atrasarAgenda(tournamentId, diaSel, minutosEfectivos);
      setResultado({ movidos: r.movidos, sinHorario: r.sinHorario, message: r.message });
      onDone();
    } catch (err: any) {
      showError('No se pudo atrasar', err.response?.data?.message || 'Error corriendo la agenda');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#232838] sticky top-0 bg-[#151921]">
          <h3 className="text-white font-bold flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-[#df2531]" /> Atrasar un día (lluvia/demora)
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {cargando ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#df2531]" /></div>
        ) : resultado ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-white font-bold text-lg">Agenda corrida</p>
            <p className="text-gray-400 text-sm">{resultado.message}</p>
            {resultado.sinHorario > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-300 text-sm flex gap-2 text-left">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{resultado.sinHorario} partido(s) no entraron antes del cierre del día y quedaron sin horario — reubicalos desde Auditoría o sumá horas al día.</span>
              </div>
            )}
            <button onClick={onClose} className="mt-2 px-5 py-2 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-lg text-sm font-medium">Listo</button>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <p className="text-gray-400 text-sm">
              Corre los partidos <span className="text-white">todavía no jugados</span> de un día, conservando cancha y orden. Los ya jugados no se tocan.
            </p>

            {/* Día */}
            <div>
              <label className="text-xs text-gray-400 flex items-center gap-1 mb-2"><CalendarDays className="w-3.5 h-3.5" /> ¿Qué día se atrasó?</label>
              <div className="flex flex-wrap gap-2">
                {dias.map((f) => (
                  <button key={f} onClick={() => setDiaSel(f)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${diaSel === f ? 'bg-[#df2531] border-[#df2531] text-white' : 'bg-[#0B0E14] border-white/10 text-gray-400'}`}>
                    {formatDatePY(f)}
                  </button>
                ))}
                {dias.length === 0 && <span className="text-xs text-gray-500">No hay días configurados.</span>}
              </div>
            </div>

            {/* Minutos */}
            <div>
              <label className="text-xs text-gray-400 flex items-center gap-1 mb-2"><Clock className="w-3.5 h-3.5" /> ¿Cuánto se atrasó?</label>
              <div className="flex flex-wrap items-center gap-2">
                {MONTOS.map((m) => (
                  <button key={m} onClick={() => { setMinutos(m); setCustom(''); }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${custom === '' && minutos === m ? 'bg-[#df2531] border-[#df2531] text-white' : 'bg-[#0B0E14] border-white/10 text-gray-400'}`}>
                    {m >= 60 ? `${m / 60}h${m % 60 ? ` ${m % 60}'` : ''}` : `${m}'`}
                  </button>
                ))}
                <input
                  type="number" min={1} max={720} placeholder="otro (min)"
                  value={custom} onChange={(e) => setCustom(e.target.value)}
                  className="w-24 px-2.5 py-1.5 rounded-lg text-xs bg-[#0B0E14] border border-white/10 text-white placeholder-gray-600 focus:border-[#df2531] outline-none"
                />
              </div>
            </div>

            {/* Vista previa */}
            {diaSel && (
              pendientesDelDia.length === 0 ? (
                <div className="bg-[#0B0E14] border border-white/10 rounded-lg p-3 text-xs text-gray-500">
                  Ese día no tiene partidos pendientes con horario{jugadosDelDia > 0 ? ` (${jugadosDelDia} ya jugados, no se tocan)` : ''}.
                </div>
              ) : (
                <div className="bg-[#0B0E14] border border-white/10 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs text-gray-400 mb-2">
                    {pendientesDelDia.length} partido(s) se corren{jugadosDelDia > 0 ? ` · ${jugadosDelDia} ya jugados quedan como están` : ''}:
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {pendientesDelDia.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 w-10">{p.programacion!.hora}</span>
                        <ArrowRight className="w-3 h-3 text-[#df2531] shrink-0" />
                        <span className="text-white w-10">{minutosEfectivos > 0 ? `≥${aHora(aMin(p.programacion!.hora) + minutosEfectivos)}` : '—'}</span>
                        <span className="text-gray-400 truncate">{p.categoria?.nombre} · {p.fase}{p.programacion?.cancha ? ` · ${p.programacion.cancha}` : ''}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-600 pt-1">
                    Cada partido va al primer lugar libre de su cancha desde esa hora. El que no entra antes del cierre queda sin horario.
                  </p>
                </div>
              )
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
              <button onClick={atrasar} disabled={procesando || !diaSel || pendientesDelDia.length === 0 || minutosEfectivos <= 0}
                className="px-5 py-2 text-sm bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
                {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudRain className="w-4 h-4" />}
                {procesando ? 'Corriendo…' : 'Atrasar agenda'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
