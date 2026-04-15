import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Settings, 
  Lock, 
  Unlock,
  CheckCircle2, 
  Users, 
  Trophy,
  DollarSign,
  User,
  Save,
  RefreshCw,
  ExternalLink,
  Search,
  AlertTriangle,
  Check
} from 'lucide-react';
import { torneoV2Service } from '../../../services/torneoV2Service';
import { formatCurrency } from '../../../utils/currency';
import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';


interface DashboardStats {
  totalTorneos: number;
  torneosActivos: number;
  torneosBloqueados: number;
  totalJugadores: number;
  comisionPendienteTotal: number;
  ingresosMes: number;
  comisionConfigurada: number;
}

interface TorneoBloqueado {
  id: string;
  nombre: string;
  organizador: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  };
  inscripciones: number;
  comision: {
    estado: string;
    montoEstimado: number;
    montoPagado: number;
    comprobanteUrl?: string;
    bloqueoActivo: boolean;
    rondaBloqueo: string;
  };
}

interface ConfigItem {
  clave: string;
  valor: string;
  descripcion: string;
}

export function FairpadelPanel() {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'config' | 'bloqueados' | 'comisiones'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [torneosBloqueados, setTorneosBloqueados] = useState<TorneoBloqueado[]>([]);
  const [torneosComisiones, setTorneosComisiones] = useState<TorneoBloqueado[]>([]);
  const [filtroComisiones, setFiltroComisiones] = useState<'todos' | 'pendientes' | 'bloqueados' | 'pagados' | 'exonerados'>('todos');
  const [busquedaComisiones, setBusquedaComisiones] = useState('');
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { confirm, ...confirmState } = useConfirm();

  // Valores editables de config
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dashData, configData, bloqueadosData, comisionesData] = await Promise.all([
        torneoV2Service.getDashboard(),
        torneoV2Service.getConfig(),
        torneoV2Service.getTorneosBloqueados(),
        torneoV2Service.getTorneosComisiones(),
      ]);

      setStats(dashData.stats);
      setConfigs(configData.configs);
      setTorneosBloqueados(bloqueadosData.torneos);
      setTorneosComisiones(comisionesData.torneos);
      
      // Inicializar valores editables
      const initialValues: Record<string, string> = {};
      configData.configs.forEach((c: ConfigItem) => {
        initialValues[c.clave] = c.valor;
      });
      setEditValues(initialValues);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMessage({ type: 'error', text: 'Error cargando datos' });
    } finally {
      setLoading(false);
    }
  };

  const loadComisiones = async () => {
    try {
      const data = await torneoV2Service.getTorneosComisiones({
        estado: filtroComisiones === 'todos' ? undefined : filtroComisiones,
        busqueda: busquedaComisiones.trim() || undefined,
      });
      setTorneosComisiones(data.torneos);
    } catch (error) {
      console.error('Error cargando comisiones:', error);
      setMessage({ type: 'error', text: 'Error cargando comisiones' });
    }
  };

  const saveConfig = async (clave: string) => {
    try {
      setSaving(true);
      await torneoV2Service.updateConfig(clave, editValues[clave]);
      setMessage({ type: 'success', text: 'Configuración guardada' });
      await loadAllData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error guardando configuración' });
    } finally {
      setSaving(false);
    }
  };

  const liberarTorneo = async (id: string, montoPagado: number) => {
    try {
      await torneoV2Service.liberarTorneo(id, { montoPagado });
      setMessage({ type: 'success', text: 'Torneo liberado correctamente' });
      await loadAllData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error liberando torneo' });
    }
  };

  const bloquearTorneo = async (id: string) => {
    const confirmed = await confirm({
      title: 'Bloquear torneo',
      message: '¿Estás seguro de bloquear este torneo? El organizador no podrá avanzar con el torneo hasta pagar la comisión.',
      confirmText: 'Bloquear',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await torneoV2Service.bloquearTorneo(id);
      setMessage({ type: 'success', text: 'Torneo bloqueado correctamente' });
      await loadAllData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error bloqueando torneo' });
    }
  };

  const exonerarTorneo = async (id: string) => {
    const confirmed = await confirm({
      title: 'Exonerar torneo',
      message: '¿Estás seguro de exonerar este torneo? No se cobrará comisión.',
      confirmText: 'Exonerar',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    if (!confirmed) return;
    try {
      await torneoV2Service.exonerarTorneo(id);
      setMessage({ type: 'success', text: 'Torneo exonerado correctamente' });
      await loadAllData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error exonerando torneo' });
    }
  };

  useEffect(() => {
    if (activeSubTab === 'comisiones') {
      loadComisiones();
    }
  }, [activeSubTab, filtroComisiones, busquedaComisiones]);

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Total Torneos"
          value={stats?.totalTorneos || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={Users}
          label="Jugadores"
          value={stats?.totalJugadores || 0}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Lock}
          label="Torneos Bloqueados"
          value={stats?.torneosBloqueados || 0}
          color="bg-red-500"
        />
        <StatCard
          icon={DollarSign}
          label="Ingresos del Mes"
          value={formatCurrency(stats?.ingresosMes || 0)}
          color="bg-amber-500"
        />
      </div>

      {/* Comisión Configurada */}
      <div className="glass rounded-2xl p-6 border border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Comisión Configurada</h3>
            <p className="text-slate-400 text-sm">Monto que se cobra por cada jugador inscripto confirmado</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-emerald-400">
              {formatCurrency(stats?.comisionConfigurada || 0)}
            </span>
            <p className="text-slate-500 text-sm">por jugador</p>
          </div>
        </div>
      </div>

      {/* Pendiente de cobro */}
      <div className="glass rounded-2xl p-6 border border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Comisión Pendiente</h3>
              <p className="text-slate-400 text-sm">Total estimado por cobrar</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-400">
            {formatCurrency(stats?.comisionPendienteTotal || 0)}
          </span>
        </div>
      </div>
    </div>
  );

  const renderConfig = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Configuración de FairPadel</h3>
        <button
          onClick={loadAllData}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </button>
      </div>

      <div className="space-y-4">
        {configs.map((config) => (
          <div key={config.clave} className="glass rounded-xl p-4 border border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-white block mb-1">
                  {config.clave.replace(/_/g, ' ')}
                </label>
                <p className="text-xs text-slate-500 mb-3">{config.descripcion}</p>
                <input
                  type="text"
                  value={editValues[config.clave] || ''}
                  onChange={(e) => setEditValues({ ...editValues, [config.clave]: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="Sin configurar"
                />
              </div>
              <button
                onClick={() => saveConfig(config.clave)}
                disabled={saving || editValues[config.clave] === config.valor}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ayuda visual */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          Configuraciones importantes
        </h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• <strong>COMISION_POR_JUGADOR:</strong> Monto fijo que cobra FairPadel por cada jugador</li>
          <li>• <strong>RONDA_BLOQUEO_PAGO:</strong> En qué instancia se bloquea el torneo (CUARTOS, SEMIFINALES, FINAL)</li>
          <li>• <strong>WHATSAPP_ADMIN:</strong> Número donde los organizadores envían comprobantes</li>
          <li>• <strong>BANCO_*:</strong> Datos para que los organizadores hagan transferencias</li>
        </ul>
      </div>
    </div>
  );

  const renderBloqueados = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Torneos Bloqueados ({torneosBloqueados.length})
        </h3>
        <button
          onClick={loadAllData}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </button>
      </div>

      {torneosBloqueados.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Todo al día</h3>
          <p className="text-slate-400">No hay torneos bloqueados pendientes de pago</p>
        </div>
      ) : (
        <div className="space-y-4">
          {torneosBloqueados.map((torneo) => (
            <motion.div
              key={torneo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 border border-red-500/20"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{torneo.nombre}</h4>
                      <p className="text-sm text-slate-400">
                        Bloqueado en: <span className="text-red-400">{torneo.comision.rondaBloqueo}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="w-4 h-4" />
                      {torneo.organizador.nombre} {torneo.organizador.apellido}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-4 h-4" />
                      {torneo.inscripciones} inscripciones
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <DollarSign className="w-4 h-4" />
                      Estimado: {formatCurrency(torneo.comision.montoEstimado)}
                    </div>
                  </div>

                  {torneo.comision.comprobanteUrl && (
                    <a
                      href={torneo.comision.comprobanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver comprobante subido
                    </a>
                  )}
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Estado</span>
                    <span className={`text-sm font-medium ${
                      torneo.comision.estado === 'PENDIENTE_VERIFICACION' 
                        ? 'text-amber-400' 
                        : 'text-red-400'
                    }`}>
                      {torneo.comision.estado === 'PENDIENTE_VERIFICACION' 
                        ? 'Pendiente verificación' 
                        : 'Pendiente pago'}
                    </span>
                  </div>
                  
                  {torneo.comision.estado === 'PENDIENTE_VERIFICACION' && (
                    <button
                      onClick={() => liberarTorneo(torneo.id, torneo.comision.montoEstimado)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      Liberar Torneo
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderComisiones = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">
          Comisiones por Torneo ({torneosComisiones.length})
        </h3>
        <button
          onClick={loadComisiones}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors self-start"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2">
          {(['todos', 'pendientes', 'bloqueados', 'pagados', 'exonerados'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroComisiones(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtroComisiones === f
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f === 'todos' ? 'Todos' :
               f === 'pendientes' ? 'Pendientes' :
               f === 'bloqueados' ? 'Bloqueados' :
               f === 'pagados' ? 'Pagados' : 'Exonerados'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar torneo u organizador..."
            value={busquedaComisiones}
            onChange={(e) => setBusquedaComisiones(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {torneosComisiones.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Sin resultados</h3>
          <p className="text-slate-400">No hay torneos que coincidan con el filtro seleccionado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {torneosComisiones.map((torneo) => (
            <motion.div
              key={torneo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-2xl p-5 border ${
                torneo.comision.bloqueoActivo
                  ? 'border-red-500/20'
                  : torneo.comision.estado === 'PAGADO'
                    ? 'border-emerald-500/20'
                    : torneo.comision.estado === 'EXONERADO'
                      ? 'border-blue-500/20'
                      : 'border-slate-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      torneo.comision.bloqueoActivo
                        ? 'bg-red-500/20'
                        : torneo.comision.estado === 'PAGADO'
                          ? 'bg-emerald-500/20'
                          : torneo.comision.estado === 'EXONERADO'
                            ? 'bg-blue-500/20'
                            : 'bg-amber-500/20'
                    }`}>
                      {torneo.comision.bloqueoActivo ? (
                        <Lock className="w-5 h-5 text-red-400" />
                      ) : torneo.comision.estado === 'PAGADO' ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : torneo.comision.estado === 'EXONERADO' ? (
                        <DollarSign className="w-5 h-5 text-blue-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{torneo.nombre}</h4>
                      <p className="text-sm text-slate-400">
                        {torneo.organizador.nombre} {torneo.organizador.apellido}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-4 h-4" />
                      {torneo.inscripciones} inscripciones
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <DollarSign className="w-4 h-4" />
                      Comisión: {formatCurrency(torneo.comision.montoEstimado)}
                    </div>
                    {torneo.comision.montoPagado > 0 && (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Check className="w-4 h-4" />
                        Pagado: {formatCurrency(torneo.comision.montoPagado)}
                      </div>
                    )}
                  </div>

                  {torneo.comision.comprobanteUrl && (
                    <a
                      href={torneo.comision.comprobanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver comprobante subido
                    </a>
                  )}
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Estado comisión</span>
                    <span className={`text-sm font-medium ${
                      torneo.comision.estado === 'PAGADO'
                        ? 'text-emerald-400'
                        : torneo.comision.estado === 'EXONERADO'
                          ? 'text-blue-400'
                          : torneo.comision.estado === 'PENDIENTE_VERIFICACION'
                            ? 'text-amber-400'
                            : torneo.comision.bloqueoActivo
                              ? 'text-red-400'
                              : 'text-slate-300'
                    }`}>
                      {torneo.comision.estado === 'PAGADO'
                        ? 'Pagado'
                        : torneo.comision.estado === 'EXONERADO'
                          ? 'Exonerado'
                          : torneo.comision.estado === 'PENDIENTE_VERIFICACION'
                            ? 'Pendiente verificación'
                            : torneo.comision.bloqueoActivo
                              ? 'Bloqueado'
                              : 'Pendiente'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {torneo.comision.estado !== 'PAGADO' && torneo.comision.estado !== 'EXONERADO' && (
                      <>
                        {!torneo.comision.bloqueoActivo && (
                          <button
                            onClick={() => bloquearTorneo(torneo.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                          >
                            <Lock className="w-4 h-4" />
                            Bloquear
                          </button>
                        )}
                        <button
                          onClick={() => liberarTorneo(torneo.id, torneo.comision.montoEstimado)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                        >
                          <Unlock className="w-4 h-4" />
                          {torneo.comision.bloqueoActivo ? 'Liberar' : 'Marcar pagado'}
                        </button>
                        <button
                          onClick={() => exonerarTorneo(torneo.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                        >
                          <DollarSign className="w-4 h-4" />
                          Exonerar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">FairPadel Admin</h2>
          <p className="text-slate-400">Panel de control del sistema</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        <SubTabButton
          label="Dashboard"
          icon={LayoutDashboard}
          active={activeSubTab === 'dashboard'}
          onClick={() => setActiveSubTab('dashboard')}
        />
        <SubTabButton
          label={`Bloqueados ${torneosBloqueados.length > 0 ? `(${torneosBloqueados.length})` : ''}`}
          icon={Lock}
          active={activeSubTab === 'bloqueados'}
          onClick={() => setActiveSubTab('bloqueados')}
          alert={torneosBloqueados.length > 0}
        />
        <SubTabButton
          label="Comisiones"
          icon={DollarSign}
          active={activeSubTab === 'comisiones'}
          onClick={() => setActiveSubTab('comisiones')}
        />
        <SubTabButton
          label="Configuración"
          icon={Settings}
          active={activeSubTab === 'config'}
          onClick={() => setActiveSubTab('config')}
        />
      </div>

      {/* Mensajes */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <>
          {activeSubTab === 'dashboard' && renderDashboard()}
          {activeSubTab === 'config' && renderConfig()}
          {activeSubTab === 'bloqueados' && renderBloqueados()}
          {activeSubTab === 'comisiones' && renderComisiones()}
        </>
      )}

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

// Sub-componentes

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  return (
    <div className="glass rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${color} bg-opacity-20 rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SubTabButton({
  label,
  icon: Icon,
  active,
  onClick,
  alert = false,
}: {
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  alert?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
        active
          ? 'bg-emerald-500 text-white shadow-lg'
          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
      } ${alert ? 'ring-2 ring-red-500/50' : ''}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
