import { Clock, Minus, Plus } from 'lucide-react';

interface DurationSelectorProps {
  duracionMinutos: number;
  onChange: (duracion: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const OPCIONES_DURACION = [
  { valor: 60, label: '1h' },
  { valor: 90, label: '1h 30m' },
  { valor: 120, label: '2h' },
];

export function DurationSelector({
  duracionMinutos,
  onChange,
  min = 60,
  max = 120,
  step = 30,
}: DurationSelectorProps) {
  const disminuir = () => {
    if (duracionMinutos > min) {
      onChange(duracionMinutos - step);
    }
  };

  const aumentar = () => {
    if (duracionMinutos < max) {
      onChange(duracionMinutos + step);
    }
  };

  const formatDuracion = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}m`;
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
        <Clock size={18} className="text-[#df2531]" />
        <span className="text-white/60 text-sm">Duración</span>
        
        <button
          onClick={disminuir}
          disabled={duracionMinutos <= min}
          className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={16} />
        </button>
        
        <span className="text-white font-medium min-w-[70px] text-center">
          {formatDuracion(duracionMinutos)}
        </span>
        
        <button
          onClick={aumentar}
          disabled={duracionMinutos >= max}
          className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Botones rápidos */}
      <div className="hidden sm:flex items-center gap-2">
        {OPCIONES_DURACION.map((opcion) => (
          <button
            key={opcion.valor}
            onClick={() => onChange(opcion.valor)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              duracionMinutos === opcion.valor
                ? 'bg-[#df2531] text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {opcion.label}
          </button>
        ))}
      </div>
    </div>
  );
}
