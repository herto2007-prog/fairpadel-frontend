import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Trophy, TrendingDown, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';

interface NodoAgenda {
  fase: string;
  fecha: string | null;
  hora: string | null;
  cancha: string | null;
  sede: string | null;
  rival: string | null;
  programado: boolean;
}

interface Agenda {
  torneo: { id: string; nombre: string };
  categoria: string | null;
  inscripcionId: string;
  estado: string;
  mensaje: string;
  proximoPartido: NodoAgenda | null;
  siGanas: NodoAgenda[];
  siPerdes: NodoAgenda | null;
}

const fmtFecha = (f: string | null) => (f ? f.split('-').reverse().slice(0, 2).join('/') : '');
const cuando = (n: NodoAgenda) =>
  n.programado ? `${fmtFecha(n.fecha)} ${n.hora}` : 'Por confirmar';

function NodoLinea({ n }: { n: NodoAgenda }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs py-1">
      <span className="text-gray-300 font-medium shrink-0">{n.fase}</span>
      <span className="text-gray-500 truncate flex-1 text-right">
        {n.rival ? `vs ${n.rival}` : ''}
      </span>
      <span className={`shrink-0 ${n.programado ? 'text-white' : 'text-gray-500 italic'}`}>
        {cuando(n)}
      </span>
    </div>
  );
}

// showEmpty: en el dashboard se oculta si no hay agenda (false, default); en la
// página dedicada /mi-agenda se muestra un empty state que invita a ver torneos.
export function MiAgendaCard({ showEmpty = false }: { showEmpty?: boolean }) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/jugador/mi-agenda')
      .then((r) => setAgendas(r.data?.data || []))
      .catch(() => setAgendas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  // Sin agenda: en el dashboard no mostramos nada; en la página dedicada, empty state.
  if (agendas.length === 0) {
    if (!showEmpty) return null;
    return (
      <div className="bg-[#151921] border border-[#232838] rounded-2xl p-8 text-center">
        <CalendarClock size={32} className="text-gray-600 mx-auto mb-3" />
        <p className="text-white font-medium">Todavía no tenés partidos próximos</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Cuando te inscribas a un torneo y se sortee el cuadro, vas a ver acá tu próximo partido y el camino si ganás o perdés.
        </p>
        <Link
          to="/torneos"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#df2531] hover:bg-[#df2531]/80 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Trophy size={16} /> Ver torneos abiertos
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151921] border border-[#232838] rounded-2xl p-5"
    >
      <h3 className="font-bold text-white mb-1 flex items-center gap-2">
        <CalendarClock size={18} className="text-[#df2531]" />
        Mi agenda
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Horarios previstos según el cuadro — pueden ajustarse durante el torneo.
      </p>

      <div className="space-y-5">
        {agendas.map((a) => (
          <div key={a.inscripcionId} className="rounded-xl bg-[#1a1f2e] p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{a.torneo.nombre}</p>
                {a.categoria && <p className="text-xs text-gray-500">{a.categoria}</p>}
              </div>
            </div>

            {/* Próximo partido */}
            {a.proximoPartido ? (
              <div className="rounded-lg bg-[#df2531]/10 border border-[#df2531]/20 p-3 mb-3">
                <p className="text-[10px] uppercase tracking-wide text-[#df2531] font-bold mb-1">
                  Tu próximo partido
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">
                    {a.proximoPartido.fase}
                    {a.proximoPartido.rival ? ` · vs ${a.proximoPartido.rival}` : ''}
                  </span>
                  <span className="text-sm font-bold text-white shrink-0">{cuando(a.proximoPartido)}</span>
                </div>
                {(a.proximoPartido.cancha || a.proximoPartido.sede) && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin size={12} />
                    {[a.proximoPartido.sede, a.proximoPartido.cancha].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-3">{a.mensaje}</p>
            )}

            {/* Si ganás */}
            {a.siGanas.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] uppercase tracking-wide text-green-400 font-bold flex items-center gap-1 mb-1">
                  <Trophy size={11} /> Si ganás
                </p>
                <div className="divide-y divide-white/5">
                  {a.siGanas.map((n, i) => (
                    <NodoLinea key={i} n={n} />
                  ))}
                </div>
              </div>
            )}

            {/* Si perdés (repechaje) */}
            {a.siPerdes && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-orange-400 font-bold flex items-center gap-1 mb-1">
                  <TrendingDown size={11} /> Si perdés
                </p>
                <NodoLinea n={a.siPerdes} />
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
