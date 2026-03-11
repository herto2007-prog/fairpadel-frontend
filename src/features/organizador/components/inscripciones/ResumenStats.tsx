import { Users, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
  total: number;
  confirmadas: number;
  pendientes: number;
  incompletas: number;
  ingresos: number;
}

interface ResumenStatsProps {
  stats: Stats;
}

export function ResumenStats({ stats }: ResumenStatsProps) {
  const cards = [
    {
      label: 'Total Inscritos',
      value: stats.total,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Confirmados',
      value: stats.confirmadas,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Pendientes',
      value: stats.pendientes,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      label: 'Sin Pareja',
      value: stats.incompletas,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
    {
      label: 'Ingresos',
      value: `Gs. ${(stats.ingresos || 0).toLocaleString('es-PY')}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      isCurrency: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`glass rounded-2xl p-4 border ${card.borderColor} ${card.bgColor}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs">{card.label}</span>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <p className={`text-2xl font-bold ${card.isCurrency ? 'text-emerald-400' : 'text-white'}`}>
            {card.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
