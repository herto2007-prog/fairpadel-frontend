import { Badge } from '@/components/ui';
import type { Ranking } from '@/types';

interface RankingTableProps {
  rankings: Ranking[];
  showTrend?: boolean;
}

export default function RankingTable({ rankings, showTrend = true }: RankingTableProps) {
  const getMedalIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
  };

  const getTrendIcon = (ranking: Ranking) => {
    if (!ranking.posicionAnterior) return '→';
    
    const diff = ranking.posicionAnterior - ranking.posicion;
    if (diff > 0) return `⬆️ +${diff}`;
    if (diff < 0) return `⬇️ ${diff}`;
    return '→';
  };

  const getTrendColor = (ranking: Ranking) => {
    if (!ranking.posicionAnterior) return 'text-light-secondary';
    
    const diff = ranking.posicionAnterior - ranking.posicion;
    if (diff > 0) return 'text-green-400';
    if (diff < 0) return 'text-red-400';
    return 'text-light-secondary';
  };

  if (rankings.length === 0) {
    return (
      <div className="bg-dark-card rounded-lg shadow p-12 text-center">
        <p className="text-light-secondary">No hay rankings disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-card rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-surface border-b border-dark-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-light-secondary uppercase tracking-wider">
                Pos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-light-secondary uppercase tracking-wider">
                Jugador
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-light-secondary uppercase tracking-wider">
                Puntos
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-light-secondary uppercase tracking-wider">
                Torneos
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-light-secondary uppercase tracking-wider">
                V-D
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-light-secondary uppercase tracking-wider">
                % Victorias
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-light-secondary uppercase tracking-wider">
                🏆
              </th>
              {showTrend && (
                <th className="px-6 py-3 text-center text-xs font-medium text-light-secondary uppercase tracking-wider">
                  Tendencia
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {rankings.map((ranking) => (
              <tr 
                key={ranking.id}
                className="hover:bg-dark-hover transition-colors cursor-pointer"
              >
                {/* Posición */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      ranking.posicion <= 3 ? 'text-primary-600' : 'text-light-text'
                    }`}>
                      {ranking.posicion}
                    </span>
                    {getMedalIcon(ranking.posicion) && (
                      <span className="text-xl">{getMedalIcon(ranking.posicion)}</span>
                    )}
                  </div>
                </td>

                {/* Jugador */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-bold">
                          {ranking.jugadorId.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-light-text">
                        Jugador #{ranking.jugadorId.slice(0, 8)}
                      </div>
                      <div className="text-xs text-light-secondary">
                        {ranking.genero}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Puntos */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-lg font-bold text-primary-600">
                    {ranking.puntosTotales.toLocaleString()}
                  </span>
                </td>

                {/* Torneos */}
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-light-text">
                  {ranking.torneosJugados}
                </td>

                {/* V-D */}
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  <span className="text-green-400 font-medium">{ranking.victorias}</span>
                  <span className="text-light-secondary"> - </span>
                  <span className="text-red-400 font-medium">{ranking.derrotas}</span>
                </td>

                {/* % Victorias */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <Badge variant={
                    Number(ranking.porcentajeVictorias) >= 70 ? 'success' :
                    Number(ranking.porcentajeVictorias) >= 50 ? 'warning' : 'default'
                  }>
                    {ranking.porcentajeVictorias}%
                  </Badge>
                </td>

                {/* Campeonatos */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-xl">🏆</span>
                    <span className="font-medium">{ranking.campeonatos}</span>
                  </span>
                </td>

                {/* Tendencia */}
                {showTrend && (
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-sm font-medium ${getTrendColor(ranking)}`}>
                      {getTrendIcon(ranking)}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}