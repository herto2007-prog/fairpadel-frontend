import { CalendarClock } from 'lucide-react';
import { MiAgendaCard } from '../components/MiAgendaCard';
import { useNoIndex } from '../../../hooks/useNoIndex';

// Página dedicada "Mi agenda" — el "¿cuándo juego?" del jugador como protagonista.
// Reusa MiAgendaCard (endpoint real /jugador/mi-agenda) con empty state.
export function MiAgendaPage() {
  useNoIndex();
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-[#df2531]" />
          Mi agenda
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Tu próximo partido y el camino según cómo te vaya — todo en un solo lugar.
        </p>
      </div>
      <MiAgendaCard showEmpty />
    </div>
  );
}
