import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { circuitosService } from '@/services/circuitosService';
import { Loading, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { Trophy, Calendar, MapPin, Users, Medal } from 'lucide-react';
import type { Circuito, CircuitoStanding, Tournament } from '@/types';
import { CircuitoEstado, Gender, TournamentStatus } from '@/types';
import { formatDate, formatShortDate } from '@/lib/utils';

const getCircuitoEstadoBadgeVariant = (estado: CircuitoEstado) => {
  switch (estado) {
    case CircuitoEstado.ACTIVO:
      return 'success' as const;
    case CircuitoEstado.FINALIZADO:
      return 'info' as const;
    case CircuitoEstado.CANCELADO:
      return 'danger' as const;
    default:
      return 'default' as const;
  }
};

const getTournamentEstadoBadgeVariant = (estado: TournamentStatus) => {
  switch (estado) {
    case TournamentStatus.PUBLICADO:
      return 'info' as const;
    case TournamentStatus.EN_CURSO:
      return 'warning' as const;
    case TournamentStatus.FINALIZADO:
      return 'success' as const;
    default:
      return 'default' as const;
  }
};

const CircuitoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [circuito, setCircuito] = useState<Circuito | null>(null);
  const [standings, setStandings] = useState<CircuitoStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [generoTab, setGeneroTab] = useState<Gender>(Gender.MASCULINO);

  useEffect(() => {
    if (id) {
      loadCircuito();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadStandings();
    }
  }, [id, generoTab]);

  const loadCircuito = async () => {
    setLoading(true);
    try {
      const data = await circuitosService.getById(id!);
      setCircuito(data);
    } catch (error) {
      console.error('Error loading circuito:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStandings = async () => {
    setStandingsLoading(true);
    try {
      const data = await circuitosService.getStandings(id!, generoTab);
      setStandings(data);
    } catch (error) {
      console.error('Error loading standings:', error);
      setStandings([]);
    } finally {
      setStandingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando circuito..." />
      </div>
    );
  }

  if (!circuito) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-light-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-light-text mb-2">
              Circuito no encontrado
            </h3>
            <p className="text-light-secondary mb-4">
              El circuito que buscas no existe o fue eliminado.
            </p>
            <Link
              to="/circuitos"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Volver a Circuitos
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Circuit Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link
            to="/circuitos"
            className="text-sm text-light-secondary hover:text-primary-400 transition-colors"
          >
            Circuitos
          </Link>
          <span className="text-light-secondary">/</span>
          <span className="text-sm text-light-text">{circuito.nombre}</span>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-3xl font-bold text-light-text">
                  {circuito.nombre}
                </h1>
                <Badge variant={getCircuitoEstadoBadgeVariant(circuito.estado)}>
                  {circuito.estado}
                </Badge>
              </div>

              <p className="text-primary-400 font-medium text-lg mb-3">
                {circuito.temporada}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-light-secondary">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {circuito.ciudad
                      ? `${circuito.ciudad}, ${circuito.pais}`
                      : circuito.pais}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(circuito.fechaInicio)} - {formatDate(circuito.fechaFin)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4" />
                  <span>
                    {circuito._count?.torneos ?? circuito.torneos?.length ?? 0} torneos
                  </span>
                </div>
              </div>

              {circuito.descripcion && (
                <p className="mt-4 text-light-secondary leading-relaxed">
                  {circuito.descripcion}
                </p>
              )}
            </div>

            {circuito.logoUrl && (
              <img
                src={circuito.logoUrl}
                alt={circuito.nombre}
                className="w-24 h-24 object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Torneos del Circuito */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary-400" />
                Torneos del Circuito
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!circuito.torneos || circuito.torneos.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-light-secondary mx-auto mb-3" />
                  <p className="text-light-secondary">
                    Este circuito aun no tiene torneos asignados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {circuito.torneos.map((torneo: Tournament) => (
                    <Link
                      key={torneo.id}
                      to={`/tournaments/${torneo.id}`}
                      className="block group"
                    >
                      <div className="p-4 rounded-lg bg-dark-surface border border-dark-border hover:border-primary-500/50 hover:bg-dark-hover transition-all duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-light-text group-hover:text-primary-400 transition-colors truncate">
                              {torneo.nombre}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-light-secondary">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {formatShortDate(torneo.fechaInicio)} - {formatShortDate(torneo.fechaFin)}
                                </span>
                              </div>
                              {torneo.organizador && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>
                                    {torneo.organizador.nombre} {torneo.organizador.apellido}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={getTournamentEstadoBadgeVariant(torneo.estado)}>
                              {torneo.estado.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Standings */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-primary-400" />
                Standings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Gender Tabs */}
              <div className="flex rounded-lg bg-dark-surface border border-dark-border p-1 mb-4">
                <button
                  onClick={() => setGeneroTab(Gender.MASCULINO)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    generoTab === Gender.MASCULINO
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                      : 'text-light-secondary hover:text-light-text'
                  }`}
                >
                  Masculino
                </button>
                <button
                  onClick={() => setGeneroTab(Gender.FEMENINO)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    generoTab === Gender.FEMENINO
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                      : 'text-light-secondary hover:text-light-text'
                  }`}
                >
                  Femenino
                </button>
              </div>

              {/* Standings Table */}
              {standingsLoading ? (
                <div className="flex justify-center py-8">
                  <Loading size="md" text="Cargando standings..." />
                </div>
              ) : standings.length === 0 ? (
                <div className="text-center py-8">
                  <Medal className="h-12 w-12 text-light-secondary mx-auto mb-3" />
                  <p className="text-sm text-light-secondary">
                    No hay standings disponibles para esta categoria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-border">
                        <th className="px-2 py-2 text-left text-xs font-semibold text-light-secondary">
                          #
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-light-secondary">
                          Jugador
                        </th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-light-secondary">
                          Pts
                        </th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-light-secondary">
                          TJ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {standings.map((standing) => (
                        <tr
                          key={standing.jugador.id}
                          className="hover:bg-dark-hover transition-colors"
                        >
                          <td className="px-2 py-2.5">
                            {standing.posicion <= 3 ? (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                  standing.posicion === 1
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : standing.posicion === 2
                                      ? 'bg-gray-400/20 text-gray-300'
                                      : 'bg-amber-700/20 text-amber-500'
                                }`}
                              >
                                {standing.posicion}
                              </span>
                            ) : (
                              <span className="text-sm text-light-secondary pl-1">
                                {standing.posicion}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-light-text truncate max-w-[140px]">
                                {standing.jugador.nombre} {standing.jugador.apellido}
                              </p>
                              {standing.jugador.ciudad && (
                                <p className="text-xs text-light-secondary truncate max-w-[140px]">
                                  {standing.jugador.ciudad}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <span className="text-sm font-bold text-primary-400">
                              {standing.puntosTotales}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <span className="text-sm text-light-secondary">
                              {standing.torneosJugados}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CircuitoDetailPage;
