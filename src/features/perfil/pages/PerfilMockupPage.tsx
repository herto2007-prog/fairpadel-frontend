
import { motion } from 'framer-motion';
import { 
  Trophy, MapPin, Calendar, TrendingUp, Award, 
  Share2, Settings, Camera, Edit3, Flame,
  Target, Users, Star, ChevronRight, MapPinned,
  Activity, Crown, Zap, Shield
} from 'lucide-react';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';

// Mock data para visualización
const MOCK_JUGADOR = {
  nombre: 'Carlos',
  apellido: 'Rodríguez',
  username: 'carlos.rodriguez',
  fotoUrl: null,
  bannerUrl: null,
  categoria: { nombre: '5ª Categoría', tipo: 'MASCULINO', color: '#3b82f6' },
  ciudad: 'Asunción',
  pais: 'Paraguay',
  bio: 'Apasionado del pádel. Buscando mejorar cada día. 🎾🔥',
  edad: 28,
  stats: {
    torneosGanados: 12,
    torneosJugados: 45,
    partidosGanados: 89,
    partidosPerdidos: 34,
    puntosTotales: 2450,
    rachaActual: 5,
    mejoresVictorias: 3,
  },
  logros: [
    { id: 1, icon: '🏆', nombre: 'Campeón 5ta', descripcion: '3 torneos ganados', nivel: 'oro', progreso: 100 },
    { id: 2, icon: '🥈', nombre: 'Subcampeón', descripcion: '5 finales jugadas', nivel: 'plata', progreso: 80 },
    { id: 3, icon: '🔥', nombre: 'Racha Perfecta', descripcion: '5 victorias seguidas', nivel: 'bronce', progreso: 60 },
    { id: 4, icon: '🏟️', nombre: 'Veterano', descripcion: '50+ torneos jugados', nivel: 'oro', progreso: 90 },
    { id: 5, icon: '⭐', nombre: 'Ascenso 2025', descripcion: 'Subió de categoría', nivel: 'especial', progreso: 100 },
    { id: 6, icon: '🎯', nombre: 'Precisión', descripcion: '80% de efectividad', nivel: 'plata', progreso: 75 },
  ],
  actividadReciente: [
    { id: 1, tipo: 'torneo', titulo: 'Ganó el Torneo Circuito Metro 2025', fecha: 'Hace 2 días', icon: Trophy, color: 'text-yellow-400' },
    { id: 2, tipo: 'ascenso', titulo: 'Ascendió a 5ª Categoría', fecha: 'Hace 1 semana', icon: TrendingUp, color: 'text-green-400' },
    { id: 3, tipo: 'partido', titulo: 'Victoria vs López/Martínez 6-4, 6-3', fecha: 'Hace 3 días', icon: Target, color: 'text-blue-400' },
    { id: 4, tipo: 'social', titulo: 'Alcanzó 100 seguidores', fecha: 'Hace 2 semanas', icon: Users, color: 'text-purple-400' },
  ],
  graficoData: [
    { mes: 'Ene', puntos: 1800 },
    { mes: 'Feb', puntos: 1950 },
    { mes: 'Mar', puntos: 2100 },
    { mes: 'Abr', puntos: 2050 },
    { mes: 'May', puntos: 2250 },
    { mes: 'Jun', puntos: 2450 },
  ],
  esPremium: true,
  seguidores: 128,
  siguiendo: 45,
};

export function PerfilMockupPage() {
  const jugador = MOCK_JUGADOR;

  const statCards = [
    { label: 'Torneos Ganados', value: jugador.stats.torneosGanados, icon: Trophy, color: 'from-yellow-500/20 to-orange-500/20', iconColor: 'text-yellow-400' },
    { label: 'Partidos Jugados', value: jugador.stats.partidosGanados + jugador.stats.partidosPerdidos, icon: Activity, color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
    { label: 'Puntos Totales', value: jugador.stats.puntosTotales.toLocaleString(), icon: Star, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
    { label: 'Racha Actual', value: jugador.stats.rachaActual, icon: Flame, color: 'from-red-500/20 to-rose-500/20', iconColor: 'text-red-400', suffix: 'victorias' },
  ];

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      {/* HERO SECTION */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 md:h-64 relative overflow-hidden">
          {jugador.bannerUrl ? (
            <img src={jugador.bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#df2531]/30 via-purple-900/20 to-blue-900/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />
          
          {/* Premium Badge */}
          {jugador.esPremium && (
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

        {/* Profile Info */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative -mt-20 mb-6 flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Avatar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-dark bg-[#151921] relative group">
                {jugador.fotoUrl ? (
                  <img src={jugador.fotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#df2531] to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                    {jugador.nombre[0]}{jugador.apellido[0]}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-dark rounded-full" />
            </motion.div>

            {/* Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 pb-2"
            >
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {jugador.nombre} {jugador.apellido}
                </h1>
                <button className="p-2 text-white/40 hover:text-white transition-colors">
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/50 mb-2">@{jugador.username}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" style={{ color: jugador.categoria.color }} />
                  {jugador.categoria.nombre}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {jugador.ciudad}, {jugador.pais}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {jugador.edad} años
                </span>
              </div>

              <p className="mt-3 text-white/70 max-w-xl">{jugador.bio}</p>

              {/* Stats Social */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{jugador.seguidores}</p>
                  <p className="text-xs text-white/40">Seguidores</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{jugador.siguiendo}</p>
                  <p className="text-xs text-white/40">Siguiendo</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{jugador.stats.torneosJugados}</p>
                  <p className="text-xs text-white/40">Torneos</p>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 pb-2"
            >
              <button className="flex items-center gap-2 px-6 py-2.5 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-all">
                <Users className="w-4 h-4" />
                Seguir
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all">
                <Settings className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
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
          {/* Left Column - Gráfico y Stats */}
          <div className="md:col-span-2 space-y-6">
            {/* Performance Chart */}
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
                    Evolución de Puntos
                  </h3>
                  <p className="text-sm text-white/40">Últimos 6 meses</p>
                </div>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  +36%
                </div>
              </div>

              {/* Chart Mock */}
              <div className="h-48 flex items-end gap-4">
                {jugador.graficoData.map((data, idx) => {
                  const height = ((data.puntos - 1500) / 1000) * 100;
                  return (
                    <div key={data.mes} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 10)}%` }}
                        transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
                        className="w-full bg-gradient-to-t from-[#df2531]/50 to-[#df2531]/20 rounded-t-lg relative group"
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0a0b0f] px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {data.puntos} pts
                        </div>
                      </motion.div>
                      <span className="text-xs text-white/40">{data.mes}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Win Rate */}
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
                      <path className="text-green-500" strokeDasharray="72, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">72%</span>
                  </div>
                  <p className="text-sm text-white/60">Victorias</p>
                </div>

                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path className="text-blue-500" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">60%</span>
                  </div>
                  <p className="text-sm text-white/60">Sets Ganados</p>
                </div>

                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path className="text-purple-500" strokeDasharray="45, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">27%</span>
                  </div>
                  <p className="text-sm text-white/60">Torneos Ganados</p>
                </div>
              </div>
            </motion.div>

            {/* Activity Timeline */}
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
                {jugador.actividadReciente.map((actividad, idx) => (
                  <motion.div 
                    key={actividad.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className="flex items-start gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-colors cursor-pointer group"
                  >
                    <div className={`p-2.5 rounded-lg bg-white/5 ${actividad.color}`}>
                      <actividad.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium group-hover:text-[#df2531] transition-colors">
                        {actividad.titulo}
                      </p>
                      <p className="text-sm text-white/40">{actividad.fecha}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Logros */}
          <div className="space-y-6">
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
                <span className="text-sm text-white/40">6 de 24</span>
              </div>

              <div className="space-y-3">
                {jugador.logros.map((logro, idx) => (
                  <motion.div 
                    key={logro.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    className="relative group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-all">
                      <div className="text-2xl">{logro.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{logro.nombre}</p>
                        <p className="text-xs text-white/40">{logro.descripcion}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        logro.nivel === 'oro' ? 'bg-yellow-400' :
                        logro.nivel === 'plata' ? 'bg-gray-300' :
                        logro.nivel === 'bronce' ? 'bg-amber-600' :
                        'bg-purple-400'
                      }`} />
                    </div>
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#df2531] to-[#df2531]/50 rounded-full"
                        style={{ width: `${logro.progreso}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <button className="w-full mt-4 py-2.5 text-sm text-[#df2531] hover:text-[#df2531]/80 font-medium transition-colors">
                Ver todos los logros →
              </button>
            </motion.div>

            {/* Categoría Info */}
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
                  <p className="text-sm text-white/40">Categoría Actual</p>
                  <p className="text-white font-semibold">{jugador.categoria.nombre}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Próximo ascenso</span>
                  <span className="text-white">3ª Categoría</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                </div>
                <p className="text-xs text-white/40">Necesitas 2 campeonatos más</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Edit Button (Mobile) */}
      <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#df2531] rounded-full flex items-center justify-center shadow-lg shadow-[#df2531]/30">
        <Edit3 className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
