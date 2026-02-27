import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { Loading, Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import toast from 'react-hot-toast';
import {
  Crown,
  CreditCard,
  Clock,
  Plus,
  X,
  DollarSign,
  Users,
  Ticket,
  Search,
  UserCheck,
  UserX,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Gift,
  AlertTriangle,
  Activity,
  CalendarClock,
  Wallet,
  Trophy,
  Settings,
  Save,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type Tab = 'resumen' | 'torneos' | 'comision' | 'suscripciones' | 'cupones' | 'actividad' | 'sms';

// ============ TIPOS ============

interface MetricasPremium {
  totalPremium: number;
  totalUsuarios: number;
  tasaConversion: number;
  suscripcionesActivas: number;
  suscripcionesPendientes: number;
  nuevosPremium30d: number;
  cancelaciones30d: number;
  mrr: number;
  arr: number;
  churnRate: number;
  conCupon: number;
  autoRenovarActivo: number;
  proximosVencer: number;
}

interface UsuarioPremium {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  email: string;
  telefono: string | null;
  ciudad: string | null;
  genero: string | null;
  fotoUrl: string | null;
  esPremium: boolean;
  createdAt: string;
  suscripciones: {
    id: string;
    estado: string;
    precio: string | number;
    fechaInicio: string;
    fechaFin: string;
    autoRenovar: boolean;
    cuponAplicado: string | null;
    plan: { nombre: string } | null;
  }[];
}

interface Suscripcion {
  id: string;
  periodo: 'MENSUAL';
  precio: string | number;
  estado: 'ACTIVA' | 'VENCIDA' | 'CANCELADA' | 'PENDIENTE_PAGO';
  fechaInicio: string;
  fechaFin: string;
  fechaRenovacion: string | null;
  autoRenovar: boolean;
  cuponAplicado: string | null;
  user: { id: string; nombre: string; apellido: string; email: string };
  plan: { id: string; nombre: string; precioMensual: string | number };
}

interface ActividadItem {
  id: string;
  usuario: { id: string; nombre: string; apellido: string; email: string; fotoUrl: string | null };
  plan: string | null;
  estado: string;
  precio: number;
  fechaInicio: string;
  fechaFin: string;
  autoRenovar: boolean;
  cuponAplicado: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Cupon {
  id: string;
  codigo: string;
  tipo: string;
  valor: string | number;
  fechaInicio: string;
  fechaExpiracion: string;
  limiteUsos: number;
  usosActuales: number;
  estado: string;
  createdAt: string;
}

// ============ COMPONENT PRINCIPAL ============

const AdminFinanzasPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('resumen');

  const tabs: { key: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { key: 'resumen', label: 'Dashboard Financiero', shortLabel: 'Resumen', icon: <Wallet className="w-4 h-4" /> },
    { key: 'torneos', label: 'Ingresos por Torneo', shortLabel: 'Torneos', icon: <Trophy className="w-4 h-4" /> },
    { key: 'comision', label: 'Comisión', shortLabel: 'Comisión', icon: <Settings className="w-4 h-4" /> },
    { key: 'suscripciones', label: 'Suscripciones', shortLabel: 'Suscr.', icon: <Crown className="w-4 h-4" /> },
    { key: 'cupones', label: 'Cupones', shortLabel: 'Cupones', icon: <Ticket className="w-4 h-4" /> },
    { key: 'actividad', label: 'Actividad Reciente', shortLabel: 'Actividad', icon: <Activity className="w-4 h-4" /> },
    { key: 'sms', label: 'SMS Tigo', shortLabel: 'SMS', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Finanzas</h1>
            <p className="text-sm text-light-secondary">Control de ingresos, comisiones y suscripciones de la plataforma</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-dark-card text-light-secondary hover:bg-dark-hover border border-dark-border'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {activeTab === 'resumen' && <ResumenFinanzasTab />}
      {activeTab === 'torneos' && <TorneosFinanzasTab />}
      {activeTab === 'comision' && <ComisionTab />}
      {activeTab === 'suscripciones' && <SuscripcionesConsolidadaTab />}
      {activeTab === 'cupones' && <CuponesTab />}
      {activeTab === 'actividad' && <ActividadTab />}
      {activeTab === 'sms' && <SmsTab />}
    </div>
  );
};

// ============ TAB: RESUMEN FINANZAS ============

function ResumenFinanzasTab() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [premiumMetrics, setPremiumMetrics] = useState<MetricasPremium | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([
        adminService.getFinanzasDashboard(),
        adminService.getMetricasPremium(),
      ]);
      setDashboard(d);
      setPremiumMetrics(p);
    } catch (error) {
      console.error('Error cargando finanzas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loading size="lg" text="Cargando finanzas..." /></div>;
  if (!dashboard) return null;

  const formatGs = (n: number) => `Gs. ${new Intl.NumberFormat('es-PY').format(Math.round(n))}`;

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Ingresos Totales"
          value={formatGs(dashboard.totalIngresos)}
          subtitle="Comisiones + Suscripciones"
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
          color="green"
        />
        <KPICard
          title="Comisiones"
          value={formatGs(dashboard.totalIngresosComisiones)}
          subtitle={`${dashboard.totalJugadoresInscriptos} jugadores`}
          icon={<Trophy className="w-5 h-5 text-amber-400" />}
          color="yellow"
        />
        <KPICard
          title="Suscripciones"
          value={formatGs(dashboard.mrrSuscripciones)}
          subtitle={`${dashboard.suscripcionesActivas} activas (MRR)`}
          icon={<Crown className="w-5 h-5 text-purple-400" />}
          color="purple"
        />
        <KPICard
          title="Ingresos del Mes"
          value={formatGs(dashboard.ingresosMes)}
          subtitle="Mes actual"
          icon={<Calendar className="w-5 h-5 text-blue-400" />}
          color="blue"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniKPI icon={<Settings className="w-4 h-4 text-green-400" />} label="Comisión actual/jugador" value={dashboard.comisionFijaPorJugador} />
        <MiniKPI icon={<Trophy className="w-4 h-4 text-amber-400" />} label="Torneos con ingresos" value={dashboard.totalTorneosConIngresos} />
        <MiniKPI icon={<Users className="w-4 h-4 text-blue-400" />} label="Jugadores inscritos" value={dashboard.totalJugadoresInscriptos} />
        <MiniKPI icon={<Crown className="w-4 h-4 text-yellow-400" />} label="Usuarios Premium" value={premiumMetrics?.totalPremium || 0} />
      </div>

      {/* Premium metrics (condensed) */}
      {premiumMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Métricas Premium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-light-secondary uppercase tracking-wide">Tasa Conversión</p>
                <p className="text-lg font-bold text-light-text">{premiumMetrics.tasaConversion}%</p>
              </div>
              <div>
                <p className="text-[10px] text-light-secondary uppercase tracking-wide">Churn Rate</p>
                <p className={`text-lg font-bold ${premiumMetrics.churnRate > 10 ? 'text-red-400' : premiumMetrics.churnRate > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {premiumMetrics.churnRate}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-light-secondary uppercase tracking-wide">Nuevos (30d)</p>
                <p className="text-lg font-bold text-green-400">{premiumMetrics.nuevosPremium30d}</p>
              </div>
              <div>
                <p className="text-[10px] text-light-secondary uppercase tracking-wide">Cancelaciones (30d)</p>
                <p className="text-lg font-bold text-red-400">{premiumMetrics.cancelaciones30d}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============ TAB: TORNEOS FINANZAS ============

interface TorneoFinanzas {
  id: string;
  nombre: string;
  flyerUrl: string | null;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  costoInscripcion: number;
  inscripcionesTotal: number;
  inscripcionesConfirmadas: number;
  jugadoresInscriptos: number;
  comisionesGeneradas: number;
}

function TorneosFinanzasTab() {
  const [torneos, setTorneos] = useState<TorneoFinanzas[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    loadTorneos();
  }, [filtroEstado]);

  const loadTorneos = async () => {
    setLoading(true);
    try {
      const data = await adminService.getFinanzasTorneos(filtroEstado || undefined);
      setTorneos(data);
    } catch (error) {
      console.error('Error cargando torneos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatGs = (n: number) => `Gs. ${new Intl.NumberFormat('es-PY').format(Math.round(n))}`;

  const filtered = busqueda
    ? torneos.filter((t) => t.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : torneos;

  const totalComisiones = filtered.reduce((sum, t) => sum + t.comisionesGeneradas, 0);
  const totalJugadores = filtered.reduce((sum, t) => sum + t.jugadoresInscriptos, 0);

  if (loading) return <div className="flex justify-center py-16"><Loading size="lg" text="Cargando torneos..." /></div>;

  return (
    <div className="space-y-4">
      {/* Totales */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{formatGs(totalComisiones)}</p>
          <p className="text-xs text-light-secondary">Comisiones totales</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-light-text">{filtered.length}</p>
          <p className="text-xs text-light-secondary">Torneos</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{totalJugadores}</p>
          <p className="text-xs text-light-secondary">Jugadores inscritos</p>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-secondary" />
          <input
            type="text"
            placeholder="Buscar torneo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm focus:outline-none focus:border-primary-500"
        >
          <option value="">Todos los estados</option>
          <option value="EN_CURSO">En curso</option>
          <option value="FINALIZADO">Finalizados</option>
          <option value="PUBLICADO">Publicados</option>
        </select>
      </div>

      {/* Lista de torneos */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="w-12 h-12 text-light-secondary mx-auto mb-3" />
            <p className="text-light-secondary">No hay torneos con ingresos registrados</p>
          </Card>
        ) : (
          filtered.map((torneo) => (
            <Card key={torneo.id} className="p-4 hover:border-green-500/30 transition-colors">
              <div className="flex items-center gap-4">
                {/* Flyer miniatura */}
                <div className="w-12 h-12 rounded-lg bg-dark-surface flex-shrink-0 overflow-hidden">
                  {torneo.flyerUrl ? (
                    <img src={torneo.flyerUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-light-secondary/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-light-text truncate">{torneo.nombre}</h4>
                    {estadoBadge(torneo.estado)}
                  </div>
                  <p className="text-xs text-light-secondary mt-0.5">
                    {new Date(torneo.fechaInicio).toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })}
                    {' - '}
                    {new Date(torneo.fechaFin).toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {torneo.costoInscripcion > 0 && (
                      <span className="ml-2 text-light-muted">· Inscripción: {formatGs(torneo.costoInscripcion)}</span>
                    )}
                  </p>
                </div>

                {/* Métricas */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold text-light-text">{torneo.inscripcionesConfirmadas}</p>
                    <p className="text-[10px] text-light-secondary">Parejas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-blue-400">{torneo.jugadoresInscriptos}</p>
                    <p className="text-[10px] text-light-secondary">Jugadores</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <p className="text-sm font-bold text-green-400">{formatGs(torneo.comisionesGeneradas)}</p>
                    <p className="text-[10px] text-light-secondary">Comisión</p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ============ TAB: COMISION ============

function ComisionTab() {
  const [montoFijo, setMontoFijo] = useState<number>(5000);
  const [montoOriginal, setMontoOriginal] = useState<number>(5000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadComision();
  }, []);

  const loadComision = async () => {
    setLoading(true);
    try {
      const data = await adminService.getFinanzasDashboard();
      setMontoFijo(data.comisionFijaPorJugador);
      setMontoOriginal(data.comisionFijaPorJugador);
    } catch (error) {
      console.error('Error cargando comisión:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await adminService.setComisionFija(montoFijo);
      toast.success(result.message);
      setMontoOriginal(montoFijo);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al actualizar comisión');
    } finally {
      setSaving(false);
    }
  };

  const formatGs = (n: number) => `Gs. ${new Intl.NumberFormat('es-PY').format(Math.round(n))}`;
  const hasChanges = montoFijo !== montoOriginal;

  if (loading) return <div className="flex justify-center py-16"><Loading size="lg" text="Cargando comisión..." /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Comisión por Jugador Inscrito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-light-secondary mb-6">
            Monto fijo en Guaraníes que la plataforma cobra por cada jugador individual que se inscriba a un torneo.
            Cada pareja son 2 jugadores.
          </p>

          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-light-text mb-2">Monto por jugador (Gs.)</label>
              <input
                type="number"
                value={montoFijo}
                onChange={(e) => setMontoFijo(Math.max(0, Number(e.target.value)))}
                className="w-full px-4 py-3 rounded-lg bg-dark-bg border border-dark-border text-2xl font-bold text-light-text text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                min={0}
                step={1000}
              />
            </div>
            {hasChanges && (
              <Button variant="success" onClick={handleSave} loading={saving}>
                <Save className="w-4 h-4 mr-2" /> Guardar
              </Button>
            )}
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400 font-medium mb-2">Vista previa:</p>
            <div className="space-y-1 text-sm text-light-secondary">
              <p>Por cada jugador inscrito la plataforma cobra: <strong className="text-green-400">{formatGs(montoFijo)}</strong></p>
              <p>Por cada pareja inscrita (2 jugadores): <strong className="text-green-400">{formatGs(montoFijo * 2)}</strong></p>
              <p className="text-xs text-light-muted mt-2">
                Ejemplo: Un torneo con 50 parejas inscriptas (100 jugadores) genera {formatGs(montoFijo * 100)} en comisiones.
              </p>
            </div>
          </div>

          {montoOriginal !== montoFijo && (
            <p className="text-xs text-amber-400 mt-3">
              Valor actual: {formatGs(montoOriginal)} → Nuevo: {formatGs(montoFijo)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="p-4 bg-blue-900/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-light-secondary">
            <p className="font-medium text-blue-400 mb-1">Nota importante</p>
            <p>El cambio de comisión solo afecta a <strong>nuevas inscripciones</strong>. Las inscripciones ya realizadas mantienen la comisión con la que fueron creadas.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============ TAB: SUSCRIPCIONES CONSOLIDADA ============

function SuscripcionesConsolidadaTab() {
  const [subTab, setSubTab] = useState<'usuarios' | 'listado'>('usuarios');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab('usuarios')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            subTab === 'usuarios'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
              : 'bg-dark-card text-light-secondary hover:bg-dark-hover border border-dark-border'
          }`}
        >
          <Users className="w-3.5 h-3.5 inline mr-1.5" />
          Usuarios Premium
        </button>
        <button
          onClick={() => setSubTab('listado')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            subTab === 'listado'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
              : 'bg-dark-card text-light-secondary hover:bg-dark-hover border border-dark-border'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 inline mr-1.5" />
          Suscripciones
        </button>
      </div>

      {subTab === 'usuarios' && <UsuariosPremiumTab />}
      {subTab === 'listado' && <SuscripcionesTab />}
    </div>
  );
}

// ============ TAB: USUARIOS PREMIUM ============

function UsuariosPremiumTab() {
  const [usuarios, setUsuarios] = useState<UsuarioPremium[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showOtorgar, setShowOtorgar] = useState(false);

  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsuariosPremium(search || undefined);
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios premium:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleRevocar = async (userId: string, nombre: string) => {
    if (!confirm(`¿Revocar premium a ${nombre}? Esto cancela su suscripción activa.`)) return;
    setActionLoading(userId);
    try {
      await adminService.revocarPremium(userId);
      toast.success(`Premium revocado a ${nombre}`);
      loadUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al revocar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtender = async (subId: string) => {
    const diasStr = prompt('¿Cuántos días desea extender la suscripción?');
    if (!diasStr) return;
    const dias = parseInt(diasStr, 10);
    if (isNaN(dias) || dias <= 0) return;
    setActionLoading(subId);
    try {
      await adminService.extenderSuscripcion(subId, dias);
      toast.success(`Suscripción extendida ${dias} días`);
      loadUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al extender');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-secondary" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, email o documento..."
              className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            <Search className="w-4 h-4" />
          </Button>
        </form>
        <Button variant="primary" size="sm" onClick={() => setShowOtorgar(!showOtorgar)}>
          {showOtorgar ? <X className="w-4 h-4 mr-1" /> : <Gift className="w-4 h-4 mr-1" />}
          {showOtorgar ? 'Cancelar' : 'Otorgar Premium'}
        </Button>
      </div>

      {/* Otorgar Premium Form */}
      {showOtorgar && (
        <OtorgarPremiumForm
          onSuccess={() => {
            setShowOtorgar(false);
            loadUsuarios();
          }}
          onCancel={() => setShowOtorgar(false)}
        />
      )}

      {/* Users list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            Usuarios Premium
            {usuarios.length > 0 && <Badge variant="premium">{usuarios.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading size="md" text="Cargando usuarios..." />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-8 text-light-secondary">
              <Crown className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No se encontraron usuarios premium</p>
            </div>
          ) : (
            <div className="space-y-3">
              {usuarios.map((u) => {
                const sub = u.suscripciones[0];
                const diasRestantes = sub
                  ? Math.ceil((new Date(sub.fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : 0;
                const esCortesia = sub?.cuponAplicado?.startsWith('CORTESIA_ADMIN');

                return (
                  <div key={u.id} className="p-3 sm:p-4 bg-dark-surface rounded-lg border border-dark-border hover:border-yellow-500/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* User info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {u.fotoUrl ? (
                            <img src={u.fotoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Crown className="w-5 h-5 text-yellow-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-light-text">{u.nombre} {u.apellido}</p>
                            {esCortesia && <Badge variant="info" className="text-[10px]">Cortesía</Badge>}
                          </div>
                          <p className="text-xs text-light-secondary truncate">{u.email}</p>
                          <p className="text-xs text-light-muted">Doc: {u.documento} {u.ciudad ? `· ${u.ciudad}` : ''}</p>
                        </div>
                      </div>

                      {/* Sub info */}
                      <div className="flex flex-col sm:items-end gap-1">
                        {sub ? (
                          <>
                            <div className="flex items-center gap-2">
                              {estadoBadge(sub.estado)}
                              <span className="text-xs text-light-secondary">
                                ${Number(sub.precio).toFixed(2)}/mes
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-light-muted">
                              <span className="flex items-center gap-1">
                                <CalendarClock className="w-3 h-3" />
                                {diasRestantes > 0 ? `${diasRestantes}d restantes` : 'Vencida'}
                              </span>
                              {sub.autoRenovar && (
                                <span className="flex items-center gap-1 text-blue-400">
                                  <RefreshCw className="w-3 h-3" />
                                  Auto
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-light-muted">
                              {new Date(sub.fechaInicio).toLocaleDateString()} → {new Date(sub.fechaFin).toLocaleDateString()}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-light-secondary">Sin suscripción activa</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 sm:flex-col">
                        {sub && sub.estado === 'ACTIVA' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExtender(sub.id)}
                            loading={actionLoading === sub.id}
                            disabled={actionLoading !== null}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            Extender
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRevocar(u.id, `${u.nombre} ${u.apellido}`)}
                          loading={actionLoading === u.id}
                          disabled={actionLoading !== null}
                        >
                          <UserX className="w-3 h-3 mr-1" />
                          Revocar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ OTORGAR PREMIUM FORM ============

function OtorgarPremiumForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [searchUser, setSearchUser] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dias, setDias] = useState('30');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const buscarUsuario = async () => {
    if (!searchUser.trim()) return;
    setSearching(true);
    try {
      const data = await adminService.getUsuarios(searchUser);
      setResultados(data.filter((u: any) => !u.esPremium));
    } catch (error) {
      console.error('Error buscando:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !dias || !motivo) {
      toast.error('Completa todos los campos');
      return;
    }
    setSaving(true);
    try {
      await adminService.otorgarPremium(selectedUser.id, parseInt(dias), motivo);
      toast.success(`Premium otorgado a ${selectedUser.nombre} ${selectedUser.apellido}`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al otorgar premium');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-light-text mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-yellow-400" />
          Otorgar Premium (cortesía)
        </h3>

        {/* User search */}
        {!selectedUser ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarUsuario()}
                placeholder="Buscar usuario por nombre, email o documento..."
                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-yellow-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={buscarUsuario} loading={searching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {resultados.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {resultados.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-dark-bg hover:bg-dark-hover transition-colors text-left"
                  >
                    <UserCheck className="w-4 h-4 text-light-secondary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-light-text">{u.nombre} {u.apellido}</p>
                      <p className="text-xs text-light-secondary truncate">{u.email} · {u.documento}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {resultados.length === 0 && searchUser && !searching && (
              <p className="text-xs text-light-secondary text-center py-2">
                No se encontraron usuarios no-premium con esa búsqueda
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-dark-bg rounded-lg">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-400" />
                <span className="text-sm text-light-text">{selectedUser.nombre} {selectedUser.apellido}</span>
                <span className="text-xs text-light-secondary">({selectedUser.email})</span>
              </div>
              <button type="button" onClick={() => setSelectedUser(null)} className="text-light-secondary hover:text-light-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-light-secondary mb-1">Días de premium</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={dias}
                  onChange={(e) => setDias(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs text-light-secondary mb-1">Motivo</label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Promoción lanzamiento, premio torneo..."
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                <Gift className="w-4 h-4 mr-1" />
                Otorgar Premium
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ============ TAB: SUSCRIPCIONES ============

function SuscripcionesTab() {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSuscripciones();
  }, [filterEstado]);

  const loadSuscripciones = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSuscripciones(filterEstado || undefined);
      setSuscripciones(data);
    } catch (error) {
      console.error('Error cargando suscripciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtender = async (id: string) => {
    const diasStr = prompt('¿Cuántos días desea extender?');
    if (!diasStr) return;
    const dias = parseInt(diasStr, 10);
    if (isNaN(dias) || dias <= 0) return;
    setActionLoading(id);
    try {
      await adminService.extenderSuscripcion(id, dias);
      toast.success(`Suscripción extendida ${dias} días`);
      loadSuscripciones();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const filtros = [
    { value: '', label: 'Todas' },
    { value: 'ACTIVA', label: 'Activas' },
    { value: 'VENCIDA', label: 'Vencidas' },
    { value: 'CANCELADA', label: 'Canceladas' },
    { value: 'PENDIENTE_PAGO', label: 'Pendiente' },
  ];

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterEstado(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterEstado === f.value
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                : 'bg-dark-card text-light-secondary hover:bg-dark-hover border border-dark-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Suscripciones
            {suscripciones.length > 0 && <Badge variant="info">{suscripciones.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading size="md" text="Cargando..." />
            </div>
          ) : suscripciones.length === 0 ? (
            <div className="text-center py-8 text-light-secondary">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay suscripciones{filterEstado ? ` con estado ${filterEstado.toLowerCase()}` : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-light-secondary text-xs">
                    <th className="text-left py-3 px-2">Usuario</th>
                    <th className="text-left py-3 px-2">Plan</th>
                    <th className="text-left py-3 px-2">Precio</th>
                    <th className="text-left py-3 px-2">Estado</th>
                    <th className="text-left py-3 px-2">Período</th>
                    <th className="text-left py-3 px-2">Auto</th>
                    <th className="text-left py-3 px-2">Cupón</th>
                    <th className="text-left py-3 px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {suscripciones.map((sub) => (
                    <tr key={sub.id} className="border-b border-dark-border/50 hover:bg-dark-hover">
                      <td className="py-3 px-2">
                        <p className="font-medium text-xs">{sub.user.nombre} {sub.user.apellido}</p>
                        <p className="text-[10px] text-light-secondary">{sub.user.email}</p>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="premium" className="text-[10px]">{sub.plan.nombre}</Badge>
                      </td>
                      <td className="py-3 px-2 text-xs">${Number(sub.precio).toFixed(2)}</td>
                      <td className="py-3 px-2">{estadoBadge(sub.estado)}</td>
                      <td className="py-3 px-2 text-[10px] text-light-secondary">
                        {new Date(sub.fechaInicio).toLocaleDateString()} →
                        <br />{new Date(sub.fechaFin).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        {sub.autoRenovar ? (
                          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-light-muted" />
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {sub.cuponAplicado ? (
                          <code className="text-[10px] text-purple-400 bg-purple-500/10 px-1 rounded">
                            {sub.cuponAplicado.length > 15 ? sub.cuponAplicado.slice(0, 15) + '...' : sub.cuponAplicado}
                          </code>
                        ) : (
                          <span className="text-[10px] text-light-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExtender(sub.id)}
                          loading={actionLoading === sub.id}
                          disabled={actionLoading !== null}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Extender
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ TAB: CUPONES ============

function CuponesTab() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCrear, setShowCrear] = useState(false);

  useEffect(() => {
    loadCupones();
  }, []);

  const loadCupones = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCupones();
      setCupones(data);
    } catch (error) {
      console.error('Error cargando cupones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (id: string) => {
    if (!confirm('¿Desactivar este cupón?')) return;
    setActionLoading(id);
    try {
      await adminService.desactivarCupon(id);
      toast.success('Cupón desactivado');
      setCupones((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'INACTIVO' } : c)));
    } catch (error: any) {
      toast.error('Error al desactivar cupón');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Cupones de Descuento
              {cupones.length > 0 && <Badge variant="info">{cupones.length}</Badge>}
            </CardTitle>
            <Button variant="primary" size="sm" onClick={() => setShowCrear(!showCrear)}>
              {showCrear ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {showCrear ? 'Cancelar' : 'Nuevo Cupón'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCrear && (
            <CrearCuponForm
              onCreated={() => {
                setShowCrear(false);
                loadCupones();
              }}
              onCancel={() => setShowCrear(false)}
            />
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loading size="md" text="Cargando cupones..." />
            </div>
          ) : cupones.length === 0 ? (
            <div className="text-center py-8 text-light-secondary">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay cupones creados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-light-secondary text-xs">
                    <th className="text-left py-3 px-2">Código</th>
                    <th className="text-left py-3 px-2">Tipo</th>
                    <th className="text-left py-3 px-2">Valor</th>
                    <th className="text-left py-3 px-2">Usos</th>
                    <th className="text-left py-3 px-2">Vigencia</th>
                    <th className="text-left py-3 px-2">Estado</th>
                    <th className="text-left py-3 px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cupones.map((cupon) => {
                    const ahora = new Date();
                    const expira = new Date(cupon.fechaExpiracion);
                    const expirado = expira < ahora;

                    return (
                      <tr key={cupon.id} className="border-b border-dark-border/50 hover:bg-dark-hover">
                        <td className="py-3 px-2">
                          <code className="bg-dark-bg px-2 py-0.5 rounded text-primary-400 font-mono text-xs">
                            {cupon.codigo}
                          </code>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="info" className="text-[10px]">{cupon.tipo}</Badge>
                        </td>
                        <td className="py-3 px-2 text-xs">
                          {cupon.tipo === 'PORCENTAJE' ? `${Number(cupon.valor)}%` : `$${Number(cupon.valor).toFixed(2)}`}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{cupon.usosActuales}/{cupon.limiteUsos}</span>
                            <div className="w-12 h-1.5 bg-dark-border rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-400 rounded-full"
                                style={{ width: `${Math.min((cupon.usosActuales / cupon.limiteUsos) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-[10px] text-light-secondary">
                          {new Date(cupon.fechaInicio).toLocaleDateString()} - {expira.toLocaleDateString()}
                          {expirado && <span className="text-red-400 ml-1">(expirado)</span>}
                        </td>
                        <td className="py-3 px-2">{estadoBadge(cupon.estado)}</td>
                        <td className="py-3 px-2">
                          {cupon.estado === 'ACTIVO' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDesactivar(cupon.id)}
                              loading={actionLoading === cupon.id}
                              disabled={actionLoading !== null}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Desactivar
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ CREAR CUPON FORM ============

function CrearCuponForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'PORCENTAJE',
    valor: '',
    fechaInicio: '',
    fechaExpiracion: '',
    limiteUsos: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.codigo || !formData.valor || !formData.fechaInicio || !formData.fechaExpiracion || !formData.limiteUsos) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setSaving(true);
    try {
      await adminService.crearCupon({
        codigo: formData.codigo.toUpperCase(),
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        fechaInicio: formData.fechaInicio,
        fechaExpiracion: formData.fechaExpiracion,
        limiteUsos: parseInt(formData.limiteUsos, 10),
      });
      toast.success('Cupón creado');
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al crear cupón');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
      <h3 className="text-sm font-semibold mb-4 text-light-text">Nuevo Cupón</h3>
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-light-secondary mb-1">Código</label>
          <input
            type="text"
            value={formData.codigo}
            onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value }))}
            placeholder="DESCUENTO20"
            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-light-secondary mb-1">Tipo</label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
          >
            <option value="PORCENTAJE">Porcentaje (%)</option>
            <option value="MONTO_FIJO">Monto fijo ($)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-light-secondary mb-1">
            Valor {formData.tipo === 'PORCENTAJE' ? '(%)' : '($)'}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.valor}
            onChange={(e) => setFormData((prev) => ({ ...prev, valor: e.target.value }))}
            placeholder="20"
            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-light-secondary mb-1">Fecha inicio</label>
          <input
            type="date"
            value={formData.fechaInicio}
            onChange={(e) => setFormData((prev) => ({ ...prev, fechaInicio: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-light-secondary mb-1">Fecha expiración</label>
          <input
            type="date"
            value={formData.fechaExpiracion}
            onChange={(e) => setFormData((prev) => ({ ...prev, fechaExpiracion: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-light-secondary mb-1">Límite de usos</label>
          <input
            type="number"
            min="1"
            value={formData.limiteUsos}
            onChange={(e) => setFormData((prev) => ({ ...prev, limiteUsos: e.target.value }))}
            placeholder="100"
            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button type="submit" variant="primary" size="sm" loading={saving}>
          <Plus className="h-4 w-4 mr-1" />
          Crear Cupón
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// ============ TAB: ACTIVIDAD RECIENTE ============

function ActividadTab() {
  const [actividad, setActividad] = useState<ActividadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActividad();
  }, []);

  const loadActividad = async () => {
    setLoading(true);
    try {
      const data = await adminService.getActividadPremium();
      setActividad(data);
    } catch (error) {
      console.error('Error cargando actividad:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccionTexto = (item: ActividadItem) => {
    const diff = new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime();
    const esReciente = diff < 60000; // less than 1 minute between create and update

    switch (item.estado) {
      case 'ACTIVA':
        return esReciente ? 'se suscribió a' : 'renovó';
      case 'CANCELADA':
        return 'canceló';
      case 'VENCIDA':
        return 'venció su suscripción';
      case 'PENDIENTE_PAGO':
        return 'inició pago de';
      default:
        return item.estado;
    }
  };

  const getAccionColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVA': return 'text-green-400';
      case 'CANCELADA': return 'text-red-400';
      case 'VENCIDA': return 'text-orange-400';
      case 'PENDIENTE_PAGO': return 'text-yellow-400';
      default: return 'text-light-secondary';
    }
  };

  const getAccionIcon = (estado: string) => {
    switch (estado) {
      case 'ACTIVA': return <ArrowUpRight className="w-4 h-4 text-green-400" />;
      case 'CANCELADA': return <ArrowDownRight className="w-4 h-4 text-red-400" />;
      case 'VENCIDA': return <Clock className="w-4 h-4 text-orange-400" />;
      case 'PENDIENTE_PAGO': return <CreditCard className="w-4 h-4 text-yellow-400" />;
      default: return <Activity className="w-4 h-4 text-light-secondary" />;
    }
  };

  const tiempoRelativo = (fecha: string) => {
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days}d`;
    return new Date(fecha).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-400" />
            Actividad Reciente
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadActividad}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loading size="md" text="Cargando actividad..." />
          </div>
        ) : actividad.length === 0 ? (
          <div className="text-center py-8 text-light-secondary">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-1">
            {actividad.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-hover transition-colors">
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dark-surface flex items-center justify-center">
                  {getAccionIcon(item.estado)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-light-text">
                    <span className="font-medium">{item.usuario.nombre} {item.usuario.apellido}</span>
                    {' '}
                    <span className={getAccionColor(item.estado)}>{getAccionTexto(item)}</span>
                    {' '}
                    {item.plan && <span className="text-yellow-400">Premium</span>}
                    {item.precio > 0 && (
                      <span className="text-light-secondary"> · ${item.precio.toFixed(2)}</span>
                    )}
                    {item.cuponAplicado && !item.cuponAplicado.startsWith('CORTESIA') && (
                      <span className="text-purple-400 text-xs ml-1">🏷️ {item.cuponAplicado}</span>
                    )}
                    {item.cuponAplicado?.startsWith('CORTESIA') && (
                      <span className="text-blue-400 text-xs ml-1">🎁 Cortesía</span>
                    )}
                  </p>
                  <p className="text-xs text-light-muted">
                    {item.usuario.email}
                  </p>
                </div>

                {/* Time */}
                <div className="flex-shrink-0 text-xs text-light-muted">
                  {tiempoRelativo(item.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ COMPONENTES COMPARTIDOS ============

// ============ TAB: SMS TIGO ============

function SmsTab() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const tiposNotificacion = ['SISTEMA', 'TORNEO', 'INSCRIPCION', 'PARTIDO', 'RANKING', 'SOCIAL', 'PAGO', 'MENSAJE'];

  const loadDashboard = useCallback(async () => {
    try {
      const data = await adminService.getSmsDashboard();
      setDashboard(data);
    } catch {
      toast.error('Error cargando dashboard SMS');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await adminService.getSmsLogs({
        page,
        limit: 15,
        tipo: filtroTipo || undefined,
        exitoso: filtroEstado || undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
      });
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotalLogs(data.total);
    } catch {
      toast.error('Error cargando logs SMS');
    } finally {
      setLogsLoading(false);
    }
  }, [page, filtroTipo, filtroEstado, fechaDesde, fechaHasta]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { loadLogs(); }, [loadLogs]);

  const formatGs = (n: number) => `Gs. ${new Intl.NumberFormat('es-PY').format(Math.round(n))}`;
  const formatMes = (mes: string) => {
    const [y, m] = mes.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(m) - 1]} ${y}`;
  };
  const maskPhone = (tel: string) => tel ? `***${tel.slice(-4)}` : '—';

  if (loading) return <Loading text="Cargando dashboard SMS..." />;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="SMS este mes"
          value={dashboard?.totalMes || 0}
          subtitle="Total enviados"
          icon={<MessageSquare className="w-5 h-5 text-blue-400" />}
          color="blue"
        />
        <KPICard
          title="Costo estimado"
          value={formatGs(dashboard?.costoEstimadoMes || 0)}
          subtitle="Mes actual"
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
          color="green"
        />
        <KPICard
          title="Exitosos"
          value={dashboard?.exitososMes || 0}
          subtitle="Entregados correctamente"
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          color="green"
        />
        <KPICard
          title="Fallidos"
          value={dashboard?.fallidosMes || 0}
          subtitle="Error de envio"
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          color="red"
        />
      </div>

      {/* Resumen Mensual + Desglose por Tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen Mensual */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Resumen Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-light-secondary">
                    <th className="text-left py-2 px-3">Mes</th>
                    <th className="text-right py-2 px-3">Total</th>
                    <th className="text-right py-2 px-3">Exitosos</th>
                    <th className="text-right py-2 px-3">Fallidos</th>
                    <th className="text-right py-2 px-3">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard?.resumenMensual?.map((m: any) => (
                    <tr key={m.mes} className="border-b border-dark-border/50 hover:bg-dark-hover">
                      <td className="py-2 px-3 text-light-text font-medium">{formatMes(m.mes)}</td>
                      <td className="py-2 px-3 text-right text-light-text">{m.total}</td>
                      <td className="py-2 px-3 text-right text-green-400">{m.exitosos}</td>
                      <td className="py-2 px-3 text-right text-red-400">{m.fallidos}</td>
                      <td className="py-2 px-3 text-right text-light-secondary">{formatGs(m.costo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Desglose por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Por Tipo (este mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard?.porTipo?.length > 0 ? (
                dashboard.porTipo.map((item: any) => (
                  <div key={item.tipo || 'null'} className="flex items-center justify-between p-2 bg-dark-hover rounded-lg">
                    <Badge variant={item.tipo === 'PARTIDO' ? 'info' : item.tipo === 'SOCIAL' ? 'success' : 'default'}>
                      {item.tipo || 'SIN TIPO'}
                    </Badge>
                    <span className="text-light-text font-semibold">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-light-secondary text-sm text-center py-4">Sin datos este mes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-yellow-400" />
            Historial de SMS
            <span className="text-sm font-normal text-light-secondary ml-2">({totalLogs} registros)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <select
              value={filtroTipo}
              onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text"
            >
              <option value="">Todos los tipos</option>
              {tiposNotificacion.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text"
            >
              <option value="">Todos</option>
              <option value="true">Exitosos</option>
              <option value="false">Fallidos</option>
            </select>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text"
              placeholder="Desde"
            />
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-light-text"
              placeholder="Hasta"
            />
          </div>

          {/* Tabla de logs */}
          {logsLoading ? (
            <div className="py-8 text-center text-light-secondary">Cargando...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-light-secondary">No hay registros SMS</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-light-secondary">
                    <th className="text-left py-2 px-2">Fecha</th>
                    <th className="text-left py-2 px-2">Usuario</th>
                    <th className="text-left py-2 px-2">Teléfono</th>
                    <th className="text-left py-2 px-2">Tipo</th>
                    <th className="text-center py-2 px-2">Estado</th>
                    <th className="text-right py-2 px-2">Costo</th>
                    <th className="text-left py-2 px-2">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-dark-border/50 hover:bg-dark-hover">
                      <td className="py-2 px-2 text-light-secondary whitespace-nowrap text-xs">
                        {new Date(log.createdAt).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: '2-digit' })}{' '}
                        {new Date(log.createdAt).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 px-2 text-light-text text-xs">
                        {log.user ? `${log.user.nombre} ${log.user.apellido}` : '—'}
                      </td>
                      <td className="py-2 px-2 text-light-secondary font-mono text-xs">{maskPhone(log.telefono)}</td>
                      <td className="py-2 px-2">
                        {log.tipo ? (
                          <Badge variant={log.tipo === 'PARTIDO' ? 'info' : log.tipo === 'SOCIAL' ? 'success' : 'default'} className="text-[10px]">
                            {log.tipo}
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {log.exitoso ? (
                          <Badge variant="success" className="text-[10px]">Enviado</Badge>
                        ) : (
                          <Badge variant="danger" className="text-[10px]">Fallido</Badge>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right text-light-secondary text-xs">{formatGs(log.costoEstimado)}</td>
                      <td className="py-2 px-2 text-light-secondary text-xs max-w-[200px] truncate" title={log.mensaje}>
                        {log.mensaje.length > 50 ? log.mensaje.substring(0, 50) + '...' : log.mensaje}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginacion */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <span className="text-sm text-light-secondary">
                Pagina {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ HELPERS COMPARTIDOS ============

function KPICard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down';
}) {
  const colorMap: Record<string, string> = {
    yellow: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20',
    green: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
    blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    red: 'from-red-500/10 to-rose-500/10 border-red-500/20',
    orange: 'from-orange-500/10 to-amber-500/10 border-orange-500/20',
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.yellow} border`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-green-400" />}
        {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-400" />}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-light-text">{value}</p>
      <p className="text-xs text-light-secondary mt-1 leading-tight">{title}</p>
      <p className="text-[10px] text-light-muted mt-0.5">{subtitle}</p>
    </div>
  );
}

function MiniKPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-light-text">{value}</p>
        <p className="text-[10px] text-light-secondary">{label}</p>
      </div>
    </div>
  );
}

function estadoBadge(estado: string) {
  switch (estado) {
    case 'ACTIVA': return <Badge variant="success">Activa</Badge>;
    case 'VENCIDA': return <Badge variant="danger">Vencida</Badge>;
    case 'CANCELADA': return <Badge variant="danger">Cancelada</Badge>;
    case 'PENDIENTE_PAGO': return <Badge variant="warning">Pendiente</Badge>;
    case 'ACTIVO': return <Badge variant="success">Activo</Badge>;
    case 'INACTIVO': return <Badge variant="danger">Inactivo</Badge>;
    default: return <Badge>{estado}</Badge>;
  }
}

export default AdminFinanzasPage;
