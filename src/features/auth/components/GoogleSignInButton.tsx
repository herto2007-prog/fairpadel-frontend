import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_CLIENT_ID } from '../../../config/google';

interface Props {
  onError?: (mensaje: string) => void;
}

/**
 * Botón "Continuar con Google". Solo se muestra si está configurado
 * VITE_GOOGLE_CLIENT_ID. Al autenticar, guarda el token, sincroniza el
 * contexto y navega al dashboard.
 */
export function GoogleSignInButton({ onError }: Props) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={async (resp) => {
          if (!resp.credential) {
            onError?.('No se recibió el token de Google');
            return;
          }
          try {
            await authService.googleLogin(resp.credential);
            await refreshUser();
            navigate('/dashboard');
          } catch (e: any) {
            onError?.(e?.response?.data?.message || 'No se pudo entrar con Google');
          }
        }}
        onError={() => onError?.('No se pudo entrar con Google')}
        text="continue_with"
        shape="pill"
        width="320"
      />
    </div>
  );
}
