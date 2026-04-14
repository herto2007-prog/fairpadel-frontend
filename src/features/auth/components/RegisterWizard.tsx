import { useState, useEffect, useRef } from 'react';
import { useNoIndex } from '../../../hooks/useNoIndex';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Calendar, Lock, 
  Camera, ChevronRight, ChevronLeft, Check, 
  Trophy, Sparkles, Heart, Shield, ChevronDown, X
} from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { AvatarEditorModal } from '../../../components/upload/AvatarEditor';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';
import { ProfilePhotoGuidelines } from '../../../components/upload/ProfilePhotoGuidelines';
import { authService } from '../../../services/authService';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary } from '../../../services/uploadService';


interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  documento: string;
  paisTelefono: string;
  telefono: string;
  fechaNacimiento: string;
  genero: 'MASCULINO' | 'FEMENINO' | '';
  ciudad: string;
  categoria: string;
  password: string;
  confirmPassword: string;
  fotoUrl: string;
  consentCheckboxWhatsapp: boolean;
}

const steps = [
  { id: 1, title: '¿Quién eres?', subtitle: 'Cuéntanos un poco de ti', icon: User },
  { id: 2, title: 'Tus datos', subtitle: 'Para mantenernos en contacto', icon: Phone },
  { id: 3, title: 'Perfil', subtitle: 'Personaliza tu cuenta', icon: Camera },
  { id: 4, title: '¡Listo!', subtitle: 'Bienvenido a FairPadel', icon: Trophy },
];

// Países con códigos de teléfono
const countries = [
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
];

// Categorías de pádel en Paraguay (sistema oficial)
// Ordenado de más alta (1ra) a más baja (Principiante) para el dropdown
// Los ascensos son automáticos según campeonatos ganados
const categoriasPadel = [
  { 
    id: '1ª Categoría', 
    nombre: '1ª Categoría', 
    descripcion: 'Elite. Nivel profesional. Alto rendimiento.',
    nivel: 8 
  },
  { 
    id: '2ª Categoría', 
    nombre: '2ª Categoría', 
    descripcion: 'Muy avanzado. Gana torneos importantes.',
    nivel: 7 
  },
  { 
    id: '3ª Categoría', 
    nombre: '3ª Categoría', 
    descripcion: 'Nivel avanzado. Destaca en torneos departamentales.',
    nivel: 6 
  },
  { 
    id: '4ª Categoría', 
    nombre: '4ª Categoría', 
    descripcion: 'Intermedio alto. Competencia constante.',
    nivel: 5 
  },
  { 
    id: '5ª Categoría', 
    nombre: '5ª Categoría', 
    descripcion: 'Intermedio. Buenos resultados en torneos locales.',
    nivel: 4 
  },
  { 
    id: '6ª Categoría', 
    nombre: '6ª Categoría', 
    descripcion: 'Nivel intermedio bajo. Participación regular en torneos.',
    nivel: 3 
  },
  { 
    id: '7ª Categoría', 
    nombre: '7ª Categoría', 
    descripcion: 'Primeros pasos en competencia amateur.',
    nivel: 2 
  },
  { 
    id: '8ª Categoría', 
    nombre: '8ª Categoría', 
    descripcion: 'Primera categoría oficial. Nivel básico de competencia.',
    nivel: 1 
  },
  { 
    id: 'Principiante', 
    nombre: 'Principiante', 
    descripcion: 'Estás comenzando. Aún no tienes categoría oficial.',
    nivel: 0 
  },
];



const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  },
  exit: { opacity: 0 }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  })
};

export const RegisterWizard = () => {
  useNoIndex();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirigir si ya está autenticado
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    email: '',
    documento: '',
    paisTelefono: 'PY',
    telefono: '',
    fechaNacimiento: '',
    genero: '',
    ciudad: '',
    categoria: '',
    password: '',
    confirmPassword: '',
    fotoUrl: '',
    consentCheckboxWhatsapp: false,
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showPhotoGuidelines, setShowPhotoGuidelines] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep === 3) {
        handleSubmit();
      } else {
        setDirection(1);
        setCurrentStep(prev => Math.min(prev + 1, 4));
      }
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.nombre && formData.apellido && formData.email;
      case 2:
        return formData.documento && formData.telefono && formData.fechaNacimiento && formData.genero;
      case 3:
        return formData.ciudad && formData.categoria && formData.password && formData.password === formData.confirmPassword;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setRegistrationError(null);

    // Guardar email para reenvío de verificación
    localStorage.setItem('pendingVerificationEmail', formData.email);

    try {
      // Llamada real a la API
      await authService.register({
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellido: formData.apellido,
        documento: formData.documento,
        telefono: `${countries.find(c => c.code === formData.paisTelefono)?.dialCode}${formData.telefono}`,
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.genero as 'MASCULINO' | 'FEMENINO',
        ciudad: formData.ciudad,
        categoria: formData.categoria,
        fotoUrl: formData.fotoUrl,
        consentCheckboxWhatsapp: formData.consentCheckboxWhatsapp,
      });

      setRegistrationSuccess(true);
      setDirection(1);
      setCurrentStep(4);
    } catch (error: any) {
      console.error('Error en registro:', error);
      const message = error.response?.data?.message || 'Error al crear cuenta. Intenta nuevamente.';
      setRegistrationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            <motion.div variants={itemVariants} className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Tu nombre"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                Apellido
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => updateField('apellido', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Tu apellido"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="tu@email.com"
                />
              </div>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            <motion.div variants={itemVariants} className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                Documento de Identidad
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={formData.documento}
                  onChange={(e) => updateField('documento', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="1234567"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                Teléfono
              </label>
              <div className="relative flex" ref={countryDropdownRef}>
                {/* Country Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="h-full px-4 bg-dark-100 border border-r-0 border-gray-700 rounded-l-xl flex items-center gap-2 hover:border-primary transition-colors min-w-[110px]"
                  >
                    <span className="text-xl">{countries.find(c => c.code === formData.paisTelefono)?.flag}</span>
                    <span className="text-gray-300 text-sm">{countries.find(c => c.code === formData.paisTelefono)?.dialCode}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {/* Dropdown */}
                  <AnimatePresence>
                    {showCountryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto glass rounded-xl border border-gray-700 z-50"
                      >
                        {countries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              updateField('paisTelefono', country.code);
                              setShowCountryDropdown(false);
                            }}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-dark-100 transition-colors text-left ${
                              formData.paisTelefono === country.code ? 'bg-dark-100' : ''
                            }`}
                          >
                            <span className="text-2xl">{country.flag}</span>
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">{country.name}</p>
                              <p className="text-gray-500 text-xs">{country.dialCode}</p>
                            </div>
                            {formData.paisTelefono === country.code && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Phone Input */}
                <div className="relative flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => updateField('telefono', e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-dark-100 border border-gray-700 rounded-r-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-l-none"
                    placeholder="981 123456"
                  />
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Código país: {countries.find(c => c.code === formData.paisTelefono)?.dialCode} • Sin 0 inicial
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                Fecha de Nacimiento
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => updateField('fechaNacimiento', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Género
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => updateField('genero', 'MASCULINO')}
                  className={`py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    formData.genero === 'MASCULINO'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Masculino
                </button>
                <button
                  type="button"
                  onClick={() => updateField('genero', 'FEMENINO')}
                  className={`py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    formData.genero === 'FEMENINO'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-500'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  Femenino
                </button>
              </div>
            </motion.div>

            {/* Checkbox de consentimiento WhatsApp */}
            <motion.div variants={itemVariants} className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={formData.consentCheckboxWhatsapp}
                    onChange={(e) => updateField('consentCheckboxWhatsapp', e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-gray-600 rounded bg-dark-100 peer-checked:bg-primary peer-checked:border-primary transition-all">
                    <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Quiero recibir notificaciones por WhatsApp
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Te enviaremos recordatorios de reservas, actualizaciones de torneos y más. 
                    Podés cancelar en cualquier momento.
                  </p>
                </div>
              </label>
            </motion.div>
          </motion.div>
        );

      case 3:
        if (registrationSuccess) {
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¡Cuenta creada!</h3>
              <p className="text-gray-400 text-sm mb-4">
                Tu registro ya fue completado exitosamente.
              </p>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="text-primary hover:underline text-sm"
              >
                Ver confirmación →
              </button>
            </motion.div>
          );
        }

        return (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            <motion.div variants={itemVariants}>
              <CityAutocomplete
                value={formData.ciudad}
                onChange={(value) => updateField('ciudad', value)}
                label="Ciudad"
                placeholder="Busca tu ciudad..."
              />
            </motion.div>

            {/* Selector de Categoría */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tu Categoría de Juego <span className="text-primary">*</span>
              </label>
              
              <div className="relative">
                <select
                  value={formData.categoria}
                  onChange={(e) => updateField('categoria', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-4 pr-12 text-white appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="" disabled className="bg-dark-100 text-gray-500">
                    Selecciona tu categoría
                  </option>
                  {categoriasPadel.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-dark-100 text-white py-2">
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
              
              {formData.categoria && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-gray-500 text-xs mt-2"
                >
                  {categoriasPadel.find(c => c.id === formData.categoria)?.descripcion}
                </motion.p>
              )}
              
              {/* Advertencia de sandbagging */}
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-xs">
                  <strong>⚠️ Importante:</strong> Jugadores que se inscriban en categorías inferiores a su nivel real (sandbagging) 
                  podrán ser suspendidos y descalificados de torneos. Se honesto, aquí tu historial queda registrado y es visible para todos, 
                  una buena conducta deportiva marcará tu ascensión en FairPadel.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className={`w-full bg-dark-100 border rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-700 focus:border-primary focus:ring-primary/20'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-sm mt-2">
                  Las contraseñas no coinciden
                </motion.p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              {!formData.fotoUrl ? (
                <div>
                  {/* Label persuasivo */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">
                      Foto de Competidor
                    </label>
                    <span className="text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded-full">
                      Recomendado
                    </span>
                  </div>
                  
                  {/* Upload area */}
                  <div 
                    onClick={() => document.getElementById('avatar-input')?.click()}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-square max-w-[200px] mx-auto rounded-2xl border-2 border-dashed border-gray-700 group-hover:border-primary transition-all bg-dark-100/50 flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Silueta de persona */}
                      <div className="w-20 h-20 rounded-full bg-dark-200 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors border-2 border-dashed border-gray-600 group-hover:border-primary/50">
                        <User className="w-10 h-10 text-gray-500 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-white text-sm text-center font-medium">Tu cara, tu identidad</p>
                      <p className="text-gray-500 text-xs text-center mt-1">Haz clic para subir</p>
                      
                      {/* Efecto hover */}
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAvatarFile(file);
                          setShowAvatarEditor(true);
                          setShowPhotoGuidelines(false);
                        }
                      }}
                    />
                  </div>
                  
                  {/* Guías de foto */}
                  <ProfilePhotoGuidelines isVisible={showPhotoGuidelines} />
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <label className="text-sm font-medium text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Foto de Competidor
                    </label>
                  </div>
                  <div className="relative inline-block">
                    <img
                      src={formData.fotoUrl}
                      alt="Avatar"
                      className="w-32 h-32 rounded-full object-cover border-4 border-green-500/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => document.getElementById('avatar-input-change')?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-dark-100 hover:bg-primary/20 border border-gray-700 hover:border-primary/50 rounded-lg text-gray-300 hover:text-primary transition-colors text-sm"
                      title="Cambiar foto"
                    >
                      <Camera className="w-4 h-4" />
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateField('fotoUrl', '');
                        setShowPhotoGuidelines(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-dark-100 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 rounded-lg text-gray-300 hover:text-red-400 transition-colors text-sm"
                      title="Eliminar foto"
                    >
                      <X className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                  
                  {/* Input file oculto para cambiar foto */}
                  <input
                    id="avatar-input-change"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarFile(file);
                        setShowAvatarEditor(true);
                      }
                    }}
                  />
                  
                  <p className="text-gray-400 text-xs mt-3">
                    Tu foto será visible en brackets y rankings
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-red-600 flex items-center justify-center"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-4"
            >
              ¡Todo listo, {formData.nombre}!
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mb-8"
            >
              Tu cuenta ha sido creada exitosamente. <br />
              Ahora eres parte de la comunidad FairPadel.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3 mb-6"
            >
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-green-500" />
                <span>Cuenta creada</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-green-500" />
                <span>Perfil configurado</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-500">Email pendiente de verificación</span>
              </div>
            </motion.div>

            {/* Alerta importante */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-left"
            >
              <p className="text-yellow-400 text-sm">
                <strong>Importante:</strong> Te enviamos un email de verificación a <span className="text-white">{formData.email}</span>. 
                Debes verificar tu cuenta antes de inscribirte en torneos.
              </p>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      {/* Background Effects - Reutilizable */}
      <BackgroundEffects variant="subtle" showGrid={true} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, _index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <motion.div 
                  key={step.id}
                  className="flex flex-col items-center"
                  animate={{ scale: isActive ? 1.1 : 1 }}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-dark-100 text-gray-500 border border-gray-700'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <span className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-gray-500'
                  }`}>
                    Paso {step.id}
                  </span>
                </motion.div>
              );
            })}
          </div>
          
          {/* Progress Bar */}
          <div className="h-1 bg-dark-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 4) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h2 
              key={currentStep}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-2"
            >
              {steps[currentStep - 1].title}
            </motion.h2>
            <motion.p 
              key={`subtitle-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400"
            >
              {steps[currentStep - 1].subtitle}
            </motion.p>
          </div>

          {/* Step Content */}
          <div className="min-h-[320px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
            {currentStep === 4 ? (
              <div />
            ) : (
              <motion.button
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={currentStep === 1 ? () => navigate('/') : handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
                {currentStep === 1 ? 'Cancelar' : 'Atrás'}
              </motion.button>
            )}

            {currentStep < 4 ? (
              <div className="flex flex-col items-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  disabled={!validateStep() || isSubmitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
                >
                  {isSubmitting && currentStep === 3 ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      {currentStep === 3 ? 'Crear mi cuenta' : 'Siguiente'}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
                {currentStep === 3 && registrationError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm text-right max-w-[260px]"
                  >
                    {registrationError}
                  </motion.p>
                )}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
              >
                <Check className="w-5 h-5" />
                Ir al login
              </motion.button>
            )}
          </div>
        </div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-500 text-sm mt-6"
        >
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Inicia sesión aquí
          </Link>
        </motion.p>

        {/* Avatar Editor Modal */}
        <AnimatePresence>
          {showAvatarEditor && avatarFile && (
            <AvatarEditorModal
              image={avatarFile}
              onSave={async (dataUrl) => {
                setIsUploadingPhoto(true);
                try {
                  // Subir a Cloudinary
                  const cloudinaryUrl = await uploadToCloudinary(dataUrl, 'avatars');
                  setFormData(prev => ({ ...prev, fotoUrl: cloudinaryUrl }));
                  setShowAvatarEditor(false);
                  setAvatarFile(null);
                } catch (error: any) {
                  console.error('Error subiendo foto:', error);
                  // Fallback: guardar base64 temporalmente
                  setFormData(prev => ({ ...prev, fotoUrl: dataUrl }));
                  setShowAvatarEditor(false);
                  setAvatarFile(null);
                } finally {
                  setIsUploadingPhoto(false);
                }
              }}
              onCancel={() => {
                setShowAvatarEditor(false);
                setAvatarFile(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* Loading overlay para upload */}
        {isUploadingPhoto && (
          <div className="fixed inset-0 z-[60] bg-dark/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"
              />
              <p className="text-white font-medium">Subiendo foto...</p>
              <p className="text-gray-400 text-sm">Esto puede tomar unos segundos</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
