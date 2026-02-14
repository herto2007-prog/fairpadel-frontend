import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import type { MatchResumen } from '@/types';
import { Trophy, Swords } from 'lucide-react';

interface Props {
  matches: MatchResumen[];
}

const RONDA_BADGES: Record<string, { label: string; color: string }> = {
  FINAL: { label: 'Final', color: 'bg-yellow-500/20 text-yellow-400' },
  SEMIFINAL: { label: 'Semi', color: 'bg-purple-500/20 text-purple-400' },
  CUARTOS: { label: 'Cuartos', color: 'bg-blue-500/20 text-blue-400' },
  OCTAVOS: { label: 'Octavos', color: 'bg-cyan-500/20 text-cyan-400' },
  UBICACION: { label: '3er puesto', color: 'bg-orange-500/20 text-orange-400' },
  ACOMODACION_1: { label: 'Acom. 1', color: 'bg-gray-500/20 text-gray-400' },
  ACOMODACION_2: { label: 'Acom. 2', color: 'bg-gray-500/20 text-gray-400' },
};

function formatScore(resultado: MatchResumen['resultado']): string {
  const sets = [resultado.set1, resultado.set2, resultado.set3].filter(Boolean);
  return sets.join('  ');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PlayerName({ player }: { player: { id: string; nombre: string; apellido: string } | null }) {
  if (!player) return <span className="text-light-tertiary">—</span>;
  return (
    <Link
      to={`/profile/${player.id}`}
      className="hover:text-primary-400 transition-colors"
    >
      {player.nombre} {player.apellido.charAt(0)}.
    </Link>
  );
}

const MatchHistoryList = ({ matches }: Props) => {
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Swords className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Últimos Partidos</h3>
          </div>
          <div className="text-center py-8 text-light-tertiary text-sm">
            Sin partidos registrados aún
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Swords className="h-5 w-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">Últimos Partidos</h3>
        </div>

        <div className="space-y-2">
          {matches.map((match) => {
            const rondaInfo = RONDA_BADGES[match.ronda] || {
              label: match.ronda,
              color: 'bg-gray-500/20 text-gray-400',
            };

            return (
              <div
                key={match.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-l-3 transition-colors ${
                  match.victoria
                    ? 'border-l-green-500 bg-green-500/5'
                    : 'border-l-red-500 bg-red-500/5'
                }`}
              >
                {/* Result icon */}
                <div className="flex-shrink-0">
                  {match.victoria ? (
                    <Trophy className="h-4 w-4 text-green-400" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-red-400" />
                  )}
                </div>

                {/* Match details */}
                <div className="flex-1 min-w-0">
                  {/* Score */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-mono text-sm font-bold ${
                        match.victoria ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {match.esWO ? 'W.O.' : formatScore(match.resultado)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${rondaInfo.color}`}>
                      {rondaInfo.label}
                    </span>
                  </div>

                  {/* Players */}
                  <div className="text-xs text-light-secondary">
                    {match.companero && (
                      <span>
                        c/ <PlayerName player={match.companero} />
                      </span>
                    )}
                    {match.oponentes && (
                      <span className="text-light-tertiary">
                        {' vs '}
                        <PlayerName player={match.oponentes.jugador1} />
                        {match.oponentes.jugador2 && (
                          <>
                            {' / '}
                            <PlayerName player={match.oponentes.jugador2} />
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Tournament + date */}
                  <div className="text-[11px] text-light-tertiary mt-0.5">
                    {match.torneo && (
                      <Link
                        to={`/tournaments/${match.torneo.id}`}
                        className="hover:text-primary-400 transition-colors"
                      >
                        {match.torneo.nombre}
                      </Link>
                    )}
                    {match.categoria && (
                      <span className="text-light-tertiary"> · {match.categoria.nombre}</span>
                    )}
                    <span className="text-light-tertiary"> · {formatDate(match.fecha)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchHistoryList;
