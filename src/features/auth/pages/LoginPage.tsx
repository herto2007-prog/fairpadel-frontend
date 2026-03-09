import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, 
  CheckCircle, Sparkles, ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { authService } from '../../../services/authService';

export const LoginPage = () => {
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    
    try {
      await authService.login({ documento, password });
      navigate('/novedades');
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await authService.forgotPassword({ email: forgotEmail });
      setResetSent(true);
    } catch (err: any) {
      // Por seguridad, no mostramos error
      setResetSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      {/* Background Effects */}
      <BackgroundEffects variant="subtle" showGrid={true} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              filter: [
                "drop-shadow(0 0 20px rgba(223, 37, 49, 0.3))",
                "drop-shadow(0 0 40px rgba(223, 37, 49, 0.6))",
                "drop-shadow(0 0 20px rgba(223, 37, 49, 0.3))"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-4"
          >
            <img 
              src="https://res.cloudinary.com/dncjaaybv/image/upload/v1773057029/logo_h4y1tl.png" 
              alt="FairPadel" 
              className="h-20 w-auto mx-auto"
            />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Bienvenido de vuelta</h1>
          <p className="text-gray-400 mt-2">Inicia sesión para continuar</p>
        </motion.div>

        {/* Card */}
        <div className="glass rounded-3xl p-8">
          <AnimatePresence mode="wait">
            {!showForgotPassword ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                {/* Documento */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                    Cédula de Identidad
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value)}
                      className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="1234567"
                      required
                    />
                  </div>
                </div>

                {/* Error */}
                {loginError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {loginError}
                  </div>
                )}

                {/* Password */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-gray-400 hover:text-primary transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-4 rounded-xl font-medium transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {!resetSent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver al login
                    </button>

                    <div className="text-center mb-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Recuperar contraseña</h3>
                      <p className="text-gray-400 text-sm">
                        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                      </p>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          placeholder="tu@email.com"
                          required
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-4 rounded-xl font-medium transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        'Enviar enlace'
                      )}
                    </motion.button>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                    >
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </motion.div>
                    
                    <h3 className="text-xl font-bold text-white mb-4">
                      ¡Revisa tu email!
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Hemos enviado un enlace de recuperación a <br />
                      <span className="text-primary">{forgotEmail}</span>
                    </p>

                    <button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetSent(false);
                        setForgotEmail('');
                      }}
                      className="text-primary hover:underline"
                    >
                      Volver al login
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-500 text-sm mt-6"
        >
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Regístrate gratis
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};
