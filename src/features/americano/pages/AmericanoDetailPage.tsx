import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Calendar, MapPin, ArrowLeft,
  UserPlus, Check, Medal, Target, Swords,
  ChevronDown, ChevronUp, Settings, Search, X,
  Copy, Link2, Coffee, PartyPopper,
  Shield, AlertTriangle, LayoutGrid, ChevronRight,
} from 'lucide-react';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { americanoService, AmericanoTorneo, ClasificacionItem, AmericanoRonda, InscripcionAmericano } from '../../../services/americanoService';
import { api } from '../../../services/api';
import { formatDatePYShort } from '../../../utils/date';
import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { AmericanoManager } from '../../organizador/components/americano/AmericanoManager';
import { cn } from '../../../lib/utils';

export function AmericanoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();
  
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
  const [resultadosBusqueda, setResultadosBusqueda] = useState<{ id: string; nombre: string; apellido: string; fotoUrl: string | null; genero: string | null; categoriaActual: { nombre: string } | null; compatible: boolean; razon?: string }[]>([]);
  const [buscandoPareja, setBuscandoPareja] = useState(false);
  const [parejaSeleccionada, setParejaSeleccionada] = useState<{ id: string; nombre: string; apellido: string } | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [grupoInscriptos, setGrupoInscriptos] = useState<string>('todos');
  const [grupoClasificacion, setGrupoClasificacion] = useState<string>('todos');
  const [grupoRondas, setGrupoRondas] = useState<string>('todos');

  useEffect(() => {
    if (id) loadData();
    if (isAuthenticated) refreshUser();
  }, [id, isAuthenticated]);

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

  const esParejasFijas = torneo?.configAmericano?.tipoInscripcion === 'parejasFijas';

  const handleInscribirse = async (jugador2Id?: string) => {
    if (!isAuthenticated || !user || !id) {
      navigate('/login', { state: { from: `/americano/${id}` } });
      return;
    }

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
      const res = await api.get(`/users/buscar?q=${encodeURIComponent(busquedaPareja)}&limit=10&_t=${Date.now()}`);
      console.log('[DEBUG buscarPareja] API response:', res.data);
      const jugadores = res.data?.data || res.data?.jugadores || res.data || [];
      console.log('[DEBUG buscarPareja] jugadores parseados:', jugadores.length, jugadores);
      // Excluir al usuario logueado y a jugadores ya inscriptos
      const yaInscritosIds = new Set(inscripciones.flatMap(i => [i.jugador1.id, i.jugador2?.id].filter(Boolean)));
      console.log('[DEBUG buscarPareja] yaInscritosIds:', Array.from(yaInscritosIds));

      const config = torneo?.configAmericano;
      const formato = config?.formatoAmericano;
      const miGenero = user?.genero;
      const miCat = user?.categoria?.nombre;
      console.log('[DEBUG buscarPareja] user?.id:', user?.id, 'miGenero:', miGenero, 'miCat:', miCat);

      const conCompatibilidad = jugadores
        .filter((j: any) => j.id !== user?.id && !yaInscritosIds.has(j.id))
        .map((j: any) => {
          const partnerGenero = j.genero;
          const partnerCat = j.categoriaActual?.nombre;

          // Si no tiene género o categoría definidos
          if (!partnerGenero) {
            return { ...j, compatible: false, razon: 'El jugador no tiene género definido en su perfil' };
          }

          if (formato === 'parejasSinCat') {
            const generosHab = config?.generosHabilitados || [];
            if (miGenero && !generosHab.includes(miGenero)) {
              return { ...j, compatible: false, razon: `Tu género (${miGenero}) no está habilitado en este torneo` };
            }
            if (partnerGenero !== miGenero) {
              return { ...j, compatible: false, razon: `Género diferente: ${partnerGenero}` };
            }
            return { ...j, compatible: true };
          }

          if (formato === 'parejasConCat') {
            const generosHab = config?.generosHabilitados || [];
            if (miGenero && !generosHab.includes(miGenero)) {
              return { ...j, compatible: false, razon: `Tu género (${miGenero}) no está habilitado en este torneo` };
            }
            if (partnerGenero !== miGenero) {
              return { ...j, compatible: false, razon: `Género diferente: ${partnerGenero}` };
            }
            if (partnerCat !== miCat) {
              return { ...j, compatible: false, razon: `Categoría diferente: ${partnerCat || 'Sin categoría'}` };
            }
            return { ...j, compatible: true };
          }

          if (formato === 'sumas') {
            const combos = config?.combinacionesSuma || [];
            if (!miCat || !partnerCat) {
              return { ...j, compatible: false, razon: !miCat ? 'No tenés categoría definida' : 'El jugador no tiene categoría definida' };
            }
            const esValido = combos.some((c: any) => {
              const parts = typeof c === 'string'
                ? c.split(/[+\/ ,]/).map((s: string) => s.trim())
                : c.cat1 && c.cat2
                ? [c.cat1, c.cat2]
                : c.categoriaA && c.categoriaB
                ? [c.categoriaA, c.categoriaB]
                : [];
              return parts.includes(miCat) && parts.includes(partnerCat);
            });
            if (!esValido) {
              return { ...j, compatible: false, razon: `Combinación de sumas no válida (${partnerCat} no combina con ${miCat})` };
            }
            return { ...j, compatible: true };
          }

          if (formato === 'mixto') {
            if (!miGenero || !miCat || !partnerGenero || !partnerCat) {
              return { ...j, compatible: false, razon: !miGenero ? 'No tenés género definido' : !miCat ? 'No tenés categoría definida' : 'El jugador no tiene género/categoría definido' };
            }
            if (miGenero === partnerGenero) {
              return { ...j, compatible: false, razon: 'Debe ser del género opuesto' };
            }
            const esValido = (config?.combinacionesMixto || []).some((c: any) => {
              if (typeof c === 'string') {
                const parts = c.split(/\/|,/).map((s: string) => s.trim());
                const femPart = parts.find((p: string) => p.toUpperCase().startsWith('F'));
                const mascPart = parts.find((p: string) => p.toUpperCase().startsWith('M'));
                const femCat = femPart ? femPart.replace(/^F[-\s]*/i, '').trim() : '';
                const mascCat = mascPart ? mascPart.replace(/^M[-\s]*/i, '').trim() : '';
                return miGenero === 'FEMENINO'
                  ? femCat === miCat && mascCat === partnerCat
                  : mascCat === miCat && femCat === partnerCat;
              }
              if (c.categoriaMujer && c.categoriaHombre) {
                return miGenero === 'FEMENINO'
                  ? c.categoriaMujer === miCat && c.categoriaHombre === partnerCat
                  : c.categoriaHombre === miCat && c.categoriaMujer === partnerCat;
              }
              return false;
            });
            if (!esValido) {
              return { ...j, compatible: false, razon: `Combinación mixta no válida (${partnerCat})` };
            }
            return { ...j, compatible: true };
          }

          return { ...j, compatible: true };
        });

      setResultadosBusqueda(conCompatibilidad);
    } catch (err: any) {
      console.error('Error buscando pareja:', err);
      setResultadosBusqueda([]);
    } finally {
      setBuscandoPareja(false);
    }
  };

  const yaInscripto = inscripciones.some(i => i.jugador1.id === user?.id || i.jugador2?.id === user?.id);
  const puedeGestionar = torneo?.puedeGestionar ?? false;

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      // Fallback para navegadores que no soportan clipboard API
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    }
  };

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
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                  Americano
                </span>
                <FormatoBadge config={torneo.configAmericano} />
                {torneo.configAmericano?.visibilidad === 'privado' && (
                  <span className="px-2 py-0.5 bg-white/10 text-white/50 text-xs rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Privado
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  torneo.estado === 'EN_CURSO'
                    ? 'bg-green-500/20 text-green-400 animate-pulse'
                    : torneo.estado === 'FINALIZADO'
                    ? 'bg-purple-500/20 text-purple-400'
                    : torneo.estado === 'PUBLICADO'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-white/10 text-white/50'
                }`}>
                  {torneo.estado === 'EN_CURSO' ? 'En curso' : torneo.estado === 'FINALIZADO' ? 'Finalizado' : torneo.estado === 'PUBLICADO' ? 'Publicado' : 'Borrador'}
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
                {esParejasFijas ? 'Inscribirme con mi pareja' : 'Inscribirme'}
              </button>
            )}
            
            {yaInscripto && (
              <span className="flex items-center gap-1.5 px-3 py-2 bg-green-500/20 text-green-400 text-sm rounded-lg">
                <Check className="w-4 h-4" />
                Inscripto
              </span>
            )}
          </div>

          {torneo.estado === 'FINALIZADO' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center gap-3"
            >
              <PartyPopper className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <p className="text-purple-300 text-sm font-medium">¡Torneo finalizado!</p>
                <p className="text-purple-300/60 text-xs">Gracias a todos por participar. Consultá la clasificación para ver los resultados.</p>
              </div>
            </motion.div>
          )}

          {torneo.descripcion && (
            <p className="text-white/50 text-sm mb-4">{torneo.descripcion}</p>
          )}

          {!yaInscripto && torneo.estado !== 'FINALIZADO' && (
            <PerfilAlert torneo={torneo} user={user} />
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Fecha" value={`${formatDatePYShort(torneo.fechaInicio)} - ${formatDatePYShort(torneo.fechaFin)}`} />
            <InfoItem icon={<MapPin className="w-4 h-4" />} label="Ciudad" value={torneo.ciudad} />
            <InfoItem icon={<Users className="w-4 h-4" />} label="Inscriptos" value={`${torneo._count.inscripciones}`} />
            <InfoItem icon={<Target className="w-4 h-4" />} label="Rondas" value={`${torneo.configAmericano?.rondaActual || 0}${torneo.configAmericano?.modoJuego?.numRondas ? (torneo.configAmericano.modoJuego.numRondas === 'automatico' ? '/Auto' : `/${torneo.configAmericano.modoJuego.numRondas}`) : ''}`} />
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
            ...(puedeGestionar ? [{ key: 'gestionar' as const, label: 'Gestionar', icon: Settings }] : []),
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
              {puedeGestionar && (
                <>
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

                  {/* Link para compartir */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-primary" />
                      Link para compartir
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2.5 text-white/50 text-sm truncate select-all">
                        {typeof window !== 'undefined' ? window.location.href : `https://fairpadel.com/americano/${id}`}
                      </div>
                      <button
                        onClick={copiarLink}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          linkCopiado
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20'
                        }`}
                      >
                        {linkCopiado ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-white/30 text-xs mt-2">
                      Compartí este link con tus amigos para que se inscriban al torneo.
                    </p>
                  </div>
                </>
              )}

              {/* Categorías habilitadas — siempre visible */}
              {(() => {
                const cats = torneo.configAmericano?.categoriasHabilitadas;
                if (!cats?.length) return null;
                return (
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-3">Categorías habilitadas</h3>
                    <div className="flex flex-wrap gap-2">
                      {cats.map((cat) => (
                        <span
                          key={cat}
                          className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-lg border border-primary/20"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Organizador — solo gestores */}
              {puedeGestionar && (
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
              )}
            </motion.div>
          )}

          {tabActivo === 'inscriptos' && (
            <motion.div
              key="inscriptos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {torneo.americanosGrupo.length > 1 && (
                <GrupoSelector
                  grupos={torneo.americanosGrupo}
                  value={grupoInscriptos}
                  onChange={setGrupoInscriptos}
                />
              )}
              <InscriptosList
                inscripciones={inscripciones}
                esParejasFijas={esParejasFijas}
                grupoId={grupoInscriptos}
              />
            </motion.div>
          )}

          {tabActivo === 'clasificacion' && (
            <motion.div
              key="clasificacion"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {torneo.americanosGrupo.length > 1 && (
                <GrupoSelector
                  grupos={torneo.americanosGrupo}
                  value={grupoClasificacion}
                  onChange={setGrupoClasificacion}
                />
              )}
              <ClasificacionTab
                torneo={torneo}
                clasificacion={clasificacion}
                inscripciones={inscripciones}
                grupoId={grupoClasificacion}
                grupos={torneo.americanosGrupo}
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
              {torneo.americanosGrupo.length > 1 && (
                <GrupoSelector
                  grupos={torneo.americanosGrupo}
                  value={grupoRondas}
                  onChange={setGrupoRondas}
                />
              )}
              {torneo.americanosRonda.length === 0 && (
                <div className="text-center py-12">
                  <Swords className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Aún no se iniciaron rondas</p>
                  <p className="text-white/30 text-xs mt-1 max-w-sm mx-auto">
                    El organizador iniciará las rondas cuando todos los inscriptos estén listos.
                  </p>
                </div>
              )}
              
              {torneo.americanosRonda
                .filter(r => grupoRondas === 'todos' || r.grupoId === grupoRondas)
                .map((ronda) => (
                  <RondaCard
                    key={ronda.id}
                    ronda={ronda}
                    expandida={rondaExpandida === ronda.id}
                    onToggle={() => setRondaExpandida(rondaExpandida === ronda.id ? null : ronda.id)}
                  />
                ))}
            </motion.div>
          )}

          {tabActivo === 'gestionar' && puedeGestionar && id && (
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
                    <p className="text-white/40 text-xs">Buscá a tu compañero por nombre, apellido o documento</p>
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
                      placeholder="Nombre, apellido o documento del compañero..."
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
                        <div
                          key={j.id}
                          onClick={() => {
                            if (!j.compatible) return;
                            setParejaSeleccionada({ id: j.id, nombre: j.nombre, apellido: j.apellido });
                            handleInscribirse(j.id);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                            j.compatible
                              ? 'bg-white/[0.03] border-[#232838] hover:border-primary/40 cursor-pointer'
                              : 'bg-white/[0.02] border-[#232838]/50 opacity-60 cursor-not-allowed'
                          )}
                        >
                          {j.fotoUrl ? (
                            <img src={j.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium text-sm">
                              {j.nombre?.[0]}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-medium">{j.nombre} {j.apellido}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {j.genero && <BadgeGenero genero={j.genero} />}
                              {j.categoriaActual?.nombre && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                                  {j.categoriaActual.nombre}
                                </span>
                              )}
                              {!j.compatible && j.razon && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/80 border border-red-500/20">
                                  {j.razon}
                                </span>
                              )}
                            </div>
                          </div>
                          {j.compatible && (
                            <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {resultadosBusqueda.length === 0 && busquedaPareja.trim() && !buscandoPareja && (
                    <div className="text-center">
                      <p className="text-white/30 text-xs">No se encontraron jugadores.</p>
                      {torneo?.configAmericano?.formatoAmericano && (
                        <p className="text-white/20 text-[10px] mt-1">
                          {torneo.configAmericano.formatoAmericano === 'parejasSinCat' && 'Tu pareja debe tener el mismo género que vos.'}
                          {torneo.configAmericano.formatoAmericano === 'parejasConCat' && 'Tu pareja debe tener el mismo género y categoría que vos.'}
                          {torneo.configAmericano.formatoAmericano === 'sumas' && 'Tu pareja debe tener una categoría que complete una combinación de sumas válida.'}
                          {torneo.configAmericano.formatoAmericano === 'mixto' && 'Tu pareja debe ser del género opuesto y completar una combinación mixta válida.'}
                        </p>
                      )}
                    </div>
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

const FORMATO_BADGES: Record<string, { label: string; bg: string; text: string; tooltip: string }> = {
  clasico: { label: 'Clásico', bg: 'bg-blue-500/20', text: 'text-blue-400', tooltip: 'Todos juegan con todos. Parejas rotan cada ronda.' },
  parejasSinCat: { label: 'Parejas sin cat.', bg: 'bg-emerald-500/20', text: 'text-emerald-400', tooltip: 'Parejas fijas separadas por género.' },
  parejasConCat: { label: 'Parejas con cat.', bg: 'bg-amber-500/20', text: 'text-amber-400', tooltip: 'Parejas fijas separadas por género y categoría.' },
  porCategorias: { label: 'Por categorías', bg: 'bg-violet-500/20', text: 'text-violet-400', tooltip: 'Grupos por categoría. Parejas rotan dentro de cada grupo.' },
  sumas: { label: 'Sumas', bg: 'bg-rose-500/20', text: 'text-rose-400', tooltip: 'Suma de puntos individuales por ronda.' },
  mixto: { label: 'Mixto', bg: 'bg-pink-500/20', text: 'text-pink-400', tooltip: 'Parejas mixtas (hombre + mujer) rotan cada ronda.' },
};

function FormatoBadge({ config }: { config: any }) {
  const formato = config?.formatoAmericano || 'clasico';
  const info = FORMATO_BADGES[formato];
  const [showTip, setShowTip] = useState(false);
  if (!info) return null;
  return (
    <div className="relative inline-block">
      <span
        className={`px-2 py-0.5 text-xs rounded-full cursor-help ${info.bg} ${info.text}`}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {info.label}
      </span>
      {showTip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 whitespace-nowrap">
          <div className="bg-[#1a1f2e] border border-[#232838] rounded-lg px-2.5 py-1.5 text-white/70 text-xs shadow-xl">
            {info.tooltip}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1f2e] border-l border-t border-[#232838] rotate-45" />
          </div>
        </div>
      )}
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

function ClasificacionTab({
  torneo,
  clasificacion,
  inscripciones,
  grupoId,
  grupos,
}: {
  torneo: AmericanoTorneo;
  clasificacion: ClasificacionItem[] | any[];
  inscripciones: InscripcionAmericano[];
  grupoId: string;
  grupos: { id: string; nombre: string }[];
}) {
  const esMultiGrupo = grupos.length > 1;
  const finalizado = torneo.estado === 'FINALIZADO';

  // Si es multi-grupo y viene como array de grupos
  let data: ClasificacionItem[] = [];
  let preClasificacion = false;
  let grupoSeleccionadoNombre = '';

  if (esMultiGrupo && Array.isArray(clasificacion) && clasificacion.length > 0 && 'grupoId' in clasificacion[0]) {
    const porGrupo = clasificacion as any[];
    const grupo = grupoId === 'todos' ? porGrupo[0] : porGrupo.find((g: any) => g.grupoId === grupoId);
    if (grupo) {
      data = grupo.clasificacion || [];
      grupoSeleccionadoNombre = grupo.grupoNombre;
    }
  } else if (Array.isArray(clasificacion)) {
    data = clasificacion as ClasificacionItem[];
  }

  if (data.length === 0 && inscripciones.length > 0) {
    preClasificacion = true;
    data = inscripciones.map((i) => ({
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
    }));
  }

  return (
    <div className="space-y-4">
      {finalizado && data.length > 0 && (
        <Podium data={data.slice(0, 3)} />
      )}
      {esMultiGrupo && grupoSeleccionadoNombre && (
        <p className="text-white/50 text-xs font-medium">{grupoSeleccionadoNombre}</p>
      )}
      <ClasificacionTable data={data} preClasificacion={preClasificacion} mostrarMedallas={finalizado} />
    </div>
  );
}

function ClasificacionTable({
  data,
  preClasificacion = false,
  mostrarMedallas = false,
}: {
  data: ClasificacionItem[];
  preClasificacion?: boolean;
  mostrarMedallas?: boolean;
}) {
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

  const posicionMedalla = (pos: number) => {
    if (mostrarMedallas && pos === 0) return '🥇';
    if (mostrarMedallas && pos === 1) return '🥈';
    if (mostrarMedallas && pos === 2) return '🥉';
    return `${pos + 1}`;
  };

  const posicionColor = (pos: number) => {
    if (mostrarMedallas && pos === 0) return 'text-yellow-400';
    if (mostrarMedallas && pos === 1) return 'text-gray-300';
    if (mostrarMedallas && pos === 2) return 'text-amber-600';
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
                  {posicionMedalla(idx)}
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

function calcularBye(ronda: AmericanoRonda): { tipo: 'pareja' | 'jugador'; items: any[] } | null {
  const parejasEnPartidos = new Set(ronda.partidos.flatMap(p => [p.parejaA?.id, p.parejaB?.id].filter(Boolean)));
  const parejasEnBye = ronda.parejas.filter(p => !parejasEnPartidos.has(p.id));
  if (parejasEnBye.length > 0) {
    return { tipo: 'pareja', items: parejasEnBye };
  }
  const jugadoresEnParejas = new Set(ronda.parejas.flatMap(p => [p.jugador1?.id, p.jugador2?.id].filter(Boolean)));
  const jugadoresEnBye = ronda.puntajes.filter(p => !jugadoresEnParejas.has(p.jugador.id)).map(p => p.jugador);
  if (jugadoresEnBye.length > 0) {
    return { tipo: 'jugador', items: jugadoresEnBye };
  }
  return null;
}

function RondaCard({ ronda, expandida, onToggle }: { ronda: AmericanoRonda; expandida: boolean; onToggle: () => void }) {
  const bye = calcularBye(ronda);

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
          {bye && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded-full">
              <Coffee className="w-3 h-3" />
              Descansa
            </span>
          )}
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
              {/* Bye */}
              {bye && (
                <div className="mb-4">
                  <p className="text-white/30 text-xs font-medium mb-2">Descansa esta ronda</p>
                  <div className="flex items-center gap-2">
                    {bye.tipo === 'pareja' ? (
                      bye.items.map((pareja: any) => (
                        <div key={pareja.id} className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                          <Coffee className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400/80 text-xs">{pareja.jugador1?.nombre} + {pareja.jugador2?.nombre}</span>
                        </div>
                      ))
                    ) : (
                      bye.items.map((jugador: any) => (
                        <div key={jugador.id} className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                          <Coffee className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400/80 text-xs">{jugador.nombre} {jugador.apellido}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

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

function PerfilAlert({ torneo, user }: { torneo: AmericanoTorneo; user: any }) {
  const formato = torneo.configAmericano?.formatoAmericano || 'clasico';
  const requiereGenero = formato !== 'clasico';
  const requiereCategoria = ['parejasConCat', 'porCategorias', 'sumas', 'mixto'].includes(formato);
  const faltaGenero = requiereGenero && !user?.genero;
  const faltaCategoria = requiereCategoria && !user?.categoria;
  if (!faltaGenero && !faltaCategoria) return null;
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3 mb-4">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-amber-400 text-xs font-medium">
          {faltaGenero && faltaCategoria
            ? 'Necesitás género y categoría en tu perfil para inscribirte'
            : faltaGenero
            ? 'Necesitás género en tu perfil para inscribirte'
            : 'Necesitás categoría en tu perfil para inscribirte'}
        </p>
      </div>
      <button
        onClick={() => window.location.href = '/perfil'}
        className="text-amber-400 text-xs font-medium underline hover:text-amber-300 shrink-0"
      >
        Completar
      </button>
    </div>
  );
}

function GrupoSelector({ grupos, value, onChange }: { grupos: { id: string; nombre: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onChange('todos')}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
          value === 'todos'
            ? 'bg-primary/20 text-primary border border-primary/20'
            : 'bg-white/[0.03] text-white/50 border border-[#232838] hover:text-white/70'
        }`}
      >
        <LayoutGrid className="w-3 h-3 inline mr-1" />
        Todos
      </button>
      {grupos.map((g) => (
        <button
          key={g.id}
          onClick={() => onChange(g.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            value === g.id
              ? 'bg-primary/20 text-primary border border-primary/20'
              : 'bg-white/[0.03] text-white/50 border border-[#232838] hover:text-white/70'
          }`}
        >
          {g.nombre}
        </button>
      ))}
    </div>
  );
}

function InscriptosList({
  inscripciones,
  esParejasFijas,
  grupoId,
}: {
  inscripciones: InscripcionAmericano[];
  esParejasFijas?: boolean;
  grupoId?: string;
}) {
  const filtradas = grupoId && grupoId !== 'todos'
    ? inscripciones.filter((i) => i.grupo?.id === grupoId)
    : inscripciones;

  if (filtradas.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">Aún no hay inscriptos</p>
        <p className="text-white/30 text-xs mt-1 max-w-sm mx-auto">
          {esParejasFijas
            ? 'Compartí el link del torneo para que las parejas se inscriban.'
            : 'Compartí el link del torneo para que tus amigos se sumen.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
      <p className="text-white/30 text-xs mb-4">
        {esParejasFijas
          ? `${filtradas.length} pareja${filtradas.length !== 1 ? 's' : ''} inscripta${filtradas.length !== 1 ? 's' : ''}`
          : `${filtradas.length} jugador${filtradas.length !== 1 ? 'es' : ''} inscripto${filtradas.length !== 1 ? 's' : ''}`}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtradas.map((insc) => (
          <div
            key={insc.id}
            className="flex items-center gap-3 rounded-lg p-3 border border-transparent hover:border-white/5 transition-colors bg-white/[0.03]"
          >
            {esParejasFijas && insc.jugador2 ? (
              <>
                <div className="flex items-center">
                  <Avatar url={insc.jugador1.fotoUrl} name={insc.jugador1.nombre} size="w-8 h-8" />
                  <span className="mx-1 text-white/30 text-xs">+</span>
                  <Avatar url={insc.jugador2.fotoUrl} name={insc.jugador2.nombre} size="w-8 h-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">
                    {insc.jugador1.nombre} + {insc.jugador2.nombre}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {insc.jugador1.genero && (
                      <BadgeGenero genero={insc.jugador1.genero} />
                    )}
                    {insc.jugador1.categoriaActual?.nombre && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                        {insc.jugador1.categoriaActual.nombre}
                      </span>
                    )}
                    {insc.jugador2.categoriaActual?.nombre && insc.jugador2.categoriaActual.nombre !== insc.jugador1.categoriaActual?.nombre && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                        {insc.jugador2.categoriaActual.nombre}
                      </span>
                    )}
                    {insc.grupo?.nombre && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/70">
                        {insc.grupo.nombre}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Avatar url={insc.jugador1.fotoUrl} name={insc.jugador1.nombre} size="w-10 h-10" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">
                    {insc.jugador1.nombre} {insc.jugador1.apellido}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {insc.jugador1.genero && (
                      <BadgeGenero genero={insc.jugador1.genero} />
                    )}
                    {insc.jugador1.categoriaActual?.nombre && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                        {insc.jugador1.categoriaActual.nombre}
                      </span>
                    )}
                    {insc.grupo?.nombre && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/70">
                        {insc.grupo.nombre}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Avatar({ url, name, size }: { url: string | null; name: string; size: string }) {
  if (url) {
    return <img src={url} alt="" className={`${size} rounded-full object-cover border-2 border-[#151921]`} />;
  }
  return (
    <div className={`${size} rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-medium border-2 border-[#151921]`}>
      {name[0]}
    </div>
  );
}

function BadgeGenero({ genero }: { genero: string }) {
  const isMasc = genero === 'MASCULINO';
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isMasc ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
      {isMasc ? 'M' : 'F'}
    </span>
  );
}

function Podium({ data }: { data: ClasificacionItem[] }) {
  const posiciones = [
    { idx: 1, label: '2°', color: 'text-gray-300', bg: 'from-gray-500/20 to-gray-400/10', border: 'border-gray-500/20', h: 'h-24' },
    { idx: 0, label: '1°', color: 'text-yellow-400', bg: 'from-yellow-500/20 to-yellow-400/10', border: 'border-yellow-500/20', h: 'h-32' },
    { idx: 2, label: '3°', color: 'text-amber-600', bg: 'from-amber-700/20 to-amber-600/10', border: 'border-amber-700/20', h: 'h-20' },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-end justify-center gap-4">
        {posiciones.map((pos) => {
          const item = data[pos.idx];
          if (!item) return null;
          return (
            <motion.div
              key={pos.idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pos.idx * 0.1 }}
              className={`flex flex-col items-center justify-end w-24 ${pos.h} bg-gradient-to-b ${pos.bg} border ${pos.border} rounded-t-xl p-3`}
            >
              <span className={`text-lg font-bold ${pos.color}`}>{pos.label}</span>
              {item.fotoUrl ? (
                <img src={item.fotoUrl} alt="" className="w-8 h-8 rounded-full object-cover mt-2 border-2 border-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs mt-2 border-2 border-white/10">
                  {item.nombre[0]}
                </div>
              )}
              <p className="text-white text-xs font-medium mt-2 text-center truncate w-full">{item.nombre}</p>
              <p className={`text-xs font-bold ${pos.color}`}>{item.puntosTotal} pts</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default AmericanoDetailPage;
