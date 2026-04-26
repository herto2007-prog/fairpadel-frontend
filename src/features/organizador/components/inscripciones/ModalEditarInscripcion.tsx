import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Check, Loader2, Phone, Mail } from 'lucide-react';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';

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
  estado: string;
  categoriaId: string;
  categoriaNombre: string;
}

interface Categoria {
  categoriaId: string;
  categoriaNombre: string;
  categoriaTipo: 'MASCULINO' | 'FEMENINO';
}

interface ModalEditarInscripcionProps {
  inscripcion: Inscripcion;
  tournamentId: string;
  categorias: Categoria[];
  onClose: () => void;
  onSuccess: () => void;
}

type TabEditar = 'categoria' | 'pareja';

export function ModalEditarInscripcion({
  inscripcion,
  tournamentId,
  categorias,
  onClose,
  onSuccess,
}: ModalEditarInscripcionProps) {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabEditar>('categoria');
  const [loading, setLoading] = useState(false);

  // Categoría
  const [nuevaCategoriaId, setNuevaCategoriaId] = useState(inscripcion.categoriaId);

  // Pareja
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Jugador[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [jugador2Seleccionado, setJugador2Seleccionado] = useState<Jugador | null>(inscripcion.jugador2 || null);
  const [sinPareja, setSinPareja] = useState(!inscripcion.jugador2);
  const [jugador2Temp, setJugador2Temp] = useState({
    nombre: inscripcion.jugador2?.nombre || '',
    apellido: inscripcion.jugador2?.apellido || '',
    email: inscripcion.jugador2?.email || '',
    telefono: inscripcion.jugador2?.telefono || '',
  });
  const [modoJugador2Temp, setModoJugador2Temp] = useState(false);

  const buscarJugadores = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const { data } = await api.get(`/admin/torneos/${tournamentId}/jugadores/buscar?q=${encodeURIComponent(q)}`);
      if (data.success) {
        // Excluir jugador1 y el jugador2 actual de los resultados
        const filtrados = data.jugadores.filter(
          (j: Jugador) => j.id !== inscripcion.jugador1.id && j.id !== inscripcion.jugador2?.id
        );
        setResultados(filtrados);
      }
    } catch (error) {
      console.error('Error buscando:', error);
    } finally {
      setBuscando(false);
    }
  }, [tournamentId, inscripcion.jugador1.id, inscripcion.jugador2?.id]);

  useEffect(() => {
    const timeout = setTimeout(() => buscarJugadores(busqueda), 300);
    return () => clearTimeout(timeout);
  }, [busqueda, buscarJugadores]);

  const guardarCambios = async () => {
    setLoading(true);
    try {
      if (activeTab === 'categoria' && nuevaCategoriaId !== inscripcion.categoriaId) {
        await api.put(`/admin/torneos/${tournamentId}/inscripciones/${inscripcion.id}/cambiar-categoria`, {
          nuevaCategoriaId,
        });
        showSuccess('Categoría actualizada', 'La inscripción fue movida a la nueva categoría');
      }

      if (activeTab === 'pareja') {
        const body: any = {};
        if (sinPareja) {
          body.jugador2Id = null;
        } else if (jugador2Seleccionado) {
          body.jugador2Id = jugador2Seleccionado.id;
        } else if (modoJugador2Temp && jugador2Temp.nombre && jugador2Temp.apellido) {
          body.jugador2Temp = jugador2Temp;
        }

        if (Object.keys(body).length > 0) {
          await api.put(`/admin/torneos/${tournamentId}/inscripciones/${inscripcion.id}`, body);
          showSuccess('Pareja actualizada', 'Los datos de la pareja fueron actualizados');
        }
      }

      onSuccess();
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'No se pudieron guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  const hayCambios = () => {
    if (activeTab === 'categoria') return nuevaCategoriaId !== inscripcion.categoriaId;
    if (activeTab === 'pareja') {
      if (sinPareja && inscripcion.jugador2) return true;
      if (jugador2Seleccionado?.id !== inscripcion.jugador2?.id) return true;
      if (modoJugador2Temp && jugador2Temp.nombre && jugador2Temp.apellido) return true;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#232838]">
          <div>
            <h3 className="text-xl font-semibold text-white">Editar Inscripción</h3>
            <p className="text-sm text-gray-400 mt-1">
              {inscripcion.jugador1.nombre} {inscripcion.jugador1.apellido}
              {inscripcion.jugador2 ? ` + ${inscripcion.jugador2.nombre} ${inscripcion.jugador2.apellido}` : ' (sin pareja)'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#232838]">
          <button
            onClick={() => setActiveTab('categoria')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'categoria'
                ? 'text-[#df2531] border-b-2 border-[#df2531]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Cambiar Categoría
          </button>
          <button
            onClick={() => setActiveTab('pareja')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'pareja'
                ? 'text-[#df2531] border-b-2 border-[#df2531]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Cambiar Pareja
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'categoria' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Categoría actual: <span className="text-white font-medium">{inscripcion.categoriaNombre}</span>
              </p>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nueva categoría</label>
                <select
                  value={nuevaCategoriaId}
                  onChange={(e) => setNuevaCategoriaId(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#df2531]"
                >
                  {categorias.map((cat) => (
                    <option key={cat.categoriaId} value={cat.categoriaId}>
                      {cat.categoriaNombre} {cat.categoriaId === inscripcion.categoriaId ? '(actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {nuevaCategoriaId !== inscripcion.categoriaId && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400">
                  ⚠️ Al cambiar de categoría, la pareja será movida a <strong>{
                    categorias.find(c => c.categoriaId === nuevaCategoriaId)?.categoriaNombre
                  }</strong>.
                </div>
              )}
            </div>
          )}

          {activeTab === 'pareja' && (
            <div className="space-y-4">
              {/* Info actual */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Pareja actual</div>
                {inscripcion.jugador2 ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {inscripcion.jugador2.nombre[0]}{inscripcion.jugador2.apellido[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium">{inscripcion.jugador2.nombre} {inscripcion.jugador2.apellido}</div>
                      <div className="text-xs text-gray-500 flex gap-2">
                        {inscripcion.jugador2.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{inscripcion.jugador2.telefono}</span>}
                        {inscripcion.jugador2.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{inscripcion.jugador2.email}</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-500">Sin pareja asignada</div>
                )}
              </div>

              {/* Opción sin pareja */}
              <label className="flex items-center gap-3 p-3 bg-[#0B0E14] rounded-xl border border-[#232838] cursor-pointer hover:border-amber-500/50">
                <input
                  type="checkbox"
                  checked={sinPareja}
                  onChange={(e) => {
                    setSinPareja(e.target.checked);
                    if (e.target.checked) {
                      setJugador2Seleccionado(null);
                      setModoJugador2Temp(false);
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-600 text-[#df2531] focus:ring-[#df2531]"
                />
                <span className="text-white text-sm">Dejar sin pareja (buscará compañero después)</span>
              </label>

              {!sinPareja && (
                <>
                  {/* Tabs buscar/ingresar */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setModoJugador2Temp(false); setJugador2Seleccionado(null); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !modoJugador2Temp ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400'
                      }`}
                    >
                      Buscar registrado
                    </button>
                    <button
                      onClick={() => { setModoJugador2Temp(true); setJugador2Seleccionado(null); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        modoJugador2Temp ? 'bg-[#df2531] text-white' : 'bg-[#232838] text-gray-400'
                      }`}
                    >
                      Ingresar temporal
                    </button>
                  </div>

                  {!modoJugador2Temp ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          placeholder="Buscar por nombre, email o teléfono..."
                          className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                        />
                        {buscando && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#df2531] animate-spin" />}
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {resultados.map((jugador) => (
                          <button
                            key={jugador.id}
                            onClick={() => setJugador2Seleccionado(jugador)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                              jugador2Seleccionado?.id === jugador.id
                                ? 'bg-[#df2531]/10 border-[#df2531]'
                                : 'bg-[#0B0E14] border-[#232838] hover:border-gray-600'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {jugador.nombre[0]}{jugador.apellido[0]}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">{jugador.nombre} {jugador.apellido}</p>
                              <p className="text-xs text-gray-500">{jugador.telefono || jugador.email || ''}</p>
                            </div>
                            {jugador2Seleccionado?.id === jugador.id && <Check className="w-5 h-5 text-[#df2531]" />}
                          </button>
                        ))}
                        {busqueda.length >= 2 && resultados.length === 0 && !buscando && (
                          <p className="text-center text-gray-500 py-4 text-sm">No se encontraron jugadores</p>
                        )}
                      </div>
                    </div>
                  ) : (
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
                        placeholder="Email"
                        className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                      />
                      <input
                        type="tel"
                        value={jugador2Temp.telefono}
                        onChange={(e) => setJugador2Temp({ ...jugador2Temp, telefono: e.target.value })}
                        placeholder="Teléfono (opcional)"
                        className="w-full px-4 py-3 bg-[#0B0E14] border border-[#232838] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531]"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
            onClick={guardarCambios}
            disabled={!hayCambios() || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar Cambios
          </button>
        </div>
      </motion.div>
    </div>
  );
}
