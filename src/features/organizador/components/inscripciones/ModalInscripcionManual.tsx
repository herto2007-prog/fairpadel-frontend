import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, UserPlus, Search, Check, ChevronRight,
  Loader2, Phone, Mail, Users, Trophy, AlertCircle,
  User, ChevronLeft
} from 'lucide-react';
import { api } from '../../../../services/api';

interface Jugador {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  documento?: string;
  fotoUrl?: string;
  categoriaActual?: {
    id: string;
    nombre: string;
    tipo: string;
  };
}

interface Categoria {
  categoriaId: string;
  categoriaNombre: string;
  categoriaTipo: 'MASCULINO' | 'FEMENINO';
  total: number;
}

interface ModalInscripcionManualProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentId: string;
  categorias: Categoria[];
  costoInscripcion: number;
}

type Paso = 'categoria' | 'jugador1' | 'jugador2' | 'confirmar';

const PASOS: { key: Paso; label: string }[] = [
  { key: 'categoria', label: 'Categoría' },
  { key: 'jugador1', label: 'Jugador 1' },
  { key: 'jugador2', label: 'Jugador 2' },
  { key: 'confirmar', label: 'Confirmar' },
];

export function ModalInscripcionManual({
  isOpen,
  onClose,
  onSuccess,
  tournamentId,
  categorias,
  costoInscripcion,
}: ModalInscripcionManualProps) {
  const [paso, setPaso] = useState<Paso>('categoria');
  const [loading, setLoading] = useState(false);

  // Paso 1: Categoría
  const [categoriaId, setCategoriaId] = useState('');

  // Paso 2: Jugador 1
  const [jugador1, setJugador1] = useState<Jugador | null>(null);
  const [modoJugador1Temp, setModoJugador1Temp] = useState(false);
  const [jugador1Temp, setJugador1Temp] = useState({ nombre: '', apellido: '', email: '', telefono: '', documento: '' });
  const [busquedaJ1, setBusquedaJ1] = useState('');
  const [resultadosJ1, setResultadosJ1] = useState<Jugador[]>([]);
  const [buscandoJ1, setBuscandoJ1] = useState(false);

  // Paso 3: Jugador 2
  const [jugador2, setJugador2] = useState<Jugador | null>(null);
  const [sinPareja, setSinPareja] = useState(false);
  const [modoJugador2Temp, setModoJugador2Temp] = useState(false);
  const [jugador2Temp, setJugador2Temp] = useState({ nombre: '', apellido: '', email: '', telefono: '', documento: '' });
  const [busquedaJ2, setBusquedaJ2] = useState('');
  const [resultadosJ2, setResultadosJ2] = useState<Jugador[]>([]);
  const [buscandoJ2, setBuscandoJ2] = useState(false);

  // Paso 4: Confirmar
  const [notas, setNotas] = useState('');

  // Reset al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setPaso('categoria');
      setCategoriaId('');
      setJugador1(null);
      setJugador2(null);
      setSinPareja(false);
      setModoJugador1Temp(false);
      setModoJugador2Temp(false);
      setJugador1Temp({ nombre: '', apellido: '', email: '', telefono: '', documento: '' });
      setJugador2Temp({ nombre: '', apellido: '', email: '', telefono: '', documento: '' });
      setBusquedaJ1('');
      setBusquedaJ2('');
      setResultadosJ1([]);
      setResultadosJ2([]);
      setNotas('');
    }
  }, [isOpen]);

  const buscarJugadores = useCallback(async (q: string, setResultados: (r: Jugador[]) => void, setBuscando: (b: boolean) => void, excluirIds: string[]) => {
    if (q.length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/jugadores/buscar?q=${encodeURIComponent(q)}`);
      if (data.success) {
        setResultados(data.jugadores.filter((j: Jugador) => !excluirIds.includes(j.id)));
      }
    } catch (error) {
      console.error('Error buscando:', error);
    } finally {
      setBuscando(false);
    }
  }, [tournamentId]);

  // Debounce búsqueda J1
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarJugadores(busquedaJ1, setResultadosJ1, setBuscandoJ1, []);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaJ1, buscarJugadores]);

  // Debounce búsqueda J2
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarJugadores(busquedaJ2, setResultadosJ2, setBuscandoJ2, jugador1 ? [jugador1.id] : []);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaJ2, jugador1, buscarJugadores]);

  const categoriaSeleccionada = categorias.find(c => c.categoriaId === categoriaId);

  const puedeAvanzar = () => {
    if (paso === 'categoria') return !!categoriaId;
    if (paso === 'jugador1') {
      if (modoJugador1Temp) return jugador1Temp.nombre && jugador1Temp.apellido && jugador1Temp.email;
      return !!jugador1;
    }
    if (paso === 'jugador2') {
      if (sinPareja) return true;
      if (modoJugador2Temp) return jugador2Temp.nombre && jugador2Temp.apellido && jugador2Temp.email;
      return !!jugador2;
    }
    return true;
  };

  const avanzar = () => {
    const idx = PASOS.findIndex(p => p.key === paso);
    if (idx < PASOS.length - 1) setPaso(PASOS[idx + 1].key);
  };

  const retroceder = () => {
    const idx = PASOS.findIndex(p => p.key === paso);
    if (idx > 0) setPaso(PASOS[idx - 1].key);
    else onClose();
  };

  const handleCrear = async () => {
    setLoading(true);
    try {
      const body: any = {
        categoryId: categoriaId,
        modoPago: 'COMPLETO',
        notas: notas || undefined,
      };

      if (modoJugador1Temp) {
        body.jugador1Temp = jugador1Temp;
      } else {
        body.jugador1Id = jugador1!.id;
      }

      if (!sinPareja) {
        if (jugador2) {
          body.jugador2Id = jugador2.id;
        } else if (modoJugador2Temp) {
          body.jugador2Temp = jugador2Temp;
        }
      }

      await api.post(`/admin/torneos/${tournamentId}/inscripciones/manual`, body);
      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error creando inscripción';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#232838]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#df2531]/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-[#df2531]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Inscripción Manual</h3>
                <p className="text-sm text-gray-400">Inscribir pareja paso a paso</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#232838] rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Progress steps */}
          <div className="flex items-center px-6 py-4 bg-[#0B0E14] gap-1">
            {PASOS.map((step, index) => {
              const currentIdx = PASOS.findIndex(p => p.key === paso);
              const isActive = step.key === paso;
              const isCompleted = index < currentIdx;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#df2531] text-white' :
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-[#232838] text-gray-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> :
                      <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                    }
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {index < PASOS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-600 mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* PASO 1: CATEGORÍA */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {paso === 'categoria' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-300">
                    Seleccioná la categoría donde se inscribirá la pareja. El costo es de <strong>Gs. {costoInscripcion.toLocaleString('es-PY')}</strong> por inscripción.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categorias.map((cat) => (
                    <button
                      key={cat.categoriaId}
                      onClick={() => setCategoriaId(cat.categoriaId)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        categoriaId === cat.categoriaId
                          ? 'bg-[#df2531]/10 border-[#df2531]'
                          : 'bg-[#0B0E14] border-[#232838] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-white font-medium">{cat.categoriaNombre}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {cat.categoriaTipo === 'MASCULINO' ? '👨 Caballeros' :
                             cat.categoriaTipo === 'FEMENINO' ? '👩 Damas' : '⚥ Mixto'}
                          </div>
                        </div>
                        {categoriaId === cat.categoriaId && (
                          <div className="w-6 h-6 rounded-full bg-[#df2531] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cat.total} inscritos</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />Gs. {costoInscripcion.toLocaleString('es-PY')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* PASO 2: JUGADOR 1 */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {paso === 'jugador1' && (
              <div className="space-y-4">
                {categoriaSeleccionada && (
                  <div className="bg-[#0B0E14] rounded-xl px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#df2531]" />
                    Categoría: <span className="text-white font-medium">{categoriaSeleccionada.categoriaNombre}</span>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setModoJugador1Temp(false); setJugador1(null); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      !modoJugador1Temp ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400 hover:text-white'
                    }`}
                  >
                    🔍 Buscar registrado
                  </button>
                  <button
                    onClick={() => { setModoJugador1Temp(true); setJugador1(null); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      modoJugador1Temp ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400 hover:text-white'
                    }`}
                  >
                    ✏️ Ingresar temporal
                  </button>
                </div>

                {!modoJugador1Temp ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={busquedaJ1}
                        onChange={(e) => setBusquedaJ1(e.target.value)}
                        placeholder="Buscar por nombre, email o teléfono..."
                        className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                        autoFocus
                      />
                      {buscandoJ1 && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#df2531] animate-spin" />}
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {resultadosJ1.map((jugador) => (
                        <button
                          key={jugador.id}
                          onClick={() => setJugador1(jugador)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                            jugador1?.id === jugador.id
                              ? 'bg-[#df2531]/10 border-[#df2531]'
                              : 'bg-[#0B0E14] border-[#232838] hover:border-gray-600'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#df2531] to-[#ff6b6b] flex items-center justify-center text-white font-bold">
                            {jugador.fotoUrl ? (
                              <img src={jugador.fotoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              `${jugador.nombre[0]}${jugador.apellido[0]}`
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{jugador.nombre} {jugador.apellido}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              {jugador.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{jugador.telefono}</span>}
                              {jugador.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{jugador.email}</span>}
                            </div>
                          </div>
                          {jugador1?.id === jugador.id && <Check className="w-5 h-5 text-[#df2531] shrink-0" />}
                        </button>
                      ))}
                      {busquedaJ1.length >= 2 && resultadosJ1.length === 0 && !buscandoJ1 && (
                        <div className="text-center py-6">
                          <p className="text-gray-500 text-sm mb-2">No se encontraron jugadores</p>
                          <button
                            onClick={() => { setModoJugador1Temp(true); setJugador1Temp({ ...jugador1Temp, nombre: busquedaJ1 }); }}
                            className="text-[#df2531] text-sm hover:underline"
                          >
                            Ingresar como jugador temporal →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-400 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      Se creará un usuario temporal. El jugador podrá registrarse formalmente más tarde con el mismo email.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text" value={jugador1Temp.nombre}
                        onChange={(e) => setJugador1Temp({ ...jugador1Temp, nombre: e.target.value })}
                        placeholder="Nombre *" className="input-temp"
                      />
                      <input
                        type="text" value={jugador1Temp.apellido}
                        onChange={(e) => setJugador1Temp({ ...jugador1Temp, apellido: e.target.value })}
                        placeholder="Apellido *" className="input-temp"
                      />
                    </div>
                    <input
                      type="email" value={jugador1Temp.email}
                      onChange={(e) => setJugador1Temp({ ...jugador1Temp, email: e.target.value })}
                      placeholder="Email * (para recuperar cuenta)" className="input-temp"
                    />
                    <input
                      type="tel" value={jugador1Temp.telefono}
                      onChange={(e) => setJugador1Temp({ ...jugador1Temp, telefono: e.target.value })}
                      placeholder="Teléfono (opcional)" className="input-temp"
                    />
                    <input
                      type="text" value={jugador1Temp.documento}
                      onChange={(e) => setJugador1Temp({ ...jugador1Temp, documento: e.target.value })}
                      placeholder="Documento (opcional)" className="input-temp"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* PASO 3: JUGADOR 2 */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {paso === 'jugador2' && (
              <div className="space-y-4">
                {/* Jugador 1 seleccionado */}
                <div className="bg-[#0B0E14] rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#df2531]/20 flex items-center justify-center text-[#df2531] text-xs font-bold">1</div>
                  <div>
                    <div className="text-white font-medium">
                      {modoJugador1Temp ? `${jugador1Temp.nombre} ${jugador1Temp.apellido}` : `${jugador1?.nombre} ${jugador1?.apellido}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {modoJugador1Temp ? jugador1Temp.email : jugador1?.email}
                    </div>
                  </div>
                </div>

                {/* Opción sin pareja */}
                <button
                  onClick={() => setSinPareja(!sinPareja)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    sinPareja
                      ? 'bg-amber-500/10 border-amber-500'
                      : 'bg-[#0B0E14] border-[#232838] hover:border-gray-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sinPareja ? 'bg-amber-500 text-white' : 'bg-[#232838] text-gray-500'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${sinPareja ? 'text-amber-400' : 'text-white'}`}>Inscribir sin pareja</div>
                    <div className="text-sm text-gray-500">El jugador buscará compañero después</div>
                  </div>
                  {sinPareja && <Check className="w-5 h-5 text-amber-500" />}
                </button>

                {!sinPareja && (
                  <>
                    {/* Tabs */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setModoJugador2Temp(false); setJugador2(null); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          !modoJugador2Temp ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400 hover:text-white'
                        }`}
                      >
                        🔍 Buscar registrado
                      </button>
                      <button
                        onClick={() => { setModoJugador2Temp(true); setJugador2(null); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          modoJugador2Temp ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400 hover:text-white'
                        }`}
                      >
                        ✏️ Ingresar temporal
                      </button>
                    </div>

                    {!modoJugador2Temp ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="text"
                            value={busquedaJ2}
                            onChange={(e) => setBusquedaJ2(e.target.value)}
                            placeholder="Buscar segundo jugador..."
                            className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                          />
                          {buscandoJ2 && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#df2531] animate-spin" />}
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {resultadosJ2.map((jugador) => (
                            <button
                              key={jugador.id}
                              onClick={() => setJugador2(jugador)}
                              className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left ${
                                jugador2?.id === jugador.id
                                  ? 'bg-[#df2531]/10 border-[#df2531]'
                                  : 'bg-[#0B0E14] border-[#232838] hover:border-gray-600'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                {jugador.nombre[0]}{jugador.apellido[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">{jugador.nombre} {jugador.apellido}</p>
                                <p className="text-xs text-gray-500">{jugador.telefono || jugador.email || ''}</p>
                              </div>
                              {jugador2?.id === jugador.id && <Check className="w-5 h-5 text-[#df2531] shrink-0" />}
                            </button>
                          ))}
                          {busquedaJ2.length >= 2 && resultadosJ2.length === 0 && !buscandoJ2 && (
                            <div className="text-center py-4">
                              <p className="text-gray-500 text-sm mb-2">No se encontraron jugadores</p>
                              <button
                                onClick={() => { setModoJugador2Temp(true); setJugador2Temp({ ...jugador2Temp, nombre: busquedaJ2 }); }}
                                className="text-[#df2531] text-sm hover:underline"
                              >
                                Ingresar como jugador temporal →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-400 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          Se creará un usuario temporal para el jugador 2.
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text" value={jugador2Temp.nombre}
                            onChange={(e) => setJugador2Temp({ ...jugador2Temp, nombre: e.target.value })}
                            placeholder="Nombre *" className="input-temp"
                          />
                          <input
                            type="text" value={jugador2Temp.apellido}
                            onChange={(e) => setJugador2Temp({ ...jugador2Temp, apellido: e.target.value })}
                            placeholder="Apellido *" className="input-temp"
                          />
                        </div>
                        <input
                          type="email" value={jugador2Temp.email}
                          onChange={(e) => setJugador2Temp({ ...jugador2Temp, email: e.target.value })}
                          placeholder="Email *" className="input-temp"
                        />
                        <input
                          type="tel" value={jugador2Temp.telefono}
                          onChange={(e) => setJugador2Temp({ ...jugador2Temp, telefono: e.target.value })}
                          placeholder="Teléfono (opcional)" className="input-temp"
                        />
                        <input
                          type="text" value={jugador2Temp.documento}
                          onChange={(e) => setJugador2Temp({ ...jugador2Temp, documento: e.target.value })}
                          placeholder="Documento (opcional)" className="input-temp"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* PASO 4: CONFIRMAR */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {paso === 'confirmar' && (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-400 flex items-start gap-2">
                  <Check className="w-5 h-5 shrink-0" />
                  Revisá los datos antes de confirmar la inscripción.
                </div>

                {/* Resumen visual */}
                <div className="bg-[#0B0E14] rounded-xl p-4 space-y-4">
                  {/* Categoría */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#232838]">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Trophy className="w-4 h-4" /> Categoría
                    </div>
                    <div className="text-white font-medium">{categoriaSeleccionada?.categoriaNombre}</div>
                  </div>

                  {/* Jugador 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#df2531]/20 flex items-center justify-center text-[#df2531] text-xs font-bold shrink-0">1</div>
                    <div>
                      <div className="text-white font-medium">
                        {modoJugador1Temp ? `${jugador1Temp.nombre} ${jugador1Temp.apellido}` : `${jugador1?.nombre} ${jugador1?.apellido}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {modoJugador1Temp ? (
                          <span className="text-amber-400">Jugador temporal</span>
                        ) : (
                          <span className="text-emerald-400">Registrado</span>
                        )}
                        {modoJugador1Temp && jugador1Temp.email && ` • ${jugador1Temp.email}`}
                        {!modoJugador1Temp && jugador1?.email && ` • ${jugador1.email}`}
                      </div>
                    </div>
                  </div>

                  {/* Jugador 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">2</div>
                    <div>
                      {sinPareja ? (
                        <div>
                          <div className="text-amber-500 font-medium">Sin pareja</div>
                          <div className="text-sm text-gray-500">Buscará compañero después</div>
                        </div>
                      ) : modoJugador2Temp ? (
                        <div>
                          <div className="text-white font-medium">{jugador2Temp.nombre} {jugador2Temp.apellido}</div>
                          <div className="text-sm text-amber-400">Jugador temporal {jugador2Temp.email && `• ${jugador2Temp.email}`}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-white font-medium">{jugador2?.nombre} {jugador2?.apellido}</div>
                          <div className="text-sm text-emerald-400">Registrado {jugador2?.email && `• ${jugador2.email}`}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Notas (opcional)</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ej: Se inscribió por WhatsApp, pagará en la sede..."
                    rows={2}
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-[#232838] bg-[#0B0E14]">
            <button
              onClick={retroceder}
              className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {paso === 'categoria' ? 'Cancelar' : 'Atrás'}
            </button>

            {paso !== 'confirmar' ? (
              <button
                onClick={avanzar}
                disabled={!puedeAvanzar()}
                className="flex items-center gap-2 px-6 py-3 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
              >
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCrear}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear Inscripción
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
