import type { EstadisticasJugador } from '@/types';

interface Props {
  stats: EstadisticasJugador;
}

const LABELS = [
  { key: 'efectividad', label: 'Efectividad' },
  { key: 'consistencia', label: 'Consistencia' },
  { key: 'potenciaOfensiva', label: 'Potencia' },
  { key: 'solidezDefensiva', label: 'Solidez' },
  { key: 'clutch', label: 'Clutch' },
  { key: 'regularidad', label: 'Regularidad' },
] as const;

const CENTER = 150;
const RADIUS = 110;
const LEVELS = [33, 66, 100];

function polarToCartesian(angle: number, radius: number): [number, number] {
  // Start from top (−90°) and go clockwise
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

function getHexPoints(scale: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = i * 60;
    const [x, y] = polarToCartesian(angle, RADIUS * (scale / 100));
    return `${x},${y}`;
  }).join(' ');
}

function getOverallColor(overall: number): string {
  if (overall >= 80) return '#22c55e'; // green-500
  if (overall >= 60) return '#3b82f6'; // blue-500
  if (overall >= 40) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

const StatsRadarChart = ({ stats }: Props) => {
  const values = LABELS.map(({ key }) => stats[key]);

  // Build the stat polygon
  const statPoints = values
    .map((val, i) => {
      const angle = i * 60;
      const [x, y] = polarToCartesian(angle, RADIUS * (val / 100));
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-[280px]" role="img" aria-label={`Estadisticas del jugador: Overall ${stats.overall}, ${LABELS.map(({ key, label }) => `${label} ${stats[key]}`).join(', ')}`}>
        <title>Estadisticas del jugador - Overall {stats.overall}</title>
        {/* Background levels */}
        {LEVELS.map((level) => (
          <polygon
            key={level}
            points={getHexPoints(level)}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {LABELS.map((_, i) => {
          const angle = i * 60;
          const [x, y] = polarToCartesian(angle, RADIUS);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Stat polygon */}
        <polygon
          points={statPoints}
          fill="rgba(99, 102, 241, 0.2)"
          stroke="rgb(99, 102, 241)"
          strokeWidth="2"
        />

        {/* Stat dots */}
        {values.map((val, i) => {
          const angle = i * 60;
          const [x, y] = polarToCartesian(angle, RADIUS * (val / 100));
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="rgb(99, 102, 241)"
              stroke="white"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels */}
        {LABELS.map(({ label, key }, i) => {
          const angle = i * 60;
          const [x, y] = polarToCartesian(angle, RADIUS + 22);
          const value = stats[key];
          return (
            <g key={i}>
              <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="10"
                fontWeight="500"
              >
                {label}
              </text>
              <text
                x={x}
                y={y + 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="11"
                fontWeight="700"
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* Center overall */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r="28"
          fill="rgba(0,0,0,0.6)"
          stroke={getOverallColor(stats.overall)}
          strokeWidth="2.5"
        />
        <text
          x={CENTER}
          y={CENTER - 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={getOverallColor(stats.overall)}
          fontSize="20"
          fontWeight="800"
        >
          {stats.overall}
        </text>
        <text
          x={CENTER}
          y={CENTER + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize="7"
          fontWeight="600"
          letterSpacing="1"
        >
          OVERALL
        </text>
      </svg>
    </div>
  );
};

export default StatsRadarChart;
