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
  TrendingUp,
  TrendingDown,
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
  BarChart3,
  CalendarClock,
} from 'lucide-react';

type Tab = 'dashboard' | 'usuarios' | 'suscripciones' | 'cupones' | 'actividad';

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

interface Tendencia {
  mes: string;
  nuevas: number;
  canceladas: number;
  ingresos: number;
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

interface EstadisticasCupones {
  totalCupones: number;
  cuponesActivos: number;
  totalUsos: number;
  descuentoTotal: number;
  topCupones: { codigo: string; tipo: string; valor: number; usos: number; limite: number; estado: string }[];
}

// ============ COMPONENT PRINCIPAL ============

const AdminSuscripcionesPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs: { key: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard Premium', shortLabel: 'Dashboard', icon: <Crown className="w-4 h-4" /> },
    { key: 'usuarios', label: 'Usuarios Premium', shortLabel: 'Usuarios', icon: <Users className="w-4 h-4" /> },
    { key: 'suscripciones', label: 'Suscripciones', shortLabel: 'Suscr.', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'cupones', label: 'Cupones', shortLabel: 'Cupones', icon: <Ticket className="w-4 h-4" /> },
    { key: 'actividad', label: 'Actividad Reciente', shortLabel: 'Actividad', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Crown className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Gestión Premium</h1>
            <p className="text-sm text-light-secondary">Dashboard completo de suscripciones, usuarios premium y métricas</p>
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
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                : 'bg-dark-card text-light-secondary hover:bg-dark-hover border border-dark-border'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'usuarios' && <UsuariosPremiumTab />}
      {activeTab === 'suscripciones' && <SuscripcionesTab />}
      {activeTab === 'cupones' && <CuponesTab />}
      {activeTab === 'actividad' && <ActividadTab />}
    </div>
  );
};

// ============ TAB: DASHBOARD ============

function DashboardTab() {
  const [metricas, setMetricas] = useState<MetricasPremium | null>(null);
  const [tendencias, setTendencias] = useState<Tendencia[]>([]);
  const [cuponStats, setCuponStats] = useState<EstadisticasCupones | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [m, t, c] = await Promise.all([
        adminService.getMetricasPremium(),
        adminService.getTendenciasSuscripciones(),
        adminService.getEstadisticasCupones(),
      ]);
      setMetricas(m);
      setTendencias(t);
      setCuponStats(c);
    } catch (error) {
      console.error('Error cargando dashboard premium:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loading size="lg" text="Cargando dashboard premium..." />
      </div>
    );
  }

  if (!metricas) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Usuarios Premium"
          value={metricas.totalPremium}
          subtitle={`${metricas.tasaConversion}% del total`}
          icon={<Crown className="w-5 h-5 text-yellow-400" />}
          color="yellow"
        />
        <KPICard
          title="MRR"
          value={`$${metricas.mrr.toFixed(2)}`}
          subtitle={`ARR: $${metricas.arr.toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
          color="green"
        />
        <KPICard
          title="Nuevos (30d)"
          value={metricas.nuevosPremium30d}
          subtitle={`${metricas.cancelaciones30d} cancelaciones`}
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          color="blue"
          trend={metricas.nuevosPremium30d > metricas.cancelaciones30d ? 'up' : metricas.nuevosPremium30d < metricas.cancelaciones30d ? 'down' : undefined}
        />
        <KPICard
          title="Churn Rate"
          value={`${metricas.churnRate}%`}
          subtitle="Tasa de cancelación mensual"
          icon={<TrendingDown className="w-5 h-5 text-red-400" />}
          color={metricas.churnRate > 10 ? 'red' : metricas.churnRate > 5 ? 'orange' : 'green'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniKPI icon={<AlertTriangle className="w-4 h-4 text-orange-400" />} label="Próximos a vencer" value={metricas.proximosVencer} />
        <MiniKPI icon={<RefreshCw className="w-4 h-4 text-blue-400" />} label="Auto-renovación" value={metricas.autoRenovarActivo} />
        <MiniKPI icon={<Ticket className="w-4 h-4 text-purple-400" />} label="Con cupón" value={metricas.conCupon} />
        <MiniKPI icon={<Clock className="w-4 h-4 text-yellow-400" />} label="Pendientes pago" value={metricas.suscripcionesPendientes} />
      </div>

      {/* Tendencias Chart (table-based) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Tendencias (últimos 12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tendencias.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Visual bar chart */}
              <div className="mb-6">
                <div className="flex items-end gap-1 h-32">
                  {tendencias.map((t, i) => {
                    const maxNuevas = Math.max(...tendencias.map((x) => x.nuevas), 1);
                    const h = (t.nuevas / maxNuevas) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-light-secondary">{t.nuevas}</span>
                        <div
                          className="w-full bg-gradient-to-t from-yellow-500 to-amber-400 rounded-t-sm min-h-[2px] transition-all"
                          style={{ height: `${Math.max(h, 2)}%` }}
                        />
                        <span className="text-[9px] text-light-muted leading-tight text-center">{t.mes}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-light-secondary mt-2 text-center">Nuevas suscripciones por mes</p>
              </div>

              {/* Data table */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-dark-border text-light-secondary">
                    <th className="text-left py-2 px-1">Mes</th>
                    <th className="text-center py-2 px-1">Nuevas</th>
                    <th className="text-center py-2 px-1">Canceladas</th>
                    <th className="text-center py-2 px-1">Neto</th>
                    <th className="text-right py-2 px-1">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {tendencias.map((t, i) => {
                    const neto = t.nuevas - t.canceladas;
                    return (
                      <tr key={i} className="border-b border-dark-border/30 hover:bg-dark-hover">
                        <td className="py-1.5 px-1 text-light-text">{t.mes}</td>
                        <td className="py-1.5 px-1 text-center">
                          <span className="text-green-400">{t.nuevas}</span>
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <span className="text-red-400">{t.canceladas}</span>
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <span className={neto >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {neto >= 0 ? '+' : ''}{neto}
                          </span>
                        </td>
                        <td className="py-1.5 px-1 text-right text-light-text">${t.ingresos.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-dark-border font-semibold text-light-text">
                    <td className="py-2 px-1">Total</td>
                    <td className="py-2 px-1 text-center text-green-400">{tendencias.reduce((a, t) => a + t.nuevas, 0)}</td>
                    <td className="py-2 px-1 text-center text-red-400">{tendencias.reduce((a, t) => a + t.canceladas, 0)}</td>
                    <td className="py-2 px-1 text-center">
                      {(() => {
                        const net = tendencias.reduce((a, t) => a + t.nuevas - t.canceladas, 0);
                        return <span className={net >= 0 ? 'text-green-400' : 'text-red-400'}>{net >= 0 ? '+' : ''}{net}</span>;
                      })()}
                    </td>
                    <td className="py-2 px-1 text-right">${tendencias.reduce((a, t) => a + t.ingresos, 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-light-secondary text-center py-8">No hay datos de tendencias aún</p>
          )}
        </CardContent>
      </Card>

      {/* Cupones stats */}
      {cuponStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-purple-400" />
              Resumen de Cupones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-dark-surface rounded-lg text-center">
                <p className="text-lg font-bold text-light-text">{cuponStats.totalCupones}</p>
                <p className="text-xs text-light-secondary">Total</p>
              </div>
              <div className="p-3 bg-dark-surface rounded-lg text-center">
                <p className="text-lg font-bold text-green-400">{cuponStats.cuponesActivos}</p>
                <p className="text-xs text-light-secondary">Activos</p>
              </div>
              <div className="p-3 bg-dark-surface rounded-lg text-center">
                <p className="text-lg font-bold text-blue-400">{cuponStats.totalUsos}</p>
                <p className="text-xs text-light-secondary">Usos totales</p>
              </div>
              <div className="p-3 bg-dark-surface rounded-lg text-center">
                <p className="text-lg font-bold text-yellow-400">${cuponStats.descuentoTotal.toFixed(2)}</p>
                <p className="text-xs text-light-secondary">Descuentos ($)</p>
              </div>
            </div>

            {cuponStats.topCupones.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-light-text mb-2">Top cupones por uso</h4>
                <div className="space-y-2">
                  {cuponStats.topCupones.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-dark-surface rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-light-muted w-4">{i + 1}.</span>
                        <code className="bg-dark-bg px-2 py-0.5 rounded text-primary-400 font-mono text-xs">{c.codigo}</code>
                        <Badge variant="info" className="text-[10px]">
                          {c.tipo === 'PORCENTAJE' ? `${c.valor}%` : `$${c.valor}`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-light-text">{c.usos}/{c.limite}</span>
                        <div className="w-16 h-1.5 bg-dark-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-400 rounded-full"
                            style={{ width: `${Math.min((c.usos / c.limite) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
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

export default AdminSuscripcionesPage;
