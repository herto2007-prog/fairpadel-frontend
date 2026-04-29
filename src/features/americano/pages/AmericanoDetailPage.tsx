import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Calendar, MapPin, ArrowLeft,
  UserPlus, Check, Medal, Target, Swords,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { americanoService, AmericanoTorneo, ClasificacionItem, AmericanoRonda } from '../../../services/americanoService';
import { formatDatePYShort } from '../../../utils/date';

export function AmericanoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [torneo, setTorneo] = useState<AmericanoTorneo | null>(null);
  const [clasificacion, setClasificacion] = useState<ClasificacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [rondaExpandida, setRondaExpandida] = useState<string | null>(null);
  const [tabActivo, setTabActivo] = useState<'info' | 'clasificacion' | 'rondas'>('info');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [torneoData, clasifData] = await Promise.all([
        americanoService.getById(id),
        americanoService.getClasificacion(id),
      ]);
      setTorneo(torneoData);
      setClasificacion(clasifData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el torneo');
    } finally {
      setLoading(false);
    }
  };

  const handleInscribirse = async () => {
    if (!isAuthenticated || !user || !id) {
      navigate('/login', { state: { from: `/americano/${id}` } });
      return;
    }
    try {
      setInscribiendo(true);
      setError('');
      await americanoService.inscribir(id, user.id);
      setMensaje('¡Inscripción exitosa!');
      await loadData();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al inscribirse');
    } finally {
      setInscribiendo(false);
    }
  };

  const yaInscripto = torneo?.americanosRonda?.some(r => 
    r.puntajes.some(p => p.jugador.id === user?.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (!torneo) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">Torneo no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/americano')}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a torneos americanos
        </motion.button>

        {/* Info principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/5 rounded-xl p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                  Americano
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  torneo.estado === 'EN_CURSO' 
                    ? 'bg-green-500/20 text-green-400' 
                    : torneo.estado === 'PUBLICADO'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-white/10 text-white/50'
                }`}>
                  {torneo.estado === 'EN_CURSO' ? 'En curso' : torneo.estado === 'PUBLICADO' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white">{torneo.nombre}</h1>
            </div>
            
            {!yaInscripto && torneo.estado !== 'FINALIZADO' && (
              <button
                onClick={handleInscribirse}
                disabled={inscribiendo}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {inscribiendo ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Inscribirme
              </button>
            )}
            
            {yaInscripto && (
              <span className="flex items-center gap-1.5 px-3 py-2 bg-green-500/20 text-green-400 text-sm rounded-lg">
                <Check className="w-4 h-4" />
                Inscripto
              </span>
            )}
          </div>

          {torneo.descripcion && (
            <p className="text-white/50 text-sm mb-4">{torneo.descripcion}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Fecha" value={`${formatDatePYShort(torneo.fechaInicio)} - ${formatDatePYShort(torneo.fechaFin)}`} />
            <InfoItem icon={<MapPin className="w-4 h-4" />} label="Ciudad" value={torneo.ciudad} />
            <InfoItem icon={<Users className="w-4 h-4" />} label="Inscriptos" value={`${torneo._count.inscripciones}`} />
            <InfoItem icon={<Target className="w-4 h-4" />} label="Rondas" value={`${torneo.configAmericano?.rondaActual || 0}/${torneo.configAmericano?.numRondas || 4}`} />
          </div>

          {/* Mensajes */}
          <AnimatePresence>
            {mensaje && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm"
              >
                {mensaje}
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/[0.02] border border-white/5 rounded-xl p-1">
          {[
            { key: 'info' as const, label: 'Info', icon: Trophy },
            { key: 'clasificacion' as const, label: 'Clasificación', icon: Medal },
            { key: 'rondas' as const, label: 'Rondas', icon: Swords },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTabActivo(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                tabActivo === tab.key
                  ? 'bg-primary/20 text-primary'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido del tab */}
        <AnimatePresence mode="wait">
          {tabActivo === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Config del americano */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Configuración</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ConfigItem label="Puntos por victoria" value={`+${torneo.configAmericano?.puntosPorVictoria || 3}`} />
                  <ConfigItem label="Puntos por derrota" value={`+${torneo.configAmericano?.puntosPorDerrota || 1}`} />
                  <ConfigItem label="Games por set" value={`${torneo.configAmericano?.gamesPorSet || 6}`} />
                  <ConfigItem label="Total rondas" value={`${torneo.configAmericano?.numRondas || 4}`} />
                </div>
              </div>

              {/* Organizador */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-3">Organizador</h3>
                <div className="flex items-center gap-3">
                  {torneo.organizador.fotoUrl ? (
                    <img src={torneo.organizador.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium">
                      {torneo.organizador.nombre[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">{torneo.organizador.nombre} {torneo.organizador.apellido}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tabActivo === 'clasificacion' && (
            <motion.div
              key="clasificacion"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ClasificacionTable data={clasificacion} />
            </motion.div>
          )}

          {tabActivo === 'rondas' && (
            <motion.div
              key="rondas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {torneo.americanosRonda.length === 0 && (
                <div className="text-center py-12">
                  <Swords className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Aún no se iniciaron rondas</p>
                </div>
              )}
              
              {torneo.americanosRonda.map((ronda) => (
                <RondaCard
                  key={ronda.id}
                  ronda={ronda}
                  expandida={rondaExpandida === ronda.id}
                  onToggle={() => setRondaExpandida(rondaExpandida === ronda.id ? null : ronda.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-white/30">{icon}</div>
      <div>
        <p className="text-white/30 text-xs">{label}</p>
        <p className="text-white text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <p className="text-white/30 text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-semibold">{value}</p>
    </div>
  );
}

function ClasificacionTable({ data }: { data: ClasificacionItem[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Medal className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">Aún no hay clasificación</p>
      </div>
    );
  }

  const posicionColor = (pos: number) => {
    if (pos === 0) return 'text-yellow-400';
    if (pos === 1) return 'text-gray-300';
    if (pos === 2) return 'text-amber-600';
    return 'text-white/50';
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-white/30 font-medium px-4 py-3 w-12">#</th>
              <th className="text-left text-white/30 font-medium px-4 py-3">Jugador</th>
              <th className="text-right text-white/30 font-medium px-4 py-3">Pts</th>
              <th className="text-right text-white/30 font-medium px-4 py-3 hidden sm:table-cell">PJ</th>
              <th className="text-right text-white/30 font-medium px-4 py-3 hidden sm:table-cell">PG</th>
              <th className="text-right text-white/30 font-medium px-4 py-3 hidden md:table-cell">Sets+</th>
              <th className="text-right text-white/30 font-medium px-4 py-3 hidden md:table-cell">Games+</th>
              <th className="text-right text-white/30 font-medium px-4 py-3 hidden lg:table-cell">Diff</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.jugadorId} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                <td className={`px-4 py-3 font-bold ${posicionColor(idx)}`}>
                  {idx + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {item.fotoUrl ? (
                      <img src={item.fotoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs">
                        {item.nombre[0]}
                      </div>
                    )}
                    <span className="text-white font-medium">{item.nombre} {item.apellido}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-bold text-primary">{item.puntosTotal}</td>
                <td className="px-4 py-3 text-right text-white/50 hidden sm:table-cell">{item.partidosJugados}</td>
                <td className="px-4 py-3 text-right text-white/50 hidden sm:table-cell">{item.partidosGanados}</td>
                <td className="px-4 py-3 text-right text-white/50 hidden md:table-cell">{item.setsGanados}</td>
                <td className="px-4 py-3 text-right text-white/50 hidden md:table-cell">{item.gamesGanados}</td>
                <td className={`px-4 py-3 text-right font-medium hidden lg:table-cell ${item.diferenciaGames >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.diferenciaGames > 0 ? '+' : ''}{item.diferenciaGames}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RondaCard({ ronda, expandida, onToggle }: { ronda: AmericanoRonda; expandida: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
            {ronda.numero}
          </span>
          <div className="text-left">
            <p className="text-white text-sm font-medium">Ronda {ronda.numero}</p>
            <p className="text-white/30 text-xs">
              {ronda.parejas.length} parejas · {ronda.puntajes.length} jugadores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            ronda.estado === 'EN_JUEGO' 
              ? 'bg-green-500/20 text-green-400' 
              : ronda.estado === 'FINALIZADA'
              ? 'bg-white/10 text-white/50'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {ronda.estado === 'EN_JUEGO' ? 'En juego' : ronda.estado === 'FINALIZADA' ? 'Finalizada' : 'Pendiente'}
          </span>
          {expandida ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expandida && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Parejas */}
              <div className="mb-4">
                <p className="text-white/30 text-xs font-medium mb-2">Parejas</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ronda.parejas.map((pareja) => (
                    <div key={pareja.id} className="bg-white/[0.03] rounded-lg p-3 flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[pareja.jugador1, pareja.jugador2].map((j, i) => (
                          j.fotoUrl ? (
                            <img key={i} src={j.fotoUrl} alt="" className="w-6 h-6 rounded-full object-cover border-2 border-dark" />
                          ) : (
                            <div key={i} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs border-2 border-dark">
                              {j.nombre[0]}
                            </div>
                          )
                        ))}
                      </div>
                      <span className="text-white/70 text-xs">
                        {pareja.jugador1.nombre} + {pareja.jugador2.nombre}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Puntajes de la ronda */}
              {ronda.puntajes.length > 0 && (
                <div>
                  <p className="text-white/30 text-xs font-medium mb-2">Puntajes</p>
                  <div className="space-y-1">
                    {ronda.puntajes
                      .sort((a, b) => b.puntos - a.puntos)
                      .map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            {p.jugador.fotoUrl ? (
                              <img src={p.jugador.fotoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs">
                                {p.jugador.nombre[0]}
                              </div>
                            )}
                            <span className="text-white/70 text-xs">{p.jugador.nombre} {p.jugador.apellido}</span>
                          </div>
                          <span className="text-primary text-sm font-bold">{p.puntos} pts</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AmericanoDetailPage;
