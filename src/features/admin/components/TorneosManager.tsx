import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Calendar, MapPin, DollarSign, 
  Check, ChevronRight, ChevronLeft, Sparkles,
  Clock, Building2,
  Settings2, Medal, Swords, Crown
} from 'lucide-react';

import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';

// Tipos
interface TorneoFormData {
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion: string;
  ciudad: string;
  costoInscripcion: number;
  sedeId: string;
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
  { id: 1, title: 'Datos Básicos', subtitle: 'Información general del torneo', icon: Trophy },
  { id: 2, title: 'Modalidad', subtitle: 'Tipo de competición', icon: Swords },
  { id: 3, title: 'Categorías', subtitle: 'Niveles de juego', icon: Medal },
  { id: 4, title: 'Configuración', subtitle: 'Reglas del torneo', icon: Settings2 },
  { id: 5, title: 'Preview', subtitle: 'Revisa y publica', icon: Sparkles },
];

export function TorneosManager() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [torneoCreado, setTorneoCreado] = useState<any>(null);
  
  // Datos del wizard
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
    flyerUrl: '',
    modalidadIds: [],
    categoriaIds: [],
    setsPorPartido: 3,
    minutosPorPartido: 60,
  });

  useEffect(() => {
    loadDatosWizard();
  }, []);

  const loadDatosWizard = async () => {
    try {
      const response = await fetch('/api/admin/torneos/datos/wizard');
      const data = await response.json();
      if (data.success) {
        setSedes(data.sedes);
        setModalidades(data.modalidades);
        setCategorias(data.categorias);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
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
    if (validateStep()) {
      setDirection(1);
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.nombre && formData.ciudad && formData.fechaInicio && formData.fechaFin;
      case 2:
        return formData.modalidadIds.length > 0;
      case 3:
        return formData.categoriaIds.length > 0;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Paso 1: Crear torneo básico
      const response = await fetch('/api/admin/torneos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin,
          fechaLimiteInscripcion: formData.fechaLimiteInscripcion || formData.fechaInicio,
          ciudad: formData.ciudad,
          costoInscripcion: formData.costoInscripcion,
          sedeId: formData.sedeId || undefined,
        }),
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      
      const torneoId = data.torneo.id;

      // Paso 2: Asignar modalidades
      if (formData.modalidadIds.length > 0) {
        await fetch(`/api/admin/torneos/${torneoId}/modalidades`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modalidadIds: formData.modalidadIds }),
        });
      }

      // Paso 3: Asignar categorías
      if (formData.categoriaIds.length > 0) {
        await fetch(`/api/admin/torneos/${torneoId}/categorias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoriaIds: formData.categoriaIds }),
        });
      }

      // Paso 4: Configurar reglas
      await fetch(`/api/admin/torneos/${torneoId}/configuracion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setsPorPartido: formData.setsPorPartido,
          minutosPorPartido: formData.minutosPorPartido,
        }),
      });

      // Publicar
      await fetch(`/api/admin/torneos/${torneoId}/publicar`, {
        method: 'PUT',
      });

      setTorneoCreado(data.torneo);
      setMessage({ type: 'success', text: '¡Torneo creado y publicado exitosamente!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error creando torneo' });
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-1 relative">
                {/* Línea conectora */}
                {index < steps.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-800 -z-10">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? '100%' : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
                
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-dark-100 text-gray-500 border border-gray-700'
                  }`}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
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
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl mb-6 ${
            message.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
          }`}
        >
          <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {message.text}
          </span>
        </motion.div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-3xl p-8"
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
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Atrás
        </button>

        {currentStep < 5 ? (
          <button
            onClick={handleNext}
            disabled={!validateStep()}
            className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
          >
            Siguiente
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
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
// PASO 1: DATOS BÁSICOS
// ═══════════════════════════════════════════════════════════
function Step1Basico({ formData, updateField, sedes }: { 
  formData: TorneoFormData; 
  updateField: (field: keyof TorneoFormData, value: any) => void;
  sedes: Sede[];
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Datos Básicos</h3>
        <p className="text-gray-400">Comencemos con la información general de tu torneo</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Nombre del Torneo *</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => updateField('nombre', e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            placeholder="Ej: Torneo de Verano 2026"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Descripción</label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => updateField('descripcion', e.target.value)}
            rows={3}
            className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary resize-none"
            placeholder="Describe tu torneo..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Fecha de Inicio *</label>
            <input
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => updateField('fechaInicio', e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Fecha de Fin *</label>
            <input
              type="date"
              value={formData.fechaFin}
              onChange={(e) => updateField('fechaFin', e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Ciudad *</label>
          <CityAutocomplete
            value={formData.ciudad}
            onChange={(value) => updateField('ciudad', value)}
            placeholder="Busca la ciudad..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Sede (opcional)</label>
            <select
              value={formData.sedeId}
              onChange={(e) => updateField('sedeId', e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            >
              <option value="">Seleccionar sede...</option>
              {sedes.map(sede => (
                <option key={sede.id} value={sede.id}>{sede.nombre} - {sede.ciudad}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Costo de Inscripción (Gs.)</label>
            <input
              type="number"
              value={formData.costoInscripcion}
              onChange={(e) => updateField('costoInscripcion', parseInt(e.target.value) || 0)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
              placeholder="0"
            />
          </div>
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
  const modalidadesPY = modalidades.filter(m => m.reglas?.variante === 'PY');
  const modalidadesMundo = modalidades.filter(m => m.reglas?.variante === 'MUNDIAL');

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Selecciona la Modalidad</h3>
        <p className="text-gray-400">¿Qué formato tendrá tu torneo?</p>
      </div>

      <div className="space-y-6">
        {/* Modalidades Paraguay */}
        <div>
          <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
            <span className="text-lg">🇵🇾</span> Modalidades Paraguay
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modalidadesPY.map(modalidad => (
              <motion.button
                key={modalidad.id}
                onClick={() => toggleModalidad(modalidad.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.modalidadIds.includes(modalidad.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-[#232838] hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-white">{modalidad.nombre}</h5>
                    <p className="text-xs text-gray-400 mt-1">{modalidad.descripcion}</p>
                  </div>
                  {formData.modalidadIds.includes(modalidad.id) && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Modalidades Mundo */}
        <div>
          <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
            <span className="text-lg">🌍</span> Modalidades Internacionales
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modalidadesMundo.map(modalidad => (
              <motion.button
                key={modalidad.id}
                onClick={() => toggleModalidad(modalidad.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.modalidadIds.includes(modalidad.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-[#232838] hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-white">{modalidad.nombre}</h5>
                    <p className="text-xs text-gray-400 mt-1">{modalidad.descripcion}</p>
                  </div>
                  {formData.modalidadIds.includes(modalidad.id) && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Selecciona Categorías</h3>
        <p className="text-gray-400">¿Qué niveles de juego tendrá tu torneo?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categorias.map((categoria, index) => (
          <motion.button
            key={categoria.id}
            onClick={() => toggleCategoria(categoria.id)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              formData.categoriaIds.includes(categoria.id)
                ? 'border-primary bg-primary/10'
                : 'border-[#232838] hover:border-gray-600'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Medal className={`w-6 h-6 mx-auto mb-2 ${
              formData.categoriaIds.includes(categoria.id) ? 'text-primary' : 'text-gray-500'
            }`} />
            <h5 className="font-semibold text-white text-sm">{categoria.nombre}</h5>
            {formData.categoriaIds.includes(categoria.id) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-2"
              >
                <Check className="w-4 h-4 text-primary mx-auto" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <p className="text-yellow-400 text-sm">
          <strong>💡 Tip:</strong> Puedes seleccionar múltiples categorías. 
          Cada categoría creará una competición separada dentro del torneo.
        </p>
      </div>
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Configuración del Torneo</h3>
        <p className="text-gray-400">Ajusta las reglas y parámetros</p>
      </div>

      <div className="space-y-6">
        <div className="glass rounded-2xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Formato de Partidos
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sets por Partido</label>
              <div className="flex items-center gap-4">
                {[1, 3, 5].map(sets => (
                  <button
                    key={sets}
                    onClick={() => updateField('setsPorPartido', sets)}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${
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

            <div>
              <label className="block text-sm text-gray-400 mb-2">Duración Estimada (min)</label>
              <input
                type="number"
                value={formData.minutosPorPartido}
                onChange={(e) => updateField('minutosPorPartido', parseInt(e.target.value) || 60)}
                className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Fechas Importantes
          </h4>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Límite de Inscripción</label>
            <input
              type="date"
              value={formData.fechaLimiteInscripcion}
              onChange={(e) => updateField('fechaLimiteInscripcion', e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-gray-500 mt-2">
              Fecha límite para que los jugadores se inscriban al torneo
            </p>
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Revisa tu Torneo</h3>
        <p className="text-gray-400">Todo listo para crear tu torneo</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="text-center pb-6 border-b border-[#232838]">
          <h2 className="text-3xl font-bold text-white">{formData.nombre}</h2>
          {formData.descripcion && (
            <p className="text-gray-400 mt-2">{formData.descripcion}</p>
          )}
        </div>

        {/* Grid de info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0B0E14] rounded-xl">
            <Calendar className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-gray-500">Inicio</p>
            <p className="text-white font-medium">{formData.fechaInicio}</p>
          </div>
          <div className="p-4 bg-[#0B0E14] rounded-xl">
            <Calendar className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-gray-500">Fin</p>
            <p className="text-white font-medium">{formData.fechaFin}</p>
          </div>
          <div className="p-4 bg-[#0B0E14] rounded-xl">
            <MapPin className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-gray-500">Ciudad</p>
            <p className="text-white font-medium">{formData.ciudad}</p>
          </div>
          <div className="p-4 bg-[#0B0E14] rounded-xl">
            <DollarSign className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-gray-500">Inscripción</p>
            <p className="text-white font-medium">Gs. {formData.costoInscripcion.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-[#0B0E14] rounded-xl">
            <Swords className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-gray-500">Sets</p>
            <p className="text-white font-medium">{formData.setsPorPartido} sets</p>
          </div>
          <div className="p-4 bg-[#0B0E14] rounded-xl">
            <Building2 className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-gray-500">Sede</p>
            <p className="text-white font-medium">{selectedSede?.nombre || 'No especificada'}</p>
          </div>
        </div>

        {/* Modalidades */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Modalidades</h4>
          <div className="flex flex-wrap gap-2">
            {selectedModalidades.map(m => (
              <span key={m.id} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                {m.nombre}
              </span>
            ))}
          </div>
        </div>

        {/* Categorías */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Categorías</h4>
          <div className="flex flex-wrap gap-2">
            {selectedCategorias.map(c => (
              <span key={c.id} className="px-3 py-1 bg-[#232838] text-gray-300 rounded-full text-sm">
                {c.nombre}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
        <p className="text-green-400 text-sm text-center">
          <strong>🎉 Todo listo!</strong> Al hacer clic en "Crear Torneo", tu competición quedará publicada 
          y los jugadores podrán inscribirse.
        </p>
      </div>
    </div>
  );
}
