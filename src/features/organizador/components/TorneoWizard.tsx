import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Calendar, DollarSign, Image as ImageIcon, 
  Award, ChevronRight, ChevronLeft, Check, Upload, X,
  Sparkles, Users, Clock, Info
} from 'lucide-react';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';
import { api } from '../../../services/api';

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

  // Cargar datos auxiliares
  useEffect(() => {
    loadDatosAuxiliares();
  }, []);

  const loadDatosAuxiliares = async () => {
    try {
      const { data } = await api.get('/admin/torneos/datos/wizard');
      if (data.success) {
        setCategorias(data.categorias || []);
        setSedes(data.sedes || []);
      } else {
        console.error('Error del servidor:', data.message);
        setCategorias([]);
        setSedes([]);
      }
    } catch (error: any) {
      console.error('Error cargando datos:', error);
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
        if (!formData.fechaInicio || !formData.fechaFin) {
          setError('Debes seleccionar las fechas del torneo');
          return false;
        }
        if (new Date(formData.fechaInicio) > new Date(formData.fechaFin)) {
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
        // Flyer es opcional
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
      const { data } = await api.post('/admin/torneos', formData);
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
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setError('Error subiendo la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  // Categorías separadas por tipo
  const categoriasMasculinas = categorias.filter(c => c.tipo === 'MASCULINO').sort((a, b) => a.orden - b.orden);
  const categoriasFemeninas = categorias.filter(c => c.tipo === 'FEMENINO').sort((a, b) => a.orden - b.orden);

  return (
    <div className="min-h-screen bg-[#0B0E14] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-[#151921] rounded-xl transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Crear Torneo</h1>
            <p className="text-gray-400 text-sm">Paso {step} de 5</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-[#df2531]' : 'bg-[#232838]'
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
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <p className="text-red-400 flex items-center gap-2">
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
            initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-2xl p-6 md:p-8"
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
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={step === 1 ? onCancel : handleBack}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>

          {step < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-[#df2531]/20"
            >
              Siguiente
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Creando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
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
    // Auto-completar región basado en ciudad
    const regiones: Record<string, string> = {
      'Asunción': 'Central',
      'San Lorenzo': 'Central',
      'Fernando de la Mora': 'Central',
      'Lambaré': 'Central',
      'Villa Elisa': 'Central',
      'Luque': 'Central',
      'Capiatá': 'Central',
      'Ñemby': 'Central',
      'Limpio': 'Central',
      'Mariano Roque Alonso': 'Central',
      'Areguá': 'Central',
      'Villeta': 'Central',
      'Encarnación': 'Itapúa',
      'Ciudad del Este': 'Alto Paraná',
      'Pedro Juan Caballero': 'Amambay',
      'Coronel Oviedo': 'Caaguazú',
      'Caacupé': 'Cordillera',
      'Villarrica': 'Guairá',
      'Pilar': 'Ñeembucú',
      'Concepción': 'Concepción',
      'San Pedro': 'San Pedro',
      'Caazapá': 'Caazapá',
      'San Juan Bautista': 'Misiones',
      'Paraguarí': 'Paraguarí',
      'Tebicuary': 'Paraguarí',
      'Quiindy': 'Paraguarí',
      'Ypacaraí': 'Central',
      'Ypané': 'Central',
    };
    updateField('region', regiones[ciudad] || 'Central');
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#df2531]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-[#df2531]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">La Identidad de tu Torneo</h2>
        <p className="text-gray-400">Los grandes torneos comienzan con una identidad clara</p>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nombre del Torneo <span className="text-[#df2531]">*</span>
        </label>
        <input
          ref={nombreRef}
          type="text"
          value={formData.nombre}
          onChange={(e) => updateField('nombre', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] transition-colors"
          placeholder="Ej: Torneo Verano 2026 - Club Centro"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Descripción
        </label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => updateField('descripcion', e.target.value)}
          rows={3}
          className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] transition-colors resize-none"
          placeholder="Cuéntale a los jugadores qué hace especial este torneo. Premios, ambiente, nivel de juego..."
        />
      </div>

      {/* Ciudad */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Ciudad <span className="text-[#df2531]">*</span>
        </label>
        <CityAutocomplete
          value={formData.ciudad}
          onChange={handleCiudadChange}
          placeholder="Busca tu ciudad..."
        />
        {formData.region && (
          <p className="text-xs text-gray-500 mt-1">
            Departamento: <span className="text-gray-400">{formData.region}</span>
          </p>
        )}
      </div>

      {/* Sede */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Sede <span className="text-gray-500">(Opcional)</span>
        </label>
        <select
          value={formData.sedeId}
          onChange={(e) => updateField('sedeId', e.target.value)}
          className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#df2531] transition-colors"
        >
          <option value="">Selecciona una sede registrada...</option>
          {sedes.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.nombre} - {sede.ciudad}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          ¿No encuentras tu sede? Podrás agregarla más tarde o seleccionar &quot;Otra sede&quot;.
        </p>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fecha de Inicio <span className="text-[#df2531]">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => updateField('fechaInicio', e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#df2531] transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fecha de Fin <span className="text-[#df2531]">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={formData.fechaFin}
              min={formData.fechaInicio}
              onChange={(e) => updateField('fechaFin', e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#df2531] transition-colors"
            />
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#df2531]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-[#df2531]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">La Inversión</h2>
        <p className="text-gray-400">Un precio justo atrae más jugadores</p>
      </div>

      {/* Costo de inscripción */}
      <div className="bg-[#151921] rounded-2xl p-6 border border-[#232838]">
        <label className="block text-sm font-medium text-gray-300 mb-4">
          Costo de Inscripción <span className="text-[#df2531]">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">
            Gs.
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleCostoChange}
            className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-4 pl-16 pr-4 text-2xl font-bold text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] transition-colors"
            placeholder="0"
          />
        </div>
        <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Este es el valor que los jugadores verán en la ficha del torneo
        </p>
      </div>

      {/* Duración del partido */}
      <div className="bg-[#151921] rounded-2xl p-6 border border-[#232838]">
        <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Duración de cada partido
        </label>
        
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-gray-500">60min</span>
          <input
            type="range"
            min={60}
            max={180}
            step={15}
            value={formData.minutosPorPartido}
            onChange={(e) => updateField('minutosPorPartido', parseInt(e.target.value))}
            className="flex-1 h-2 bg-[#232838] rounded-lg appearance-none cursor-pointer accent-[#df2531]"
          />
          <span className="text-sm text-gray-500">180min</span>
        </div>
        
        <div className="text-center">
          <span className="text-3xl font-bold text-[#df2531]">{formData.minutosPorPartido}</span>
          <span className="text-gray-400 ml-2">minutos</span>
        </div>
        
        <p className="text-xs text-gray-500 mt-3 text-center">
          Podrás ajustar esto más tarde según la modalidad de tu torneo
        </p>
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#df2531]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-[#df2531]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">El Flyer Oficial</h2>
        <p className="text-gray-400">Una imagen atractiva = más inscripciones</p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300
          ${dragActive 
            ? 'border-[#df2531] bg-[#df2531]/10' 
            : 'border-[#232838] hover:border-gray-600 bg-[#151921]'
          }
          ${formData.flyerUrl ? 'border-emerald-500/50' : ''}
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
              className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full mb-4"
            />
            <p className="text-gray-400">Subiendo imagen...</p>
          </div>
        ) : formData.flyerUrl ? (
          <div className="relative">
            <img
              src={formData.flyerUrl}
              alt="Flyer del torneo"
              className="max-h-64 mx-auto rounded-xl"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                // updateField('flyerUrl', '');
                // updateField('flyerPublicId', '');
              }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[#232838] rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-white font-medium mb-2">
              Suelta tu imagen aquí o haz clic para buscar
            </p>
            <p className="text-sm text-gray-500">
              Tamaño recomendado: <span className="text-gray-400">1200x630px</span>
            </p>
            <p className="text-sm text-gray-500">
              Formatos: <span className="text-gray-400">JPG, PNG, WEBP (máx. 5MB)</span>
            </p>
          </div>
        )}
      </div>

      {/* Preview Card */}
      <div className="bg-[#151921] rounded-2xl p-6 border border-[#232838]">
        <p className="text-sm font-medium text-gray-400 mb-4">Vista previa de la card</p>
        <div className="max-w-xs mx-auto">
          <div className="bg-[#0B0E14] rounded-xl overflow-hidden border border-[#232838]">
            <div className="aspect-[16/9] bg-[#232838] relative">
              {formData.flyerUrl ? (
                <img
                  src={formData.flyerUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-600" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-white truncate">
                {formData.nombre || 'Nombre del Torneo'}
              </h3>
              <p className="text-sm text-gray-400">
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#df2531]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-[#df2531]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">¿Qué Categorías?</h2>
        <p className="text-gray-400">Más categorías = más jugadores = mejor torneo</p>
      </div>

      {/* Contador */}
      <div className="bg-[#151921] rounded-xl p-4 text-center border border-[#232838]">
        <p className="text-sm text-gray-400">
          Categorías seleccionadas: <span className="text-[#df2531] font-bold">{formData.categoriaIds.length}</span>
        </p>
      </div>

      {/* Caballeros */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Caballeros
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categoriasMasculinas.map((cat) => {
            const isSelected = formData.categoriaIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategoria(cat.id)}
                className={`
                  p-4 rounded-xl border-2 text-center transition-all
                  ${isSelected 
                    ? 'border-[#df2531] bg-[#df2531]/10 text-white' 
                    : 'border-[#232838] hover:border-gray-600 text-gray-400'
                  }
                `}
              >
                <span className="font-medium">{cat.nombre}</span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-2"
                  >
                    <Check className="w-4 h-4 text-[#df2531] mx-auto" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Damas */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-pink-400" />
          Damas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categoriasFemeninas.map((cat) => {
            const isSelected = formData.categoriaIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategoria(cat.id)}
                className={`
                  p-4 rounded-xl border-2 text-center transition-all
                  ${isSelected 
                    ? 'border-[#df2531] bg-[#df2531]/10 text-white' 
                    : 'border-[#232838] hover:border-gray-600 text-gray-400'
                  }
                `}
              >
                <span className="font-medium">{cat.nombre}</span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-2"
                  >
                    <Check className="w-4 h-4 text-[#df2531] mx-auto" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-gray-500 text-center">
        💡 Puedes seleccionar varias. Cada categoría creará una competencia separada.
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Todo Listo</h2>
        <p className="text-gray-400">Revisa los detalles y crea tu torneo</p>
      </div>

      {/* Resumen */}
      <div className="bg-[#151921] rounded-2xl p-6 border border-[#232838] space-y-4">
        <h3 className="font-bold text-white mb-4">Resumen del Torneo</h3>

        {/* Info básica */}
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-[#232838]">
            <span className="text-gray-400">Nombre</span>
            <span className="text-white font-medium text-right">{formData.nombre}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#232838]">
            <span className="text-gray-400">Ubicación</span>
            <span className="text-white font-medium text-right">
              {formData.ciudad}{sede ? ` - ${sede.nombre}` : ''}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#232838]">
            <span className="text-gray-400">Fechas</span>
            <span className="text-white font-medium text-right">
              {new Date(formData.fechaInicio).toLocaleDateString('es-PY')} al {new Date(formData.fechaFin).toLocaleDateString('es-PY')}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#232838]">
            <span className="text-gray-400">Inscripción</span>
            <span className="text-emerald-400 font-bold">
              Gs. {formData.costoInscripcion.toLocaleString('es-PY')}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#232838]">
            <span className="text-gray-400">Duración por partido</span>
            <span className="text-white font-medium">{formData.minutosPorPartido} min</span>
          </div>
        </div>

        {/* Categorías */}
        <div className="pt-4">
          <span className="text-gray-400 block mb-3">Categorías habilitadas:</span>
          <div className="flex flex-wrap gap-2">
            {catMasculinas.map(c => (
              <span key={c.id} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                {c.nombre}
              </span>
            ))}
            {catFemeninas.map(c => (
              <span key={c.id} className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-sm">
                {c.nombre}
              </span>
            ))}
          </div>
        </div>

        {/* Flyer */}
        {formData.flyerUrl && (
          <div className="pt-4">
            <span className="text-gray-400 block mb-3">Flyer:</span>
            <img
              src={formData.flyerUrl}
              alt="Flyer"
              className="max-h-32 rounded-xl"
            />
          </div>
        )}
      </div>

      {/* Info final */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
        <p className="text-emerald-400 text-sm text-center">
          <Sparkles className="w-4 h-4 inline mr-2" />
          Al crear, tu torneo será público y recibirás el link de inscripción
        </p>
      </div>
    </div>
  );
}
