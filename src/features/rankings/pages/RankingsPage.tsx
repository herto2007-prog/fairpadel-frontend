import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp, Filter } from 'lucide-react';
import { PageLayout } from '../../../components/layout';
import { rankingsService } from '../rankingsService';
import { useAuth } from '../../../features/auth/context/AuthContext';

interface RankingItem {
  id: string;
  posicion: number;
  posicionAnterior?: number;
  puntosTotales: number;
  torneosJugados: number;
  victorias: number;
  jugador: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl?: string;
    categoriaActual?: { nombre: string };
  };
}

export default function RankingsPage() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categoriaId: '',
    ciudad: '',
    temporada: '2026',
    genero: 'MASCULINO' as 'MASCULINO' | 'FEMENINO',
  });
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);

  useEffect(() => {
    loadCategorias();
  }, []);

  useEffect(() => {
    loadRankings();
  }, [filters]);

  const loadCategorias = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategorias(data.filter((c: any) => c.tipo === filters.genero));
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadRankings = async () => {
    setLoading(true);
    try {
      const response = await rankingsService.getRankings({
        categoriaId: filters.categoriaId,
        ciudad: filters.ciudad,
        temporada: filters.temporada,
        genero: filters.genero,
      });
      if (response.success) {
        setRankings(response.data);
      }
    } catch (error) {
      console.error('Error cargando rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTendencia = (actual: number, anterior?: number) => {
    if (!anterior) return null;
    if (actual < anterior) return 'up';
    if (actual > anterior) return 'down';
    return 'same';
  };

  return (
    <PageLayout showHeader showEffects>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#df2531]" />
            Rankings FairPadel
          </h1>
          <p className="text-gray-400">
            Posiciones actualizadas de jugadores por categoría
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filtros</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Género */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Género</label>
              <select
                value={filters.genero}
                onChange={(e) => setFilters({ ...filters, genero: e.target.value as any })}
                className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none"
              >
                <option value="MASCULINO">Caballeros</option>
                <option value="FEMENINO">Damas</option>
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
              <select
                value={filters.categoriaId}
                onChange={(e) => setFilters({ ...filters, categoriaId: e.target.value })}
                className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none"
              >
                <option value="">Todas</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {/* Temporada */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Temporada</label>
              <select
                value={filters.temporada}
                onChange={(e) => setFilters({ ...filters, temporada: e.target.value })}
                className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            {/* Ciudad */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ciudad</label>
              <input
                type="text"
                placeholder="Todas"
                value={filters.ciudad}
                onChange={(e) => setFilters({ ...filters, ciudad: e.target.value })}
                className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#df2531] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-[#df2531]/20 border-t-[#df2531] rounded-full"
              />
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay rankings para estos filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Pos</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Jugador</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-400">Categoría</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-400">Torneos</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-400">Victorias</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((item, index) => {
                    const tendencia = getTendencia(item.posicion, item.posicionAnterior);
                    const isTop3 = item.posicion <= 3;
                    
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border-b border-white/5 hover:bg-white/[0.02] ${
                          user?.id === item.jugador.id ? 'bg-[#df2531]/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isTop3 ? (
                              <Medal className={`w-5 h-5 ${
                                item.posicion === 1 ? 'text-yellow-400' :
                                item.posicion === 2 ? 'text-gray-300' :
                                'text-amber-600'
                              }`} />
                            ) : (
                              <span className="w-5 text-center text-gray-500">{item.posicion}</span>
                            )}
                            {tendencia && (
                              <TrendingUp className={`w-3 h-3 ${
                                tendencia === 'up' ? 'text-green-400 rotate-0' :
                                tendencia === 'down' ? 'text-red-400 rotate-180' :
                                'text-gray-500'
                              }`} />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.jugador.fotoUrl ? (
                              <img
                                src={item.jugador.fotoUrl}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-gray-400">
                                {item.jugador.nombre.charAt(0)}{item.jugador.apellido.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-white">
                                {item.jugador.apellido}, {item.jugador.nombre}
                              </p>
                              {user?.id === item.jugador.id && (
                                <span className="text-xs text-[#df2531]">Tú</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-400">
                          {item.jugador.categoriaActual?.nombre || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-400">
                          {item.torneosJugados}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-400">
                          {item.victorias}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-[#df2531]">
                            {item.puntosTotales.toLocaleString()}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
