import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { TournamentCard } from '../components/TournamentCard';
import { tournamentService, Tournament } from '../../../services/tournamentService';
import { useAuthStore } from '../../../store/authStore';
import { UserRole } from '../../../types';

export function TournamentsListPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();

  const isOrganizador = user?.roles?.includes(UserRole.ORGANIZADOR) || user?.roles?.includes(UserRole.ADMIN);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await tournamentService.getAll();
      setTournaments(data);
    } catch (error: any) {
      toast.error('Error al cargar torneos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-dark-800 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-white">Torneos</h1>
                <p className="text-dark-400 text-sm">Descubre y participa en los mejores torneos de pádel</p>
              </div>
            </div>

            {isAuthenticated && isOrganizador && (
              <Link to="/tournaments/create">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Torneo
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tournaments.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-dark-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark-300 mb-2">No hay torneos disponibles</h3>
            <p className="text-dark-500 mb-6">Sé el primero en crear un torneo</p>
            {isAuthenticated && isOrganizador && (
              <Link to="/tournaments/create">
                <Button>Crear Torneo</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
