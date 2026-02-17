import { useEffect, useState, useRef, useCallback } from 'react';
import { Select, Button } from '@/components/ui';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import type { TournamentFilters as Filters, Circuito } from '@/types';
import { TournamentStatus, Modalidad } from '@/types';
import { X, Search } from 'lucide-react';
import { circuitosService } from '@/services/circuitosService';

interface TournamentFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export const TournamentFilters: React.FC<TournamentFiltersProps> = ({ filters, onChange }) => {
  const [circuitos, setCircuitos] = useState<Circuito[]>([]);
  const [nombreInput, setNombreInput] = useState(filters.nombre || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    circuitosService.getAll().then(setCircuitos).catch(() => {});
  }, []);

  // Sync internal nombre when parent resets filters
  useEffect(() => {
    setNombreInput(filters.nombre || '');
  }, [filters.nombre]);

  // Debounced nombre change — waits 400ms after typing stops
  const handleNombreChange = useCallback((value: string) => {
    setNombreInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      // Clear immediately when emptied
      onChange({ ...filters, nombre: undefined });
      return;
    }
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, nombre: value || undefined });
    }, 400);
  }, [filters, onChange]);

  const handleReset = () => {
    onChange({
      inscripcionesAbiertas: true,
    });
  };

  // Derive display value for the estado select
  const estadoSelectValue = filters.inscripcionesAbiertas
    ? 'INSCRIPCIONES_ABIERTAS'
    : filters.estado || '';

  const handleEstadoChange = (value: string) => {
    if (value === 'INSCRIPCIONES_ABIERTAS') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { estado: _e, ...rest } = filters;
      onChange({ ...rest, inscripcionesAbiertas: true });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { inscripcionesAbiertas: _ia, ...rest } = filters;
      onChange({ ...rest, estado: (value as TournamentStatus) || undefined });
    }
  };

  return (
    <div className="bg-dark-card p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
      {/* Search bar */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-secondary" />
          <input
            type="text"
            placeholder="Buscar torneo por nombre..."
            value={nombreInput}
            onChange={(e) => handleNombreChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder-light-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <Select
          label="Estado"
          value={estadoSelectValue}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleEstadoChange(e.target.value)
          }
        >
          <option value="">Todos</option>
          <option value="INSCRIPCIONES_ABIERTAS">Inscripciones Abiertas</option>
          <option value={TournamentStatus.PUBLICADO}>Publicados</option>
          <option value={TournamentStatus.EN_CURSO}>En Curso</option>
          <option value={TournamentStatus.FINALIZADO}>Finalizados</option>
        </Select>

        <CityAutocomplete
          label="Ciudad"
          value={filters.ciudad || ''}
          onChange={(val) => onChange({ ...filters, ciudad: val || undefined })}
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

        {circuitos.length > 0 && (
          <Select
            label="Circuito"
            value={filters.circuitoId || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onChange({ ...filters, circuitoId: e.target.value || undefined })
            }
          >
            <option value="">Todos</option>
            {circuitos.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Select>
        )}

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
