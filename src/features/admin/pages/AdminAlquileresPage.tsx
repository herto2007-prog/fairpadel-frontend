import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import { sedesService } from '@/services/sedesService';
import { usersService } from '@/services/usersService';
import {
  MapPin, ToggleLeft, ToggleRight, Users, Calendar,
  DollarSign, BarChart2, Search, CheckCircle2,
} from 'lucide-react';
import { Loading, Badge, Button } from '@/components/ui';
import toast from 'react-hot-toast';
import type { AlquileresDashboard } from '@/types';

type Tab = 'sedes' | 'dashboard';

interface SedeAlquilerAdmin {
  id: string;
  nombre: string;
  ciudad: string;
  habilitado: boolean;
  encargadoId?: string;
  encargadoNombre?: string;
  canchasCount: number;
}

interface SedeAlquilerAdminRaw {
  id: string;
  nombre: string;
  ciudad?: string;
  activa?: boolean;
  _count?: { canchas?: number };
  canchas?: unknown[];
}

export default function AdminAlquileresPage() {
  const [activeTab, setActiveTab] = useState<Tab>('sedes');
  const [sedes, setSedes] = useState<SedeAlquilerAdmin[]>([]);
  const [, setAllSedes] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<AlquileresDashboard | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Habilitar modal
  const [showHabilitar, setShowHabilitar] = useState<string | null>(null);
  const [encargadoDoc, setEncargadoDoc] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<{ id: string; nombre: string; apellido: string; documento: string } | null>(null);

  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    setLoading(true);
    try {
      // Get all sedes
      const sedesData = await sedesService.getAll();
      const sedesList = Array.isArray(sedesData) ? sedesData : [];
      setAllSedes(sedesList);

      // Get alquiler-enabled sedes
      const alqData = await alquileresService.getSedesConAlquiler();
      const alqSedes = Array.isArray(alqData) ? alqData : [];
      const alqMap = new Map<string, { id: string; encargadoId?: string; encargadoNombre?: string }>(alqSedes.map((s: { id: string; encargadoId?: string; encargadoNombre?: string }) => [s.id, s]));

      // Merge
      const merged: SedeAlquilerAdmin[] = (sedesList as SedeAlquilerAdminRaw[])
        .filter((s) => s.activa !== false)
        .map((s) => {
          const alq = alqMap.get(s.id);
          return {
            id: s.id,
            nombre: s.nombre,
            ciudad: s.ciudad || '',
            habilitado: !!alq,
            encargadoId: alq?.encargadoId,
            encargadoNombre: alq?.encargadoNombre,
            canchasCount: s._count?.canchas || s.canchas?.length || 0,
          };
        });
      setSedes(merged);
    } catch (err: any) {
      toast.error('Error cargando sedes');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    setDashLoading(true);
    try {
      const data = await alquileresService.getDashboard();
      setDashboard(data);
    } catch {
      toast.error('Error cargando dashboard');
    } finally {
      setDashLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard' && !dashboard) {
      loadDashboard();
    }
  }, [activeTab]);

  const handleHabilitar = async (sedeId: string) => {
    if (!foundUser) {
      toast.error('Buscá y seleccioná un encargado primero');
      return;
    }
    setActionLoading(sedeId);
    try {
      await alquileresService.habilitarAlquiler({ sedeId, encargadoId: foundUser.id });
      toast.success('Alquiler habilitado');
      setShowHabilitar(null);
      setEncargadoDoc('');
      setFoundUser(null);
      loadSedes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error habilitando');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeshabilitar = async (sedeId: string) => {
    if (!confirm('¿Deshabilitar alquiler para esta sede?')) return;
    setActionLoading(sedeId);
    try {
      await alquileresService.deshabilitarAlquiler(sedeId);
      toast.success('Alquiler deshabilitado');
      loadSedes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBuscarEncargado = async () => {
    if (!encargadoDoc.trim()) return;
    setSearchingUser(true);
    setFoundUser(null);
    try {
      const data = await usersService.getByDocumento(encargadoDoc.trim());
      if (data) {
        setFoundUser(data);
      } else {
        toast.error('Usuario no encontrado');
      }
    } catch {
      toast.error('Usuario no encontrado');
    } finally {
      setSearchingUser(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Admin — Alquileres</h1>
        <p className="text-sm sm:text-base text-light-secondary mt-1">Gestionar sedes con alquiler de canchas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('sedes')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'sedes'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
              : 'bg-dark-card border border-dark-border text-light-muted hover:text-light-text hover:bg-dark-hover'
          }`}
        >
          <MapPin className="w-4 h-4" /> Sedes
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
              : 'bg-dark-card border border-dark-border text-light-muted hover:text-light-text hover:bg-dark-hover'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Dashboard
        </button>
      </div>

      {/* Sedes Tab */}
      {activeTab === 'sedes' && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading />
            </div>
          ) : (
            <div className="space-y-3">
              {sedes.map((s) => (
                <div key={s.id} className="bg-dark-card rounded-xl border border-dark-border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-light-text text-sm">{s.nombre}</h3>
                        {s.habilitado ? (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Habilitado
                          </Badge>
                        ) : (
                          <Badge variant="outline">Deshabilitado</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-light-muted">
                        {s.ciudad && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {s.ciudad}
                          </span>
                        )}
                        <span>{s.canchasCount} canchas</span>
                        {s.encargadoNombre && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> Encargado: {s.encargadoNombre}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {s.habilitado ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeshabilitar(s.id)}
                          loading={actionLoading === s.id}
                          className="text-xs"
                        >
                          <ToggleLeft className="w-3.5 h-3.5 mr-1" />
                          Deshabilitar
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => { setShowHabilitar(s.id); setFoundUser(null); setEncargadoDoc(''); }}
                          className="text-xs"
                        >
                          <ToggleRight className="w-3.5 h-3.5 mr-1" />
                          Habilitar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Habilitar form inline */}
                  {showHabilitar === s.id && (
                    <div className="mt-3 pt-3 border-t border-dark-border">
                      <p className="text-xs text-light-muted mb-2">Asignar encargado (buscar por documento):</p>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={encargadoDoc}
                          onChange={(e) => setEncargadoDoc(e.target.value)}
                          placeholder="Documento del encargado"
                          className="flex-1 px-3 py-1.5 bg-dark-input border border-dark-border rounded-lg text-sm text-light-text placeholder-light-muted"
                          onKeyDown={(e) => e.key === 'Enter' && handleBuscarEncargado()}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBuscarEncargado}
                          loading={searchingUser}
                        >
                          <Search className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      {foundUser && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-green-400">
                            {foundUser.nombre} {foundUser.apellido} ({foundUser.documento})
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleHabilitar(s.id)}
                            loading={actionLoading === s.id}
                            className="text-xs"
                          >
                            Confirmar
                          </Button>
                        </div>
                      )}
                      <button
                        onClick={() => setShowHabilitar(null)}
                        className="mt-2 text-xs text-light-muted hover:text-light-text"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {sedes.length === 0 && (
                <div className="text-center py-12 text-light-muted text-sm">No hay sedes registradas.</div>
              )}
            </div>
          )}
        </>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {dashLoading ? (
            <div className="flex justify-center py-12">
              <Loading />
            </div>
          ) : dashboard ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-card rounded-xl border border-dark-border p-4 text-center">
                <MapPin className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-light-text">{dashboard.sedesHabilitadas ?? 0}</p>
                <p className="text-xs text-light-muted mt-1">Sedes Habilitadas</p>
              </div>
              <div className="bg-dark-card rounded-xl border border-dark-border p-4 text-center">
                <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-light-text">{dashboard.reservasMes ?? 0}</p>
                <p className="text-xs text-light-muted mt-1">Reservas del Mes</p>
              </div>
              <div className="bg-dark-card rounded-xl border border-dark-border p-4 text-center">
                <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-light-text">
                  {(dashboard.revenueMes ?? 0).toLocaleString('es-PY')}
                </p>
                <p className="text-xs text-light-muted mt-1">Revenue Mes (Gs)</p>
              </div>
              <div className="bg-dark-card rounded-xl border border-dark-border p-4 text-center">
                <BarChart2 className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-light-text">{dashboard.reservasConfirmadas ?? 0}</p>
                <p className="text-xs text-light-muted mt-1">Confirmadas</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-light-muted text-sm">No hay datos disponibles.</div>
          )}
        </>
      )}
    </div>
  );
}
