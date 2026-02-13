import { useMemo, useRef, useEffect, useState } from 'react';
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
};

const ROUND_LABELS: Record<string, string> = {
  DIECISEISAVOS: 'Dieciseisavos',
  OCTAVOS: 'Octavos',
  CUARTOS: 'Cuartos',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
};

export const BracketView: React.FC<BracketViewProps> = ({ matches }) => {
  const bracketRef = useRef<HTMLDivElement>(null);
  const [connectors, setConnectors] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  // Agrupar partidos por ronda (string) en vez de numeroRonda (secuencial)
  const matchesByRound = useMemo(() => {
    const grouped = matches.reduce((acc, match) => {
      const round = match.ronda;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    // Ordenar matches dentro de cada ronda por numeroRonda
    for (const round of Object.keys(grouped)) {
      grouped[round].sort((a, b) => a.numeroRonda - b.numeroRonda);
    }

    return grouped;
  }, [matches]);

  // Obtener rondas ordenadas (sin UBICACION)
  const rounds = useMemo(() => {
    return Object.keys(matchesByRound)
      .filter((r) => r !== 'UBICACION')
      .sort((a, b) => (ROUND_ORDER[a] || 0) - (ROUND_ORDER[b] || 0));
  }, [matchesByRound]);

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

  const getCanchaLabel = (match: Match): string | null => {
    if (match.torneoCancha?.sedeCancha) {
      return match.torneoCancha.sedeCancha.nombre;
    }
    return null;
  };

  // Calcular conectores SVG entre rondas
  useEffect(() => {
    if (!bracketRef.current || rounds.length < 2) {
      setConnectors([]);
      return;
    }

    const calculateConnectors = () => {
      const newConnectors: { x1: number; y1: number; x2: number; y2: number }[] = [];
      const container = bracketRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      for (let i = 0; i < rounds.length - 1; i++) {
        const currentRound = rounds[i];
        const nextRound = rounds[i + 1];
        const currentMatches = matchesByRound[currentRound] || [];
        const nextMatches = matchesByRound[nextRound] || [];

        // Para cada match de la ronda siguiente, buscar sus 2 matches alimentadores
        for (let nIdx = 0; nIdx < nextMatches.length; nIdx++) {
          const nextMatch = nextMatches[nIdx];
          const nextEl = container.querySelector(`[data-match-id="${nextMatch.id}"]`) as HTMLElement;
          if (!nextEl) continue;

          const nextRect = nextEl.getBoundingClientRect();
          const nextY = nextRect.top + nextRect.height / 2 - containerRect.top;
          const nextX = nextRect.left - containerRect.left;

          // Buscar matches que alimentan a este (por partidoSiguienteId)
          const feeders = currentMatches.filter(m => m.partidoSiguienteId === nextMatch.id);

          for (const feeder of feeders) {
            const feederEl = container.querySelector(`[data-match-id="${feeder.id}"]`) as HTMLElement;
            if (!feederEl) continue;

            const feederRect = feederEl.getBoundingClientRect();
            const feederY = feederRect.top + feederRect.height / 2 - containerRect.top;
            const feederX = feederRect.right - containerRect.left;

            newConnectors.push({
              x1: feederX,
              y1: feederY,
              x2: nextX,
              y2: nextY,
            });
          }
        }
      }

      setConnectors(newConnectors);
    };

    // Wait for DOM to settle
    const timer = setTimeout(calculateConnectors, 200);
    return () => clearTimeout(timer);
  }, [rounds, matchesByRound, matches]);

  const renderMatchCard = (match: Match) => {
    const canchaLabel = getCanchaLabel(match);
    const isBye = match.estado === MatchStatus.WO && match.observaciones?.includes('BYE');

    return (
      <div key={match.id} data-match-id={match.id}>
        <Card className={`overflow-hidden ${isBye ? 'opacity-60' : ''}`}>
          <CardContent className="p-0">
            {/* Header con cancha + fecha + hora + estado */}
            <div className="flex justify-between items-center px-3 py-1.5 bg-dark-surface border-b border-dark-border gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {canchaLabel && (
                  <span className="text-xs font-medium text-primary-400 truncate flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2z"/>
                      <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 8-4z" opacity="0.3"/>
                    </svg>
                    {canchaLabel}
                  </span>
                )}
                <span className="text-xs text-light-secondary whitespace-nowrap">
                  {match.fechaProgramada
                    ? new Date(match.fechaProgramada).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' })
                    : ''
                  }
                  {match.horaProgramada && ` ${match.horaProgramada}`}
                </span>
              </div>
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
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bracket principal con conectores */}
      <div className="overflow-x-auto">
        <div className="relative" ref={bracketRef}>
          {/* SVG conectores */}
          {connectors.length > 0 && (
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {connectors.map((c, idx) => {
                const midX = (c.x1 + c.x2) / 2;
                return (
                  <path
                    key={idx}
                    d={`M ${c.x1} ${c.y1} H ${midX} V ${c.y2} H ${c.x2}`}
                    stroke="rgba(99, 102, 241, 0.4)"
                    strokeWidth="2"
                    fill="none"
                  />
                );
              })}
            </svg>
          )}

          {/* Rondas */}
          <div className="flex gap-8 min-w-max p-4">
            {rounds.map((roundKey, roundIdx) => {
              const roundMatches = matchesByRound[roundKey] || [];
              // Calcular espaciado vertical progresivo para alinear con bracket
              const spacingMultiplier = Math.pow(2, roundIdx);

              return (
                <div key={roundKey} className="flex flex-col min-w-[280px]">
                  <h3 className="text-lg font-semibold text-center py-2 bg-primary-500/20 text-primary-500 rounded-lg mb-4">
                    {getRoundName(roundKey)}
                    <span className="text-xs font-normal ml-2 opacity-70">({roundMatches.length})</span>
                  </h3>

                  <div
                    className="flex flex-col justify-around flex-1"
                    style={{ gap: `${Math.max(16, spacingMultiplier * 16)}px` }}
                  >
                    {roundMatches.map((match) => renderMatchCard(match))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BracketView;
