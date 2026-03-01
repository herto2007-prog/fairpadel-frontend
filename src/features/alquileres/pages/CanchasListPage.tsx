import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Loading } from '@/components/ui';
import { alquileresService } from '@/services/alquileresService';
import SedeAlquilerCard from '../components/SedeAlquilerCard';
import type { SedeAlquilerResumen } from '@/types';

export default function CanchasListPage() {
  const [sedes, setSedes] = useState<SedeAlquilerResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchNombre, setSearchNombre] = useState('');
  const [searchCiudad, setSearchCiudad] = useState('');

  useEffect(() => {
    const fetchSedes = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await alquileresService.getSedesConAlquiler();
        setSedes(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error cargando sedes');
      } finally {
        setLoading(false);
      }
    };
    fetchSedes();
  }, []);

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = sedes;
    if (searchNombre.trim()) {
      const q = searchNombre.toLowerCase();
      result = result.filter((s) => s.nombre.toLowerCase().includes(q));
    }
    if (searchCiudad.trim()) {
      const q = searchCiudad.toLowerCase();
      result = result.filter((s) => s.ciudad.toLowerCase().includes(q));
    }
    return result;
  }, [sedes, searchNombre, searchCiudad]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Alquiler de Canchas</h1>
        <p className="text-sm sm:text-base text-light-secondary mt-1">Reservá tu cancha de pádel en los mejores clubes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-muted" />
          <input
            type="text"
            value={searchNombre}
            onChange={(e) => setSearchNombre(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
        <div className="relative sm:w-56">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-muted" />
          <input
            type="text"
            value={searchCiudad}
            onChange={(e) => setSearchCiudad(e.target.value)}
            placeholder="Ciudad..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loading />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-light-muted mx-auto mb-3" />
          <p className="text-light-muted">
            {sedes.length === 0
              ? 'No hay sedes con alquiler disponible en este momento.'
              : 'No se encontraron resultados para tu búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sede) => (
            <SedeAlquilerCard key={sede.id} sede={sede} />
          ))}
        </div>
      )}
    </div>
  );
}
