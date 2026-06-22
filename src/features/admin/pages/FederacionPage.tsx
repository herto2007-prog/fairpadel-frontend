import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Award, Search, History, ArrowUp, ArrowDown, Minus,
  Users, Trophy, Loader2, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { useNoIndex } from '../../../hooks/useNoIndex';
import { adminService, User as AdminUser, MovimientoCategoria } from '../../../services/adminService';
import { rankingsService } from '../../rankings/rankingsService';
import { AscensosManager } from '../components/AscensosManager';
import { EditarJugadorModal } from '../components/EditarJugadorModal';
import { formatDatePY } from '../../../utils/date';

function tipoIcon(tipo: string) {
  if (tipo.includes('ASCENSO')) return <ArrowUp className="w-4 h-4 text-green-400" />;
  if (tipo.includes('DESCENSO')) return <ArrowDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

export function FederacionPage() {
  useNoIndex();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoCategoria[]>([]);
  const [candidatosPendientes, setCandidatosPendientes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [us, mov, asc] = await Promise.all([
        adminService.getUsers(),
        adminService.getHistorialCategoriasRecientes(20),
        rankingsService.getAscensosPendientes(),
      ]);
      setUsers(Array.isArray(us) ? us : []);
      setMovimientos(mov.data || []);
      const pend = (asc.data || []).filter((a: any) => a.estado === 'PENDIENTE');
      setCandidatosPendientes(pend.length);
    } catch {
      // estados vacíos si algo falla
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const jugadoresActivos = useMemo(
    () => users.filter((u) => u.estado === 'ACTIVO').length,
    [users],
  );

  const movimientosEsteMes = useMemo(() => {
    const ahora = new Date();
    const prefijo = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
    return movimientos.filter((m) => (m.createdAt || '').startsWith(prefijo)).length;
  }, [movimientos]);

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return users
      .filter((u) =>
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
        (u.documento || '').toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, users]);

  const onUserUpdated = (updated: AdminUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    setSelectedUser(null);
    // refrescar movimientos / contadores tras un cambio de categoría
    cargar();
  };

  return (
    <div className="min-h-screen bg-dark">
      <BackgroundEffects variant="subtle" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al panel
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#df2531]/15 flex items-center justify-center">
              <Award className="w-6 h-6 text-[#df2531]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Federación</h1>
              <p className="text-gray-400">Control de categorías de los jugadores de FairPadel</p>
            </div>
          </div>
        </motion.div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Candidatos pendientes', value: candidatosPendientes, icon: Trophy },
            { label: 'Jugadores activos', value: jugadoresActivos, icon: Users },
            { label: 'Movimientos este mes', value: movimientosEsteMes, icon: History },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-[#151921] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Icon className="w-4 h-4" /> {m.label}
                </div>
                <div className="text-2xl font-bold text-white">{loading ? '—' : m.value}</div>
              </div>
            );
          })}
        </div>

        {/* Zona 1: Candidatos a ascenso (reusa AscensosManager) */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Candidatos a ascenso</h2>
          </div>
          <AscensosManager />
        </section>

        {/* Zona 2: Buscar jugador */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Buscar jugador</h2>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, apellido o cédula…"
              className="w-full bg-[#151921] border border-[#232838] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#df2531] outline-none transition-colors"
            />
          </div>

          {query.trim() && (
            <div className="space-y-2">
              {resultados.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">Sin coincidencias</p>
              ) : (
                resultados.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="w-full flex items-center justify-between gap-3 bg-[#151921] border border-white/5 rounded-xl p-3 hover:border-[#df2531]/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {u.fotoUrl ? (
                          <img src={u.fotoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-gray-300">
                            {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{u.nombre} {u.apellido}</div>
                        <div className="text-xs text-gray-500">
                          {u.documento || 'Sin cédula'}{u.ciudad ? ` · ${u.ciudad}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-[#232838] rounded-full text-xs text-gray-300 flex-shrink-0">
                      {u.categoriaActual?.nombre || 'Sin categoría'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </section>

        {/* Zona 3: Movimientos recientes */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-bold text-white">Movimientos recientes</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-[#df2531]" />
            </div>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-10 bg-[#151921] border border-white/5 rounded-xl">
              <History className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Todavía no hay movimientos de categoría</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movimientos.map((m) => (
                <div key={m.id} className="bg-[#151921] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                  {tipoIcon(m.tipo)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">
                      <span className="font-medium">
                        {m.jugador ? `${m.jugador.nombre} ${m.jugador.apellido}` : 'Jugador'}
                      </span>{' '}
                      <span className="text-gray-400">
                        {m.categoriaAnterior?.nombre || 'Sin categoría'} → {m.categoriaNueva?.nombre || '—'}
                      </span>
                    </div>
                    {m.motivo && <div className="text-xs text-gray-500 truncate italic">{m.motivo}</div>}
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{formatDatePY(m.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedUser && (
        <EditarJugadorModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
          onUpdate={onUserUpdated}
        />
      )}
    </div>
  );
}
