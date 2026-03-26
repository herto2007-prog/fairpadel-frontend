import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, Search, Plus, Trash2, CheckCircle2, XCircle, 
  Wallet, AlertCircle
} from 'lucide-react';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { formatDatePY } from '../../../../utils/date';

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════
interface Pago {
  id: string;
  monto: number;
  metodo: 'EFECTIVO' | 'TRANSFERENCIA';
  fecha: string;
  nota?: string;
}

interface JugadorPago {
  inscripcionId: string;
  jugadorId: string;
  jugadorNombre: string;
  jugadorTelefono?: string;
  jugadorEmail?: string;
  parejaNombre: string;
  categoriaId: string;
  categoriaNombre: string;
  estadoInscripcion: string;
  costoIndividual: number;
  totalPagado: number;
  debe: number;
  estaAlDia: boolean;
  pagos: Pago[];
}

interface Stats {
  totalJugadores: number;
  totalCobrado: number;
  totalDeben: number;
  alDia: number;
  deudores: number;
}

interface Categoria {
  categoriaId: string;
  categoriaNombre: string;
}

interface ControlPagosManagerProps {
  tournamentId: string;
  categorias: Categoria[];
  costoInscripcion?: number;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export function ControlPagosManager({ tournamentId, categorias, costoInscripcion: _costoInscripcion }: ControlPagosManagerProps) {
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmState } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ stats: Stats; jugadores: JugadorPago[] } | null>(null);
  
  // Filtros
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'deudores' | 'pagados'>('todos');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas');
  
  // Modal registrar pago
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<JugadorPago | null>(null);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [fechaPago, setFechaPago] = useState(() => new Date().toISOString().split('T')[0]);
  const [notaPago, setNotaPago] = useState('');

  useEffect(() => {
    loadControlPagos();
  }, [tournamentId, filtroEstado, categoriaActiva]);

  const loadControlPagos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroEstado !== 'todos') params.append('filtro', filtroEstado);
      if (categoriaActiva !== 'todas') params.append('categoriaId', categoriaActiva);
      if (filtroBusqueda) params.append('busqueda', filtroBusqueda);
      
      const { data } = await api.get(`/admin/torneos/${tournamentId}/control-pagos?${params}`);
      if (data.success) {
        setData(data);
      }
    } catch (error) {
      console.error('Error cargando control de pagos:', error);
      showError('Error', 'No se pudo cargar el control de pagos');
    } finally {
      setLoading(false);
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      loadControlPagos();
    }, 300);
    return () => clearTimeout(timer);
  }, [filtroBusqueda]);

  const abrirModalPago = (jugador: JugadorPago) => {
    setJugadorSeleccionado(jugador);
    setMontoPago(jugador.debe.toString());
    setMetodoPago('EFECTIVO');
    setFechaPago(new Date().toISOString().split('T')[0]);
    setNotaPago('');
    setModalPagoAbierto(true);
  };

  const registrarPago = async () => {
    if (!jugadorSeleccionado || !montoPago) return;
    
    try {
      await api.post(`/admin/torneos/${tournamentId}/control-pagos`, {
        inscripcionId: jugadorSeleccionado.inscripcionId,
        jugadorId: jugadorSeleccionado.jugadorId,
        monto: parseInt(montoPago, 10),
        metodo: metodoPago,
        fecha: fechaPago,
        nota: notaPago || undefined,
      });
      
      setModalPagoAbierto(false);
      showSuccess('Pago registrado', `Se registró el pago de ${jugadorSeleccionado.jugadorNombre}`);
      loadControlPagos();
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'No se pudo registrar el pago');
    }
  };

  const eliminarPago = async (_jugador: JugadorPago, pago: Pago) => {
    const confirmed = await confirm({
      title: 'Eliminar pago',
      message: `¿Eliminar el pago de ${formatDatePY(pago.fecha)} por Gs. ${pago.monto.toLocaleString()}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/torneos/${tournamentId}/control-pagos/${pago.id}`);
      showSuccess('Pago eliminado', 'El pago fue eliminado correctamente');
      loadControlPagos();
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'No se pudo eliminar el pago');
    }
  };

  if (loading && !data) {
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

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<Wallet className="w-5 h-5" />}
            label="Total Cobrado"
            value={`Gs. ${stats.totalCobrado.toLocaleString('es-PY')}`}
            color="emerald"
          />
          <StatCard 
            icon={<AlertCircle className="w-5 h-5" />}
            label="Total Deben"
            value={`Gs. ${stats.totalDeben.toLocaleString('es-PY')}`}
            color="red"
          />
          <StatCard 
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Al Día"
            value={stats.alDia.toString()}
            color="blue"
          />
          <StatCard 
            icon={<XCircle className="w-5 h-5" />}
            label="Deudores"
            value={stats.deudores.toString()}
            color="amber"
          />
        </div>
      )}

      {/* Barra de herramientas */}
      <div className="bg-[#151921] border border-[#232838] rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#df2531] transition-colors"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Selector de categoría */}
            <select
              value={categoriaActiva}
              onChange={(e) => setCategoriaActiva(e.target.value)}
              className="px-4 py-2 bg-[#0B0E14] border border-[#232838] rounded-xl text-white text-sm focus:outline-none focus:border-[#df2531]"
            >
              <option value="todas">Todas las categorias</option>
              {categorias.map(cat => (
                <option key={cat.categoriaId} value={cat.categoriaId}>
                  {cat.categoriaNombre}
                </option>
              ))}
            </select>

            {/* Filtro estado pago */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className="px-4 py-2 bg-[#0B0E14] border border-[#232838] rounded-xl text-white text-sm focus:outline-none focus:border-[#df2531]"
            >
              <option value="todos">Todos</option>
              <option value="deudores">Deudores</option>
              <option value="pagados">Pagados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de jugadores */}
      <div className="bg-[#151921] border border-[#232838] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0B0E14] border-b border-[#232838]">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pareja</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Debe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.jugadores.map((jugador) => (
                <tr key={`${jugador.inscripcionId}-${jugador.jugadorId}`} className="border-b border-[#232838] hover:bg-[#1a1f2e]">
                  <td className="px-4 py-3">
                    <div className="text-sm text-white font-medium">{jugador.jugadorNombre}</div>
                    {jugador.jugadorTelefono && (
                      <div className="text-xs text-gray-500">{jugador.jugadorTelefono}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{jugador.parejaNombre}</td>
                  <td className="px-4 py-3 text-sm text-white">{jugador.categoriaNombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    Gs. {jugador.costoIndividual.toLocaleString('es-PY')}
                  </td>
                  <td className="px-4 py-3 text-sm text-emerald-400">
                    Gs. {jugador.totalPagado.toLocaleString('es-PY')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {jugador.debe > 0 ? (
                      <span className="text-red-400">Gs. {jugador.debe.toLocaleString('es-PY')}</span>
                    ) : (
                      <span className="text-emerald-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {jugador.estaAlDia ? (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                        Al día
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                        Debe
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {jugador.pagos.length > 0 && (
                        <div className="relative group">
                          <button className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg text-xs">
                            {jugador.pagos.length} pago{jugador.pagos.length > 1 ? 's' : ''}
                          </button>
                          {/* Tooltip con historial */}
                          <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1f2e] border border-[#232838] rounded-xl p-3 hidden group-hover:block z-10">
                            <div className="text-xs text-gray-400 mb-2">Historial de pagos</div>
                            {jugador.pagos.map((pago) => (
                              <div key={pago.id} className="flex items-center justify-between py-1 border-b border-[#232838] last:border-0">
                                <div>
                                  <div className="text-sm text-white">Gs. {pago.monto.toLocaleString('es-PY')}</div>
                                  <div className="text-xs text-gray-500">{formatDatePY(pago.fecha)} - {pago.metodo}</div>
                                </div>
                                <button
                                  onClick={() => eliminarPago(jugador, pago)}
                                  className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                  title="Eliminar pago"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {jugador.debe > 0 && (
                        <button
                          onClick={() => abrirModalPago(jugador)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-lg text-sm transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Registrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data?.jugadores.length === 0 && (
          <div className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No se encontraron jugadores con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Modal Registrar Pago */}
      {modalPagoAbierto && jugadorSeleccionado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Registrar Pago</h3>
              <button
                onClick={() => setModalPagoAbierto(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Info del jugador */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <div className="text-sm text-gray-400">Jugador</div>
                <div className="text-white font-medium">{jugadorSeleccionado.jugadorNombre}</div>
                <div className="text-sm text-gray-400 mt-1">Debe: <span className="text-red-400 font-medium">Gs. {jugadorSeleccionado.debe.toLocaleString('es-PY')}</span></div>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Monto (Gs.)</label>
                <input
                  type="number"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#df2531]"
                  placeholder="Ej: 75000"
                />
              </div>

              {/* Método */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Método</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMetodoPago('EFECTIVO')}
                    className={`flex-1 py-3 rounded-xl border transition-colors ${
                      metodoPago === 'EFECTIVO'
                        ? 'bg-[#df2531] border-[#df2531] text-white'
                        : 'bg-[#0B0E14] border-[#232838] text-gray-400 hover:text-white'
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    onClick={() => setMetodoPago('TRANSFERENCIA')}
                    className={`flex-1 py-3 rounded-xl border transition-colors ${
                      metodoPago === 'TRANSFERENCIA'
                        ? 'bg-[#df2531] border-[#df2531] text-white'
                        : 'bg-[#0B0E14] border-[#232838] text-gray-400 hover:text-white'
                    }`}
                  >
                    Transferencia
                  </button>
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Fecha</label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#df2531]"
                />
              </div>

              {/* Nota */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nota (opcional)</label>
                <input
                  type="text"
                  value={notaPago}
                  onChange={(e) => setNotaPago(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#df2531]"
                  placeholder="Ej: Pago parcial, queda debiendo..."
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setModalPagoAbierto(false)}
                  className="flex-1 py-3 border border-[#232838] text-gray-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={registrarPago}
                  disabled={!montoPago || parseInt(montoPago) <= 0}
                  className="flex-1 py-3 bg-[#df2531] hover:bg-[#df2531]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                >
                  Registrar Pago
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ConfirmModal */}
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

// ═══════════════════════════════════════════════════════════
// COMPONENTE: StatCard
// ═══════════════════════════════════════════════════════════
function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: 'emerald' | 'red' | 'blue' | 'amber';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className={`p-4 rounded-2xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
