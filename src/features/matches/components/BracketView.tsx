import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, Badge } from '@/components/ui';
import type { Match, User } from '@/types';
import { MatchStatus } from '@/types';

/** Avatar circular del jugador — muestra foto o iniciales */
const PlayerAvatar = ({ player, size = 24 }: { player?: User | null; size?: number }) => {
  const [imgError, setImgError] = useState(false);

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

  if (player.fotoUrl && !imgError) {
    return (
      <img
        src={player.fotoUrl}
        alt={initials}
        className="rounded-full object-cover flex-shrink-0 border border-dark-border"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
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

interface BracketViewProps {
  matches: Match[];
  /** Callback al hacer click en un match (para cargar resultado). Si no se provee, los matches no son clickeables. */
  onMatchClick?: (match: Match) => void;
}

// Orden de rondas para visualización del bracket
const ROUND_ORDER: Record<string, number> = {
  ACOMODACION_1: 1,
  ACOMODACION_2: 2,
  DIECISEISAVOS: 3,
  RONDA_6: 3,
  RONDA_5: 3,
  OCTAVOS: 4,
  CUARTOS: 5,
  SEMIFINAL: 6,
  FINAL: 7,
};

const ROUND_LABELS: Record<string, string> = {
  ACOMODACION_1: 'Acomodación 1',
  ACOMODACION_2: 'Acomodación 2',
  DIECISEISAVOS: 'Dieciseisavos',
  OCTAVOS: 'Octavos',
  CUARTOS: 'Cuartos',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
};

export const BracketView: React.FC<BracketViewProps> = ({ matches, onMatchClick }) => {
  const bracketRef = useRef<HTMLDivElement>(null);
  const [connectors, setConnectors] = useState<{ x1: number; y1: number; x2: number; y2: number; type: 'winner' | 'loser' }[]>([]);

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
  const calculateConnectors = useCallback(() => {
    const container = bracketRef.current;
    if (!container || rounds.length < 2) {
      setConnectors([]);
      return;
    }

    const newConnectors: { x1: number; y1: number; x2: number; y2: number; type: 'winner' | 'loser' }[] = [];
    const containerRect = container.getBoundingClientRect();
    const allMatchesFlat = Object.values(matchesByRound).flat();

    for (let i = 0; i < rounds.length - 1; i++) {
      const currentRound = rounds[i];
      const nextRound = rounds[i + 1];
      const currentMatches = matchesByRound[currentRound] || [];
      const nextMatches = matchesByRound[nextRound] || [];

      for (let nIdx = 0; nIdx < nextMatches.length; nIdx++) {
        const nextMatch = nextMatches[nIdx];
        const nextEl = container.querySelector(`[data-match-id="${nextMatch.id}"]`) as HTMLElement;
        if (!nextEl) continue;

        const nextRect = nextEl.getBoundingClientRect();
        const nextY = nextRect.top + nextRect.height / 2 - containerRect.top;
        const nextX = nextRect.left - containerRect.left;

        // Buscar feeders de ganadores (por partidoSiguienteId)
        const winnerFeeders = currentMatches.filter(m => m.partidoSiguienteId === nextMatch.id);

        for (const feeder of winnerFeeders) {
          const feederEl = container.querySelector(`[data-match-id="${feeder.id}"]`) as HTMLElement;
          if (!feederEl) continue;

          const feederRect = feederEl.getBoundingClientRect();
          const feederY = feederRect.top + feederRect.height / 2 - containerRect.top;
          const feederX = feederRect.right - containerRect.left;

          newConnectors.push({
            x1: feederX, y1: feederY,
            x2: nextX, y2: nextY,
            type: 'winner',
          });
        }

        // Buscar feeders de perdedores (por partidoPerdedorSiguienteId) — cross-ronda
        const loserFeeders = allMatchesFlat.filter(m => m.partidoPerdedorSiguienteId === nextMatch.id);

        for (const feeder of loserFeeders) {
          const feederEl = container.querySelector(`[data-match-id="${feeder.id}"]`) as HTMLElement;
          if (!feederEl) continue;

          const feederRect = feederEl.getBoundingClientRect();
          const feederY = feederRect.top + feederRect.height / 2 - containerRect.top;
          const feederX = feederRect.right - containerRect.left;

          newConnectors.push({
            x1: feederX, y1: feederY,
            x2: nextX, y2: nextY,
            type: 'loser',
          });
        }
      }
    }

    setConnectors(newConnectors);
  }, [rounds, matchesByRound]);

  // Recalculate connectors on mount, data changes, and container resize
  useEffect(() => {
    const container = bracketRef.current;
    if (!container) return;

    // Initial calculation after DOM settles
    const initialTimer = setTimeout(calculateConnectors, 50);

    // Debounced recalculation on resize
    let resizeTimer: ReturnType<typeof setTimeout>;
    const debouncedRecalc = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(calculateConnectors, 100);
    };

    // ResizeObserver for responsive recalculation
    const resizeObserver = new ResizeObserver(debouncedRecalc);
    resizeObserver.observe(container);

    // Also listen for window resize (orientation changes, zoom)
    window.addEventListener('resize', debouncedRecalc);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', debouncedRecalc);
    };
  }, [calculateConnectors, matches]);

  const renderMatchCard = (match: Match) => {
    const canchaLabel = getCanchaLabel(match);
    const isBye = match.estado === MatchStatus.WO && match.observaciones?.includes('BYE');
    // Clickeable si: tiene handler, ambas parejas asignadas, y no está finalizado/WO/cancelado
    const isClickable = onMatchClick
      && match.pareja1Id && match.pareja2Id
      && ![MatchStatus.FINALIZADO, MatchStatus.WO, MatchStatus.CANCELADO].includes(match.estado);

    return (
      <div
        key={match.id}
        data-match-id={match.id}
        onClick={isClickable ? () => onMatchClick(match) : undefined}
        className={isClickable ? 'cursor-pointer group' : ''}
      >
        <Card className={`overflow-hidden ${isBye ? 'opacity-60' : ''} ${isClickable ? 'group-hover:ring-1 group-hover:ring-primary-500/50 transition-shadow' : ''}`}>
          <CardContent className="p-0">
            {/* Header con cancha + fecha + hora + estado */}
            <div className="flex justify-between items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-dark-surface border-b border-dark-border gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {canchaLabel && (
                  <span className="text-[10px] sm:text-xs font-medium text-primary-400 truncate">
                    {canchaLabel}
                  </span>
                )}
                <span className="text-[10px] sm:text-xs text-light-secondary whitespace-nowrap">
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
            <div className={`flex justify-between items-center px-1.5 sm:px-2 py-1 sm:py-1.5 border-b border-dark-border ${
              isWinner(match, 1) ? 'bg-green-900/30' : ''
            }`}>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <div className="flex -space-x-1.5 flex-shrink-0 hidden sm:flex">
                  <PlayerAvatar player={match.pareja1?.jugador1} size={22} />
                  <PlayerAvatar player={match.pareja1?.jugador2} size={22} />
                </div>
                <span className={`text-xs sm:text-sm truncate ${isWinner(match, 1) ? 'font-semibold' : ''}`}>
                  {getParejaName(match, 1)}
                </span>
              </div>
              <span className="font-mono font-semibold text-xs sm:text-sm ml-1.5 flex-shrink-0">
                {getScore(match, 1)}
              </span>
            </div>

            {/* Pareja 2 */}
            <div className={`flex justify-between items-center px-1.5 sm:px-2 py-1 sm:py-1.5 ${
              isWinner(match, 2) ? 'bg-green-900/30' : ''
            }`}>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <div className="flex -space-x-1.5 flex-shrink-0 hidden sm:flex">
                  <PlayerAvatar player={match.pareja2?.jugador1} size={22} />
                  <PlayerAvatar player={match.pareja2?.jugador2} size={22} />
                </div>
                <span className={`text-xs sm:text-sm truncate ${isWinner(match, 2) ? 'font-semibold' : ''}`}>
                  {getParejaName(match, 2)}
                </span>
              </div>
              <span className="font-mono font-semibold text-xs sm:text-sm ml-1.5 flex-shrink-0">
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
                const strokeColor = c.type === 'loser'
                  ? 'rgba(239, 68, 68, 0.4)'   // rojo para perdedores
                  : 'rgba(99, 102, 241, 0.4)';  // azul para ganadores
                return (
                  <path
                    key={idx}
                    d={`M ${c.x1} ${c.y1} H ${midX} V ${c.y2} H ${c.x2}`}
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeDasharray={c.type === 'loser' ? '6 3' : undefined}
                    fill="none"
                  />
                );
              })}
            </svg>
          )}

          {/* Rondas */}
          <div className="flex gap-4 sm:gap-8 min-w-max p-2 sm:p-4">
            {rounds.map((roundKey, roundIdx) => {
              const roundMatches = matchesByRound[roundKey] || [];
              // Calcular espaciado vertical progresivo para alinear con bracket
              // Las rondas de acomodación tienen spacing fijo (no son parte del bracket)
              const isAcomodacion = roundKey.startsWith('ACOMODACION');
              // Para rondas de bracket, el índice efectivo empieza desde 0 después de acomodación
              const acomodacionRounds = rounds.filter(r => r.startsWith('ACOMODACION')).length;
              const bracketRoundIdx = roundIdx - acomodacionRounds;
              const spacingMultiplier = isAcomodacion ? 1 : Math.pow(2, Math.max(0, bracketRoundIdx));

              return (
                <div key={roundKey} className="flex flex-col min-w-[220px] sm:min-w-[300px]">
                  <h3 className="text-sm sm:text-lg font-semibold text-center py-1.5 sm:py-2 bg-primary-500/20 text-primary-500 rounded-lg mb-3 sm:mb-4">
                    {getRoundName(roundKey)}
                    <span className="text-xs font-normal ml-1.5 opacity-70">({roundMatches.length})</span>
                  </h3>

                  <div
                    className="flex flex-col justify-around flex-1"
                    style={{ gap: `${Math.max(12, spacingMultiplier * 12)}px` }}
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
