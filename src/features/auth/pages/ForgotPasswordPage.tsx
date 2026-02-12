import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-2xl font-bold mb-2 text-light-text">Correo enviado</h2>
            <p className="text-light-secondary mb-6">
              Si existe una cuenta con el email <strong className="text-light-text">{email}</strong>,
              recibirás instrucciones para restablecer tu contraseña.
            </p>
            <Link to="/login">
              <Button variant="primary">Volver al login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Recuperar Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            <p className="text-sm text-light-secondary">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              variant="primary"
              loading={loading}
            >
              Enviar instrucciones
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

export default ForgotPasswordPage;
