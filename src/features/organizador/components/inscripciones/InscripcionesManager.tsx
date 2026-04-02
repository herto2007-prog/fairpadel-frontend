import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, Plus, Download, 
  Trash2, Phone, Mail, DollarSign
} from 'lucide-react';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { ResumenStats } from './ResumenStats';
import { ControlPagosManager } from './ControlPagosManager';
import { ModalInscripcionManual } from './ModalInscripcionManual';
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
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
                        <div className="text-sm text-white">
                          {insc.jugador1.nombre} {insc.jugador1.apellido}
                        </div>
                        <div className={`text-sm ${insc.jugador2 ? 'text-gray-400' : 'text-amber-500'}`}>
                          {insc.jugador2 ? 
                            `${insc.jugador2.nombre} ${insc.jugador2.apellido}` : 
                            'Sin pareja'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {insc.jugador1.telefono || '-'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {insc.jugador1.email || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        Gs. {insc.pagos.reduce((s, p) => s + p.monto, 0).toLocaleString('es-PY')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEliminar(insc)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                          title="Eliminar inscripción"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
