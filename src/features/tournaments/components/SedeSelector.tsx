import { useState, useEffect } from 'react';
import { sedesService } from '@/services/sedesService';
import { Loading } from '@/components/ui';
import type { Sede } from '@/types';
import { MapPin, Phone, LayoutGrid, Check } from 'lucide-react';

interface SedeSelectorProps {
  selectedSedeId: string | null;
  onSelect: (sede: Sede | null) => void;
  ciudad?: string;
}

const SedeSelector: React.FC<SedeSelectorProps> = ({ selectedSedeId, onSelect, ciudad }) => {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSedes();
  }, [ciudad]);

  const loadSedes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sedesService.getAll({ activo: true, ciudad: ciudad || undefined });
      setSedes(data);
    } catch (err) {
      setError('Error al cargar sedes disponibles');
      console.error('Error loading sedes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sede: Sede) => {
    if (selectedSedeId === sede.id) {
      onSelect(null); // Deseleccionar
    } else {
      onSelect(sede);
    }
  };

  if (loading) {
    return <Loading size="sm" text="Cargando sedes disponibles..." />;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (sedes.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">
          {ciudad
            ? `No hay sedes disponibles en ${ciudad}`
            : 'No hay sedes disponibles'}
        </p>
        <p className="text-xs mt-1 text-gray-400">
          El administrador debe registrar sedes primero
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Selecciona la sede principal donde se realizara el torneo.
        {ciudad && (
          <span className="text-emerald-600 font-medium"> Mostrando sedes en {ciudad}.</span>
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sedes.map((sede) => {
          const isSelected = selectedSedeId === sede.id;
          const canchasCount = sede.canchas?.length || 0;

          return (
            <button
              key={sede.id}
              type="button"
              onClick={() => handleSelect(sede)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {sede.logoUrl ? (
                    <img
                      src={sede.logoUrl}
                      alt={sede.nombre}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      {sede.nombre.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{sede.nombre}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {sede.ciudad}
                        {sede.direccion && ` - ${sede.direccion}`}
                      </span>
                    </div>
                    {sede.telefono && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {sede.telefono}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <LayoutGrid className="h-3 w-3" />
                      {canchasCount} cancha{canchasCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!selectedSedeId && (
        <p className="text-xs text-gray-400">
          Puedes dejar la sede sin seleccionar y asignarla mas tarde.
        </p>
      )}
    </div>
  );
};

export default SedeSelector;
