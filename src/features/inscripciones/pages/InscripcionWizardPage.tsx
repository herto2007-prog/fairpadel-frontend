import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Users, Trophy, CheckCircle,
  AlertCircle, Search, Loader2, Check, X, Info
} from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../../components/ui/ToastProvider';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { useNoIndex } from '../../../hooks/useNoIndex';

interface Torneo {
  id: string;
  nombre: string;
  slug: string;
  flyerUrl: string;
  costoInscripcion: number;
  ciudad: string;
  fechaInicio: string;
  organizador?: { nombre: string; apellido: string };
  categorias: Array<{
    id: string;
    tournamentCategoryId: string;
    nombre: string;
    tipo: string;
    orden: number;
    inscripcionAbierta: boolean;
  }>;
}

interface Jugador {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  email: string;
  telefono?: string;
  genero: 'MASCULINO' | 'FEMENINO';
  fotoUrl?: string;
  categoria?: { id: string; nombre: string; tipo: string; orden: number };
}

const STEPS = [
  { id: 1, title: 'Pareja', icon: Users, description: 'Tu equipo' },
  { id: 2, title: 'Categoría', icon: Trophy, description: 'Competición' },
  { id: 3, title: 'Confirmar', icon: CheckCircle, description: 'Revisar' },
];

const CODIGOS_PAIS = [
  { codigo: '+595', pais: 'Paraguay', bandera: '🇵🇾' },
  { codigo: '+54', pais: 'Argentina', bandera: '🇦🇷' },
  { codigo: '+55', pais: 'Brasil', bandera: '🇧🇷' },
  { codigo: '+598', pais: 'Uruguay', bandera: '🇺🇾' },
  { codigo: '+56', pais: 'Chile', bandera: '🇨🇱' },
];

export function InscripcionWizardPage() {
  useNoIndex();
  const { showError, showWarning } = useToast();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [jugador2, setJugador2] = useState<Jugador | null>(null);
  const [codigoPais, setCodigoPais] = useState('+595');
  const [jugador2NoRegistrado, setJugador2NoRegistrado] = useState({
    nombre: '', apellido: '', documento: '', telefono: '', email: '',
  });
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  
  const [busquedaQuery, setBusquedaQuery] = useState('');
  const [busquedaResultados, setBusquedaResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { data: torneoData } = await api.get(`/t/${slug}`);
        if (torneoData.success) setTorneo(torneoData.torneo);
        
        if (isAuthenticated) {
          const { data: profileData } = await api.get('/auth/me');
          if (profileData.success) setUserProfile(profileData.user);
        } else {
          localStorage.setItem('redirectAfterLogin', `/t/${slug}/inscribirse`);
          navigate('/login');
        }
      } catch (error) {
        navigate('/torneos');
      } finally {
        setLoading(false);
      }
    };
    if (slug) cargarDatos();
  }, [slug, navigate, isAuthenticated]);

  const buscarJugador = async () => {
    if (!busquedaQuery.trim()) return;
    setBuscando(true);
    try {
      const params = new URLSearchParams();
      params.append('nombre', busquedaQuery);
      const { data } = await api.get(`/inscripciones/public/buscar-pareja?${params.toString()}`);
      if (data.success) {
        setBusquedaResultados(data.jugadores);
        setMostrarFormNuevo(data.jugadores.length === 0);
      }
    } catch (error) {
      console.error('Error buscando jugador:', error);
    } finally {
      setBuscando(false);
    }
  };

  // Filtrar categorías: solo mostrar las que tienen inscripción abierta
  // La validación de categoría inferior se hace al seleccionar
  const categoriasFiltradas = useMemo(() => {
    if (!torneo) return [];
    return torneo.categorias
      .filter((c: any) => c.inscripcionAbierta)
      .sort((a: any, b: any) => a.orden - b.orden);
  }, [torneo]);

  // Validar si el jugador puede inscribirse en una categoría
  const puedeInscribirseEnCategoria = (categoria: any): boolean => {
    if (!userProfile?.categoria) return true; // Si no tiene categoría, permitir (validación manual)
    
    const ordenJugador = userProfile.categoria.orden;
    const generoJugador = userProfile.genero;
    
    // No permitir categorías masculinas a jugadoras femeninas si es muy inferior
    if (categoria.tipo === 'MASCULINO' && generoJugador === 'FEMENINO' && categoria.orden > ordenJugador + 1) {
      return false;
    }
    
    // No permitir categorías femeninas a jugadores masculinos
    if (categoria.tipo === 'FEMENINO' && generoJugador === 'MASCULINO') {
      return false;
    }
    
    // No permitir categoría inferior (ej: jugador 1ª no puede jugar 8ª)
    if (categoria.orden > ordenJugador) {
      return false;
    }
    
    return true;
  };

  const handleSeleccionarCategoria = (categoria: any) => {
    if (!puedeInscribirseEnCategoria(categoria)) {
      showWarning('Categoría no permitida', `No puedes inscribirte en ${categoria.nombre} porque es inferior a tu categoría actual (${userProfile?.categoria?.nombre || 'Sin categoría'}).`);
      return;
    }
    setCategoriaSeleccionada(categoria.id);
  };

  const crearInscripcion = async () => {
    if (!torneo || !categoriaSeleccionada) return;
    setSubmitting(true);
    try {
      const payload: any = {
        tournamentId: torneo.id,
        categoryId: categoriaSeleccionada,
        modoPago: 'COMPLETO',
      };
      if (jugador2) payload.jugador2Id = jugador2.id;
      else {
        payload.jugador2NoRegistrado = {
          ...jugador2NoRegistrado,
          telefono: codigoPais + jugador2NoRegistrado.telefono,
        };
      }
      
      const { data } = await api.post('/inscripciones/public', payload);
      if (data.success) navigate('/inscripciones/my', { state: { success: true } });
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Error creando inscripción');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(precio);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center relative overflow-hidden">
        <BackgroundEffects variant="subtle" showGrid={false} />
        <Loader2 className="w-8 h-8 text-primary animate-spin relative z-10" />
      </div>
    );
  }

  if (!torneo) return null;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return isAuthenticated && (jugador2 || (mostrarFormNuevo && jugador2NoRegistrado.nombre && jugador2NoRegistrado.apellido && jugador2NoRegistrado.documento && jugador2NoRegistrado.email));
      case 2: return categoriaSeleccionada;
      case 3: return consentimiento;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white font-light relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      <header className="border-b border-white/5 bg-dark/80 backdrop-blur-md sticky top-0 z-50 relative">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Link to={`/t/${slug}`} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                  disabled={currentStep <= step.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all ${
                    currentStep >= step.id ? 'bg-white/10 text-white' : 'text-white/20'
                  } ${currentStep > step.id ? 'hover:bg-white/15 cursor-pointer' : ''}`}
                >
                  <step.icon className="w-3.5 h-3.5" />
                  {step.title}
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-2 ${currentStep > step.id ? 'bg-white/20' : 'bg-white/5'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-medium">
                  {user?.nombre?.[0]}{user?.apellido?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.nombre} {user?.apellido}</p>
                  <p className="text-xs text-white/40">{userProfile?.categoria?.nombre || 'Sin categoría'}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              </div>

              <div className="h-px bg-white/5" />

              {!jugador2 && !mostrarFormNuevo && (
                <div className="space-y-3">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Jugador 2</p>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="text"
                        placeholder="Nombre, apellido o documento..."
                        value={busquedaQuery}
                        onChange={(e) => setBusquedaQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && buscarJugador()}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                    <button
                      onClick={buscarJugador}
                      disabled={buscando || !busquedaQuery.trim()}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white rounded-lg transition-colors text-sm"
                    >
                      {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                    </button>
                  </div>

                  {busquedaResultados.length > 0 && (
                    <div className="space-y-1">
                      {busquedaResultados.map((jugador: any, idx: number) => {
                        const selected = jugador2 && (jugador2 as any).id === jugador.id;
                        return (
                          <button
                            key={idx}
                            onClick={() => { setJugador2(jugador); setMostrarFormNuevo(false); }}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all text-left"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${jugador.genero === 'FEMENINO' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {jugador.nombre[0]}{jugador.apellido[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{jugador.nombre} {jugador.apellido}</p>
                              <p className="text-xs text-white/40">{jugador.documento} • {jugador.categoria?.nombre || 'Sin categoría'}</p>
                            </div>
                            {selected && <Check className="w-4 h-4 text-blue-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {busquedaResultados.length === 0 && (
                    <button
                      onClick={() => setMostrarFormNuevo(true)}
                      className="w-full p-3 border border-dashed border-white/20 rounded-lg text-sm text-white/60 hover:text-white hover:border-white/40 transition-colors"
                    >
                      + Invitar jugador no registrado
                    </button>
                  )}
                </div>
              )}

              {mostrarFormNuevo && !jugador2 && (
                <div className="space-y-3 p-3 border border-white/10 rounded-lg bg-white/[0.01]">
                  <p className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    Invitar nuevo jugador
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Nombre" value={jugador2NoRegistrado.nombre} onChange={(e) => setJugador2NoRegistrado(p => ({ ...p, nombre: e.target.value }))} className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50" />
                    <input type="text" placeholder="Apellido" value={jugador2NoRegistrado.apellido} onChange={(e) => setJugador2NoRegistrado(p => ({ ...p, apellido: e.target.value }))} className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <input type="text" placeholder="Documento" value={jugador2NoRegistrado.documento} onChange={(e) => setJugador2NoRegistrado(p => ({ ...p, documento: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50" />
                  <div className="flex gap-2">
                    <select value={codigoPais} onChange={(e) => setCodigoPais(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                      {CODIGOS_PAIS.map(c => (
                        <option key={c.codigo} value={c.codigo} className="bg-[#0a0b0f]">{c.bandera} {c.codigo}</option>
                      ))}
                    </select>
                    <input type="tel" placeholder="Teléfono" value={jugador2NoRegistrado.telefono} onChange={(e) => setJugador2NoRegistrado(p => ({ ...p, telefono: e.target.value }))} className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <input type="email" placeholder="Email" value={jugador2NoRegistrado.email} onChange={(e) => setJugador2NoRegistrado(p => ({ ...p, email: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50" />
                </div>
              )}

              {jugador2 && (
                <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-green-500/30 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${jugador2.genero === 'FEMENINO' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {jugador2.nombre[0]}{jugador2.apellido[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{jugador2.nombre} {jugador2.apellido}</p>
                    <p className="text-xs text-white/40">{jugador2.categoria?.nombre || 'Sin categoría'}</p>
                  </div>
                  <button onClick={() => setJugador2(null)} className="text-white/20 hover:text-white/60 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Categorías disponibles</p>
                {categoriasFiltradas.length === 0 && (
                  <div className="p-4 border border-white/10 rounded-lg text-center">
                    <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-white/60">No hay categorías disponibles para tu perfil</p>
                  </div>
                )}
                <div className="space-y-1">
                  {categoriasFiltradas.map((cat: any) => {
                    const puedeSeleccionar = puedeInscribirseEnCategoria(cat);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSeleccionarCategoria(cat)}
                        disabled={!puedeSeleccionar}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          categoriaSeleccionada === cat.id
                            ? cat.tipo === 'FEMENINO' ? 'bg-pink-500/10 border-pink-500/50' : 'bg-blue-500/10 border-blue-500/50'
                            : puedeSeleccionar 
                              ? 'bg-white/[0.02] border-white/5 hover:border-white/20'
                              : 'bg-white/[0.01] border-white/5 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${cat.tipo === 'FEMENINO' ? 'bg-pink-400' : 'bg-blue-400'}`} />
                          <div className="text-left">
                            <p className="text-sm font-medium">{cat.nombre}</p>
                            <p className="text-xs text-white/40">{cat.tipo === 'FEMENINO' ? 'Damas' : 'Caballeros'}</p>
                            {!puedeSeleccionar && (
                              <p className="text-xs text-yellow-500/70">No disponible para tu perfil</p>
                            )}
                          </div>
                        </div>
                        {categoriaSeleccionada === cat.id && <CheckCircle className={`w-4 h-4 ${cat.tipo === 'FEMENINO' ? 'text-pink-400' : 'text-blue-400'}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <img src={torneo.flyerUrl} alt="" className="w-14 h-14 rounded-lg object-cover bg-white/5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{torneo.nombre}</p>
                    <p className="text-xs text-white/40">{torneo.ciudad}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium">{formatPrecio(Number(torneo.costoInscripcion))}</p>
                  </div>
                </div>
                <div className="h-px bg-white/5" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Jugador 1</p>
                    <p className="truncate">{user?.nombre} {user?.apellido}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Jugador 2</p>
                    <p className="truncate">{jugador2 ? `${jugador2.nombre} ${jugador2.apellido}` : `${jugador2NoRegistrado.nombre} ${jugador2NoRegistrado.apellido}`}</p>
                  </div>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Categoría</p>
                    <p className="text-sm">{torneo.categorias.find((c: any) => c.id === categoriaSeleccionada)?.nombre}</p>
                  </div>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer p-3 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
                <input type="checkbox" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed">Confirmo que mi compañero/a me ha dado su consentimiento para inscribirlo/a. Ambos aceptamos las normativas de FairPadel.</p>
              </label>
              {/* TODO: Conectar datos bancarios reales del organizador */}
              {/* <div className="p-3 border border-white/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-white/40" />
                  <p className="text-xs text-white/40 uppercase tracking-wider">Datos para transferencia</p>
                </div>
                <div className="space-y-1 text-xs text-white/60">
                  <p><span className="text-white/30">Banco:</span> Banco Continental</p>
                  <p><span className="text-white/30">Titular:</span> {torneo.organizador?.nombre || 'Organizador'}</p>
                  <p><span className="text-white/30">Cuenta:</span> 1234567890</p>
                  <p><span className="text-white/30">Alias:</span> TORNEO.PADEL</p>
                </div>
              </div> */}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
          <button onClick={() => setCurrentStep(p => p - 1)} disabled={currentStep === 1} className="text-sm text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors">Anterior</button>
          {currentStep < 3 ? (
            <button onClick={() => setCurrentStep(p => p + 1)} disabled={!canProceed()} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm">Siguiente<ArrowRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={crearInscripcion} disabled={!canProceed() || submitting} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/80 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Confirmar</button>
          )}
        </div>
      </main>
    </div>
  );
}
