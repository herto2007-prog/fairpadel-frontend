import type { Ranking } from '@/types';
import { Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RankingsPodiumProps {
  rankings: Ranking[];
}

const RankingsPodium: React.FC<RankingsPodiumProps> = ({ rankings }) => {
  if (rankings.length === 0) return null;

  const top3 = rankings.slice(0, 3);
  // Display order: 2nd | 1st | 3rd (fill missing spots with null)
  const ordered: (Ranking | null)[] =
    top3.length >= 3
      ? [top3[1], top3[0], top3[2]]
      : top3.length === 2
        ? [top3[1], top3[0], null]
        : [null, top3[0], null];

  const podiumConfig = [
    { // 2nd place
      borderColor: 'border-gray-400',
      bgGradient: 'from-gray-400/10 to-transparent',
      labelBg: 'bg-gray-400/20 text-gray-300',
      medal: '🥈',
      avatarSize: 'h-14 w-14 sm:h-16 sm:w-16',
      heightClass: 'pt-8 sm:pt-10',
      animation: 'animate-podium-rise-delay-1 opacity-0',
    },
    { // 1st place
      borderColor: 'border-yellow-500',
      bgGradient: 'from-yellow-500/10 to-transparent',
      labelBg: 'bg-yellow-500/20 text-yellow-400',
      medal: '🥇',
      avatarSize: 'h-16 w-16 sm:h-20 sm:w-20',
      heightClass: 'pt-0',
      animation: 'animate-podium-rise opacity-0',
    },
    { // 3rd place
      borderColor: 'border-amber-700',
      bgGradient: 'from-amber-700/10 to-transparent',
      labelBg: 'bg-amber-700/20 text-amber-500',
      medal: '🥉',
      avatarSize: 'h-14 w-14 sm:h-16 sm:w-16',
      heightClass: 'pt-10 sm:pt-14',
      animation: 'animate-podium-rise-delay-2 opacity-0',
    },
  ];

  const getChange = (r: Ranking) => {
    if (!r.posicionAnterior) return null;
    const diff = r.posicionAnterior - r.posicion;
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-400', label: `+${diff}` };
    if (diff < 0) return { icon: TrendingDown, color: 'text-red-400', label: `${diff}` };
    return { icon: Minus, color: 'text-light-muted', label: '' };
  };

  return (
    <div className="mb-8">
      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {ordered.map((ranking, idx) => {
          const config = podiumConfig[idx];
          if (!ranking) {
            // Empty placeholder for missing podium spot
            return <div key={`empty-${idx}`} className="flex-1 max-w-[180px]" />;
          }
          const change = getChange(ranking);
          const isFirst = idx === 1;

          return (
            <div
              key={ranking.id}
              className={`${config.heightClass} ${config.animation} flex-1 max-w-[180px]`}
            >
              <div
                className={`relative bg-gradient-to-b ${config.bgGradient} border-2 ${config.borderColor} rounded-xl p-3 sm:p-4 text-center ${
                  isFirst ? 'animate-pulse-glow' : ''
                }`}
              >
                {/* Medal */}
                <div className="text-2xl sm:text-3xl mb-2">{config.medal}</div>

                {/* Avatar */}
                <div className={`${config.avatarSize} mx-auto rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-bold overflow-hidden mb-2`}>
                  {ranking.jugador?.fotoUrl ? (
                    <img src={ranking.jugador.fotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className={isFirst ? 'text-xl' : 'text-lg'}>
                      {ranking.jugador?.nombre?.charAt(0) || '?'}
                    </span>
                  )}
                </div>

                {/* Premium crown */}
                {(ranking.jugador as any)?.esPremium && (
                  <Crown className="h-4 w-4 text-yellow-500 absolute top-2 right-2" />
                )}

                {/* Name */}
                <p className="font-semibold text-light-text text-xs sm:text-sm truncate">
                  {ranking.jugador?.nombre} {ranking.jugador?.apellido}
                </p>
                <p className="text-[10px] sm:text-xs text-light-secondary truncate">
                  {ranking.jugador?.ciudad || ''}
                </p>

                {/* Points */}
                <p className="text-lg sm:text-2xl font-bold text-primary-500 mt-1 animate-count-up">
                  {ranking.puntosTotales}
                </p>
                <p className="text-[10px] text-light-muted">puntos</p>

                {/* Position change */}
                {change && (
                  <div className={`flex items-center justify-center gap-0.5 mt-1 ${change.color} text-xs`}>
                    <change.icon className="h-3 w-3" />
                    {change.label && <span>{change.label}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RankingsPodium;
