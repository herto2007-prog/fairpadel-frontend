import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle2, Clock, AlertCircle, 
  Search, Plus, UserPlus
} from 'lucide-react';
import { api } from '../../../../services/api';
import { ResumenStats } from './ResumenStats';
import { InscripcionCard } from './InscripcionCard';
import { ModalConfirmar } from './ModalConfirmar';
import { ModalCancelar } from './ModalCancelar';

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════
interface Jugador {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
}

interface Inscripcion {
  id: string;
  jugador1: Jugador;
  jugador2?: Jugador;
  jugador2Documento?: string;
  jugador2Email?: string;
  estado: 'PENDIENTE_PAGO' | 'PENDIENTE_CONFIRMACION' | 'CONFIRMADA' | 'CANCELADA' | 'RECHAZADA';
  modoPago?: 'COMPLETO' | 'INDIVIDUAL';
  createdAt: string;
  pagos: { monto: number; estado: string }[];
}

interface CategoriaInscritos {
  categoriaId: string;
  categoriaNombre: string;
  categoriaTipo: 'MASCULINO' | 'FEMENINO';
  total: number;
  confirmadas: number;
  pendientes: number;
  inscripciones: Inscripcion[];
}

interface Stats {
  total: number;
  confirmadas: number;
  pendientes: number;
  incompletas: number;
  ingresos: number;
}

interface InscripcionesManagerProps {
  tournamentId: string;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export function InscripcionesManager({ tournamentId }: InscripcionesManagerProps) {
  const [data, setData] = useState<{ stats: Stats; porCategoria: CategoriaInscritos[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'confirmadas' | 'pendientes' | 'incompletas'>('todos');
  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState<Inscripcion | null>(null);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);

  useEffect(() => {
    loadInscripciones();
  }, [tournamentId]);

  const loadInscripciones = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/torneos/${tournamentId}/inscripciones`);
      if (data.success) {
        setData(data);
        if (data.porCategoria.length > 0 && !categoriaActiva) {
          setCategoriaActiva(data.porCategoria[0].categoriaId);
        }
      }
    } catch (error) {
      console.error('Error cargando inscripciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoriaActual = data?.porCategoria.find(c => c.categoriaId === categoriaActiva);

  const inscripcionesFiltradas = categoriaActual?.inscripciones.filter(insc => {
    const searchTerm = filtroBusqueda.toLowerCase();
    const jugador1Nombre = `${insc.jugador1.nombre} ${insc.jugador1.apellido}`.toLowerCase();
    const jugador2Nombre = insc.jugador2 ? `${insc.jugador2.nombre} ${insc.jugador2.apellido}`.toLowerCase() : '';
    const matchBusqueda = jugador1Nombre.includes(searchTerm) || jugador2Nombre.includes(searchTerm);

    let matchEstado = true;
    if (filtroEstado === 'confirmadas') matchEstado = insc.estado === 'CONFIRMADA';
    if (filtroEstado === 'pendientes') matchEstado = insc.estado === 'PENDIENTE_PAGO' || insc.estado === 'PENDIENTE_CONFIRMACION';
    if (filtroEstado === 'incompletas') matchEstado = !insc.jugador2;

    return matchBusqueda && matchEstado;
  }) || [];

  const handleConfirmar = async () => {
    if (!inscripcionSeleccionada) return;
    try {
      await api.put(`/admin/torneos/${tournamentId}/inscripciones/${inscripcionSeleccionada.id}/confirmar`);
      setModalConfirmar(false);
      setInscripcionSeleccionada(null);
      loadInscripciones();
    } catch (error) {
      console.error('Error confirmando:', error);
    }
  };

  const handleCancelar = async (motivo: string) => {
    if (!inscripcionSeleccionada) return;
    try {
      await api.put(`/admin/torneos/${tournamentId}/inscripciones/${inscripcionSeleccionada.id}/cancelar`, { motivo });
      setModalCancelar(false);
      setInscripcionSeleccionada(null);
      loadInscripciones();
    } catch (error) {
      console.error('Error cancelando:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  if (!data || data.porCategoria.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Sin inscripciones aún</h3>
        <p className="text-gray-400 mb-6">Las inscripciones aparecerán aquí cuando los jugadores se registren</p>
        <button className="px-6 py-3 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-all">
          <Plus className="w-5 h-5 inline mr-2" />
          Inscribir pareja manualmente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <ResumenStats stats={data.stats} />

      {/* Filtros y Búsqueda */}
      <div className="glass rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] transition-colors"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {[
              { key: 'todos', label: 'Todos', icon: Users },
              { key: 'confirmadas', label: 'Confirmados', icon: CheckCircle2 },
              { key: 'pendientes', label: 'Pendientes', icon: Clock },
              { key: 'incompletas', label: 'Sin pareja', icon: AlertCircle },
            ].map((filtro) => (
              <button
                key={filtro.key}
                onClick={() => setFiltroEstado(filtro.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filtroEstado === filtro.key
                    ? 'bg-[#df2531] text-white'
                    : 'bg-[#151921] text-gray-400 hover:text-white hover:bg-[#232838]'
                }`}
              >
                <filtro.icon className="w-4 h-4" />
                {filtro.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs de Categorías - Grupos con contorno */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Caballeros */}
        {data.porCategoria.some(c => c.categoriaTipo === 'MASCULINO') && (
          <div className="flex-1 lg:flex-none bg-[#0d1117] rounded-2xl p-3 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/20">
              <span className="text-blue-400 text-lg">♂</span>
              <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider">Caballeros</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.porCategoria
                .filter(c => c.categoriaTipo === 'MASCULINO')
                .map((cat) => (
                  <button
                    key={cat.categoriaId}
                    onClick={() => setCategoriaActiva(cat.categoriaId)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all min-w-[60px] ${
                      categoriaActiva === cat.categoriaId
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-[#151921] text-gray-400 hover:bg-[#1a1f2e] hover:text-gray-300'
                    }`}
                  >
                    <span className="block">
                      {cat.categoriaNombre.replace(' Categoría', '').replace('Principiante', 'Prin.')}
                    </span>
                    <span className={`block text-xs ${categoriaActiva === cat.categoriaId ? 'text-blue-100' : 'text-gray-500'}`}>
                      {cat.total} insc.
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Damas */}
        {data.porCategoria.some(c => c.categoriaTipo === 'FEMENINO') && (
          <div className="flex-1 lg:flex-none bg-[#0d1117] rounded-2xl p-3 border border-pink-500/30">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-pink-500/20">
              <span className="text-pink-400 text-lg">♀</span>
              <span className="text-pink-400 text-sm font-semibold uppercase tracking-wider">Damas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.porCategoria
                .filter(c => c.categoriaTipo === 'FEMENINO')
                .map((cat) => (
                  <button
                    key={cat.categoriaId}
                    onClick={() => setCategoriaActiva(cat.categoriaId)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all min-w-[60px] ${
                      categoriaActiva === cat.categoriaId
                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                        : 'bg-[#151921] text-gray-400 hover:bg-[#1a1f2e] hover:text-gray-300'
                    }`}
                  >
                    <span className="block">
                      {cat.categoriaNombre.replace(' Categoría', '').replace('Principiante', 'Prin.')}
                    </span>
                    <span className={`block text-xs ${categoriaActiva === cat.categoriaId ? 'text-pink-100' : 'text-gray-500'}`}>
                      {cat.total} insc.
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Info de categoría */}
      {categoriaActual && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-gray-500 text-sm">Total inscritos</span>
              <p className="text-2xl font-bold text-white">{categoriaActual.total}</p>
            </div>
            <div className="w-px h-10 bg-[#232838]" />
            <div>
              <span className="text-emerald-500 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Confirmados
              </span>
              <p className="text-xl font-bold text-emerald-400">{categoriaActual.confirmadas}</p>
            </div>
            <div className="w-px h-10 bg-[#232838]" />
            <div>
              <span className="text-amber-500 text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Pendientes
              </span>
              <p className="text-xl font-bold text-amber-400">{categoriaActual.pendientes}</p>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-[#151921] hover:bg-[#232838] text-white rounded-xl transition-colors text-sm">
            <UserPlus className="w-4 h-4" />
            Inscribir manual
          </button>
        </div>
      )}

      {/* Lista de inscripciones */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {inscripcionesFiltradas.map((inscripcion, index) => (
            <InscripcionCard
              key={inscripcion.id}
              inscripcion={inscripcion}
              index={index}
              onConfirmar={() => {
                setInscripcionSeleccionada(inscripcion);
                setModalConfirmar(true);
              }}
              onCancelar={() => {
                setInscripcionSeleccionada(inscripcion);
                setModalCancelar(true);
              }}
            />
          ))}
        </AnimatePresence>

        {inscripcionesFiltradas.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No se encontraron inscripciones con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Modales */}
      <ModalConfirmar
        isOpen={modalConfirmar}
        onClose={() => setModalConfirmar(false)}
        onConfirm={handleConfirmar}
        inscripcion={inscripcionSeleccionada}
      />

      <ModalCancelar
        isOpen={modalCancelar}
        onClose={() => setModalCancelar(false)}
        onConfirm={handleCancelar}
        inscripcion={inscripcionSeleccionada}
      />
    </div>
  );
}
