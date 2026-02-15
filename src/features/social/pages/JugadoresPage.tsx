import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import socialService, { type JugadorBusqueda } from '@/services/socialService';
import { Loading, Card, CardContent, Badge } from '@/components/ui';
import {
  Search,
  MapPin,
  Users,
  UserPlus,
  UserMinus,
  Crown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const JugadoresPage = () => {
  const { user, isAuthenticated } = useAuthStore();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [genero, setGenero] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // Data state
  const [jugadores, setJugadores] = useState<JugadorBusqueda[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ciudades, setCiudades] = useState<string[]>([]);

  // Follow state: track who the current user follows
  const [siguiendo, setSiguiendo] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);

  // Load cities for filter dropdown
  useEffect(() => {
    socialService.obtenerCiudades().then(setCiudades).catch(() => {});
  }, []);

  // Load who the user follows
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    socialService
      .getSiguiendo(user.id)
      .then((list) => {
        setSiguiendo(new Set(list.map((u) => u.id)));
      })
      .catch(() => {});
  }, [isAuthenticated, user]);

  // Search players
  const buscar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await socialService.buscarJugadores(
        searchQuery || undefined,
        ciudad || undefined,
        genero || undefined,
        page,
        LIMIT,
      );
      setJugadores(data.jugadores);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, ciudad, genero, page]);

  // Trigger search on filter/page changes
  useEffect(() => {
    buscar();
  }, [buscar]);

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    buscar();
  };

  // Follow / unfollow
  const handleFollow = async (jugadorId: string) => {
    if (!isAuthenticated) {
      toast.error('Inicia sesion para seguir jugadores');
      return;
    }
    setLoadingFollow(jugadorId);
    try {
      if (siguiendo.has(jugadorId)) {
        await socialService.dejarDeSeguir(jugadorId);
        setSiguiendo((prev) => {
          const next = new Set(prev);
          next.delete(jugadorId);
          return next;
        });
        toast.success('Dejaste de seguir');
      } else {
        await socialService.seguir(jugadorId);
        setSiguiendo((prev) => new Set(prev).add(jugadorId));
        toast.success('Siguiendo');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error');
    } finally {
      setLoadingFollow(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-light-text flex items-center gap-3">
          <Users className="h-8 w-8 text-primary-400" />
          Jugadores
        </h1>
        <p className="text-light-secondary mt-1">
          Busca jugadores, filtra por ciudad y sigue a tus favoritos
        </p>
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-muted" />
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={searchQuery}
                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder:text-light-muted focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* City filter */}
            <select
              value={ciudad}
              onChange={(e) => handleFilterChange(setCiudad, e.target.value)}
              className="px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-light-text focus:outline-none focus:border-primary-500 min-w-[160px]"
            >
              <option value="">Todas las ciudades</option>
              {ciudades.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Gender filter */}
            <select
              value={genero}
              onChange={(e) => handleFilterChange(setGenero, e.target.value)}
              className="px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-light-text focus:outline-none focus:border-primary-500 min-w-[140px]"
            >
              <option value="">Todos</option>
              <option value="MASCULINO">Caballeros</option>
              <option value="FEMENINO">Damas</option>
            </select>
          </form>

          {!loading && (
            <p className="text-sm text-light-muted mt-3">
              {total} jugador{total !== 1 ? 'es' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <Loading text="Buscando jugadores..." />
      ) : jugadores.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-light-muted mx-auto mb-4" />
          <p className="text-light-secondary text-lg">No se encontraron jugadores</p>
          <p className="text-light-muted text-sm mt-1">
            Intenta con otros filtros o un nombre diferente
          </p>
        </div>
      ) : (
        <>
          {/* Player grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {jugadores.map((j) => {
              const isMe = user?.id === j.id;
              const isFollowing = siguiendo.has(j.id);
              const isLoadingThis = loadingFollow === j.id;

              return (
                <Card
                  key={j.id}
                  className="hover:border-primary-500/30 transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Link to={`/jugadores/${j.id}`} className="flex-shrink-0">
                        <div className="h-14 w-14 rounded-full bg-primary-500/20 flex items-center justify-center overflow-hidden">
                          {j.fotoUrl ? (
                            <img
                              src={j.fotoUrl}
                              alt={j.nombre}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-primary-400 font-bold text-lg">
                              {j.nombre.charAt(0)}
                              {j.apellido.charAt(0)}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/jugadores/${j.id}`}
                          className="hover:text-primary-400 transition-colors"
                        >
                          <h3 className="font-semibold text-light-text truncate flex items-center gap-1.5">
                            {j.nombre} {j.apellido}
                            {j.esPremium && (
                              <Crown className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
                            )}
                          </h3>
                        </Link>

                        {j.ciudad && (
                          <p className="text-sm text-light-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {j.ciudad}
                          </p>
                        )}

                        {j.categoriaActual && (
                          <Badge
                            variant={j.genero === 'FEMENINO' ? 'secondary' : 'default'}
                            className="mt-1.5 text-xs"
                          >
                            {j.categoriaActual.nombre}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Follow button */}
                    {isAuthenticated && !isMe && (
                      <button
                        onClick={() => handleFollow(j.id)}
                        disabled={isLoadingThis}
                        className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isFollowing
                            ? 'bg-dark-bg border border-dark-border text-light-secondary hover:border-red-500/50 hover:text-red-400'
                            : 'bg-primary-500/10 border border-primary-500/30 text-primary-400 hover:bg-primary-500/20'
                        } disabled:opacity-50`}
                      >
                        {isLoadingThis ? (
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4" />
                            Siguiendo
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Seguir
                          </>
                        )}
                      </button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-light-secondary hover:text-light-text hover:border-primary-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <span className="text-light-secondary text-sm">
                Pagina {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-light-secondary hover:text-light-text hover:border-primary-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JugadoresPage;
