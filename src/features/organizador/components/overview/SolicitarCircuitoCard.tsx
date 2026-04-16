import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, ChevronDown, Send, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api } from '../../../../services/api';

interface Circuito {
  id: string;
  nombre: string;
  ciudad: string;
  temporada: string;
}

interface SolicitarCircuitoCardProps {
  tournamentId: string;
}

export function SolicitarCircuitoCard({ tournamentId }: SolicitarCircuitoCardProps) {
  const [circuitos, setCircuitos] = useState<Circuito[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCircuitoId, setSelectedCircuitoId] = useState<string>('');
  const [notas, setNotas] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadCircuitos();
  }, []);

  const loadCircuitos = async () => {
    try {
      setFetching(true);
      const { data } = await api.get('/circuitos');
      const activos = (data?.data || data || []).filter((c: Circuito) => c.temporada === new Date().getFullYear().toString());
      setCircuitos(activos);
    } catch (err: any) {
      setError('No se pudieron cargar los circuitos.');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCircuitoId) return;

    setLoading(true);
    setError(null);
    try {
      await api.post(`/circuitos/torneo/${tournamentId}/solicitar`, {
        circuitoId: selectedCircuitoId,
        notas: notas.trim() || undefined,
      });
      setSuccess(true);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error enviando la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const selectedCircuito = circuitos.find((c) => c.id === selectedCircuitoId);

  if (fetching) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#151921] border border-[#232838] rounded-2xl p-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-400">Circuitos</p>
            <p className="text-white font-medium">Cargando...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-white font-medium">Solicitud enviada</p>
            <p className="text-sm text-green-400/80">Tu torneo fue solicitado para formar parte del circuito. Esperando aprobación.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (circuitos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-[#151921] border border-[#232838] rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-white font-medium">Circuitos</p>
            <p className="text-sm text-gray-400 mt-0.5">
              No hay circuitos activos para esta temporada.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Contactá a FairPadel para crear uno.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#151921] border border-[#232838] rounded-2xl p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Circuitos</p>
              <p className="text-white font-medium">¿Pertenece a un circuito?</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="shrink-0 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm font-medium rounded-xl transition-colors"
          >
            Solicitar inclusión
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#151921] border border-[#232838] rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Solicitar inclusión a circuito</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-[#232838] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label className="block text-sm text-gray-400 mb-1.5">Circuito</label>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('circuito-dropdown');
                      if (el) el.classList.toggle('hidden');
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-left text-white hover:border-purple-500/50 transition-colors"
                  >
                    <span className={selectedCircuito ? 'text-white' : 'text-gray-500'}>
                      {selectedCircuito ? selectedCircuito.nombre : 'Seleccionar circuito...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  <div
                    id="circuito-dropdown"
                    className="hidden absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-[#0B0E14] border border-[#232838] rounded-xl shadow-xl"
                  >
                    {circuitos.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCircuitoId(c.id);
                          const el = document.getElementById('circuito-dropdown');
                          if (el) el.classList.add('hidden');
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#232838] transition-colors"
                      >
                        <span className="font-medium">{c.nombre}</span>
                        <span className="text-gray-500 ml-2">• {c.ciudad}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Notas (opcional)</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ej: Etapa final del circuito..."
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedCircuitoId || loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
