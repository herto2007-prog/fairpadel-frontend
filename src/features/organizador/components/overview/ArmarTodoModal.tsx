import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Sparkles, Clock, CalendarDays, Trophy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../../../services/api';
import { canchasSorteoService } from '../../services/canchasSorteoService';
import { useToast } from '../../../../components/ui/ToastProvider';
import { formatDatePY } from '../../../../utils/date';
import { horarioPorTipoDia } from '../../utils/horarioDia';

interface Props {
  tournamentId: string;
  fechaInicio: string;
  fechaFin: string;
  onClose: () => void;
  onDone: () => void;
}

interface Cat { id: string; nombre: string; parejas: number; minimoParejas: number; fixtureVersionId: string | null; estado: string; }

const SORTEADOS = ['CERRADA', 'INSCRIPCIONES_CERRADAS', 'FIXTURE_BORRADOR', 'SORTEO_REALIZADO', 'EN_CURSO'];

function fechasEntre(inicio: string, fin: string): string[] {
  if (!inicio || !fin) return [];
  const [y0, m0, d0] = inicio.split('-').map(Number);
  const [y1, m1, d1] = fin.split('-').map(Number);
  const out: string[] = [];
  let cur = Date.UTC(y0, m0 - 1, d0);
  const end = Date.UTC(y1, m1 - 1, d1);
  let guard = 0;
  while (cur <= end && guard++ < 60) {
    const dt = new Date(cur);
    out.push(`${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`);
    cur += 86400000;
  }
  return out;
}
const aMin = (h: string) => { const [a, b] = (h || '0:0').split(':').map(Number); return (a || 0) * 60 + (b || 0); };

export function ArmarTodoModal({ tournamentId, fechaInicio, fechaFin, onClose, onDone }: Props) {
  const { showError } = useToast();
  const [cargando, setCargando] = useState(true);
  const [canchas, setCanchas] = useState<{ id: string }[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [diasConfig, setDiasConfig] = useState<Set<string>>(new Set());
  const [necesarios, setNecesarios] = useState<number | null>(null);

  const minutosSlot = 70; // default del backend (no se envía; sirve para estimar capacidad)
  const [diasSel, setDiasSel] = useState<Set<string>>(new Set());

  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<{ categorias: number; aviso?: string } | null>(null);

  const fechas = useMemo(() => fechasEntre(fechaInicio, fechaFin), [fechaInicio, fechaFin]);
  const elegibles = useMemo(
    () => cats.filter((c) => c.parejas >= c.minimoParejas && !c.fixtureVersionId && !SORTEADOS.includes(c.estado)),
    [cats],
  );
  // Para dar el mensaje correcto cuando no hay elegibles: distinguir "ya sorteada"
  // de "le faltan parejas".
  const yaSorteadas = useMemo(() => cats.filter((c) => !!c.fixtureVersionId || SORTEADOS.includes(c.estado)), [cats]);
  const bajoMinimo = useMemo(
    () => cats.filter((c) => !c.fixtureVersionId && !SORTEADOS.includes(c.estado) && c.parejas < c.minimoParejas),
    [cats],
  );

  useEffect(() => {
    (async () => {
      try {
        const [canchasRes, catsRes, confRes] = await Promise.all([
          api.get(`/admin/canchas-sorteo/${tournamentId}/canchas`).catch(() => ({ data: { canchas: [] } })),
          api.get(`/admin/torneos/${tournamentId}/categorias`).catch(() => ({ data: { categorias: [] } })),
          api.get(`/admin/canchas-sorteo/${tournamentId}/configuracion`).catch(() => ({ data: { data: { dias: [] } } })),
        ]);
        setCanchas(canchasRes.data.canchas || []);
        const cs: Cat[] = catsRes.data.categorias || [];
        setCats(cs);
        setDiasConfig(new Set((confRes.data?.data?.dias || []).map((d: any) => d.fecha)));
        setDiasSel(new Set(fechasEntre(fechaInicio, fechaFin)));
        const ids = cs.filter((c) => c.parejas >= c.minimoParejas && !c.fixtureVersionId && !SORTEADOS.includes(c.estado)).map((c) => c.id);
        if (ids.length > 0) {
          const cap = await canchasSorteoService.calcularSlotsNecesarios(tournamentId, ids).catch(() => null as any);
          const n = cap?.totalSlotsNecesarios ?? cap?.slotsNecesarios ?? cap?.totalPartidos ?? null;
          setNecesarios(typeof n === 'number' ? n : null);
        }
      } finally {
        setCargando(false);
      }
    })();
  }, [tournamentId, fechaInicio, fechaFin]);

  // Cada día genera según su horario típico (semana 18–23, finde 14–23).
  // Igual que el motor: cuenta todo partido que EMPIEZA antes de la hora tope,
  // aunque termine después (la hora fin es tope para empezar, no para terminar)
  // → redondeo hacia arriba, no hacia abajo.
  const generables = [...diasSel].reduce((acc, f) => {
    const h = horarioPorTipoDia(f);
    const minutos = aMin(h.horaFin) - aMin(h.horaInicio);
    const slots = Math.max(0, Math.ceil(minutos / (minutosSlot || 1))) * canchas.length;
    return acc + slots;
  }, 0);
  const alcanza = necesarios == null || generables >= necesarios;

  const toggleDia = (f: string) => setDiasSel((prev) => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });

  const armar = async () => {
    if (canchas.length === 0) { showError('Sin canchas', 'Asigná una sede primero (en Completar datos).'); return; }
    if (elegibles.length === 0) { showError('Nada para sortear', 'Ninguna categoría llegó al mínimo de parejas.'); return; }
    if (diasSel.size === 0) { showError('Sin días', 'Elegí al menos un día.'); return; }

    setProcesando(true);
    try {
      // 1. Crear los días seleccionados que falten configurar, cada uno con su
      //    horario típico (semana 18–23, finde 14–23).
      const aCrear = [...diasSel].filter((f) => !diasConfig.has(f)).sort();
      for (const fecha of aCrear) {
        const h = horarioPorTipoDia(fecha);
        await canchasSorteoService.configurarDiaJuego({
          tournamentId, fecha, horaInicio: h.horaInicio, horaFin: h.horaFin, canchasIds: canchas.map((c) => c.id),
        });
      }
      // 2. Cerrar inscripciones y sortear las categorías elegibles.
      const r = await canchasSorteoService.cerrarInscripcionesYsortear({
        tournamentId, categoriasIds: elegibles.map((c) => c.id),
      });
      setResultado({
        categorias: r.categoriasSorteadas?.length ?? 0,
        aviso: r.sinProgramar?.total ? (r.sinProgramar.mensaje || 'Faltaron franjas para algunos partidos.') : undefined,
      });
      onDone();
    } catch (err: any) {
      showError('No se pudo armar', err.response?.data?.message || 'Error armando el cuadro');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#232838] sticky top-0 bg-[#151921]">
          <h3 className="text-white font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#df2531]" /> Armar cuadro y agenda</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {cargando ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#df2531]" /></div>
        ) : resultado ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-white font-bold text-lg">¡Cuadro armado!</p>
            <p className="text-gray-400 text-sm">Se sortearon {resultado.categorias} categoría(s) y se acomodó la agenda.</p>
            {resultado.aviso && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-300 text-sm flex gap-2 text-left">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /><span>{resultado.aviso} Podés sumar más días/horas en la pestaña Cuadro.</span>
              </div>
            )}
            <button onClick={onClose} className="mt-2 px-5 py-2 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-lg text-sm font-medium">Listo</button>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <p className="text-gray-400 text-sm">Con tu sede y tus inscriptos, armamos los días, las franjas y sorteamos el cuadro. Revisá los defaults y dale.</p>

            {elegibles.length === 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-300 text-sm">
                {yaSorteadas.length > 0
                  ? bajoMinimo.length > 0
                    ? 'Ya armaste algunas categorías; el resto todavía no llegó al mínimo de parejas para sortear.'
                    : 'Ya armaste el cuadro de estas categorías. Para verlo o publicarlo, andá a la pestaña Cuadro.'
                  : 'Todavía ninguna categoría llegó al mínimo de parejas para sortear.'}
              </div>
            ) : (
              <>
                {/* Horario por tipo de día (no un horario único para todos) */}
                <div className="bg-[#0B0E14] border border-white/10 rounded-lg p-3 text-xs text-gray-400 flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-[#df2531] shrink-0" />
                  <span>Cada día usa su horario típico: <span className="text-white">semana 18–23</span>, <span className="text-white">finde 14–23</span>. Lo afinás día por día en “Configurar y sortear”.</span>
                </div>

                {/* Días */}
                <div>
                  <label className="text-xs text-gray-400 flex items-center gap-1 mb-2"><CalendarDays className="w-3.5 h-3.5" /> Días de juego</label>
                  <div className="flex flex-wrap gap-2">
                    {fechas.map((f) => {
                      const on = diasSel.has(f);
                      return (
                        <button key={f} onClick={() => toggleDia(f)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${on ? 'bg-[#df2531] border-[#df2531] text-white' : 'bg-[#0B0E14] border-white/10 text-gray-400'}`}>
                          {formatDatePY(f)}{diasConfig.has(f) ? ' ✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Capacidad */}
                <div className={`rounded-lg p-3 text-sm border ${alcanza ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                  {necesarios != null
                    ? `Necesitás ~${necesarios} franjas. Con ${canchas.length} cancha(s), ese horario y ${diasSel.size} día(s) generás ~${generables}. ${alcanza ? 'Alcanza 👍' : 'Quedan partidos sin horario; sumá días/horas o sorteá igual.'}`
                    : `Vas a generar ~${generables} franjas con ${canchas.length} cancha(s) en ${diasSel.size} día(s).`}
                </div>

                <p className="text-xs text-gray-500">Se sortearán {elegibles.length} categoría(s) y se cerrarán sus inscripciones.</p>
              </>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
              <button onClick={armar} disabled={procesando || elegibles.length === 0}
                className="px-5 py-2 text-sm bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
                {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                {procesando ? 'Armando…' : 'Armar y sortear'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
