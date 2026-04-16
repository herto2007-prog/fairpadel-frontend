import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, MapPin, Calendar, ChevronRight, Star, Users } from 'lucide-react';
import { PageLayout } from '../../../components/layout';
import { circuitosService } from '../../circuitos/circuitosService';
import { formatDatePY } from '../../../utils/date';
import { Link } from 'react-router-dom';

interface Circuito {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  ciudad: string;
  temporada: string;
  logoUrl?: string;
  colorPrimario?: string;
  destacado?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  estado: string;
  _count?: {
    torneos: number;
    clasificados: number;
  };
}

export default function RankingsPage() {
  const [circuitos, setCircuitos] = useState<Circuito[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCircuitos();
  }, []);

  const loadCircuitos = async () => {
    setLoading(true);
    try {
      const response = await circuitosService.getCircuitos();
      if (response.success) {
        // Mostrar circuitos activos primero, ordenados por destacado
        const data = (response.data || []).sort((a: Circuito, b: Circuito) => {
          if (a.destacado && !b.destacado) return -1;
          if (!a.destacado && b.destacado) return 1;
          return 0;
        });
        setCircuitos(data);
      }
    } catch (error) {
      console.error('Error cargando circuitos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout showHeader showEffects>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#df2531]" />
            Rankings
          </h1>
          <p className="text-gray-400">
            Explorá el ranking de cada circuito activo y seguí la trayectoria de los jugadores
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[#df2531]/20 border-t-[#df2531] rounded-full"
            />
          </div>
        ) : circuitos.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No hay circuitos activos en este momento</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {circuitos.map((circuito, index) => (
              <motion.div
                key={circuito.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/circuitos/${circuito.slug}?tab=ranking`}
                  className="block h-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-[#df2531]/30 transition-all group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: circuito.colorPrimario || '#df2531' }}
                    >
                      {circuito.logoUrl ? (
                        <img
                          src={circuito.logoUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Trophy className="w-8 h-8 text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          {circuito.destacado && (
                            <div className="flex items-center gap-1 mb-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-yellow-400">Destacado</span>
                            </div>
                          )}
                          <h2 className="text-lg font-bold text-white group-hover:text-[#df2531] transition-colors line-clamp-2">
                            {circuito.nombre}
                          </h2>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#df2531] transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                    {circuito.descripcion || 'Serie de torneos con acumulación de puntos'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {circuito.ciudad}
                    </span>
                    {circuito.fechaInicio && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDatePY(circuito.fechaInicio)}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-white/5 rounded text-gray-400">
                      Temp. {circuito.temporada}
                    </span>
                  </div>

                  {circuito._count && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Users className="w-4 h-4 text-[#df2531]" />
                        {circuito._count.torneos} torneos
                      </span>
                      {circuito._count.clasificados > 0 && (
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <Trophy className="w-4 h-4 text-green-400" />
                          {circuito._count.clasificados} clasificados
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
