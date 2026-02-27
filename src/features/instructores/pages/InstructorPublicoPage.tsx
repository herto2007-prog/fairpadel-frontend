import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { instructoresService } from '@/services/instructoresService';
import { Loading, Card, CardContent, Badge, Button } from '@/components/ui';
import {
  GraduationCap,
  Award,
  Target,
  DollarSign,
  MapPin,
  CheckCircle,
  ArrowLeft,
  User,
  Calendar,
  Home,
} from 'lucide-react';
import type { Instructor } from '@/types';

const InstructorPublicoPage = () => {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadInstructor(id);
  }, [id]);

  const loadInstructor = async (instructorId: string) => {
    try {
      const data = await instructoresService.obtenerInstructor(instructorId);
      setInstructor(data);
    } catch {
      setError('No se encontró el instructor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loading size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-light-muted" />
        <p className="text-light-secondary mb-4">{error || 'Instructor no encontrado'}</p>
        <Link to="/instructores">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a la búsqueda
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Back link */}
      <Link
        to="/instructores"
        className="inline-flex items-center gap-1 text-sm text-light-secondary hover:text-primary-400 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a instructores
      </Link>

      {/* Main Profile Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {instructor.user?.fotoUrl ? (
                <img
                  src={instructor.user.fotoUrl}
                  alt={instructor.user.nombre}
                  className="h-24 w-24 rounded-full object-cover border-2 border-dark-border"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary-500/20 flex items-center justify-center border-2 border-dark-border">
                  <User className="h-10 w-10 text-primary-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-light-text">
                  {instructor.user?.nombre} {instructor.user?.apellido}
                </h1>
                {instructor.verificado && (
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                )}
              </div>

              <p className="text-light-secondary text-sm flex items-center gap-1 mb-3">
                <GraduationCap className="h-4 w-4" />
                Instructor de Pádel
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-light-secondary">
                <span className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {instructor.experienciaAnios} años de experiencia
                </span>
                {instructor.user?.ciudad && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {instructor.user.ciudad}
                  </span>
                )}
                {instructor.aceptaDomicilio && (
                  <span className="flex items-center gap-1 text-green-400">
                    <Home className="h-4 w-4" />
                    Acepta domicilio
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {instructor.descripcion && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-semibold text-light-text mb-2">Sobre mí</h2>
            <p className="text-sm text-light-secondary whitespace-pre-wrap leading-relaxed">
              {instructor.descripcion}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Especialidades y Niveles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {instructor.especialidades && (
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-light-text mb-2 flex items-center gap-1">
                <Target className="h-4 w-4 text-primary-400" />
                Especialidades
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {instructor.especialidades.split(',').map((esp) => (
                  <span key={esp} className="px-2.5 py-1 bg-primary-500/10 text-primary-400 rounded-full text-xs font-medium">
                    {esp.trim()}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {instructor.nivelesEnsenanza && (
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-light-text mb-2 flex items-center gap-1">
                <GraduationCap className="h-4 w-4 text-blue-400" />
                Niveles
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {instructor.nivelesEnsenanza.split(',').map((niv) => (
                  <span key={niv} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">
                    {niv.trim()}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tarifas */}
      {(instructor.precioIndividual || instructor.precioGrupal) && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="font-semibold text-light-text mb-3 flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-400" />
              Tarifas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {instructor.precioIndividual && (
                <div className="p-3 bg-dark-surface rounded-lg">
                  <p className="text-xs text-light-muted mb-1">Clase Individual</p>
                  <p className="text-lg font-bold text-light-text">
                    Gs. {instructor.precioIndividual.toLocaleString()}
                  </p>
                </div>
              )}
              {instructor.precioGrupal && (
                <div className="p-3 bg-dark-surface rounded-lg">
                  <p className="text-xs text-light-muted mb-1">Clase Grupal</p>
                  <p className="text-lg font-bold text-light-text">
                    Gs. {instructor.precioGrupal.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ubicaciones */}
      {instructor.ubicaciones && instructor.ubicaciones.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="font-semibold text-light-text mb-3 flex items-center gap-1">
              <MapPin className="h-4 w-4 text-primary-400" />
              Ubicaciones
            </h3>
            <div className="space-y-2">
              {instructor.ubicaciones.map((ub) => (
                <div
                  key={ub.id}
                  className="flex items-center gap-2 text-sm text-light-secondary p-2 bg-dark-surface rounded-lg"
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{ub.sede?.nombre || ub.nombreCustom || ub.ciudad}</span>
                  <span className="text-light-muted">— {ub.ciudad}</span>
                  {ub.esPrincipal && (
                    <Badge variant="info" className="text-[10px]">Principal</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA - Reservar (disabled, Fase 2) */}
      <div className="text-center">
        <Button variant="primary" size="lg" disabled className="opacity-60 cursor-not-allowed">
          <Calendar className="h-4 w-4 mr-2" />
          Reservar Clase (Próximamente)
        </Button>
        <p className="text-xs text-light-muted mt-2">La reserva de clases estará disponible pronto</p>
      </div>
    </div>
  );
};

export default InstructorPublicoPage;
