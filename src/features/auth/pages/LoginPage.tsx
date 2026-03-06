import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    documento: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.login(formData);
      setAuth(response.user, response.access_token);
      toast.success('¡Bienvenido!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-primary-600/5 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md relative z-10 bg-dark-900/95 backdrop-blur-xl border-dark-800">
        <CardHeader className="space-y-1 text-center">
          {/* Logo placeholder - replace with actual logo */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary-600/20">
            <span className="text-white text-3xl font-bold font-display">F</span>
          </div>
          <CardTitle className="text-3xl font-display">
            FairPadel
          </CardTitle>
          <CardDescription className="text-dark-400">
            Ingresa con tu Cédula de Identidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documento" className="text-dark-300">Cédula de Identidad</Label>
              <Input
                id="documento"
                type="text"
                placeholder="1234567"
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value.replace(/\D/g, '') })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-dark-300">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-dark-500">¿No tienes cuenta? </span>
            <Link to="/register" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
