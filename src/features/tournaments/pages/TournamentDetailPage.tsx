import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Loading } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';
import inscripcionesService from '@/services/inscripcionesService';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Tournament } from '@/types';
import { Settings, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, hasRole } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [inscripciones, setInscripciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      loadTournament();
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

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  const handleInscribirse = () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/torneos/${id}` } });
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
          <Button className="mt-4" onClick={() => navigate('/torneos')}>
            Volver a Torneos
          </Button>
        </Card>
      </div>
    );
  }

  const canInscribe = tournament.estado === 'PUBLICADO' &&
                      new Date(tournament.fechaLimiteInscr) > new Date();

  const isAdmin = hasRole('admin');
  const isOwner = user?.id === tournament.organizadorId;
  const canManage = isAdmin || isOwner;

  return (
    <div className="min-h-screen bg-dark-surface">
      {/* Estilos para animación del botón */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px #22c55e, 0 0 10px #22c55e, 0 0 20px #22c55e;
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 10px #22c55e, 0 0 25px #22c55e, 0 0 40px #22c55e;
            transform: scale(1.02);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        
        .btn-inscribirse {
          animation: pulse-glow 2s ease-in-out infinite;
          background: linear-gradient(
            90deg, 
            #22c55e 0%, 
            #4ade80 25%, 
            #86efac 50%, 
            #4ade80 75%, 
            #22c55e 100%
          );
          background-size: 200% auto;
        }
        
        .btn-inscribirse:hover {
          animation: pulse-glow 1s ease-in-out infinite, shimmer 1.5s linear infinite;
        }
      `}</style>

      {/* Hero Image */}
      <div className="relative h-96 bg-gray-900">
        <img
          src={tournament.flyerUrl || 'https://via.placeholder.com/1200x400'}
          alt={tournament.nombre}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Badge className="mb-4">{tournament.estado}</Badge>
            <h1 className="text-4xl font-bold text-white mb-2">
              {tournament.nombre}
            </h1>
            <p className="text-white/90 text-lg">
              📍 {tournament.ciudad}, {tournament.pais}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripción */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Descripción</h2>
              <p className="text-light-text whitespace-pre-line">
                {tournament.descripcion || 'Sin descripción disponible'}
              </p>
            </Card>

            {/* Categorías */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Categorías</h2>
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
                <p className="text-light-secondary">Sin categorías</p>
              )}
            </Card>

            {/* Modalidades */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Modalidades</h2>
              <div className="flex flex-wrap gap-2">
                {tournament.modalidades?.map((mod: any) => (
                  <Badge key={mod.id} variant="outline">
                    {mod.modalidad}
                  </Badge>
                )) || <p className="text-light-secondary">Sin modalidades</p>}
              </div>
            </Card>

            {/* Sede */}
            {tournament.sede && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Sede</h2>
                <div className="space-y-2">
                  <p className="font-medium">{tournament.sede}</p>
                  {tournament.direccion && (
                    <p className="text-light-secondary">{tournament.direccion}</p>
                  )}
                  {tournament.mapsUrl && (
                    <a
                      href={tournament.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline flex items-center gap-1"
                    >
                      📍 Ver en Google Maps
                    </a>
                  )}
                </div>
              </Card>
            )}
            {/* Inscriptos */}
            {inscripciones.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary-500" />
                  Inscriptos ({inscripciones.length} parejas)
                </h2>
                {(() => {
                  // Agrupar por categoría
                  const grouped: Record<string, any[]> = {};
                  inscripciones.forEach((insc) => {
                    const catName = insc.category?.nombre || 'Sin categoría';
                    if (!grouped[catName]) grouped[catName] = [];
                    grouped[catName].push(insc);
                  });

                  // Separar en caballeros y damas
                  const caballerosEntries = Object.entries(grouped).filter(([name]) => name.toLowerCase().includes('caballeros'));
                  const damasEntries = Object.entries(grouped).filter(([name]) => name.toLowerCase().includes('damas'));
                  const otherEntries = Object.entries(grouped).filter(([name]) => !name.toLowerCase().includes('caballeros') && !name.toLowerCase().includes('damas'));

                  const renderGroup = (entries: [string, any[]][], title: string, color: string) => {
                    if (entries.length === 0) return null;
                    return (
                      <div className="mb-4">
                        <h4 className={`font-medium text-${color}-400 mb-2`}>{title}</h4>
                        {entries.map(([catName, inscs]) => {
                          const isExpanded = expandedCategories[catName] !== false;
                          return (
                            <div key={catName} className="mb-3">
                              <button
                                onClick={() => toggleCategory(catName)}
                                className="flex items-center justify-between w-full text-left p-2 rounded-lg hover:bg-dark-hover"
                              >
                                <span className="font-medium text-sm">{catName} ({inscs.length} parejas)</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              {isExpanded && (
                                <div className="space-y-2 mt-1 pl-2">
                                  {inscs.map((insc: any) => (
                                    <div key={insc.id} className="flex items-center gap-3 p-2 rounded-lg bg-dark-surface">
                                      <div className="flex items-center gap-2 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                                          {(insc.pareja?.jugador1?.nombre?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div className="text-sm">
                                          <p className="font-medium">
                                            {insc.pareja?.jugador1
                                              ? `${insc.pareja.jugador1.nombre} ${insc.pareja.jugador1.apellido}`
                                              : 'Jugador 1'}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="text-light-secondary text-xs">+</span>
                                      <div className="flex items-center gap-2 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-400">
                                          {(insc.pareja?.jugador2?.nombre?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div className="text-sm">
                                          <p className="font-medium">
                                            {insc.pareja?.jugador2
                                              ? `${insc.pareja.jugador2.nombre} ${insc.pareja.jugador2.apellido}`
                                              : `Doc: ${insc.pareja?.jugador2Documento || '?'}`}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  };

                  return (
                    <div>
                      {renderGroup(caballerosEntries, 'Caballeros', 'blue')}
                      {renderGroup(damasEntries, 'Damas', 'pink')}
                      {renderGroup(otherEntries, 'Otras', 'gray')}
                    </div>
                  );
                })()}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card className="p-6 sticky top-4">
              <h3 className="font-bold text-lg mb-4">Información</h3>
              
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
                  <p className="text-sm text-light-secondary mb-1">Límite inscripción</p>
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
                  className="btn-inscribirse w-full py-4 px-6 text-white text-xl font-bold rounded-xl 
                             transition-all duration-300 hover:scale-105 active:scale-95
                             flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">🎾</span>
                  <span>¡INSCRIBIRSE AHORA!</span>
                  <span className="text-2xl">🏆</span>
                </button>
              ) : tournament.estado === 'PUBLICADO' ? (
                <div className="text-center p-4 bg-yellow-900/30 rounded-lg border-2 border-yellow-500/50">
                  <p className="text-sm text-yellow-400 font-medium">
                    ⏰ Inscripciones cerradas
                  </p>
                </div>
              ) : (
                <div className="text-center p-4 bg-dark-surface rounded-lg">
                  <p className="text-sm text-light-secondary">
                    Torneo {tournament.estado.toLowerCase()}
                  </p>
                </div>
              )}
            </Card>

            {/* Botón Administrar - solo visible para organizador del torneo y admin */}
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
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Organizador</h3>
              <p className="text-light-secondary">
                {tournament.organizador
                  ? `${tournament.organizador.nombre} ${tournament.organizador.apellido}`
                  : `ID: ${tournament.organizadorId?.slice(0, 8)}...`}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}