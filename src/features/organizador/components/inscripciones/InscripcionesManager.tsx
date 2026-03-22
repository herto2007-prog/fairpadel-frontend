import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle2, Search, Plus, Download, Filter, ChevronDown, ChevronUp,
  Trash2, CheckSquare, Square, Phone, Mail
} from 'lucide-react';
import { api } from '../../../../services/api';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { ResumenStats } from './ResumenStats';
import { InscripcionCard } from './InscripcionCard';
import { ModalConfirmar } from './ModalConfirmar';
import { ModalCancelar } from './ModalCancelar';
import { ModalInscripcionManual } from './ModalInscripcionManual';
import { ModalEditarInscripcion } from './ModalEditarInscripcion';
import { ModalCambiarCategoria } from './ModalCambiarCategoria';
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
  jugador2Documento?: string;
  jugador2Email?: string;
  estado: 'PENDIENTE_PAGO' | 'PENDIENTE_CONFIRMACION' | 'CONFIRMADA' | 'CANCELADA' | 'RECHAZADA';
  modoPago?: 'COMPLETO' | 'INDIVIDUAL';
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

type FiltroEstado = 'todos' | 'confirmadas' | 'pendientes' | 'incompletas' | 'canceladas';
type OrdenarPor = 'fecha' | 'nombre' | 'estado' | 'monto';
type VistaTipo = 'cards' | 'tabla';

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
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>('fecha');
  const [ordenAscendente, setOrdenAscendente] = useState(false);
  const [vista, setVista] = useState<VistaTipo>('cards');
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState<Inscripcion | null>(null);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [modalInscripcionManual, setModalInscripcionManual] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalCambiarCategoria, setModalCambiarCategoria] = useState(false);
  

  

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

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(insc => {
        if (filtroEstado === 'confirmadas') return insc.estado === 'CONFIRMADA';
        if (filtroEstado === 'pendientes') return insc.estado === 'PENDIENTE_PAGO' || insc.estado === 'PENDIENTE_CONFIRMACION';
        if (filtroEstado === 'incompletas') return !insc.jugador2;
        if (filtroEstado === 'canceladas') return insc.estado === 'CANCELADA';
        return true;
      });
    }

    // Filtro por fecha
    if (fechaDesde) {
      resultado = resultado.filter(i => new Date(i.createdAt) >= new Date(fechaDesde));
    }
    if (fechaHasta) {
      resultado = resultado.filter(i => new Date(i.createdAt) <= new Date(fechaHasta));
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      let comparacion = 0;
      switch (ordenarPor) {
        case 'fecha':
          comparacion = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'nombre':
          comparacion = `${a.jugador1.nombre} ${a.jugador1.apellido}`.localeCompare(`${b.jugador1.nombre} ${b.jugador1.apellido}`);
          break;
        case 'estado':
          comparacion = a.estado.localeCompare(b.estado);
          break;
        case 'monto':
          const montoA = a.pagos.reduce((s, p) => s + p.monto, 0);
          const montoB = b.pagos.reduce((s, p) => s + p.monto, 0);
          comparacion = montoA - montoB;
          break;
      }
      return ordenAscendente ? comparacion : -comparacion;
    });

    return resultado;
  }, [todasLasInscripciones, categoriaActiva, filtroBusqueda, filtroEstado, 
      fechaDesde, fechaHasta, ordenarPor, ordenAscendente]);

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Fecha', 'Categoria', 'Jugador 1', 'Telefono 1', 'Email 1', 
                     'Jugador 2', 'Telefono 2', 'Email 2', 'Estado', 'Monto'];
    
    const rows = inscripcionesFiltradas.map(i => [
      formatDatePY(i.createdAt),
      i.categoriaNombre,
      `${i.jugador1.nombre} ${i.jugador1.apellido}`,
      i.jugador1.telefono || '',
      i.jugador1.email || '',
      i.jugador2 ? `${i.jugador2.nombre} ${i.jugador2.apellido}` : 'PENDIENTE',
      i.jugador2?.telefono || '',
      i.jugador2?.email || '',
      i.estado,
      i.pagos.reduce((s, p) => s + p.monto, 0),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inscripciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Selección múltiple
  const toggleSeleccionarTodos = () => {
    if (seleccionados.size === inscripcionesFiltradas.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(inscripcionesFiltradas.map(i => i.id)));
    }
  };

  const toggleSeleccionar = (id: string) => {
    const nuevo = new Set(seleccionados);
    if (nuevo.has(id)) nuevo.delete(id);
    else nuevo.add(id);
    setSeleccionados(nuevo);
  };

  // Acciones masivas
  const confirmarSeleccionados = async () => {
    const confirmed = await confirm({
      title: 'Confirmar inscripciones',
      message: `¿Estás seguro de confirmar ${seleccionados.size} inscripciones? Esta acción no se puede deshacer.`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'info',
    });
    if (!confirmed) return;
    
    try {
      await Promise.all(
        Array.from(seleccionados).map(id => 
          api.put(`/admin/torneos/${tournamentId}/inscripciones/${id}/confirmar`)
        )
      );
      setSeleccionados(new Set());
      showSuccess('Inscripciones confirmadas', `${seleccionados.size} inscripciones fueron confirmadas exitosamente`);
      loadInscripciones();
    } catch (error) {
      showError('Error al confirmar', 'No se pudieron confirmar las inscripciones');
    }
  };

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

  if (!data || todasLasInscripciones.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Sin inscripciones aun</h3>
        <p className="text-gray-400 mb-6">Las inscripciones apareceran aqui cuando los jugadores se registren</p>
        <button 
          onClick={() => setModalInscripcionManual(true)}
          className="px-6 py-3 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-all"
        >
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

      {/* Barra de herramientas */}
      <div className="bg-[#151921] border border-[#232838] rounded-2xl p-4 space-y-4">
        {/* Fila 1: Búsqueda y acciones principales */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, telefono o email..."
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
              {data.porCategoria.map(cat => (
                <option key={cat.categoriaId} value={cat.categoriaId}>
                  {cat.categoriaNombre} ({cat.total})
                </option>
              ))}
            </select>

            {/* Toggle vista */}
            <div className="flex bg-[#0B0E14] rounded-xl border border-[#232838] overflow-hidden">
              <button
                onClick={() => setVista('cards')}
                className={`px-4 py-2 text-sm ${vista === 'cards' ? 'bg-[#df2531] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setVista('tabla')}
                className={`px-4 py-2 text-sm ${vista === 'tabla' ? 'bg-[#df2531] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Tabla
              </button>
            </div>

            {/* Exportar */}
            <button
              onClick={exportarCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#0B0E14] hover:bg-[#232838] border border-[#232838] text-white rounded-xl text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>

            {/* Filtros avanzados */}
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${
                mostrarFiltros ? 'bg-[#df2531] text-white' : 'bg-[#0B0E14] border border-[#232838] text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Fila 2: Filtros avanzados expandibles */}
        <AnimatePresence>
          {mostrarFiltros && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-[#232838] grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Filtro estado */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Estado</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                    className="w-full px-3 py-2 bg-[#0B0E14] border border-[#232838] rounded-lg text-white text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="confirmadas">Confirmadas</option>
                    <option value="pendientes">Pendientes</option>
                    <option value="incompletas">Sin pareja</option>
                    <option value="canceladas">Canceladas</option>
                  </select>
                </div>

                {/* Ordenar por */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ordenar por</label>
                  <div className="flex">
                    <select
                      value={ordenarPor}
                      onChange={(e) => setOrdenarPor(e.target.value as OrdenarPor)}
                      className="flex-1 px-3 py-2 bg-[#0B0E14] border border-r-0 border-[#232838] rounded-l-lg text-white text-sm"
                    >
                      <option value="fecha">Fecha</option>
                      <option value="nombre">Nombre</option>
                      <option value="estado">Estado</option>
                      <option value="monto">Monto</option>
                    </select>
                    <button
                      onClick={() => setOrdenAscendente(!ordenAscendente)}
                      className="px-3 py-2 bg-[#0B0E14] border border-[#232838] rounded-r-lg text-gray-400 hover:text-white"
                    >
                      {ordenAscendente ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Fecha desde */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0E14] border border-[#232838] rounded-lg text-white text-sm"
                  />
                </div>

                {/* Fecha hasta */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0E14] border border-[#232838] rounded-lg text-white text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Acciones masivas */}
      {seleccionados.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-[#df2531]/10 border border-[#df2531]/30 rounded-xl p-4"
        >
          <span className="text-white font-medium">
            {seleccionados.size} inscripciones seleccionadas
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSeleccionados(new Set())}
              className="px-4 py-2 text-gray-400 hover:text-white text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarSeleccionados}
              className="flex items-center gap-2 px-4 py-2 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-lg text-sm"
            >
              <CheckSquare className="w-4 h-4" />
              Confirmar seleccionadas
            </button>
          </div>
        </motion.div>
      )}

      {/* Resultados count */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Mostrando {inscripcionesFiltradas.length} de {todasLasInscripciones.length} inscripciones</span>
        {categoriaActiva !== 'todas' && (
          <button
            onClick={() => setCategoriaActiva('todas')}
            className="text-[#df2531] hover:underline"
          >
            Ver todas las categorias
          </button>
        )}
      </div>

      {/* Lista/Tabla de inscripciones */}
      {vista === 'cards' ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {inscripcionesFiltradas.map((inscripcion, index) => (
              <div key={inscripcion.id} className="flex items-center gap-3">
                <button
                  onClick={() => toggleSeleccionar(inscripcion.id)}
                  className="text-gray-400 hover:text-[#df2531]"
                >
                  {seleccionados.has(inscripcion.id) ? 
                    <CheckSquare className="w-5 h-5 text-[#df2531]" /> : 
                    <Square className="w-5 h-5" />
                  }
                </button>
                <div className="flex-1">
                  <InscripcionCard
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
                    onEditar={() => {
                      setInscripcionSeleccionada(inscripcion);
                      setModalEditar(true);
                    }}
                    onCambiarCategoria={() => {
                      setInscripcionSeleccionada(inscripcion);
                      setModalCambiarCategoria(true);
                    }}
                  />
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Vista tabla */
        <div className="bg-[#151921] border border-[#232838] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0B0E14] border-b border-[#232838]">
                  <th className="px-4 py-3 text-left">
                    <button 
                      onClick={toggleSeleccionarTodos}
                      className="text-gray-400 hover:text-white"
                    >
                      {seleccionados.size === inscripcionesFiltradas.length && inscripcionesFiltradas.length > 0 ? 
                        <CheckSquare className="w-5 h-5 text-[#df2531]" /> : 
                        <Square className="w-5 h-5" />
                      }
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugadores</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inscripcionesFiltradas.map((insc) => (
                  <tr key={insc.id} className="border-b border-[#232838] hover:bg-[#1a1f2e]">
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => toggleSeleccionar(insc.id)}
                        className="text-gray-400 hover:text-[#df2531]"
                      >
                        {seleccionados.has(insc.id) ? 
                          <CheckSquare className="w-5 h-5 text-[#df2531]" /> : 
                          <Square className="w-5 h-5" />
                        }
                      </button>
                    </td>
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
                    <td className="px-4 py-3">
                      <EstadoBadge estado={insc.estado} />
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      Gs. {insc.pagos.reduce((s, p) => s + p.monto, 0).toLocaleString('es-PY')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {insc.estado !== 'CONFIRMADA' && insc.estado !== 'CANCELADA' && (
                          <button
                            onClick={() => {
                              setInscripcionSeleccionada(insc);
                              setModalConfirmar(true);
                            }}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                            title="Confirmar"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {insc.estado !== 'CANCELADA' && (
                          <button
                            onClick={() => {
                              setInscripcionSeleccionada(insc);
                              setModalCancelar(true);
                            }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                            title="Cancelar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inscripcionesFiltradas.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron inscripciones con los filtros aplicados</p>
          <button
            onClick={() => {
              setFiltroBusqueda('');
              setFiltroEstado('todos');
              setCategoriaActiva('todas');
              setFechaDesde('');
              setFechaHasta('');
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

      <ModalInscripcionManual
        isOpen={modalInscripcionManual}
        onClose={() => setModalInscripcionManual(false)}
        onSuccess={loadInscripciones}
        tournamentId={tournamentId}
        categorias={data?.porCategoria || []}
        costoInscripcion={0}
      />

      <ModalEditarInscripcion
        isOpen={modalEditar}
        onClose={() => setModalEditar(false)}
        onSuccess={loadInscripciones}
        tournamentId={tournamentId}
        inscripcion={inscripcionSeleccionada}
      />

      <ModalCambiarCategoria
        isOpen={modalCambiarCategoria}
        onClose={() => setModalCambiarCategoria(false)}
        onSuccess={loadInscripciones}
        tournamentId={tournamentId}
        inscripcion={inscripcionSeleccionada}
        categorias={data?.porCategoria || []}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE: EstadoBadge
// ═══════════════════════════════════════════════════════════
function EstadoBadge({ estado }: { estado: string }) {
  const config: Record<string, { text: string; className: string }> = {
    CONFIRMADA: { text: 'Confirmada', className: 'bg-emerald-500/20 text-emerald-400' },
    PENDIENTE_PAGO: { text: 'Pendiente Pago', className: 'bg-amber-500/20 text-amber-400' },
    PENDIENTE_CONFIRMACION: { text: 'Pendiente Conf.', className: 'bg-blue-500/20 text-blue-400' },
    CANCELADA: { text: 'Cancelada', className: 'bg-red-500/20 text-red-400' },
    RECHAZADA: { text: 'Rechazada', className: 'bg-gray-500/20 text-gray-400' },
  };

  const { text, className } = config[estado] || { text: estado, className: 'bg-gray-500/20 text-gray-400' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {text}
    </span>
  );
}
