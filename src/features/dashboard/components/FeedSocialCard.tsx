import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Trophy, Sparkles, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';

interface FeedItem {
  id: string;
  tipo: string;
  fecha: string;
  titulo: string;
  detalle: string;
  link: string | null;
}

const CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  resultado: { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  torneo_nuevo: { icon: Sparkles, color: 'text-[#df2531]', bg: 'bg-[#df2531]/10' },
  inscripcion_seguido: { icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

function hace(fechaISO: string): string {
  const dias = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} d`;
  return `hace ${Math.floor(dias / 7)} sem`;
}

// Feed social del jugador (Fase B): "Pulso de tu pádel" — actividad de su mundo
// (resultados de su categoría, torneos nuevos en su ciudad, inscripciones de
// quienes sigue). Sembrado por el back, así que rara vez está vacío.
export function FeedSocialCard() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/jugador/feed')
      .then((r) => setItems(r.data?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151921] border border-[#232838] rounded-2xl p-5"
    >
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Activity size={18} className="text-[#df2531]" />
        Pulso de tu pádel
      </h3>

      <div className="space-y-2">
        {items.map((it, index) => {
          const c = CONFIG[it.tipo] || CONFIG.resultado;
          const Icon = c.icon;
          const fila = (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`flex items-center gap-3 p-3 rounded-xl bg-[#1a1f2e] transition-colors ${it.link ? 'hover:bg-[#232838] cursor-pointer' : ''}`}
            >
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={c.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{it.titulo}</p>
                {it.detalle && <p className="text-xs text-gray-500">{it.detalle}</p>}
              </div>
              <span className="text-xs text-gray-600 flex-shrink-0">{hace(it.fecha)}</span>
            </motion.div>
          );
          return it.link ? (
            <Link key={it.id} to={it.link} className="block">{fila}</Link>
          ) : (
            <div key={it.id}>{fila}</div>
          );
        })}
      </div>
    </motion.div>
  );
}
