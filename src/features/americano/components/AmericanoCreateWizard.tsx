import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller, Resolver, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  X,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  UsersRound,
  Award,
  BarChart3,
  Calculator,
  Heart,
  Trophy,
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  Settings,
  Shuffle,
  Clock,
  BarChart3 as BarChartIcon,
  Info,
  User,
} from 'lucide-react';
import { americanoService } from '../../../services/americanoService';
import { useToast } from '../../../components/ui/ToastProvider';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';
import { AmericanoConfigForm } from '../../organizador/components/americano/AmericanoConfigForm';

// ─── Types ───
export type FormatoAmericano =
  | 'clasico'
  | 'parejasSinCat'
  | 'parejasConCat'
  | 'porCategorias'
  | 'sumas'
  | 'mixto';

interface Props {
  onClose: () => void;
  onCreated: (torneo: { id: string; nombre: string }) => void;
}

// ─── Constants ───
const FORMATOS: {
  id: FormatoAmericano;
  nombre: string;
  desc: string;
  badge: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgColor: string;
}[] = [
  {
    id: 'clasico',
    nombre: 'Clásico',
    desc: 'Todos juegan con todos en un solo grupo. Las parejas rotan cada ronda.',
    badge: 'Individual',
    icon: Users,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'parejasSinCat',
    nombre: 'Parejas sin categoría',
    desc: 'Parejas fijas separadas por género (masculino / femenino).',
    badge: 'Parejas Fijas',
    icon: UsersRound,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'parejasConCat',
    nombre: 'Parejas con categoría',
    desc: 'Parejas fijas separadas por género y categoría de cada jugador.',
    badge: 'Parejas Fijas',
    icon: Award,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'porCategorias',
    nombre: 'Por categorías',
    desc: 'Individual separado por categoría. Las parejas rotan dentro de cada grupo.',
    badge: 'Individual',
    icon: BarChart3,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/10',
  },
  {
    id: 'sumas',
    nombre: 'Sumas',
    desc: 'Parejas fijas donde se suman las categorías de ambos jugadores para armar grupos.',
    badge: 'Parejas Fijas',
    icon: Calculator,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/10',
  },
  {
    id: 'mixto',
    nombre: 'Mixto',
    desc: 'Parejas mixtas (1M + 1F) separadas por combinación de categorías.',
    badge: 'Parejas Fijas',
    icon: Heart,
    color: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/10',
  },
];

// ─── Zod Schema ───
const baseSchema = z.object({
  formatoAmericano: z.enum([
    'clasico',
    'parejasSinCat',
    'parejasConCat',
    'porCategorias',
    'sumas',
    'mixto',
  ]),
  // Básicos
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(80, 'Máximo 80 caracteres'),
  descripcion: z.string().max(300, 'Máximo 300 caracteres').optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  ciudad: z.string().min(2, 'Ciudad requerida'),
  visibilidad: z.enum(['publico', 'privado']),
  limiteInscripciones: z
    .union([z.number().min(4, 'Mínimo 4'), z.literal('')])
    .optional(),
  // Paso 2
  rotacion: z.enum(['automatica', 'manual']),
  sistemaPuntos: z.enum(['games', 'sets', 'partido', 'diferencia', 'puntosFijos']),
  formatoPartido: z.enum(['tiempo', 'games', 'mejorDe3Sets', 'puntosFijos']),
  valorObjetivo: z.number().min(1, 'Requerido'),
  numRondas: z.union([z.number().min(1), z.literal('automatico')]),
  canchasSimultaneas: z.number().min(1).max(20),
  conTieBreak: z.boolean().default(true),
  premiosTexto: z.string().optional(),
  generosHabilitados: z.array(z.enum(['MASCULINO', 'FEMENINO'])).default([]),
  categoriasHabilitadas: z.array(z.string()).default([]),
  combinacionesSumas: z.array(z.object({ categoriaA: z.string(), categoriaB: z.string() })).default([]),
  combinacionesMixtas: z.array(z.object({ categoriaMujer: z.string(), categoriaHombre: z.string() })).default([]),
});

const schema = baseSchema
  .refine(
    (data) => {
      if (['parejasSinCat', 'parejasConCat', 'porCategorias'].includes(data.formatoAmericano)) {
        return data.generosHabilitados.length > 0;
      }
      return true;
    },
    { message: 'Seleccioná al menos un género', path: ['generosHabilitados'] }
  )
  .refine(
    (data) => {
      if (['parejasConCat', 'porCategorias'].includes(data.formatoAmericano)) {
        return data.categoriasHabilitadas.length > 0;
      }
      return true;
    },
    { message: 'Seleccioná al menos una categoría', path: ['categoriasHabilitadas'] }
  )
  .refine(
    (data) => {
      if (data.formatoAmericano === 'sumas') {
        return data.combinacionesSumas.length > 0;
      }
      return true;
    },
    { message: 'Agregá al menos una combinación', path: ['combinacionesSumas'] }
  )
  .refine(
    (data) => {
      if (data.formatoAmericano === 'mixto') {
        return data.combinacionesMixtas.length > 0;
      }
      return true;
    },
    { message: 'Agregá al menos una combinación', path: ['combinacionesMixtas'] }
  );

type WizardData = z.infer<typeof baseSchema>;

function getTipoInscripcionPorFormato(f: FormatoAmericano): 'individual' | 'parejasFijas' {
  return ['clasico', 'porCategorias'].includes(f) ? 'individual' : 'parejasFijas';
}

function getDefaultValues(): WizardData {
  return {
    formatoAmericano: 'clasico',
    nombre: '',
    descripcion: '',
    fecha: '',
    ciudad: '',
    visibilidad: 'publico',
    limiteInscripciones: '',
    rotacion: 'automatica',
    sistemaPuntos: 'games',
    formatoPartido: 'games',
    valorObjetivo: 6,
    numRondas: 4,
    canchasSimultaneas: 1,
    conTieBreak: true,
    premiosTexto: '',
    generosHabilitados: ['MASCULINO', 'FEMENINO'],
    categoriasHabilitadas: [],
    combinacionesSumas: [],
    combinacionesMixtas: [],
  };
}

// ─── Step validation fields ───
const STEP_REQUIRED: Record<number, (keyof WizardData)[]> = {
  1: ['formatoAmericano', 'nombre', 'fecha', 'ciudad'],
  2: ['sistemaPuntos', 'formatoPartido', 'valorObjetivo'],
  3: [],
};

// ─── Preview helpers ───
interface PreviewGrupo {
  id: string;
  nombre: string;
  icon: React.ElementType;
  color: string;
  desc: string;
}

function getPreviewGrupos(
  formato: FormatoAmericano,
  generos: string[],
  categorias: string[],
  sumas: { categoriaA: string; categoriaB: string }[] = [],
  mixtas: { categoriaMujer: string; categoriaHombre: string }[] = []
): PreviewGrupo[] {
  switch (formato) {
    case 'clasico':
      return [
        {
          id: 'unico',
          nombre: 'Grupo Único',
          icon: Users,
          color: 'blue',
          desc: 'Todos los jugadores juegan juntos, las parejas rotan en cada ronda.',
        },
      ];
    case 'parejasSinCat':
      return generos.length
        ? generos.map((g) => ({
            id: g,
            nombre: g === 'MASCULINO' ? 'Grupo Masculino' : 'Grupo Femenino',
            icon: g === 'MASCULINO' ? User : UsersRound,
            color: g === 'MASCULINO' ? 'blue' : 'pink',
            desc: `Parejas fijas ${g === 'MASCULINO' ? 'masculinas' : 'femeninas'}.`,
          }))
        : [
            {
              id: 'placeholder',
              nombre: 'Grupos por Género',
              icon: UsersRound,
              color: 'emerald',
              desc: 'Se crearán grupos masculino y/o femenino según las inscripciones.',
            },
          ];
    case 'parejasConCat': {
      if (generos.length && categorias.length) {
        const grupos: PreviewGrupo[] = [];
        for (const g of generos) {
          for (const c of categorias) {
            grupos.push({
              id: `${g}-${c}`,
              nombre: `${g === 'MASCULINO' ? 'Masc.' : 'Fem.'} — ${c}`,
              icon: Award,
              color: g === 'MASCULINO' ? 'blue' : 'pink',
              desc: `Parejas fijas de categoría ${c}.`,
            });
          }
        }
        return grupos;
      }
      return [
        {
          id: 'placeholder',
          nombre: 'Grupos por Género y Categoría',
          icon: Award,
          color: 'amber',
          desc: 'Se crearán grupos al inscribirse las primeras parejas.',
        },
      ];
    }
    case 'porCategorias':
      return categorias.length
        ? categorias.map((c) => ({
            id: c,
            nombre: `Categoría ${c}`,
            icon: BarChart3,
            color: 'violet',
            desc: 'Jugadores individuales que rotan parejas dentro del grupo.',
          }))
        : [
            {
              id: 'placeholder',
              nombre: 'Grupos por Categoría',
              icon: BarChart3,
              color: 'violet',
              desc: 'Se crearán grupos al inscribirse los primeros jugadores.',
            },
          ];
    case 'sumas':
      return sumas.length
        ? sumas.map((s, i) => {
            const sorted = [s.categoriaA, s.categoriaB].sort();
            return {
              id: `suma-${i}`,
              nombre: `${sorted[0]} + ${sorted[1]}`,
              icon: Calculator,
              color: 'rose',
              desc: 'Grupo de parejas con estas categorías.',
            };
          })
        : [
            {
              id: 'placeholder',
              nombre: 'Grupos por Suma',
              icon: Calculator,
              color: 'rose',
              desc: 'Agregá combinaciones para ver los grupos.',
            },
          ];
    case 'mixto':
      return mixtas.length
        ? mixtas.map((m, i) => ({
            id: `mixto-${i}`,
            nombre: `F-${m.categoriaMujer} + M-${m.categoriaHombre}`,
            icon: Heart,
            color: 'pink',
            desc: 'Grupo de parejas mixtas con estas categorías.',
          }))
        : [
            {
              id: 'placeholder',
              nombre: 'Grupos Mixtos',
              icon: Heart,
              color: 'pink',
              desc: 'Agregá combinaciones para ver los grupos.',
            },
          ];
    default:
      return [];
  }
}

// ─── Component ───
export function AmericanoCreateWizard({ onClose, onCreated }: Props) {
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<WizardData>({
    resolver: zodResolver(schema) as Resolver<WizardData>,
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  const formato = watch('formatoAmericano');
  const generos = watch('generosHabilitados') || [];
  const categoriasSel = watch('categoriasHabilitadas') || [];

  // Resetear campos condicionales cuando cambia el formato
  const prevFormato = useRef(formato);
  useEffect(() => {
    if (prevFormato.current !== formato) {
      setValue('generosHabilitados', ['MASCULINO', 'FEMENINO']);
      setValue('categoriasHabilitadas', []);
      setValue('combinacionesSumas', []);
      setValue('combinacionesMixtas', []);
      prevFormato.current = formato;
    }
  }, [formato, setValue]);

  const canAdvance = async () => {
    const fields = STEP_REQUIRED[step];
    if (!fields || fields.length === 0) return true;
    const ok = await trigger(fields as (keyof WizardData)[]);
    return ok;
  };

  const handleNext = async () => {
    if (await canAdvance()) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = async (data: WizardData) => {
    try {
      setLoading(true);

      // 1. Crear torneo básico
      const createPayload = {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        fecha: data.fecha,
        ciudad: data.ciudad,
        visibilidad: data.visibilidad,
        limiteInscripciones: data.limiteInscripciones || undefined,
        tipoInscripcion: getTipoInscripcionPorFormato(data.formatoAmericano),
      };

      const torneo = await americanoService.crear(createPayload);

      // 2. Configurar modo de juego
      const premiosArray = data.premiosTexto
        ? data.premiosTexto.split('\n').filter(Boolean).map((line, i) => ({
            puesto: `${i + 1}°`,
            descripcion: line.trim(),
          }))
        : [];

      const modoPayload = {
        tipoInscripcion: createPayload.tipoInscripcion,
        rotacion: data.rotacion,
        sistemaPuntos: data.sistemaPuntos,
        formatoPartido: data.formatoPartido,
        valorObjetivo: data.valorObjetivo,
        conTieBreak: data.conTieBreak,
        categorias:
          data.formatoAmericano === 'clasico' || data.formatoAmericano === 'parejasSinCat'
            ? 'sin'
            : 'con',
        numRondas: data.numRondas,
        canchasSimultaneas: data.canchasSimultaneas,
        premios: premiosArray,
        formatoAmericano: data.formatoAmericano,
        generosHabilitados: data.generosHabilitados,
        categoriasHabilitadas: data.categoriasHabilitadas,
        combinacionesSuma: data.combinacionesSumas,
        combinacionesMixto: data.combinacionesMixtas,
      };

      await americanoService.configurarModo(torneo.id, modoPayload as any);

      showSuccess('Torneo creado y configurado');
      onCreated(torneo);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al crear el torneo');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render helpers ───
  const stepLabels = ['Formato', 'Configuración', 'Resumen'];

  const progressPct = ((step - 1) / 2) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#232838]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm">Crear Torneo Americano</h2>
                <p className="text-white/40 text-xs">Paso {step} de 3 — {stepLabels[step - 1]}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>

          {/* Progress */}
          <div className="px-5 pt-4 pb-0">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {stepLabels.map((label, i) => (
                <span
                  key={label}
                  className={`text-[10px] font-medium ${
                    i + 1 <= step ? 'text-primary' : 'text-white/20'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Body */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {step === 1 && <Step1Formato control={control} errors={errors} />}
              {step === 2 && (
                <AmericanoConfigForm
                  control={control}
                  watch={watch}
                  setValue={setValue}
                  errors={errors}
                  formatoAmericano={formato}
                />
              )}
              {step === 3 && (
                <Step3Resumen
                  watch={watch}
                  generos={generos}
                  categorias={categoriasSel}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-5 border-t border-[#232838]">
              <button
                type="button"
                onClick={step === 1 ? onClose : handleBack}
                className="px-4 py-2.5 text-white/60 text-sm font-medium hover:text-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 1 ? 'Cancelar' : 'Atrás'}
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Crear torneo gratis
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Step 1: Formato y Datos Básicos ───
function Step1Formato({
  control,
  errors,
}: {
  control: Control<WizardData>;
  errors: any;
}) {
  return (
    <div className="space-y-5">
      {/* Datos básicos */}
      <div className="space-y-3">
        <div>
          <label className="text-white/50 text-xs font-medium mb-1.5 block">
            Nombre del torneo <span className="text-red-400">*</span>
          </label>
          <Controller
            name="nombre"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                placeholder="Ej: Torneo Americano Verano 2026"
                className="w-full bg-white/[0.03] border border-[#232838] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-primary outline-none transition-colors"
              />
            )}
          />
          {errors.nombre && (
            <p className="text-red-400 text-xs mt-1">{errors.nombre.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">
              Fecha <span className="text-red-400">*</span>
            </label>
            <Controller
              name="fecha"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  className="w-full bg-white/[0.03] border border-[#232838] rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors"
                />
              )}
            />
            {errors.fecha && (
              <p className="text-red-400 text-xs mt-1">{errors.fecha.message as string}</p>
            )}
          </div>
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">
              Ciudad <span className="text-red-400">*</span>
            </label>
            <Controller
              name="ciudad"
              control={control}
              render={({ field }) => (
                <CityAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  hideLabel
                  inputClassName="bg-white/[0.03] border-[#232838] py-2.5 text-sm placeholder:text-white/20 focus:ring-0"
                  dropdownClassName="bg-[#151921] border-[#232838]"
                  placeholder="Ej: Asunción"
                />
              )}
            />
            {errors.ciudad && (
              <p className="text-red-400 text-xs mt-1">{errors.ciudad.message as string}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-white/50 text-xs font-medium mb-1.5 block">Descripción (opcional)</label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={2}
                placeholder="Cuéntale a los jugadores qué hace especial este torneo..."
                className="w-full bg-white/[0.03] border border-[#232838] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-primary outline-none transition-colors resize-none"
              />
            )}
          />
        </div>

        <Controller
          name="visibilidad"
          control={control}
          render={({ field }) => (
            <div className="flex gap-3">
              {[
                { value: 'publico', label: 'Público', desc: 'Visible para todos' },
                { value: 'privado', label: 'Privado', desc: 'Solo con link' },
              ].map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => field.onChange(v.value)}
                  className={`flex-1 text-left p-3 rounded-xl border transition-all ${
                    field.value === v.value
                      ? 'bg-primary/10 border-primary/30 ring-1 ring-primary'
                      : 'bg-white/[0.02] border-[#232838] hover:border-[#2d3550]'
                  }`}
                >
                  <span className={`text-sm font-medium ${field.value === v.value ? 'text-white' : 'text-white/70'}`}>
                    {v.label}
                  </span>
                  <p className="text-white/30 text-[10px] mt-0.5">{v.desc}</p>
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="h-px bg-[#232838]" />

      {/* Formato */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-white/70 text-xs leading-relaxed">
          Elegí el formato que se adapta a tu torneo. Cada opción define cómo se agrupan los jugadores y si las parejas rotan o son fijas.
        </p>
      </div>

      <Controller
        name="formatoAmericano"
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FORMATOS.map((f) => {
              const selected = field.value === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => field.onChange(f.id)}
                  className={`relative text-left p-4 rounded-xl border transition-all ${
                    selected
                      ? `${f.bgColor} ${f.borderColor} ring-1 ring-offset-0 ring-offset-[#151921] ${f.color.replace('text-', 'ring-')}`
                      : 'bg-white/[0.02] border-[#232838] hover:border-[#2d3550] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selected ? f.bgColor : 'bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${selected ? f.color : 'text-white/30'}`} />
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        f.badge === 'Individual'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {f.badge}
                    </span>
                  </div>
                  <h3
                    className={`text-sm font-semibold mb-1 ${
                      selected ? 'text-white' : 'text-white/80'
                    }`}
                  >
                    {f.nombre}
                  </h3>
                  <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>

                  {selected && (
                    <motion.div
                      layoutId="check-formato"
                      className="absolute top-3 right-3"
                    >
                      <Check className={`w-4 h-4 ${f.color}`} />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.formatoAmericano && (
        <p className="text-red-400 text-xs">{errors.formatoAmericano.message as string}</p>
      )}
    </div>
  );
}

// ─── Step 3: Resumen ───
function Step3Resumen({
  watch,
  generos,
  categorias,
}: {
  watch: any;
  generos: string[];
  categorias: string[];
}) {
  const formato = watch('formatoAmericano') as FormatoAmericano;
  const nombre = watch('nombre');
  const fecha = watch('fecha');
  const ciudad = watch('ciudad');
  const visibilidad = watch('visibilidad');
  const limite = watch('limiteInscripciones');
  const sistemaPuntos = watch('sistemaPuntos');
  const formatoPartido = watch('formatoPartido');
  const valorObjetivo = watch('valorObjetivo');
  const numRondas = watch('numRondas');
  const canchas = watch('canchasSimultaneas');
  const rotacion = watch('rotacion');
  const premiosTexto = watch('premiosTexto') || '';
  const combinacionesSumas = watch('combinacionesSumas') || [];
  const combinacionesMixtas = watch('combinacionesMixtas') || [];

  const previewGrupos = getPreviewGrupos(formato, generos, categorias, combinacionesSumas, combinacionesMixtas);
  const formatoInfo = FORMATOS.find((f) => f.id === formato);

  return (
    <div className="space-y-5">
      {/* Datos básicos */}
      <div className="bg-white/[0.02] border border-[#232838] rounded-xl p-4 space-y-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          {nombre}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-white/30" />
            {fecha}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-white/30" />
            {ciudad}
          </div>
          <div className="flex items-center gap-1.5">
            {visibilidad === 'publico' ? (
              <Eye className="w-3.5 h-3.5 text-white/30" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-white/30" />
            )}
            {visibilidad === 'publico' ? 'Público' : 'Privado'}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-white/30" />
            {limite ? `Máx. ${limite}` : 'Sin límite'}
          </div>
        </div>
      </div>

      {/* Formato seleccionado */}
      <div className="bg-white/[0.02] border border-[#232838] rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          {formatoInfo && (
            <>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formatoInfo.bgColor}`}>
                <formatoInfo.icon className={`w-4 h-4 ${formatoInfo.color}`} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{formatoInfo.nombre}</p>
                <p className="text-white/40 text-xs">{formatoInfo.desc}</p>
              </div>
            </>
          )}
        </div>

        {/* Preview de grupos */}
        <div className="space-y-2">
          <p className="text-white/50 text-xs font-medium">Grupos que se generarán</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {previewGrupos.map((g) => {
              const Icon = g.icon;
              const colorMap: Record<string, string> = {
                blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
                emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
                rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
              };
              const cls = colorMap[g.color] || colorMap.blue;
              return (
                <div
                  key={g.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${cls}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{g.nombre}</p>
                    <p className="text-[10px] opacity-70">{g.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modo de juego resumen */}
      <div className="bg-white/[0.02] border border-[#232838] rounded-xl p-4 space-y-3">
        <h3 className="text-white/70 text-xs font-medium flex items-center gap-2">
          <Settings className="w-3.5 h-3.5" />
          Configuración de juego
        </h3>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <Shuffle className="w-3.5 h-3.5 text-white/30" />
            {rotacion === 'automatica' ? 'Automática' : 'Manual'}
          </div>
          <div className="flex items-center gap-1.5">
            <BarChartIcon className="w-3.5 h-3.5 text-white/30" />
            {sistemaPuntos === 'games' && 'Games acumulados'}
            {sistemaPuntos === 'sets' && 'Sets ganados'}
            {sistemaPuntos === 'partido' && 'Victorias'}
            {sistemaPuntos === 'diferencia' && 'Diferencia de games'}
            {sistemaPuntos === 'puntosFijos' && 'Puntos fijos'}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white/30" />
            {formatoPartido === 'tiempo' && `${valorObjetivo} min`}
            {formatoPartido === 'games' && `${valorObjetivo} games`}
            {formatoPartido === 'mejorDe3Sets' && `A ${valorObjetivo} sets`}
            {formatoPartido === 'puntosFijos' && `${valorObjetivo} pts`}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-white/30" />
            {numRondas === 'automatico' ? 'Rondas auto' : `${numRondas} rondas`}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-white/30" />
            {canchas} cancha{canchas > 1 ? 's' : ''}
          </div>
        </div>

        {premiosTexto.trim() && (
          <div className="pt-2 border-t border-[#232838]">
            <p className="text-white/50 text-[10px] font-medium mb-1">Premios</p>
            <div className="space-y-1">
              {premiosTexto.split('\n').filter(Boolean).map((line: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                  <Trophy className="w-3 h-3 text-white/20" />
                  <span>{line.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
