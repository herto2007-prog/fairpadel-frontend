import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, X, Loader2, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { useNoIndex } from '../../../hooks/useNoIndex';
import { api } from '../../../services/api';

type VerificationState = 'verifying' | 'success' | 'error' | 'expired';

export const VerifyEmailPage = () => {
  useNoIndex();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('Token no proporcionado');
      return;
    }

    verifyEmail();
  }, [token]);

  useEffect(() => {
    if (state === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (state === 'success' && countdown === 0) {
      navigate('/login');
    }
  }, [state, countdown, navigate]);

  const verifyEmail = async () => {
    try {
      await api.get(`/auth/verify-email?token=${token}`);
      setState('success');
    } catch (error: any) {
      if (error.response?.data?.message?.includes('expirado')) {
        setState('expired');
      } else {
        setState('error');
        setErrorMessage(error.response?.data?.message || 'Error al verificar email');
      }
    }
  };

  const handleResend = async () => {
    // Obtener el email del localStorage o pedirlo al usuario
    const email = localStorage.getItem('pendingVerificationEmail');
    
    if (!email) {
      setErrorMessage('Por favor inicia sesión para reenviar el email de verificación');
      return;
    }

    setIsResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setResendSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Error al reenviar email');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'verifying':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-primary/20 border-t-primary"
            />
            <h2 className="text-2xl font-bold text-white mb-2">Verificando tu email...</h2>
            <p className="text-gray-400">Por favor espera un momento</p>
          </motion.div>
        );

      case 'success':
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
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center"
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-white mb-4">¡Email verificado!</h2>
            <p className="text-gray-400 mb-6">
              Tu cuenta ha sido activada exitosamente.<br />
              Ahora puedes inscribirte en torneos.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
              <span>Redirigiendo en {countdown} segundos...</span>
            </div>
            
            <Link
              to="/login"
              className="btn-primary inline-flex items-center gap-2"
            >
              Ir al login
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        );

      case 'expired':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center"
            >
              <Mail className="w-12 h-12 text-yellow-500" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Link expirado</h2>
            <p className="text-gray-400 mb-6">
              El link de verificación ha expirado.<br />
              Los links son válidos por 24 horas.
            </p>

            {resendSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6"
              >
                <p className="text-green-400 text-sm">
                  ✓ Email de verificación reenviado. Revisa tu bandeja de entrada.
                </p>
              </motion.div>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Reenviar email
                  </>
                )}
              </button>
            )}
            
            <div className="mt-6">
              <Link to="/login" className="text-primary hover:underline text-sm">
                Volver al login
              </Link>
            </div>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center"
            >
              <X className="w-12 h-12 text-red-500" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Error de verificación</h2>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            
            <div className="space-y-3">
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2"
              >
                Ir al login
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <BackgroundEffects variant="subtle" />
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
};
