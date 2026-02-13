import { Card, CardContent, Badge } from '@/components/ui';
import type { Match } from '@/types';
import { MatchStatus } from '@/types';

interface BracketViewProps {
  matches: Match[];
}

// Orden de rondas para visualización del bracket
const ROUND_ORDER: Record<string, number> = {
  DIECISEISAVOS: 1,
  RONDA_6: 1,
  RONDA_5: 1,
  OCTAVOS: 2,
  CUARTOS: 3,
  SEMIFINAL: 4,
  FINAL: 5,
  UBICACION: 6,
};

const ROUND_LABELS: Record<string, string> = {
  DIECISEISAVOS: 'Dieciseisavos',
  OCTAVOS: 'Octavos',
  CUARTOS: 'Cuartos',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
  UBICACION: '3er y 4to Puesto',
};

export const BracketView: React.FC<BracketViewProps> = ({ matches }) => {
  // Agrupar partidos por ronda (string) en vez de numeroRonda (secuencial)
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.ronda;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Ordenar matches dentro de cada ronda por numeroRonda (para mantener orden del bracket)
  for (const round of Object.keys(matchesByRound)) {
    matchesByRound[round].sort((a, b) => a.numeroRonda - b.numeroRonda);
  }

  // Obtener rondas principales (sin UBICACION)
  const mainRounds = Object.keys(matchesByRound)
    .filter((r) => r !== 'UBICACION')
    .sort((a, b) => (ROUND_ORDER[a] || 0) - (ROUND_ORDER[b] || 0));

  const ubicacionMatches = matchesByRound['UBICACION'] || [];

  const getRoundName = (roundKey: string) => {
    return ROUND_LABELS[roundKey] || roundKey.replace('RONDA_', 'Ronda ');
  };

  const getStatusBadge = (status: MatchStatus) => {
    const variants: Record<MatchStatus, { variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; label: string }> = {
      [MatchStatus.PROGRAMADO]: { variant: 'default', label: 'Programado' },
      [MatchStatus.EN_JUEGO]: { variant: 'warning', label: 'En Juego' },
      [MatchStatus.FINALIZADO]: { variant: 'success', label: 'Finalizado' },
      [MatchStatus.SUSPENDIDO]: { variant: 'danger', label: 'Suspendido' },
      [MatchStatus.WO]: { variant: 'danger', label: 'W.O.' },
      [MatchStatus.CANCELADO]: { variant: 'danger', label: 'Cancelado' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getParejaName = (match: Match, parejaNum: 1 | 2) => {
    const pareja = parejaNum === 1 ? match.pareja1 : match.pareja2;
    if (!pareja) return 'TBD';

    const j1 = pareja.jugador1;
    const j2 = pareja.jugador2;

    if (!j1) return 'TBD';

    const name1 = `${j1.nombre?.charAt(0)}. ${j1.apellido}`;
    const name2 = j2 ? `${j2.nombre?.charAt(0)}. ${j2.apellido}` : 'TBD';

    return `${name1} / ${name2}`;
  };

  const getScore = (match: Match, parejaNum: 1 | 2) => {
    if (match.estado !== MatchStatus.FINALIZADO && match.estado !== MatchStatus.WO) return null;

    const scores = [];
    if (match.set1Pareja1 !== null && match.set1Pareja1 !== undefined &&
        match.set1Pareja2 !== null && match.set1Pareja2 !== undefined) {
      scores.push(parejaNum === 1 ? match.set1Pareja1 : match.set1Pareja2);
    }
    if (match.set2Pareja1 !== null && match.set2Pareja1 !== undefined &&
        match.set2Pareja2 !== null && match.set2Pareja2 !== undefined) {
      scores.push(parejaNum === 1 ? match.set2Pareja1 : match.set2Pareja2);
    }
    if (match.set3Pareja1 !== null && match.set3Pareja1 !== undefined &&
        match.set3Pareja2 !== null && match.set3Pareja2 !== undefined) {
      scores.push(parejaNum === 1 ? match.set3Pareja1 : match.set3Pareja2);
    }

    return scores.length > 0 ? scores.join(' - ') : null;
  };

  const isWinner = (match: Match, parejaNum: 1 | 2) => {
    const parejaId = parejaNum === 1 ? match.pareja1Id : match.pareja2Id;
    return match.parejaGanadoraId === parejaId;
  };

  const renderMatchCard = (match: Match) => (
    <Card key={match.id} className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header con estado */}
        <div className="flex justify-between items-center px-3 py-2 bg-dark-surface border-b border-dark-border">
          <span className="text-xs text-light-secondary">
            {match.fechaProgramada
              ? new Date(match.fechaProgramada).toLocaleDateString()
              : 'Sin fecha'
            }
            {match.horaProgramada && ` ${match.horaProgramada}`}
          </span>
          {getStatusBadge(match.estado)}
        </div>

        {/* Pareja 1 */}
        <div className={`flex justify-between items-center px-3 py-2 border-b border-dark-border ${
          isWinner(match, 1) ? 'bg-green-900/30' : ''
        }`}>
          <span className={`text-sm ${isWinner(match, 1) ? 'font-semibold' : ''}`}>
            {getParejaName(match, 1)}
          </span>
          <span className="font-mono font-semibold">
            {getScore(match, 1)}
          </span>
        </div>

        {/* Pareja 2 */}
        <div className={`flex justify-between items-center px-3 py-2 ${
          isWinner(match, 2) ? 'bg-green-900/30' : ''
        }`}>
          <span className={`text-sm ${isWinner(match, 2) ? 'font-semibold' : ''}`}>
            {getParejaName(match, 2)}
          </span>
          <span className="font-mono font-semibold">
            {getScore(match, 2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Bracket principal */}
      <div className="overflow-x-auto">
        <div className="flex gap-8 min-w-max p-4">
          {mainRounds.map((roundKey) => (
            <div key={roundKey} className="flex flex-col gap-4 min-w-[280px]">
              <h3 className="text-lg font-semibold text-center py-2 bg-primary-500/20 text-primary-500 rounded-lg">
                {getRoundName(roundKey)}
              </h3>

              <div className="space-y-4">
                {matchesByRound[roundKey].map((match) => renderMatchCard(match))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partido de ubicación (3er y 4to lugar) */}
      {ubicacionMatches.length > 0 && (
        <div className="max-w-[320px]">
          <h3 className="text-lg font-semibold text-center py-2 bg-amber-500/20 text-amber-500 rounded-lg mb-4">
            {getRoundName('UBICACION')}
          </h3>
          <div className="space-y-4">
            {ubicacionMatches.map((match) => renderMatchCard(match))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BracketView;
