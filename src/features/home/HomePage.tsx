import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { tournamentsService } from '@/services/tournamentsService';
import { rankingsService } from '@/services/rankingsService';
import { Loading, Card, CardContent, Button } from '@/components/ui';
import { TournamentCard } from '@/features/tournaments/components/TournamentCard';
import type { Tournament, Ranking } from '@/types';
import { TournamentStatus, Gender } from '@/types';
import { Trophy, Calendar, Users, ArrowRight, TrendingUp } from 'lucide-react';
import BannerZone from '@/components/BannerZone';
import logoWhite from '@/assets/Asset 1fair padel.png';

const HomePage = () => {
  const { isAuthenticated } = useAuthStore();
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
      {/* Hero Section — Animated gradient */}
      <section className="hero-gradient text-white py-20 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_60%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="opacity-0 animate-fade-up">
              <img src={logoWhite} alt="FairPadel" className="h-16 w-auto mb-6" />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 opacity-0 animate-fade-up-delay-1 leading-tight">
              Tu pádel,<br />
              <span className="text-red-200">tu ranking.</span>
            </h1>
            <p className="text-lg md:text-xl text-red-100/80 mb-8 opacity-0 animate-fade-up-delay-2 max-w-xl">
              La plataforma líder para gestionar torneos de pádel en Paraguay.
              Inscríbete, compite y sigue tu progreso.
            </p>
            <div className="flex gap-4 opacity-0 animate-fade-up-delay-3">
              {!isAuthenticated ? (
                <>
                  <Link to="/register">
                    <Button variant="secondary" size="lg" className="shadow-lg shadow-black/20">
                      Crear Cuenta
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                      Iniciar Sesión
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/tournaments">
                    <Button variant="secondary" size="lg" className="shadow-lg shadow-black/20">
                      Ver Torneos
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                      Mi Perfil
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Banner: Home Hero */}
      <BannerZone zona="HOME_HERO" className="container mx-auto px-4 mt-6" layout="carousel" />

      {/* Stats Section */}
      <section className="py-12 bg-dark-surface">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Trophy, value: '50+', label: 'Torneos' },
              { icon: Users, value: '500+', label: 'Jugadores' },
              { icon: Calendar, value: '100+', label: 'Partidos' },
              { icon: TrendingUp, value: '16', label: 'Categorías' },
            ].map(({ icon: Icon, value, label }) => (
              <Card key={label} className="card-hover">
                <CardContent className="text-center py-6">
                  <Icon className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-light-text">{value}</p>
                  <p className="text-sm text-light-secondary">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Próximos Torneos */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-light-text">Próximos Torneos</h2>
              <p className="text-light-secondary">Inscríbete en los mejores torneos de pádel</p>
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
                <p className="text-light-secondary">No hay torneos disponibles en este momento</p>
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

      {/* Banner: Home Medio */}
      <BannerZone zona="HOME_MEDIO" className="container mx-auto px-4 my-4" layout="single" />

      {/* Top 10 Rankings */}
      <section className="py-12 bg-dark-surface">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-light-text">Top 10 Ranking</h2>
              <p className="text-light-secondary">Los mejores jugadores de la plataforma</p>
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
              <div className="divide-y divide-dark-border">
                {rankings.slice(0, 10).map((ranking, index) => (
                  <div key={ranking.id} className="flex items-center gap-4 p-4 hover:bg-dark-hover transition-all duration-200 group">
                    <div className="w-8 text-center font-bold text-lg">
                      {index === 0 && <span className="text-yellow-400">1</span>}
                      {index === 1 && <span className="text-gray-300">2</span>}
                      {index === 2 && <span className="text-amber-600">3</span>}
                      {index > 2 && <span className="text-light-muted">{index + 1}</span>}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center overflow-hidden">
                      {ranking.jugador?.fotoUrl ? (
                        <img src={ranking.jugador.fotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-primary-400 font-semibold">
                          {ranking.jugador?.nombre?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-light-text group-hover:text-primary-400 transition-colors">
                        {ranking.jugador?.nombre} {ranking.jugador?.apellido}
                      </p>
                      <p className="text-sm text-light-muted">
                        {ranking.jugador?.ciudad || 'Sin ciudad'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-500">{ranking.puntosTotales} pts</p>
                      <p className="text-sm text-light-muted">{ranking.torneosJugados} torneos</p>
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
