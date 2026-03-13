import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, MapPin, Calendar, ChevronRight, Star } from 'lucide-react';
import { PageLayout } from '../../../components/layout';
import { circuitosService } from '../circuitosService';
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
  destacado: boolean;
  fechaInicio: string;
  fechaFin?: string;
  _count?: {
    torneos: number;
    clasificados: number;
  };
}

export default function CircuitosListPage() {
  const [circuitos, setCircuitos] = useState<Circuito[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCircuitos();
  }, []);

  const loadCircuitos = async () => {
    try {
      const response = await circuitosService.getCircuitos();
      if (response.success) {
        setCircuitos(response.data);
      }
    } catch (error) {
      console.error('Error cargando circuitos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PY', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <PageLayout showHeader showEffects>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#df2531]" />
            Circuitos y Ligas
          </h1>
          <p className="text-gray-400">
            Compite en series de torneos y acumula puntos para clasificar a la gran final
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
          <div className="grid gap-6">
            {circuitos.map((circuito, index) => (
              <motion.div
                key={circuito.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/circuitos/${circuito.slug}`}
                  className="block bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-start gap-6">
                    {/* Logo */}
                    <div 
                      className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: circuito.colorPrimario || '#df2531' }}
                    >
                      {circuito.logoUrl ? (
                        <img 
                          src={circuito.logoUrl} 
                          alt="" 
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Trophy className="w-10 h-10 text-white" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {circuito.destacado && (
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            )}
                            <h2 className="text-xl font-bold text-white group-hover:text-[#df2531] transition-colors">
                              {circuito.nombre}
                            </h2>
                          </div>
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {circuito.descripcion || 'Serie de torneos con acumulación de puntos'}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#df2531] transition-colors" />
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {circuito.ciudad}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatFecha(circuito.fechaInicio)}
                          {circuito.fechaFin && ` - ${formatFecha(circuito.fechaFin)}`}
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 rounded text-gray-400">
                          Temp. {circuito.temporada}
                        </span>
                        {circuito._count && (
                          <>
                            <span className="px-2 py-0.5 bg-[#df2531]/20 text-[#df2531] rounded">
                              {circuito._count.torneos} torneos
                            </span>
                            {circuito._count.clasificados > 0 && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                                {circuito._count.clasificados} clasificados
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
