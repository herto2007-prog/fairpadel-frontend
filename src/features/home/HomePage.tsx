import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { tournamentsService } from '@/services/tournamentsService';
import { rankingsService } from '@/services/rankingsService';
import { Loading, Card, CardContent, Button } from '@/components/ui';
import { TournamentCard } from '@/features/tournaments/components/TournamentCard';
import type { Tournament, Ranking } from '@/types';
import { TournamentStatus, Gender } from '@/types';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';

const HomePage = () => {
  const {isAuthenticated } = useAuthStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tournamentsData, rankingsData] = await Promise.all([
        tournamentsService.getByStatus(TournamentStatus.PUBLICADO),
        rankingsService.getTop10(Gender.MASCULINO),
      ]);
      setTournaments(tournamentsData.slice(0, 6));
      setRankings(rankingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Bienvenido a FairPadel 🎾
            </h1>
            <p className="text-xl text-emerald-100 mb-8">
              La plataforma líder para gestionar torneos de pádel en Paraguay.
              Inscríbete, compite y sigue tu ranking.
            </p>
            {!isAuthenticated ? (
              <div className="flex gap-4">
                <Link to="/register">
                  <Button variant="secondary" size="lg">
                    Crear Cuenta
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link to="/tournaments">
                  <Button variant="secondary" size="lg">
                    Ver Torneos
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    Mi Perfil
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="text-center py-6">
                <Trophy className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900">50+</p>
                <p className="text-sm text-gray-600">Torneos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <Users className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900">500+</p>
                <p className="text-sm text-gray-600">Jugadores</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <Calendar className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900">100+</p>
                <p className="text-sm text-gray-600">Partidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <span className="text-3xl">🏆</span>
                <p className="text-3xl font-bold text-gray-900">16</p>
                <p className="text-sm text-gray-600">Categorías</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Próximos Torneos */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Próximos Torneos</h2>
              <p className="text-gray-600">Inscríbete en los mejores torneos de pádel</p>
            </div>
            <Link to="/tournaments">
              <Button variant="outline">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {tournaments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No hay torneos disponibles en este momento</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top 10 Rankings */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Top 10 Ranking</h2>
              <p className="text-gray-600">Los mejores jugadores de la plataforma</p>
            </div>
            <Link to="/rankings">
              <Button variant="outline">
                Ver ranking completo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {rankings.slice(0, 10).map((ranking, index) => (
                  <div key={ranking.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                    <div className="w-8 text-center font-bold text-lg">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `${index + 1}`}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                      {ranking.jugador?.nombre?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {ranking.jugador?.nombre} {ranking.jugador?.apellido}
                      </p>
                      <p className="text-sm text-gray-500">
                        {ranking.jugador?.ciudad || 'Sin ciudad'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{ranking.puntosTotales} pts</p>
                      <p className="text-sm text-gray-500">{ranking.torneosJugados} torneos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
