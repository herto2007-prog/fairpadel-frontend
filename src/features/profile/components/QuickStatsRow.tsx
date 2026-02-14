import type { Ranking } from '@/types';
import { Trophy, Star, Target, CheckCircle, XCircle, Crown } from 'lucide-react';

interface Props {
  ranking: Ranking | null;
}

interface StatCard {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}

const QuickStatsRow = ({ ranking }: Props) => {
  if (!ranking) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-dark-card rounded-xl p-4 text-center border border-dark-border"
          >
            <div className="text-light-tertiary text-sm">Sin datos</div>
          </div>
        ))}
      </div>
    );
  }

  const posicionDiff = ranking.posicionAnterior
    ? ranking.posicionAnterior - ranking.posicion
    : 0;

  const cards: StatCard[] = [
    {
      icon: <Trophy className="h-5 w-5" />,
      label: 'Ranking',
      value: `#${ranking.posicion}`,
      subValue: posicionDiff > 0
        ? `↑${posicionDiff}`
        : posicionDiff < 0
          ? `↓${Math.abs(posicionDiff)}`
          : undefined,
      color: 'text-yellow-500',
    },
    {
      icon: <Star className="h-5 w-5" />,
      label: 'Puntos',
      value: ranking.puntosTotales.toLocaleString(),
      color: 'text-primary-400',
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: 'Torneos',
      value: ranking.torneosJugados,
      color: 'text-blue-400',
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      label: 'Victorias',
      value: ranking.victorias,
      color: 'text-green-400',
    },
    {
      icon: <XCircle className="h-5 w-5" />,
      label: 'Derrotas',
      value: ranking.derrotas,
      color: 'text-red-400',
    },
    {
      icon: <Crown className="h-5 w-5" />,
      label: 'Campeonatos',
      value: ranking.campeonatos,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-dark-card rounded-xl p-4 border border-dark-border hover:border-primary-500/30 transition-colors"
        >
          <div className={`${card.color} mb-2 flex items-center justify-center`}>
            {card.icon}
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white flex items-center justify-center gap-1">
              {card.value}
              {card.subValue && (
                <span
                  className={`text-xs font-medium ${
                    card.subValue.startsWith('↑') ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {card.subValue}
                </span>
              )}
            </div>
            <div className="text-xs text-light-tertiary mt-1">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStatsRow;
