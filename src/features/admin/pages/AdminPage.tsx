import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { circuitosService } from '@/services/circuitosService';
import { Loading, Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import type { Tournament, Circuito } from '@/types';
import { Calendar, MapPin, Users, Check, X, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const [torneosPendientes, setTorneosPendientes] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  // Modal de aprobacion
  const [approvalModal, setApprovalModal] = useState<Tournament | null>(null);
  const [circuitosActivos, setCircuitosActivos] = useState<Circuito[]>([]);
  const [selectedCircuitoId, setSelectedCircuitoId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [torneos, metricas, circs] = await Promise.all([
        adminService.getTorneosPendientes(),
        adminService.getMetricasDashboard(),
        circuitosService.getAll().catch(() => []),
      ]);
      setTorneosPendientes(torneos);
      setMetrics(metricas);
      setCircuitosActivos(circs.filter((c: Circuito) => c.estado === 'ACTIVO'));
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (torneo: Tournament) => {
    setApprovalModal(torneo);
    setSelectedCircuitoId('');
  };

  const handleAprobar = async () => {
    if (!approvalModal) return;
    setActionLoading(approvalModal.id);
    try {
      await adminService.aprobarTorneo(
        approvalModal.id,
        selectedCircuitoId || undefined,
      );
      toast.success(
        selectedCircuitoId
          ? 'Torneo aprobado y asignado a circuito'
          : 'Torneo aprobado',
      );
      setTorneosPendientes(prev => prev.filter(t => t.id !== approvalModal.id));
      setApprovalModal(null);
      const metricas = await adminService.getMetricasDashboard();
      setMetrics(metricas);
    } catch (error) {
      console.error('Error aprobando torneo:', error);
      toast.error('Error al aprobar torneo');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRechazar = async (id: string) => {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;

    setActionLoading(id);
    try {
      await adminService.rechazarTorneo(id, motivo);
      setTorneosPendientes(prev => prev.filter(t => t.id !== id));
      // Actualizar métricas
      const metricas = await adminService.getMetricasDashboard();
      setMetrics(metricas);
    } catch (error) {
      console.error('Error rechazando torneo:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando panel de administración..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Panel de Administración</h1>
        <p className="text-sm sm:text-base text-light-secondary mt-1 sm:mt-2">Gestiona torneos, usuarios y configuración</p>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-primary-500">{metrics.totalUsuarios}</p>
              <p className="text-xs sm:text-sm text-light-secondary">Usuarios</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{metrics.usuariosPremium}</p>
              <p className="text-xs sm:text-sm text-light-secondary">Premium</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{metrics.totalTorneos}</p>
              <p className="text-xs sm:text-sm text-light-secondary">Torneos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">{metrics.torneosPendientes}</p>
              <p className="text-xs sm:text-sm text-light-secondary">Pendientes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Torneos Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏆</span>
            Torneos Pendientes de Aprobación
            {torneosPendientes.length > 0 && (
              <Badge variant="warning">{torneosPendientes.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {torneosPendientes.length === 0 ? (
            <div className="text-center py-8 text-light-secondary">
              <p>No hay torneos pendientes de aprobación</p>
            </div>
          ) : (
            <div className="space-y-4">
              {torneosPendientes.map((torneo) => (
                <div
                  key={torneo.id}
                  className="border border-dark-border rounded-lg p-4 hover:bg-dark-hover"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{torneo.nombre}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-light-secondary mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(torneo.fechaInicio).toLocaleDateString()} - {new Date(torneo.fechaFin).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {torneo.ciudad}, {torneo.pais}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {torneo.categorias?.length || 0} categorías
                        </span>
                      </div>
                      {torneo.organizador && (
                        <p className="text-sm text-light-secondary mt-2">
                          Organizador: {torneo.organizador.nombre} {torneo.organizador.apellido} ({torneo.organizador.email})
                        </p>
                      )}
                      {torneo.descripcion && (
                        <p className="text-sm text-light-secondary mt-2 line-clamp-2">
                          {torneo.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 items-start">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => openApprovalModal(torneo)}
                        disabled={actionLoading !== null}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRechazar(torneo.id)}
                        loading={actionLoading === torneo.id}
                        disabled={actionLoading !== null}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Aprobacion */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-light-text mb-1">
                Aprobar Torneo
              </h3>
              <p className="text-sm text-light-secondary mb-4">
                {approvalModal.nombre}
              </p>

              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-light-text mb-2">
                  <Globe className="h-4 w-4 text-primary-400" />
                  Asignar a circuito (opcional)
                </label>
                <select
                  className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-light-text focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={selectedCircuitoId}
                  onChange={(e) => setSelectedCircuitoId(e.target.value)}
                >
                  <option value="">Sin circuito</option>
                  {circuitosActivos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.temporada})
                      {c.multiplicador && c.multiplicador !== 1.0
                        ? ` — x${c.multiplicador}`
                        : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-light-secondary mt-1">
                  Tambien puedes asignar circuitos desde Gestionar Circuitos
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setApprovalModal(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="success"
                  onClick={handleAprobar}
                  loading={actionLoading === approvalModal.id}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aprobar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;