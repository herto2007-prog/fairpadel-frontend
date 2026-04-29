import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, TrendingUp, Calendar, MapPin, 
  ChevronRight, Bell, Zap, Users, Target, Crown,
  Star, Medal, Swords,
  ChevronUp, Sparkles, Activity, Check, Trash2,
  Info, MessageSquare, Trophy as TrophyIcon,
  UserPlus, Gamepad2, CreditCard
} from 'lucide-react';
import { CrearAmericanoModal } from '../features/americano/components/CrearAmericanoModal';
import { CompartirAmericanoModal } from '../features/americano/components/CompartirAmericanoModal';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { perfilService, PerfilJugador } from '../features/perfil/perfilService';
import { torneoService } from '../services/torneoService';
import { notificationService, Notificacion, TipoNotificacion } from '../services/notificationService';
import { formatDatePY } from '../utils/date';
import { useNoIndex } from '../hooks/useNoIndex';


// ═══════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════

interface TorneoConUrgencia {
  id: string;
  nombre: string;
  slug: string;
  flyerUrl?: string;
  fechaInicio: string;
  ciudad: string;
  costoInscripcion: number;
  sedeNombre: string;
  inscripcionesAbiertas?: boolean;
  totalInscritos?: number;
}

// Notificacion viene del servicio (notificationService.ts)

// ═══════════════════════════════════════════════════════
// COMPONENTE: Header Personalizado
// ═══════════════════════════════════════════════════════

function DashboardHeader({ 
  perfil, 
  notificacionesNoLeidas 
}: { 
  perfil: PerfilJugador | null;
  notificacionesNoLeidas: number;
}) {
  const navigate = useNavigate();
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  
  if (!perfil) return null;

  const statsRapidos = [
    { 
      label: 'Racha', 
      valor: `×${perfil.partidos?.rachaActual || 0}`, 
      icono: Flame, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      destacado: (perfil.partidos?.rachaActual || 0) >= 3
    },
    { 
      label: 'Victorias', 
      valor: `${perfil.partidos?.efectividad || 0}%`, 
      icono: Target, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      destacado: (perfil.partidos?.efectividad || 0) >= 60
    },
    { 
      label: 'Torneos', 
      valor: perfil.stats?.torneosJugados || 0, 
      icono: Trophy, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      destacado: (perfil.stats?.torneosJugados || 0) >= 5
    },
    { 
      label: 'Ranking', 
      valor: perfil.ranking?.[0]?.posicion ? `#${perfil.ranking[0].posicion}` : '-', 
      icono: Crown, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      destacado: perfil.ranking?.[0]?.posicion && perfil.ranking[0].posicion <= 10
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl bg-gradient-to-br from-[#1a1f2e] to-[#151921] border border-[#2a3042] p-6 mb-6"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#df2531]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Saludo y nivel */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/perfil')}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#df2531] to-[#ff6b6b] p-0.5 cursor-pointer"
              >
                <div className="w-full h-full rounded-full bg-[#1a1f2e] flex items-center justify-center overflow-hidden">
                  {perfil.fotoUrl ? (
                    <img src={perfil.fotoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {perfil.nombre[0]}{perfil.apellido[0]}
                    </span>
                  )}
                </div>
              </motion.div>
              {(perfil.partidos?.rachaActual || 0) >= 3 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                >
                  <Flame size={12} className="text-white" />
                </motion.div>
              )}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-white">
                ¡Hola, {perfil.nombre}! 👋
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-400">Nivel:</span>
                <span className="px-2 py-0.5 bg-[#df2531]/20 text-[#df2531] rounded-full text-sm font-medium">
                  {perfil.categoria?.nombre || 'Sin categoría'}
                </span>
                {perfil.esPremium && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star size={12} /> Premium
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="flex items-center gap-3 flex-wrap">
            {statsRapidos.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/perfil')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                  stat.destacado 
                    ? `${stat.bgColor} border border-${stat.color.replace('text-', '')}/30` 
                    : 'bg-[#232838] hover:bg-[#2a3042]'
                }`}
              >
                <stat.icono size={16} className={stat.color} />
                <div className="flex flex-col">
                  <span className={`text-lg font-bold leading-none ${stat.color}`}>
                    {stat.valor}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {/* Notificaciones */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotificacionesAbiertas(!notificacionesAbiertas)}
                className="relative p-3 bg-[#232838] hover:bg-[#2a3042] rounded-xl transition-colors"
              >
                <Bell size={20} className="text-gray-400" />
                {notificacionesNoLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#df2531] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
                  </span>
                )}
              </motion.button>
              
              <AnimatePresence>
                {notificacionesAbiertas && (
                  <NotificacionesDropdown 
                    onClose={() => setNotificacionesAbiertas(false)}
                    onNotificacionesLeidas={() => window.location.reload()}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Progreso eliminado: el reglamento no usa puntos para ascenso */}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENTE: Notificaciones Dropdown
// ═══════════════════════════════════════════════════════

const iconosPorTipo: Record<TipoNotificacion, React.ReactNode> = {
  SISTEMA: <Info size={16} />,
  TORNEO: <TrophyIcon size={16} />,
  INSCRIPCION: <UserPlus size={16} />,
  PARTIDO: <Gamepad2 size={16} />,
  RANKING: <TrendingUp size={16} />,
  SOCIAL: <Users size={16} />,
  PAGO: <CreditCard size={16} />,
  MENSAJE: <MessageSquare size={16} />,
};

const coloresPorTipo: Record<TipoNotificacion, string> = {
  SISTEMA: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  TORNEO: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  INSCRIPCION: 'text-green-500 bg-green-500/10 border-green-500/20',
  PARTIDO: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  RANKING: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
  SOCIAL: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  PAGO: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  MENSAJE: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
};

function NotificacionesDropdown({ 
  onClose, 
  onNotificacionesLeidas 
}: { 
  onClose: () => void;
  onNotificacionesLeidas: () => void;
}) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotificaciones(1, 20, false);
      setNotificaciones(data);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await notificationService.marcarTodasComoLeidas();
      await cargarNotificaciones();
      onNotificacionesLeidas();
    } catch (error) {
      console.error('Error marcando notificaciones:', error);
    }
  };

  const eliminarNotificacion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.eliminarNotificacion(id);
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const handleClickNotificacion = async (notif: Notificacion) => {
    if (!notif.leida) {
      try {
        await notificationService.marcarComoLeida(notif.id);
      } catch (error) {
        console.error('Error marcando como leída:', error);
      }
    }
    if (notif.enlace) {
      navigate(notif.enlace);
    }
    onClose();
    onNotificacionesLeidas();
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-96 bg-[#1a1f2e] border border-[#2a3042] rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 border-b border-[#2a3042] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Notificaciones</span>
          {noLeidas > 0 && (
            <span className="px-2 py-0.5 bg-[#df2531] text-white text-xs rounded-full">
              {noLeidas}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {noLeidas > 0 && (
            <button 
              onClick={marcarTodasLeidas}
              className="text-xs text-[#df2531] hover:text-[#ff6b6b] flex items-center gap-1 transition-colors"
            >
              <Check size={12} />
              Marcar leídas
            </button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xs">
            Cerrar
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-[#df2531]/20 border-t-[#df2531] rounded-full mx-auto mb-2"
            />
            Cargando...
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No tienes notificaciones</p>
            <p className="text-gray-600 text-xs mt-1">
              Las notificaciones aparecerán cuando haya actividad en tus torneos
            </p>
          </div>
        ) : (
          notificaciones.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => handleClickNotificacion(notif)}
              className={`p-3 border-b border-[#2a3042] last:border-0 hover:bg-[#232838] transition-colors cursor-pointer group ${
                !notif.leida ? 'bg-[#df2531]/5' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${coloresPorTipo[notif.tipo]}`}>
                  {iconosPorTipo[notif.tipo]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm truncate ${!notif.leida ? 'font-semibold text-white' : 'text-gray-300'}`}>
                      {notif.titulo || 'Notificación'}
                    </p>
                    <span className="text-[10px] text-gray-500 flex-shrink-0">
                      {formatearFecha(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                    {notif.contenido}
                  </p>
                  {notif.enlace && (
                    <span className="inline-block mt-1.5 text-xs text-[#df2531]">
                      Ver más →
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => eliminarNotificacion(notif.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      {notificaciones.length > 0 && (
        <div className="p-2 border-t border-[#2a3042] bg-[#151921]">
          <Link
            to="/notificaciones"
            onClick={onClose}
            className="block w-full py-2 text-center text-xs text-gray-400 hover:text-white hover:bg-[#232838] rounded-lg transition-colors"
          >
            Ver todas las notificaciones
          </Link>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENTE: Carta de Urgencia (FOMO máximo)
// ═══════════════════════════════════════════════════════

function UrgencyCard({ torneo }: { torneo: TorneoConUrgencia }) {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#df2531] to-[#b91c24] p-6 text-white shadow-lg shadow-[#df2531]/20"
    >
      {/* Efectos de fondo */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        {/* Badge de urgencia */}
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
          >
            <Flame size={14} className="text-yellow-300" />
            ¡Últimos cupos!
          </motion.div>
          <span className="text-white/80 text-sm">
            Inscripciones abiertas
          </span>
        </div>

        <h3 className="text-xl font-bold mb-2">{torneo.nombre}</h3>
        <p className="text-white/80 text-sm mb-4 flex items-center gap-2">
          <MapPin size={14} />
          {torneo.sedeNombre}, {torneo.ciudad}
        </p>

        {/* Info de inscritos */}
        {torneo.totalInscritos !== undefined && (
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-yellow-300" />
              <span>{torneo.totalInscritos} inscriptos</span>
            </div>
          </div>
        )}

        {/* CTA Urgente */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/t/${torneo.slug}`)}
          className="w-full py-3 bg-white text-[#df2531] font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <Zap size={18} />
          ¡Inscribirme Ahora!
        </motion.button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENTE: Feed Social (FOMO + Ego)
// ═══════════════════════════════════════════════════════

function SocialFeed({ actividad }: { actividad: PerfilJugador['actividadReciente'] | undefined }) {
  const actividadesConIcono = [
    { tipo: 'torneo_ganado', icono: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { tipo: 'ascenso', icono: ChevronUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    { tipo: 'inscripcion', icono: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { tipo: 'partido', icono: Swords, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { tipo: 'racha', icono: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { tipo: 'logro', icono: Medal, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  ];

  const getIconoPorTipo = (tipo: string) => {
    return actividadesConIcono.find(a => tipo.includes(a.tipo)) || actividadesConIcono[3];
  };

  // TODO: Obtener actividades reales de otros jugadores desde la API
  // Por ahora no mostramos datos mock a usuarios reales
  const actividadesFOMO: any[] = [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151921] border border-[#232838] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Activity size={18} className="text-[#df2531]" />
          ¿Te están pasando? 👀
        </h3>
        <span className="text-xs text-gray-500">Actividad reciente</span>
      </div>

      <div className="space-y-3">
        {/* Actividades del usuario */}
        {actividad?.slice(0, 3).map((item, index) => {
          const config = getIconoPorTipo(item.tipo);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1f2e] hover:bg-[#232838] transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                <config.icono size={18} className={config.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.titulo}</p>
                <p className="text-xs text-gray-500">{item.detalle}</p>
              </div>
              <span className="text-xs text-gray-600 flex-shrink-0">{item.fecha}</span>
            </motion.div>
          );
        })}

        {/* Divider - solo si hay actividades FOMO */}
        {actividadesFOMO.length > 0 && (
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#232838]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[#151921] text-xs text-gray-500">En tu red</span>
            </div>
          </div>
        )}

        {/* Actividades FOMO de otros jugadores */}
        {actividadesFOMO.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (actividad?.length || 0) * 0.1 + index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#df2531]/5 to-transparent border border-[#df2531]/10 hover:border-[#df2531]/30 transition-colors cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
              <item.icono size={18} className={item.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.titulo}</p>
              <p className="text-xs text-gray-500">{item.fecha}</p>
            </div>
            <span className="text-xs text-[#df2531] flex-shrink-0">🔥 Trending</span>
          </motion.div>
        ))}

        {/* Mensaje cuando no hay actividad */}
        {(!actividad || actividad.length === 0) && actividadesFOMO.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aún no hay actividad en tu red</p>
            <p className="text-xs mt-1">¡Participa en torneos para ver actualizaciones!</p>
          </div>
        )}
      </div>

      {/* Link solo si hay actividad */}
      {((actividad && actividad.length > 0) || actividadesFOMO.length > 0) && (
        <Link 
          to="/rankings"
          className="block w-full mt-4 py-2 text-center text-sm text-gray-400 hover:text-white hover:bg-[#232838] rounded-lg transition-colors"
        >
          Ver toda la actividad →
        </Link>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENTE: Mis Logros Destacados
// ═══════════════════════════════════════════════════════

function LogrosDestacados({ logros }: { logros: PerfilJugador['logros'] | undefined }) {
  const logrosDestacados = logros?.filter(l => l.nivel === 'oro' || l.progreso >= 80).slice(0, 3) || [];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151921] border border-[#232838] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Medal size={18} className="text-yellow-500" />
          Tus Logros
        </h3>
        <Link to="/perfil" className="text-xs text-[#df2531] hover:underline">
          Ver todos
        </Link>
      </div>

      {logrosDestacados.length > 0 ? (
        <div className="space-y-3">
          {logrosDestacados.map((logro, index) => (
            <motion.div
              key={logro.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1f2e]"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                logro.nivel === 'oro' ? 'bg-yellow-500/20' :
                logro.nivel === 'plata' ? 'bg-gray-400/20' :
                'bg-amber-600/20'
              }`}>
                {logro.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{logro.nombre}</p>
                <p className="text-xs text-gray-500">{logro.descripcion}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-medium ${
                  logro.nivel === 'oro' ? 'text-yellow-500' :
                  logro.nivel === 'plata' ? 'text-gray-400' :
                  'text-amber-600'
                }`}>
                  {logro.nivel.toUpperCase()}
                </span>
                <div className="w-16 h-1 bg-[#232838] rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-[#df2531] rounded-full"
                    style={{ width: `${logro.progreso}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <Sparkles size={32} className="text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Participa en torneos para ganar logros</p>
        </div>
      )}

      <Link
        to="/torneos"
        className="block w-full mt-4 py-2.5 bg-[#232838] hover:bg-[#2a3042] text-white text-sm font-medium rounded-xl transition-colors text-center"
      >
        Buscar torneos para competir
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENTE: Próximos Torneos Recomendados
// ═══════════════════════════════════════════════════════

function TorneosRecomendados({ torneos }: { torneos: TorneoConUrgencia[] }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151921] border border-[#232838] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Target size={18} className="text-[#df2531]" />
          Recomendados para ti
        </h3>
        <Link to="/torneos" className="text-xs text-[#df2531] hover:underline">
          Ver todos
        </Link>
      </div>

      <div className="space-y-3">
        {torneos.slice(0, 3).map((torneo, index) => (
          <motion.div
            key={torneo.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(`/t/${torneo.slug}`)}
            className="flex gap-3 p-3 rounded-xl bg-[#1a1f2e] hover:bg-[#232838] transition-colors cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-lg bg-[#232838] overflow-hidden flex-shrink-0">
              {torneo.flyerUrl ? (
                <img src={torneo.flyerUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Trophy size={20} className="text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white truncate group-hover:text-[#df2531] transition-colors">
                {torneo.nombre}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Calendar size={12} />
                <span>{formatDatePY(torneo.fechaInicio)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <MapPin size={12} />
                <span className="truncate">{torneo.sedeNombre}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[#df2531] font-medium">
                  ${torneo.costoInscripcion}
                </span>
                {torneo.inscripcionesAbiertas && (
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">
                    Abierto
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════

export default function HomeDashboardPage() {
  useNoIndex();
  useAuth(); // Verifica autenticación
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilJugador | null>(null);
  const [torneos, setTorneos] = useState<TorneoConUrgencia[]>([]);
  const [mostrarCrearAmericano, setMostrarCrearAmericano] = useState(false);
  const [torneoCreado, setTorneoCreado] = useState<{ id: string; nombre: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener perfil del usuario (incluye stats, logros, actividad)
      const perfilData = await perfilService.getMiPerfil();
      setPerfil(perfilData);

      // Obtener torneos públicos
      const torneosData = await torneoService.getPublicTorneos({
        estado: 'ABIERTO',
        page: 1,
        limit: 10
      });

      // Procesar torneos
      const torneosProcesados: TorneoConUrgencia[] = torneosData.torneos
        .filter((t: any) => t.inscripcionesAbiertas) // Solo torneos con inscripciones abiertas
        .map((t: any) => ({
          id: t.id,
          nombre: t.nombre,
          slug: t.slug,
          flyerUrl: t.flyerUrl,
          fechaInicio: t.fechaInicio,
          ciudad: t.ciudad,
          costoInscripcion: t.costoInscripcion,
          sedeNombre: t.sedePrincipal?.nombre || t.ciudad,
          inscripcionesAbiertas: t.inscripcionesAbiertas,
          totalInscritos: t.totalInscritos || 0
        }));

      setTorneos(torneosProcesados);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      // Error silencioso - el usuario verá el estado vacío
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  const torneoDestacado = torneos[0]; // Primer torneo como destacado
  const torneosRecomendados = torneos.slice(1); // Resto de torneos

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Personalizado */}
        <DashboardHeader 
          perfil={perfil} 
          notificacionesNoLeidas={perfil?.privado?.notificacionesNoLeidas || 0}
        />

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Urgencia + Actividad */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carta de urgencia (si hay torneos urgentes) */}
            {torneoDestacado && (
              <UrgencyCard torneo={torneoDestacado} />
            )}

            {/* Grid: Social Feed + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SocialFeed actividad={perfil?.actividadReciente} />
              <LogrosDestacados logros={perfil?.logros} />
            </div>

            {/* Sección de torneos recomendados (versión horizontal) */}
            <TorneosRecomendados torneos={torneosRecomendados} />
          </div>

          {/* Columna derecha - Stats detallados y acciones */}
          <div className="space-y-6">
            {/* Stats de ranking */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#151921] border border-[#232838] rounded-2xl p-5"
            >
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-500" />
                Tu Posición
              </h3>
              
              {perfil?.ranking?.[0] ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#1a1f2e]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#df2531]/20 flex items-center justify-center">
                        <Crown size={20} className="text-[#df2531]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Ranking General</p>
                        <p className="text-xs text-gray-500">{perfil.ranking[0].tipo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">#{perfil.ranking[0].posicion}</p>
                      <p className="text-xs text-gray-500">{perfil.ranking[0].puntosTotales} pts</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-[#1a1f2e] text-center">
                      <p className="text-lg font-bold text-white">{perfil.ranking[0].victorias}</p>
                      <p className="text-xs text-gray-500">Victorias</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#1a1f2e] text-center">
                      <p className="text-lg font-bold text-white">{perfil.ranking[0].torneosJugados}</p>
                      <p className="text-xs text-gray-500">Torneos</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">Participa en tu primer torneo para aparecer en el ranking</p>
                  <Link 
                    to="/torneos"
                    className="inline-block mt-3 px-4 py-2 bg-[#df2531] text-white text-sm rounded-lg hover:bg-[#b91c24] transition-colors"
                  >
                    Ver torneos disponibles
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Card destacada: Crear Americano */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Torneo Americano</h3>
                  <p className="text-white/50 text-xs">Crea y comparte con amigos · Gratis</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarCrearAmericano(true)}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Crear torneo americano
              </button>
            </motion.div>

            {/* Acceso rápido a acciones */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#151921] border border-[#232838] rounded-2xl p-5"
            >
              <h3 className="font-bold text-white mb-4">Accesos Rápidos</h3>
              <div className="space-y-2">
                {[
                  { icono: Trophy, label: 'Buscar Torneos', link: '/torneos', color: 'text-[#df2531]' },
                  { icono: Sparkles, label: 'Torneos Americanos', link: '/americano', color: 'text-yellow-400' },
                  { icono: Calendar, label: 'Mis Reservas', link: '/mis-reservas', color: 'text-blue-500' },
                  { icono: Users, label: 'Ver Rankings', link: '/rankings', color: 'text-purple-500' },
                  { icono: MapPin, label: 'Buscar Sedes', link: '/sedes', color: 'text-green-500' },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.link}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1f2e] hover:bg-[#232838] transition-colors group"
                  >
                    <item.icono size={18} className={item.color} />
                    <span className="text-sm text-gray-300 group-hover:text-white flex-1">
                      {item.label}
                    </span>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* CTA a perfil completo - solo si falta información */}
            {perfil && (!perfil.fotoUrl || !perfil.bio || !perfil.ciudad || !perfil.telefono || !perfil.instagram || !perfil.facebook || !perfil.bannerUrl) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-[#232838] to-[#1a1f2e] border border-[#2a3042] rounded-2xl p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#df2531]/20 flex items-center justify-center">
                    <User size={24} className="text-[#df2531]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">Completa tu perfil</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Agrega foto, bio y redes sociales</p>
                  </div>
                </div>
                <Link
                  to="/perfil"
                  className="block w-full mt-4 py-2.5 bg-[#df2531] hover:bg-[#b91c24] text-white text-sm font-medium rounded-xl transition-colors text-center"
                >
                  Editar Perfil
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modales Americano */}
      <AnimatePresence>
        {mostrarCrearAmericano && (
          <CrearAmericanoModal
            onClose={() => setMostrarCrearAmericano(false)}
            onCreated={(torneo) => {
              setMostrarCrearAmericano(false);
              setTorneoCreado(torneo);
            }}
          />
        )}
        {torneoCreado && (
          <CompartirAmericanoModal
            torneoId={torneoCreado.id}
            torneoNombre={torneoCreado.nombre}
            onClose={() => setTorneoCreado(null)}
            onGoToTournament={() => navigate(`/americano/${torneoCreado.id}`)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Icono User importado al final para evitar conflicto con lucide-react
import { User } from 'lucide-react';
