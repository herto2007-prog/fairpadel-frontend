import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Users, Calendar, Trophy, CheckCircle2, AlertCircle,
  Download, RefreshCw, Database, LayoutGrid, UserX, Activity
} from 'lucide-react';
import { api } from '../../../../services/api';
import { formatDatePY, formatDatePYLong } from '../../../../utils/date';
import { useAuth } from '../../../../features/auth/context/AuthContext';

interface AuditoriaManagerProps {
  tournamentId: string;
}

type VistaTipo = 'inscripciones' | 'partidos' | 'slots' | 'resumen';

interface InscripcionData {
  id: string;
  estado: string;
  modoPago: string;
  notas: string;
  createdAt: string;
  estadoClasificacion: string;
  rondaClasificacion: string;
  pareja: {
    jugador1: string;
    jugador1Categoria: string;
    jugador2: string;
    jugador2Categoria: string;
    telefonoJ1?: string;
    telefonoJ2?: string;
    completa: boolean;
  };
  categoria: {
    id: string;
    nombre: string;
    genero: string;
  };
  pagos: Array<{
    id: string;
    estado: string;
    monto: number;
    metodo: string;
    fecha: string;
  }>;
  programacion: Array<{
    fase: string;
    fecha: string;
    hora: string;
    cancha?: string;
    sede?: string;
  }>;
  tieneSlotAsignado: boolean;
}

interface PartidoData {
  id: string;
  fase: string;
  numeroRonda: number;
  estado: string;
  categoria: {
    id: string;
    nombre: string;
    genero: string;
  };
  pareja1: string;
  pareja2: string;
  parejaGanadora: string | null;
  programacion: {
    fecha: string;
    hora: string;
    cancha?: string;
    sede?: string;
  } | null;
  estaProgramado: boolean;
  resultado: {
    set1: string;
    set2: string | null;
    set3: string | null;
    ganador: string | null;
  } | null;
  esBye: boolean;
  tipoEntrada1: string | null;
  tipoEntrada2: string | null;
  inscripcion1Id: string | null;
  inscripcion2Id: string | null;
  createdAt: string;
}

interface SlotData {
  id: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  fase: string | null;
  cancha: {
    id: string;
    nombre: string;
    sede?: string;
  } | null;
  ocupadoPor: {
    partidoId: string;
    fase: string;
    categoria?: string;
    pareja1: string;
    pareja2: string;
  } | null;
}

interface DiaSlotsData {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  minutosSlot: number;
  fasesPermitidas: string | null;
  slots: SlotData[];
}

interface ResumenData {
  torneo: {
    id: string;
    nombre: string;
    estado: string;
    fechaInicio: string;
    fechaFin: string;
    fechaFinales: string | null;
  };
  estadisticas: {
    totalInscripciones: number;
    totalPartidos: number;
    totalCategorias: number;
    diasConfigurados: number;
    totalSlots: number;
    slotsOcupados: number;
    partidosFinalizados: number;
    inscripcionesPorEstado: Record<string, number>;
  };
  categorias: Array<{
    id: string;
    nombre: string;
    estado: string;
    inscripcionesAbiertas: boolean;
  }>;
}

export function AuditoriaManager({ tournamentId }: AuditoriaManagerProps) {
  const { user } = useAuth();
  const [vistaActiva, setVistaActiva] = useState<VistaTipo>('resumen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroSinPareja, setFiltroSinPareja] = useState(false);
  const [filtroSinSlot, setFiltroSinSlot] = useState(false);
  const [filtroSinProgramar, setFiltroSinProgramar] = useState(false);
  const [filtroFinalizados, setFiltroFinalizados] = useState(false);

  // Datos
  const [inscripciones, setInscripciones] = useState<InscripcionData[]>([]);
  const [partidos, setPartidos] = useState<PartidoData[]>([]);
  const [slotsData, setSlotsData] = useState<DiaSlotsData[]>([]);
  const [resumen, setResumen] = useState<ResumenData | null>(null);
  const [stats, setStats] = useState<{ total: number; ocupados: number; libres: number; porcentajeOcupacion: number } | null>(null);

  useEffect(() => {
    loadData();
  }, [tournamentId, vistaActiva]);

  const loadData = async () => {
    if (!user?.roles?.includes('admin')) {
      setError('Solo administradores pueden acceder a esta sección');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      switch (vistaActiva) {
        case 'inscripciones':
          await loadInscripciones();
          break;
        case 'partidos':
          await loadPartidos();
          break;
        case 'slots':
          await loadSlots();
          break;
        case 'resumen':
          await loadResumen();
          break;
      }
    } catch (err: any) {
      console.error('Error cargando datos de auditoría:', err);
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadInscripciones = async () => {
    const params = new URLSearchParams();
    if (busqueda) params.append('busqueda', busqueda);
    if (filtroEstado) params.append('estado', filtroEstado);
    if (filtroCategoria) params.append('categoriaId', filtroCategoria);
    if (filtroSinPareja) params.append('sinPareja', 'true');
    if (filtroSinSlot) params.append('sinSlot', 'true');

    const { data } = await api.get(`/admin/auditoria/torneos/${tournamentId}/inscripciones?${params}`);
    if (data.success) {
      setInscripciones(data.data);
    }
  };

  const loadPartidos = async () => {
    const params = new URLSearchParams();
    if (busqueda) params.append('busqueda', busqueda);
    if (filtroCategoria) params.append('categoriaId', filtroCategoria);
    if (filtroSinProgramar) params.append('sinProgramar', 'true');
    if (filtroFinalizados) params.append('finalizados', 'true');

    const { data } = await api.get(`/admin/auditoria/torneos/${tournamentId}/partidos?${params}`);
    if (data.success) {
      setPartidos(data.data);
    }
  };

  const loadSlots = async () => {
    const params = new URLSearchParams();
    if (busqueda) params.append('fecha', busqueda);

    const { data } = await api.get(`/admin/auditoria/torneos/${tournamentId}/slots?${params}`);
    if (data.success) {
      setSlotsData(data.data);
      setStats(data.stats);
    }
  };

  const loadResumen = async () => {
    const { data } = await api.get(`/admin/auditoria/torneos/${tournamentId}/resumen`);
    if (data.success) {
      setResumen(data.data);
    }
  };

  const handleExportar = () => {
    let csv = '';
    let filename = '';

    if (vistaActiva === 'inscripciones') {
      filename = `auditoria-inscripciones-${tournamentId}.csv`;
      csv = 'ID,Estado,Jugador 1,Jugador 2,Categoría,Pago,Slots\n';
      inscripciones.forEach((i) => {
        csv += `${i.id},${i.estado},${i.pareja.jugador1},${i.pareja.jugador2},${i.categoria.nombre},${i.pagos.length > 0 ? 'Sí' : 'No'},${i.programacion.length}\n`;
      });
    } else if (vistaActiva === 'partidos') {
      filename = `auditoria-partidos-${tournamentId}.csv`;
      csv = 'ID,Fase,Categoría,Pareja 1,Pareja 2,Fecha,Hora,Cancha,Estado\n';
      partidos.forEach((p) => {
        csv += `${p.id},${p.fase},${p.categoria.nombre},${p.pareja1},${p.pareja2},${p.programacion?.fecha || ''},${p.programacion?.hora || ''},${p.programacion?.cancha || ''},${p.estado}\n`;
      });
    }

    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }
  };

  const getEstadoBadge = (estado: string) => {
    const colores: Record<string, string> = {
      CONFIRMADA: 'bg-green-500/20 text-green-400',
      PENDIENTE_PAGO: 'bg-yellow-500/20 text-yellow-400',
      PENDIENTE_CONFIRMACION: 'bg-orange-500/20 text-orange-400',
      CANCELADA: 'bg-red-500/20 text-red-400',
      PROGRAMADO: 'bg-blue-500/20 text-blue-400',
      FINALIZADO: 'bg-green-500/20 text-green-400',
      EN_JUEGO: 'bg-purple-500/20 text-purple-400',
      LIBRE: 'bg-green-500/20 text-green-400',
      OCUPADO: 'bg-red-500/20 text-red-400',
    };
    return colores[estado] || 'bg-gray-500/20 text-gray-400';
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: Activity },
    { id: 'inscripciones', label: 'Inscripciones', icon: Users },
    { id: 'partidos', label: 'Partidos', icon: Trophy },
    { id: 'slots', label: 'Slots', icon: Calendar },
  ] as const;

  if (!user?.roles?.includes('admin')) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Acceso Restringido</h3>
        <p className="text-white/60">Solo administradores pueden acceder a la auditoría de datos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#df2531]" />
          <h2 className="text-lg font-semibold text-white">Auditoría de Datos</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportar}
            disabled={vistaActiva === 'slots' || vistaActiva === 'resumen'}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#df2531]/20 hover:bg-[#df2531]/30 text-[#df2531] rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setVistaActiva(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              vistaActiva === tab.id
                ? 'bg-[#df2531] text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder={
                  vistaActiva === 'slots' 
                    ? 'Buscar por fecha (YYYY-MM-DD)...' 
                    : 'Buscar por nombre...'
                }
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#df2531]/50"
              />
            </div>
          </div>

          {/* Filtros específicos por vista */}
          {vistaActiva === 'inscripciones' && (
            <>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#df2531]/50"
              >
                <option value="" className="bg-[#1a1d29]">Todos los estados</option>
                <option value="CONFIRMADA" className="bg-[#1a1d29]">Confirmada</option>
                <option value="PENDIENTE_PAGO" className="bg-[#1a1d29]">Pendiente Pago</option>
                <option value="PENDIENTE_CONFIRMACION" className="bg-[#1a1d29]">Pendiente Confirmación</option>
                <option value="CANCELADA" className="bg-[#1a1d29]">Cancelada</option>
              </select>
              <label className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm cursor-pointer hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={filtroSinPareja}
                  onChange={(e) => setFiltroSinPareja(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                />
                Sin pareja
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm cursor-pointer hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={filtroSinSlot}
                  onChange={(e) => setFiltroSinSlot(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                />
                Sin slot
              </label>
            </>
          )}

          {vistaActiva === 'partidos' && (
            <>
              <label className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm cursor-pointer hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={filtroSinProgramar}
                  onChange={(e) => setFiltroSinProgramar(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                />
                Sin programar
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm cursor-pointer hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={filtroFinalizados}
                  onChange={(e) => setFiltroFinalizados(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#df2531] focus:ring-[#df2531]"
                />
                Finalizados
              </label>
            </>
          )}

          <button
            onClick={() => {
              setBusqueda('');
              setFiltroEstado('');
              setFiltroCategoria('');
              setFiltroSinPareja(false);
              setFiltroSinSlot(false);
              setFiltroSinProgramar(false);
              setFiltroFinalizados(false);
              loadData();
            }}
            className="px-3 py-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
          />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white/60">{error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={vistaActiva}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Vista Resumen */}
            {vistaActiva === 'resumen' && resumen && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-white/60 text-sm">Inscripciones</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{resumen.estadisticas.totalInscripciones}</p>
                  </div>

                  <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-white/60 text-sm">Partidos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{resumen.estadisticas.totalPartidos}</p>
                  </div>

                  <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="text-white/60 text-sm">Finalizados</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{resumen.estadisticas.partidosFinalizados}</p>
                  </div>

                  <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-orange-400" />
                      </div>
                      <span className="text-white/60 text-sm">Slots Ocupados</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{resumen.estadisticas.slotsOcupados} <span className="text-sm text-white/40">/ {resumen.estadisticas.totalSlots}</span></p>
                  </div>
                </div>

                {/* Info del Torneo */}
                <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#df2531]" />
                    Información del Torneo
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-white/40">Nombre</span>
                      <p className="text-white">{resumen.torneo.nombre}</p>
                    </div>
                    <div>
                      <span className="text-white/40">Estado</span>
                      <p className="text-white">{resumen.torneo.estado}</p>
                    </div>
                    <div>
                      <span className="text-white/40">Inicio</span>
                      <p className="text-white">{formatDatePY(resumen.torneo.fechaInicio)}</p>
                    </div>
                    <div>
                      <span className="text-white/40">Finales</span>
                      <p className="text-white">{resumen.torneo.fechaFinales ? formatDatePY(resumen.torneo.fechaFinales) : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Inscripciones por Estado */}
                <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#df2531]" />
                    Inscripciones por Estado
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(resumen.estadisticas.inscripcionesPorEstado).map(([estado, count]) => (
                      <div key={estado} className="bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">{estado.replace(/_/g, ' ')}</span>
                        <p className="text-xl font-bold text-white">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categorías */}
                <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-[#df2531]" />
                    Categorías ({resumen.categorias.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 border-b border-white/5">
                          <th className="text-left py-2 px-3">Nombre</th>
                          <th className="text-left py-2 px-3">Estado</th>
                          <th className="text-left py-2 px-3">Inscripciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumen.categorias.map((cat) => (
                          <tr key={cat.id} className="border-b border-white/5 last:border-0">
                            <td className="py-2 px-3 text-white">{cat.nombre}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-1 rounded text-xs ${getEstadoBadge(cat.estado)}`}>
                                {cat.estado.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={cat.inscripcionesAbiertas ? 'text-green-400' : 'text-red-400'}>
                                {cat.inscripcionesAbiertas ? 'Abiertas' : 'Cerradas'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Vista Inscripciones */}
            {vistaActiva === 'inscripciones' && (
              <div className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-white/60 text-sm">Total: <strong className="text-white">{inscripciones.length}</strong> inscripciones</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/40 border-b border-white/5 bg-white/[0.02]">
                        <th className="text-left py-3 px-4">Pareja</th>
                        <th className="text-left py-3 px-4">Categoría</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Pagos</th>
                        <th className="text-left py-3 px-4">Programación</th>
                        <th className="text-left py-3 px-4">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inscripciones.map((insc) => (
                        <tr key={insc.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="text-white font-medium">{insc.pareja.jugador1}</div>
                              {insc.pareja.completa ? (
                                <div className="text-white/60">{insc.pareja.jugador2}</div>
                              ) : (
                                <div className="text-yellow-400 text-xs flex items-center gap-1">
                                  <UserX className="w-3 h-3" />
                                  Sin pareja
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white">{insc.categoria.nombre}</span>
                            <span className="text-white/40 text-xs ml-2">({insc.categoria.genero})</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${getEstadoBadge(insc.estado)}`}>
                              {insc.estado.replace(/_/g, ' ')}
                            </span>
                            {insc.estadoClasificacion && (
                              <div className="text-white/40 text-xs mt-1">
                                {insc.estadoClasificacion} {insc.rondaClasificacion && `- ${insc.rondaClasificacion}`}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {insc.pagos.length > 0 ? (
                              <div className="space-y-1">
                                {insc.pagos.map((p) => (
                                  <div key={p.id} className="text-xs">
                                    <span className={`px-1.5 py-0.5 rounded ${getEstadoBadge(p.estado)}`}>
                                      {p.estado}
                                    </span>
                                    <span className="text-white/60 ml-2">Gs. {Number(p.monto).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-white/40 text-xs">Sin pagos</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {insc.programacion.length > 0 ? (
                              <div className="space-y-1">
                                {insc.programacion.slice(0, 2).map((p, idx) => (
                                  <div key={idx} className="text-xs text-white/60">
                                    <span className="text-white">{p.fase}</span> - {p.fecha ? formatDatePY(p.fecha) : 'Sin fecha'} {p.hora}
                                  </div>
                                ))}
                                {insc.programacion.length > 2 && (
                                  <div className="text-xs text-white/40">+{insc.programacion.length - 2} más</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-yellow-400 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Sin slot
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white/40 text-xs truncate max-w-[150px] block">
                              {insc.notas || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {inscripciones.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">No hay inscripciones</p>
                  </div>
                )}
              </div>
            )}

            {/* Vista Partidos */}
            {vistaActiva === 'partidos' && (
              <div className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-white/60 text-sm">Total: <strong className="text-white">{partidos.length}</strong> partidos</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/40 border-b border-white/5 bg-white/[0.02]">
                        <th className="text-left py-3 px-4">Fase</th>
                        <th className="text-left py-3 px-4">Categoría</th>
                        <th className="text-left py-3 px-4">Pareja 1</th>
                        <th className="text-left py-3 px-4">Pareja 2</th>
                        <th className="text-left py-3 px-4">Programación</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidos.map((p) => (
                        <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <span className="text-white font-medium">{p.fase}</span>
                            {p.esBye && (
                              <span className="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">BYE</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-white">{p.categoria.nombre}</td>
                          <td className="py-3 px-4">
                            <span className={p.inscripcion1Id ? 'text-white' : 'text-white/40'}>
                              {p.pareja1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={p.inscripcion2Id ? 'text-white' : 'text-white/40'}>
                              {p.pareja2}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {p.estaProgramado ? (
                              <div className="text-sm">
                                <div className="text-white">{p.programacion?.fecha ? formatDatePY(p.programacion.fecha) : ''} {p.programacion?.hora}</div>
                                <div className="text-white/40 text-xs">{p.programacion?.cancha} - {p.programacion?.sede}</div>
                              </div>
                            ) : (
                              <span className="text-yellow-400 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Sin programar
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${getEstadoBadge(p.estado)}`}>
                              {p.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {p.resultado ? (
                              <div className="text-sm">
                                <div className="text-white">{p.resultado.set1}</div>
                                {p.resultado.set2 && <div className="text-white/60">{p.resultado.set2}</div>}
                                {p.resultado.set3 && <div className="text-white/60">{p.resultado.set3}</div>}
                              </div>
                            ) : (
                              <span className="text-white/40 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {partidos.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">No hay partidos</p>
                  </div>
                )}
              </div>
            )}

            {/* Vista Slots */}
            {vistaActiva === 'slots' && (
              <div className="space-y-4">
                {/* Stats */}
                {stats && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5 text-center">
                      <div className="text-white/40 text-xs mb-1">Total Slots</div>
                      <div className="text-xl font-bold text-white">{stats.total}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5 text-center">
                      <div className="text-white/40 text-xs mb-1">Ocupados</div>
                      <div className="text-xl font-bold text-green-400">{stats.ocupados}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5 text-center">
                      <div className="text-white/40 text-xs mb-1">Libres</div>
                      <div className="text-xl font-bold text-white">{stats.libres}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5 text-center">
                      <div className="text-white/40 text-xs mb-1">Ocupación</div>
                      <div className="text-xl font-bold text-[#df2531]">{stats.porcentajeOcupacion}%</div>
                    </div>
                  </div>
                )}

                {/* Slots por día */}
                {slotsData.map((dia) => (
                  <div key={dia.fecha} className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#df2531]" />
                        <span className="text-white font-medium">{formatDatePYLong(dia.fecha)}</span>
                        <span className="text-white/40 text-sm">{dia.horaInicio} - {dia.horaFin}</span>
                      </div>
                      <span className="text-white/40 text-sm">{dia.slots.length} slots</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-white/40 border-b border-white/5">
                            <th className="text-left py-2 px-4">Hora</th>
                            <th className="text-left py-2 px-4">Cancha</th>
                            <th className="text-left py-2 px-4">Estado</th>
                            <th className="text-left py-2 px-4">Ocupado por</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dia.slots.map((slot) => (
                            <tr key={slot.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                              <td className="py-2 px-4 text-white">{slot.horaInicio} - {slot.horaFin}</td>
                              <td className="py-2 px-4">
                                <span className="text-white">{slot.cancha?.nombre || 'N/A'}</span>
                                {slot.cancha?.sede && (
                                  <span className="text-white/40 text-xs ml-2">({slot.cancha.sede})</span>
                                )}
                              </td>
                              <td className="py-2 px-4">
                                <span className={`px-2 py-1 rounded text-xs ${getEstadoBadge(slot.estado)}`}>
                                  {slot.estado}
                                </span>
                              </td>
                              <td className="py-2 px-4">
                                {slot.ocupadoPor ? (
                                  <div className="text-sm">
                                    <div className="text-white/60 text-xs">{slot.ocupadoPor.categoria} - {slot.ocupadoPor.fase}</div>
                                    <div className="text-white truncate max-w-[300px]">{slot.ocupadoPor.pareja1} vs {slot.ocupadoPor.pareja2}</div>
                                  </div>
                                ) : (
                                  <span className="text-white/40 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {slotsData.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">No hay slots configurados</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
