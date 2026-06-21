import { useState } from 'react';
import { useNoIndex } from '../../../hooks/useNoIndex';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { authService } from '../../../services/authService';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';

/**
 * Registro mínimo (mobile-first): nombre, apellido, email y contraseña.
 * Los demás datos (documento, categoría, etc.) se piden just-in-time al
 * inscribirse a un torneo. Tras crear la cuenta, el usuario queda logueado.
 */
export const RegisterWizard = () => {
  useNoIndex();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();

  const [searchParams] = useSearchParams();
  // Si llega desde el email de invitación (/register?email=...), precargamos el email.
  const [form, setForm] = useState({ nombre: '', apellido: '', email: searchParams.get('email') || '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const setField = (campo: keyof typeof form, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const puedeEnviar =
    form.nombre.trim().length >= 2 &&
    form.apellido.trim().length >= 2 &&
    emailValido &&
    form.password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEnviar || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await authService.register({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      // Entrar directo (el backend permite navegar sin verificar el email aún)
      await login(form.email.trim(), form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo crear la cuenta. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-dark-100 border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <BackgroundEffects variant="subtle" showGrid={true} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Creá tu cuenta</h1>
            <p className="text-gray-400 text-sm">Es gratis y toma menos de un minuto.</p>
          </div>

          <GoogleSignInButton onError={setError} />

          <div className="flex items-center gap-3 my-5 text-gray-500 text-xs">
            <span className="flex-1 h-px bg-gray-700" />
            o con tu email
            <span className="flex-1 h-px bg-gray-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setField('nombre', e.target.value)}
                  className={inputClass}
                  placeholder="Nombre"
                  autoComplete="given-name"
                />
              </div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={form.apellido}
                  onChange={(e) => setField('apellido', e.target.value)}
                  className={inputClass}
                  placeholder="Apellido"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className={inputClass}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                className={inputClass + ' pr-12'}
                placeholder="Contraseña (mínimo 6)"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={!puedeEnviar || submitting}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
            >
              {submitting ? (
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
                  Crear cuenta
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-4">
            Al crear tu cuenta aceptás las normativas de FairPadel.
          </p>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
