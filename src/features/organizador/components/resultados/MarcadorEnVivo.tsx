import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, RotateCcw, Trophy, Flag } from 'lucide-react';
import { resultadosService } from './resultadosService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: {
    id: string;
    inscripcion1?: { id: string; jugador1: { nombre: string; apellido: string }; jugador2?: { nombre: string; apellido: string } } | null;
    inscripcion2?: { id: string; jugador1: { nombre: string; apellido: string }; jugador2?: { nombre: string; apellido: string } } | null;
    formatoSet3?: 'SUPER_TIE_BREAK' | 'SET_COMPLETO';
  } | null;
  onSuccess?: () => void;
}

type LiveScore = {
  setActual: number;
  gameP1: number;
  gameP2: number;
  puntoP1: number | string;
  puntoP2: number | string;
  saque: number;
  historial: any[];
  setsCompletados: any[];
  estado: string;
  iniciadoAt: string;
};

export function MarcadorEnVivo({ isOpen, onClose, match, onSuccess }: Props) {
  const [liveScore, setLiveScore] = useState<LiveScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formatoSet3, setFormatoSet3] = useState<'SUPER_TIE_BREAK' | 'SET_COMPLETO'>('SET_COMPLETO');
  const [partidoIniciado, setPartidoIniciado] = useState(false);
  const [partidoFinalizado, setPartidoFinalizado] = useState(false);

  useEffect(() => {
    if (match?.formatoSet3) {
      setFormatoSet3(match.formatoSet3);
    }
  }, [match]);

  const cargarMarcador = useCallback(async () => {
    if (!match) return;
    try {
      const response = await resultadosService.obtenerMarcador(match.id);
      if (response.data?.liveScore) {
        setLiveScore(response.data.liveScore);
        setPartidoIniciado(true);
      }
      if (response.data?.estado === 'FINALIZADO') {
        setPartidoFinalizado(true);
      }
    } catch (err) {
      console.error('Error cargando marcador:', err);
    }
  }, [match]);

  useEffect(() => {
    if (isOpen && match) {
      cargarMarcador();
      const interval = setInterval(cargarMarcador, 5000); // Actualizar cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [isOpen, match, cargarMarcador]);

  if (!isOpen || !match) return null;

  const iniciarPartido = async () => {
    setLoading(true);
    try {
      await resultadosService.iniciarPartido(match.id, formatoSet3);
      setPartidoIniciado(true);
      await cargarMarcador();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar el partido');
    } finally {
      setLoading(false);
    }
  };

  const registrarPunto = async (ganador: number) => {
    if (!liveScore) return;
    setLoading(true);
    try {
      await resultadosService.registrarPunto(match.id, {
        tipo: 'PUNTO',
        ganador,
      });
      await cargarMarcador();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar punto');
    } finally {
      setLoading(false);
    }
  };

  const deshacerPunto = async () => {
    setLoading(true);
    try {
      await resultadosService.deshacerUltimoPunto(match.id);
      await cargarMarcador();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al deshacer');
    } finally {
      setLoading(false);
    }
  };

  const finalizarPartido = async () => {
    if (!confirm('¿Finalizar el partido?')) return;
    setLoading(true);
    try {
      await resultadosService.finalizarPartido(match.id);
      setPartidoFinalizado(true);
      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al finalizar');
    } finally {
      setLoading(false);
    }
  };

  const pareja1Nombre = match.inscripcion1 
    ? `${match.inscripcion1.jugador1.apellido}/${match.inscripcion1.jugador2?.apellido || ''}`
    : 'BYE';

  const pareja2Nombre = match.inscripcion2
    ? `${match.inscripcion2.jugador1.apellido}/${match.inscripcion2.jugador2?.apellido || ''}`
    : 'BYE';

  const renderPunto = (punto: number | string) => {
    if (punto === 'AD') return 'AD';
    if (typeof punto === 'number' && punto >= 0 && punto <= 3) {
      return ['0', '15', '30', '40'][punto];
    }
    return punto;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#151921] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-[#df2531]/20 to-transparent">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-[#df2531]" />
              <h2 className="text-lg font-bold text-white">Marcador en Vivo</h2>
              {liveScore?.estado === 'FINALIZADO' && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Finalizado
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {!partidoIniciado ? (
            /* Pantalla de inicio */
            <div className="p-8 space-y-6">
              <div className="text-center">
                <p className="text-gray-400 mb-4">Selecciona el formato del set 3 (si aplica)</p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setFormatoSet3('SET_COMPLETO')}
                    className={`px-6 py-3 rounded-xl border transition-all ${
                      formatoSet3 === 'SET_COMPLETO'
                        ? 'bg-[#df2531] border-[#df2531] text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    Set Completo
                  </button>
                  <button
                    onClick={() => setFormatoSet3('SUPER_TIE_BREAK')}
                    className={`px-6 py-3 rounded-xl border transition-all ${
                      formatoSet3 === 'SUPER_TIE_BREAK'
                        ? 'bg-[#df2531] border-[#df2531] text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    Súper Tie-Break
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={iniciarPartido}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-4 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  <Play className="w-5 h-5" />
                  {loading ? 'Iniciando...' : 'Iniciar Partido'}
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-center text-sm">{error}</p>
              )}
            </div>
          ) : (
            /* Marcador en vivo */
            <div className="p-6 space-y-6">
              {/* Sets completados */}
              {liveScore && liveScore.setsCompletados.length > 0 && (
                <div className="flex justify-center gap-4">
                  {liveScore.setsCompletados.map((set: any, idx: number) => (
                    <div key={idx} className="bg-white/5 rounded-lg px-4 py-2">
                      <span className="text-xs text-gray-500 block text-center">Set {set.numero}</span>
                      <span className="text-lg font-bold text-white">
                        {set.gamesP1}-{set.gamesP2}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Marcador actual */}
              <div className="bg-[#0B0E14] rounded-2xl p-6 border border-white/10">
                {/* Set actual */}
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-500">
                    {liveScore?.setActual === 3 && formatoSet3 === 'SUPER_TIE_BREAK' 
                      ? 'Súper Tie-Break' 
                      : `Set ${liveScore?.setActual || 1}`}
                  </span>
                </div>

                {/* Games */}
                <div className="grid grid-cols-3 gap-4 items-center mb-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">{pareja1Nombre}</p>
                    {liveScore?.saque === 1 && <span className="text-xs text-[#df2531]">● Saca</span>}
                  </div>
                  <div className="flex justify-center items-center gap-4">
                    <span className="text-4xl font-bold text-white">{liveScore?.gameP1 || 0}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-4xl font-bold text-white">{liveScore?.gameP2 || 0}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-400 mb-1">{pareja2Nombre}</p>
                    {liveScore?.saque === 2 && <span className="text-xs text-[#df2531]">● Saca</span>}
                  </div>
                </div>

                {/* Puntos (solo si no es inicio de set) */}
                {(liveScore?.puntoP1 !== 0 || liveScore?.puntoP2 !== 0) && (
                  <div className="flex justify-center gap-8">
                    <motion.div
                      key={`p1-${liveScore?.puntoP1}`}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-center"
                    >
                      <span className="text-5xl font-bold text-[#df2531]">
                        {renderPunto(liveScore?.puntoP1 || 0)}
                      </span>
                    </motion.div>
                    <motion.div
                      key={`p2-${liveScore?.puntoP2}`}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-center"
                    >
                      <span className="text-5xl font-bold text-[#df2531]">
                        {renderPunto(liveScore?.puntoP2 || 0)}
                      </span>
                    </motion.div>
                  </div>
                )}

                {/* Estado especial */}
                {liveScore?.estado && liveScore.estado !== 'EN_JUEGO' && liveScore.estado !== 'FINALIZADO' && (
                  <div className="mt-4 text-center">
                    <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                      liveScore.estado.includes('MATCH') 
                        ? 'bg-[#df2531]/20 text-[#df2531]' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {liveScore.estado.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Controles */}
              {!partidoFinalizado && liveScore?.estado !== 'FINALIZADO' && (
                <>
                  {/* Botones de punto */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => registrarPunto(1)}
                      disabled={loading}
                      className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
                    >
                      Punto para {pareja1Nombre}
                    </button>
                    <button
                      onClick={() => registrarPunto(2)}
                      disabled={loading}
                      className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
                    >
                      Punto para {pareja2Nombre}
                    </button>
                  </div>

                  {/* Acciones secundarias */}
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={deshacerPunto}
                      disabled={loading || (liveScore?.historial.length || 0) === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm transition-colors disabled:opacity-30"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Deshacer
                    </button>
                    <button
                      onClick={finalizarPartido}
                      disabled={loading || liveScore?.estado !== 'FINALIZADO'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                        liveScore?.estado === 'FINALIZADO'
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-white/5 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Flag className="w-4 h-4" />
                      Finalizar
                    </button>
                  </div>
                </>
              )}

              {/* Partido finalizado */}
              {(partidoFinalizado || liveScore?.estado === 'FINALIZADO') && (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Trophy className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">¡Partido Finalizado!</h3>
                  <p className="text-gray-400">El ganador avanza automáticamente</p>
                </div>
              )}

              {error && (
                <p className="text-red-400 text-center text-sm">{error}</p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
