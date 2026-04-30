import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Calendar, MapPin, ArrowLeft,
  UserPlus, Check, Medal, Target, Swords,
  ChevronDown, ChevronUp, Info, Settings, Search, X
} from 'lucide-react';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { americanoService, AmericanoTorneo, ClasificacionItem, AmericanoRonda, InscripcionAmericano } from '../../../services/americanoService';
import { api } from '../../../services/api';
import { formatDatePYShort } from '../../../utils/date';
import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { AmericanoManager } from '../../organizador/components/americano/AmericanoManager';

export function AmericanoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [torneo, setTorneo] = useState<AmericanoTorneo | null>(null);
  const [clasificacion, setClasificacion] = useState<ClasificacionItem[]>([]);
  const [inscripciones, setInscripciones] = useState<InscripcionAmericano[]>([]);
  const [loading, setLoading] = useState(true);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [rondaExpandida, setRondaExpandida] = useState<string | null>(null);
  const [tabActivo, setTabActivo] = useState<'info' | 'clasificacion' | 'rondas' | 'inscriptos' | 'gestionar'>('info');
  const { confirm, ...confirmState } = useConfirm();
  const [modalPareja, setModalPareja] = useState(false);
  const [busquedaPareja, setBusquedaPareja] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<{ id: string; nombre: string; apellido: string; fotoUrl: string | null }[]>([]);
  const [buscandoPareja, setBuscandoPareja] = useState(false);
  const [parejaSeleccionada, setParejaSeleccionada] = useState<{ id: string; nombre: string; apellido: string } | null>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [torneoData, clasifData, inscData] = await Promise.all([
        americanoService.getById(id),
        americanoService.getClasificacion(id),
        americanoService.listarInscripciones(id),
      ]);
      setTorneo(torneoData);
      setClasificacion(clasifData);
      setInscripciones(inscData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el torneo');
    } finally {
      setLoading(false);
    }
  };

  const handleInscribirse = async (jugador2Id?: string) => {
    if (!isAuthenticated || !user || !id) {
      navigate('/login', { state: { from: `/americano/${id}` } });
      return;
    }

    const esParejasFijas = torneo?.configAmericano?.tipoInscripcion === 'parejasFijas';

    if (esParejasFijas && !jugador2Id) {
      setModalPareja(true);
      return;
    }

    const confirmed = await confirm({
      title: 'Confirmar inscripción',
      message: esParejasFijas
        ? `¿Querés inscribirte en "${torneo?.nombre}" con ${parejaSeleccionada?.nombre} ${parejaSeleccionada?.apellido}?`
        : `¿Querés inscribirte en "${torneo?.nombre}"? Es gratis y no requiere pago.`,
      confirmText: 'Inscribirme',
      cancelText: 'Cancelar',
      variant: 'info',
    });
    if (!confirmed) return;
    try {
      setInscribiendo(true);
      setError('');
      await americanoService.inscribir(id, user.id, jugador2Id);
      setMensaje('¡Inscripción exitosa!');
      setModalPareja(false);
      setParejaSeleccionada(null);
      setBusquedaPareja('');
      setResultadosBusqueda([]);
      await loadData();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al inscribirse');
    } finally {
      setInscribiendo(false);
    }
  };

  const buscarPareja = async () => {
    if (!busquedaPareja.trim()) return;
    try {
      setBuscandoPareja(true);
      const res = await api.get(`/users/buscar?q=${encodeURIComponent(busquedaPareja)}&limit=10`);
      setResultadosBusqueda(res.data?.jugadores || res.data || []);
    } catch {
      setResultadosBusqueda([]);
    } finally {
      setBuscandoPareja(false);
    }
  };

  const yaInscripto = inscripciones.some(i => i.jugador1.id === user?.id);
  const isOrganizador = user?.id === torneo?.organizador?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (!torneo) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">Torneo no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/americano')}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a torneos americanos
        </motion.button>

        {/* Info principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/5 rounded-xl p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                  Americano
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  torneo.estado === 'EN_CURSO' 
                    ? 'bg-green-500/20 text-green-400' 
                    : torneo.estado === 'PUBLICADO'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-white/10 text-white/50'
                }`}>
                  {torneo.estado === 'EN_CURSO' ? 'En curso' : torneo.estado === 'PUBLICADO' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white">{torneo.nombre}</h1>
            </div>
            
            {!yaInscripto && torneo.estado !== 'FINALIZADO' && (
              <button
                onClick={() => handleInscribirse()}
                disabled={inscribiendo}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {inscribiendo ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {torneo.configAmericano?.tipoInscripcion === 'parejasFijas' ? 'Inscribirme con mi pareja' : 'Inscribirme'}
              </button>
            )}
            
            {yaInscripto && (
              <span className="flex items-center gap-1.5 px-3 py-2 bg-green-500/20 text-green-400 text-sm rounded-lg">
                <Check className="w-4 h-4" />
                Inscripto
              </span>
            )}
          </div>

          {torneo.descripcion && (
            <p className="text-white/50 text-sm mb-4">{torneo.descripcion}</p>
          )}

          {/* Explicación americano */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex gap-3 mb-4">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-white/50 text-xs leading-relaxed">
              En este formato las <strong className="text-white/70">parejas rotan</strong> en cada ronda. 
              Todos juegan con todos, nadie queda eliminado, y <strong className="text-white/70">gana quien acumule más games</strong> al final del torneo.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Fecha" value={`${formatDatePYShort(torneo.fechaInicio)} - ${formatDatePYShort(torneo.fechaFin)}`} />
            <InfoItem icon={<MapPin className="w-4 h-4" />} label="Ciudad" value={torneo.ciudad} />
            <InfoItem icon={<Users className="w-4 h-4" />} label="Inscriptos" value={`${torneo._count.inscripciones}`} />
            <InfoItem icon={<Target className="w-4 h-4" />} label="Rondas" value={`${torneo.configAmericano?.rondaActual || 0}${torneo.configAmericano?.modoJuego?.numRondas && torneo.configAmericano.modoJuego.numRondas !== 'automatico' ? `/${torneo.configAmericano.modoJuego.numRondas}` : ''}`} />
          </div>

          {/* Mensajes */}
          <AnimatePresence>
            {mensaje && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm"
              >
                {mensaje}
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/[0.02] border border-white/5 rounded-xl p-1 overflow-x-auto">
          {[
            { key: 'info' as const, label: 'Info', icon: Trophy },
            { key: 'inscriptos' as const, label: 'Inscriptos', icon: Users },
            { key: 'clasificacion' as const, label: 'Clasificación', icon: Medal },
            { key: 'rondas' as const, label: 'Rondas', icon: Swords },
            ...(isOrganizador ? [{ key: 'gestionar' as const, label: 'Gestionar', icon: Settings }] : []),
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTabActivo(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                tabActivo === tab.key
                  ? 'bg-primary/20 text-primary'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido del tab */}
        <AnimatePresence mode="wait">
          {tabActivo === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Config del americano */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Configuración</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ConfigItem label="Rondas jugadas" value={`${torneo.configAmericano?.rondaActual || 0}`} />
                  <ConfigItem label="Modo configurado" value={torneo.configAmericano?.modoJuegoConfigurado ? 'Sí' : 'Pendiente'} />
                  <ConfigItem label="Visibilidad" value={torneo.configAmericano?.visibilidad === 'publico' ? 'Público' : 'Privado'} />
                  <ConfigItem label="Modalidad" value={torneo.configAmericano?.tipoInscripcion === 'parejasFijas' ? 'Parejas fijas' : 'Individual'} />
                  <ConfigItem label="Inscripciones" value={`${torneo._count.inscripciones}${torneo.configAmericano?.limiteInscripciones ? `/${torneo.configAmericano.limiteInscripciones}` : ''}`} />
                  <ConfigItem label="Canchas" value={`${torneo.configAmericano?.modoJuego?.canchasSimultaneas ?? 1}`} />
                </div>
              </div>

              {/* Organizador */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-3">Organizador</h3>
                <div className="flex items-center gap-3">
                  {torneo.organizador.fotoUrl ? (
                    <img src={torneo.organizador.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium">
                      {torneo.organizador.nombre[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">{torneo.organizador.nombre} {torneo.organizador.apellido}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tabActivo === 'inscriptos' && (
            <motion.div
              key="inscriptos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <InscriptosList inscripciones={inscripciones} />
            </motion.div>
          )}

          {tabActivo === 'clasificacion' && (
            <motion.div
              key="clasificacion"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ClasificacionTable
                data={clasificacion.length > 0 ? clasificacion : inscripciones.map(i => ({
                  jugadorId: i.jugador1.id,
                  nombre: i.jugador1.nombre,
                  apellido: i.jugador1.apellido,
                  fotoUrl: i.jugador1.fotoUrl,
                  puntosTotal: 0,
                  partidosJugados: 0,
                  partidosGanados: 0,
                  partidosPerdidos: 0,
                  setsGanados: 0,
                  setsPerdidos: 0,
                  gamesGanados: 0,
                  gamesPerdidos: 0,
                  diferenciaGames: 0,
                }))}
                preClasificacion={clasificacion.length === 0 && inscripciones.length > 0}
              />
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
              {torneo.americanosRonda.length === 0 && (
                <div className="text-center py-12">
                  <Swords className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Aún no se iniciaron rondas</p>
                  <p className="text-white/30 text-xs mt-1 max-w-sm mx-auto">
                    El organizador iniciará las rondas cuando todos los inscriptos estén listos. Cada ronda arma nuevas parejas.
                  </p>
                </div>
              )}
              
              {torneo.americanosRonda.map((ronda) => (
                <RondaCard
                  key={ronda.id}
                  ronda={ronda}
                  expandida={rondaExpandida === ronda.id}
                  onToggle={() => setRondaExpandida(rondaExpandida === ronda.id ? null : ronda.id)}
                />
              ))}
            </motion.div>
          )}

          {tabActivo === 'gestionar' && isOrganizador && id && (
            <motion.div
              key="gestionar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AmericanoManager tournamentId={id} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal para seleccionar pareja (parejas fijas) */}
        <AnimatePresence>
          {modalPareja && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalPareja(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-md"
              >
                <div className="flex items-center justify-between p-5 border-b border-[#232838]">
                  <div>
                    <h3 className="text-white font-bold">Inscribirme con mi pareja</h3>
                    <p className="text-white/40 text-xs">Buscá a tu compañero por nombre</p>
                  </div>
                  <button onClick={() => setModalPareja(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={busquedaPareja}
                      onChange={(e) => setBusquedaPareja(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && buscarPareja()}
                      placeholder="Nombre o apellido del compañero..."
                      className="flex-1 bg-white/[0.03] border border-[#232838] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-primary outline-none transition-colors"
                    />
                    <button
                      onClick={buscarPareja}
                      disabled={buscandoPareja || !busquedaPareja.trim()}
                      className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                      {buscandoPareja ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {resultadosBusqueda.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {resultadosBusqueda.map((j) => (
                        <button
                          key={j.id}
                          onClick={() => {
                            setParejaSeleccionada({ id: j.id, nombre: j.nombre, apellido: j.apellido });
                            handleInscribirse(j.id);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-[#232838] hover:border-primary/40 transition-colors text-left"
                        >
                          {j.fotoUrl ? (
                            <img src={j.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium text-sm">
                              {j.nombre[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-white text-sm font-medium">{j.nombre} {j.apellido}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {resultadosBusqueda.length === 0 && busquedaPareja.trim() && !buscandoPareja && (
                    <p className="text-white/30 text-xs text-center">No se encontraron jugadores con ese nombre.</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-white/30">{icon}</div>
      <div>
        <p className="text-white/30 text-xs">{label}</p>
        <p className="text-white text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <p className="text-white/30 text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-semibold">{value}</p>
    </div>
  );
}

function ClasificacionTable({ data, preClasificacion = false }: { data: ClasificacionItem[]; preClasificacion?: boolean }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Medal className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">Aún no hay clasificación</p>
        <p className="text-white/30 text-xs mt-1 max-w-sm mx-auto">
          La tabla muestra cuántos games acumuló cada jugador. A mayor cantidad de games ganados, mejor posición.
        </p>
      </div>
    );
  }

  const titulo = preClasificacion ? 'Pre-clasificación' : 'Clasificación';

  const posicionColor = (pos: number) => {
    if (pos === 0) return 'text-yellow-400';
    if (pos === 1) return 'text-gray-300';
    if (pos === 2) return 'text-amber-600';
    return 'text-white/50';
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
      {preClasificacion && (
        <div className="px-4 py-2.5 bg-yellow-500/5 border-b border-white/5">
          <p className="text-yellow-400/70 text-xs">
            <strong className="text-yellow-400">{titulo}:</strong> Los jugadores aparecen con 0 puntos hasta que se inicien las rondas.
          </p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-white/30 font-medium px-4 py-3 w-12">#</th>
              <th className="text-left text-white/30 font-medium px-4 py-3">Jugador</th>
              <th className="text-right text-white/30 font-medium px-4 py-3">Pts</th>
              <th className="text-right text-white/30 font-medium px-4 py-3 hidden sm:table-cell">PJ</th>
              <th className="text-right text-white/30 font-medium px-4 py-3 hidden sm:table-cell">PG</th>
              <th className="text-right text-white/30 font-medium px-4 py-3 hidden md:table-cell">Sets+</th>
              <th className="text-right text-white/30 font-medium px-4 py-3 hidden md:table-cell">Games+</th>
              <th className="text-right text-white/30 font-medium px-4 py-3 hidden lg:table-cell">Diff</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.jugadorId} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                <td className={`px-4 py-3 font-bold ${posicionColor(idx)}`}>
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
                <td className="px-4 py-3 text-right font-bold text-primary">{item.puntosTotal}</td>
                <td className="px-4 py-3 text-right text-white/50 hidden sm:table-cell">{item.partidosJugados}</td>
                <td className="px-4 py-3 text-right text-white/50 hidden sm:table-cell">{item.partidosGanados}</td>
                <td className="px-4 py-3 text-right text-white/50 hidden md:table-cell">{item.setsGanados}</td>
                <td className="px-4 py-3 text-right text-white/50 hidden md:table-cell">{item.gamesGanados}</td>
                <td className={`px-4 py-3 text-right font-medium hidden lg:table-cell ${item.diferenciaGames >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.diferenciaGames > 0 ? '+' : ''}{item.diferenciaGames}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RondaCard({ ronda, expandida, onToggle }: { ronda: AmericanoRonda; expandida: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
            {ronda.numero}
          </span>
          <div className="text-left">
            <p className="text-white text-sm font-medium">Ronda {ronda.numero}</p>
            <p className="text-white/30 text-xs">
              {(ronda.parejas ?? []).length} parejas · {(ronda.puntajes ?? []).length} jugadores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            ronda.estado === 'EN_JUEGO' 
              ? 'bg-green-500/20 text-green-400' 
              : ronda.estado === 'FINALIZADA'
              ? 'bg-white/10 text-white/50'
              : 'bg-yellow-500/20 text-yellow-400'
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
            <div className="px-4 pb-4">
              {/* Parejas */}
              <div className="mb-4">
                <p className="text-white/30 text-xs font-medium mb-2">Parejas</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(ronda.parejas ?? []).map((pareja) => (
                    <div key={pareja.id} className="bg-white/[0.03] rounded-lg p-3 flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[pareja.jugador1, pareja.jugador2].filter(Boolean).map((j, i) => (
                          j?.fotoUrl ? (
                            <img key={i} src={j.fotoUrl} alt="" className="w-6 h-6 rounded-full object-cover border-2 border-dark" />
                          ) : (
                            <div key={i} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs border-2 border-dark">
                              {j?.nombre?.[0] ?? '?'}
                            </div>
                          )
                        ))}
                      </div>
                      <span className="text-white/70 text-xs">
                        {pareja.jugador1?.nombre ?? '?'} + {pareja.jugador2?.nombre ?? '?'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Partidos de la ronda */}
              {(ronda.partidos ?? []).length > 0 && (
                <div className="mb-4">
                  <p className="text-white/30 text-xs font-medium mb-2">Partidos</p>
                  <div className="space-y-2">
                    {(ronda.partidos ?? []).map((partido) => (
                      <div
                        key={partido.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                          partido.estado === 'FINALIZADO'
                            ? 'bg-green-500/5 border border-green-500/10'
                            : 'bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-white/40 text-[10px] font-medium bg-white/5 px-1.5 py-0.5 rounded">
                            C{partido.cancha}
                          </span>
                          <span className="text-white/70 text-xs">
                            {partido.parejaA?.jugador1?.nombre ?? '?'} + {partido.parejaA?.jugador2?.nombre ?? '?'}
                          </span>
                          <span className="text-white/30 text-xs">vs</span>
                          <span className="text-white/70 text-xs">
                            {partido.parejaB?.jugador1?.nombre ?? '?'} + {partido.parejaB?.jugador2?.nombre ?? '?'}
                          </span>
                        </div>
                        {partido.estado === 'FINALIZADO' && partido.sets && Array.isArray(partido.sets) && (
                          <span className="text-green-400 text-xs font-medium ml-2">
                            {partido.sets.map(s => `${s.gamesEquipoA}-${s.gamesEquipoB}`).join(', ')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Puntajes de la ronda */}
              {ronda.puntajes.length > 0 && (
                <div>
                  <p className="text-white/30 text-xs font-medium mb-2">Puntajes</p>
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
                          <span className="text-primary text-sm font-bold">{p.puntos} pts</span>
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

function InscriptosList({ inscripciones }: { inscripciones: InscripcionAmericano[] }) {
  if (inscripciones.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">Aún no hay inscriptos</p>
        <p className="text-white/30 text-xs mt-1 max-w-sm mx-auto">
          Compartí el link del torneo para que tus amigos se sumen. Cada uno se inscribe individualmente.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
      <p className="text-white/30 text-xs mb-4">{inscripciones.length} jugador{inscripciones.length !== 1 ? 'es' : ''} inscripto{inscripciones.length !== 1 ? 's' : ''}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {inscripciones.map((insc) => (
          <div key={insc.id} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3">
            {insc.jugador1.fotoUrl ? (
              <img src={insc.jugador1.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium text-sm">
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
    </div>
  );
}

export default AmericanoDetailPage;
