import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Calendar, Trophy, Users, Loader2, Users2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { tournamentService, Tournament } from '../../../services/tournamentService';
import { useAuthStore } from '../../../store/authStore';
import { UserRole } from '../../../types';

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();

  const isOrganizador = user?.id === tournament?.organizador?.id || 
                        user?.roles?.includes(UserRole.ADMIN);

  useEffect(() => {
    if (id) loadTournament();
  }, [id]);

  const loadTournament = async () => {
    try {
      setIsLoading(true);
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
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white">Torneo no encontrado</h1>
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

  const getStatusColor = (estado: string) => {
    const colors: Record<string, string> = {
      BORRADOR: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      PENDIENTE_APROBACION: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      PUBLICADO: 'bg-green-500/10 text-green-400 border-green-500/20',
      EN_CURSO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      FINALIZADO: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      CANCELADO: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[estado] || 'bg-gray-500/10 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      {/* Header */}
      <div className="border-b border-[#232838] bg-[#151921]/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link to="/tournaments">
              <Button variant="outline" size="icon" className="rounded-full border-[#232838]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{tournament.nombre}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tournament.estado)}`}>
                  {getStatusLabel(tournament.estado)}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Organizado por {tournament.organizador.nombre} {tournament.organizador.apellido}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isOrganizador && (
                <>
                  {tournament.estado === 'BORRADOR' && (
                    <Button onClick={handlePublish}>
                      Publicar Torneo
                    </Button>
                  )}
                  <Link to={`/inscripciones/gestion/${tournament.id}`}>
                    <Button variant="outline">
                      <Users2 className="w-4 h-4 mr-2" />
                      Inscripciones
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner */}
            <div className="h-64 bg-gradient-to-r from-[#df2531]/20 to-[#df2531]/5 rounded-2xl overflow-hidden flex items-center justify-center border border-[#232838]">
              {tournament.flyerUrl ? (
                <img src={tournament.flyerUrl} alt={tournament.nombre} className="w-full h-full object-cover" />
              ) : (
                <Trophy className="w-24 h-24 text-[#df2531]/20" />
              )}
            </div>

            {/* Description */}
            {tournament.descripcion && (
              <Card className="bg-[#151921] border-[#232838]">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">Descripción</h2>
                  <p className="text-gray-300 whitespace-pre-line">{tournament.descripcion}</p>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            <Card className="bg-[#151921] border-[#232838]">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Categorías</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {tournament.categories?.map((tc) => (
                    <div
                      key={tc.id}
                      className={`p-3 rounded-xl border ${
                        tc.inscripcionAbierta
                          ? 'border-[#df2531]/30 bg-[#df2531]/10'
                          : 'border-[#232838] bg-[#0B0E14]'
                      }`}
                    >
                      <p className="font-medium text-white">{tc.category.nombre}</p>
                      <p className="text-xs text-gray-400">
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
            <Card className="bg-[#151921] border-[#232838]">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">Información</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-5 h-5 text-[#df2531]" />
                    <div>
                      <p className="text-sm text-gray-500">Inicio</p>
                      <p>{new Date(tournament.fechaInicio).toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-5 h-5 text-[#df2531]" />
                    <div>
                      <p className="text-sm text-gray-500">Fin</p>
                      <p>{new Date(tournament.fechaFin).toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  {tournament.fechaInicioInscripcion && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Calendar className="w-5 h-5 text-[#df2531]" />
                      <div>
                        <p className="text-sm text-gray-500">Inicio de inscripciones</p>
                        <p>{new Date(tournament.fechaInicioInscripcion).toLocaleDateString('es-PY', { day: 'numeric', month: 'long' })}</p>
                      </div>
                    </div>
                  )}

                  {tournament.fechaFinInscripcion && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Calendar className="w-5 h-5 text-[#df2531]" />
                      <div>
                        <p className="text-sm text-gray-500">Fin de inscripciones</p>
                        <p>{new Date(tournament.fechaFinInscripcion).toLocaleDateString('es-PY', { day: 'numeric', month: 'long' })}</p>
                      </div>
                    </div>
                  )}

                  {tournament.maxParejas && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Users className="w-5 h-5 text-[#df2531]" />
                      <div>
                        <p className="text-sm text-gray-500">Cupo máximo</p>
                        <p>{tournament.maxParejas} parejas</p>
                      </div>
                    </div>
                  )}

                  {tournament.premio && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Trophy className="w-5 h-5 text-[#df2531]" />
                      <div>
                        <p className="text-sm text-gray-500">Premio</p>
                        <p className="text-[#df2531] font-semibold">{tournament.premio}</p>
                      </div>
                    </div>
                  )}
                </div>

                {tournament.estado === 'PUBLICADO' && isAuthenticated && !isOrganizador && (
                  <Link to={`/inscripciones/tournament/${tournament.id}`}>
                    <Button className="w-full mt-4 bg-[#df2531] hover:bg-[#b91d2a]">
                      Inscribirme
                    </Button>
                  </Link>
                )}

                {tournament.estado === 'PUBLICADO' && !isAuthenticated && (
                  <Link to="/login">
                    <Button variant="outline" className="w-full mt-4">
                      Inicia sesión para inscribirte
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
