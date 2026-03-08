import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, 
  Camera, ChevronRight, ChevronLeft, Check, 
  Trophy, Sparkles, Heart, Shield
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  documento: string;
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
    telefono: '',
    fechaNacimiento: '',
    genero: '',
    ciudad: '',
    password: '',
    confirmPassword: '',
    fotoUrl: '',
  });

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
                  className="w-full bg-[#1a1f2a] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                  className="w-full bg-[#1a1f2a] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                  className="w-full bg-[#1a1f2a] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                  className="w-full bg-[#1a1f2a] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="1234567"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  className="w-full bg-[#1a1f2a] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="+595 981 123456"
                />
              </div>
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
                  className="w-full bg-[#1a1f2a] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
            <motion.div variants={itemVariants} className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                Ciudad
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => updateField('ciudad', e.target.value)}
                  className="w-full bg-[#1a1f2a] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Asunción"
                />
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
                  className="w-full bg-[#1a1f2a] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                  className={`w-full bg-[#1a1f2a] border rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
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
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Foto de Perfil (Opcional)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-dark-100 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden">
                  {formData.fotoUrl ? (
                    <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-500" />
                  )}
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-primary hover:text-primary transition-colors text-sm"
                >
                  Subir foto
                </button>
              </div>
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
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-primary/10 rounded-full blur-[120px]"
        />
      </div>

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
      </motion.div>
    </div>
  );
};
