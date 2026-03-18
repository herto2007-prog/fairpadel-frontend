import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Shuffle, Swords, Trophy, Check } from 'lucide-react';
import { api } from '../../../../services/api';

interface ConfigurarBracketModalProps {
  categoria: {
    id: string;
    categoryId: string;
    category: {
      nombre: string;
    };
    inscripcionesCount: number;
    estado: string;
  };
  onClose: () => void;
  onGenerado: () => void;
}

interface BracketConfig {
  totalParejas: number;
  objetivoBracket: number;
  partidosZona: number;
  partidosRondaAjuste: number;
  eliminaciones: number;
  fases: string[];
}

export function ConfigurarBracketModal({ categoria, onClose, onGenerado }: ConfigurarBracketModalProps) {
  const [config, setConfig] = useState<BracketConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [usarSemillas, setUsarSemillas] = useState(false);

  useEffect(() => {
    calcularConfiguracion();
  }, []);

  const calcularConfiguracion = async () => {
    try {
      const totalParejas = categoria.inscripcionesCount;
      
      // SISTEMA PARAGUAYO - Fórmula escalable como el backend
      // 8-15 parejas → Bracket de 8 (Cuartos)
      // 16-31 parejas → Bracket de 16 (Octavos)
      // 32-63 parejas → Bracket de 32 (16avos)
      // 64+ parejas → Bracket de 64 (32avos)
      const partidosZona = Math.floor(totalParejas / 2);
      
      let objetivoBracket: number;
      if (totalParejas <= 15) {
        objetivoBracket = 8;
      } else if (totalParejas <= 31) {
        objetivoBracket = 16;
      } else if (totalParejas <= 63) {
        objetivoBracket = 32;
      } else {
        objetivoBracket = 64;
      }
      
      const eliminaciones = Math.max(0, totalParejas - objetivoBracket);
      const partidosRondaAjuste = eliminaciones;
      
      const fases: string[] = ['ZONA'];
      if (partidosRondaAjuste > 0) fases.push('RONDA AJUSTE');
      if (objetivoBracket >= 64) fases.push('32AVOS');
      if (objetivoBracket >= 32) fases.push('16AVOS');
      if (objetivoBracket >= 16) fases.push('OCTAVOS');
      if (objetivoBracket >= 8) fases.push('CUARTOS');
      fases.push('SEMIS', 'FINAL');
      
      setConfig({
        totalParejas,
        objetivoBracket,
        partidosZona,
        partidosRondaAjuste,
        eliminaciones,
        fases,
      });
    } catch (err) {
      setError('Error calculando configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerar = async () => {
    if (!confirmar) {
      setConfirmar(true);
      return;
    }

    setGenerando(true);
    setError('');
    try {
      const { data } = await api.post(`/admin/categorias/${categoria.id}/bracket/sortear`, {
        guardar: true,
        usarSemillas,
      });
      
      if (data.success) {
        onGenerado();
      } else {
        setError(data.message || 'Error generando bracket');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error generando bracket');
    } finally {
      setGenerando(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#151921] rounded-2xl p-8 max-w-sm w-full text-center"
        >
          <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">Calculando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#151921] rounded-2xl border border-white/10 max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-light text-white">Configurar Sorteo</h2>
            <p className="text-sm text-neutral-500">{categoria.category.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {config && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                  <div className="text-lg font-light text-white">{config.totalParejas}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Parejas</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                  <div className="text-lg font-light text-white">{config.objetivoBracket}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Bracket</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                  <div className="text-lg font-light text-white">{config.eliminaciones}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Eliminados</div>
                </div>
              </div>

              {/* Opción de semillas */}
              <div className="p-3 bg-white/[0.02] rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usarSemillas}
                    onChange={(e) => setUsarSemillas(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-white">Usar semillas por ranking</div>
                    <div className="text-xs text-neutral-500">
                      Las parejas se ordenan según su posición en el ranking del circuito
                    </div>
                  </div>
                </label>
              </div>

              {/* Flujo */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                  Estructura del torneo
                </h3>

                {/* Fase 1 */}
                <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Swords className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">Zona</div>
                    <div className="text-xs text-neutral-500">{config.partidosZona} partidos • Todos juegan</div>
                  </div>
                </div>

                {/* Fase 2 */}
                {config.partidosRondaAjuste > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Shuffle className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white">Ronda de Ajuste</div>
                      <div className="text-xs text-neutral-500">
                        {config.partidosRondaAjuste} partidos • {config.eliminaciones} eliminados
                      </div>
                    </div>
                  </div>
                )}

                {/* Fase 3 */}
                <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">Bracket</div>
                    <div className="text-xs text-neutral-500">
                      {config.fases.join(' → ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmación */}
              {confirmar && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-300">
                    ¿Confirmar sorteo? Una vez generado, las inscripciones quedarán cerradas.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {generando ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Sorteando...
              </>
            ) : confirmar ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Confirmar
              </>
            ) : (
              <>
                <Shuffle className="w-3.5 h-3.5" />
                Realizar Sorteo
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
