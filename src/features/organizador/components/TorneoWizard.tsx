import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Award, ChevronRight, ChevronLeft, Check, Sparkles, Users, Info,
} from 'lucide-react';
import { api } from '../../../services/api';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { formatDatePY } from '../../../utils/date';

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════
interface TorneoFormData {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  categoriaIds: string[];
}

interface Categoria {
  id: string;
  nombre: string;
  tipo: 'MASCULINO' | 'FEMENINO';
  orden: number;
  tipoCategoria?: 'STANDARD' | 'MIXTO' | 'SUMAS';
}

interface TorneoWizardProps {
  onSuccess: (torneo: any) => void;
  onCancel: () => void;
}

const TOTAL_PASOS = 3;

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — Borrador en 30s (nombre + fechas + categorías)
// El resto (sede, costo, flyer) se completa después en el panel del torneo.
// ═══════════════════════════════════════════════════════════
export function TorneoWizard({ onSuccess, onCancel }: TorneoWizardProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [formData, setFormData] = useState<TorneoFormData>({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    categoriaIds: [],
  });

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const { data } = await api.get('/admin/torneos/datos/wizard');
      if (data.success) {
        setCategorias(data.categorias || []);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
    }
  };

  const updateField = (field: keyof TorneoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setDirection(1);
    setStep(prev => Math.min(prev + 1, TOTAL_PASOS));
    setError(null);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.nombre.trim()) {
          setError('El nombre del torneo es obligatorio');
          return false;
        }
        if (!formData.fechaInicio) {
          setError('Debes seleccionar la fecha de inicio del torneo');
          return false;
        }
        if (!formData.fechaFin) {
          setError('Debes seleccionar la fecha de fin del torneo');
          return false;
        }
        if (formData.fechaInicio > formData.fechaFin) {
          setError('La fecha de inicio no puede ser posterior a la fecha de fin');
          return false;
        }
        return true;
      case 2:
        if (formData.categoriaIds.length === 0) {
          setError('Debes seleccionar al menos una categoría');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/admin/torneos', { ...formData });
      if (data.success) {
        onSuccess(data.torneo);
      } else {
        setError(data.message || 'Error creando torneo');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creando torneo');
    } finally {
      setLoading(false);
    }
  };

  const caballerosStandard = categorias.filter(c => c.tipo === 'MASCULINO' && c.tipoCategoria === 'STANDARD').sort((a, b) => a.orden - b.orden);
  const damasStandard = categorias.filter(c => c.tipo === 'FEMENINO' && c.tipoCategoria === 'STANDARD').sort((a, b) => a.orden - b.orden);
  const mixtos = categorias.filter(c => c.tipoCategoria === 'MIXTO').sort((a, b) => a.orden - b.orden);
  const sumasDamas = categorias.filter(c => c.tipoCategoria === 'SUMAS' && c.tipo === 'FEMENINO').sort((a, b) => a.orden - b.orden);
  const sumasCaballeros = categorias.filter(c => c.tipoCategoria === 'SUMAS' && c.tipo === 'MASCULINO').sort((a, b) => a.orden - b.orden);

  return (
    <div className="min-h-screen bg-dark py-4 px-4 relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header Compacto */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white/40" />
          </button>
          <div>
            <h1 className="text-lg font-medium text-white">Crear Torneo</h1>
            <p className="text-white/40 text-xs">Paso {step} de {TOTAL_PASOS}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: TOTAL_PASOS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-primary' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <p className="text-red-400 text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
            transition={{ duration: 0.2 }}
            className="bg-white/[0.02] border border-white/5 rounded-xl p-4"
          >
            {step === 1 && (
              <Step1Basico formData={formData} updateField={updateField} />
            )}
            {step === 2 && (
              <Step2Categorias
                formData={formData}
                updateField={updateField}
                caballerosStandard={caballerosStandard}
                damasStandard={damasStandard}
                mixtos={mixtos}
                sumasDamas={sumasDamas}
                sumasCaballeros={sumasCaballeros}
              />
            )}
            {step === 3 && (
              <Step3Confirmar formData={formData} categorias={categorias} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={step === 1 ? onCancel : handleBack}
            className="px-4 py-2 text-white/40 hover:text-white text-sm transition-colors"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>

          {step < TOTAL_PASOS ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Creando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Crear Torneo
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 1: LO BÁSICO (nombre + fechas)
// ═══════════════════════════════════════════════════════════
function Step1Basico({
  formData,
  updateField,
}: {
  formData: TorneoFormData;
  updateField: (field: keyof TorneoFormData, value: any) => void;
}) {
  const nombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nombreRef.current?.focus();
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-base font-medium text-white">Lo básico</h2>
        <p className="text-white/40 text-xs">Nombre y fechas — el resto lo completás después</p>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-xs text-white/60 mb-1.5">
          Nombre <span className="text-primary">*</span>
        </label>
        <input
          ref={nombreRef}
          type="text"
          value={formData.nombre}
          onChange={(e) => updateField('nombre', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
          placeholder="Ej: Torneo Verano 2026"
        />
      </div>

      {/* Fechas del Torneo */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Fechas del Torneo <span className="text-primary">*</span>
        </label>
        <p className="text-xs text-white/50 mb-3">
          Definí el período del torneo. Se muestran en el listado y proponen los días de juego.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1.5">
              Fecha de inicio <span className="text-primary">*</span>
            </label>
            <input
              type="date"
              value={formData.fechaInicio}
              max={formData.fechaFin}
              onChange={(e) => updateField('fechaInicio', e.target.value)}
              className="w-full bg-white/5 border border-primary/30 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">
              Fecha de fin <span className="text-primary">*</span>
            </label>
            <input
              type="date"
              value={formData.fechaFin}
              min={formData.fechaInicio}
              onChange={(e) => updateField('fechaFin', e.target.value)}
              className="w-full bg-white/5 border border-primary/30 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 2: CATEGORÍAS
// ═══════════════════════════════════════════════════════════
function Step2Categorias({
  formData,
  updateField,
  caballerosStandard,
  damasStandard,
  mixtos,
  sumasDamas,
  sumasCaballeros,
}: {
  formData: TorneoFormData;
  updateField: (field: keyof TorneoFormData, value: any) => void;
  caballerosStandard: Categoria[];
  damasStandard: Categoria[];
  mixtos: Categoria[];
  sumasDamas: Categoria[];
  sumasCaballeros: Categoria[];
}) {
  const toggleCategoria = (id: string) => {
    const newIds = formData.categoriaIds.includes(id)
      ? formData.categoriaIds.filter(cid => cid !== id)
      : [...formData.categoriaIds, id];
    updateField('categoriaIds', newIds);
  };

  const renderGrupo = (titulo: string, items: Categoria[], iconColor: string) => {
    if (items.length === 0) return null;
    return (
      <div>
        <h3 className="text-xs font-medium text-white/60 mb-2 flex items-center gap-1.5">
          <Users className={`w-3 h-3 ${iconColor}`} />
          {titulo}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {items.map((cat) => {
            const isSelected = formData.categoriaIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategoria(cat.id)}
                className={`
                  py-2 px-1 rounded-lg border text-center transition-all text-xs
                  ${isSelected
                    ? 'border-primary bg-primary/10 text-white'
                    : 'border-white/10 hover:border-white/20 text-white/50'
                  }
                `}
              >
                {cat.nombre}
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-0.5">
                    <Check className="w-3 h-3 text-primary mx-auto" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Award className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-base font-medium text-white">Categorías</h2>
        <p className="text-white/40 text-xs">
          Seleccionadas: <span className="text-primary font-medium">{formData.categoriaIds.length}</span>
        </p>
      </div>

      {renderGrupo('Caballeros', caballerosStandard, 'text-blue-400')}
      {renderGrupo('Damas', damasStandard, 'text-pink-400')}
      {renderGrupo('Mixtos', mixtos, 'text-purple-400')}
      {renderGrupo('Sumas Damas', sumasDamas, 'text-amber-400')}
      {renderGrupo('Sumas Caballeros', sumasCaballeros, 'text-orange-400')}

      <p className="text-[10px] text-white/30 text-center">
        Podés seleccionar varias categorías
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 3: CONFIRMAR
// ═══════════════════════════════════════════════════════════
function Step3Confirmar({
  formData,
  categorias,
}: {
  formData: TorneoFormData;
  categorias: Categoria[];
}) {
  const categoriasSeleccionadas = categorias.filter(c => formData.categoriaIds.includes(c.id));
  const catMasculinas = categoriasSeleccionadas.filter(c => c.tipo === 'MASCULINO');
  const catFemeninas = categoriasSeleccionadas.filter(c => c.tipo === 'FEMENINO');

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Check className="w-5 h-5 text-emerald-500" />
        </div>
        <h2 className="text-base font-medium text-white">Confirmar</h2>
        <p className="text-white/40 text-xs">Revisá antes de crear</p>
      </div>

      {/* Resumen */}
      <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 space-y-2">
        <div className="flex justify-between py-1.5 border-b border-white/5">
          <span className="text-white/40 text-xs">Nombre</span>
          <span className="text-white text-xs font-medium text-right truncate max-w-[60%]">{formData.nombre}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-white/5">
          <span className="text-white/40 text-xs">Fecha inicio</span>
          <span className="text-primary text-xs font-medium text-right">
            {formData.fechaInicio ? formatDatePY(formData.fechaInicio) : '-'}
          </span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-white/5">
          <span className="text-white/40 text-xs">Fecha fin</span>
          <span className="text-primary text-xs font-medium text-right">
            {formData.fechaFin ? formatDatePY(formData.fechaFin) : '-'}
          </span>
        </div>

        {/* Categorías */}
        <div className="pt-2">
          <span className="text-white/40 text-xs block mb-2">Categorías:</span>
          <div className="flex flex-wrap gap-1">
            {catMasculinas.map(c => (
              <span key={c.id} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px]">
                {c.nombre}
              </span>
            ))}
            {catFemeninas.map(c => (
              <span key={c.id} className="px-2 py-0.5 bg-pink-500/10 text-pink-400 rounded text-[10px]">
                {c.nombre}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Info: qué sigue */}
      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
        <p className="text-emerald-400 text-xs text-center flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Se crea como borrador. Después completás sede, costo y flyer desde el panel, y ahí lo enviás a aprobación.
        </p>
      </div>
    </div>
  );
}
