import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, MapPin, Trophy, Users } from 'lucide-react';
import { comunidadService, JugadorComunidad } from '../../../services/comunidadService';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { useToast } from '../../../components/ui/ToastProvider';

export function ComunidadV2Page() {
  const { showError } = useToast();
  const [jugadores, setJugadores] = useState<JugadorComunidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarJugadores();
  }, []);

  const cargarJugadores = async () => {
    setLoading(true);
    try {
      const response = await comunidadService.getJugadores();
      if (response.success) {
        setJugadores(response.data);
      } else {
        showError('Error', 'No se pudieron cargar los jugadores');
      }
    } catch (err: any) {
      showError('Error', err.message || 'Error al cargar jugadores');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar jugadores localmente por nombre/apellido
  const jugadoresFiltrados = searchTerm
    ? jugadores.filter(
        (j) =>
          j.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          j.apellido.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : jugadores;

  return (
    <div className="min-h-screen bg-[#0B0E14] relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold text-white mb-2">Comunidad FairPadel V2</h1>
            <p className="text-gray-400">Todos los jugadores registrados en la plataforma</p>
          </motion.div>
        </div>

        {/* Búsqueda simple */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#151921] border border-[#232838] rounded-2xl p-4 mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o apellido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#df2531] transition-colors"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            {jugadoresFiltrados.length > 0 ? (
              <>
                Mostrando <span className="text-white font-semibold">{jugadoresFiltrados.length}</span> de{' '}
                <span className="text-white font-semibold">{jugadores.length}</span> jugadores
              </>
            ) : (
              'No se encontraron jugadores'
            )}
          </p>
          <button
            onClick={cargarJugadores}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Recargar
          </button>
        </div>

        {/* Grid de jugadores */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-[#df2531]/30 border-t-[#df2531] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Cargando jugadores...</p>
          </div>
        ) : jugadoresFiltrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No se encontraron jugadores</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Intenta con otra búsqueda' : 'No hay jugadores registrados'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {jugadoresFiltrados.map((jugador, index) => (
              <JugadorCard key={jugador.id} jugador={jugador} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente JugadorCard
function JugadorCard({ jugador, index }: { jugador: JugadorComunidad; index: number }) {
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
                {jugador.nombre[0]}
                {jugador.apellido[0]}
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
            {/* Estado del usuario */}
            <span
              className={`inline-block text-xs mt-1 px-2 py-0.5 rounded-full ${
                jugador.estado === 'ACTIVO'
                  ? 'bg-green-500/20 text-green-400'
                  : jugador.estado === 'NO_VERIFICADO'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {jugador.estado}
            </span>
          </div>
        </div>

        {/* Ubicación */}
        {jugador.ciudad && (
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <MapPin className="w-4 h-4" />
            <span>
              {jugador.ciudad}
              {jugador.pais ? `, ${jugador.pais}` : ''}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-2 pt-4 border-t border-[#232838]">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{jugador.seguidores}</p>
            <p className="text-xs text-gray-500">Seguidores</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
