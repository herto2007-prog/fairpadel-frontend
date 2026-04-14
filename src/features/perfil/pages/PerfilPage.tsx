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
import { useNoIndex } from '../../../hooks/useNoIndex';

export function PerfilPage() {
  useNoIndex();
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
            <img src={perfil.bannerUrl} alt="" className="w-full h-full object-cover" width="800" height="300" loading="lazy" />
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
                  <img src={perfil.fotoUrl} alt="" className="w-full h-full object-cover" width="128" height="128" loading="lazy" />
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

        {/* DESTACADO: Primer / Último Torneo */}
        {perfil.destacadoTorneo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            {(() => {
              const dt = perfil.destacadoTorneo!;
              return (
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#df2531]/10 via-[#151921]/80 to-[#151921]/80 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row">
                    {/* Flyer */}
                    <div className="relative w-full md:w-56 lg:w-64 h-40 md:h-auto shrink-0">
                      <img
                        src={dt.flyerUrl || '/placeholder-torneo.jpg'}
                        alt={dt.nombre}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#151921]/90 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#151921]/90" />
                      {dt.esPrimerTorneo ? (
                        <div className="absolute top-0 left-0 px-3 py-1.5 bg-gradient-to-r from-[#df2531] to-pink-600 text-white text-[10px] md:text-xs font-bold rounded-br-xl shadow-lg">
                          MI PRIMER TORNEO
                        </div>
                      ) : (
                        <div className="absolute top-0 left-0 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-[10px] md:text-xs font-medium rounded-br-xl">
                          ÚLTIMO TORNEO
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                        {/* Posición */}
                        <div className="flex items-center gap-4 md:flex-col md:items-center md:justify-center md:w-28 shrink-0">
                          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-bold shrink-0 ${
                            dt.posicionFinal === '1ro' ? 'bg-yellow-500/20 text-yellow-400' :
                            dt.posicionFinal === '2do' ? 'bg-gray-400/20 text-gray-300' :
                            dt.posicionFinal === '3ro' ? 'bg-amber-600/20 text-amber-500' :
                            'bg-white/10 text-white'
                          }`}>
                            {dt.posicionFinal === '1ro' ? '🏆' :
                             dt.posicionFinal === '2do' ? '🥈' :
                             dt.posicionFinal === '3ro' ? '🥉' :
                             dt.posicionFinal}
                          </div>
                          <div className="md:text-center">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Posición</p>
                            <p className="text-white font-semibold">{dt.posicionFinal}</p>
                          </div>
                        </div>

                        {/* Detalles */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold text-white truncate mb-1">
                            {dt.nombre}
                          </h3>
                          <p className="text-sm text-white/60 mb-3">
                            {dt.categoria} • {formatDatePY(dt.fecha)}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-2.5 py-1 bg-[#df2531]/20 text-[#df2531] text-xs font-medium rounded-lg">
                              +{dt.puntosGanados} pts
                            </span>
                            <span className="px-2.5 py-1 bg-white/5 text-white/70 text-xs rounded-lg">
                              {dt.partidosJugados} partidos jugados
                            </span>
                          </div>

                          {/* Pareja */}
                          {dt.pareja && (
                            <div className="flex items-center gap-2 mb-4">
                              {dt.pareja.fotoUrl ? (
                                <img
                                  src={dt.pareja.fotoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#df2531] to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                  {dt.pareja.nombre[0]}{dt.pareja.apellido[0]}
                                </div>
                              )}
                              <span className="text-sm text-white/80">
                                Pareja: <span className="text-white font-medium">{dt.pareja.nombre} {dt.pareja.apellido}</span>
                              </span>
                            </div>
                          )}

                          {/* Barra de fases */}
                          <div className="mt-2">
                            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Fase alcanzada</p>
                            <div className="flex items-center gap-1">
                              {[
                                { key: 'ZONA', label: 'Zona' },
                                { key: 'CUARTOS', label: 'Cuartos' },
                                { key: 'SEMIS', label: 'Semis' },
                                { key: 'FINAL', label: 'Final' },
                              ].map((fase, idx, arr) => {
                                const orden = { ZONA: 1, CUARTOS: 2, SEMIS: 3, FINAL: 4 };
                                const actual = orden[dt.faseMasLejana];
                                const este = orden[fase.key as keyof typeof orden];
                                const activo = este <= actual;
                                const esUltimo = idx === arr.length - 1;
                                return (
                                  <div key={fase.key} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center gap-1 flex-1">
                                      <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold transition-colors ${
                                        activo
                                          ? fase.key === 'FINAL' && dt.posicionFinal === '1ro'
                                            ? 'bg-yellow-500 text-black'
                                            : 'bg-[#df2531] text-white'
                                          : 'bg-white/10 text-white/40'
                                      }`}>
                                        {fase.key === 'ZONA' ? 'Z' : fase.key === 'CUARTOS' ? 'C' : fase.key === 'SEMIS' ? 'S' : 'F'}
                                      </div>
                                      <span className={`text-[9px] md:text-[10px] ${activo ? 'text-white/80' : 'text-white/30'}`}>
                                        {fase.label}
                                      </span>
                                    </div>
                                    {!esUltimo && (
                                      <div className={`h-0.5 flex-1 mx-1 rounded-full ${
                                        este < actual ? 'bg-[#df2531]' : 'bg-white/10'
                                      }`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium truncate">{h.torneo}</p>
                          {idx === 0 && perfil.destacadoTorneo && (
                            <span className="px-1.5 py-0.5 bg-[#df2531]/20 text-[#df2531] text-[10px] font-semibold rounded">
                              DESTACADO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40">{h.categoria}</p>
                      </div>
                      <div className="text-right shrink-0">
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
                    <p className="text-white font-semibold">#{perfil.ranking[0].posicion} {perfil.ranking[0].alcanceNombre || perfil.ranking[0].alcance}</p>
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
