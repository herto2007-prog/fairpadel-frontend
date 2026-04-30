import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Play, SkipForward, Flag, Trophy,
  Swords, ChevronDown, ChevronUp, Plus, Check, Info, HelpCircle, Settings, Trash2, Target
} from 'lucide-react';
import {
  americanoService,
  AmericanoTorneo,
  AmericanoRonda,
  ClasificacionItem,
  InscripcionAmericano,
} from '../../../../services/americanoService';
import { useToast } from '../../../../components/ui/ToastProvider';
import { ConfigurarModoModal } from './ConfigurarModoModal';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';

interface AmericanoManagerProps {
  tournamentId: string;
}

export function AmericanoManager({ tournamentId }: AmericanoManagerProps) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [torneo, setTorneo] = useState<AmericanoTorneo | null>(null);
  const [inscripciones, setInscripciones] = useState<InscripcionAmericano[]>([]);
  const [clasificacion, setClasificacion] = useState<ClasificacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionLoading, setAccionLoading] = useState<string>('');
  const [tabActivo, setTabActivo] = useState<'inscriptos' | 'rondas' | 'clasificacion'>('inscriptos');
  const [rondaExpandida, setRondaExpandida] = useState<string | null>(null);
  const [resultadoModal, setResultadoModal] = useState<{
    rondaId: string;
    parejaA: { id: string; jugadores: string };
    parejaB: { id: string; jugadores: string };
  } | null>(null);
  const [mostrarConfigModal, setMostrarConfigModal] = useState(false);
  const { confirm, ...confirmState } = useConfirm();

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [torneoData, inscData, clasifData] = await Promise.all([
        americanoService.getById(tournamentId),
        americanoService.listarInscripciones(tournamentId),
        americanoService.getClasificacion(tournamentId),
      ]);
      setTorneo(torneoData);
      setInscripciones(inscData);
      setClasificacion(clasifData);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarRonda = async () => {
    try {
      setAccionLoading('iniciar');
      await americanoService.iniciarPrimeraRonda(tournamentId);
      showSuccess('Primera ronda iniciada');
      await loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error iniciando ronda');
    } finally {
      setAccionLoading('');
    }
  };

  const handleSiguienteRonda = async () => {
    try {
      setAccionLoading('siguiente');
      await americanoService.generarSiguienteRonda(tournamentId);
      showSuccess('Nueva ronda generada');
      await loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error generando ronda');
    } finally {
      setAccionLoading('');
    }
  };

  const handleFinalizarRonda = async (rondaId: string) => {
    try {
      setAccionLoading(`finalizar-${rondaId}`);
      await americanoService.finalizarRonda(tournamentId, rondaId);
      showSuccess('Ronda finalizada');
      await loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error finalizando ronda');
    } finally {
      setAccionLoading('');
    }
  };

  const handleRegistrarResultado = async (
    rondaId: string,
    parejaAId: string,
    parejaBId: string,
    sets: { gamesEquipoA: number; gamesEquipoB: number }[]
  ) => {
    try {
      setAccionLoading('resultado');
      await americanoService.registrarResultado(tournamentId, rondaId, parejaAId, parejaBId, sets);
      showSuccess('Resultado registrado');
      setResultadoModal(null);
      await loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error registrando resultado');
    } finally {
      setAccionLoading('');
    }
  };

  const handleCerrarInscripciones = async () => {
    const confirmed = await confirm({
      title: 'Cerrar inscripciones',
      message: '¿Estás seguro de cerrar las inscripciones? Los jugadores no podrán inscribirse más. Podés reabrirlas desde el panel de gestión.',
      confirmText: 'Cerrar inscripciones',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    if (!confirmed) return;
    try {
      setAccionLoading('cerrar');
      await americanoService.cerrarInscripciones(tournamentId);
      showSuccess('Inscripciones cerradas');
      await loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error cerrando inscripciones');
    } finally {
      setAccionLoading('');
    }
  };

  const handleEliminar = async () => {
    const confirmed = await confirm({
      title: 'Eliminar torneo',
      message: '¿Estás seguro de eliminar este torneo americano? Esta acción no se puede deshacer. Se borrarán todas las inscripciones, rondas y resultados.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      setAccionLoading('eliminar');
      await americanoService.eliminar(tournamentId);
      showSuccess('Torneo eliminado');
      navigate('/americano');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error eliminando torneo');
    } finally {
      setAccionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  const rondaEnJuego = torneo?.americanosRonda?.find(r => r.estado === 'EN_JUEGO');
  const ultimaRonda = torneo?.americanosRonda?.[torneo.americanosRonda.length - 1];
  const modoConfigurado = torneo?.configAmericano?.modoJuegoConfigurado ?? false;
  const numRondasConfig = torneo?.configAmericano?.modoJuego?.numRondas ?? 4;
  const numRondasMax = numRondasConfig === 'automatico' ? 999 : (typeof numRondasConfig === 'number' ? numRondasConfig : 4);
  
  const inscripcionesAbiertas = torneo?.configAmericano?.inscripcionesAbiertas ?? true;
  const puedeIniciar = modoConfigurado && inscripciones.length >= 4 && torneo?.americanosRonda?.length === 0;
  const partidosPendientesUltimaRonda = (ultimaRonda?.partidos ?? []).filter(p => p.estado === 'PENDIENTE').length;
  const puedeSiguiente = modoConfigurado && ultimaRonda && 
    (ultimaRonda.estado === 'FINALIZADA' || partidosPendientesUltimaRonda <= 1) &&
    (torneo?.configAmericano?.rondaActual || 0) < numRondasMax;

  return (
    <div className="space-y-6">
      {/* Info flujo organizador */}
      {!modoConfigurado && (
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 text-xs font-medium">¿Cómo funciona?</p>
            <p className="text-white/50 text-xs mt-1 leading-relaxed">
              1. Tus amigos se inscriben · 2. Cerrás inscripciones cuando quieras · 3. Configurás el modo de juego · 4. Iniciás rondas y registrás resultados · 5. El sistema arma la clasificación automáticamente.
            </p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={<Users className="w-4 h-4" />} label="Inscriptos" value={inscripciones.length} />
        <StatCard icon={<Swords className="w-4 h-4" />} label="Rondas" value={`${torneo?.americanosRonda?.length || 0}${modoConfigurado && numRondasConfig !== 'automatico' ? `/${numRondasConfig}` : ''}`} />
        <StatCard icon={<Trophy className="w-4 h-4" />} label="Ronda actual" value={torneo?.configAmericano?.rondaActual || 0} />
        <StatCard icon={<Flag className="w-4 h-4" />} label="Estado" value={rondaEnJuego ? 'En juego' : 'Esperando'} />
        <StatCard icon={<Target className="w-4 h-4" />} label="Canchas" value={torneo?.configAmericano?.modoJuego?.canchasSimultaneas ?? 1} />
      </div>

      {/* Banner: modo de juego no configurado */}
      {!modoConfigurado && inscripciones.length >= 4 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-yellow-400 text-sm font-medium">Modo de juego no configurado</p>
            <p className="text-white/50 text-xs mt-1">
              Configurá el modo de juego antes de iniciar la primera ronda.
            </p>
          </div>
          <button
            onClick={() => setMostrarConfigModal(true)}
            className="shrink-0 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs font-medium rounded-lg transition-colors"
          >
            Configurar
          </button>
        </div>
      )}

      {/* Acciones principales */}
      <div className="flex flex-wrap gap-3">
        {!modoConfigurado && inscripciones.length >= 4 && (
          <button
            onClick={() => setMostrarConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#151921] border border-[#232838] hover:border-primary/40 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4 text-primary" />
            Configurar modo de juego
          </button>
        )}

        {modoConfigurado && torneo?.americanosRonda?.length === 0 && (
          <button
            onClick={() => setMostrarConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#151921] border border-[#232838] hover:border-primary/40 text-white/70 text-sm font-medium rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4 text-white/40" />
            Editar modo
          </button>
        )}

        {inscripcionesAbiertas && (
          <button
            onClick={handleCerrarInscripciones}
            disabled={!!accionLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#151921] border border-[#232838] hover:border-yellow-500/40 text-yellow-400/80 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {accionLoading === 'cerrar' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full" />
            ) : (
              <Flag className="w-4 h-4" />
            )}
            Cerrar inscripciones
          </button>
        )}

        {!inscripcionesAbiertas && !modoConfigurado && (
          <span className="flex items-center gap-2 px-4 py-2.5 text-white/30 text-sm">
            <Flag className="w-4 h-4" />
            Inscripciones cerradas
          </span>
        )}

        {puedeIniciar && (
          <button
            onClick={handleIniciarRonda}
            disabled={!!accionLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {accionLoading === 'iniciar' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Iniciar 1ª Ronda
          </button>
        )}

        {puedeSiguiente && (
          <button
            onClick={handleSiguienteRonda}
            disabled={!!accionLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {accionLoading === 'siguiente' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <SkipForward className="w-4 h-4" />
            )}
            Generar Siguiente Ronda
          </button>
        )}

        <button
          onClick={handleEliminar}
          disabled={!!accionLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ml-auto"
        >
          {accionLoading === 'eliminar' ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Eliminar torneo
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#151921] border border-[#232838] rounded-xl p-1">
        {[
          { key: 'inscriptos' as const, label: 'Inscriptos', icon: Users },
          { key: 'rondas' as const, label: 'Rondas', icon: Swords },
          { key: 'clasificacion' as const, label: 'Clasificación', icon: Trophy },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTabActivo(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tabActivo === tab.key
                ? 'bg-[#df2531]/20 text-[#df2531]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <AnimatePresence mode="wait">
        {tabActivo === 'inscriptos' && (
          <motion.div
            key="inscriptos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {inscripciones.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No hay inscripciones todavía</p>
                <p className="text-white/30 text-xs mt-1 max-w-sm mx-auto">
                  Compartí el link del torneo para que tus amigos se sumen. Cada uno se inscribe individualmente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inscripciones.map((insc) => (
                  <div key={insc.id} className="bg-[#151921] border border-[#232838] rounded-xl p-4 flex items-center gap-3">
                    {insc.jugador1.fotoUrl ? (
                      <img src={insc.jugador1.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium">
                        {insc.jugador1.nombre[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{insc.jugador1.nombre} {insc.jugador1.apellido}</p>
                      <p className="text-white/30 text-xs">
                        {insc.jugador1.categoriaActual?.nombre || 'Sin categoría'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tabActivo === 'rondas' && (
          <motion.div
            key="rondas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {torneo?.americanosRonda?.length === 0 && (
              <div className="text-center py-12">
                <Swords className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Aún no hay rondas</p>
                <p className="text-white/30 text-xs mt-1 max-w-sm mx-auto">
                  {modoConfigurado
                    ? 'Tenés al menos 4 inscriptos. Podés iniciar la primera ronda y el sistema armará las parejas automáticamente.'
                    : 'Primero tenés que configurar el modo de juego antes de poder iniciar rondas.'}
                </p>
              </div>
            )}

            {torneo?.americanosRonda?.map((ronda) => (
              <RondaGestionCard
                key={ronda.id}
                ronda={ronda}
                expandida={rondaExpandida === ronda.id}
                onToggle={() => setRondaExpandida(rondaExpandida === ronda.id ? null : ronda.id)}
                onFinalizar={() => handleFinalizarRonda(ronda.id)}
                onRegistrarResultado={(parejaA, parejaB) =>
                  setResultadoModal({ rondaId: ronda.id, parejaA, parejaB })
                }
                accionLoading={accionLoading}
              />
            ))}
          </motion.div>
        )}

        {tabActivo === 'clasificacion' && (
          <motion.div
            key="clasificacion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {clasificacion.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Aún no hay clasificación</p>
                <p className="text-white/30 text-xs mt-1 max-w-sm mx-auto">
                  La tabla se actualiza automáticamente a medida que registrás resultados. Cada jugador suma los games que gana.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <HelpCircle className="w-3.5 h-3.5 text-white/20" />
                  <p className="text-white/30 text-xs">
                    Cada jugador acumula los <strong className="text-white/50">games ganados</strong> de todos sus partidos. Gana quien tenga más games al final.
                  </p>
                </div>
                <div className="bg-[#151921] border border-[#232838] rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#232838]">
                      <th className="text-left text-white/30 font-medium px-4 py-3 w-12">#</th>
                      <th className="text-left text-white/30 font-medium px-4 py-3">Jugador</th>
                      <th className="text-right text-white/30 font-medium px-4 py-3">Pts</th>
                      <th className="text-right text-white/30 font-medium px-4 py-3">PJ</th>
                      <th className="text-right text-white/30 font-medium px-4 py-3">PG</th>
                      <th className="text-right text-white/30 font-medium px-4 py-3">Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clasificacion.map((item, idx) => (
                      <tr key={item.jugadorId} className="border-b border-[#232838]/50 hover:bg-white/[0.02] transition-colors">
                        <td className={`px-4 py-3 font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-white/50'}`}>
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {item.fotoUrl ? (
                              <img src={item.fotoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs">
                                {item.nombre[0]}
                              </div>
                            )}
                            <span className="text-white font-medium">{item.nombre} {item.apellido}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#df2531]">{item.puntosTotal}</td>
                        <td className="px-4 py-3 text-right text-white/50">{item.partidosJugados}</td>
                        <td className="px-4 py-3 text-right text-white/50">{item.partidosGanados}</td>
                        <td className={`px-4 py-3 text-right font-medium ${item.diferenciaGames >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.diferenciaGames > 0 ? '+' : ''}{item.diferenciaGames}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de resultado */}
      <AnimatePresence>
        {resultadoModal && (
          <ResultadoModal
            parejaA={resultadoModal.parejaA}
            parejaB={resultadoModal.parejaB}
            onSubmit={(sets) => handleRegistrarResultado(resultadoModal.rondaId, resultadoModal.parejaA.id, resultadoModal.parejaB.id, sets)}
            onCancel={() => setResultadoModal(null)}
            loading={accionLoading === 'resultado'}
          />
        )}
      </AnimatePresence>

      {mostrarConfigModal && (
        <ConfigurarModoModal
          torneoId={tournamentId}
          configInicial={torneo?.configAmericano?.modoJuego}
          onClose={() => setMostrarConfigModal(false)}
          onConfigured={() => {
            setMostrarConfigModal(false);
            loadData();
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={confirmState.close}
        onConfirm={confirmState.handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-[#151921] border border-[#232838] rounded-xl p-4">
      <div className="flex items-center gap-2 text-white/30 mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}

interface RondaGestionCardProps {
  ronda: AmericanoRonda;
  expandida: boolean;
  onToggle: () => void;
  onFinalizar: () => void;
  onRegistrarResultado: (parejaA: { id: string; jugadores: string }, parejaB: { id: string; jugadores: string }) => void;
  accionLoading: string;
}

function RondaGestionCard({ ronda, expandida, onToggle, onFinalizar, onRegistrarResultado, accionLoading }: RondaGestionCardProps) {
  return (
    <div className="bg-[#151921] border border-[#232838] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[#df2531]/20 text-[#df2531] text-sm font-bold flex items-center justify-center">
            {ronda.numero}
          </span>
          <div className="text-left">
            <p className="text-white text-sm font-medium">Ronda {ronda.numero}</p>
            <p className="text-white/30 text-xs">{ronda.parejas.length} parejas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ronda.estado === 'EN_JUEGO' && (
            <button
              onClick={(e) => { e.stopPropagation(); onFinalizar(); }}
              disabled={accionLoading === `finalizar-${ronda.id}`}
              className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {accionLoading === `finalizar-${ronda.id}` ? '...' : 'Finalizar'}
            </button>
          )}
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            ronda.estado === 'EN_JUEGO' ? 'bg-green-500/20 text-green-400' :
            ronda.estado === 'FINALIZADA' ? 'bg-white/10 text-white/50' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {ronda.estado === 'EN_JUEGO' ? 'En juego' : ronda.estado === 'FINALIZADA' ? 'Finalizada' : 'Pendiente'}
          </span>
          {expandida ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expandida && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Parejas */}
              <div>
                <p className="text-white/30 text-xs font-medium mb-2">Parejas formadas</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ronda.parejas.map((pareja) => (
                    <div key={pareja.id} className="bg-white/[0.03] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex -space-x-1.5">
                          {[pareja.jugador1, pareja.jugador2].map((j, i) => (
                            j.fotoUrl ? (
                              <img key={i} src={j.fotoUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-[#151921]" />
                            ) : (
                              <div key={i} className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs border border-[#151921]">
                                {j.nombre[0]}
                              </div>
                            )
                          ))}
                        </div>
                        <span className="text-white/70 text-xs">
                          {pareja.jugador1.nombre} + {pareja.jugador2.nombre}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Partidos de la ronda */}
              {(ronda.partidos ?? []).length > 0 && (
                <div>
                  <p className="text-white/30 text-xs font-medium mb-2">
                    {ronda.estado === 'EN_JUEGO' ? 'Registrar resultado' : 'Partidos'}
                  </p>
                  <div className="space-y-2">
                    {(ronda.partidos ?? []).map((partido) => (
                      <div
                        key={partido.id}
                        className={`w-full flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                          partido.estado === 'FINALIZADO'
                            ? 'bg-green-500/5 border border-green-500/10'
                            : ronda.estado === 'EN_JUEGO'
                              ? 'bg-white/[0.03] hover:bg-white/[0.06]'
                              : 'bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Swords className="w-4 h-4 text-white/20" />
                            <span className="text-white/40 text-[10px] font-medium bg-white/5 px-1.5 py-0.5 rounded">
                              C{partido.cancha}
                            </span>
                          </div>
                          <span className="text-white/70 text-xs">
                            {partido.parejaA.jugador1.nombre} + {partido.parejaA.jugador2.nombre}
                          </span>
                          <span className="text-white/30 text-xs">vs</span>
                          <span className="text-white/70 text-xs">
                            {partido.parejaB.jugador1.nombre} + {partido.parejaB.jugador2.nombre}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {partido.estado === 'FINALIZADO' && partido.sets && (
                            <span className="text-green-400 text-xs font-medium">
                              {partido.sets.map(s => `${s.gamesEquipoA}-${s.gamesEquipoB}`).join(', ')}
                            </span>
                          )}
                          {partido.estado === 'FINALIZADO' ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : ronda.estado === 'EN_JUEGO' ? (
                            <button
                              onClick={() =>
                                onRegistrarResultado(
                                  { id: partido.parejaA.id, jugadores: `${partido.parejaA.jugador1.nombre} + ${partido.parejaA.jugador2.nombre}` },
                                  { id: partido.parejaB.id, jugadores: `${partido.parejaB.jugador1.nombre} + ${partido.parejaB.jugador2.nombre}` }
                                )
                              }
                              className="text-primary hover:text-primary/80 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-white/20 text-[10px]">Pendiente</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Puntajes */}
              {ronda.puntajes.length > 0 && (
                <div>
                  <p className="text-white/30 text-xs font-medium mb-2">Puntajes de la ronda</p>
                  <div className="space-y-1">
                    {ronda.puntajes
                      .sort((a, b) => b.puntos - a.puntos)
                      .map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            {p.jugador.fotoUrl ? (
                              <img src={p.jugador.fotoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs">
                                {p.jugador.nombre[0]}
                              </div>
                            )}
                            <span className="text-white/70 text-xs">{p.jugador.nombre} {p.jugador.apellido}</span>
                          </div>
                          <span className="text-[#df2531] text-sm font-bold">{p.puntos} pts</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ResultadoModalProps {
  parejaA: { id: string; jugadores: string };
  parejaB: { id: string; jugadores: string };
  onSubmit: (sets: { gamesEquipoA: number; gamesEquipoB: number }[]) => void;
  onCancel: () => void;
  loading: boolean;
}

function ResultadoModal({ parejaA, parejaB, onSubmit, onCancel, loading }: ResultadoModalProps) {
  const [sets, setSets] = useState([{ gamesEquipoA: 6, gamesEquipoB: 4 }]);

  const addSet = () => setSets([...sets, { gamesEquipoA: 0, gamesEquipoB: 0 }]);
  const removeSet = (idx: number) => setSets(sets.filter((_, i) => i !== idx));
  const updateSet = (idx: number, field: 'gamesEquipoA' | 'gamesEquipoB', value: number) => {
    const newSets = [...sets];
    newSets[idx][field] = value;
    setSets(newSets);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#151921] border border-[#232838] rounded-2xl p-6 w-full max-w-md"
      >
        <h3 className="text-white font-bold text-lg mb-1">Registrar Resultado</h3>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[#df2531] text-sm">{parejaA.jugadores}</span>
          <span className="text-white/30 text-xs">vs</span>
          <span className="text-blue-400 text-sm">{parejaB.jugadores}</span>
        </div>

        <div className="space-y-3 mb-6">
          {sets.map((set, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-white/30 text-xs w-10">Set {idx + 1}</span>
              <input
                type="number"
                min={0}
                max={20}
                value={set.gamesEquipoA}
                onChange={(e) => updateSet(idx, 'gamesEquipoA', parseInt(e.target.value) || 0)}
                className="flex-1 bg-white/[0.05] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm text-center focus:border-[#df2531] outline-none"
              />
              <span className="text-white/30">-</span>
              <input
                type="number"
                min={0}
                max={20}
                value={set.gamesEquipoB}
                onChange={(e) => updateSet(idx, 'gamesEquipoB', parseInt(e.target.value) || 0)}
                className="flex-1 bg-white/[0.05] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm text-center focus:border-[#df2531] outline-none"
              />
              {sets.length > 1 && (
                <button onClick={() => removeSet(idx)} className="text-white/20 hover:text-red-400 transition-colors">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addSet}
          className="w-full flex items-center justify-center gap-2 py-2 text-white/40 hover:text-white text-sm transition-colors mb-6"
        >
          <Plus className="w-4 h-4" />
          Agregar set
        </button>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-white/[0.05] text-white text-sm rounded-xl hover:bg-white/[0.08] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(sets)}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#df2531] text-white text-sm rounded-xl hover:bg-[#df2531]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Guardar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
