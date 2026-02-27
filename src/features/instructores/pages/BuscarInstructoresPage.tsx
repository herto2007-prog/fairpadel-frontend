import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { instructoresService } from '@/services/instructoresService';
import { Loading, Card, CardContent } from '@/components/ui';
import {
  GraduationCap,
  Search,
  MapPin,
  Award,
  DollarSign,
  User,
  CheckCircle,
  Home,
  ChevronRight,
} from 'lucide-react';
import type { Instructor } from '@/types';

const BuscarInstructoresPage = () => {
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [ciudad, setCiudad] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadInstructores();
  }, [page]);

  // Debounced search when filters change
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      loadInstructores();
    }, 400);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [ciudad, especialidad]);

  const loadInstructores = async () => {
    setLoading(true);
    try {
      const data = await instructoresService.buscarInstructores({
        ciudad: ciudad.trim() || undefined,
        especialidad: especialidad.trim() || undefined,
        page,
        limit: 12,
      });
      setInstructores(data.instructores);
      setTotal(data.total);
      setTotalPages(Math.ceil(data.total / 12));
    } catch (error) {
      console.error('Error buscando instructores:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary-400" />
          Instructores de Pádel
        </h1>
        <p className="text-sm text-light-secondary mt-1">
          Encontrá al instructor ideal para mejorar tu juego
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-muted" />
          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Filtrar por ciudad..."
            className="w-full pl-10 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-muted" />
          <input
            type="text"
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            placeholder="Filtrar por especialidad..."
            className="w-full pl-10 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-light-muted mb-4">
          {total} instructor{total !== 1 ? 'es' : ''} encontrado{total !== 1 ? 's' : ''}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Buscando instructores..." />
        </div>
      ) : instructores.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="h-16 w-16 mx-auto mb-4 text-light-muted opacity-50" />
          <h2 className="text-lg font-semibold text-light-text mb-1">No se encontraron instructores</h2>
          <p className="text-sm text-light-secondary">Probá con otros filtros o volvé más tarde</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {instructores.map((inst) => (
              <Link key={inst.id} to={`/instructores/${inst.id}`}>
                <Card className="h-full hover:border-primary-500/50 transition-colors group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar */}
                      {inst.user?.fotoUrl ? (
                        <img
                          src={inst.user.fotoUrl}
                          alt={inst.user.nombre}
                          className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-light-text truncate group-hover:text-primary-400 transition-colors">
                            {inst.user?.nombre} {inst.user?.apellido}
                          </h3>
                          {inst.verificado && (
                            <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-light-muted flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {inst.experienciaAnios} años exp.
                        </p>
                      </div>

                      <ChevronRight className="h-4 w-4 text-light-muted group-hover:text-primary-400 transition-colors mt-1" />
                    </div>

                    {/* Especialidades */}
                    {inst.especialidades && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {inst.especialidades.split(',').slice(0, 4).map((esp) => (
                          <span key={esp} className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full text-[10px] font-medium">
                            {esp.trim()}
                          </span>
                        ))}
                        {inst.especialidades.split(',').length > 4 && (
                          <span className="px-2 py-0.5 bg-dark-surface text-light-muted rounded-full text-[10px]">
                            +{inst.especialidades.split(',').length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bottom info */}
                    <div className="flex items-center justify-between text-xs text-light-muted">
                      <div className="flex items-center gap-2">
                        {inst.user?.ciudad && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {inst.user.ciudad}
                          </span>
                        )}
                        {inst.aceptaDomicilio && (
                          <span className="flex items-center gap-0.5 text-green-400">
                            <Home className="h-3 w-3" />
                            Domicilio
                          </span>
                        )}
                      </div>
                      {inst.precioIndividual && (
                        <span className="flex items-center gap-0.5 text-light-secondary font-medium">
                          <DollarSign className="h-3 w-3" />
                          Gs. {inst.precioIndividual.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-dark-border text-light-secondary hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 text-sm text-light-muted">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-dark-border text-light-secondary hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BuscarInstructoresPage;
