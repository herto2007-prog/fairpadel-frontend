import { Users } from 'lucide-react';

interface Jugador {
  nombre: string;
  apellido: string;
  fotoUrl?: string | null;
}

interface ParejaAvatarProps {
  jugador1: Jugador | null | undefined;
  jugador2?: Jugador | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showFallback?: boolean;
}

const sizeConfig = {
  sm: {
    container: 'w-12 h-8',
    img: 'w-6 h-6',
    border: 'border-2',
    overlap: '-ml-2',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'w-16 h-10',
    img: 'w-8 h-8',
    border: 'border-2',
    overlap: '-ml-3',
    icon: 'w-4 h-4',
  },
  lg: {
    container: 'w-20 h-12',
    img: 'w-10 h-10',
    border: 'border-[3px]',
    overlap: '-ml-4',
    icon: 'w-5 h-5',
  },
};

export function ParejaAvatar({
  jugador1,
  jugador2,
  size = 'md',
  className = '',
  showFallback = true,
}: ParejaAvatarProps) {
  const config = sizeConfig[size];

  // Si no hay jugadores y no se muestra fallback
  if (!jugador1 && !jugador2 && !showFallback) {
    return null;
  }

  return (
    <div className={`flex items-center ${config.container} ${className}`}>
      {/* Foto del primer jugador */}
      <div
        className={`relative ${config.img} rounded-full overflow-hidden ${config.border} border-[#df2531]/60 bg-[#1a1d26] flex-shrink-0 z-10`}
      >
        {jugador1?.fotoUrl ? (
          <img
            src={jugador1.fotoUrl}
            alt={`${jugador1.nombre} ${jugador1.apellido}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#df2531]/20 to-[#df2531]/5">
            <span className="text-[#df2531] font-medium text-xs">
              {jugador1?.nombre?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Foto del segundo jugador (superpuesta) */}
      <div
        className={`relative ${config.img} rounded-full overflow-hidden ${config.border} border-[#df2531]/60 bg-[#1a1d26] flex-shrink-0 ${config.overlap} z-20`}
      >
        {jugador2?.fotoUrl ? (
          <img
            src={jugador2.fotoUrl}
            alt={`${jugador2.nombre} ${jugador2.apellido}`}
            className="w-full h-full object-cover"
          />
        ) : jugador2 ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#df2531]/20 to-[#df2531]/5">
            <span className="text-[#df2531] font-medium text-xs">
              {jugador2.nombre?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Users className={`${config.icon} text-gray-500`} />
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para mostrar la pareja completa con fotos y nombres
interface ParejaDisplayProps {
  jugador1?: Jugador | null;
  jugador2?: Jugador | null;
  align?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
  isWinner?: boolean;
}

export function ParejaDisplay({
  jugador1,
  jugador2,
  align = 'left',
  size = 'md',
  highlight = false,
  isWinner = false,
}: ParejaDisplayProps) {
  const textAlign = align === 'left' ? 'text-left' : 'text-right';
  const flexDirection = align === 'left' ? 'flex-row' : 'flex-row-reverse';
  const gap = align === 'left' ? 'gap-3' : 'gap-3';

  if (!jugador1 && !jugador2) {
    return (
      <div className={`flex ${flexDirection} items-center ${gap} ${textAlign}`}>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          <Users className="w-4 h-4 text-gray-500" />
        </div>
        <span className="text-gray-500 italic text-sm">Por definir</span>
      </div>
    );
  }

  return (
    <div className={`flex ${flexDirection} items-center ${gap}`}>
      <ParejaAvatar
        jugador1={jugador1}
        jugador2={jugador2}
        size={size}
      />
      <div className={`${textAlign} min-w-0`}>
        {jugador1 && (
          <div
            className={`font-medium truncate ${
              isWinner ? 'text-green-400' : highlight ? 'text-[#df2531]' : 'text-white'
            }`}
          >
            {jugador1.nombre} {jugador1.apellido}
          </div>
        )}
        {jugador2 && (
          <div className="text-sm text-gray-400 truncate">
            {jugador2.nombre} {jugador2.apellido}
          </div>
        )}
        {!jugador2 && jugador1 && (
          <div className="text-sm text-gray-500 italic">Sin pareja</div>
        )}
      </div>
    </div>
  );
}
