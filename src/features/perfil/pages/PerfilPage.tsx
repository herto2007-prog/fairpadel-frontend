import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy, MapPin, Calendar, TrendingUp, Award,
  Share2, Settings, Camera, Edit3, Flame,
  Target, Star, MapPinned,
  Activity, Crown, Zap, Shield, Loader2, ArrowLeft, RefreshCw
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
  const [activeTab, setActiveTab] = useState<'resumen' | 'logros' | 'estadisticas'>('resumen');

  // Pull to refresh (mobile)
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    loadPerfil();
  }, [id]);

  const loadPerfil = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data: PerfilJugador;
      
      if (id) {
        data = await perfilService.getPerfilJugador(id);
        setIsMyProfile(isAuthenticated && currentUser?.id === id);
      } else if (isAuthenticated) {
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
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth >= 768) return;
    const targetEl = e.target as HTMLElement;
    // No iniciar pull-to-refresh si el touch empieza en un elemento interactivo
    if (targetEl.closest('button, a, [role="tab"], input, textarea, select')) return;
    const target = containerRef.current;
    if (target && target.scrollTop <= 0) {
      setPullStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.innerWidth >= 768) return;
    const y = e.touches[0].clientY;
    const dist = Math.max(0, y - pullStartY);
    const target = containerRef.current;
    if (target && target.scrollTop <= 0 && dist > 0) {
      setPullDistance(Math.min(dist * 0.5, 90));
    }
  };

  const onTouchEnd = () => {
    if (!isPulling) return;
    if (pullDistance > 60 && !loading) {
      loadPerfil();
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
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

  if (loading && !isPulling) {
    return (
      <div className="h-screen bg-dark flex items-center justify-center overflow-hidden">
        <BackgroundEffects variant="subtle" showGrid={false} />
        <Loader2 className="w-8 h-8 text-[#df2531] animate-spin" />
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="h-screen bg-dark flex items-center justify-center overflow-hidden">
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

  const TabButton = ({ tab, label }: { tab: typeof activeTab; label: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setActiveTab(tab);
      }}
      className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
        activeTab === tab ? 'text-white' : 'text-white/40'
      }`}
    >
      {label}
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-[#df2531] transition-opacity duration-200 ${
          activeTab === tab ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </button>
  );

  const DestacadoTorneoCard = () => {
    if (!perfil.destacadoTorneo) return null;
    const dt = perfil.destacadoTorneo;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-6 md:mb-8"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#df2531]/10 via-[#151921]/80 to-[#151921]/80 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row">
            {/* Flyer */}
            <div className="relative w-full md:w-56 lg:w-64 h-32 md:h-auto shrink-0">
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
            <div className="flex-1 p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                {/* Posición */}
                <div className="flex md:flex-col md:items-center md:justify-center md:w-28 shrink-0">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-lg md:text-2xl font-bold shrink-0 ${
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
                  <div className="ml-3 md:ml-0 md:mt-1 md:text-center">
                    <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-wider">Posición</p>
                    <p className="text-white font-semibold text-sm md:text-base">{dt.posicionFinal}</p>
                  </div>
                </div>

                {/* Detalles */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-xl font-bold text-white truncate mb-1">
                    {dt.nombre}
                  </h3>
                  <p className="text-xs md:text-sm text-white/60 mb-2 md:mb-3">
                    {dt.categoria} • {formatDatePY(dt.fecha)}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4">
                    <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-[#df2531]/20 text-[#df2531] text-[10px] md:text-xs font-medium rounded-lg">
                      +{dt.puntosGanados} pts
                    </span>
                    <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-white/5 text-white/70 text-[10px] md:text-xs rounded-lg">
                      {dt.partidosJugados} partidos jugados
                    </span>
                  </div>

                  {/* Pareja */}
                  {dt.pareja && (
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                      {dt.pareja.fotoUrl ? (
                        <img
                          src={dt.pareja.fotoUrl}
                          alt=""
                          className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#df2531] to-purple-600 flex items-center justify-center text-[10px] md:text-xs font-bold text-white">
                          {dt.pareja.nombre[0]}{dt.pareja.apellido[0]}
                        </div>
                      )}
                      <span className="text-xs md:text-sm text-white/80">
                        Pareja: <span className="text-white font-medium">{dt.pareja.nombre} {dt.pareja.apellido}</span>
                      </span>
                    </div>
                  )}

                  {/* Barra de fases */}
                  <div className="mt-1 md:mt-2">
                    <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-wider mb-1.5 md:mb-2">Fase alcanzada</p>
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
                              <div className={`w-7 h-7 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold transition-colors ${
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
      </motion.div>
    );
  };

  return (
    <div className="h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overflow-x-hidden relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Pull to refresh indicator (mobile only) */}
        <div 
          className="md:hidden fixed top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
          style={{ 
            transform: `translateY(${Math.max(0, pullDistance - 20)}px)`,
            opacity: pullDistance > 10 ? Math.min((pullDistance - 10) / 40, 1) : 0,
            transition: isPulling ? 'none' : 'all 0.2s ease-out'
          }}
        >
          <div className="mt-2 p-2 bg-[#151921]/90 backdrop-blur-sm rounded-full border border-white/10">
            {pullDistance > 60 || loading ? (
              <Loader2 className="w-5 h-5 text-[#df2531] animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 text-white/60" style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
            )}
          </div>
        </div>

        <div 
          style={{ 
            transform: `translateY(${pullDistance}px)`,
            transition: isPulling ? 'none' : 'transform 0.25s ease-out'
          }}
        >
          {/* HERO SECTION */}
          <div className="relative">
            <div className="h-32 md:h-64 relative overflow-hidden">
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
                  className="absolute top-3 right-3 md:top-4 md:right-4 flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full"
                >
                  <Crown className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                  <span className="text-[10px] md:text-xs font-medium text-yellow-300">Premium</span>
                </motion.div>
              )}
            </div>

            <div className="max-w-6xl mx-auto px-4">
              <div className="relative -mt-12 md:-mt-20 mb-4 md:mb-6 flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <div className="w-24 h-24 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-dark bg-[#151921] relative group">
                    {perfil.fotoUrl ? (
                      <img src={perfil.fotoUrl} alt="" className="w-full h-full object-cover" width="128" height="128" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#df2531] to-purple-600 flex items-center justify-center text-3xl md:text-4xl font-bold text-white">
                        {perfil.nombre[0]}{perfil.apellido[0]}
                      </div>
                    )}
                    {isMyProfile && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 w-4 h-4 md:w-5 md:h-5 bg-green-500 border-[3px] md:border-4 border-dark rounded-full" />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex-1 pb-0 md:pb-2 min-w-0"
                >
                  <div className="flex items-center gap-2 md:gap-3 mb-1">
                    <h1 className="text-2xl md:text-4xl font-bold text-white truncate">
                      {perfil.nombre} {perfil.apellido}
                    </h1>
                    {isMyProfile && (
                      <button className="p-2 text-white/40 hover:text-white transition-colors shrink-0">
                        <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    )}
                  </div>
                  <p className="text-white/50 mb-2 text-sm md:text-base">@{perfil.username}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-white/60">
                    {perfil.categoria && (
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: '#3b82f6' }} />
                        {perfil.categoria.nombre}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      {perfil.ciudad || 'Sin ciudad'}, {perfil.pais}
                    </span>
                    {perfil.edad && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        {perfil.edad} años
                      </span>
                    )}
                  </div>

                  {perfil.bio && (
                    <p className="mt-2 md:mt-3 text-white/70 max-w-xl text-sm md:text-base">{perfil.bio}</p>
                  )}

                  <div className="flex items-center gap-4 md:gap-6 mt-3 md:mt-4">
                    <div className="text-center">
                      <p className="text-lg md:text-xl font-bold text-white">{perfil.seguidores}</p>
                      <p className="text-[10px] md:text-xs text-white/40">Seguidores</p>
                    </div>
                    <div className="w-px h-6 md:h-8 bg-white/10" />
                    <div className="text-center">
                      <p className="text-lg md:text-xl font-bold text-white">{perfil.siguiendo}</p>
                      <p className="text-[10px] md:text-xs text-white/40">Siguiendo</p>
                    </div>
                    <div className="w-px h-6 md:h-8 bg-white/10" />
                    <div className="text-center">
                      <p className="text-lg md:text-xl font-bold text-white">{perfil.stats.torneosJugados}</p>
                      <p className="text-[10px] md:text-xs text-white/40">Torneos</p>
                    </div>
                  </div>
                </motion.div>

                {/* Desktop buttons */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="hidden md:flex items-center gap-2 pb-2"
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
                  <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all min-h-[44px] min-w-[44px]">
                    <Share2 className="w-4 h-4" />
                  </button>
                  {isMyProfile && (
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all min-h-[44px] min-w-[44px]">
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              </div>

              {/* Mobile action buttons - full width */}
              <div className="flex md:hidden flex-col w-full gap-2 mb-4">
                {!isMyProfile ? (
                  <div className="w-full">
                    <SeguirButton
                      usuarioId={perfil.id}
                      initialSeguidoresCount={perfil.seguidores}
                      onSeguimientoChange={(_siguiendo, count) => {
                        setPerfil((prev) => (prev ? { ...prev, seguidores: count } : null));
                      }}
                    />
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all min-h-[48px]"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar Perfil
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all min-h-[48px]">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Compartir</span>
                  </button>
                  {isMyProfile && (
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all min-h-[48px]">
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Ajustes</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8"
            >
              {statCards.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className={`relative p-3 md:p-5 rounded-2xl bg-gradient-to-br ${stat.color} border border-white/5 backdrop-blur-sm group hover:border-white/10 transition-all cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className={`p-2 md:p-2.5 rounded-xl bg-white/5 ${stat.iconColor}`}>
                      <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/20" />
                  </div>
                  <p className="text-xl md:text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-xs md:text-sm text-white/50">{stat.label}</p>
                  {stat.suffix && <p className="text-[10px] md:text-xs text-white/30 mt-1">{stat.suffix}</p>}
                </motion.div>
              ))}
            </motion.div>

            {/* Mobile tabs */}
            <div className="md:hidden sticky top-0 z-40 bg-dark/95 backdrop-blur-md border-b border-white/10 mb-4 -mx-4 px-4">
              <div className="flex">
                <TabButton tab="resumen" label="Resumen" />
                <TabButton tab="logros" label="Logros" />
                <TabButton tab="estadisticas" label="Estadísticas" />
              </div>
            </div>

            {/* DESTACADO: Primer / Último Torneo (desktop only) */}
            <div className="hidden md:block">
              <DestacadoTorneoCard />
            </div>

            {/* Mobile conditional content */}
            <div className="md:hidden space-y-4">
              {activeTab === 'resumen' && (
                <>
                  <DestacadoTorneoCard />

                  {/* Actividad Reciente */}
                  {perfil.actividadReciente.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#151921]/50 border border-white/5 rounded-2xl p-4 backdrop-blur-sm"
                    >
                      <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#df2531]" />
                        Actividad Reciente
                      </h3>
                      <div className="space-y-3">
                        {perfil.actividadReciente.map((actividad) => {
                          const Icon = getTipoIcono(actividad.tipo);
                          return (
                            <div 
                              key={actividad.id}
                              className="flex items-start gap-3 p-2.5 bg-white/5 rounded-xl"
                            >
                              <div className={`p-2 rounded-lg bg-white/5 ${getTipoColor(actividad.tipo)}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">{actividad.titulo}</p>
                                <p className="text-xs text-white/40 truncate">{actividad.detalle}</p>
                              </div>
                              <p className="text-[10px] text-white/30 shrink-0">{formatDatePY(actividad.fecha)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {activeTab === 'logros' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#151921]/50 border border-white/5 rounded-2xl p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#df2531]" />
                      Logros
                    </h3>
                    <span className="text-xs text-white/40">{perfil.logros.length}</span>
                  </div>
                  <div className="space-y-3">
                    {perfil.logros.map((logro) => (
                      <div key={logro.id} className="relative group cursor-pointer">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-all">
                          <div className="text-xl">{logro.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate text-sm">{logro.nombre}</p>
                            <p className="text-[10px] text-white/40">{logro.descripcion}</p>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${getNivelColor(logro.nivel)}`} />
                        </div>
                        <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#df2531] to-[#df2531]/50 rounded-full" style={{ width: `${logro.progreso}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'estadisticas' && (
                <>
                  {/* Efectividad compacta */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#151921]/50 border border-white/5 rounded-2xl p-4 backdrop-blur-sm"
                  >
                    <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#df2531]" />
                      Efectividad
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-white/5 rounded-xl">
                        <p className="text-2xl font-bold text-green-400 mb-1">{perfil.partidos.efectividad}%</p>
                        <p className="text-[10px] text-white/60">Victorias</p>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-xl">
                        <p className="text-2xl font-bold text-white mb-1">{perfil.partidos.ganados}</p>
                        <p className="text-[10px] text-white/60">Ganados</p>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-xl">
                        <p className="text-2xl font-bold text-white mb-1">{perfil.partidos.perdidos}</p>
                        <p className="text-[10px] text-white/60">Perdidos</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Historial de Puntos */}
                  {perfil.historialPuntos.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#151921]/50 border border-white/5 rounded-2xl p-4 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#df2531]" />
                          Historial de Puntos
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {perfil.historialPuntos.slice(0, 6).map((h, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                              h.posicion === '1ro' ? 'bg-yellow-500/20 text-yellow-400' :
                              h.posicion === '2do' ? 'bg-gray-500/20 text-gray-400' :
                              h.posicion === '3ro' ? 'bg-amber-600/20 text-amber-500' :
                              'bg-white/10 text-white'
                            }`}>
                              {h.posicion === '1ro' ? '🏆' : h.posicion === '2do' ? '🥈' : h.posicion === '3ro' ? '🥉' : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-white font-medium text-sm truncate">{h.torneo}</p>
                                {idx === 0 && perfil.destacadoTorneo && (
                                  <span className="px-1 py-0.5 bg-[#df2531]/20 text-[#df2531] text-[9px] font-semibold rounded">
                                    DESTACADO
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-white/40">{h.categoria}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[#df2531] font-bold text-sm">+{h.puntos} pts</p>
                              <p className="text-[10px] text-white/40">{formatDatePY(h.fecha)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Ranking Info */}
                  {perfil.ranking.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/5 rounded-2xl p-4 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <MapPinned className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-white/40">Mejor Ranking</p>
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
                          <span className="text-white">{perfil.partidos.ganados}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Torneos</span>
                          <span className="text-white">{perfil.ranking[0].torneosJugados}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* WhatsApp Preferences (solo mi perfil, mobile) */}
                  {isMyProfile && (
                    <WhatsAppPreferencesCard 
                      perfil={perfil} 
                      onUpdate={loadPerfil}
                    />
                  )}

                  {isMyProfile && perfil.privado && perfil.privado.inscripcionesPendientes > 0 && (
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                          <Activity className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{perfil.privado.inscripcionesPendientes} inscripciones pendientes</p>
                          <p className="text-xs text-white/40">Requieren pago o confirmación</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Desktop layout (md+) - unchanged structure */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
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
                        <span className="text-white">{perfil.partidos.ganados}</span>
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
      </div>
    </div>
  );
}
