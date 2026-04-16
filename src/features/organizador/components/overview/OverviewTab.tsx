import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Users, DollarSign, AlertCircle, CheckCircle2,
  MapPin, Link as LinkIcon, ExternalLink, ChevronRight,
  Flame, Target, Calendar, TrendingUp, AlertTriangle,
  Info, Copy, Check
} from 'lucide-react';
import { overviewService, OverviewData, TareaPendiente } from '../../services/overviewService';
import { formatDatePY } from '../../../../utils/date';
import { SolicitarCircuitoCard } from './SolicitarCircuitoCard';

interface OverviewTabProps {
  tournamentId: string;
  onTabChange: (tab: string) => void;
}

export function OverviewTab({ tournamentId, onTabChange }: OverviewTabProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadOverview();
  }, [tournamentId]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const overview = await overviewService.getOverview(tournamentId);
      setData(overview);
    } catch (error) {
      console.error('Error cargando overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (data?.linkPublico) {
      navigator.clipboard.writeText(`${window.location.origin}${data.linkPublico}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'configuracion': return 'bg-gray-500/20 text-gray-400';
      case 'inscripciones': return 'bg-blue-500/20 text-blue-400';
      case 'sorteo': return 'bg-purple-500/20 text-purple-400';
      case 'programacion': return 'bg-orange-500/20 text-orange-400';
      case 'en_curso': return 'bg-green-500/20 text-green-400';
      case 'finalizado': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'configuracion': return 'Configuracion';
      case 'inscripciones': return 'Inscripciones Abiertas';
      case 'sorteo': return 'Listo para Sortear';
      case 'programacion': return 'Programacion';
      case 'en_curso': return 'En Curso';
      case 'finalizado': return 'Finalizado';
      default: return estado;
    }
  };

  const getTareaIcon = (tipo: TareaPendiente['tipo']) => {
    switch (tipo) {
      case 'urgente': return <Flame className="w-5 h-5 text-red-500" />;
      case 'advertencia': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTareaBg = (tipo: TareaPendiente['tipo']) => {
    switch (tipo) {
      case 'urgente': return 'bg-red-500/10 border-red-500/30';
      case 'advertencia': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'info': return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Error al cargar el resumen del torneo</p>
      </div>
    );
  }

  const { torneo, progreso, inscripciones, comision, tareasPendientes, linkPublico } = data;

  return (
    <div className="space-y-6">
      {/* Header con estado y progreso */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#151921] border border-[#232838] rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(torneo.estadoProceso)}`}>
                {getEstadoLabel(torneo.estadoProceso)}
              </span>
              {/* Nota: Ya no mostramos fecha de cierre. Las inscripciones se cierran manualmente. */}
            </div>
            <h2 className="text-xl font-bold text-white">{torneo.nombre}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {torneo.sede?.nombre || torneo.ciudad}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDatePY(torneo.fechaInicio)}
              </span>
            </div>
          </div>

          {/* Link publico */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#0B0E14] rounded-xl border border-[#232838]">
              <LinkIcon className="w-4 h-4 text-gray-500" />
              <code className="text-sm text-emerald-400">
                fairpadel.com{linkPublico}
              </code>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="p-2 bg-[#232838] hover:bg-[#2a3042] rounded-xl transition-colors"
              title="Copiar link"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
            </motion.button>
            <a
              href={linkPublico}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#232838] hover:bg-[#2a3042] rounded-xl transition-colors"
              title="Ver página pública"
              aria-label="Ver página pública"
            >
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progreso del torneo</span>
            <span className="text-white font-bold">{progreso.general}%</span>
          </div>
          <div className="h-3 bg-[#0B0E14] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progreso.general}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                progreso.general >= 80 ? 'bg-green-500' :
                progreso.general >= 50 ? 'bg-yellow-500' :
                'bg-[#df2531]'
              }`}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {progreso.detalle.map((req) => (
              <span key={req.nombre} className={`flex items-center gap-1 ${req.completado ? 'text-green-500' : ''}`}>
                {req.completado ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {req.nombre === 'flyer' ? 'Flyer' :
                 req.nombre === 'sede' ? 'Sede' :
                 req.nombre === 'fixture' ? 'Fixture' :
                 req.nombre === 'disponibilidad' ? 'Canchas' :
                 'Inscripciones'}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Inscripciones"
          value={inscripciones.total}
          subtext={`${inscripciones.confirmadas} confirmadas`}
          color="blue"
          onClick={() => onTabChange('inscripciones')}
        />
        <StatCard
          icon={DollarSign}
          label="Ingresos"
          value={`Gs. ${(inscripciones.ingresos / 1000000).toFixed(1)}M`}
          subtext={`${inscripciones.pendientesPago} pendientes pago`}
          color="green"
          onClick={() => onTabChange('inscripciones')}
        />
        <StatCard
          icon={Target}
          label="Checklist"
          value={`${progreso.checklist}%`}
          subtext="Tareas completadas"
          color="purple"
          onClick={() => onTabChange('checklist')}
        />
        <StatCard
          icon={Trophy}
          label="Estado"
          value={getEstadoLabel(torneo.estadoProceso)}
          subtext={
            comision?.bloqueoActivo
              ? `Bloqueado - Gs. ${comision.montoEstimado.toLocaleString('es-PY')} comisión`
              : comision
                ? `Gs. ${comision.montoEstimado.toLocaleString('es-PY')} comisión acumulada`
                : 'Todo OK'
          }
          color={comision?.bloqueoActivo ? 'red' : 'yellow'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tareas Pendientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-[#151921] border border-[#232838] rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#df2531]" />
              Tareas Pendientes
            </h3>
            <span className="text-sm text-gray-500">
              {tareasPendientes.length} {tareasPendientes.length === 1 ? 'tarea' : 'tareas'}
            </span>
          </div>

          {tareasPendientes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-400">Todo listo! No hay tareas pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tareasPendientes.map((tarea, index) => (
                <motion.div
                  key={tarea.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-4 p-4 rounded-xl border ${getTareaBg(tarea.tipo)}`}
                >
                  <div className="mt-0.5">{getTareaIcon(tarea.tipo)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{tarea.titulo}</h4>
                    <p className="text-sm text-gray-400 mt-1">{tarea.descripcion}</p>
                    {tarea.accion && (
                      <button
                        onClick={() => onTabChange(tarea.accion!.link)}
                        className="mt-3 text-sm text-[#df2531] hover:underline flex items-center gap-1"
                      >
                        {tarea.accion.texto}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Inscripciones por Categoria */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#151921] border border-[#232838] rounded-2xl p-6"
        >
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Por Categoria
          </h3>

          <div className="space-y-3">
            {inscripciones.porCategoria.map((cat) => (
              <div key={cat.categoriaId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{cat.nombre}</span>
                  <span className="text-gray-500">
                    {cat.confirmadas}/{cat.total}
                  </span>
                </div>
                <div className="h-2 bg-[#0B0E14] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${cat.total > 0 ? (cat.confirmadas / cat.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onTabChange('inscripciones')}
            className="w-full mt-6 py-2.5 bg-[#232838] hover:bg-[#2a3042] text-white text-sm font-medium rounded-xl transition-colors"
          >
            Ver todas las inscripciones
          </button>
        </motion.div>

        {/* Solicitar Circuito - Card propia */}
        <SolicitarCircuitoCard tournamentId={tournamentId} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENTE: StatCard
// ═══════════════════════════════════════════════════════

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  onClick?: () => void;
}

function StatCard({ icon: Icon, label, value, subtext, color, onClick }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    red: 'bg-red-500/10 text-red-500',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-[#151921] border border-[#232838] rounded-2xl p-5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtext}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
