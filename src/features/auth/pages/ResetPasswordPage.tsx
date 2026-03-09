import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { authService } from '../../../services/authService';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token inválido o expirado. Solicita un nuevo link de recuperación.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({ token: token!, password });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al resetear la contraseña. El link puede haber expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
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
          <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
          <p className="text-gray-400 mt-2">
            Crea una nueva contraseña para tu cuenta
          </p>
        </div>

        <div className="glass rounded-3xl p-8">
          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">¡Contraseña actualizada!</h2>
              <p className="text-gray-400 mb-6">
                Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login en unos segundos.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-600 rounded-xl text-white hover:bg-white/5 transition-colors"
              >
                Ir al login ahora
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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

              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-primary transition-colors">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                    className="w-full bg-dark-100 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading || !token}
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
                  'Cambiar contraseña'
                )}
              </motion.button>

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
