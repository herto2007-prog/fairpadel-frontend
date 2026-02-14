import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import type { HistorialPuntosExtended } from '@/types';
import { Award, TrendingUp } from 'lucide-react';

interface Props {
  historial: HistorialPuntosExtended[];
}

const POSICION_CONFIG: Record<string, { emoji: string; color: string }> = {
  'Campeón': { emoji: '🥇', color: 'text-yellow-400' },
  'CAMPEON': { emoji: '🥇', color: 'text-yellow-400' },
  'Finalista': { emoji: '🥈', color: 'text-gray-300' },
  'FINALISTA': { emoji: '🥈', color: 'text-gray-300' },
  'Semifinalista': { emoji: '🥉', color: 'text-amber-600' },
  'SEMIFINALISTA': { emoji: '🥉', color: 'text-amber-600' },
  'Cuartos de Final': { emoji: '4°', color: 'text-blue-400' },
  'CUARTOS': { emoji: '4°', color: 'text-blue-400' },
  'Octavos de Final': { emoji: '8°', color: 'text-cyan-400' },
  'OCTAVOS': { emoji: '8°', color: 'text-cyan-400' },
  'Primera Ronda': { emoji: '—', color: 'text-light-tertiary' },
  'PRIMERA_RONDA': { emoji: '—', color: 'text-light-tertiary' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TournamentHistoryList = ({ historial }: Props) => {
  if (historial.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Historial de Torneos</h3>
          </div>
          <div className="text-center py-8 text-light-tertiary text-sm">
            Sin torneos registrados aún
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">Historial de Torneos</h3>
        </div>

        <div className="space-y-2">
          {historial.map((item) => {
            const posConfig = POSICION_CONFIG[item.posicionFinal] || {
              emoji: '—',
              color: 'text-light-tertiary',
            };

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-surface transition-colors"
              >
                {/* Position badge */}
                <div className={`flex-shrink-0 w-8 text-center text-lg ${posConfig.color}`}>
                  {posConfig.emoji}
                </div>

                {/* Tournament info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.tournament ? (
                      <Link
                        to={`/tournaments/${item.tournament.id}`}
                        className="text-sm font-medium text-white hover:text-primary-400 transition-colors truncate"
                      >
                        {item.tournament.nombre}
                      </Link>
                    ) : (
                      <span className="text-sm text-light-tertiary">Torneo eliminado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-light-tertiary mt-0.5">
                    {item.category && <span>{item.category.nombre}</span>}
                    {item.tournament?.ciudad && (
                      <span>· {item.tournament.ciudad}</span>
                    )}
                    <span>· {formatDate(item.fechaTorneo)}</span>
                  </div>
                </div>

                {/* Points earned */}
                <div className="flex-shrink-0 flex items-center gap-1 text-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                  <span className="font-bold text-green-400">+{item.puntos}</span>
                  <span className="text-light-tertiary text-xs">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentHistoryList;
