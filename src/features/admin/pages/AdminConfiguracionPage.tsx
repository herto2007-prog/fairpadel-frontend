import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { Loading, Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import {
  Trophy,
  Save,
  Users,
  BarChart2,
  PieChart,
  Settings,
  Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'sistema' | 'puntos' | 'estadisticas';

interface ConfigSistema {
  id: string;
  clave: string;
  valor: string;
  descripcion: string | null;
}

interface ConfigPuntos {
  id: string;
  posicion: string;
  puntosBase: number;
  multiplicador: number;
}

interface MetricasUsuarios {
  porEstado: { estado: string; _count: number }[];
  porGenero: { genero: string; _count: number }[];
}

interface MetricasTorneos {
  porEstado: { estado: string; _count: number }[];
}

const posicionLabels: Record<string, string> = {
  CAMPEON: 'Campeón (1er lugar)',
  FINALISTA: 'Finalista (2do lugar)',
  SEMIFINALISTA: 'Semifinalista (3er/4to)',
  CUARTOS: 'Cuartos de final',
  OCTAVOS: 'Octavos de final',
  PRIMERA_RONDA: 'Primera ronda',
};

const estadoTorneoLabels: Record<string, string> = {
  BORRADOR: 'Borrador',
  PENDIENTE_APROBACION: 'Pendiente aprobación',
  PUBLICADO: 'Publicado',
  EN_CURSO: 'En curso',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  RECHAZADO: 'Rechazado',
};

const estadoUsuarioLabels: Record<string, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  SUSPENDIDO: 'Suspendido',
  PENDIENTE_VERIFICACION: 'Pendiente verificación',
};

const generoLabels: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
};

const AdminConfiguracionPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sistema');
  const [configSistema, setConfigSistema] = useState<ConfigSistema[]>([]);
  const [configPuntos, setConfigPuntos] = useState<ConfigPuntos[]>([]);
  const [editedPuntos, setEditedPuntos] = useState<Record<string, { puntosBase: number; multiplicador: number }>>({});
  const [metricasUsuarios, setMetricasUsuarios] = useState<MetricasUsuarios | null>(null);
  const [metricasTorneos, setMetricasTorneos] = useState<MetricasTorneos | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sistema') {
        const data = await adminService.getConfiguracionSistema();
        setConfigSistema(data);
      } else if (activeTab === 'puntos') {
        const data = await adminService.getConfiguracionPuntos();
        setConfigPuntos(data);
        setEditedPuntos({});
        setSavedIds(new Set());
      } else {
        const [usuarios, torneos] = await Promise.all([
          adminService.getMetricasUsuarios(),
          adminService.getMetricasTorneos(),
        ]);
        setMetricasUsuarios(usuarios);
        setMetricasTorneos(torneos);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPuntos = (id: string, field: 'puntosBase' | 'multiplicador', value: string) => {
    const numValue = field === 'puntosBase' ? parseInt(value, 10) : parseFloat(value);
    if (isNaN(numValue)) return;

    setEditedPuntos(prev => ({
      ...prev,
      [id]: {
        puntosBase: field === 'puntosBase' ? numValue : (prev[id]?.puntosBase ?? configPuntos.find(c => c.id === id)!.puntosBase),
        multiplicador: field === 'multiplicador' ? numValue : (prev[id]?.multiplicador ?? configPuntos.find(c => c.id === id)!.multiplicador),
      },
    }));
    // Remove from saved if re-edited
    setSavedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSavePuntos = async (id: string) => {
    const edited = editedPuntos[id];
    if (!edited) return;

    setSaving(id);
    try {
      await adminService.actualizarConfiguracionPuntos(id, edited);
      setConfigPuntos(prev =>
        prev.map(c => c.id === id ? { ...c, ...edited } : c)
      );
      setSavedIds(prev => new Set(prev).add(id));
      // Clear from edited
      setEditedPuntos(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(null);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'sistema', label: 'Configuración General', icon: <Settings className="w-4 h-4" /> },
    { key: 'puntos', label: 'Tabla de Puntos', icon: <Trophy className="w-4 h-4" /> },
    { key: 'estadisticas', label: 'Estadísticas Generales', icon: <PieChart className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Configuración del Sistema</h1>
        <p className="text-sm sm:text-base text-light-secondary mt-1 sm:mt-2">Configura puntos de ranking y revisa estadísticas generales</p>
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
          {activeTab === 'sistema' && (
            <SistemaTab
              config={configSistema}
              onUpdate={async (clave, valor) => {
                try {
                  await adminService.actualizarConfiguracionSistema(clave, valor);
                  setConfigSistema(prev =>
                    prev.map(c => c.clave === clave ? { ...c, valor } : c)
                  );
                  toast.success('Configuración actualizada');
                } catch (error: any) {
                  const msg = error?.response?.data?.message || 'Error al actualizar';
                  toast.error(msg);
                }
              }}
            />
          )}
          {activeTab === 'puntos' && (
            <PuntosTab
              config={configPuntos}
              editedPuntos={editedPuntos}
              saving={saving}
              savedIds={savedIds}
              onEdit={handleEditPuntos}
              onSave={handleSavePuntos}
            />
          )}
          {activeTab === 'estadisticas' && metricasUsuarios && metricasTorneos && (
            <EstadisticasTab
              metricasUsuarios={metricasUsuarios}
              metricasTorneos={metricasTorneos}
            />
          )}
        </>
      )}
    </div>
  );
};

// ========== Tab: Configuración General ==========

const claveLabels: Record<string, { label: string; descripcion: string; sufijo: string }> = {
  COMISION_INSCRIPCION: {
    label: 'Comisión por Inscripción',
    descripcion: 'Porcentaje que la plataforma cobra por cada inscripción paga a un torneo',
    sufijo: '%',
  },
};

function SistemaTab({
  config,
  onUpdate,
}: {
  config: ConfigSistema[];
  onUpdate: (clave: string, valor: string) => Promise<void>;
}) {
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const handleSave = async (clave: string) => {
    const newVal = editValues[clave];
    if (newVal === undefined) return;

    setSavingKey(clave);
    await onUpdate(clave, newVal);
    setEditValues(prev => {
      const next = { ...prev };
      delete next[clave];
      return next;
    });
    setSavingKey(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Parámetros del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config.length === 0 ? (
            <p className="text-light-secondary text-sm text-center py-4">No hay configuraciones registradas</p>
          ) : (
            <div className="space-y-4">
              {config.map((item) => {
                const meta = claveLabels[item.clave];
                const isEditing = editValues[item.clave] !== undefined;
                const currentVal = editValues[item.clave] ?? item.valor;

                return (
                  <div
                    key={item.id}
                    className="border border-dark-border rounded-lg p-4 hover:bg-dark-hover"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-light-text">
                          {meta?.label || item.clave}
                        </h3>
                        <p className="text-sm text-light-secondary mt-1">
                          {meta?.descripcion || item.descripcion || ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={currentVal}
                            onChange={(e) =>
                              setEditValues(prev => ({ ...prev, [item.clave]: e.target.value }))
                            }
                            className="w-28 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-lg font-bold text-light-text text-center focus:outline-none focus:border-primary-500"
                          />
                          {meta?.sufijo && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-light-secondary font-medium">
                              {meta.sufijo}
                            </span>
                          )}
                        </div>

                        {isEditing && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleSave(item.clave)}
                            loading={savingKey === item.clave}
                            disabled={savingKey !== null}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Guardar
                          </Button>
                        )}
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

// ========== Tab: Tabla de Puntos ==========

function PuntosTab({
  config,
  editedPuntos,
  saving,
  savedIds,
  onEdit,
  onSave,
}: {
  config: ConfigPuntos[];
  editedPuntos: Record<string, { puntosBase: number; multiplicador: number }>;
  saving: string | null;
  savedIds: Set<string>;
  onEdit: (id: string, field: 'puntosBase' | 'multiplicador', value: string) => void;
  onSave: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Configuración de Puntos por Posición
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-light-secondary mb-4">
          Define cuántos puntos se otorgan por posición en cada torneo. El multiplicador permite ajustar puntos por tipo de torneo.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border text-light-secondary">
                <th className="text-left py-3 px-2">Posición</th>
                <th className="text-left py-3 px-2">Puntos Base</th>
                <th className="text-left py-3 px-2">Multiplicador</th>
                <th className="text-left py-3 px-2">Puntos Efectivos</th>
                <th className="text-left py-3 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {config.map((c) => {
                const edited = editedPuntos[c.id];
                const puntosBase = edited?.puntosBase ?? c.puntosBase;
                const multiplicador = edited?.multiplicador ?? c.multiplicador;
                const puntosEfectivos = Math.round(puntosBase * multiplicador);
                const hasChanges = !!edited;
                const wasSaved = savedIds.has(c.id);

                return (
                  <tr key={c.id} className="border-b border-dark-border/50 hover:bg-dark-hover">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{posicionLabels[c.posicion] || c.posicion}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        value={puntosBase}
                        onChange={(e) => onEdit(c.id, 'puntosBase', e.target.value)}
                        className="w-24 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm text-light-text focus:outline-none focus:border-primary-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={multiplicador}
                        onChange={(e) => onEdit(c.id, 'multiplicador', e.target.value)}
                        className="w-24 px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm text-light-text focus:outline-none focus:border-primary-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={puntosEfectivos >= 50 ? 'success' : puntosEfectivos >= 10 ? 'warning' : 'info'}>
                        {puntosEfectivos} pts
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      {hasChanges ? (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => onSave(c.id)}
                          loading={saving === c.id}
                          disabled={saving !== null}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Guardar
                        </Button>
                      ) : wasSaved ? (
                        <span className="text-xs text-green-400">Guardado</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Tab: Estadísticas Generales ==========

function EstadisticasTab({
  metricasUsuarios,
  metricasTorneos,
}: {
  metricasUsuarios: MetricasUsuarios;
  metricasTorneos: MetricasTorneos;
}) {
  const totalUsuarios = metricasUsuarios.porEstado.reduce((acc, e) => acc + e._count, 0);
  const totalTorneos = metricasTorneos.porEstado.reduce((acc, e) => acc + e._count, 0);

  return (
    <div className="space-y-6">
      {/* Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuarios
            <Badge variant="info">{totalUsuarios} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Por estado */}
            <div>
              <h4 className="text-sm font-semibold text-light-text mb-3">Por Estado</h4>
              <div className="space-y-2">
                {metricasUsuarios.porEstado.map((item) => {
                  const pct = totalUsuarios > 0 ? (item._count / totalUsuarios * 100) : 0;
                  return (
                    <div key={item.estado}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-light-secondary">{estadoUsuarioLabels[item.estado] || item.estado}</span>
                        <span className="text-light-text font-medium">{item._count}</span>
                      </div>
                      <div className="w-full bg-dark-surface rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Por género */}
            <div>
              <h4 className="text-sm font-semibold text-light-text mb-3">Por Género</h4>
              <div className="space-y-2">
                {metricasUsuarios.porGenero.map((item) => {
                  const pct = totalUsuarios > 0 ? (item._count / totalUsuarios * 100) : 0;
                  const color = item.genero === 'MASCULINO' ? 'bg-blue-500' : 'bg-pink-500';
                  return (
                    <div key={item.genero}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-light-secondary">{generoLabels[item.genero] || item.genero}</span>
                        <span className="text-light-text font-medium">{item._count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-dark-surface rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Torneos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            Torneos
            <Badge variant="info">{totalTorneos} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metricasTorneos.porEstado.map((item) => {
              const colorMap: Record<string, string> = {
                PUBLICADO: 'text-green-400 bg-green-900/30',
                EN_CURSO: 'text-blue-400 bg-blue-900/30',
                FINALIZADO: 'text-gray-400 bg-gray-900/30',
                PENDIENTE_APROBACION: 'text-yellow-400 bg-yellow-900/30',
                BORRADOR: 'text-light-secondary bg-dark-surface',
                CANCELADO: 'text-red-400 bg-red-900/30',
                RECHAZADO: 'text-red-400 bg-red-900/30',
              };
              const colors = colorMap[item.estado] || 'text-light-secondary bg-dark-surface';
              return (
                <div key={item.estado} className={`p-4 rounded-lg ${colors.split(' ').slice(1).join(' ')}`}>
                  <p className={`text-2xl font-bold ${colors.split(' ')[0]}`}>{item._count}</p>
                  <p className="text-xs text-light-secondary mt-1">{estadoTorneoLabels[item.estado] || item.estado}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminConfiguracionPage;
