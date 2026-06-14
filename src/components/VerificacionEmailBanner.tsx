import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { authService } from '../services/authService';
import { useToast } from './ui/ToastProvider';

const DISMISS_KEY = 'verif_email_banner_dismissed';

/**
 * Aviso suave (no bloqueante) para usuarios con el email sin verificar.
 * Permite reenviar el email de verificación con un clic. Se puede cerrar por
 * la sesión actual. No aparece para usuarios ya verificados (estado != NO_VERIFICADO).
 */
export function VerificacionEmailBanner() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
  const [enviando, setEnviando] = useState(false);

  if (!user || (user as any).estado !== 'NO_VERIFICADO' || dismissed) return null;

  const reenviar = async () => {
    setEnviando(true);
    try {
      await authService.resendVerification(user.email);
      showSuccess('Email enviado', `Te reenviamos el link de verificación a ${user.email}`);
    } catch {
      showError('Error', 'No se pudo reenviar el email. Probá de nuevo en un rato.');
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 text-sm">
        <Mail className="w-4 h-4 flex-shrink-0" />
        <p className="flex-1 min-w-0">
          Verificá tu email para no perderte los avisos de torneos.{' '}
          <span className="hidden sm:inline">Te enviamos un link a <span className="font-medium">{user.email}</span>.</span>
        </p>
        <button
          onClick={reenviar}
          disabled={enviando}
          className="px-3 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-medium transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {enviando ? 'Enviando...' : 'Reenviar'}
        </button>
        <button onClick={cerrar} aria-label="Cerrar aviso" className="text-amber-300/60 hover:text-amber-200 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
