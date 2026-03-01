import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import type { SedeAlquilerResumen, TipoCancha } from '@/types';

const tipoCanchaLabel: Record<TipoCancha, string> = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  SEMI_TECHADA: 'Semi-techada',
};

const tipoCanchaColor: Record<TipoCancha, string> = {
  INDOOR: 'bg-blue-500/20 text-blue-400',
  OUTDOOR: 'bg-green-500/20 text-green-400',
  SEMI_TECHADA: 'bg-yellow-500/20 text-yellow-400',
};

function formatPrecio(precio: number): string {
  return precio.toLocaleString('es-PY') + ' Gs';
}

interface Props {
  sede: SedeAlquilerResumen;
}

export default function SedeAlquilerCard({ sede }: Props) {
  return (
    <Link
      to={`/canchas/${sede.id}`}
      className="block bg-dark-card rounded-xl border border-dark-border hover:border-primary/50 transition-all duration-200 overflow-hidden group"
    >
      {/* Image */}
      <div className="h-36 bg-dark-hover relative overflow-hidden">
        {sede.imagenFondo ? (
          <img
            src={sede.imagenFondo}
            alt={sede.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : sede.logoUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-dark-hover">
            <img src={sede.logoUrl} alt={sede.nombre} className="h-20 w-20 object-contain" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-dark-hover">
            <MapPin className="w-12 h-12 text-dark-muted" />
          </div>
        )}
        {/* Canchas count badge */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {sede.canchasCount} {sede.canchasCount === 1 ? 'cancha' : 'canchas'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-dark-text group-hover:text-primary transition-colors">
            {sede.nombre}
          </h3>
          <p className="text-sm text-dark-muted flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {sede.ciudad}
          </p>
        </div>

        {/* Court type badges */}
        <div className="flex flex-wrap gap-1.5">
          {sede.tiposCanchas.map((tipo) => (
            <span
              key={tipo}
              className={`text-xs px-2 py-0.5 rounded-full ${tipoCanchaColor[tipo]}`}
            >
              {tipoCanchaLabel[tipo]}
            </span>
          ))}
        </div>

        {/* Price range */}
        {sede.precioMin > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="w-3.5 h-3.5 text-dark-muted" />
            <span className="text-primary font-medium">
              {sede.precioMin === sede.precioMax
                ? formatPrecio(sede.precioMin)
                : `${formatPrecio(sede.precioMin)} - ${formatPrecio(sede.precioMax)}`}
            </span>
            <span className="text-dark-muted">/ turno</span>
          </div>
        )}

        {/* Auto-confirm badge */}
        {sede.config && !sede.config.requiereAprobacion && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            Confirmacion inmediata
          </span>
        )}
      </div>
    </Link>
  );
}
