import { MapPin, Phone } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { SedeDisponibilidadResult, CanchaDisponibleResult } from '@/types';
import { TipoCancha } from '@/types';

const tipoCanchaLabel: Record<TipoCancha, string> = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  SEMI_TECHADA: 'Semi-techada',
};

const tipoCanchaBadge: Record<TipoCancha, 'info' | 'success' | 'warning'> = {
  INDOOR: 'info',
  OUTDOOR: 'success',
  SEMI_TECHADA: 'warning',
};

function formatPrecio(precio: number): string {
  return precio.toLocaleString('es-PY') + ' Gs';
}

interface Props {
  sede: SedeDisponibilidadResult;
  onReservar: (cancha: CanchaDisponibleResult) => void;
  onVerCanchas: (sede: SedeDisponibilidadResult) => void;
}

export default function SedeResultCard({ sede, onReservar, onVerCanchas }: Props) {
  const canchas = sede.canchasDisponibles;
  const singleCancha = canchas.length === 1;

  // Count available courts per type
  const courtCountByType = canchas.reduce<Partial<Record<TipoCancha, number>>>(
    (acc, c) => {
      acc[c.canchaTipo] = (acc[c.canchaTipo] || 0) + 1;
      return acc;
    },
    {},
  );

  // Price range
  const prices = canchas.map((c) => c.precio);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Thumbnail: logoUrl → imagenFondo → fallback icon
  const thumbnailSrc = sede.logoUrl || sede.imagenFondo;

  return (
    <div className="bg-dark-card rounded-xl border border-dark-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Left: thumbnail */}
      <div className="flex-shrink-0 self-start sm:self-center">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={sede.nombre}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-dark-surface flex items-center justify-center">
            <MapPin className="w-6 h-6 text-light-muted" />
          </div>
        )}
      </div>

      {/* Center: info */}
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <h3 className="font-semibold text-light-text truncate">{sede.nombre}</h3>
          {sede.direccion && (
            <p className="text-xs text-light-muted flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{sede.direccion}</span>
            </p>
          )}
          {sede.telefono && (
            <p className="text-xs text-light-muted flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span>{sede.telefono}</span>
            </p>
          )}
        </div>

        {/* Court type badges with counts */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(courtCountByType) as [TipoCancha, number][]).map(
            ([tipo, count]) => (
              <Badge key={tipo} variant={tipoCanchaBadge[tipo]}>
                {count} {tipoCanchaLabel[tipo]}
              </Badge>
            ),
          )}
        </div>

        {/* Price range + instant confirm */}
        <div className="flex flex-wrap items-center gap-2">
          {minPrice > 0 && (
            <span className="text-sm">
              <span className="text-primary-400 font-medium">
                {minPrice === maxPrice
                  ? formatPrecio(minPrice)
                  : `${formatPrecio(minPrice)} - ${formatPrecio(maxPrice)}`}
              </span>
              <span className="text-light-muted ml-1">/ turno</span>
            </span>
          )}
          {!sede.config.requiereAprobacion && (
            <Badge variant="success">Confirmación inmediata</Badge>
          )}
        </div>
      </div>

      {/* Right: action button */}
      <div className="flex-shrink-0 sm:self-center">
        {singleCancha ? (
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onReservar(canchas[0])}
          >
            Reservar
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onVerCanchas(sede)}
          >
            Ver canchas ({canchas.length})
          </Button>
        )}
      </div>
    </div>
  );
}
