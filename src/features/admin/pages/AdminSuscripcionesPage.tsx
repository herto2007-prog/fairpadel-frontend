import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { Loading, Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import {
  CreditCard,
  Clock,
  Plus,
  X,
  DollarSign,
  Users,
  TrendingUp,
  Tag,
  Ticket,
} from 'lucide-react';

type Tab = 'suscripciones' | 'cupones' | 'metricas';

interface Suscripcion {
  id: string;
  periodo: 'MENSUAL' | 'ANUAL';
  precio: string | number;
  estado: 'ACTIVA' | 'VENCIDA' | 'CANCELADA' | 'PENDIENTE_PAGO';
  fechaInicio: string;
  fechaFin: string;
  fechaRenovacion: string | null;
  autoRenovar: boolean;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  plan: {
    id: string;
    nombre: string;
    tipo: string;
    precioMensual: string | number;
    precioAnual: string | number;
  };
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

interface MetricasIngresos {
  mrr: number;
  totalComisiones: number;
  suscripcionesActivas: number;
}

const AdminSuscripcionesPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('suscripciones');
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [metricas, setMetricas] = useState<MetricasIngresos | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [showCrearCupon, setShowCrearCupon] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, filterEstado]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'suscripciones') {
        const data = await adminService.getSuscripciones(filterEstado || undefined);
        setSuscripciones(data);
      } else if (activeTab === 'cupones') {
        const data = await adminService.getCupones();
        setCupones(data);
      } else {
        const data = await adminService.getMetricasIngresos();
        setMetricas(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtender = async (id: string) => {
    const diasStr = prompt('¿Cuántos días desea extender la suscripción?');
    if (!diasStr) return;
    const dias = parseInt(diasStr, 10);
    if (isNaN(dias) || dias <= 0) return;

    setActionLoading(id);
    try {
      await adminService.extenderSuscripcion(id, dias);
      await loadData();
    } catch (error) {
      console.error('Error extendiendo suscripción:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDesactivarCupon = async (id: string) => {
    if (!confirm('¿Desactivar este cupón?')) return;
    setActionLoading(id);
    try {
      await adminService.desactivarCupon(id);
      setCupones(prev => prev.map(c => c.id === id ? { ...c, estado: 'INACTIVO' } : c));
    } catch (error) {
      console.error('Error desactivando cupón:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVA': return <Badge variant="success">Activa</Badge>;
      case 'VENCIDA': return <Badge variant="danger">Vencida</Badge>;
      case 'CANCELADA': return <Badge variant="danger">Cancelada</Badge>;
      case 'PENDIENTE_PAGO': return <Badge variant="warning">Pendiente pago</Badge>;
      case 'ACTIVO': return <Badge variant="success">Activo</Badge>;
      case 'INACTIVO': return <Badge variant="danger">Inactivo</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'suscripciones', label: 'Suscripciones', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'cupones', label: 'Cupones', icon: <Ticket className="w-4 h-4" /> },
    { key: 'metricas', label: 'Métricas de Ingresos', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-light-text">Gestión de Suscripciones</h1>
        <p className="text-light-secondary mt-2">Administra suscripciones premium, cupones y métricas de ingresos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-card text-light-secondary hover:bg-dark-hover border border-dark-border'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Cargando..." />
        </div>
      ) : (
        <>
          {activeTab === 'suscripciones' && (
            <SuscripcionesTab
              suscripciones={suscripciones}
              filterEstado={filterEstado}
              setFilterEstado={setFilterEstado}
              actionLoading={actionLoading}
              onExtender={handleExtender}
              estadoBadge={estadoBadge}
            />
          )}
          {activeTab === 'cupones' && (
            <CuponesTab
              cupones={cupones}
              actionLoading={actionLoading}
              onDesactivar={handleDesactivarCupon}
              estadoBadge={estadoBadge}
              showCrear={showCrearCupon}
              setShowCrear={setShowCrearCupon}
              onCreated={loadData}
            />
          )}
          {activeTab === 'metricas' && metricas && (
            <MetricasTab metricas={metricas} />
          )}
        </>
      )}
    </div>
  );
};

// ========== Tab: Suscripciones ==========

function SuscripcionesTab({
  suscripciones,
  filterEstado,
  setFilterEstado,
  actionLoading,
  onExtender,
  estadoBadge,
}: {
  suscripciones: Suscripcion[];
  filterEstado: string;
  setFilterEstado: (v: string) => void;
  actionLoading: string | null;
  onExtender: (id: string) => void;
  estadoBadge: (e: string) => React.ReactNode;
}) {
  const filtros = [
    { value: '', label: 'Todas' },
    { value: 'ACTIVA', label: 'Activas' },
    { value: 'VENCIDA', label: 'Vencidas' },
    { value: 'CANCELADA', label: 'Canceladas' },
    { value: 'PENDIENTE_PAGO', label: 'Pendiente pago' },
  ];

  return (
    <>
      <div className="flex gap-2 mb-4">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterEstado(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterEstado === f.value
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
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
          {suscripciones.length === 0 ? (
            <div className="text-center py-8 text-light-secondary">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay suscripciones{filterEstado ? ` con estado ${filterEstado.toLowerCase()}` : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-light-secondary">
                    <th className="text-left py-3 px-2">Usuario</th>
                    <th className="text-left py-3 px-2">Plan</th>
                    <th className="text-left py-3 px-2">Período</th>
                    <th className="text-left py-3 px-2">Precio</th>
                    <th className="text-left py-3 px-2">Estado</th>
                    <th className="text-left py-3 px-2">Inicio</th>
                    <th className="text-left py-3 px-2">Fin</th>
                    <th className="text-left py-3 px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {suscripciones.map((sub) => (
                    <tr key={sub.id} className="border-b border-dark-border/50 hover:bg-dark-hover">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{sub.user.nombre} {sub.user.apellido}</p>
                          <p className="text-xs text-light-secondary">{sub.user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="premium">{sub.plan.nombre}</Badge>
                      </td>
                      <td className="py-3 px-2">{sub.periodo}</td>
                      <td className="py-3 px-2">${Number(sub.precio).toFixed(2)}</td>
                      <td className="py-3 px-2">{estadoBadge(sub.estado)}</td>
                      <td className="py-3 px-2 text-light-secondary">
                        {new Date(sub.fechaInicio).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-light-secondary">
                        {new Date(sub.fechaFin).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onExtender(sub.id)}
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
    </>
  );
}

// ========== Tab: Cupones ==========

function CuponesTab({
  cupones,
  actionLoading,
  onDesactivar,
  estadoBadge,
  showCrear,
  setShowCrear,
  onCreated,
}: {
  cupones: Cupon[];
  actionLoading: string | null;
  onDesactivar: (id: string) => void;
  estadoBadge: (e: string) => React.ReactNode;
  showCrear: boolean;
  setShowCrear: (v: boolean) => void;
  onCreated: () => void;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Cupones de Descuento
              {cupones.length > 0 && <Badge variant="info">{cupones.length}</Badge>}
            </CardTitle>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCrear(!showCrear)}
            >
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
                onCreated();
              }}
              onCancel={() => setShowCrear(false)}
            />
          )}

          {cupones.length === 0 ? (
            <div className="text-center py-8 text-light-secondary">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay cupones creados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-light-secondary">
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
                  {cupones.map((cupon) => (
                    <tr key={cupon.id} className="border-b border-dark-border/50 hover:bg-dark-hover">
                      <td className="py-3 px-2">
                        <code className="bg-dark-surface px-2 py-0.5 rounded text-primary-400 font-mono text-xs">
                          {cupon.codigo}
                        </code>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="info">{cupon.tipo}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        {cupon.tipo === 'PORCENTAJE' ? `${Number(cupon.valor)}%` : `$${Number(cupon.valor).toFixed(2)}`}
                      </td>
                      <td className="py-3 px-2">
                        {cupon.usosActuales} / {cupon.limiteUsos}
                      </td>
                      <td className="py-3 px-2 text-light-secondary text-xs">
                        {new Date(cupon.fechaInicio).toLocaleDateString()} - {new Date(cupon.fechaExpiracion).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">{estadoBadge(cupon.estado)}</td>
                      <td className="py-3 px-2">
                        {cupon.estado === 'ACTIVO' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDesactivar(cupon.id)}
                            loading={actionLoading === cupon.id}
                            disabled={actionLoading !== null}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Desactivar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ========== Crear Cupón Form ==========

function CrearCuponForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
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
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al crear cupón');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-dark-surface rounded-lg border border-dark-border">
      <h3 className="text-sm font-semibold mb-4 text-light-text">Nuevo Cupón</h3>
      {error && (
        <p className="text-sm text-red-400 mb-3">{error}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-light-secondary mb-1">Código</label>
          <input
            type="text"
            value={formData.codigo}
            onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
            placeholder="DESCUENTO20"
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-light-secondary mb-1">Tipo</label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
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
            onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
            placeholder="20"
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-light-secondary mb-1">Fecha inicio</label>
          <input
            type="date"
            value={formData.fechaInicio}
            onChange={(e) => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-light-secondary mb-1">Fecha expiración</label>
          <input
            type="date"
            value={formData.fechaExpiracion}
            onChange={(e) => setFormData(prev => ({ ...prev, fechaExpiracion: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-light-secondary mb-1">Límite de usos</label>
          <input
            type="number"
            min="1"
            value={formData.limiteUsos}
            onChange={(e) => setFormData(prev => ({ ...prev, limiteUsos: e.target.value }))}
            placeholder="100"
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
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

// ========== Tab: Métricas ==========

function MetricasTab({ metricas }: { metricas: MetricasIngresos }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">${metricas.mrr.toFixed(2)}</p>
            <p className="text-sm text-light-secondary mt-1">MRR (Ingreso Mensual Recurrente)</p>
            <p className="text-xs text-light-secondary mt-0.5">De suscripciones activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">${metricas.totalComisiones.toFixed(2)}</p>
            <p className="text-sm text-light-secondary mt-1">Total Comisiones</p>
            <p className="text-xs text-light-secondary mt-0.5">De pagos de inscripción</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-yellow-400">{metricas.suscripcionesActivas}</p>
            <p className="text-sm text-light-secondary mt-1">Suscripciones Activas</p>
            <p className="text-xs text-light-secondary mt-0.5">Usuarios premium actuales</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-light-text mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Métricas Calculadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-dark-surface rounded-lg">
              <p className="text-sm text-light-secondary">ARR (Ingreso Anual Recurrente)</p>
              <p className="text-2xl font-bold text-light-text">${(metricas.mrr * 12).toFixed(2)}</p>
            </div>
            <div className="p-4 bg-dark-surface rounded-lg">
              <p className="text-sm text-light-secondary">Ingreso Total Estimado</p>
              <p className="text-2xl font-bold text-light-text">
                ${(metricas.mrr * 12 + metricas.totalComisiones).toFixed(2)}
              </p>
              <p className="text-xs text-light-secondary">ARR + Comisiones</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSuscripcionesPage;
