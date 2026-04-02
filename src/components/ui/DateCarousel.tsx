import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface DateCarouselProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  diasMostrar?: number;
}

interface DiaInfo {
  fecha: string;
  diaNombre: string;
  diaNumero: number;
  mes: string;
}

const TIMEZONE = 'America/Asuncion';

/**
 * Obtiene la fecha actual en Paraguay como string YYYY-MM-DD
 * Sin usar new Date() directamente para evitar bugs de timezone
 */
function getHoyPY(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: TIMEZONE,
  });
}

/**
 * Suma días a una fecha en formato YYYY-MM-DD
 * Trabaja con strings para evitar timezone issues
 */
function sumarDias(fecha: string, dias: number): string {
  const [year, month, day] = fecha.split('-').map(Number);
  const date = new Date(year, month - 1, day + dias);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Obtiene el día de la semana (0-6) para una fecha YYYY-MM-DD
 * Usa mediodía de Paraguay para evitar timezone issues
 */
function getDiaSemanaPY(fecha: string): number {
  const [year, month, day] = fecha.split('-').map(Number);
  // Usar hora 12:00 con timezone Paraguay (-03:00)
  const date = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00-03:00`);
  return date.getDay();
}

/**
 * Extrae día del mes de una fecha YYYY-MM-DD
 */
function getDiaNumero(fecha: string): number {
  return parseInt(fecha.split('-')[2], 10);
}

/**
 * Extrae mes (0-11) de una fecha YYYY-MM-DD
 */
function getMesIndex(fecha: string): number {
  return parseInt(fecha.split('-')[1], 10) - 1;
}

export function DateCarousel({ selectedDate, onSelectDate, diasMostrar = 10 }: DateCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dias, setDias] = useState<DiaInfo[]>([]);

  useEffect(() => {
    const generarDias = (): DiaInfo[] => {
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      
      const resultado: DiaInfo[] = [];
      const hoy = getHoyPY();
      
      for (let i = 0; i < diasMostrar; i++) {
        const fecha = sumarDias(hoy, i);
        const diaSemana = getDiaSemanaPY(fecha);
        const diaNumero = getDiaNumero(fecha);
        const mesIndex = getMesIndex(fecha);
        
        resultado.push({
          fecha,
          diaNombre: diasSemana[diaSemana],
          diaNumero,
          mes: meses[mesIndex],
        });
      }
      
      return resultado;
    };

    setDias(generarDias());
  }, [diasMostrar]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Obtener hoy como string YYYY-MM-DD en Paraguay
  const hoyPY = getHoyPY();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => scroll('left')}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dias.map((dia) => {
          const isSelected = dia.fecha === selectedDate;
          const isToday = dia.fecha === hoyPY;

          return (
            <button
              key={dia.fecha}
              onClick={() => onSelectDate(dia.fecha)}
              className={`relative flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-xl border transition-all ${
                isSelected
                  ? 'bg-[#df2531] border-[#df2531] text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <span className={`text-xs uppercase ${isSelected ? 'text-white/90' : 'text-white/50'}`}>
                {dia.diaNombre}
              </span>
              <span className="text-xl font-bold">{dia.diaNumero}</span>
              <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-white/40'}`}>
                {dia.mes}
              </span>
              {isToday && !isSelected && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#df2531] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scroll('right')}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
