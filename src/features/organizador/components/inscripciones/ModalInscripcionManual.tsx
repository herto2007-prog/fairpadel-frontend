import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, UserPlus, Search, Check, ChevronRight, 
  User, Phone, DollarSign, CreditCard, Loader2
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
}

interface ModalInscripcionManualProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentId: string;
  categorias: Categoria[];
  costoInscripcion: number;
}

type Paso = 'jugador1' | 'jugador2' | 'confirmar';

export function ModalInscripcionManual({
  isOpen,
  onClose,
  onSuccess,
  tournamentId,
  categorias,
  costoInscripcion,
}: ModalInscripcionManualProps) {
  const [paso, setPaso] = useState<Paso>('jugador1');
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Jugador[]>([]);
  const [buscando, setBuscando] = useState(false);
  
  // Datos del formulario
  const [jugador1, setJugador1] = useState<Jugador | null>(null);
  const [jugador2, setJugador2] = useState<Jugador | null>(null);
  const [jugador2Temp, setJugador2Temp] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    documento: '',
  });
  const [categoriaId, setCategoriaId] = useState('');
  const [modoPago, setModoPago] = useState<'COMPLETO' | 'INDIVIDUAL'>('COMPLETO');
  const [montoPagado, setMontoPagado] = useState(costoInscripcion);
  const [notas, setNotas] = useState('');
  const [sinPareja, setSinPareja] = useState(false);
  const [modoJugador2Temp, setModoJugador2Temp] = useState(false);

  // Buscar jugadores
  const buscarJugadores = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/jugadores/buscar?q=${encodeURIComponent(q)}`);
      if (data.success) {
        setResultados(data.jugadores);
      }
    } catch (error) {
      console.error('Error buscando:', error);
    } finally {
      setBuscando(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    const timeout = setTimeout(() => buscarJugadores(busqueda), 300);
    return () => clearTimeout(timeout);
  }, [busqueda, buscarJugadores]);

  // Resetear al cerrar
  useEffect(() => {
    if (!isOpen) {
      setPaso('jugador1');
      setJugador1(null);
      setJugador2(null);
      setJugador2Temp({ nombre: '', apellido: '', email: '', telefono: '', documento: '' });
      setCategoriaId('');
      setBusqueda('');
      setResultados([]);
      setMontoPagado(costoInscripcion);
      setNotas('');
      setSinPareja(false);
    }
  }, [isOpen, costoInscripcion]);

  const handleCrear = async () => {
    setLoading(true);
    try {
      const body: any = {
        categoryId: categoriaId,
        jugador1Id: jugador1!.id,
        modoPago,
        montoPagado: montoPagado || 0,
        notas: notas || undefined,
      };

      if (jugador2) {
        body.jugador2Id = jugador2.id;
      } else if (!sinPareja) {
        body.jugador2Temp = jugador2Temp;
      }

      await api.post(`/admin/torneos/${tournamentId}/inscripciones/manual`, body);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creando inscripción:', error.response?.data?.message || 'Error creando inscripción');
    } finally {
      setLoading(false);
    }
  };

  const puedeContinuar = () => {
    if (paso === 'jugador1') return !!jugador1;
    if (paso === 'jugador2') {
      if (sinPareja) return true;
      if (jugador2) return true;
      return jugador2Temp.nombre && jugador2Temp.apellido && jugador2Temp.email;
    }
    return true;
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
                <p className="text-sm text-gray-400">Inscribir pareja manualmente</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#232838] rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Progress steps */}
          <div className="flex items-center px-6 py-4 bg-[#0B0E14]">
            {[
              { key: 'jugador1', label: 'Jugador 1' },
              { key: 'jugador2', label: 'Jugador 2' },
              { key: 'confirmar', label: 'Confirmar' },
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  paso === step.key 
                    ? 'bg-[#df2531] text-white' 
                    : index < ['jugador1', 'jugador2', 'confirmar'].indexOf(paso)
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-[#232838] text-gray-500'
                }`}>
                  {index < ['jugador1', 'jugador2', 'confirmar'].indexOf(paso) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {index < 2 && (
                  <ChevronRight className="w-4 h-4 text-gray-600 mx-2" />
                )}
              </div>
            ))}
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* PASO 1: JUGADOR 1 */}
            {paso === 'jugador1' && (
              <div className="space-y-4">
                <p className="text-gray-400">Busca y selecciona el primer jugador:</p>
                
                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                    autoFocus
                  />
                  {buscando && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#df2531] animate-spin" />
                  )}
                </div>

                {/* Resultados */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {resultados.map((jugador) => (
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
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {jugador.nombre} {jugador.apellido}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {jugador.categoriaActual && (
                            <span className="text-[#df2531]">{jugador.categoriaActual.nombre}</span>
                          )}
                          {jugador.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {jugador.telefono}
                            </span>
                          )}
                        </div>
                      </div>
                      {jugador1?.id === jugador.id && (
                        <Check className="w-5 h-5 text-[#df2531]" />
                      )}
                    </button>
                  ))}
                  {busqueda.length >= 2 && resultados.length === 0 && !buscando && (
                    <p className="text-center text-gray-500 py-4">No se encontraron jugadores</p>
                  )}
                </div>
              </div>
            )}

            {/* PASO 2: JUGADOR 2 */}
            {paso === 'jugador2' && (
              <div className="space-y-4">
                {/* Opción: Sin pareja */}
                <label className="flex items-center gap-3 p-4 bg-[#0B0E14] rounded-xl border border-[#232838] cursor-pointer hover:border-amber-500/50">
                  <input
                    type="checkbox"
                    checked={sinPareja}
                    onChange={(e) => setSinPareja(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 text-[#df2531] focus:ring-[#df2531]"
                  />
                  <span className="text-white">Inscribir sin pareja (buscará compañero después)</span>
                </label>

                {!sinPareja && (
                  <>
                    <p className="text-gray-400">Busca el segundo jugador o ingresa datos temporales:</p>
                    
                    {/* Tabs */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setJugador2(null); setModoJugador2Temp(false); setJugador2Temp({ nombre: '', apellido: '', email: '', telefono: '', documento: '' }); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          !modoJugador2Temp ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400'
                        }`}
                      >
                        Buscar registrado
                      </button>
                      <button
                        onClick={() => setModoJugador2Temp(true)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          modoJugador2Temp ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400'
                        }`}
                      >
                        Ingresar temporal
                      </button>
                    </div>

                    {!modoJugador2Temp ? (
                      // Buscar jugador 2
                      <>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar segundo jugador..."
                            className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                          />
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {resultados.filter(j => j.id !== jugador1?.id).map((jugador) => (
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
                              <div className="flex-1">
                                <p className="text-white font-medium">{jugador.nombre} {jugador.apellido}</p>
                                {jugador.categoriaActual && (
                                  <p className="text-xs text-blue-400">{jugador.categoriaActual.nombre}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      // Formulario jugador temporal
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={jugador2Temp.nombre}
                            onChange={(e) => setJugador2Temp({ ...jugador2Temp, nombre: e.target.value })}
                            placeholder="Nombre"
                            className="px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                          />
                          <input
                            type="text"
                            value={jugador2Temp.apellido}
                            onChange={(e) => setJugador2Temp({ ...jugador2Temp, apellido: e.target.value })}
                            placeholder="Apellido"
                            className="px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                          />
                        </div>
                        <input
                          type="email"
                          value={jugador2Temp.email}
                          onChange={(e) => setJugador2Temp({ ...jugador2Temp, email: e.target.value })}
                          placeholder="Email (para invitación)"
                          className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                        />
                        <input
                          type="tel"
                          value={jugador2Temp.telefono}
                          onChange={(e) => setJugador2Temp({ ...jugador2Temp, telefono: e.target.value })}
                          placeholder="Teléfono (opcional)"
                          className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                        />
                        <input
                          type="text"
                          value={jugador2Temp.documento}
                          onChange={(e) => setJugador2Temp({ ...jugador2Temp, documento: e.target.value })}
                          placeholder="Documento (opcional)"
                          className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* PASO 3: CONFIRMAR */}
            {paso === 'confirmar' && (
              <div className="space-y-4">
                {/* Categoría */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Categoría</label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categorias.map((cat) => (
                      <option key={cat.categoriaId} value={cat.categoriaId}>
                        {cat.categoriaNombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modo de pago */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Modo de pago</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModoPago('COMPLETO')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                        modoPago === 'COMPLETO'
                          ? 'bg-[#df2531]/10 border-[#df2531] text-white'
                          : 'bg-[#0B0E14] border-[#232838] text-gray-400'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Uno paga todo
                    </button>
                    <button
                      onClick={() => setModoPago('INDIVIDUAL')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                        modoPago === 'INDIVIDUAL'
                          ? 'bg-[#df2531]/10 border-[#df2531] text-white'
                          : 'bg-[#0B0E14] border-[#232838] text-gray-400'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      Cada uno paga
                    </button>
                  </div>
                </div>

                {/* Monto pagado */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Monto pagado (Gs.)</label>
                  <input
                    type="number"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white focus:outline-none focus:border-[#df2531]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Costo: Gs. {costoInscripcion.toLocaleString('es-PY')} | 
                    {montoPagado >= costoInscripcion ? (
                      <span className="text-green-500"> Pago completo</span>
                    ) : (
                      <span className="text-amber-500"> Pendiente: Gs. {(costoInscripcion - montoPagado).toLocaleString('es-PY')}</span>
                    )}
                  </p>
                </div>

                {/* Notas */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Notas (opcional)</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ej: Pagó en efectivo, se inscribió por WhatsApp..."
                    rows={2}
                    className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] resize-none"
                  />
                </div>

                {/* Resumen */}
                <div className="bg-[#0B0E14] rounded-xl p-4 space-y-2">
                  <h4 className="font-medium text-white">Resumen</h4>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Jugador 1:</span>
                    <span className="text-white">{jugador1?.nombre} {jugador1?.apellido}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Jugador 2:</span>
                    {sinPareja ? (
                      <span className="text-amber-500">Sin pareja (buscará después)</span>
                    ) : jugador2 ? (
                      <span className="text-white">{jugador2.nombre} {jugador2.apellido}</span>
                    ) : (
                      <span className="text-white">{jugador2Temp.nombre} {jugador2Temp.apellido} (temporal)</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-[#232838] bg-[#0B0E14]">
            <button
              onClick={() => {
                if (paso === 'jugador1') onClose();
                else if (paso === 'jugador2') setPaso('jugador1');
                else setPaso('jugador2');
              }}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              {paso === 'jugador1' ? 'Cancelar' : 'Atrás'}
            </button>

            {paso !== 'confirmar' ? (
              <button
                onClick={() => setPaso(paso === 'jugador1' ? 'jugador2' : 'confirmar')}
                disabled={!puedeContinuar()}
                className="flex items-center gap-2 px-6 py-3 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
              >
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCrear}
                disabled={!categoriaId || loading}
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
