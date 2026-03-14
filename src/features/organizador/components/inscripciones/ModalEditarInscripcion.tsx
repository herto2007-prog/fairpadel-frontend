import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, Search, Check, CreditCard, Loader2, UserPlus
} from 'lucide-react';
import { api } from '../../../../services/api';


interface Jugador {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fotoUrl?: string;
}

interface Inscripcion {
  id: string;
  jugador1: Jugador;
  jugador2?: Jugador;
  jugador2Email?: string;
  jugador2Documento?: string;
  estado: string;
  modoPago?: 'COMPLETO' | 'INDIVIDUAL';
  notas?: string;
}

interface ModalEditarInscripcionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentId: string;
  inscripcion: Inscripcion | null;
}

export function ModalEditarInscripcion({
  isOpen,
  onClose,
  onSuccess,
  tournamentId,
  inscripcion,
}: ModalEditarInscripcionProps) {
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Jugador[]>([]);
  const [buscando, setBuscando] = useState(false);
  
  // Datos editables
  const [jugador2, setJugador2] = useState<Jugador | null>(null);
  const [jugador2Temp, setJugador2Temp] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    documento: '',
  });
  const [modoJugador2Temp, setModoJugador2Temp] = useState(false);
  const [modoPago, setModoPago] = useState<'COMPLETO' | 'INDIVIDUAL'>('COMPLETO');
  const [notas, setNotas] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    if (inscripcion && isOpen) {
      setJugador2(inscripcion.jugador2 || null);
      setModoPago(inscripcion.modoPago || 'COMPLETO');
      setNotas(inscripcion.notas || '');
      setJugador2Temp({
        nombre: '',
        apellido: '',
        email: inscripcion.jugador2Email || '',
        telefono: '',
        documento: inscripcion.jugador2Documento || '',
      });
      setModoJugador2Temp(false);
      setBusqueda('');
      setResultados([]);
    }
  }, [inscripcion, isOpen]);

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
        // Excluir jugador1
        const filtrados = data.jugadores.filter((j: Jugador) => j.id !== inscripcion?.jugador1.id);
        setResultados(filtrados);
      }
    } catch (error) {
      console.error('Error buscando:', error);
    } finally {
      setBuscando(false);
    }
  }, [tournamentId, inscripcion]);

  useEffect(() => {
    const timeout = setTimeout(() => buscarJugadores(busqueda), 300);
    return () => clearTimeout(timeout);
  }, [busqueda, buscarJugadores]);

  const handleGuardar = async () => {
    if (!inscripcion) return;
    setLoading(true);
    try {
      const body: any = {
        modoPago,
        notas: notas || undefined,
      };

      if (jugador2) {
        body.jugador2Id = jugador2.id;
      } else if (modoJugador2Temp) {
        body.jugador2Temp = jugador2Temp;
      }

      await api.put(`/admin/torneos/${tournamentId}/inscripciones/${inscripcion.id}`, body);
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error guardando cambios');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !inscripcion) return null;

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
          className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#232838]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Save className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Editar Inscripción</h3>
                <p className="text-sm text-gray-400">
                  {inscripcion.jugador1.nombre} {inscripcion.jugador1.apellido}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#232838] rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Jugador 2 */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Jugador 2 (pareja)</label>
              
              {/* Tabs */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => { setJugador2(null); setModoJugador2Temp(false); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !modoJugador2Temp && !jugador2 ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400'
                  }`}
                >
                  Buscar registrado
                </button>
                <button
                  onClick={() => { setJugador2(null); setModoJugador2Temp(true); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    modoJugador2Temp ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400'
                  }`}
                >
                  Temporal
                </button>
                {inscripcion.jugador2 && (
                  <button
                    onClick={() => { setJugador2(inscripcion.jugador2!); setModoJugador2Temp(false); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      jugador2?.id === inscripcion.jugador2?.id ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400'
                    }`}
                  >
                    Actual
                  </button>
                )}
              </div>

              {!modoJugador2Temp ? (
                // Buscar jugador 2
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar jugador..."
                      className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] text-sm"
                    />
                    {buscando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#df2531] animate-spin" />}
                  </div>
                  
                  {jugador2 && (
                    <div className="flex items-center gap-3 p-3 bg-[#df2531]/10 border border-[#df2531] rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {jugador2.nombre[0]}{jugador2.apellido[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{jugador2.nombre} {jugador2.apellido}</p>
                        <p className="text-xs text-gray-400">{jugador2.email}</p>
                      </div>
                      <Check className="w-5 h-5 text-[#df2531]" />
                    </div>
                  )}

                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {resultados.map((j) => (
                      <button
                        key={j.id}
                        onClick={() => setJugador2(j)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#232838] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#232838] flex items-center justify-center text-white font-bold text-xs">
                          {j.nombre[0]}{j.apellido[0]}
                        </div>
                        <span className="text-sm text-white">{j.nombre} {j.apellido}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Formulario temporal
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={jugador2Temp.nombre}
                      onChange={(e) => setJugador2Temp({ ...jugador2Temp, nombre: e.target.value })}
                      placeholder="Nombre"
                      className="px-3 py-2 bg-[#0B0E14] border border-[#232838] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] text-sm"
                    />
                    <input
                      type="text"
                      value={jugador2Temp.apellido}
                      onChange={(e) => setJugador2Temp({ ...jugador2Temp, apellido: e.target.value })}
                      placeholder="Apellido"
                      className="px-3 py-2 bg-[#0B0E14] border border-[#232838] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] text-sm"
                    />
                  </div>
                  <input
                    type="email"
                    value={jugador2Temp.email}
                    onChange={(e) => setJugador2Temp({ ...jugador2Temp, email: e.target.value })}
                    placeholder="Email"
                    className="w-full px-3 py-2 bg-[#0B0E14] border border-[#232838] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] text-sm"
                  />
                  <input
                    type="tel"
                    value={jugador2Temp.telefono}
                    onChange={(e) => setJugador2Temp({ ...jugador2Temp, telefono: e.target.value })}
                    placeholder="Teléfono"
                    className="w-full px-3 py-2 bg-[#0B0E14] border border-[#232838] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] text-sm"
                  />
                </div>
              )}
            </div>

            {/* Modo de pago */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Modo de pago</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setModoPago('COMPLETO')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
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
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                    modoPago === 'INDIVIDUAL'
                      ? 'bg-[#df2531]/10 border-[#df2531] text-white'
                      : 'bg-[#0B0E14] border-[#232838] text-gray-400'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Cada uno paga
                </button>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Notas</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas del organizador..."
                rows={3}
                className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-[#232838] bg-[#0B0E14]">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar Cambios
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
