import { useState, useEffect } from 'react';
import { Controller, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import {
  Settings,
  Users,
  Shuffle,
  Plus,
  Trash2,
  Info,
  LayoutGrid,
  Award,
} from 'lucide-react';
import { torneoService } from '../../../../services/torneoService';

// ─── Types ───
export type FormatoAmericano =
  | 'clasico'
  | 'parejasSinCat'
  | 'parejasConCat'
  | 'porCategorias'
  | 'sumas'
  | 'mixto';

export interface WizardStep2Data {
  numRondas: number | 'automatico';
  sistemaPuntos: 'games' | 'sets' | 'partido' | 'diferencia' | 'puntosFijos';
  formatoPartido: 'tiempo' | 'games' | 'mejorDe3Sets' | 'puntosFijos';
  valorObjetivo: number;
  conTieBreak: boolean;
  canchasSimultaneas: number;
  premiosTexto?: string;
  generosHabilitados: ('MASCULINO' | 'FEMENINO')[];
  categoriasHabilitadas: string[];
  combinacionesSumas: { categoriaA: string; categoriaB: string }[];
  combinacionesMixtas: { categoriaMujer: string; categoriaHombre: string }[];
}

interface Props {
  control: any;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  formatoAmericano: FormatoAmericano;
}

// ─── Constants ───
// Categorías se cargan dinámicamente desde el backend

const SISTEMAS_PUNTOS = [
  { value: 'games', label: 'Games acumulados', desc: 'Cada jugador suma los games ganados.' },
  { value: 'sets', label: 'Sets ganados', desc: 'Se cuenta cuántos sets ganó cada uno.' },
  { value: 'partido', label: 'Victorias', desc: '+3 por ganar, +1 por perder.' },
  { value: 'diferencia', label: 'Diferencia de games', desc: 'Games ganados - perdidos.' },
  { value: 'puntosFijos', label: 'Puntos fijos', desc: 'Partido a 16, 24 o 32 puntos totales.' },
];

const FORMATOS_PARTIDO = [
  { value: 'tiempo', label: 'Por tiempo', desc: 'Tiempo fijo (ej: 15 min).' },
  { value: 'games', label: 'Por games', desc: 'Primero en llegar a X games.' },
  { value: 'mejorDe3Sets', label: 'Mejor de 3 sets', desc: 'Formato tradicional.' },
  { value: 'puntosFijos', label: 'Puntos fijos', desc: 'Partido a puntaje fijo total.' },
];

// ─── Card wrapper ───
function Card({ title, icon, children, className = '' }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/[0.02] border border-[#232838] rounded-xl p-4 space-y-3 ${className}`}>
      <h4 className="text-white/70 text-xs font-medium flex items-center gap-2">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

// ─── Preview helpers ───
function getPreviewGrupos(
  formato: FormatoAmericano,
  generos: string[],
  categorias: string[],
  sumas: { categoriaA: string; categoriaB: string }[],
  mixtas: { categoriaMujer: string; categoriaHombre: string }[]
): { id: string; label: string; color: string }[] {
  switch (formato) {
    case 'clasico':
      return [];
    case 'parejasSinCat':
      return generos.map((g) => ({
        id: g,
        label: g === 'MASCULINO' ? 'Masculino' : 'Femenino',
        color: g === 'MASCULINO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      }));
    case 'parejasConCat': {
      const out: { id: string; label: string; color: string }[] = [];
      for (const g of generos) {
        for (const c of categorias) {
          out.push({
            id: `${g}-${c}`,
            label: `${g === 'MASCULINO' ? 'Masc.' : 'Fem.'} ${c}`,
            color: g === 'MASCULINO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20',
          });
        }
      }
      return out;
    }
    case 'porCategorias':
      return categorias.map((c) => ({
        id: c,
        label: c,
        color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      }));
    case 'sumas':
      return sumas.map((s, i) => {
        const sorted = [s.categoriaA, s.categoriaB].sort();
        return {
          id: `suma-${i}`,
          label: `${sorted[0]} + ${sorted[1]}`,
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
      });
    case 'mixto':
      return mixtas.map((m, i) => ({
        id: `mixto-${i}`,
        label: `F-${m.categoriaMujer} + M-${m.categoriaHombre}`,
        color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      }));
    default:
      return [];
  }
}

// ─── Main component ───
export function AmericanoConfigForm({ control, watch, setValue, errors, formatoAmericano }: Props) {
  const [categoriasSistema, setCategoriasSistema] = useState<Array<{ id: string; nombre: string }>>([]);

  useEffect(() => {
    torneoService.getCategories().then((cats: Array<{ id: string; nombre: string }>) => {
      setCategoriasSistema(cats);
    }).catch(() => {
      setCategoriasSistema([]);
    });
  }, []);

  const nombresCategorias = categoriasSistema.map((c) => c.nombre);
  const generos = (watch('generosHabilitados') as string[]) || [];
  const categorias = (watch('categoriasHabilitadas') as string[]) || [];
  const combinacionesSumas = (watch('combinacionesSumas') as WizardStep2Data['combinacionesSumas']) || [];
  const combinacionesMixtas = (watch('combinacionesMixtas') as WizardStep2Data['combinacionesMixtas']) || [];
  const formatoPartido = watch('formatoPartido') as string;

  const showGeneros = formatoAmericano === 'parejasSinCat' || formatoAmericano === 'parejasConCat' || formatoAmericano === 'porCategorias';
  const showCategorias = formatoAmericano === 'parejasConCat' || formatoAmericano === 'porCategorias';
  const showSumas = formatoAmericano === 'sumas';
  const showMixto = formatoAmericano === 'mixto';
  const showPreview = formatoAmericano !== 'clasico';

  const previewGrupos = getPreviewGrupos(formatoAmericano, generos, categorias, combinacionesSumas, combinacionesMixtas);

  const addSuma = () => {
    const current = (watch('combinacionesSumas') as WizardStep2Data['combinacionesSumas']) || [];
    const first = nombresCategorias[0] || '';
    setValue('combinacionesSumas', [...current, { categoriaA: first, categoriaB: first }]);
  };

  const removeSuma = (idx: number) => {
    const current = (watch('combinacionesSumas') as WizardStep2Data['combinacionesSumas']) || [];
    setValue('combinacionesSumas', current.filter((_, i) => i !== idx));
  };

  const updateSuma = (idx: number, field: 'categoriaA' | 'categoriaB', value: string) => {
    const current = [...((watch('combinacionesSumas') as WizardStep2Data['combinacionesSumas']) || [])];
    current[idx] = { ...current[idx], [field]: value };
    setValue('combinacionesSumas', current);
  };

  const addMixta = () => {
    const current = (watch('combinacionesMixtas') as WizardStep2Data['combinacionesMixtas']) || [];
    const first = nombresCategorias[0] || '';
    setValue('combinacionesMixtas', [...current, { categoriaMujer: first, categoriaHombre: first }]);
  };

  const removeMixta = (idx: number) => {
    const current = (watch('combinacionesMixtas') as WizardStep2Data['combinacionesMixtas']) || [];
    setValue('combinacionesMixtas', current.filter((_, i) => i !== idx));
  };

  const updateMixta = (idx: number, field: 'categoriaMujer' | 'categoriaHombre', value: string) => {
    const current = [...((watch('combinacionesMixtas') as WizardStep2Data['combinacionesMixtas']) || [])];
    current[idx] = { ...current[idx], [field]: value };
    setValue('combinacionesMixtas', current);
  };

  const valorObjetivoLabel =
    formatoPartido === 'tiempo'
      ? 'Minutos por partido'
      : formatoPartido === 'games'
      ? 'Games para ganar'
      : formatoPartido === 'puntosFijos'
      ? 'Puntos totales'
      : 'Sets para ganar';

  return (
    <div className="space-y-4">
      {/* ─── Configuración General ─── */}
      <Card title="Configuración General" icon={<Settings className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Sistema de puntos</label>
            <Controller
              name="sistemaPuntos"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors"
                >
                  {SISTEMAS_PUNTOS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              )}
            />
          </div>
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Formato de partido</label>
            <Controller
              name="formatoPartido"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors"
                >
                  {FORMATOS_PARTIDO.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">{valorObjetivoLabel}</label>
            <Controller
              name="valorObjetivo"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min={1}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors"
                />
              )}
            />
          </div>
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Rondas</label>
            <Controller
              name="numRondas"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value === 'automatico' ? 'automatico' : String(field.value)}
                  onChange={(e) => field.onChange(e.target.value === 'automatico' ? 'automatico' : parseInt(e.target.value))}
                  className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors"
                >
                  <option value="3">3 rondas</option>
                  <option value="4">4 rondas</option>
                  <option value="5">5 rondas</option>
                  <option value="6">6 rondas</option>
                  <option value="automatico">Automático</option>
                </select>
              )}
            />
          </div>
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Canchas</label>
            <Controller
              name="canchasSimultaneas"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min={1}
                  max={20}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-[#151921] border border-[#232838] rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors"
                />
              )}
            />
          </div>
        </div>

        <Controller
          name="conTieBreak"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-4 h-4 rounded border-[#232838] bg-[#151921] text-primary focus:ring-primary/20"
              />
              <div>
                <span className="text-white text-sm">Incluir tie-break</span>
                <p className="text-white/30 text-[10px]">Si un set llega a 6-6, se define a 7 puntos.</p>
              </div>
            </label>
          )}
        />

        <div>
          <label className="text-white/50 text-xs font-medium mb-1.5 block">Premios (opcional)</label>
          <Controller
            name="premiosTexto"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={2}
                placeholder="1°: Medalla + bebida&#10;2°: Medalla"
                className="w-full bg-white/[0.03] border border-[#232838] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-primary outline-none transition-colors resize-none"
              />
            )}
          />
        </div>
      </Card>

      {/* ─── Géneros ─── */}
      {showGeneros && (
        <Card title="Géneros Habilitados" icon={<Users className="w-3.5 h-3.5" />}>
          <Controller
            name="generosHabilitados"
            control={control}
            render={({ field }) => (
              <div className="flex gap-3">
                {['MASCULINO', 'FEMENINO'].map((g) => {
                  const checked = (field.value || []).includes(g);
                  return (
                    <label
                      key={g}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                        checked
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-white/[0.03] border-[#232838] text-white/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => {
                          const vals = new Set(field.value || []);
                          if (e.target.checked) vals.add(g);
                          else vals.delete(g);
                          field.onChange(Array.from(vals));
                        }}
                      />
                      <span className="text-sm">{g === 'MASCULINO' ? 'Masculino' : 'Femenino'}</span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.generosHabilitados && (
            <p className="text-red-400 text-xs">{errors.generosHabilitados.message as string}</p>
          )}
          <p className="text-white/30 text-[10px] flex items-center gap-1">
            <Info className="w-3 h-3" />
            Solo jugadores de estos géneros podrán inscribirse.
          </p>
        </Card>
      )}

      {/* ─── Categorías ─── */}
      {showCategorias && (
        <Card title="Categorías Habilitadas" icon={<Award className="w-3.5 h-3.5" />}>
          <Controller
            name="categoriasHabilitadas"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {nombresCategorias.map((c) => {
                  const checked = (field.value || []).includes(c);
                  return (
                    <label
                      key={c}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                        checked
                          ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                          : 'bg-white/[0.03] border-[#232838] text-white/40 hover:text-white/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => {
                          const vals = new Set(field.value || []);
                          if (e.target.checked) vals.add(c);
                          else vals.delete(c);
                          field.onChange(Array.from(vals));
                        }}
                      />
                      {c}
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.categoriasHabilitadas && (
            <p className="text-red-400 text-xs">{errors.categoriasHabilitadas.message as string}</p>
          )}
          <p className="text-white/30 text-[10px] flex items-center gap-1">
            <Info className="w-3 h-3" />
            {formatoAmericano === 'parejasConCat'
              ? 'Las parejas deben ser de la misma categoría. Se permiten categorías inferiores a las habilitadas.'
              : 'Se creará un grupo independiente por cada categoría habilitada.'}
          </p>
        </Card>
      )}

      {/* ─── Combinaciones Sumas ─── */}
      {showSumas && (
        <Card title="Combinaciones de Categorías" icon={<Shuffle className="w-3.5 h-3.5" />}>
          <div className="space-y-2">
            {combinacionesSumas.length === 0 && (
              <p className="text-white/30 text-xs">Sin combinaciones. Agregá al menos una.</p>
            )}
            {combinacionesSumas.map((comb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={comb.categoriaA}
                  onChange={(e) => updateSuma(idx, 'categoriaA', e.target.value)}
                  className="flex-1 bg-[#151921] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none transition-colors"
                >
                  {nombresCategorias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="text-white/30 text-sm">+</span>
                <select
                  value={comb.categoriaB}
                  onChange={(e) => updateSuma(idx, 'categoriaB', e.target.value)}
                  className="flex-1 bg-[#151921] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none transition-colors"
                >
                  {nombresCategorias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeSuma(idx)}
                  className="text-white/20 hover:text-red-400 transition-colors px-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.combinacionesSumas && (
            <p className="text-red-400 text-xs">{(errors.combinacionesSumas as any)?.message || 'Error en combinaciones'}</p>
          )}
          <button
            type="button"
            onClick={addSuma}
            className="flex items-center gap-1.5 text-primary text-xs font-medium hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar combinación
          </button>
          <p className="text-white/30 text-[10px] flex items-center gap-1">
            <Info className="w-3 h-3" />
            Cada combinación crea un grupo paralelo. Las parejas deben ser una de cada categoría.
          </p>
        </Card>
      )}

      {/* ─── Combinaciones Mixtas ─── */}
      {showMixto && (
        <Card title="Combinaciones Mixtas" icon={<Users className="w-3.5 h-3.5" />}>
          <div className="space-y-2">
            {combinacionesMixtas.length === 0 && (
              <p className="text-white/30 text-xs">Sin combinaciones. Agregá al menos una.</p>
            )}
            {combinacionesMixtas.map((comb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={comb.categoriaMujer}
                  onChange={(e) => updateMixta(idx, 'categoriaMujer', e.target.value)}
                  className="flex-1 bg-[#151921] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none transition-colors"
                >
                  {nombresCategorias.map((c) => (
                    <option key={c} value={c}>F-{c}</option>
                  ))}
                </select>
                <span className="text-white/30 text-sm">+</span>
                <select
                  value={comb.categoriaHombre}
                  onChange={(e) => updateMixta(idx, 'categoriaHombre', e.target.value)}
                  className="flex-1 bg-[#151921] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none transition-colors"
                >
                  {nombresCategorias.map((c) => (
                    <option key={c} value={c}>M-{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeMixta(idx)}
                  className="text-white/20 hover:text-red-400 transition-colors px-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.combinacionesMixtas && (
            <p className="text-red-400 text-xs">{(errors.combinacionesMixtas as any)?.message || 'Error en combinaciones'}</p>
          )}
          <button
            type="button"
            onClick={addMixta}
            className="flex items-center gap-1.5 text-primary text-xs font-medium hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar combinación
          </button>
          <p className="text-white/30 text-[10px] flex items-center gap-1">
            <Info className="w-3 h-3" />
            Cada fila crea un grupo paralelo. Las parejas serán 1 mujer + 1 hombre con estas categorías exactas.
          </p>
        </Card>
      )}

      {/* ─── Preview de Grupos ─── */}
      {showPreview && previewGrupos.length > 0 && (
        <Card title="Preview de Grupos" icon={<LayoutGrid className="w-3.5 h-3.5" />}>
          <p className="text-white/50 text-xs mb-2">
            Se crearán <strong className="text-white">{previewGrupos.length}</strong> grupo{previewGrupos.length > 1 ? 's' : ''}:
          </p>
          <div className="flex flex-wrap gap-2">
            {previewGrupos.map((g) => (
              <span
                key={g.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${g.color}`}
              >
                <LayoutGrid className="w-3 h-3" />
                {g.label}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
