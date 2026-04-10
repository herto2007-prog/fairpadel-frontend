import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, MapPin, Trophy, Users, Filter, 
  ChevronDown, X, Award 
} from 'lucide-react';
import { jugadoresService, Jugador, CategoriaFiltro } from '../../../services/jugadoresService';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { useToast } from '../../../components/ui/ToastProvider';
export function JugadoresListPage() {
  const { showError } = useToast();
  
  // Estados
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFiltro[]>([]);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  
  // Paginación
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Cargar datos de filtros
  useEffect(() => {
    cargarDatosFiltros();
  }, []);

  // Cargar jugadores cuando cambian filtros
  useEffect(() => {
    cargarJugadores();
  }, [searchTerm, ciudadSeleccionada, categoriaSeleccionada, page]);

  const cargarDatosFiltros = async () => {
    try {
      const response = await jugadoresService.getDatosFiltros();
      if (response.success) {
        setCiudades(response.data.ciudades);
        setCategorias(response.data.categorias);
      }
    } catch (err) {
      console.error('Error cargando filtros:', err);
    }
  };

  const cargarJugadores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await jugadoresService.buscar({
        q: searchTerm || undefined,
        ciudad: ciudadSeleccionada || undefined,
        categoriaId: categoriaSeleccionada || undefined,
        page,
        limit: 20,
      });

      if (response.success) {
        setJugadores(response.data);
        setPagination(response.pagination);
      }
    } catch (err: any) {
      showError('Error', 'No se pudieron cargar los jugadores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, ciudadSeleccionada, categoriaSeleccionada, page, showError]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setCiudadSeleccionada('');
    setCategoriaSeleccionada('');
    setPage(1);
  };

  const tieneFiltrosActivos = searchTerm || ciudadSeleccionada || categoriaSeleccionada;

  return (
    <div className="min-h-screen bg-[#0B0E14] relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              Comunidad FairPadel
            </h1>
            <p className="text-gray-400">
              Descubre jugadores, conecta y compite con la comunidad de pádel más grande de Paraguay
            </p>
          </motion.div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#151921] border border-[#232838] rounded-2xl p-4 mb-8"
        >
          {/* Búsqueda principal */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#df2531] transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
              className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                filtrosAbiertos || tieneFiltrosActivos
                  ? 'bg-[#df2531]/20 border-[#df2531] text-[#df2531]'
                  : 'bg-[#0B0E14] border-[#232838] text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtros
              {tieneFiltrosActivos && (
                <span className="bg-[#df2531] text-white text-xs px-2 py-0.5 rounded-full">
                  {[ciudadSeleccionada, categoriaSeleccionada].filter(Boolean).length}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${filtrosAbiertos ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filtros expandibles */}
          <AnimatePresence>
            {filtrosAbiertos && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-[#232838] grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filtro Ciudad */}
                  <div>
                    <label className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <MapPin className="w-4 h-4" />
                      Ciudad
                    </label>
                    <select
                      value={ciudadSeleccionada}
                      onChange={(e) => setCiudadSeleccionada(e.target.value)}
                      className="w-full px-4 py-2 bg-[#0B0E14] border border-[#232838] rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                    >
                      <option value="">Todas las ciudades</option>
                      {ciudades.map((ciudad) => (
                        <option key={ciudad} value={ciudad}>{ciudad}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Categoría */}
                  <div>
                    <label className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <Award className="w-4 h-4" />
                      Categoría
                    </label>
                    <select
                      value={categoriaSeleccionada}
                      onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                      className="w-full px-4 py-2 bg-[#0B0E14] border border-[#232838] rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                    >
                      <option value="">Todas las categorías</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botón limpiar filtros */}
                {tieneFiltrosActivos && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={limpiarFiltros}
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            {pagination.total > 0 ? (
              <>
                Mostrando <span className="text-white font-semibold">{jugadores.length}</span> de{' '}
                <span className="text-white font-semibold">{pagination.total}</span> jugadores
              </>
            ) : (
              'No se encontraron jugadores'
            )}
          </p>
        </div>

        {/* Grid de jugadores */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-[#df2531]/30 border-t-[#df2531] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Buscando jugadores...</p>
          </div>
        ) : jugadores.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No se encontraron jugadores
            </h3>
            <p className="text-gray-500">
              {tieneFiltrosActivos 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Sé el primero en unirte a la comunidad'}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {jugadores.map((jugador, index) => (
                <JugadorCard 
                  key={jugador.id} 
                  jugador={jugador} 
                  index={index}
                />
              ))}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-[#151921] border border-[#232838] rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#232838] transition-colors"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Página {page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 bg-[#151921] border border-[#232838] rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#232838] transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Componente JugadorCard
function JugadorCard({ jugador, index }: { jugador: Jugador; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        to={`/perfil/${jugador.id}`}
        className="block bg-[#151921] border border-[#232838] rounded-2xl p-5 hover:border-[#df2531]/50 transition-all hover:transform hover:-translate-y-1 group"
      >
        {/* Header con foto */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#df2531]/20 to-[#df2531]/5 flex items-center justify-center overflow-hidden border-2 border-[#232838] group-hover:border-[#df2531]/30 transition-colors">
            {jugador.fotoUrl ? (
              <img 
                src={jugador.fotoUrl} 
                alt={`${jugador.nombre} ${jugador.apellido}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-[#df2531]">
                {jugador.nombre[0]}{jugador.apellido[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate group-hover:text-[#df2531] transition-colors">
              {jugador.nombre} {jugador.apellido}
            </h3>
            {jugador.categoria && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#df2531]/10 text-[#df2531] text-xs rounded-full">
                <Trophy className="w-3 h-3" />
                {jugador.categoria.nombre}
              </span>
            )}
          </div>
        </div>

        {/* Ubicación */}
        {jugador.ciudad && (
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <MapPin className="w-4 h-4" />
            <span>{jugador.ciudad}{jugador.pais ? `, ${jugador.pais}` : ''}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#232838]">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{jugador.stats.torneosJugados}</p>
            <p className="text-xs text-gray-500">Torneos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#df2531]">{jugador.stats.efectividad}%</p>
            <p className="text-xs text-gray-500">Efectividad</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{jugador.seguidores}</p>
            <p className="text-xs text-gray-500">Seguidores</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
