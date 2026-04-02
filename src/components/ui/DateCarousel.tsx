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

export function DateCarousel({ selectedDate, onSelectDate, diasMostrar = 10 }: DateCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dias, setDias] = useState<DiaInfo[]>([]);

  useEffect(() => {
    const generarDias = (): DiaInfo[] => {
      const hoy = new Date();
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      
      const resultado: DiaInfo[] = [];
      
      for (let i = 0; i < diasMostrar; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        
        resultado.push({
          fecha: `${year}-${month}-${day}`,
          diaNombre: diasSemana[fecha.getDay()],
          diaNumero: fecha.getDate(),
          mes: meses[fecha.getMonth()],
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
          const isToday = dia.fecha === new Date().toISOString().split('T')[0];

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
