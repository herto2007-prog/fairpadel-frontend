import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { tournamentsService } from '@/services/tournamentsService';
import { rankingsService } from '@/services/rankingsService';
import api from '@/services/api';
import { Card, CardContent, Button, Loading } from '@/components/ui';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { TournamentCard } from '@/features/tournaments/components/TournamentCard';
import type { Tournament, Ranking } from '@/types';
import { TournamentStatus, Gender } from '@/types';
import BannerZone from '@/components/BannerZone';
import logoWhite from '@/assets/Asset 1fair padel.png';
import {
  Trophy, Calendar, Users, ArrowRight, TrendingUp,
  UserPlus, GitBranch, BarChart2, DollarSign, Camera,
  Settings, MapPin, Shuffle, FileSpreadsheet, ClipboardCheck,
  Star, Bell, MessageSquare, Image, Crown, Zap, Shield,
  Smartphone, ChevronRight,
} from 'lucide-react';

// ══════ Constants from FeaturesPage ══════

const FEATURES = [
  {
    icon: Trophy,
    title: 'Gestion de Torneos',
    description: 'Crea, configura y administra torneos completos con wizard paso a paso',
    color: 'text-amber-400',
    bg: 'bg-amber-900/20 border-amber-500/30',
    glow: 'rgba(251, 191, 36, 0.3)',
  },
  {
    icon: UserPlus,
    title: 'Inscripciones Online',
    description: 'Registro de parejas con pago digital, comprobantes y confirmacion',
    color: 'text-blue-400',
    bg: 'bg-blue-900/20 border-blue-500/30',
    glow: 'rgba(96, 165, 250, 0.3)',
  },
  {
    icon: GitBranch,
    title: 'Fixture Automatico',
    description: 'Sorteo inteligente con acomodacion paraguayo y bracket interactivo',
    color: 'text-green-400',
    bg: 'bg-green-900/20 border-green-500/30',
    glow: 'rgba(74, 222, 128, 0.3)',
  },
  {
    icon: BarChart2,
    title: 'Rankings en Vivo',
    description: 'Puntos automaticos y clasificacion por categoria y ciudad',
    color: 'text-purple-400',
    bg: 'bg-purple-900/20 border-purple-500/30',
    glow: 'rgba(192, 132, 252, 0.3)',
  },
  {
    icon: DollarSign,
    title: 'Control Financiero',
    description: 'Ingresos, egresos, pagos y balance en tiempo real con graficos',
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/20 border-emerald-500/30',
    glow: 'rgba(52, 211, 153, 0.3)',
  },
  {
    icon: Camera,
    title: 'Galeria de Fotos',
    description: 'Comparti momentos del torneo con likes, comentarios y albums',
    color: 'text-pink-400',
    bg: 'bg-pink-900/20 border-pink-500/30',
    glow: 'rgba(244, 114, 182, 0.3)',
  },
];

const ORGANIZER_FEATURES = [
  { icon: Settings, text: 'Wizard de creacion paso a paso' },
  { icon: MapPin, text: 'Gestion de sedes y canchas con calendario' },
  { icon: Shuffle, text: 'Sorteo con acomodacion paraguayo' },
  { icon: BarChart2, text: 'Dashboard financiero con graficos' },
  { icon: FileSpreadsheet, text: 'Reportes en Excel y PDF' },
  { icon: ClipboardCheck, text: 'Acreditacion y control de ayudantes' },
];

const PLAYER_FEATURES = [
  { icon: Users, text: 'Perfil con estadisticas y logros' },
  { icon: UserPlus, text: 'Inscripcion rapida a torneos' },
  { icon: BarChart2, text: 'Rankings automaticos por categoria' },
  { icon: Bell, text: 'Alertas personalizadas de torneos' },
  { icon: MessageSquare, text: 'Novedades y mensajes directos' },
  { icon: Image, text: 'Galeria de fotos con likes' },
];

const CATEGORIES_CABALLEROS = ['8va', '7ma', '6ta', '5ta', '4ta', '3ra', '2da', '1ra'];
const CATEGORIES_DAMAS = ['8va', '7ma', '6ta', '5ta', '4ta', '3ra', '2da', '1ra'];

const PREMIUM_BENEFITS = [
  { icon: Zap, title: 'Scoring en Vivo', description: 'Arbitraje digital punto a punto' },
  { icon: BarChart2, title: 'Dashboard Avanzado', description: 'Metricas y proyecciones' },
  { icon: Bell, title: 'Alertas Personalizadas', description: 'Torneos, rivales y ranking' },
  { icon: Smartphone, title: 'Notificaciones SMS', description: 'Avisos directos al celular' },
];

// ══════ Component ══════

const HomePage = () => {
  const { isAuthenticated } = useAuthStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({ torneos: 0, jugadores: 0, partidos: 0, categorias: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tournamentsData, rankingsData, statsData] = await Promise.all([
        tournamentsService.getByStatus(TournamentStatus.PUBLICADO),
        rankingsService.getTop10(Gender.MASCULINO),
        api.get('/stats').then(r => r.data).catch(() => null),
      ]);
      setTournaments(tournamentsData.slice(0, 6));
      setRankings(rankingsData);
      if (statsData) setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const heroStats = [
    { icon: Trophy, value: stats.torneos, label: 'Torneos' },
    { icon: Users, value: stats.jugadores, label: 'Jugadores' },
    { icon: Calendar, value: stats.partidos, label: 'Partidos' },
    { icon: TrendingUp, value: stats.categorias, label: 'Categorías' },
  ];

  return (
    <div className="min-h-screen">

      {/* ═══════ 1. HERO ═══════ */}
      <section className="hero-gradient text-white py-14 sm:py-24 relative overflow-hidden">
        {/* Subtle pattern overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          {/* Floating logo */}
          <div className="opacity-0 animate-fade-up">
            <img
              src={logoWhite}
              alt="FairPadel"
              className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-4 sm:mb-6 drop-shadow-2xl animate-float"
            />
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-3 sm:mb-4 opacity-0 animate-fade-up-delay-1 leading-tight">
            Tu padel,<br />
            <span className="text-red-200">tu ranking.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-red-100/80 mb-6 sm:mb-8 opacity-0 animate-fade-up-delay-2 max-w-xl mx-auto">
            La plataforma lider para gestionar torneos de padel en Paraguay.
            Inscribite, competi y segui tu progreso.
          </p>

          {/* Inline stats pills */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 opacity-0 animate-fade-up-delay-2">
            {heroStats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <Icon className="h-4 w-4 text-red-200" />
                <span className="font-bold text-sm sm:text-base animate-count-up">{value.toLocaleString()}</span>
                <span className="text-red-200/70 text-xs sm:text-sm">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center opacity-0 animate-fade-up-delay-3">
            {!isAuthenticated ? (
              <>
                <Link to="/register">
                  <Button variant="secondary" size="lg" className="shadow-lg shadow-black/20">
                    Crear Cuenta
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                    Iniciar Sesion
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
      </section>

      {/* ═══════ 2. BANNER HOME_HERO ═══════ */}
      <BannerZone zona="HOME_HERO" className="container mx-auto px-4 mt-6" layout="carousel" />

      {/* ═══════ 3. FEATURES GRID ═══════ */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <AnimatedSection className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Todo en una <span className="text-primary-500">plataforma</span>
          </h2>
          <p className="text-light-secondary max-w-xl mx-auto">
            Todo integrado para que solo te preocupes por jugar
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <AnimatedSection key={feat.title} animation="scale-in" delay={i * 80}>
                <Card
                  className={`p-6 border ${feat.bg} glow-border-hover hover:scale-[1.03] transition-transform duration-300 h-full`}
                  style={{ '--glow-color': feat.glow } as React.CSSProperties}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-dark-surface flex-shrink-0">
                      <Icon className={`w-7 h-7 ${feat.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{feat.title}</h3>
                      <p className="text-sm text-light-secondary leading-relaxed">{feat.description}</p>
                    </div>
                  </div>
                </Card>
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      {/* ═══════ 4. PROXIMOS TORNEOS ═══════ */}
      <AnimatedSection className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6 sm:mb-8 gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-light-text">Proximos Torneos</h2>
              <p className="text-sm sm:text-base text-light-secondary">Inscribite en los mejores torneos</p>
            </div>
            <Link to="/tournaments" className="flex-shrink-0">
              <Button variant="outline" size="sm" className="sm:hidden">Ver todos</Button>
              <Button variant="outline" className="hidden sm:flex">
                Ver todos <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {dataLoading ? (
            <div className="flex justify-center py-12"><Loading size="lg" text="Cargando torneos..." /></div>
          ) : tournaments.length === 0 ? (
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
      </AnimatedSection>

      {/* ═══════ 5. BANNER HOME_MEDIO ═══════ */}
      <BannerZone zona="HOME_MEDIO" className="container mx-auto px-4 my-4" layout="single" />

      {/* ═══════ 6. TOP 10 RANKINGS ═══════ */}
      <AnimatedSection className="py-8 sm:py-12 bg-dark-surface">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6 sm:mb-8 gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-light-text">Top 10 Ranking</h2>
              <p className="text-sm sm:text-base text-light-secondary">Los mejores jugadores de la plataforma</p>
            </div>
            <Link to="/rankings" className="flex-shrink-0">
              <Button variant="outline" size="sm" className="sm:hidden">Ver ranking</Button>
              <Button variant="outline" className="hidden sm:flex">
                Ver ranking completo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {dataLoading ? (
            <div className="flex justify-center py-12"><Loading size="lg" text="Cargando rankings..." /></div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-dark-border">
                  {rankings.slice(0, 10).map((ranking, index) => (
                    <div
                      key={ranking.id}
                      className="flex items-center gap-2.5 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 hover:bg-dark-hover transition-all duration-200 group animate-fade-up opacity-0"
                      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className="w-6 sm:w-8 text-center font-bold text-sm sm:text-lg flex-shrink-0">
                        {index === 0 && <span className="text-xl">🥇</span>}
                        {index === 1 && <span className="text-xl">🥈</span>}
                        {index === 2 && <span className="text-xl">🥉</span>}
                        {index > 2 && <span className="text-light-muted">{index + 1}</span>}
                      </div>
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {ranking.jugador?.fotoUrl ? (
                          <img src={ranking.jugador.fotoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-primary-400 font-semibold text-sm sm:text-base">
                            {ranking.jugador?.nombre?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-light-text group-hover:text-primary-400 transition-colors truncate">
                          {ranking.jugador?.nombre} {ranking.jugador?.apellido}
                        </p>
                        <p className="text-xs sm:text-sm text-light-muted truncate">
                          {ranking.jugador?.ciudad || 'Sin ciudad'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary-500 text-sm sm:text-base">{ranking.puntosTotales} pts</p>
                        <p className="text-xs sm:text-sm text-light-muted">{ranking.torneosJugados} torneos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AnimatedSection>

      {/* ═══════ 7. PARA ORGANIZADORES ═══════ */}
      <section className="bg-dark-surface py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-900/30 rounded-full mb-4">
                <Settings className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Organizadores</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">
                Herramientas para <span className="text-amber-400">Organizadores</span>
              </h2>
              <div className="space-y-4">
                {ORGANIZER_FEATURES.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.text}
                      className="flex items-center gap-3 group animate-fade-up opacity-0"
                      style={{ animationDelay: `${200 + i * 80}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className="p-2 bg-amber-900/20 rounded-lg group-hover:bg-amber-900/40 transition-colors">
                        <Icon className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className="text-light-text">{item.text}</span>
                    </div>
                  );
                })}
              </div>
              <Link to={isAuthenticated ? '/my-tournaments' : '/register'} className="inline-block mt-6">
                <Button variant="primary" className="bg-amber-500 hover:bg-amber-600">
                  {isAuthenticated ? 'Mis Torneos' : 'Empeza a Organizar'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </AnimatedSection>

            {/* Dashboard mockup */}
            <AnimatedSection animation="slide-right" className="hidden lg:flex items-center justify-center">
              <div className="relative w-80 h-80 animate-float-delay-1">
                <div className="absolute inset-0 bg-amber-500/5 rounded-3xl rotate-6" />
                <div className="absolute inset-0 bg-dark-card border border-dark-border rounded-3xl shadow-2xl p-8 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-light-muted ml-2">Dashboard</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Trophy, value: '24', label: 'Torneos', color: 'text-amber-400' },
                      { icon: Users, value: '342', label: 'Parejas', color: 'text-blue-400' },
                      { icon: DollarSign, value: 'Gs.12M', label: 'Recaudado', color: 'text-green-400' },
                      { icon: BarChart2, value: '96%', label: 'Ocupacion', color: 'text-purple-400' },
                    ].map(({ icon: Icon, value, label, color }) => (
                      <div key={label} className="bg-dark-surface rounded-lg p-3 text-center">
                        <Icon className={`w-6 h-6 ${color} mx-auto mb-1`} />
                        <p className="text-lg font-bold">{value}</p>
                        <p className="text-[10px] text-light-muted">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-end gap-1 h-12 mt-4">
                    {[40, 65, 50, 80, 70, 90, 60, 75, 85, 55, 95, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-amber-500/60 animate-podium-rise opacity-0"
                        style={{ height: `${h}%`, animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════ 8. PARA JUGADORES ═══════ */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Profile mockup */}
          <AnimatedSection animation="slide-left" className="hidden lg:flex items-center justify-center">
            <div className="relative w-80 h-80 animate-float-delay-2">
              <div className="absolute inset-0 bg-blue-500/5 rounded-3xl -rotate-6" />
              <div className="absolute inset-0 bg-dark-card border border-dark-border rounded-3xl shadow-2xl p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-primary-500 flex items-center justify-center text-xl font-bold">
                    JP
                  </div>
                  <div>
                    <p className="font-bold">Juan Perez</p>
                    <p className="text-xs text-light-muted">3ra Caballeros</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="bg-dark-surface rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-blue-400">385</p>
                    <p className="text-[10px] text-light-muted">Puntos</p>
                  </div>
                  <div className="bg-dark-surface rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-green-400">12</p>
                    <p className="text-[10px] text-light-muted">Torneos</p>
                  </div>
                  <div className="bg-dark-surface rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-amber-400">3</p>
                    <p className="text-[10px] text-light-muted">Titulos</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  {[
                    { icon: Trophy, bg: 'bg-amber-900/30', color: 'text-amber-400' },
                    { icon: Star, bg: 'bg-purple-900/30', color: 'text-purple-400' },
                    { icon: Shield, bg: 'bg-green-900/30', color: 'text-green-400' },
                    { icon: Zap, bg: 'bg-blue-900/30', color: 'text-blue-400' },
                  ].map(({ icon: Icon, bg, color }, idx) => (
                    <div key={idx} className={`p-2 ${bg} rounded-lg`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                  ))}
                </div>
                <div className="bg-dark-surface rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-light-muted">Ranking Nacional</span>
                    <span className="text-blue-400 font-bold">#14</span>
                  </div>
                  <div className="w-full bg-dark-border rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: '72%' }} />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 rounded-full mb-4">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Jugadores</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              Tu Experiencia como <span className="text-blue-400">Jugador</span>
            </h2>
            <div className="space-y-4">
              {PLAYER_FEATURES.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.text}
                    className="flex items-center gap-3 group animate-fade-up opacity-0"
                    style={{ animationDelay: `${200 + i * 80}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="p-2 bg-blue-900/20 rounded-lg group-hover:bg-blue-900/40 transition-colors">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-light-text">{item.text}</span>
                  </div>
                );
              })}
            </div>
            <Link to={isAuthenticated ? '/profile' : '/register'} className="inline-block mt-6">
              <Button variant="primary">
                {isAuthenticated ? 'Ver Mi Perfil' : 'Crear Cuenta'} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ 9. CATEGORIAS & PUNTOS ═══════ */}
      <AnimatedSection className="bg-dark-surface py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            <span className="text-primary-500">16</span> Categorias, <span className="text-primary-500">2</span> Generos
          </h2>
          <p className="text-light-secondary mb-8 max-w-lg mx-auto">
            Desde 8va hasta 1ra, con ascenso automatico por rendimiento
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-blue-400 font-semibold mb-3 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" /> Caballeros
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES_CABALLEROS.map((cat, i) => (
                  <div
                    key={cat}
                    className="px-4 py-2 rounded-lg font-semibold text-sm border transition-all duration-300 hover:scale-110"
                    style={{
                      backgroundColor: `rgba(96, 165, 250, ${0.08 + i * 0.04})`,
                      borderColor: `rgba(96, 165, 250, ${0.2 + i * 0.05})`,
                      color: `rgba(96, 165, 250, ${0.6 + i * 0.05})`,
                    }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-pink-400 font-semibold mb-3 flex items-center justify-center gap-2">
                <Star className="w-4 h-4" /> Damas
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES_DAMAS.map((cat, i) => (
                  <div
                    key={cat}
                    className="px-4 py-2 rounded-lg font-semibold text-sm border transition-all duration-300 hover:scale-110"
                    style={{
                      backgroundColor: `rgba(244, 114, 182, ${0.08 + i * 0.04})`,
                      borderColor: `rgba(244, 114, 182, ${0.2 + i * 0.05})`,
                      color: `rgba(244, 114, 182, ${0.6 + i * 0.05})`,
                    }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Points system */}
          <div className="mt-10 grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-2xl mx-auto">
            {[
              { label: 'Campeon', pts: 100 },
              { label: 'Finalista', pts: 60 },
              { label: 'Semi', pts: 35 },
              { label: 'Cuartos', pts: 15 },
              { label: 'Octavos', pts: 8 },
              { label: '1ra Ronda', pts: 3 },
            ].map((item, i) => (
              <AnimatedSection key={item.label} animation="scale-in" delay={i * 70}>
                <div className="bg-dark-card border border-dark-border rounded-lg p-3 text-center card-hover">
                  <p className="text-xl font-bold text-light-text">{item.pts}</p>
                  <p className="text-[10px] text-light-muted uppercase">{item.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <p className="text-xs text-light-muted mt-4">Puntos otorgados automaticamente al finalizar cada torneo</p>
        </div>
      </AnimatedSection>

      {/* ═══════ 10. PREMIUM ═══════ */}
      <AnimatedSection className="container mx-auto px-4 py-12 sm:py-16">
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-900/10 to-dark-card p-8 sm:p-12 text-center relative overflow-hidden animate-glow-pulse">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 shimmer-overlay pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <Crown className="w-14 h-14 text-amber-400 mx-auto mb-4 animate-float" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              FairPadel <span className="text-amber-400">Premium</span>
            </h2>
            <p className="text-light-secondary mb-8 max-w-md mx-auto">
              Lleva tu experiencia al siguiente nivel
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              {PREMIUM_BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="bg-dark-surface border border-amber-500/20 rounded-xl p-5 text-center hover:border-amber-500/40 hover:scale-105 transition-all duration-300"
                  >
                    <Icon className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                    <h4 className="font-bold text-sm mb-1">{benefit.title}</h4>
                    <p className="text-xs text-light-muted">{benefit.description}</p>
                  </div>
                );
              })}
            </div>

            <Link to="/premium">
              <Button variant="primary" className="bg-amber-500 hover:bg-amber-600 px-8 py-3 text-base">
                <Crown className="w-5 h-5 mr-2" /> Hacete Premium
              </Button>
            </Link>
          </div>
        </Card>
      </AnimatedSection>

      {/* ═══════ 11. CTA FINAL ═══════ */}
      <AnimatedSection>
        <section className="relative overflow-hidden py-12 sm:py-16">
          <div className="absolute inset-0 bg-gradient-to-t from-primary-500/10 via-transparent to-transparent" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Empeza <span className="text-primary-500">ahora</span>
            </h2>
            <p className="text-light-secondary mb-8 max-w-md mx-auto">
              Unite a la comunidad de padel mas grande de Paraguay
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!isAuthenticated ? (
                <Link to="/register">
                  <Button variant="primary" className="px-8 py-3 text-base">
                    Crear Cuenta Gratis <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link to="/tournaments">
                  <Button variant="primary" className="px-8 py-3 text-base">
                    Ver Torneos <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              )}
              <Link to="/rankings">
                <Button variant="outline" className="px-8 py-3 text-base border-light-muted">
                  Ver Rankings
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
};

export default HomePage;
