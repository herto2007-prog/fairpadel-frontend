import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search, Loader2, Power, Check, Users } from 'lucide-react';
import { circuitosService } from '../../circuitos/circuitosService';
import { useToast } from '../../../components/ui/ToastProvider';
import { useConfirm } from '../../../hooks/useConfirm';

interface LigaItem {
  organizador: { id: string; nombre: string; apellido: string; email: string };
  liga: {
    id: string;
    nombre: string;
    slug: string;
    estado: 'ACTIVO' | 'INACTIVO' | 'FINALIZADO';
    temporada: string;
    _count?: { torneos: number };
  } | null;
}

export function LigasOrganizadorManager() {
  const { showSuccess, showError, showInfo } = useToast();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<LigaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await circuitosService.getLigasOrganizadores();
      if (res.success) setItems(res.data || []);
    } catch {
      showError('Error', 'No se pudieron cargar las ligas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.organizador.nombre} ${i.organizador.apellido}`.toLowerCase().includes(q) ||
      i.organizador.email.toLowerCase().includes(q),
    );
  }, [query, items]);

  const activa = (i: LigaItem) => i.liga && i.liga.estado === 'ACTIVO';

  const habilitar = async (i: LigaItem) => {
    const ok = await confirm({
      title: 'Habilitar ranking propio',
      message: `Se creará la liga de ${i.organizador.nombre} ${i.organizador.apellido} y sus torneos finalizados pasarán a contar para su ranking. ¿Confirmás?`,
      confirmText: 'Habilitar',
      cancelText: 'Cancelar',
      variant: 'success',
    });
    if (!ok) return;
    setBusy(i.organizador.id);
    try {
      const res = await circuitosService.habilitarLiga(i.organizador.id);
      const d = res.data || {};
      showSuccess(
        'Liga habilitada',
        `${d.torneosVinculados ?? 0} torneo(s) vinculado(s), ${d.categoriasCalculadas ?? 0} categoría(s) con puntos calculados.`,
      );
      await load();
    } catch {
      showError('Error', 'No se pudo habilitar la liga');
    } finally {
      setBusy(null);
    }
  };

  const deshabilitar = async (i: LigaItem) => {
    const ok = await confirm({
      title: 'Desactivar liga',
      message: `Se desactivará la liga de ${i.organizador.nombre} ${i.organizador.apellido}. No se borra nada; los torneos futuros dejarán de sumar a su ranking. ¿Confirmás?`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    setBusy(i.organizador.id);
    try {
      await circuitosService.deshabilitarLiga(i.organizador.id);
      showInfo('Liga desactivada', 'El ranking propio quedó en pausa.');
      await load();
    } catch {
      showError('Error', 'No se pudo desactivar la liga');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Habilitá el <span className="text-white font-medium">ranking propio</span> de un organizador.
        Al hacerlo, sus torneos finalizados arman su liga y cada torneo que termine se suma solo.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar organizador por nombre o email…"
          className="w-full bg-[#151921] border border-[#232838] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#df2531] outline-none transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12 bg-[#151921] border border-white/5 rounded-xl">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay organizadores que coincidan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((i) => (
            <motion.div
              key={i.organizador.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 bg-[#151921] border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-gray-300 flex-shrink-0">
                  {i.organizador.nombre.charAt(0)}{i.organizador.apellido.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {i.organizador.nombre} {i.organizador.apellido}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{i.organizador.email}</div>
                  {activa(i) && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-green-400">
                      <Trophy className="w-3 h-3" />
                      Liga activa · {i.liga?._count?.torneos ?? 0} torneo(s) contando
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                {activa(i) ? (
                  <button
                    onClick={() => deshabilitar(i)}
                    disabled={busy === i.organizador.id}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-red-600/20 hover:text-red-400 transition-colors disabled:opacity-50 text-sm"
                  >
                    {busy === i.organizador.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                    Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => habilitar(i)}
                    disabled={busy === i.organizador.id}
                    className="flex items-center gap-2 px-3 py-2 bg-[#df2531] text-white rounded-lg hover:bg-[#df2531]/90 transition-colors disabled:opacity-50 text-sm"
                  >
                    {busy === i.organizador.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Habilitar ranking
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
