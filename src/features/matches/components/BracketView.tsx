import { Card, CardContent, Badge } from '@/components/ui';
import type { Match } from '@/types';
import { MatchStatus } from '@/types';

interface BracketViewProps {
  matches: Match[];
}

export const BracketView: React.FC<BracketViewProps> = ({ matches }) => {
  // Agrupar partidos por ronda
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.numeroRonda;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const getRoundName = (roundNumber: number, totalRounds: number) => {
    const fromEnd = totalRounds - roundNumber + 1;
    if (fromEnd === 1) return 'Final';
    if (fromEnd === 2) return 'Semifinal';
    if (fromEnd === 3) return 'Cuartos';
    return `Ronda ${roundNumber}`;
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
    if (match.estado !== MatchStatus.FINALIZADO) return null;
    
    const scores = [];
    if (match.set1Pareja1 !== null && match.set1Pareja2 !== null) {
      scores.push(parejaNum === 1 ? match.set1Pareja1 : match.set1Pareja2);
    }
    if (match.set2Pareja1 !== null && match.set2Pareja2 !== null) {
      scores.push(parejaNum === 1 ? match.set2Pareja1 : match.set2Pareja2);
    }
    if (match.set3Pareja1 !== null && match.set3Pareja2 !== null) {
      scores.push(parejaNum === 1 ? match.set3Pareja1 : match.set3Pareja2);
    }
    
    return scores.length > 0 ? scores.join(' - ') : null;
  };

  const isWinner = (match: Match, parejaNum: 1 | 2) => {
    const parejaId = parejaNum === 1 ? match.pareja1Id : match.pareja2Id;
    return match.parejaGanadoraId === parejaId;
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 min-w-max p-4">
        {rounds.map((roundNumber) => (
          <div key={roundNumber} className="flex flex-col gap-4 min-w-[280px]">
            <h3 className="text-lg font-semibold text-center py-2 bg-emerald-100 rounded-lg">
              {getRoundName(roundNumber, rounds.length)}
            </h3>
            
            <div className="space-y-4">
              {matchesByRound[roundNumber].map((match) => (
                <Card key={match.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header con estado */}
                    <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-b">
                      <span className="text-xs text-gray-500">
                        {match.fechaProgramada 
                          ? new Date(match.fechaProgramada).toLocaleDateString()
                          : 'Sin fecha'
                        }
                        {match.horaProgramada && ` ${match.horaProgramada}`}
                      </span>
                      {getStatusBadge(match.estado)}
                    </div>
                    
                    {/* Pareja 1 */}
                    <div className={`flex justify-between items-center px-3 py-2 border-b ${
                      isWinner(match, 1) ? 'bg-green-50' : ''
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
                      isWinner(match, 2) ? 'bg-green-50' : ''
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
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BracketView;
