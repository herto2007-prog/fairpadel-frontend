import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X, Save, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Zap,
} from 'lucide-react';
import {
  AmericanoRonda,
  AmericanoPartido,
  ModoJuegoConfig,
  americanoService,
} from '../../../../services/americanoService';
import { QuickScoreChips } from './QuickScore';

interface Props {
  torneoId: string;
  ronda: AmericanoRonda;
  modoJuego?: ModoJuegoConfig;
  onSaved: () => void;
  onCancel: () => void;
}

type PartidoForm = {
  parejaAId: string;
  parejaBId: string;
  sets: { gamesEquipoA: number; gamesEquipoB: number }[];
  puntosA: number;
  puntosB: number;
  estado: string;
  error?: string;
  guardando?: boolean;
  guardado?: boolean;
};

export function ResultadoBatchModal({ torneoId, ronda, modoJuego, onSaved, onCancel }: Props) {
  const formato = modoJuego?.formatoPartido ?? 'games';
  const valorObjetivo = modoJuego?.valorObjetivo ?? 6;
  const esPuntosFijos = formato === 'puntosFijos';
  const esMejorDe3 = formato === 'mejorDe3Sets';
  const esGames = formato === 'games';
  // const esTiempo = formato === 'tiempo';

  const defaultGamesA = esGames ? valorObjetivo : 6;
  const defaultGamesB = esGames ? Math.max(0, valorObjetivo - 2) : 4;

  const [guardandoTodos, setGuardandoTodos] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const initialForms = useMemo(() => {
    const map = new Map<string, PartidoForm>();
    for (const p of ronda.partidos) {
      const sets = p.sets && p.sets.length > 0
        ? p.sets.map(s => ({ gamesEquipoA: s.gamesEquipoA, gamesEquipoB: s.gamesEquipoB }))
        : esMejorDe3
          ? [{ gamesEquipoA: defaultGamesA, gamesEquipoB: defaultGamesB }]
          : [{ gamesEquipoA: defaultGamesA, gamesEquipoB: defaultGamesB }];

      // Para puntos fijos, extraer de sets si existen (backward compat)
      let puntosA = 8;
      let puntosB = 8;
      if (esPuntosFijos && p.sets && typeof p.sets === 'object' && !Array.isArray(p.sets)) {
        const anySets = p.sets as any;
        if ('puntosA' in anySets) puntosA = anySets.puntosA;
        if ('puntosB' in anySets) puntosB = anySets.puntosB;
      }

      map.set(p.id, {
        parejaAId: p.parejaA?.id ?? '',
        parejaBId: p.parejaB?.id ?? '',
        sets,
        puntosA,
        puntosB,
        estado: p.estado,
      });
    }
    return map;
  }, [ronda.partidos]);

  const [forms, setForms] = useState<Map<string, PartidoForm>>(initialForms);

  const partidos = ronda.partidos;

  const updateForm = (partidoId: string, updater: (prev: PartidoForm) => PartidoForm) => {
    setForms(prev => {
      const next = new Map(prev);
      const current = next.get(partidoId);
      if (current) next.set(partidoId, updater(current));
      return next;
    });
  };

  const addSet = (partidoId: string) => {
    updateForm(partidoId, prev => ({
      ...prev,
      sets: [...prev.sets, { gamesEquipoA: 0, gamesEquipoB: 0 }],
    }));
  };

  const removeSet = (partidoId: string, idx: number) => {
    updateForm(partidoId, prev => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== idx),
    }));
  };

  const updateSet = (partidoId: string, idx: number, field: 'gamesEquipoA' | 'gamesEquipoB', value: number) => {
    updateForm(partidoId, prev => {
      const newSets = [...prev.sets];
      newSets[idx] = { ...newSets[idx], [field]: value };
      return { ...prev, sets: newSets };
    });
  };

  const setsGanados = (sets: { gamesEquipoA: number; gamesEquipoB: number }[]) => {
    const a = sets.filter(s => s.gamesEquipoA > s.gamesEquipoB).length;
    const b = sets.filter(s => s.gamesEquipoB > s.gamesEquipoA).length;
    return { a, b };
  };

  const puedeAgregarSet = (form: PartidoForm) => {
    if (!esMejorDe3) return false;
    if (form.sets.length >= 3) return false;
    const sg = setsGanados(form.sets);
    return sg.a < 2 && sg.b < 2;
  };

  const validarForm = (form: PartidoForm): string | null => {
    if (esPuntosFijos) {
      if (form.puntosA + form.puntosB !== valorObjetivo) {
        return `La suma debe ser ${valorObjetivo}`;
      }
      return null;
    }
    for (const s of form.sets) {
      if (s.gamesEquipoA === s.gamesEquipoB) {
        return 'No puede haber sets empatados';
      }
    }
    if (esMejorDe3) {
      const sg = setsGanados(form.sets);
      if (sg.a < 2 && sg.b < 2) {
        return 'Debe haber un ganador (2 sets)';
      }
    }
    return null;
  };

  const handleGuardarTodos = async () => {
    setGlobalError('');
    setGuardandoTodos(true);

    // Validar todos primero
    let hayErrores = false;
    for (const [partidoId, form] of forms) {
      const err = validarForm(form);
      if (err) {
        updateForm(partidoId, prev => ({ ...prev, error: err }));
        hayErrores = true;
      } else {
        updateForm(partidoId, prev => ({ ...prev, error: undefined }));
      }
    }

    if (hayErrores) {
      setGlobalError('Corregí los errores marcados antes de guardar');
      setGuardandoTodos(false);
      return;
    }

    // Enviar uno por uno en paralelo
    const promesas = Array.from(forms.entries()).map(async ([partidoId, form]) => {
      if (!form.parejaAId || !form.parejaBId) return;
      updateForm(partidoId, prev => ({ ...prev, guardando: true, error: undefined }));
      try {
        await americanoService.registrarResultado(
          torneoId,
          ronda.id,
          form.parejaAId,
          form.parejaBId,
          esPuntosFijos ? undefined : form.sets,
          esPuntosFijos ? form.puntosA : undefined,
          esPuntosFijos ? form.puntosB : undefined,
        );
        updateForm(partidoId, prev => ({ ...prev, guardando: false, guardado: true }));
      } catch (err: any) {
        updateForm(partidoId, prev => ({
          ...prev,
          guardando: false,
          error: err.response?.data?.message || 'Error al guardar',
        }));
      }
    });

    await Promise.all(promesas);
    setGuardandoTodos(false);

    // Verificar si todos se guardaron
    const todosGuardados = Array.from(forms.values()).every(f => f.guardado);
    if (todosGuardados) {
      onSaved();
    }
  };

  const jugadoresLabel = (p: AmericanoPartido, side: 'A' | 'B') => {
    const pareja = side === 'A' ? p.parejaA : p.parejaB;
    if (!pareja) return '—';
    const j1 = pareja.jugador1?.nombre ?? '?';
    const j2 = pareja.jugador2?.nombre ?? '?';
    return `${j1} + ${j2}`;
  };

  const partidosConForm = partidos.map(p => ({ partido: p, form: forms.get(p.id)! }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#232838] shrink-0">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-white font-bold">Carga rápida de resultados</h3>
              <p className="text-white/40 text-xs">
                Ronda {ronda.numero} — {partidos.length} partidos
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {globalError && (
            <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {globalError}
            </div>
          )}

          <div className="space-y-3">
            {partidosConForm.map(({ partido, form }) => (
              <div
                key={partido.id}
                className={`rounded-xl border p-4 transition-colors ${
                  form.error ? 'border-red-500/30 bg-red-500/5' :
                  form.guardado ? 'border-green-500/20 bg-green-500/5' :
                  'border-[#232838] bg-white/[0.02]'
                }`}
              >
                {/* Cabecera: cancha + estado */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/40 text-[10px] font-medium bg-white/5 px-2 py-1 rounded">
                    Cancha {partido.cancha}
                  </span>
                  <div className="shrink-0 flex items-center">
                    {form.guardando ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : form.guardado ? (
                      <span className="flex items-center gap-1 text-green-400 text-[10px]"><CheckCircle2 className="w-4 h-4" /> Guardado</span>
                    ) : form.error ? (
                      <span title={form.error}><AlertCircle className="w-4 h-4 text-red-400" /></span>
                    ) : partido.estado === 'FINALIZADO' ? (
                      <span className="text-[10px] text-green-400/60">Cargado · editar</span>
                    ) : (
                      <span className="text-[10px] text-white/20">Sin cargar</span>
                    )}
                  </div>
                </div>

                {/* Equipos + marcador */}
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                  <p className="text-white text-sm font-medium text-right truncate">{jugadoresLabel(partido, 'A')}</p>

                  <div className="shrink-0">
                    {esPuntosFijos ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={form.puntosA}
                          onChange={e => updateForm(partido.id, prev => ({ ...prev, puntosA: parseInt(e.target.value) || 0 }))}
                          className="w-12 bg-white/[0.05] border border-[#232838] rounded-lg px-1 py-1.5 text-white text-sm text-center focus:border-primary outline-none"
                        />
                        <span className="text-white/30">-</span>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={form.puntosB}
                          onChange={e => updateForm(partido.id, prev => ({ ...prev, puntosB: parseInt(e.target.value) || 0 }))}
                          className="w-12 bg-white/[0.05] border border-[#232838] rounded-lg px-1 py-1.5 text-white text-sm text-center focus:border-primary outline-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {form.sets.map((set, idx) => (
                          <div key={idx} className="flex items-center justify-center gap-1.5">
                            {esMejorDe3 && (
                              <span className="text-white/30 text-[10px] w-9 text-right shrink-0">Set {idx + 1}</span>
                            )}
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={set.gamesEquipoA}
                              onChange={e => updateSet(partido.id, idx, 'gamesEquipoA', parseInt(e.target.value) || 0)}
                              className="w-12 bg-white/[0.05] border border-[#232838] rounded-lg px-1 py-1.5 text-white text-sm text-center focus:border-primary outline-none"
                            />
                            <span className="text-white/30">-</span>
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={set.gamesEquipoB}
                              onChange={e => updateSet(partido.id, idx, 'gamesEquipoB', parseInt(e.target.value) || 0)}
                              className="w-12 bg-white/[0.05] border border-[#232838] rounded-lg px-1 py-1.5 text-white text-sm text-center focus:border-primary outline-none"
                            />
                            {esMejorDe3 && form.sets.length > 1 && (
                              <button
                                onClick={() => removeSet(partido.id, idx)}
                                className="text-white/20 hover:text-red-400 transition-colors shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {esMejorDe3 && puedeAgregarSet(form) && (
                          <button
                            onClick={() => addSet(partido.id)}
                            className="flex items-center gap-1 text-primary text-xs hover:text-primary/80 transition-colors mt-1 mx-auto"
                          >
                            <Plus className="w-3 h-3" /> Agregar set
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-white text-sm font-medium truncate">{jugadoresLabel(partido, 'B')}</p>
                </div>

                {esGames && !form.guardado && (
                  <div className="mt-3 pt-3 border-t border-[#232838]/60">
                    <QuickScoreChips
                      objetivo={valorObjetivo}
                      conTieBreak={modoJuego?.conTieBreak}
                      labelA={jugadoresLabel(partido, 'A')}
                      labelB={jugadoresLabel(partido, 'B')}
                      current={{ a: form.sets[0]?.gamesEquipoA, b: form.sets[0]?.gamesEquipoB }}
                      onPick={(a, b) =>
                        updateForm(partido.id, prev => ({
                          ...prev,
                          sets: [{ gamesEquipoA: a, gamesEquipoB: b }],
                          error: undefined,
                        }))
                      }
                      compact
                    />
                  </div>
                )}

                {form.error && (
                  <p className="text-red-400 text-xs mt-2 text-center">{form.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[#232838] shrink-0">
          <div className="text-white/40 text-xs">
            {Array.from(forms.values()).filter(f => f.guardado).length} de {forms.size} guardados
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-white/60 text-sm hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarTodos}
              disabled={guardandoTodos}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {guardandoTodos ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar todos
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
