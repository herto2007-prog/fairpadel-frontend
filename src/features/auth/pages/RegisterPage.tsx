import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import tournamentsService from '@/services/tournamentsService';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Select } from '@/components/ui';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import type { RegisterDto, Category } from '@/types';
import { Gender } from '@/types';
import logoRed from '@/assets/Asset 2fair padel.png';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<RegisterDto>({
    documento: '',
    nombre: '',
    apellido: '',
    genero: Gender.MASCULINO,
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    ciudad: '',
  });

  useEffect(() => {
    tournamentsService.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Filter categories by selected gender and sort by orden DESC (8va first)
  const filteredCategories = useMemo(() => {
    const generoTipo = formData.genero === Gender.MASCULINO ? 'MASCULINO' : 'FEMENINO';
    return categories
      .filter((c) => c.tipo === generoTipo)
      .sort((a, b) => b.orden - a.orden);
  }, [categories, formData.genero]);

  // Set default category (8va) when gender changes
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const default8va = filteredCategories.find((c) => c.orden === 8);
      if (default8va) {
        setFormData((prev) => ({ ...prev, categoriaActualId: default8va.id }));
      }
    }
  }, [filteredCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await authService.register(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
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
            <h2 className="text-2xl font-bold mb-2 text-light-text">¡Registro exitoso!</h2>
            <p className="text-light-secondary mb-6">
              Hemos enviado un correo de verificación a <strong className="text-light-text">{formData.email}</strong>.
              Por favor revisa tu bandeja de entrada.
            </p>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <img src={logoRed} alt="FairPadel" className="h-16 w-auto" />
          </div>
          <CardTitle>Crear Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                type="text"
                placeholder="Juan"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
              <Input
                label="Apellido"
                type="text"
                placeholder="Pérez"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                required
              />
            </div>

            <Input
              label="Documento de Identidad"
              type="text"
              placeholder="Ej: 4567890"
              value={formData.documento}
              onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
              required
            />

            <Select
              label="Género"
              value={formData.genero}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, genero: e.target.value as Gender })
              }
              required
            >
              <option value={Gender.MASCULINO}>Masculino</option>
              <option value={Gender.FEMENINO}>Femenino</option>
            </Select>

            {filteredCategories.length > 0 && (
              <Select
                label="¿En qué categoría jugás actualmente?"
                value={formData.categoriaActualId || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, categoriaActualId: e.target.value })
                }
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}{cat.orden === 8 ? ' (Principiante)' : cat.orden === 1 ? ' (Más alta)' : ''}
                  </option>
                ))}
              </Select>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Teléfono"
              type="tel"
              placeholder="Ej: 0981123456"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              required
            />

            <CityAutocomplete
              label="Ciudad"
              value={formData.ciudad || ''}
              onChange={(val) => setFormData({ ...formData, ciudad: val })}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Input
              label="Confirmar Contraseña"
              type="password"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />

            <Button
              type="submit"
              className="w-full"
              variant="primary"
              loading={loading}
            >
              Crear Cuenta
            </Button>

            <p className="text-center text-sm text-light-secondary">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-400 hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
