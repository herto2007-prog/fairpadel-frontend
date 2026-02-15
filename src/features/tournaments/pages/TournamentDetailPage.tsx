import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Loading } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';
import inscripcionesService from '@/services/inscripcionesService';
import { matchesService } from '@/services/matchesService';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Tournament, Match } from '@/types';
import { Settings, Users, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import BannerZone from '@/components/BannerZone';
import { BracketView } from '@/features/matches/components/BracketView';

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, hasRole } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [inscripciones, setInscripciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Fixture state
  const [fixtureData, setFixtureData] = useState<Record<string, any>>({});
  const [fixtureGender, setFixtureGender] = useState<'caballeros' | 'damas'>('caballeros');
  const [fixtureCategory, setFixtureCategory] = useState<string>('');
  const [fixtureMatches, setFixtureMatches] = useState<Match[]>([]);
  const [loadingFixture, setLoadingFixture] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (id) {
      loadTournament();
      loadFixtureData();
    }
  }, [id]);

  const loadTournament = async () => {
    try {
      const [data, inscData] = await Promise.all([
        tournamentsService.getById(id!),
        inscripcionesService.getByTournament(id!).catch(() => []),
      ]);
      setTournament(data);
      setInscripciones(inscData);
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFixtureData = async () => {
    try {
      const data = await matchesService.obtenerFixture(id!);
      setFixtureData(data);
    } catch {
      // No fixture available yet
    }
  };

  // Derive available fixture categories grouped by gender
  const fixtureCategories = (() => {
    const cats: { id: string; nombre: string; gender: string; matches: any[] }[] = [];
    Object.entries(fixtureData).forEach(([catId, catData]: [string, any]) => {
      const rondas = catData.rondas || {};
      const allMatches = Object.values(rondas).flat() as any[];
      if (allMatches.length > 0) {
        const nombre = catData.category?.nombre || '';
        const gender = nombre.toLowerCase().includes('damas') ? 'damas' : 'caballeros';
        cats.push({ id: catId, nombre, gender, matches: allMatches });
      }
    });
    return cats;
  })();

  const caballeroCats = fixtureCategories.filter((c) => c.gender === 'caballeros');
  const damasCats = fixtureCategories.filter((c) => c.gender === 'damas');
  const hasFixtures = fixtureCategories.length > 0;

  // Auto-select first category when gender changes or data loads
  useEffect(() => {
    const cats = fixtureGender === 'caballeros' ? caballeroCats : damasCats;
    if (cats.length > 0 && (!fixtureCategory || !cats.find((c) => c.id === fixtureCategory))) {
      setFixtureCategory(cats[0].id);
    }
  }, [fixtureGender, fixtureData]);

  // Load matches when selected category changes — use obtenerFixture (public endpoint)
  useEffect(() => {
    if (fixtureCategory && id) {
      setLoadingFixture(true);
      matchesService
        .obtenerFixture(id, fixtureCategory)
        .then((data) => {
          const catData = data[fixtureCategory];
          if (catData?.rondas) {
            const allMatches = Object.values(catData.rondas).flat() as Match[];
            setFixtureMatches(allMatches);
          } else {
            setFixtureMatches([]);
          }
        })
        .catch(() => setFixtureMatches([]))
        .finally(() => setLoadingFixture(false));
    }
  }, [fixtureCategory, id]);

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  const handleInscribirse = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/tournaments/${id}` } });
      return;
    }
    navigate(`/inscripciones/nueva?tournamentId=${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <p className="text-light-secondary">Torneo no encontrado</p>
          <Button className="mt-4" onClick={() => navigate('/tournaments')}>
            Volver a Torneos
          </Button>
        </Card>
      </div>
    );
  }

  const hasOpenCategories = tournament.categorias?.some(
    (tc: any) => tc.inscripcionAbierta || tc.estado === 'INSCRIPCIONES_ABIERTAS'
  ) ?? false;
  const canInscribe = ['PUBLICADO', 'EN_CURSO'].includes(tournament.estado) && hasOpenCategories;

  const isAdmin = hasRole('admin');
  const isOwner = user?.id === tournament.organizadorId;
  const canManage = isAdmin || isOwner;

  const currentGenderCats = fixtureGender === 'caballeros' ? caballeroCats : damasCats;

  return (
    <div className="min-h-screen bg-dark-surface">
      {/* Hero Image */}
      <div className="relative h-48 sm:h-64 md:h-96 bg-gray-900">
        <img
          src={tournament.flyerUrl || 'https://via.placeholder.com/1200x400'}
          alt={tournament.nombre}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
          <div className="container mx-auto">
            <Badge className="mb-2 sm:mb-4">{tournament.estado}</Badge>
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-1 sm:mb-2 line-clamp-2">
              {tournament.nombre}
            </h1>
            <p className="text-white/90 text-sm sm:text-lg">
              {tournament.ciudad}, {tournament.pais}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Banner: Torneo Detalle */}
        <BannerZone zona="TORNEO_DETALLE" className="mb-6" layout="single" torneoId={id} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripcion */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Descripcion</h2>
              <p className="text-light-text whitespace-pre-line">
                {tournament.descripcion || 'Sin descripcion disponible'}
              </p>
            </Card>

            {/* Categorias */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Categorias</h2>
              {tournament.categorias && tournament.categorias.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Caballeros</h4>
                    <div className="flex flex-wrap gap-2">
                      {tournament.categorias
                        .filter((cat: any) => (cat.category?.nombre || '').toLowerCase().includes('caballeros'))
                        .map((cat: any) => (
                          <Badge key={cat.id} variant="outline">{cat.category?.nombre}</Badge>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-pink-400 mb-2">Damas</h4>
                    <div className="flex flex-wrap gap-2">
                      {tournament.categorias
                        .filter((cat: any) => (cat.category?.nombre || '').toLowerCase().includes('damas'))
                        .map((cat: any) => (
                          <Badge key={cat.id} variant="outline">{cat.category?.nombre}</Badge>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-light-secondary">Sin categorias</p>
              )}
            </Card>

            {/* Modalidades */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Modalidades</h2>
              <div className="flex flex-wrap gap-2">
                {tournament.modalidades?.map((mod: any) => (
                  <Badge key={mod.id} variant="outline">
                    {mod.modalidad}
                  </Badge>
                )) || <p className="text-light-secondary">Sin modalidades</p>}
              </div>
            </Card>

            {/* Sede */}
            {(tournament.sedePrincipal || tournament.sede) && (
              <Card className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Sede</h2>
                <div className="space-y-2">
                  <p className="font-medium">
                    {tournament.sedePrincipal?.nombre || tournament.sede}
                  </p>
                  {(tournament.sedePrincipal?.direccion || tournament.direccion) && (
                    <p className="text-light-secondary">
                      {tournament.sedePrincipal?.direccion || tournament.direccion}
                    </p>
                  )}
                  {(tournament.sedePrincipal?.mapsUrl || tournament.mapsUrl) && (
                    <a
                      href={tournament.sedePrincipal?.mapsUrl || tournament.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline flex items-center gap-1"
                    >
                      Ver en Google Maps
                    </a>
                  )}
                  {tournament.sedePrincipal?.canchas && tournament.sedePrincipal.canchas.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dark-border">
                      <p className="text-sm text-light-secondary mb-2">
                        {tournament.sedePrincipal.canchas.length} cancha{tournament.sedePrincipal.canchas.length !== 1 ? 's' : ''} disponible{tournament.sedePrincipal.canchas.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tournament.sedePrincipal.canchas.filter(c => c.activa).map(cancha => (
                          <span key={cancha.id} className="text-xs px-2 py-1 bg-dark-bg rounded-md text-light-secondary">
                            {cancha.nombre} ({cancha.tipo.toLowerCase().replace('_', ' ')})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Inscriptos */}
            {inscripciones.length > 0 && (
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
                  Inscriptos ({inscripciones.length})
                </h2>
                {(() => {
                  const grouped: Record<string, any[]> = {};
                  inscripciones.forEach((insc) => {
                    const catName = insc.category?.nombre || 'Sin categoria';
                    if (!grouped[catName]) grouped[catName] = [];
                    grouped[catName].push(insc);
                  });

                  const sortCat = (a: [string, any[]], b: [string, any[]]) => a[0].localeCompare(b[0], 'es', { numeric: true });
                  const caballerosEntries = Object.entries(grouped).filter(([name]) => name.toLowerCase().includes('caballeros')).sort(sortCat);
                  const damasEntries = Object.entries(grouped).filter(([name]) => name.toLowerCase().includes('damas')).sort(sortCat);

                  const PlayerAvatar = ({ player, size = 28 }: { player?: any; size?: number }) => {
                    if (!player) {
                      return (
                        <div
                          className="rounded-full bg-dark-border flex items-center justify-center flex-shrink-0"
                          style={{ width: size, height: size }}
                        >
                          <span className="text-light-secondary" style={{ fontSize: size * 0.4 }}>?</span>
                        </div>
                      );
                    }
                    const initials = `${player.nombre?.charAt(0) || ''}${player.apellido?.charAt(0) || ''}`.toUpperCase();
                    if (player.fotoUrl) {
                      return (
                        <img
                          src={player.fotoUrl}
                          alt={initials}
                          className="rounded-full object-cover flex-shrink-0 border border-dark-border"
                          style={{ width: size, height: size }}
                        />
                      );
                    }
                    return (
                      <div
                        className="rounded-full bg-primary-500/30 flex items-center justify-center flex-shrink-0 border border-primary-500/20"
                        style={{ width: size, height: size }}
                      >
                        <span className="text-primary-300 font-semibold leading-none" style={{ fontSize: size * 0.38 }}>
                          {initials}
                        </span>
                      </div>
                    );
                  };

                  const renderColumn = (entries: [string, any[]][], title: string, accentColor: string) => {
                    if (entries.length === 0) return null;
                    return (
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-${accentColor}-400 mb-3 text-center text-sm uppercase tracking-wider`}>
                          {title}
                        </h4>
                        <div className="space-y-4">
                          {entries.map(([catName, inscs]) => {
                            // Default: collapsed
                            const isExpanded = expandedCategories[catName] === true;
                            return (
                              <div key={catName}>
                                <button
                                  onClick={() => toggleCategory(catName)}
                                  className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg hover:bg-dark-hover border border-dark-border bg-dark-bg"
                                >
                                  <span className="font-medium text-sm">{catName.replace(' Caballeros', '').replace(' Damas', '')}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs text-${accentColor}-400 font-medium`}>{inscs.length}</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </div>
                                </button>
                                {isExpanded && (
                                  <div className="space-y-1 mt-1">
                                    {inscs.map((insc: any, idx: number) => (
                                      <div key={insc.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-dark-surface">
                                        <span className="text-xs text-light-secondary w-5 text-right flex-shrink-0">{idx + 1}</span>
                                        <div className="flex -space-x-1.5 flex-shrink-0">
                                          <PlayerAvatar player={insc.pareja?.jugador1} size={26} />
                                          <PlayerAvatar player={insc.pareja?.jugador2} size={26} />
                                        </div>
                                        <div className="text-sm min-w-0 flex-1">
                                          <p className="truncate">
                                            <span className="font-medium">
                                              {insc.pareja?.jugador1
                                                ? `${insc.pareja.jugador1.nombre?.charAt(0)}. ${insc.pareja.jugador1.apellido}`
                                                : '?'}
                                            </span>
                                            <span className="text-light-secondary mx-1">/</span>
                                            <span className="font-medium">
                                              {insc.pareja?.jugador2
                                                ? `${insc.pareja.jugador2.nombre?.charAt(0)}. ${insc.pareja.jugador2.apellido}`
                                                : `Doc: ${insc.pareja?.jugador2Documento || '?'}`}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderColumn(caballerosEntries, 'Caballeros', 'blue')}
                      {renderColumn(damasEntries, 'Damas', 'pink')}
                    </div>
                  );
                })()}
              </Card>
            )}

            {/* Fixtures */}
            {hasFixtures && (
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
                  Fixture
                </h2>

                {/* Gender tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setFixtureGender('caballeros')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      fixtureGender === 'caballeros'
                        ? 'bg-blue-500 text-white'
                        : 'bg-dark-bg text-light-secondary hover:bg-dark-hover border border-dark-border'
                    }`}
                    disabled={caballeroCats.length === 0}
                  >
                    Caballeros {caballeroCats.length > 0 && `(${caballeroCats.length})`}
                  </button>
                  <button
                    onClick={() => setFixtureGender('damas')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      fixtureGender === 'damas'
                        ? 'bg-pink-500 text-white'
                        : 'bg-dark-bg text-light-secondary hover:bg-dark-hover border border-dark-border'
                    }`}
                    disabled={damasCats.length === 0}
                  >
                    Damas {damasCats.length > 0 && `(${damasCats.length})`}
                  </button>
                </div>

                {/* Category tabs */}
                {currentGenderCats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {currentGenderCats.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFixtureCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          fixtureCategory === cat.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-bg text-light-secondary hover:bg-dark-hover border border-dark-border'
                        }`}
                      >
                        {cat.nombre.replace(' Caballeros', '').replace(' Damas', '')}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bracket */}
                {loadingFixture ? (
                  <div className="flex justify-center py-8">
                    <Loading size="md" text="Cargando fixture..." />
                  </div>
                ) : fixtureMatches.length > 0 ? (
                  <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                    <BracketView matches={fixtureMatches} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-light-muted">
                    <p className="text-sm">Sin fixture para esta categoria</p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar — fully sticky */}
          <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
            {/* Info Card */}
            <Card className="p-4 sm:p-6">
              <h3 className="font-bold text-lg mb-3 sm:mb-4">Informacion</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-light-secondary mb-1">Fecha de inicio</p>
                  <p className="font-medium">{formatDate(tournament.fechaInicio)}</p>
                </div>

                <div>
                  <p className="text-sm text-light-secondary mb-1">Fecha de fin</p>
                  <p className="font-medium">{formatDate(tournament.fechaFin)}</p>
                </div>

                <div>
                  <p className="text-sm text-light-secondary mb-1">Limite inscripcion</p>
                  <p className="font-medium">{formatDate(tournament.fechaLimiteInscr)}</p>
                </div>

                <div>
                  <p className="text-sm text-light-secondary mb-1">Costo</p>
                  <p className="font-bold text-2xl text-primary-600">
                    {tournament.costoInscripcion > 0
                      ? formatCurrency(Number(tournament.costoInscripcion))
                      : 'Gratis'}
                  </p>
                </div>
              </div>

              {canInscribe ? (
                <button
                  onClick={handleInscribirse}
                  className="w-full py-3.5 px-6 bg-primary-500 hover:bg-primary-600 text-white text-lg font-bold rounded-xl
                             transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  Inscribirse
                </button>
              ) : ['PUBLICADO', 'EN_CURSO'].includes(tournament.estado) ? (
                <div className="text-center p-4 bg-yellow-900/30 rounded-lg border border-yellow-500/50">
                  <p className="text-sm text-yellow-400 font-medium">
                    Todas las inscripciones cerradas
                  </p>
                </div>
              ) : (
                <div className="text-center p-4 bg-dark-surface rounded-lg">
                  <p className="text-sm text-light-secondary">
                    Torneo {tournament.estado.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
              )}
            </Card>

            {/* Boton Administrar */}
            {canManage && (
              <button
                onClick={() => navigate(`/tournaments/${id}/manage`)}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl
                           transition-all duration-200 hover:scale-[1.02] active:scale-95
                           flex items-center justify-center gap-2 shadow-lg"
              >
                <Settings className="w-5 h-5" />
                <span>Administrar Torneo</span>
              </button>
            )}

            {/* Organizador Card */}
            <Card className="p-4 sm:p-6">
              <h3 className="font-bold text-lg mb-3 sm:mb-4">Organizador</h3>
              <p className="text-light-secondary">
                {tournament.organizador
                  ? `${tournament.organizador.nombre} ${tournament.organizador.apellido}`
                  : `ID: ${tournament.organizadorId?.slice(0, 8)}...`}
              </p>
            </Card>

            {/* Banner: Sidebar */}
            <BannerZone zona="SIDEBAR" layout="carousel" torneoId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
