import { useState, useEffect, useMemo } from 'react';
import { instructoresService } from '@/services/instructoresService';
import { Loading, Card, CardContent, Badge } from '@/components/ui';
import {
  Search,
  Calendar,
  DollarSign,
  Phone,
  Inbox,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import type { AlumnoResumen } from '@/types';
import AlumnoHistorial from './AlumnoHistorial';

type SortBy = 'ultimaClase' | 'nombre' | 'deuda';

const AlumnosList = () => {
  const [alumnos, setAlumnos] = useState<AlumnoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('ultimaClase');

  // Drill-down to historial
  const [selectedAlumno, setSelectedAlumno] = useState<AlumnoResumen | null>(null);

  useEffect(() => {
    loadAlumnos();
  }, []);

  const loadAlumnos = async () => {
    setLoading(true);
    try {
      const data = await instructoresService.obtenerAlumnos();
      setAlumnos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading alumnos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = alumnos;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.nombre.toLowerCase().includes(q) ||
          (a.apellido && a.apellido.toLowerCase().includes(q)) ||
          (a.telefono && a.telefono.includes(q))
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'ultimaClase') return b.ultimaClase.localeCompare(a.ultimaClase);
      if (sortBy === 'nombre') return a.nombre.localeCompare(b.nombre);
      if (sortBy === 'deuda') return b.deudaPendiente - a.deudaPendiente;
      return 0;
    });

    return result;
  }, [alumnos, search, sortBy]);

  // Drill-down view
  if (selectedAlumno) {
    return (
      <div>
        <button
          onClick={() => setSelectedAlumno(null)}
          className="flex items-center gap-1 text-sm text-light-secondary hover:text-primary-400 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a alumnos
        </button>
        <AlumnoHistorial
          alumno={selectedAlumno}
          onBack={() => setSelectedAlumno(null)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando alumnos..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-muted" />
          <input
            type="text"
            placeholder="Buscar alumno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="flex gap-1">
          {([
            { key: 'ultimaClase', label: 'Recientes' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'deuda', label: 'Deuda' },
          ] as { key: SortBy; label: string }[]).map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                sortBy === s.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="h-12 w-12 mx-auto mb-3 text-light-muted opacity-50" />
          <p className="text-sm text-light-secondary">
            {search ? 'No se encontraron alumnos' : 'Aún no tenés alumnos'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alumno, idx) => {
            const key = alumno.id || `${alumno.nombre}_${alumno.telefono || idx}`;
            return (
              <Card key={key}>
                <CardContent className="p-3">
                  <button
                    onClick={() => setSelectedAlumno(alumno)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {alumno.fotoUrl ? (
                        <img
                          src={alumno.fotoUrl}
                          alt={alumno.nombre}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                          <span className="text-primary-400 font-bold text-sm">
                            {alumno.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-light-text truncate">
                          {alumno.nombre} {alumno.apellido || ''}
                        </span>
                        <Badge
                          variant={alumno.tipo === 'registrado' ? 'info' : 'default'}
                          className="text-[10px] flex-shrink-0"
                        >
                          {alumno.tipo === 'registrado' ? 'FairPadel' : 'Externo'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-light-muted mt-0.5">
                        {alumno.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {alumno.telefono}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {alumno.totalClases} {alumno.totalClases === 1 ? 'clase' : 'clases'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Última: {new Date(alumno.ultimaClase).toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    {/* Deuda */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {alumno.deudaPendiente > 0 && (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-400">
                          <DollarSign className="h-3 w-3" />
                          Gs. {alumno.deudaPendiente.toLocaleString()}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-light-muted" />
                    </div>
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Total */}
      {filtered.length > 0 && (
        <p className="text-xs text-light-muted text-center">
          {filtered.length} {filtered.length === 1 ? 'alumno' : 'alumnos'}
        </p>
      )}
    </div>
  );
};

export default AlumnosList;
