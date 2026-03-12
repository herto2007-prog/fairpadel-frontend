import { motion } from 'framer-motion';
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Swords,
  Award,
  ChevronRight,
  PlayCircle,
} from 'lucide-react';

// Datos estáticos de ejemplo para mostrar el flujo completo
const TORNEO_DEMO = {
  nombre: 'Torneo Demo - Copa Primavera 2025',
  ciudad: 'Asunción',
  sede: 'FairPadel Central',
  fechas: {
    inicio: '2025-04-10',
    fin: '2025-04-13',
  },
  estado: 'SORTEO_REALIZADO',
  precio: 150000,
};

const STATS_DEMO = {
  totalInscripciones: 84,
  confirmadas: 72,
  pendientesPago: 8,
  pendientesConfirmacion: 4,
  ingresos: 10800000,
  categorias: 6,
};

const CATEGORIAS_DEMO = [
  { nombre: '3ra Damas', genero: 'FEMENINO', parejas: 14, estado: 'SORTEADA', bracket: '16' },
  { nombre: '4ta Damas', genero: 'FEMENINO', parejas: 12, estado: 'SORTEADA', bracket: '8' },
  { nombre: '5ta Damas', genero: 'FEMENINO', parejas: 8, estado: 'SORTEADA', bracket: '8' },
  { nombre: '3ra Caballeros', genero: 'MASCULINO', parejas: 16, estado: 'SORTEADA', bracket: '16' },
  { nombre: '4ta Caballeros', genero: 'MASCULINO', parejas: 14, estado: 'SORTEADA', bracket: '16' },
  { nombre: '5ta Caballeros', genero: 'MASCULINO', parejas: 10, estado: 'SORTEADA', bracket: '8' },
];

const PROGRAMACION_DEMO = {
  dias: [
    { fecha: 'Jueves 10/04', horasOcupadas: 24, horasDisponibles: 24, partidos: 16 },
    { fecha: 'Viernes 11/04', horasOcupadas: 20, horasDisponibles: 24, partidos: 14 },
    { fecha: 'Sábado 12/04', horasOcupadas: 36, horasDisponibles: 36, partidos: 24 },
    { fecha: 'Domingo 13/04', horasOcupadas: 28, horasDisponibles: 32, partidos: 18 },
  ],
  totalPartidos: 72,
  horasTotales: 108,
  promedioPartidosPorDia: 18,
};

const TIMELINE_DEMO = [
  {
    fase: 'Inscripciones Abiertas',
    estado: 'COMPLETADO',
    fecha: '01/03 - 05/04',
    descripcion: '84 inscripciones recibidas en 6 categorías',
    icon: Users,
  },
  {
    fase: 'Cierre y Sorteo',
    estado: 'COMPLETADO',
    fecha: '05/04',
    descripcion: 'Todas las categorías sorteadas con sistema paraguayo',
    icon: Swords,
  },
  {
    fase: 'Programación',
    estado: 'EN_PROGRESO',
    fecha: 'En curso',
    descripcion: '72 partidos distribuidos en 4 días',
    icon: Calendar,
  },
  {
    fase: 'Fase de Zona',
    estado: 'PENDIENTE',
    fecha: '10/04 - 11/04',
    descripcion: 'Partidos de zona en todas las categorías',
    icon: PlayCircle,
  },
  {
    fase: 'Bracket Eliminatorio',
    estado: 'PENDIENTE',
    fecha: '12/04 - 13/04',
    descripcion: 'Octavos, cuartos, semis y finales',
    icon: Trophy,
  },
  {
    fase: 'Finalización',
    estado: 'PENDIENTE',
    fecha: '13/04',
    descripcion: 'Entrega de premios y cierre',
    icon: Award,
  },
];

const BRACKET_PREVIEW_DEMO = {
  '3ra Caballeros': {
    parejas: 16,
    estructura: [
      { fase: 'Zona', partidos: 8, estado: 'PENDIENTE' },
      { fase: 'Octavos', partidos: 8, estado: 'PENDIENTE' },
      { fase: 'Cuartos', partidos: 4, estado: 'PENDIENTE' },
      { fase: 'Semis', partidos: 2, estado: 'PENDIENTE' },
      { fase: 'Final', partidos: 1, estado: 'PENDIENTE' },
    ],
  },
  '3ra Damas': {
    parejas: 14,
    estructura: [
      { fase: 'Zona', partidos: 7, estado: 'PENDIENTE' },
      { fase: 'Ronda Ajuste', partidos: 2, estado: 'PENDIENTE' },
      { fase: 'Octavos', partidos: 8, estado: 'PENDIENTE' },
      { fase: 'Cuartos', partidos: 4, estado: 'PENDIENTE' },
      { fase: 'Semis', partidos: 2, estado: 'PENDIENTE' },
      { fase: 'Final', partidos: 1, estado: 'PENDIENTE' },
    ],
  },
};

export function VistaDemo() {
  return (
    <div className="space-y-6">
      {/* Banner de Estado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#df2531]/20 to-[#df2531]/5 border border-[#df2531]/30 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#df2531]/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-[#df2531]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{TORNEO_DEMO.nombre}</h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {TORNEO_DEMO.sede}, {TORNEO_DEMO.ciudad}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {TORNEO_DEMO.fechas.inicio} al {TORNEO_DEMO.fechas.fin}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Sorteo Realizado
            </span>
            <p className="text-gray-400 text-sm mt-2">
              {STATS_DEMO.categorias} categorías listas
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Inscripciones"
          value={STATS_DEMO.totalInscripciones}
          sublabel="parejas"
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Confirmadas"
          value={STATS_DEMO.confirmadas}
          sublabel={`${Math.round((STATS_DEMO.confirmadas / STATS_DEMO.totalInscripciones) * 100)}%`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Pendientes"
          value={STATS_DEMO.pendientesPago + STATS_DEMO.pendientesConfirmacion}
          sublabel="pago/confirmación"
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          label="Ingresos"
          value={`Gs. ${(STATS_DEMO.ingresos / 1000000).toFixed(1)}M`}
          sublabel="confirmados"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Timeline del Flujo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#df2531]" />
          Timeline del Torneo
        </h3>
        <div className="space-y-4">
          {TIMELINE_DEMO.map((item, index) => (
            <TimelineItem key={index} item={item} isLast={index === TIMELINE_DEMO.length - 1} />
          ))}
        </div>
      </motion.div>

      {/* Categorías y su estado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Swords className="w-5 h-5 text-[#df2531]" />
          Categorías Sorteadas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIAS_DEMO.map((cat) => (
            <CategoriaCard key={cat.nombre} categoria={cat} />
          ))}
        </div>
      </motion.div>

      {/* Preview de Programación */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#df2531]" />
          Programación Preview
        </h3>
        
        {/* Stats de programación */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{PROGRAMACION_DEMO.totalPartidos}</p>
            <p className="text-xs text-gray-400">Partidos totales</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{PROGRAMACION_DEMO.horasTotales}h</p>
            <p className="text-xs text-gray-400">Horas de juego</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{PROGRAMACION_DEMO.promedioPartidosPorDia}</p>
            <p className="text-xs text-gray-400">Partidos/día</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">85%</p>
            <p className="text-xs text-gray-400">Capacidad usada</p>
          </div>
        </div>

        {/* Distribución por día */}
        <div className="space-y-3">
          {PROGRAMACION_DEMO.dias.map((dia, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <span className="text-sm text-gray-400 w-32">{dia.fecha}</span>
              <div className="flex-1 bg-white/5 rounded-full h-8 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(dia.horasOcupadas / dia.horasDisponibles) * 100}%` }}
                  transition={{ delay: 0.5 + idx * 0.1, duration: 0.8 }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#df2531]/60 to-[#df2531] rounded-full"
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                  {dia.partidos} partidos
                </span>
              </div>
              <span className="text-sm text-gray-400 w-20 text-right">
                {dia.horasOcupadas}h
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Preview de Bracket */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#df2531]" />
          Bracket - Vista Preview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(BRACKET_PREVIEW_DEMO).map(([nombre, data]) => (
            <div key={nombre} className="bg-white/5 rounded-xl p-4">
              <h4 className="font-medium text-white mb-3">{nombre}</h4>
              <div className="flex items-center gap-2">
                {data.estructura.map((fase, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-sm font-bold text-white">
                        {fase.partidos}
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">{fase.fase}</span>
                    </div>
                    {idx < data.estructura.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {data.parejas} parejas • Sistema Paraguayo
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Nota informativa */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-200 font-medium">Modo Vista Demo</p>
          <p className="text-xs text-blue-300/70 mt-1">
            Estos son datos estáticos de ejemplo para visualizar cómo se verá el torneo con información completa. 
            Los datos reales aparecerán aquí cuando el torneo esté en marcha.
          </p>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares

function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/20 text-purple-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/[0.02] border border-white/5 rounded-2xl p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

function TimelineItem({
  item,
  isLast,
}: {
  item: typeof TIMELINE_DEMO[0];
  isLast: boolean;
}) {
  const Icon = item.icon;
  
  const estadoStyles: Record<string, string> = {
    COMPLETADO: 'bg-green-500/20 text-green-400 border-green-500/30',
    EN_PROGRESO: 'bg-[#df2531]/20 text-[#df2531] border-[#df2531]/30',
    PENDIENTE: 'bg-white/5 text-gray-400 border-white/10',
  };

  const estadoTextos = {
    COMPLETADO: 'Completado',
    EN_PROGRESO: 'En progreso',
    PENDIENTE: 'Pendiente',
  };

  return (
    <div className="flex items-start gap-4 relative">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${estadoStyles[item.estado]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">{item.fase}</h4>
          <span className={`text-xs px-2 py-1 rounded-full ${estadoStyles[item.estado]}`}>
            {estadoTextos[item.estado as keyof typeof estadoTextos]}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">{item.descripcion}</p>
        <p className="text-xs text-gray-500 mt-1">{item.fecha}</p>
      </div>
      {!isLast && (
        <div className="absolute left-5 top-10 w-px h-8 bg-white/10" />
      )}
    </div>
  );
}

function CategoriaCard({ categoria }: { categoria: typeof CATEGORIAS_DEMO[0] }) {
  const generoColors: Record<string, string> = {
    FEMENINO: 'border-pink-500/30 bg-pink-500/5',
    MASCULINO: 'border-blue-500/30 bg-blue-500/5',
    MIXTO: 'border-purple-500/30 bg-purple-500/5',
  };

  return (
    <div className={`rounded-xl p-4 border ${generoColors[categoria.genero]}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-white">{categoria.nombre}</h4>
        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
          {categoria.estado}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-3 text-sm">
        <span className="text-gray-400">
          <span className="text-white font-medium">{categoria.parejas}</span> parejas
        </span>
        <span className="text-gray-400">
          Bracket <span className="text-white font-medium">{categoria.bracket}</span>
        </span>
      </div>
    </div>
  );
}
