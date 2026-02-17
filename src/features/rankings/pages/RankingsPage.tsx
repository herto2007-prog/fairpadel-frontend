import { useState, useEffect } from 'react';
import { rankingsService } from '@/services/rankingsService';
import { Loading, Card, CardContent, Badge, Select } from '@/components/ui';
import type { Ranking } from '@/types';
import { Gender, TipoRanking } from '@/types';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown } from 'lucide-react';
import BannerZone from '@/components/BannerZone';

const RankingsPage = () => {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [genero, setGenero] = useState<Gender>(Gender.MASCULINO);
  const [tipoRanking, setTipoRanking] = useState<TipoRanking>(TipoRanking.GLOBAL);

  useEffect(() => {
    loadRankings();
  }, [genero, tipoRanking]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const data = await rankingsService.getAll({
        genero,
        tipoRanking,
        limit: 100,
      });
      setRankings(data);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionChange = (ranking: Ranking) => {
    if (!ranking.posicionAnterior) return null;
    const diff = ranking.posicionAnterior - ranking.posicion;
    
    if (diff > 0) {
      return (
        <span className="flex items-center text-green-400 text-sm">
          <TrendingUp className="h-4 w-4 mr-1" />
          +{diff}
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="flex items-center text-red-400 text-sm">
          <TrendingDown className="h-4 w-4 mr-1" />
          {diff}
        </span>
      );
    }
    return (
      <span className="flex items-center text-light-secondary text-sm">
        <Minus className="h-4 w-4" />
      </span>
    );
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return <Badge variant="warning" className="text-lg">🥇 1°</Badge>;
    } else if (position === 2) {
      return <Badge variant="secondary" className="text-lg">🥈 2°</Badge>;
    } else if (position === 3) {
      return <Badge variant="info" className="text-lg">🥉 3°</Badge>;
    }
    return <Badge variant="default">{position}°</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando rankings..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Banner: Header zone — slim strip, solo en rankings */}
      <BannerZone zona="HEADER" className="mb-6" layout="single" />

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text flex items-center gap-2">
          <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
          Rankings
        </h1>
        <p className="text-light-secondary mt-1 sm:mt-2 text-sm sm:text-base">
          Clasificación de los mejores jugadores de pádel
        </p>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Select
          value={genero}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGenero(e.target.value as Gender)}
          className="w-32 sm:w-40"
        >
          <option value={Gender.MASCULINO}>Masculino</option>
          <option value={Gender.FEMENINO}>Femenino</option>
        </Select>

        <Select
          value={tipoRanking}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTipoRanking(e.target.value as TipoRanking)}
          className="w-28 sm:w-40"
        >
          <option value={TipoRanking.GLOBAL}>Global</option>
          <option value={TipoRanking.PAIS}>País</option>
          <option value={TipoRanking.CIUDAD}>Ciudad</option>
        </Select>
      </div>

      {rankings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">No hay rankings disponibles</h3>
            <p className="text-light-secondary">
              Aún no hay datos de ranking para estos filtros
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-surface border-b border-dark-border">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-light-secondary">Pos.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-light-secondary">Jugador</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-light-secondary">Puntos</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-light-secondary">Torneos</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-light-secondary">V/D</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-light-secondary">%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-light-secondary">Cambio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {rankings.map((ranking) => (
                    <tr key={ranking.id} className="hover:bg-dark-hover">
                      <td className="px-4 py-3">
                        {getPositionBadge(ranking.posicion)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-semibold overflow-hidden">
                            {ranking.jugador?.fotoUrl ? (
                              <img src={ranking.jugador.fotoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              ranking.jugador?.nombre?.charAt(0) || '?'
                            )}
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-1">
                              {ranking.jugador?.nombre} {ranking.jugador?.apellido}
                              {(ranking.jugador as any)?.esPremium && (
                                <Crown className="h-3.5 w-3.5 text-yellow-500" />
                              )}
                            </p>
                            <p className="text-sm text-light-secondary">
                              {ranking.jugador?.ciudad || 'Sin ciudad'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-primary-500">
                        {ranking.puntosTotales}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ranking.torneosJugados}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-green-400">{ranking.victorias}</span>
                        /
                        <span className="text-red-400">{ranking.derrotas}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ranking.porcentajeVictorias
                          ? `${Number(ranking.porcentajeVictorias).toFixed(0)}%`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getPositionChange(ranking)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-dark-border">
              {rankings.map((ranking) => (
                <div key={ranking.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="w-8 text-center flex-shrink-0">
                    {getPositionBadge(ranking.posicion)}
                  </div>
                  <div className="h-9 w-9 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-semibold text-sm flex-shrink-0 overflow-hidden">
                    {ranking.jugador?.fotoUrl ? (
                      <img src={ranking.jugador.fotoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      ranking.jugador?.nombre?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate flex items-center gap-1">
                      {ranking.jugador?.nombre} {ranking.jugador?.apellido}
                      {(ranking.jugador as any)?.esPremium && (
                        <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      )}
                    </p>
                    <p className="text-xs text-light-secondary">
                      {ranking.torneosJugados} torneos · <span className="text-green-400">{ranking.victorias}</span>/<span className="text-red-400">{ranking.derrotas}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-primary-500 text-sm">{ranking.puntosTotales} pts</p>
                    <div className="text-xs">{getPositionChange(ranking)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RankingsPage;
