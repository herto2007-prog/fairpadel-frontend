import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Calendar, MapPin, Trophy, Clock, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { tournamentService, Tournament } from '../../../services/tournamentService';
import { useAuthStore } from '../../../store/authStore';
import { UserRole } from '../../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  const isOrganizador = user?.id === tournament?.organizador?.id || 
                        user?.roles?.includes(UserRole.ADMIN);

  useEffect(() => {
    if (id) loadTournament();
  }, [id]);

  const loadTournament = async () => {
    try {
      const data = await tournamentService.getById(id!);
      setTournament(data);
    } catch (error) {
      toast.error('Error al cargar torneo');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await tournamentService.publish(id!);
      toast.success('Torneo publicado');
      loadTournament();
    } catch (error) {
      toast.error('Error al publicar torneo');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-dark-700 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-dark-300">Torneo no encontrado</h1>
        </div>
      </div>
    );
  }

  const getStatusLabel = (estado: string) => {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE_APROBACION: 'Pendiente de Aprobación',
      PUBLICADO: 'Inscripciones Abiertas',
      EN_CURSO: 'En Curso',
      FINALIZADO: 'Finalizado',
      CANCELADO: 'Cancelado',
    };
    return labels[estado] || estado;
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-dark-800 bg-dark-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link to="/tournaments">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-white">{tournament.nombre}</h1>
                <span className={`badge ${
                  tournament.estado === 'PUBLICADO' ? 'badge-primary' :
                  tournament.estado === 'EN_CURSO' ? 'badge-success' :
                  'bg-dark-700 text-dark-300'
                }`}>
                  {getStatusLabel(tournament.estado)}
                </span>
              </div>
              <p className="text-dark-400 text-sm mt-1">
                Organizado por {tournament.organizador.nombre} {tournament.organizador.apellido}
              </p>
            </div>

            {isOrganizador && tournament.estado === 'BORRADOR' && (
              <Button onClick={handlePublish}>
                Publicar Torneo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner */}
            <div className="h-64 bg-gradient-to-r from-primary-600/20 to-primary-800/20 rounded-2xl overflow-hidden flex items-center justify-center border border-dark-800">
              {tournament.flyerUrl ? (
                <img src={tournament.flyerUrl} alt={tournament.nombre} className="w-full h-full object-cover" />
              ) : (
                <Trophy className="w-24 h-24 text-primary-600/20" />
              )}
            </div>

            {/* Description */}
            {tournament.descripcion && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">Descripción</h2>
                  <p className="text-dark-300 whitespace-pre-line">{tournament.descripcion}</p>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Categorías</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {tournament.categories.map((tc) => (
                    <div
                      key={tc.id}
                      className={`p-3 rounded-xl border ${
                        tc.inscripcionAbierta
                          ? 'border-primary-600/30 bg-primary-600/10'
                          : 'border-dark-700 bg-dark-800'
                      }`}
                    >
                      <p className="font-medium text-white">{tc.category.nombre}</p>
                      <p className="text-xs text-dark-400">
                        {tc.inscripcionAbierta ? 'Inscripciones abiertas' : 'Cerradas'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">Información</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-dark-300">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-dark-500">Inicio</p>
                      <p>{format(new Date(tournament.fechaInicio), 'dd MMM yyyy, HH:mm', { locale: es })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-dark-300">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-dark-500">Fin</p>
                      <p>{format(new Date(tournament.fechaFin), 'dd MMM yyyy, HH:mm', { locale: es })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-dark-300">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-dark-500">Límite de inscripción</p>
                      <p>{format(new Date(tournament.fechaLimiteInscr), 'dd MMM yyyy, HH:mm', { locale: es })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-dark-300">
                    <MapPin className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-dark-500">Ubicación</p>
                      <p>{tournament.ciudad}, {tournament.pais}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-dark-300">
                    <DollarSign className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-dark-500">Inscripción</p>
                      <p className="text-primary-400 font-semibold">
                        {tournament.costoInscripcion > 0
                          ? `Gs. ${tournament.costoInscripcion.toLocaleString('es-PY')}`
                          : 'Gratis'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-dark-300">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-dark-500">Duración por partido</p>
                      <p>{tournament.minutosPorPartido} minutos</p>
                    </div>
                  </div>
                </div>

                {tournament.estado === 'PUBLICADO' && (
                  <Button className="w-full mt-4">
                    Inscribirme
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
