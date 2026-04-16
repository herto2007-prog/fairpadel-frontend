import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, MapPin, Calendar, Medal, ChevronLeft, Users } from 'lucide-react';
import { PageLayout } from '../../../components/layout';
import { circuitosService } from '../circuitosService';
import { formatDatePY } from '../../../utils/date';

interface Circuito {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  ciudad: string;
  temporada: string;
  logoUrl?: string;
  bannerUrl?: string;
  colorPrimario?: string;
  fechaInicio: string;
  fechaFin?: string;
  fechaLimiteInscripcion?: string;
  torneosParaClasificar: number;
  tieneFinal: boolean;
  torneoFinal?: {
    id: string;
    nombre: string;
    slug: string;
    fechaInicio: string;
    flyerUrl?: string;
  };
}

interface RankingItem {
  posicion: number;
  jugadorId: string;
  puntosAcumulados: number;
  torneosJugados: number;
  jugador?: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl?: string;
    categoriaActual?: { nombre: string };
  };
}

interface TorneoCircuito {
  id: string;
  orden: number;
  esFinal: boolean;
  puntosValidos: boolean;
  torneo: {
    id: string;
    nombre: string;
    slug: string;
    fechaInicio: string;
    fechaFin?: string;
    ciudad: string;
    estado: string;
    flyerUrl?: string;
    organizador: {
      nombre: string;
      apellido: string;
    };
  };
}

export default function CircuitoDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [circuito, setCircuito] = useState<Circuito | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [torneos, setTorneos] = useState<TorneoCircuito[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'ranking' | 'torneos'>('info');

  useEffect(() => {
    if (slug) {
      loadCircuito();
    }
  }, [slug]);

  const loadCircuito = async () => {
    try {
      const [circuitoRes, rankingRes, torneosRes] = await Promise.all([
        circuitosService.getCircuitoBySlug(slug!),
        circuitosService.getRankingCircuito(slug!),
        circuitosService.getTorneosCircuito(slug!),
      ]);

      if (circuitoRes.success) {
        setCircuito(circuitoRes.data);
      }
      if (rankingRes.success) {
        setRanking(rankingRes.data);
      }
      if (torneosRes.success) {
        setTorneos(torneosRes.data);
      }
    } catch (error) {
      console.error('Error cargando circuito:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout showHeader showEffects>
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-[#df2531]/20 border-t-[#df2531] rounded-full"
          />
        </div>
      </PageLayout>
    );
  }

  if (!circuito) {
    return (
      <PageLayout showHeader showEffects>
        <div className="text-center py-20">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Circuito no encontrado</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader showEffects>
      {/* Banner */}
      <div 
        className="h-48 bg-cover bg-center relative"
        style={{ 
          backgroundImage: circuito.bannerUrl ? `url(${circuito.bannerUrl})` : 'none',
          backgroundColor: circuito.colorPrimario || '#df2531',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="max-w-6xl mx-auto px-4 h-full flex items-end pb-6 relative">
          <Link 
            to="/circuitos"
            className="absolute top-4 left-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver
          </Link>
          
          <div className="flex items-end gap-4">
            <div 
              className="w-24 h-24 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'white' }}
            >
              {circuito.logoUrl ? (
                <img src={circuito.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Trophy className="w-12 h-12" style={{ color: circuito.colorPrimario || '#df2531' }} />
              )}
            </div>
            <div className="mb-1">
              <h1 className="text-3xl font-bold text-white">{circuito.nombre}</h1>
              <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {circuito.ciudad}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDatePY(circuito.fechaInicio)}
                </span>
                <span className="px-2 py-0.5 bg-white/20 rounded">
                  Temp. {circuito.temporada}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <TabButton label="Información" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
          <TabButton label="Ranking" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} badge={ranking.length} />
          <TabButton label="Torneos" active={activeTab === 'torneos'} onClick={() => setActiveTab('torneos')} badge={torneos.length} />
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Descripción */}
            {circuito.descripcion && (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-3">Sobre el Circuito</h3>
                <p className="text-gray-400">{circuito.descripcion}</p>
              </div>
            )}

            {/* Reglas */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Reglas de Clasificación</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 text-[#df2531] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{torneos.length}</p>
                  <p className="text-sm text-gray-400">Torneos en el circuito</p>
                </div>
              </div>
            </div>

            {/* Final */}
            {(() => {
              const tf = torneos.find((t) => t.esFinal)?.torneo;
              return tf ? (
                <div className="bg-gradient-to-r from-[#df2531]/20 to-transparent border border-[#df2531]/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Medal className="w-5 h-5 text-[#df2531]" />
                    Gran Final
                  </h3>
                  <Link
                    to={`/t/${tf.slug}`}
                    className="flex items-center gap-4 group"
                  >
                    {tf.flyerUrl && (
                      <img
                        src={tf.flyerUrl}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-bold text-white group-hover:text-[#df2531] transition-colors">
                        {tf.nombre}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDatePY(tf.fechaInicio)}
                      </p>
                    </div>
                  </Link>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            {ranking.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Aún no hay puntos registrados en este circuito</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Pos</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Jugador</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-400">Torneos</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((item) => (
                    <tr key={item.jugadorId} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        {item.posicion <= 3 ? (
                          <Medal className={`w-5 h-5 ${
                            item.posicion === 1 ? 'text-yellow-400' :
                            item.posicion === 2 ? 'text-gray-300' :
                            'text-amber-600'
                          }`} />
                        ) : (
                          <span className="text-gray-500">{item.posicion}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.jugador ? (
                          <div className="flex items-center gap-3">
                            {item.jugador.fotoUrl ? (
                              <img src={item.jugador.fotoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-gray-400">
                                {item.jugador.apellido[0]}{item.jugador.nombre[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-white">{item.jugador.apellido}, {item.jugador.nombre}</p>
                              <p className="text-xs text-gray-500">{item.jugador.categoriaActual?.nombre}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Jugador {item.jugadorId.substring(0, 8)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">{item.torneosJugados}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-[#df2531]">{item.puntosAcumulados.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'torneos' && (
          <div className="space-y-4">
            {torneos.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No hay torneos aprobados en este circuito aún</p>
              </div>
            ) : (
              torneos.map((tc, index) => (
                <motion.div
                  key={tc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/t/${tc.torneo.slug}`}
                    className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      tc.esFinal 
                        ? 'bg-[#df2531] text-white' 
                        : 'bg-white/5 text-gray-400'
                    }`}>
                      {tc.orden || index + 1}
                    </div>
                    
                    {tc.torneo.flyerUrl && (
                      <img 
                        src={tc.torneo.flyerUrl} 
                        alt="" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white group-hover:text-[#df2531] transition-colors">
                          {tc.torneo.nombre}
                        </h4>
                        {tc.esFinal && (
                          <span className="px-2 py-0.5 bg-[#df2531]/20 text-[#df2531] text-xs rounded">
                            FINAL
                          </span>
                        )}
                        {!tc.puntosValidos && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                            No cuenta
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {formatDatePY(tc.torneo.fechaInicio)} • {tc.torneo.ciudad}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Organiza: {tc.torneo.organizador.apellido}, {tc.torneo.organizador.nombre}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

function TabButton({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
        active
          ? 'bg-[#df2531] text-white'
          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
      {badge !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-white/10'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
