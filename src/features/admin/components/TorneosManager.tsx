import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Calendar, MapPin, DollarSign, 
  Check, ChevronRight, ChevronLeft, Sparkles,
  Clock, Building2, Search, X,
  Settings2, Medal, Swords, Crown
} from 'lucide-react';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';
import { api } from '../../../services/api';

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════
interface TorneoFormData {
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion: string;
  ciudad: string;
  costoInscripcion: number;
  sedeId: string;
  sedeNombre: string;
  flyerUrl: string;
  modalidadIds: string[];
  categoriaIds: string[];
  setsPorPartido: number;
  minutosPorPartido: number;
}

interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
  direccion?: string;
}

interface Modalidad {
  id: string;
  nombre: string;
  descripcion: string;
  reglas: {
    variante: 'PY' | 'MUNDIAL';
    formatoBracket: string;
  };
}

interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
}

const steps = [
  { id: 1, title: 'Datos Básicos', subtitle: 'Información general', icon: Trophy },
  { id: 2, title: 'Modalidad', subtitle: 'Formato de juego', icon: Swords },
  { id: 3, title: 'Categorías', subtitle: 'Niveles del torneo', icon: Medal },
  { id: 4, title: 'Reglas', subtitle: 'Configuración', icon: Settings2 },
  { id: 5, title: 'Publicar', subtitle: 'Revisa y crea', icon: Sparkles },
];

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export function TorneosManager() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [torneoCreado, setTorneoCreado] = useState<any>(null);
  
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(true);

  const [formData, setFormData] = useState<TorneoFormData>({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    fechaLimiteInscripcion: '',
    ciudad: '',
    costoInscripcion: 0,
    sedeId: '',
    sedeNombre: '',
    flyerUrl: '',
    modalidadIds: [],
    categoriaIds: [],
    setsPorPartido: 3,
    minutosPorPartido: 60,
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadDatosWizard();
  }, []);

  const loadDatosWizard = async () => {
    try {
      const { data } = await api.get('/admin/torneos/datos/wizard');
      if (data.success) {
        setSedes(data.sedes);
        setModalidades(data.modalidades);
        setCategorias(data.categorias);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMessage({ type: 'error', text: 'Error cargando datos del wizard' });
    } finally {
      setLoadingDatos(false);
    }
  };

  const updateField = (field: keyof TorneoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleModalidad = (id: string) => {
    setFormData(prev => ({
      ...prev,
      modalidadIds: prev.modalidadIds.includes(id)
        ? prev.modalidadIds.filter(m => m !== id)
        : [...prev.modalidadIds, id]
    }));
  };

  const toggleCategoria = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categoriaIds: prev.categoriaIds.includes(id)
        ? prev.categoriaIds.filter(c => c !== id)
        : [...prev.categoriaIds, id]
    }));
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      const errorMsg = getValidationError(currentStep);
      setMessage({ type: 'error', text: errorMsg });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setDirection(1);
    setCurrentStep(prev => Math.min(prev + 1, 5));
    setMessage(null);
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setMessage(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.nombre.trim() && formData.ciudad && formData.fechaInicio && formData.fechaFin);
      case 2:
        return formData.modalidadIds.length > 0;
      case 3:
        return formData.categoriaIds.length > 0;
      case 4:
      case 5:
        return true;
      default:
        return true;
    }
  };

  const getValidationError = (step: number): string => {
    switch (step) {
      case 1:
        if (!formData.nombre.trim()) return 'El nombre del torneo es obligatorio';
        if (!formData.ciudad) return 'Debes seleccionar una ciudad';
        if (!formData.fechaInicio) return 'Selecciona la fecha de inicio';
        if (!formData.fechaFin) return 'Selecciona la fecha de fin';
        return '';
      case 2:
        return 'Debes seleccionar al menos una modalidad';
      case 3:
        return 'Debes seleccionar al menos una categoría';
      default:
        return '';
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Paso 1: Crear torneo básico
      const { data: createData } = await api.post('/admin/torneos', {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        fechaLimiteInscripcion: formData.fechaLimiteInscripcion || formData.fechaInicio,
        ciudad: formData.ciudad,
        costoInscripcion: formData.costoInscripcion,
        sedeId: formData.sedeId || undefined,
      });
      
      if (!createData.success) throw new Error(createData.message);
      
      const torneoId = createData.torneo.id;

      // Paso 2: Asignar modalidades
      if (formData.modalidadIds.length > 0) {
        await api.post(`/admin/torneos/${torneoId}/modalidades`, {
          modalidadIds: formData.modalidadIds,
        });
      }

      // Paso 3: Asignar categorías
      if (formData.categoriaIds.length > 0) {
        await api.post(`/admin/torneos/${torneoId}/categorias`, {
          categoriaIds: formData.categoriaIds,
        });
      }

      // Paso 4: Configurar reglas
      await api.put(`/admin/torneos/${torneoId}/configuracion`, {
        setsPorPartido: formData.setsPorPartido,
        minutosPorPartido: formData.minutosPorPartido,
      });

      // Publicar
      await api.put(`/admin/torneos/${torneoId}/publicar`);

      setTorneoCreado(createData.torneo);
      setMessage({ type: 'success', text: '¡Torneo creado y publicado exitosamente!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Error creando torneo' 
      });
    } finally {
      setSaving(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setFormData({
      nombre: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      fechaLimiteInscripcion: '',
      ciudad: '',
      costoInscripcion: 0,
      sedeId: '',
      sedeNombre: '',
      flyerUrl: '',
      modalidadIds: [],
      categoriaIds: [],
      setsPorPartido: 3,
      minutosPorPartido: 60,
    });
    setTorneoCreado(null);
    setMessage(null);
  };

  if (loadingDatos) {
    return (
      <div className="glass rounded-3xl p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
        />
        <p className="text-gray-400 mt-4">Cargando...</p>
      </div>
    );
  }

  if (torneoCreado) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-red-600 flex items-center justify-center"
        >
          <Crown className="w-12 h-12 text-white" />
        </motion.div>
        
        <h3 className="text-2xl font-bold text-white mb-2">¡Torneo Creado!</h3>
        <p className="text-gray-400 mb-6">{torneoCreado.nombre}</p>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={resetWizard}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all"
          >
            Crear Otro Torneo
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-1 relative">
                {index < steps.length - 1 && (
                  <div className="absolute top-4 left-1/2 w-full h-0.5 bg-gray-800 -z-10">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? '100%' : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
                
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-dark-100 text-gray-500 border border-gray-700'
                  }`}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </motion.div>
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mensaje */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl mb-4 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
              {message.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          {currentStep === 1 && (
            <Step1Basico 
              formData={formData} 
              updateField={updateField} 
              sedes={sedes}
            />
          )}
          {currentStep === 2 && (
            <Step2Modalidad 
              formData={formData}
              toggleModalidad={toggleModalidad}
              modalidades={modalidades}
            />
          )}
          {currentStep === 3 && (
            <Step3Categorias
              formData={formData}
              toggleCategoria={toggleCategoria}
              categorias={categorias}
            />
          )}
          {currentStep === 4 && (
            <Step4Configuracion
              formData={formData}
              updateField={updateField}
            />
          )}
          {currentStep === 5 && (
            <Step5Preview
              formData={formData}
              modalidades={modalidades}
              categorias={categorias}
              sedes={sedes}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Atrás
        </button>

        {currentStep < 5 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
          >
            Siguiente
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
          >
            {saving ? (
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
  );
}

// ═══════════════════════════════════════════════════════════
// INPUT DE GUARANÍES
// ═══════════════════════════════════════════════════════════
function GuaraniesInput({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (value: number) => void;
  label: string;
}) {
  const [displayValue, setDisplayValue] = useState('');
  
  useEffect(() => {
    if (value > 0) {
      setDisplayValue(value.toLocaleString('es-PY'));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const numValue = parseInt(rawValue) || 0;
    onChange(numValue);
    setDisplayValue(rawValue ? parseInt(rawValue).toLocaleString('es-PY') : '');
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          Gs.
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary font-mono text-lg"
          placeholder="0"
        />
      </div>
      {value > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {value.toLocaleString('es-PY')} guaraníes
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BUSCADOR DE SEDES
// ═══════════════════════════════════════════════════════════
function SedeAutocomplete({ 
  value, 
  displayValue,
  onChange, 
  sedes,
  label 
}: { 
  value: string;
  displayValue: string;
  onChange: (id: string, nombre: string) => void;
  sedes: Sede[];
  label: string;
}) {
  const [inputValue, setInputValue] = useState(displayValue);
  const [isOpen, setIsOpen] = useState(false);

  const filteredSedes = useMemo(() => {
    if (!inputValue.trim()) return sedes.slice(0, 5);
    const search = inputValue.toLowerCase();
    return sedes.filter(s => 
      s.nombre.toLowerCase().includes(search) || 
      s.ciudad.toLowerCase().includes(search)
    ).slice(0, 8);
  }, [inputValue, sedes]);

  const handleSelect = (sede: Sede) => {
    onChange(sede.id, sede.nombre);
    setInputValue(`${sede.nombre} - ${sede.ciudad}`);
    setIsOpen(false);
  };

  const clearSelection = () => {
    onChange('', '');
    setInputValue('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <div className="relative">
        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            if (!e.target.value) clearSelection();
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-12 pr-10 text-white focus:outline-none focus:border-primary"
          placeholder="Buscar sede..."
        />
        {inputValue && (
          <button
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-800 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
        {!inputValue && (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredSedes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-[#232838] overflow-hidden z-50 max-h-60 overflow-y-auto"
          >
            {filteredSedes.map((sede) => (
              <button
                key={sede.id}
                onClick={() => handleSelect(sede)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#151921] transition-colors ${
                  value === sede.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                }`}
              >
                <Building2 className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{sede.nombre}</p>
                  <p className="text-gray-500 text-xs">{sede.ciudad}</p>
                </div>
                {value === sede.id && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && inputValue && filteredSedes.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-[#232838] p-4 text-center z-50">
          <p className="text-gray-400 text-sm">No se encontró "{inputValue}"</p>
          <p className="text-gray-600 text-xs mt-1">Crea la sede primero en el panel de Sedes</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 1: DATOS BÁSICOS
// ═══════════════════════════════════════════════════════════
function Step1Basico({ formData, updateField, sedes }: { 
  formData: TorneoFormData; 
  updateField: (field: keyof TorneoFormData, value: any) => void;
  sedes: Sede[];
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Datos Básicos</h3>
        <p className="text-gray-400 text-sm">Información general del torneo</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Nombre del Torneo <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => updateField('nombre', e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            placeholder="Ej: Torneo Apertura 2026"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Descripción</label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => updateField('descripcion', e.target.value)}
            rows={2}
            className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary resize-none"
            placeholder="Breve descripción del torneo..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Fecha Inicio <span className="text-primary">*</span>
            </label>
            <input
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => updateField('fechaInicio', e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Fecha Fin <span className="text-primary">*</span>
            </label>
            <input
              type="date"
              value={formData.fechaFin}
              onChange={(e) => updateField('fechaFin', e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Ciudad <span className="text-primary">*</span>
          </label>
          <CityAutocomplete
            value={formData.ciudad}
            onChange={(value) => updateField('ciudad', value)}
            placeholder="Busca la ciudad..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SedeAutocomplete
            value={formData.sedeId}
            displayValue={formData.sedeNombre}
            onChange={(id, nombre) => {
              updateField('sedeId', id);
              updateField('sedeNombre', nombre);
            }}
            sedes={sedes}
            label="Sede (opcional)"
          />
          <GuaraniesInput
            value={formData.costoInscripcion}
            onChange={(value) => updateField('costoInscripcion', value)}
            label="Costo Inscripción"
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 2: MODALIDAD
// ═══════════════════════════════════════════════════════════
function Step2Modalidad({ formData, toggleModalidad, modalidades }: {
  formData: TorneoFormData;
  toggleModalidad: (id: string) => void;
  modalidades: Modalidad[];
}) {
  // Según regla de negocio: máximo 1 modalidad por torneo
  // O si son compatibles, pueden ser más
  const modalidadesPY = modalidades.filter(m => m.reglas?.variante === 'PY');
  const modalidadesMundo = modalidades.filter(m => m.reglas?.variante === 'MUNDIAL');

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Selecciona Modalidad</h3>
        <p className="text-gray-400 text-sm">¿Qué formato tendrá tu torneo?</p>
      </div>

      <div className="space-y-4">
        {/* Modalidades Paraguay */}
        {modalidadesPY.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
              <span className="text-base">🇵🇾</span> Modalidades Paraguay
              <span className="text-xs text-gray-500 font-normal">(Recomendado)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modalidadesPY.map(modalidad => {
                const isSelected = formData.modalidadIds.includes(modalidad.id);
                return (
                  <motion.button
                    key={modalidad.id}
                    onClick={() => toggleModalidad(modalidad.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-[#232838] hover:border-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-white text-sm">{modalidad.nombre}</h5>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{modalidad.descripcion}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modalidades Mundo */}
        {modalidadesMundo.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
              <span className="text-base">🌍</span> Modalidades Internacionales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modalidadesMundo.map(modalidad => {
                const isSelected = formData.modalidadIds.includes(modalidad.id);
                return (
                  <motion.button
                    key={modalidad.id}
                    onClick={() => toggleModalidad(modalidad.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-[#232838] hover:border-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-white text-sm">{modalidad.nombre}</h5>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{modalidad.descripcion}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {formData.modalidadIds.length === 0 && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 text-sm text-center">
              <strong>⚠️ Importante:</strong> Debes seleccionar al menos una modalidad para continuar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 3: CATEGORÍAS
// ═══════════════════════════════════════════════════════════
function Step3Categorias({ formData, toggleCategoria, categorias }: {
  formData: TorneoFormData;
  toggleCategoria: (id: string) => void;
  categorias: Categoria[];
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Selecciona Categorías</h3>
        <p className="text-gray-400 text-sm">¿Qué niveles de juego tendrá tu torneo?</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {categorias.map((categoria, index) => {
          const isSelected = formData.categoriaIds.includes(categoria.id);
          return (
            <motion.button
              key={categoria.id}
              onClick={() => toggleCategoria(categoria.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-[#232838] hover:border-gray-600'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Medal className={`w-5 h-5 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
              <h5 className="font-semibold text-white text-xs">{categoria.nombre}</h5>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-2"
                >
                  <Check className="w-3 h-3 text-primary mx-auto" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-blue-400 text-sm text-center">
          <strong>💡 Tip:</strong> Puedes seleccionar múltiples categorías. 
          Cada una creará una competición separada dentro del torneo.
        </p>
      </div>

      {formData.categoriaIds.length === 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-400 text-sm text-center">
            <strong>⚠️ Importante:</strong> Debes seleccionar al menos una categoría para continuar.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 4: CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════
function Step4Configuracion({ formData, updateField }: {
  formData: TorneoFormData;
  updateField: (field: keyof TorneoFormData, value: any) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Configuración</h3>
        <p className="text-gray-400 text-sm">Ajusta las reglas del torneo</p>
      </div>

      <div className="space-y-4">
        <div className="glass rounded-xl p-4">
          <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            Formato de Partidos
          </h4>
          
          <div className="grid grid-cols-3 gap-3">
            {[1, 3, 5].map(sets => (
              <button
                key={sets}
                onClick={() => updateField('setsPorPartido', sets)}
                className={`py-3 rounded-xl border-2 transition-all ${
                  formData.setsPorPartido === sets
                    ? 'border-primary bg-primary/10 text-white'
                    : 'border-[#232838] text-gray-400 hover:border-gray-600'
                }`}
              >
                {sets} {sets === 1 ? 'Set' : 'Sets'}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Duración y Fechas
          </h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Minutos por partido</label>
                <input
                  type="number"
                  value={formData.minutosPorPartido}
                  onChange={(e) => updateField('minutosPorPartido', parseInt(e.target.value) || 60)}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  min={30}
                  max={180}
                  step={15}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Límite de Inscripción</label>
                <input
                  type="date"
                  value={formData.fechaLimiteInscripcion}
                  onChange={(e) => updateField('fechaLimiteInscripcion', e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            
            {!formData.fechaLimiteInscripcion && (
              <p className="text-xs text-gray-500">
                Si no especificas, se usará la fecha de inicio del torneo.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 5: PREVIEW
// ═══════════════════════════════════════════════════════════
function Step5Preview({ formData, modalidades, categorias, sedes }: {
  formData: TorneoFormData;
  modalidades: Modalidad[];
  categorias: Categoria[];
  sedes: Sede[];
}) {
  const selectedModalidades = modalidades.filter(m => formData.modalidadIds.includes(m.id));
  const selectedCategorias = categorias.filter(c => formData.categoriaIds.includes(c.id));
  const selectedSede = sedes.find(s => s.id === formData.sedeId);

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Revisa tu Torneo</h3>
        <p className="text-gray-400 text-sm">Verifica que todo esté correcto</p>
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <div className="text-center pb-4 border-b border-[#232838]">
          <h2 className="text-2xl font-bold text-white">{formData.nombre}</h2>
          {formData.descripcion && (
            <p className="text-gray-400 text-sm mt-1">{formData.descripcion}</p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 bg-[#0B0E14] rounded-lg">
            <Calendar className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-gray-500">Inicio</p>
            <p className="text-white text-sm font-medium">
              {formData.fechaInicio ? new Date(formData.fechaInicio).toLocaleDateString('es-PY') : '-'}
            </p>
          </div>
          <div className="p-3 bg-[#0B0E14] rounded-lg">
            <Calendar className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-gray-500">Fin</p>
            <p className="text-white text-sm font-medium">
              {formData.fechaFin ? new Date(formData.fechaFin).toLocaleDateString('es-PY') : '-'}
            </p>
          </div>
          <div className="p-3 bg-[#0B0E14] rounded-lg">
            <MapPin className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-gray-500">Ciudad</p>
            <p className="text-white text-sm font-medium">{formData.ciudad || '-'}</p>
          </div>
          <div className="p-3 bg-[#0B0E14] rounded-lg">
            <DollarSign className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-gray-500">Inscripción</p>
            <p className="text-white text-sm font-medium">
              {formData.costoInscripcion > 0 
                ? `Gs. ${formData.costoInscripcion.toLocaleString('es-PY')}`
                : 'Gratis'
              }
            </p>
          </div>
          <div className="p-3 bg-[#0B0E14] rounded-lg">
            <Swords className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-gray-500">Sets</p>
            <p className="text-white text-sm font-medium">{formData.setsPorPartido} sets</p>
          </div>
          <div className="p-3 bg-[#0B0E14] rounded-lg">
            <Building2 className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-gray-500">Sede</p>
            <p className="text-white text-sm font-medium truncate">
              {selectedSede?.nombre || 'No especificada'}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2">Modalidades ({selectedModalidades.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedModalidades.map(m => (
              <span key={m.id} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs">
                {m.nombre}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2">Categorías ({selectedCategorias.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedCategorias.map(c => (
              <span key={c.id} className="px-3 py-1 bg-[#232838] text-gray-300 rounded-full text-xs">
                {c.nombre}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
        <p className="text-green-400 text-sm text-center">
          <strong>🎉 Todo listo!</strong> Al crear el torneo quedará publicado 
          y los jugadores podrán inscribirse.
        </p>
      </div>
    </div>
  );
}
