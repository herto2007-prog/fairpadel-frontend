import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, DollarSign, Image as ImageIcon, 
  Award, ChevronRight, ChevronLeft, Check, Upload,
  Sparkles, Users, Clock, Info, Building2
} from 'lucide-react';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';
import { SedeAutocomplete } from './SedeAutocomplete';
import { api } from '../../../services/api';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { formatDatePY } from '../../../utils/date';

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════
interface TorneoFormData {
  nombre: string;
  descripcion: string;
  ciudad: string;
  region: string;
  pais: string;
  sedeId: string;
  fechaInicio: string;
  fechaFin: string;
  costoInscripcion: number;
  minutosPorPartido: number;
  flyerUrl: string;
  flyerPublicId: string;
  categoriaIds: string[];
}

interface Categoria {
  id: string;
  nombre: string;
  tipo: 'MASCULINO' | 'FEMENINO';
  orden: number;
}

interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
}

interface TorneoWizardProps {
  onSuccess: (torneo: any) => void;
  onCancel: () => void;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export function TorneoWizard({ onSuccess, onCancel }: TorneoWizardProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState<TorneoFormData>({
    nombre: '',
    descripcion: '',
    ciudad: '',
    region: '',
    pais: 'Paraguay',
    sedeId: '',
    fechaInicio: '',
    fechaFin: '',
    costoInscripcion: 0,
    minutosPorPartido: 120,
    flyerUrl: '',
    flyerPublicId: '',
    categoriaIds: [],
  });

  useEffect(() => {
    loadDatosAuxiliares();
  }, []);

  const loadDatosAuxiliares = async () => {
    try {
      const { data } = await api.get('/admin/torneos/datos/wizard');
      if (data.success) {
        setCategorias(data.categorias || []);
        setSedes(data.sedes || []);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
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
    setStep(prev => Math.min(prev + 1, 5));
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
        if (!formData.ciudad) {
          setError('Debes seleccionar una ciudad');
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
        if (formData.costoInscripcion <= 0) {
          setError('El costo de inscripción debe ser mayor a 0');
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
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
      const payload = {
        ...formData,
      };
      
      const { data } = await api.post('/admin/torneos', payload);
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

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    formDataUpload.append('folder', 'tournaments');

    try {
      const { data } = await api.post('/uploads/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        updateField('flyerUrl', data.data.url);
        updateField('flyerPublicId', data.data.publicId);
      }
    } catch (error: any) {
      setError('Error subiendo la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const categoriasMasculinas = categorias.filter(c => c.tipo === 'MASCULINO').sort((a, b) => a.orden - b.orden);
  const categoriasFemeninas = categorias.filter(c => c.tipo === 'FEMENINO').sort((a, b) => a.orden - b.orden);

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
            <p className="text-white/40 text-xs">Paso {step} de 5</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1.5 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
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
              <Step1Identidad 
                formData={formData} 
                updateField={updateField}
                sedes={sedes}
              />
            )}
            {step === 2 && (
              <Step2Inversion 
                formData={formData} 
                updateField={updateField}
              />
            )}
            {step === 3 && (
              <Step3Flyer 
                formData={formData}
                onImageUpload={handleImageUpload}
                uploading={uploadingImage}
              />
            )}
            {step === 4 && (
              <Step4Categorias 
                formData={formData}
                updateField={updateField}
                categoriasMasculinas={categoriasMasculinas}
                categoriasFemeninas={categoriasFemeninas}
              />
            )}
            {step === 5 && (
              <Step5Confirmar 
                formData={formData}
                categorias={categorias}
                sedes={sedes}
              />
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

          {step < 5 ? (
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
// PASO 1: IDENTIDAD Y FECHAS
// ═══════════════════════════════════════════════════════════
function Step1Identidad({ 
  formData, 
  updateField,
  sedes 
}: { 
  formData: TorneoFormData; 
  updateField: (field: keyof TorneoFormData, value: any) => void;
  sedes: Sede[];
}) {
  const nombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nombreRef.current?.focus();
  }, []);

  const handleCiudadChange = (ciudad: string) => {
    updateField('ciudad', ciudad);
    const regiones: Record<string, string> = {
      'Asunción': 'Central', 'San Lorenzo': 'Central', 'Fernando de la Mora': 'Central',
      'Lambaré': 'Central', 'Villa Elisa': 'Central', 'Luque': 'Central',
      'Capiatá': 'Central', 'Ñemby': 'Central', 'Limpio': 'Central',
      'Mariano Roque Alonso': 'Central', 'Areguá': 'Central', 'Villeta': 'Central',
      'Encarnación': 'Itapúa', 'Ciudad del Este': 'Alto Paraná',
      'Pedro Juan Caballero': 'Amambay', 'Coronel Oviedo': 'Caaguazú',
      'Caacupé': 'Cordillera', 'Villarrica': 'Guairá', 'Pilar': 'Ñeembucú',
      'Concepción': 'Concepción', 'San Pedro': 'San Pedro',
      'Caazapá': 'Caazapá', 'San Juan Bautista': 'Misiones',
      'Paraguarí': 'Paraguarí', 'Tebicuary': 'Paraguarí',
      'Quiindy': 'Paraguarí', 'Ypacaraí': 'Central', 'Ypané': 'Central',
    };
    updateField('region', regiones[ciudad] || 'Central');
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-base font-medium text-white">Datos del Torneo</h2>
        <p className="text-white/40 text-xs">Información básica para comenzar</p>
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

      {/* Descripción */}
      <div>
        <label className="block text-xs text-white/60 mb-1.5">Descripción</label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => updateField('descripcion', e.target.value)}
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors resize-none"
          placeholder="Cuéntale a los jugadores qué hace especial este torneo..."
        />
      </div>

      {/* Ciudad */}
      <div>
        <label className="block text-xs text-white/60 mb-1.5">
          Ciudad <span className="text-primary">*</span>
        </label>
        <CityAutocomplete
          value={formData.ciudad}
          onChange={handleCiudadChange}
          placeholder="Buscar ciudad..."
        />
        {formData.region && (
          <p className="text-[10px] text-white/30 mt-1">
            Depto: {formData.region}
          </p>
        )}
      </div>

      {/* Sede Principal */}
      <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Sede Principal
          {formData.sedeId && <span className="text-emerald-400 text-xs">✓ Seleccionada</span>}
        </label>
        
        <p className="text-xs text-white/50 mb-3">
          Esta será la sede principal del torneo. Las finales se jugarán aquí a menos que configures lo contrario en "Canchas".
        </p>

        <SedeAutocomplete
          sedes={sedes}
          value={formData.sedeId}
          onChange={(sedeId) => updateField('sedeId', sedeId)}
          placeholder="Buscar sede por nombre o ciudad..."
          label=""
        />
        
        {formData.sedeId && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-500/10 rounded-lg px-3 py-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Esta sede será el escenario principal para las finales del torneo</span>
          </div>
        )}
      </div>

      {/* Fechas del Torneo */}
      <div className="space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Fechas del Torneo <span className="text-primary">*</span>
          </label>
          <p className="text-xs text-white/50 mb-3">
            Define el período del torneo. Estas fechas se mostrarán en el listado y overview.
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 2: INVERSIÓN
// ═══════════════════════════════════════════════════════════
function Step2Inversion({ 
  formData, 
  updateField 
}: { 
  formData: TorneoFormData; 
  updateField: (field: keyof TorneoFormData, value: any) => void;
}) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (formData.costoInscripcion > 0) {
      setDisplayValue(formData.costoInscripcion.toLocaleString('es-PY'));
    }
  }, []);

  const handleCostoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const numValue = parseInt(rawValue) || 0;
    updateField('costoInscripcion', numValue);
    setDisplayValue(rawValue ? parseInt(rawValue).toLocaleString('es-PY') : '');
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
          <DollarSign className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-base font-medium text-white">Inversión</h2>
        <p className="text-white/40 text-xs">Define el costo y duración</p>
      </div>

      {/* Costo */}
      <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
        <label className="block text-xs text-white/60 mb-2">
          Costo de Inscripción <span className="text-primary">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium text-white/40">
            Gs.
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleCostoChange}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-14 pr-3 text-xl font-medium text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
            placeholder="0"
          />
        </div>
        <p className="text-[10px] text-white/30 mt-2 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Valor que los jugadores verán en la ficha
        </p>
      </div>

      {/* Duración */}
      <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
        <label className="block text-xs text-white/60 mb-3 flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Duración por partido
        </label>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-white/30">60min</span>
          <input
            type="range"
            min={60}
            max={180}
            step={15}
            value={formData.minutosPorPartido}
            onChange={(e) => updateField('minutosPorPartido', parseInt(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="text-xs text-white/30">180min</span>
        </div>
        <div className="text-center">
          <span className="text-2xl font-medium text-primary">{formData.minutosPorPartido}</span>
          <span className="text-white/40 text-sm ml-1">min</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 3: FLYER
// ═══════════════════════════════════════════════════════════
function Step3Flyer({ 
  formData,
  onImageUpload,
  uploading
}: { 
  formData: TorneoFormData;
  onImageUpload: (file: File) => void;
  uploading: boolean;
}) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
          <ImageIcon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-base font-medium text-white">Flyer</h2>
        <p className="text-white/40 text-xs">Imagen atractiva = más inscripciones</p>
      </div>

      {/* Upload */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200
          ${dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
          }
          ${formData.flyerUrl ? 'border-emerald-500/30' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full mb-2"
            />
            <p className="text-white/40 text-sm">Subiendo...</p>
          </div>
        ) : formData.flyerUrl ? (
          <div className="relative">
            <img
              src={formData.flyerUrl}
              alt="Flyer"
              className="max-h-40 mx-auto rounded-lg"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-2">
              <Upload className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-white/60 text-sm font-medium">Suelta o haz clic</p>
            <p className="text-[10px] text-white/30 mt-1">
              1200x630px • JPG, PNG, WEBP
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
        <p className="text-xs text-white/40 mb-3">Vista previa</p>
        <div className="max-w-[200px] mx-auto">
          <div className="bg-dark rounded-lg overflow-hidden border border-white/5">
            <div className="aspect-[16/9] bg-white/5 relative">
              {formData.flyerUrl ? (
                <img src={formData.flyerUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white/20" />
                </div>
              )}
            </div>
            <div className="p-2.5">
              <h3 className="text-sm font-medium text-white truncate">
                {formData.nombre || 'Torneo'}
              </h3>
              <p className="text-[10px] text-white/40">
                {formData.ciudad || 'Ciudad'} • Gs. {(formData.costoInscripcion || 0).toLocaleString('es-PY')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 4: CATEGORÍAS
// ═══════════════════════════════════════════════════════════
function Step4Categorias({ 
  formData,
  updateField,
  categoriasMasculinas,
  categoriasFemeninas
}: { 
  formData: TorneoFormData;
  updateField: (field: keyof TorneoFormData, value: any) => void;
  categoriasMasculinas: Categoria[];
  categoriasFemeninas: Categoria[];
}) {
  const toggleCategoria = (id: string) => {
    const newIds = formData.categoriaIds.includes(id)
      ? formData.categoriaIds.filter(cid => cid !== id)
      : [...formData.categoriaIds, id];
    updateField('categoriaIds', newIds);
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

      {/* Caballeros */}
      {categoriasMasculinas.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-white/60 mb-2 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-blue-400" />
            Caballeros
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {categoriasMasculinas.map((cat) => {
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
      )}

      {/* Damas */}
      {categoriasFemeninas.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-white/60 mb-2 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-pink-400" />
            Damas
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {categoriasFemeninas.map((cat) => {
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
      )}

      <p className="text-[10px] text-white/30 text-center">
        Puedes seleccionar varias categorías
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 5: CONFIRMAR
// ═══════════════════════════════════════════════════════════
function Step5Confirmar({ 
  formData,
  categorias,
  sedes
}: { 
  formData: TorneoFormData;
  categorias: Categoria[];
  sedes: Sede[];
}) {
  const sede = sedes.find(s => s.id === formData.sedeId);
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
        <p className="text-white/40 text-xs">Revisa antes de crear</p>
      </div>

      {/* Resumen */}
      <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 space-y-2">
        <div className="flex justify-between py-1.5 border-b border-white/5">
          <span className="text-white/40 text-xs">Nombre</span>
          <span className="text-white text-xs font-medium text-right truncate max-w-[60%]">{formData.nombre}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-white/5">
          <span className="text-white/40 text-xs">Ubicación</span>
          <span className="text-white text-xs text-right">
            {formData.ciudad}{sede ? ` - ${sede.nombre}` : ''}
          </span>
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
        <div className="flex justify-between py-1.5 border-b border-white/5">
          <span className="text-white/40 text-xs">Inscripción</span>
          <span className="text-emerald-400 text-xs font-medium">
            Gs. {formData.costoInscripcion.toLocaleString('es-PY')}
          </span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-white/40 text-xs">Duración</span>
          <span className="text-white text-xs">{formData.minutosPorPartido} min</span>
        </div>

        {/* Categorías */}
        <div className="pt-2 border-t border-white/5">
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

        {/* Flyer */}
        {formData.flyerUrl && (
          <div className="pt-2">
            <span className="text-white/40 text-xs block mb-2">Flyer:</span>
            <img src={formData.flyerUrl} alt="" className="max-h-20 rounded-lg" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
        <p className="text-emerald-400 text-xs text-center flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          El torneo será público al crearlo
        </p>
      </div>
    </div>
  );
}
