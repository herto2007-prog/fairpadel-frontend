import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resultadosService, RegistrarResultadoPayload } from './resultadosService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: {
    id: string;
    inscripcion1?: { id: string; jugador1: { nombre: string; apellido: string }; jugador2?: { nombre: string; apellido: string } } | null;
    inscripcion2?: { id: string; jugador1: { nombre: string; apellido: string }; jugador2?: { nombre: string; apellido: string } } | null;
  } | null;
  onSuccess?: () => void;
}

export function RegistroResultadoModal({ isOpen, onClose, match, onSuccess }: Props) {
  const [formData, setFormData] = useState<RegistrarResultadoPayload>({
    set1Pareja1: 6,
    set1Pareja2: 4,
    set2Pareja1: 6,
    set2Pareja2: 3,
    formatoSet3: 'SET_COMPLETO',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !match) return null;

  const pareja1Nombre = match.inscripcion1 
    ? `${match.inscripcion1.jugador1.apellido} ${match.inscripcion1.jugador1.nombre.charAt(0)}.` +
      (match.inscripcion1.jugador2 ? ` / ${match.inscripcion1.jugador2.apellido} ${match.inscripcion1.jugador2.nombre.charAt(0)}.` : '')
    : 'BYE';

  const pareja2Nombre = match.inscripcion2
    ? `${match.inscripcion2.jugador1.apellido} ${match.inscripcion2.jugador1.nombre.charAt(0)}.` +
      (match.inscripcion2.jugador2 ? ` / ${match.inscripcion2.jugador2.apellido} ${match.inscripcion2.jugador2.nombre.charAt(0)}.` : '')
    : 'BYE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await resultadosService.registrarResultado(match.id, formData);
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar el resultado');
    } finally {
      setLoading(false);
    }
  };

  const haySet3 = () => {
    const setsP1 = 
      (formData.set1Pareja1 > formData.set1Pareja2 ? 1 : 0) +
      (formData.set2Pareja1 > formData.set2Pareja2 ? 1 : 0);
    const setsP2 = 
      (formData.set1Pareja1 < formData.set1Pareja2 ? 1 : 0) +
      (formData.set2Pareja1 < formData.set2Pareja2 ? 1 : 0);
    return setsP1 === 1 && setsP2 === 1;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#151921] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-[#df2531]" />
              <h2 className="text-lg font-bold text-white">Registrar Resultado</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Success State */}
          {success ? (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">¡Resultado Registrado!</h3>
              <p className="text-gray-400">El ganador avanza automáticamente.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Nombres de parejas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Pareja 1</p>
                  <p className="text-sm font-medium text-white">{pareja1Nombre}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Pareja 2</p>
                  <p className="text-sm font-medium text-white">{pareja2Nombre}</p>
                </div>
              </div>

              {/* Set 1 */}
              <div className="bg-white/[0.02] rounded-xl p-4">
                <p className="text-sm font-medium text-gray-400 mb-3">Set 1</p>
                <div className="flex items-center justify-center gap-4">
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={formData.set1Pareja1}
                    onChange={(e) => setFormData({ ...formData, set1Pareja1: parseInt(e.target.value) || 0 })}
                    className="w-16 h-12 bg-[#0B0E14] border border-white/10 rounded-lg text-center text-xl font-bold text-white focus:border-[#df2531] focus:outline-none"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={formData.set1Pareja2}
                    onChange={(e) => setFormData({ ...formData, set1Pareja2: parseInt(e.target.value) || 0 })}
                    className="w-16 h-12 bg-[#0B0E14] border border-white/10 rounded-lg text-center text-xl font-bold text-white focus:border-[#df2531] focus:outline-none"
                  />
                </div>
              </div>

              {/* Set 2 */}
              <div className="bg-white/[0.02] rounded-xl p-4">
                <p className="text-sm font-medium text-gray-400 mb-3">Set 2</p>
                <div className="flex items-center justify-center gap-4">
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={formData.set2Pareja1}
                    onChange={(e) => setFormData({ ...formData, set2Pareja1: parseInt(e.target.value) || 0 })}
                    className="w-16 h-12 bg-[#0B0E14] border border-white/10 rounded-lg text-center text-xl font-bold text-white focus:border-[#df2531] focus:outline-none"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={formData.set2Pareja2}
                    onChange={(e) => setFormData({ ...formData, set2Pareja2: parseInt(e.target.value) || 0 })}
                    className="w-16 h-12 bg-[#0B0E14] border border-white/10 rounded-lg text-center text-xl font-bold text-white focus:border-[#df2531] focus:outline-none"
                  />
                </div>
              </div>

              {/* Set 3 - Solo si hay empate */}
              {haySet3() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white/[0.02] rounded-xl p-4 border border-[#df2531]/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-400">Set 3 (Desempate)</p>
                    <select
                      value={formData.formatoSet3}
                      onChange={(e) => setFormData({ ...formData, formatoSet3: e.target.value as any })}
                      className="bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:border-[#df2531] focus:outline-none"
                    >
                      <option value="SET_COMPLETO">Set Completo</option>
                      <option value="SUPER_TIE_BREAK">Súper Tie-Break</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={formData.set3Pareja1 || ''}
                      onChange={(e) => setFormData({ ...formData, set3Pareja1: parseInt(e.target.value) || 0 })}
                      className="w-16 h-12 bg-[#0B0E14] border border-white/10 rounded-lg text-center text-xl font-bold text-white focus:border-[#df2531] focus:outline-none"
                      placeholder="-"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={formData.set3Pareja2 || ''}
                      onChange={(e) => setFormData({ ...formData, set3Pareja2: parseInt(e.target.value) || 0 })}
                      className="w-16 h-12 bg-[#0B0E14] border border-white/10 rounded-lg text-center text-xl font-bold text-white focus:border-[#df2531] focus:outline-none"
                      placeholder="-"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {formData.formatoSet3 === 'SUPER_TIE_BREAK' 
                      ? 'Súper Tie-Break: primeros a 10 puntos con diferencia de 2'
                      : 'Set completo: primeros a 6 games con diferencia de 2'}
                  </p>
                </motion.div>
              )}

              {/* Duración */}
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  placeholder="Duración (minutos)"
                  value={formData.duracionMinutos || ''}
                  onChange={(e) => setFormData({ ...formData, duracionMinutos: parseInt(e.target.value) || undefined })}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#df2531] focus:outline-none"
                />
              </div>

              {/* Observaciones */}
              <textarea
                placeholder="Observaciones (opcional)"
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#df2531] focus:outline-none resize-none"
              />

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Resultado'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
