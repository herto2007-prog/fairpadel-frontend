import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, Plus, Download, 
  Trash2, Phone, Mail, DollarSign,
  MoreVertical, Eye, CheckCircle, XCircle, Pencil
} from 'lucide-react';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { ResumenStats } from './ResumenStats';
import { ControlPagosManager } from './ControlPagosManager';
import { ModalInscripcionManual } from './ModalInscripcionManual';
import { ModalEditarInscripcion } from './ModalEditarInscripcion';
import { formatDatePY } from '../../../../utils/date';

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
  estado: string;
  createdAt: string;
  pagos: { monto: number; estado: string }[];
  categoriaId: string;
  categoriaNombre: string;
}

interface CategoriaInscritos {
  categoriaId: string;
  categoriaNombre: string;
  categoriaTipo: 'MASCULINO' | 'FEMENINO';
  total: number;
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
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmState } = useConfirm();
  const [data, setData] = useState<{ stats: Stats; porCategoria: CategoriaInscritos[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [vistaActiva, setVistaActiva] = useState<'inscripciones' | 'pagos'>('inscripciones');
  const [modalInscripcionManual, setModalInscripcionManual] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; alignRight: boolean } | null>(null);
  const [modalFichaJugador, setModalFichaJugador] = useState<Inscripcion | null>(null);
  const [modalEditarInscripcion, setModalEditarInscripcion] = useState<Inscripcion | null>(null);
  const [accionLoading, setAccionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadInscripciones();
  }, [tournamentId]);

  const loadInscripciones = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/torneos/${tournamentId}/inscripciones`);
      if (data.success) {
        setData(data);
      }
    } catch (error) {
      console.error('Error cargando inscripciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Flatten todas las inscripciones
  const todasLasInscripciones = useMemo(() => {
    if (!data) return [];
    const inscripciones: Inscripcion[] = [];
    data.porCategoria.forEach(cat => {
      cat.inscripciones.forEach(insc => {
        inscripciones.push({
          ...insc,
          categoriaId: cat.categoriaId,
          categoriaNombre: cat.categoriaNombre,
        });
      });
    });
    return inscripciones;
  }, [data]);

  // Filtrar y ordenar
  const inscripcionesFiltradas = useMemo(() => {
    let resultado = [...todasLasInscripciones];

    // Filtro por categoría
    if (categoriaActiva !== 'todas') {
      resultado = resultado.filter(i => i.categoriaId === categoriaActiva);
    }

    // Filtro de búsqueda
    if (filtroBusqueda) {
      const searchTerm = filtroBusqueda.toLowerCase();
      resultado = resultado.filter(insc => {
        const j1 = `${insc.jugador1.nombre} ${insc.jugador1.apellido}`.toLowerCase();
        const j2 = insc.jugador2 ? `${insc.jugador2.nombre} ${insc.jugador2.apellido}`.toLowerCase() : '';
        const telefono = (insc.jugador1.telefono || '').toLowerCase();
        const email = (insc.jugador1.email || '').toLowerCase();
        return j1.includes(searchTerm) || j2.includes(searchTerm) || 
               telefono.includes(searchTerm) || email.includes(searchTerm);
      });
    }

    // Ordenamiento por fecha descendente (más reciente primero)
    resultado.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return resultado;
  }, [todasLasInscripciones, categoriaActiva, filtroBusqueda]);

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Fecha', 'Categoria', 'Jugador 1', 'Telefono 1', 'Email 1', 
                     'Jugador 2', 'Telefono 2', 'Email 2', 'Monto'];
    
    const rows = inscripcionesFiltradas.map(i => [
      formatDatePY(i.createdAt),
      i.categoriaNombre,
      `${i.jugador1.nombre} ${i.jugador1.apellido}`,
      i.jugador1.telefono || '',
      i.jugador1.email || '',
      i.jugador2 ? `${i.jugador2.nombre} ${i.jugador2.apellido}` : 'PENDIENTE',
      i.jugador2?.telefono || '',
      i.jugador2?.email || '',
      i.pagos.reduce((s, p) => s + p.monto, 0),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inscripciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Eliminar inscripción
  const handleEliminar = async (inscripcion: Inscripcion) => {
    const confirmed = await confirm({
      title: 'Eliminar inscripción',
      message: `¿Eliminar a ${inscripcion.jugador1.nombre} ${inscripcion.jugador1.apellido}${inscripcion.jugador2 ? ` y ${inscripcion.jugador2.nombre} ${inscripcion.jugador2.apellido}` : ''}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/torneos/${tournamentId}/inscripciones/${inscripcion.id}`);
      showSuccess('Inscripción eliminada', 'La inscripción fue eliminada correctamente');
      loadInscripciones();
    } catch (error) {
      showError('Error', 'No se pudo eliminar la inscripción');
    }
  };

  // Confirmar inscripción
  const handleConfirmar = async (inscripcion: Inscripcion) => {
    setAccionLoading(inscripcion.id);
    try {
      await api.put(`/admin/torneos/${tournamentId}/inscripciones/${inscripcion.id}/confirmar`);
      showSuccess('Inscripción confirmada', `${inscripcion.jugador1.nombre} ${inscripcion.jugador1.apellido} está confirmado`);
      loadInscripciones();
    } catch (error) {
      showError('Error', 'No se pudo confirmar la inscripción');
    } finally {
      setAccionLoading(null);
      setMenuAbierto(null);
    }
  };

  // Cancelar inscripción
  const handleCancelar = async (inscripcion: Inscripcion) => {
    const confirmed = await confirm({
      title: 'Cancelar inscripción',
      message: `¿Cancelar la inscripción de ${inscripcion.jugador1.nombre} ${inscripcion.jugador1.apellido}?`,
      confirmText: 'Cancelar inscripción',
      cancelText: 'Volver',
      variant: 'danger',
    });
    if (!confirmed) return;

    setAccionLoading(inscripcion.id);
    try {
      await api.put(`/admin/torneos/${tournamentId}/inscripciones/${inscripcion.id}/cancelar`);
      showSuccess('Inscripción cancelada', 'La inscripción fue cancelada correctamente');
      loadInscripciones();
    } catch (error) {
      showError('Error', 'No se pudo cancelar la inscripción');
    } finally {
      setAccionLoading(null);
      setMenuAbierto(null);
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

  if (!data || todasLasInscripciones.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Sin inscripciones aún</h3>
        <p className="text-gray-400 mb-6">Las inscripciones aparecerán aquí cuando los jugadores se registren</p>
        <button 
          onClick={() => setModalInscripcionManual(true)}
          className="px-6 py-3 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Inscribir pareja manualmente
        </button>

        <ModalInscripcionManual
          isOpen={modalInscripcionManual}
          onClose={() => setModalInscripcionManual(false)}
          onSuccess={loadInscripciones}
          tournamentId={tournamentId}
          categorias={data?.porCategoria || []}
          costoInscripcion={0}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <ResumenStats stats={data.stats} />

      {/* Tabs: Inscripciones vs Control de Pagos */}
      <div className="flex bg-[#151921] border border-[#232838] rounded-2xl p-1">
        <button
          onClick={() => setVistaActiva('inscripciones')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
            vistaActiva === 'inscripciones'
              ? 'bg-[#df2531] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Inscripciones ({data.stats.total})
        </button>
        <button
          onClick={() => setVistaActiva('pagos')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
            vistaActiva === 'pagos'
              ? 'bg-[#df2531] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Control de Cobranza
        </button>
      </div>

      {vistaActiva === 'pagos' ? (
        <ControlPagosManager 
          tournamentId={tournamentId}
          categorias={data.porCategoria.map(c => ({ categoriaId: c.categoriaId, categoriaNombre: c.categoriaNombre }))}
          costoInscripcion={0}
        />
      ) : (
        <>
          {/* Barra de herramientas */}
          <div className="bg-[#151921] border border-[#232838] rounded-2xl p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o email..."
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
                  <option value="todas">Todas las categorías</option>
                  {data.porCategoria.map(cat => (
                    <option key={cat.categoriaId} value={cat.categoriaId}>
                      {cat.categoriaNombre} ({cat.total})
                    </option>
                  ))}
                </select>

                {/* Exportar */}
                <button
                  onClick={exportarCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0B0E14] hover:bg-[#232838] border border-[#232838] text-white rounded-xl text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>

                {/* Inscripción manual */}
                <button
                  onClick={() => setModalInscripcionManual(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Resultados count */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Mostrando {inscripcionesFiltradas.length} de {todasLasInscripciones.length} inscripciones</span>
            {categoriaActiva !== 'todas' && (
              <button
                onClick={() => setCategoriaActiva('todas')}
                className="text-[#df2531] hover:underline"
              >
                Ver todas las categorías
              </button>
            )}
          </div>

          {/* Tabla de inscripciones */}
          <div className="bg-[#151921] border border-[#232838] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0B0E14] border-b border-[#232838]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugadores</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inscripcionesFiltradas.map((insc) => (
                    <tr key={insc.id} className="border-b border-[#232838] hover:bg-[#1a1f2e]">
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {formatDatePY(insc.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {insc.categoriaNombre}
                      </td>
                      <td className="px-4 py-3">
                        {/* Jugador 1 */}
                        <div className="flex items-start gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#df2531]/20 text-[#df2531] text-[10px] font-bold shrink-0 mt-0.5">1</span>
                          <div>
                            <div className="text-sm text-white font-medium">
                              {insc.jugador1.nombre} {insc.jugador1.apellido}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {insc.jugador1.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{insc.jugador1.telefono}</span>}
                              {insc.jugador1.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{insc.jugador1.email}</span>}
                            </div>
                          </div>
                        </div>
                        {/* Jugador 2 */}
                        <div className="flex items-start gap-2 mt-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold shrink-0 mt-0.5">2</span>
                          <div>
                            {insc.jugador2 ? (
                              <>
                                <div className="text-sm text-white font-medium">
                                  {insc.jugador2.nombre} {insc.jugador2.apellido}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {insc.jugador2.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{insc.jugador2.telefono}</span>}
                                  {insc.jugador2.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{insc.jugador2.email}</span>}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-amber-500">Sin pareja</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          insc.estado === 'CONFIRMADA' ? 'bg-emerald-500/20 text-emerald-400' :
                          insc.estado === 'CANCELADA' ? 'bg-red-500/20 text-red-400' :
                          insc.estado === 'PENDIENTE' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {insc.estado === 'CONFIRMADA' ? 'Confirmada' :
                           insc.estado === 'CANCELADA' ? 'Cancelada' :
                           insc.estado === 'PENDIENTE' ? 'Pendiente' :
                           insc.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        Gs. {insc.pagos.reduce((s, p) => s + p.monto, 0).toLocaleString('es-PY')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const menuWidth = 224;
                            const padding = 16;
                            // Si hay espacio a la derecha del botón, alinear derecha del menú con derecha del botón
                            // Si no, alinear izquierda del menú con izquierda del botón
                            const alignRight = rect.right + padding <= window.innerWidth;
                            const left = alignRight
                              ? Math.max(padding, rect.right - menuWidth)
                              : Math.max(padding, rect.left);
                            setMenuPosition({ top: rect.bottom + 4, left, alignRight });
                            setMenuAbierto(menuAbierto === insc.id ? null : insc.id);
                          }}
                          disabled={accionLoading === insc.id}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#232838] rounded-lg transition-colors disabled:opacity-50"
                          title="Más acciones"
                        >
                          {accionLoading === insc.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-[#df2531]/30 border-t-[#df2531] rounded-full"
                            />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {inscripcionesFiltradas.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No se encontraron inscripciones con los filtros aplicados</p>
              <button
                onClick={() => {
                  setFiltroBusqueda('');
                  setCategoriaActiva('todas');
                }}
                className="mt-4 text-[#df2531] hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Modales */}
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

          <ModalInscripcionManual
            isOpen={modalInscripcionManual}
            onClose={() => setModalInscripcionManual(false)}
            onSuccess={loadInscripciones}
            tournamentId={tournamentId}
            categorias={data?.porCategoria || []}
            costoInscripcion={0}
          />
        </>
      )}

      {/* Modal: Ficha del Jugador */}
      {modalFichaJugador && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Ficha del Jugador</h3>
              <button onClick={() => setModalFichaJugador(null)} className="p-2 text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Jugador 1 */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Jugador 1</div>
                <div className="text-white font-medium text-lg">
                  {modalFichaJugador.jugador1.nombre} {modalFichaJugador.jugador1.apellido}
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-400">
                  {modalFichaJugador.jugador1.telefono && (
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" />{modalFichaJugador.jugador1.telefono}</div>
                  )}
                  {modalFichaJugador.jugador1.email && (
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" />{modalFichaJugador.jugador1.email}</div>
                  )}
                </div>
              </div>

              {/* Jugador 2 */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Jugador 2</div>
                {modalFichaJugador.jugador2 ? (
                  <>
                    <div className="text-white font-medium text-lg">
                      {modalFichaJugador.jugador2.nombre} {modalFichaJugador.jugador2.apellido}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-400">
                      {modalFichaJugador.jugador2.telefono && (
                        <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" />{modalFichaJugador.jugador2.telefono}</div>
                      )}
                      {modalFichaJugador.jugador2.email && (
                        <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" />{modalFichaJugador.jugador2.email}</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-amber-500">Sin pareja asignada</div>
                )}
              </div>

              {/* Info inscripción */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Datos de la inscripción</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Categoría:</span> <span className="text-white">{modalFichaJugador.categoriaNombre}</span></div>
                  <div><span className="text-gray-500">Estado:</span> <span className="text-white">{modalFichaJugador.estado}</span></div>
                  <div><span className="text-gray-500">Fecha:</span> <span className="text-white">{formatDatePY(modalFichaJugador.createdAt)}</span></div>
                  <div><span className="text-gray-500">Monto pagado:</span> <span className="text-white">Gs. {modalFichaJugador.pagos.reduce((s, p) => s + p.monto, 0).toLocaleString('es-PY')}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalFichaJugador(null)}
                className="px-6 py-2.5 bg-[#232838] hover:bg-[#2d3447] text-white rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Editar Inscripción */}
      {modalEditarInscripcion && (
        <ModalEditarInscripcion
          inscripcion={modalEditarInscripcion}
          tournamentId={tournamentId}
          categorias={data?.porCategoria || []}
          onClose={() => setModalEditarInscripcion(null)}
          onSuccess={() => { loadInscripciones(); setModalEditarInscripcion(null); }}
        />
      )}

      {/* Menú flotante de acciones (fixed, fuera de la tabla para evitar recorte) */}
      {menuAbierto && menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuAbierto(null)}
          />
          <div
            className="fixed w-56 bg-[#1a1f2e] border border-[#232838] rounded-xl py-1 z-50 shadow-xl"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {(() => {
              const insc = todasLasInscripciones.find(i => i.id === menuAbierto);
              if (!insc) return null;
              return (
                <>
                  {/* Ver ficha */}
                  <button
                    onClick={() => { setModalFichaJugador(insc); setMenuAbierto(null); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#232838] hover:text-white text-left transition-colors"
                  >
                    <Eye className="w-4 h-4 text-blue-400" />
                    Ver ficha del jugador
                  </button>

                  {/* Editar inscripción */}
                  <button
                    onClick={() => { setModalEditarInscripcion(insc); setMenuAbierto(null); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#232838] hover:text-white text-left transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-amber-400" />
                    Editar inscripción
                  </button>

                  <div className="mx-3 my-1 border-t border-[#232838]" />

                  {/* Confirmar */}
                  {insc.estado !== 'CONFIRMADA' && (
                    <button
                      onClick={() => handleConfirmar(insc)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#232838] hover:text-white text-left transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Confirmar inscripción
                    </button>
                  )}

                  {/* Cancelar */}
                  {insc.estado !== 'CANCELADA' && (
                    <button
                      onClick={() => handleCancelar(insc)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#232838] hover:text-white text-left transition-colors"
                    >
                      <XCircle className="w-4 h-4 text-amber-400" />
                      Cancelar inscripción
                    </button>
                  )}

                  <div className="mx-3 my-1 border-t border-[#232838]" />

                  {/* Eliminar */}
                  <button
                    onClick={() => { handleEliminar(insc); setMenuAbierto(null); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 text-left transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar inscripción
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
