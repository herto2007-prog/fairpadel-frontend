/**
 * Botones rápidos de marcador para un partido "a N games".
 * Genera los resultados más comunes (N-0 … N-(N-2), (N+1)-(N-1) y, si hay
 * tie-break, (N+1)-N) para que el organizador cargue de un toque, sin teclear.
 */

export function marcadoresComunes(
  objetivo: number,
  conTieBreak?: boolean,
): [number, number][] {
  const n = Math.max(1, Math.floor(objetivo));
  const res: [number, number][] = [];
  for (let l = 0; l <= Math.max(0, n - 2); l++) res.push([n, l]); // N-0 … N-(N-2)
  res.push([n + 1, n - 1]); // (N+1)-(N-1), ej: 7-5
  if (conTieBreak) res.push([n + 1, n]); // (N+1)-N, ej: 7-6
  return res;
}

interface Props {
  objetivo: number;
  conTieBreak?: boolean;
  labelA: string;
  labelB: string;
  current?: { a: number; b: number };
  onPick: (a: number, b: number) => void;
  compact?: boolean;
}

export function QuickScoreChips({ objetivo, conTieBreak, labelA, labelB, current, onPick, compact }: Props) {
  const comunes = marcadoresComunes(objetivo, conTieBreak);
  const chipCls = compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm';

  const Chip = ({ a, b }: { a: number; b: number }) => {
    const activo = current && current.a === a && current.b === b;
    return (
      <button
        type="button"
        onClick={() => onPick(a, b)}
        className={`${chipCls} rounded-lg border font-medium tabular-nums transition-colors ${
          activo
            ? 'bg-[#df2531]/15 border-[#df2531] text-[#df2531]'
            : 'bg-white/[0.05] border-[#232838] text-white/70 hover:text-white hover:border-[#2d3550]'
        }`}
      >
        {a}-{b}
      </button>
    );
  };

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div>
        <p className="text-white/40 text-[10px] mb-1 truncate">Ganó {labelA}</p>
        <div className="flex flex-wrap gap-1.5">
          {comunes.map(([a, b], i) => (
            <Chip key={`a-${i}`} a={a} b={b} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-white/40 text-[10px] mb-1 truncate">Ganó {labelB}</p>
        <div className="flex flex-wrap gap-1.5">
          {comunes.map(([a, b], i) => (
            <Chip key={`b-${i}`} a={b} b={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
