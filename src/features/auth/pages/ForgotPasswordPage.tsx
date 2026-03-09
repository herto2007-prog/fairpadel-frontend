import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authService } from '../../../services/authService';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.forgotPassword({ email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar el email. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0E14] via-[#151921] to-[#0B0E14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://res.cloudinary.com/dncjaaybv/image/upload/v1773057029/logo_h4y1tl.png"
            alt="FairPadel"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">Recuperar contraseña</h1>
          <p className="text-gray-400 mt-2">
            Ingresa tu email y te enviaremos instrucciones
          </p>
        </div>

        <div className="bg-[#151921] border border-[#232838] rounded-2xl p-8 shadow-xl">
          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">¡Email enviado!</h2>
              <p className="text-gray-400 mb-6">
                Si existe una cuenta con ese email, recibirás instrucciones para recuperar tu contraseña.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Volver al login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
              >
                Enviar instrucciones
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-[#df2531] hover:text-[#b91c1c] text-sm">
                  ← Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
