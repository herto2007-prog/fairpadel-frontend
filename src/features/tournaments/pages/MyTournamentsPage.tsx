import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentsService } from '@/services/tournamentsService';
import { Button, Loading, Card, CardContent, Badge, Select } from '@/components/ui';
import type { Tournament } from '@/types';
import { TournamentStatus } from '@/types';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';

const MyTournamentsPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await tournamentsService.getMyTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    setActionLoading(id);
    try {
      await tournamentsService.publish(id);
      loadTournaments();
    } catch (error) {
      console.error('Error publishing tournament:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: TournamentStatus) => {
    const variants: Record<TournamentStatus, { variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; label: string }> = {
      [TournamentStatus.BORRADOR]: { variant: 'default', label: 'Borrador' },
      [TournamentStatus.PENDIENTE_APROBACION]: { variant: 'warning', label: 'Pendiente' },
      [TournamentStatus.PUBLICADO]: { variant: 'success', label: 'Publicado' },
      [TournamentStatus.EN_CURSO]: { variant: 'info', label: 'En Curso' },
      [TournamentStatus.FINALIZADO]: { variant: 'default', label: 'Finalizado' },
      [TournamentStatus.RECHAZADO]: { variant: 'danger', label: 'Rechazado' },
      [TournamentStatus.CANCELADO]: { variant: 'danger', label: 'Cancelado' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredTournaments = statusFilter
    ? tournaments.filter((t) => t.estado === statusFilter)
    : tournaments;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando tus torneos..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-light-text">Mis Torneos</h1>
          <p className="text-light-secondary mt-2">Administra los torneos que has creado</p>
        </div>
        <Link to="/tournaments/create">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Crear Torneo
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <Select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          className="w-48"
        >
          <option value="">Todos los estados</option>
          <option value={TournamentStatus.BORRADOR}>Borrador</option>
          <option value={TournamentStatus.PENDIENTE_APROBACION}>Pendiente</option>
          <option value={TournamentStatus.PUBLICADO}>Publicado</option>
          <option value={TournamentStatus.EN_CURSO}>En Curso</option>
          <option value={TournamentStatus.FINALIZADO}>Finalizado</option>
        </Select>
      </div>

      {filteredTournaments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🎾</div>
            <h3 className="text-xl font-semibold mb-2">No tienes torneos</h3>
            <p className="text-light-secondary mb-6">
              Comienza creando tu primer torneo
            </p>
            <Link to="/tournaments/create">
              <Button variant="primary">Crear mi primer torneo</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTournaments.map((tournament) => (
            <Card key={tournament.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{tournament.nombre}</h3>
                      {getStatusBadge(tournament.estado)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-light-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(tournament.fechaInicio).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {tournament.ciudad}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {tournament.categorias?.length || 0} categorías
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {tournament.estado === TournamentStatus.BORRADOR && (
                      <Button
                        variant="primary"
                        onClick={() => handlePublish(tournament.id)}
                        loading={actionLoading === tournament.id}
                      >
                        Publicar
                      </Button>
                    )}
                    {(tournament.estado === TournamentStatus.PUBLICADO || tournament.estado === TournamentStatus.EN_CURSO) && (
                      <Link to={`/tournaments/${tournament.id}/manage`}>
                        <Button variant="success">Gestionar</Button>
                      </Link>
                    )}
                    <Link to={`/tournaments/${tournament.id}`}>
                      <Button variant="outline">Ver detalles</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTournamentsPage;
