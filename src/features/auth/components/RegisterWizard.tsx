import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Calendar, Lock, 
  Camera, ChevronRight, ChevronLeft, Check, 
  Trophy, Sparkles, Heart, Shield, ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { AvatarEditorModal } from '../../../components/upload/AvatarEditor';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';

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
  password: string;
  confirmPassword: string;
  fotoUrl: string;
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
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
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
    password: '',
    confirmPassword: '',
    fotoUrl: '',
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (validateStep()) {
      setDirection(1);
      setCurrentStep(prev => Math.min(prev + 1, 4));
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
        return formData.ciudad && formData.password && formData.password === formData.confirmPassword;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simular llamada API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    // Redirigir a login
    setTimeout(() => navigate('/login'), 1000);
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
          </motion.div>
        );

      case 3:
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
                <div 
                  onClick={() => document.getElementById('avatar-input')?.click()}
                  className="cursor-pointer group"
                >
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Foto de Perfil (Opcional)
                  </label>
                  <div className="aspect-square max-w-[200px] mx-auto rounded-2xl border-2 border-dashed border-gray-700 group-hover:border-primary transition-all bg-dark-100/50 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-dark-100 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                      <Camera className="w-8 h-8 text-gray-500 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-gray-400 text-sm text-center">Haz clic para personalizar</p>
                    <p className="text-gray-500 text-xs text-center mt-1">Máx 5MB</p>
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
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Foto de Perfil
                  </label>
                  <div className="relative inline-block">
                    <img
                      src={formData.fotoUrl}
                      alt="Avatar"
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => updateField('fotoUrl', '')}
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-dark-100 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </div>
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
              className="space-y-3"
            >
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-green-500" />
                <span>Email verificado</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-green-500" />
                <span>Perfil creado</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-green-500" />
                <span>Listo para jugar</span>
              </div>
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
            <motion.button
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={currentStep === 1 ? () => navigate('/') : handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              {currentStep === 1 ? 'Cancelar' : 'Atrás'}
            </motion.button>

            {currentStep < 4 ? (
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={!validateStep()}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
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
                    <Check className="w-5 h-5" />
                    ¡Comenzar!
                  </>
                )}
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
                setFormData(prev => ({ ...prev, fotoUrl: dataUrl }));
                setShowAvatarEditor(false);
                setAvatarFile(null);
                // Aquí podrías subir el dataUrl a Cloudinary
              }}
              onCancel={() => {
                setShowAvatarEditor(false);
                setAvatarFile(null);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
