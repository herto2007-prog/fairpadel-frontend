import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy, MapPin, Calendar, TrendingUp, Award,
  Share2, Settings, Camera, Edit3, Flame,
  Target, Star, MapPinned,
  Activity, Crown, Zap, Shield, Loader2, ArrowLeft
} from 'lucide-react';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { perfilService, PerfilJugador } from '../perfilService';
import { useAuth } from '../../auth/context/AuthContext';
import { EditarPerfilModal } from '../components/EditarPerfilModal';
import { WhatsAppPreferencesCard } from '../components/WhatsAppPreferencesCard';
import { SeguirButton } from '../components/SeguirButton';
import { formatDatePY } from '../../../utils/date';

export function PerfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  
  const [perfil, setPerfil] = useState<PerfilJugador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadPerfil();
  }, [id]);

  const loadPerfil = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data: PerfilJugador;
      
      if (id) {
        // Ver perfil de otro usuario
        data = await perfilService.getPerfilJugador(id);
        setIsMyProfile(isAuthenticated && currentUser?.id === id);
      } else if (isAuthenticated) {
        // Ver mi propio perfil
        data = await perfilService.getMiPerfil();
        setIsMyProfile(true);
      } else {
        setError('Debes iniciar sesión para ver tu perfil');
        setLoading(false);
        return;
      }
      
      setPerfil(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando perfil');
    } finally {
      setLoading(false);
    }
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'oro': return 'bg-yellow-400';
      case 'plata': return 'bg-gray-300';
      case 'bronce': return 'bg-amber-600';
      default: return 'bg-purple-400';
    }
  };

  const getTipoIcono = (tipo: string) => {
    switch (tipo) {
      case 'campeonato': return Trophy;
      case 'subcampeonato': return Award;
      case 'ascenso': return TrendingUp;
      default: return Activity;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'campeonato': return 'text-yellow-400';
      case 'subcampeonato': return 'text-gray-400';
      case 'ascenso': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <BackgroundEffects variant="subtle" showGrid={false} />
        <Loader2 className="w-8 h-8 text-[#df2531] animate-spin" />
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <BackgroundEffects variant="subtle" showGrid={false} />
        <div className="text-center">
          <p className="text-white/60 mb-4">{error || 'Perfil no encontrado'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-[#df2531] text-white rounded-lg mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  const handleUpdatePerfil = (updatedData: Partial<PerfilJugador>) => {
    setPerfil(prev => prev ? { ...prev, ...updatedData } : null);
  };

  const statCards = [
    { label: 'Torneos Ganados', value: perfil.stats.torneosGanados, icon: Trophy, color: 'from-yellow-500/20 to-orange-500/20', iconColor: 'text-yellow-400' },
    { label: 'Partidos Jugados', value: perfil.partidos.jugados, icon: Activity, color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
    { label: 'Puntos Totales', value: perfil.ranking[0]?.puntosTotales?.toLocaleString() || '0', icon: Star, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
    { label: 'Racha Actual', value: perfil.partidos.rachaActual, icon: Flame, color: 'from-red-500/20 to-rose-500/20', iconColor: 'text-red-400', suffix: 'victorias' },
  ];

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      {/* HERO SECTION */}
      <div className="relative">
        <div className="h-48 md:h-64 relative overflow-hidden">
          {perfil.bannerUrl ? (
            <img src={perfil.bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#df2531]/30 via-purple-900/20 to-blue-900/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />
          
          {perfil.esPremium && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full"
            >
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-300">Premium</span>
            </motion.div>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="relative -mt-20 mb-6 flex flex-col md:flex-row items-start md:items-end gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-dark bg-[#151921] relative group">
                {perfil.fotoUrl ? (
                  <img src={perfil.fotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#df2531] to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                    {perfil.nombre[0]}{perfil.apellido[0]}
                  </div>
                )}
                {isMyProfile && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-dark rounded-full" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 pb-2"
            >
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {perfil.nombre} {perfil.apellido}
                </h1>
                {isMyProfile && (
                  <button className="p-2 text-white/40 hover:text-white transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-white/50 mb-2">@{perfil.username}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                {perfil.categoria && (
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    {perfil.categoria.nombre}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {perfil.ciudad || 'Sin ciudad'}, {perfil.pais}
                </span>
                {perfil.edad && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {perfil.edad} años
                  </span>
                )}
              </div>

              {perfil.bio && (
                <p className="mt-3 text-white/70 max-w-xl">{perfil.bio}</p>
              )}

              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{perfil.seguidores}</p>
                  <p className="text-xs text-white/40">Seguidores</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{perfil.siguiendo}</p>
                  <p className="text-xs text-white/40">Siguiendo</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{perfil.stats.torneosJugados}</p>
                  <p className="text-xs text-white/40">Torneos</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 pb-2"
            >
              {!isMyProfile ? (
                <SeguirButton
                  usuarioId={perfil.id}
                  initialSeguidoresCount={perfil.seguidores}
                  onSeguimientoChange={(_siguiendo, count) => {
                    setPerfil((prev) => (prev ? { ...prev, seguidores: count } : null));
                  }}
                />
              ) : (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Perfil
                </button>
              )}
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all">
                <Share2 className="w-4 h-4" />
              </button>
              {isMyProfile && (
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all">
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={`relative p-5 rounded-2xl bg-gradient-to-br ${stat.color} border border-white/5 backdrop-blur-sm group hover:border-white/10 transition-all cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-white/5 ${stat.iconColor}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <TrendingUp className="w-4 h-4 text-white/20" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-white/50">{stat.label}</p>
              {stat.suffix && <p className="text-xs text-white/30 mt-1">{stat.suffix}</p>}
            </motion.div>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Gráfico de Evolución */}
            {perfil.historialPuntos.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#151921]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#df2531]" />
                      Historial de Puntos
                    </h3>
                    <p className="text-sm text-white/40">Últimos torneos</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {perfil.historialPuntos.slice(0, 6).map((h, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        h.posicion === '1ro' ? 'bg-yellow-500/20 text-yellow-400' :
                        h.posicion === '2do' ? 'bg-gray-500/20 text-gray-400' :
                        h.posicion === '3ro' ? 'bg-amber-600/20 text-amber-500' :
                        'bg-white/10 text-white'
                      }`}>
                        {h.posicion === '1ro' ? '🏆' : h.posicion === '2do' ? '🥈' : h.posicion === '3ro' ? '🥉' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{h.torneo}</p>
                        <p className="text-xs text-white/40">{h.categoria}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#df2531] font-bold">+{h.puntos} pts</p>
                        <p className="text-xs text-white/40">
                          {formatDatePY(h.fecha)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Efectividad */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#151921]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#df2531]" />
                Efectividad
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path className="text-green-500" strokeDasharray={`${perfil.partidos.efectividad}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">{perfil.partidos.efectividad}%</span>
                  </div>
                  <p className="text-sm text-white/60">Victorias</p>
                </div>

                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-3xl font-bold text-white mb-1">{perfil.partidos.ganados}</p>
                  <p className="text-sm text-white/60">Ganados</p>
                </div>

                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-3xl font-bold text-white mb-1">{perfil.partidos.perdidos}</p>
                  <p className="text-sm text-white/60">Perdidos</p>
                </div>
              </div>
            </motion.div>

            {/* Actividad Reciente */}
            {perfil.actividadReciente.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-[#151921]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#df2531]" />
                  Actividad Reciente
                </h3>

                <div className="space-y-4">
                  {perfil.actividadReciente.map((actividad) => {
                    const Icon = getTipoIcono(actividad.tipo);
                    return (
                      <motion.div 
                        key={actividad.id}
                        className="flex items-start gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-colors cursor-pointer group"
                      >
                        <div className={`p-2.5 rounded-lg bg-white/5 ${getTipoColor(actividad.tipo)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium group-hover:text-[#df2531] transition-colors">
                            {actividad.titulo}
                          </p>
                          <p className="text-sm text-white/40">{actividad.detalle}</p>
                        </div>
                        <p className="text-xs text-white/30">
                          {formatDatePY(actividad.fecha)}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            {/* Preferencias de WhatsApp (solo mi perfil) */}
            {isMyProfile && (
              <WhatsAppPreferencesCard 
                perfil={perfil} 
                onUpdate={loadPerfil}
              />
            )}

            {/* Logros */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#151921]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#df2531]" />
                  Logros
                </h3>
                <span className="text-sm text-white/40">{perfil.logros.length}</span>
              </div>

              <div className="space-y-3">
                {perfil.logros.map((logro) => (
                  <div 
                    key={logro.id}
                    className="relative group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-all">
                      <div className="text-2xl">{logro.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{logro.nombre}</p>
                        <p className="text-xs text-white/40">{logro.descripcion}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getNivelColor(logro.nivel)}`} />
                    </div>
                    <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#df2531] to-[#df2531]/50 rounded-full"
                        style={{ width: `${logro.progreso}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Ranking Info */}
            {perfil.ranking.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <MapPinned className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/40">Mejor Ranking</p>
                    <p className="text-white font-semibold">#{perfil.ranking[0].posicion} {perfil.ranking[0].alcance}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Puntos</span>
                    <span className="text-white">{perfil.ranking[0].puntosTotales}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Victorias</span>
                    <span className="text-white">{perfil.ranking[0].victorias}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Torneos</span>
                    <span className="text-white">{perfil.ranking[0].torneosJugados}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Inscripciones Pendientes (solo mi perfil) */}
            {isMyProfile && perfil.privado && perfil.privado.inscripcionesPendientes > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{perfil.privado.inscripcionesPendientes} inscripciones pendientes</p>
                    <p className="text-sm text-white/40">Requieren pago o confirmación</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {isMyProfile && (
        <EditarPerfilModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          perfil={perfil}
          onUpdate={handleUpdatePerfil}
        />
      )}
    </div>
  );
}
