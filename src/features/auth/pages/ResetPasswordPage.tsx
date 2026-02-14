import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import logoRed from '@/assets/Asset 2fair padel.png';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token: token!, password, confirmPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2 text-red-400">Enlace inválido</h2>
            <p className="text-light-secondary mb-6">
              El enlace de recuperación no es válido. Solicita uno nuevo.
            </p>
            <Link to="/forgot-password">
              <Button variant="primary">Solicitar nuevo enlace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2 text-green-400">Contraseña restablecida</h2>
            <p className="text-light-secondary mb-6">
              Tu contraseña fue actualizada exitosamente. Ya puedes iniciar sesión.
            </p>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <img src={logoRed} alt="FairPadel" className="h-16 w-auto" />
          </div>
          <CardTitle>Nueva Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            <p className="text-sm text-light-secondary">
              Ingresa tu nueva contraseña.
            </p>

            <Input
              label="Nueva contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              variant="primary"
              loading={loading}
            >
              Restablecer Contraseña
            </Button>

            <p className="text-center text-sm">
              <Link to="/login" className="text-primary-500 hover:text-primary-400 hover:underline">
                Volver al login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
