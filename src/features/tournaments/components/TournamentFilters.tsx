import { Select, Input, Button } from '@/components/ui';
import type { TournamentFilters as Filters } from '@/types';
import { TournamentStatus, Modalidad } from '@/types';
import { X } from 'lucide-react';

interface TournamentFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export const TournamentFilters: React.FC<TournamentFiltersProps> = ({ filters, onChange }) => {
  const handleReset = () => {
    onChange({
      estado: TournamentStatus.PUBLICADO,
    });
  };

  return (
    <div className="bg-dark-card p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Select
          label="Estado"
          value={filters.estado || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
            onChange({ ...filters, estado: e.target.value as TournamentStatus || undefined })
          }
        >
          <option value="">Todos</option>
          <option value={TournamentStatus.PUBLICADO}>Inscripciones Abiertas</option>
          <option value={TournamentStatus.EN_CURSO}>En Curso</option>
          <option value={TournamentStatus.FINALIZADO}>Finalizados</option>
        </Select>

        <Input
          label="Ciudad"
          type="text"
          placeholder="Ej: Ciudad del Este"
          value={filters.ciudad || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            onChange({ ...filters, ciudad: e.target.value || undefined })
          }
        />

        <Select
          label="Modalidad"
          value={filters.modalidad || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
            onChange({ ...filters, modalidad: e.target.value as Modalidad || undefined })
          }
        >
          <option value="">Todas</option>
          <option value={Modalidad.TRADICIONAL}>Tradicional</option>
          <option value={Modalidad.MIXTO}>Mixto</option>
          <option value={Modalidad.SUMA}>Suma</option>
        </Select>

        <div className="flex items-end gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TournamentFilters;
