import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Button, Card, CardContent, Loading } from '@/components/ui';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      await authService.verifyEmail({ token: token! });
      setStatus('success');
      setMessage('¡Tu email ha sido verificado exitosamente!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Error al verificar el email');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage('Por favor ingresa tu email');
      return;
    }

    setResending(true);
    try {
      await authService.resendVerification(email);
      setMessage('Hemos enviado un nuevo correo de verificación');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error al reenviar el correo');
    } finally {
      setResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <Loading size="lg" text="Verificando email..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-8">
          {status === 'success' ? (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-2 text-green-400">¡Verificado!</h2>
              <p className="text-light-secondary mb-6">{message}</p>
              <Button variant="primary" onClick={() => navigate('/login')}>
                Iniciar Sesión
              </Button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold mb-2 text-red-400">Error</h2>
              <p className="text-light-secondary mb-6">{message}</p>

              <div className="space-y-4">
                <p className="text-sm text-light-muted">
                  ¿Necesitas un nuevo correo de verificación?
                </p>
                <input
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-dark-border bg-dark-input text-light-text rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  variant="outline"
                  onClick={handleResend}
                  loading={resending}
                  className="w-full"
                >
                  Reenviar correo de verificación
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="mt-4"
              >
                Volver al login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
