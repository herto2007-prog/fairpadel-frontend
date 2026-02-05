import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { Loading, Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import type { Tournament } from '@/types';
import { Calendar, MapPin, Users, Check, X } from 'lucide-react';

const AdminPage = () => {
  const [torneosPendientes, setTorneosPendientes] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [torneos, metricas] = await Promise.all([
        adminService.getTorneosPendientes(),
        adminService.getMetricasDashboard(),
      ]);
      setTorneosPendientes(torneos);
      setMetrics(metricas);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (id: string) => {
    setActionLoading(id);
    try {
      await adminService.aprobarTorneo(id);
      setTorneosPendientes(prev => prev.filter(t => t.id !== id));
      // Actualizar métricas
      const metricas = await adminService.getMetricasDashboard();
      setMetrics(metricas);
    } catch (error) {
      console.error('Error aprobando torneo:', error);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">Gestiona torneos, usuarios y configuración</p>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{metrics.totalUsuarios}</p>
              <p className="text-sm text-gray-600">Usuarios</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{metrics.usuariosPremium}</p>
              <p className="text-sm text-gray-600">Premium</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{metrics.totalTorneos}</p>
              <p className="text-sm text-gray-600">Torneos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{metrics.torneosPendientes}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
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
            <div className="text-center py-8 text-gray-500">
              <p>No hay torneos pendientes de aprobación</p>
            </div>
          ) : (
            <div className="space-y-4">
              {torneosPendientes.map((torneo) => (
                <div
                  key={torneo.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{torneo.nombre}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
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
                        <p className="text-sm text-gray-500 mt-2">
                          Organizador: {torneo.organizador.nombre} {torneo.organizador.apellido} ({torneo.organizador.email})
                        </p>
                      )}
                      {torneo.descripcion && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {torneo.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 items-start">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleAprobar(torneo.id)}
                        loading={actionLoading === torneo.id}
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
    </div>
  );
};

export default AdminPage;