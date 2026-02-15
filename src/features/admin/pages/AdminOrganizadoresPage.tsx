import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { Loading, Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { Check, X, UserPlus, Mail, Phone, MapPin, Clock, FileText, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface SolicitudOrganizador {
  id: string;
  userId: string;
  organizacion: string | null;
  telefono: string;
  ciudad: string;
  experiencia: string;
  motivacion: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  motivo: string | null;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    ciudad: string;
  };
}

type FilterEstado = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | '';

const AdminOrganizadoresPage = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudOrganizador[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<FilterEstado>('PENDIENTE');
  const [documento, setDocumento] = useState('');
  const [promoviendo, setPromoviendo] = useState(false);
  const [promoverResult, setPromoverResult] = useState<{ message: string; usuario?: { nombre: string; apellido: string; email: string } } | null>(null);

  useEffect(() => {
    loadData();
  }, [filterEstado]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSolicitudesOrganizador(filterEstado || undefined);
      setSolicitudes(data);
    } catch (error) {
      console.error('Error loading solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento.trim()) return;

    setPromoviendo(true);
    setPromoverResult(null);
    try {
      const result = await adminService.promoverOrganizador(documento.trim());
      setPromoverResult(result);
      setDocumento('');
      toast.success(result.message);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al promover usuario';
      toast.error(msg);
      setPromoverResult({ message: msg });
    } finally {
      setPromoviendo(false);
    }
  };

  const handleAprobar = async (id: string) => {
    setActionLoading(id);
    try {
      await adminService.aprobarSolicitudOrganizador(id);
      setSolicitudes(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRechazar = async (id: string) => {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;

    setActionLoading(id);
    try {
      await adminService.rechazarSolicitudOrganizador(id, motivo);
      setSolicitudes(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <Badge variant="warning">Pendiente</Badge>;
      case 'APROBADA': return <Badge variant="success">Aprobada</Badge>;
      case 'RECHAZADA': return <Badge variant="danger">Rechazada</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Solicitudes de Organizador</h1>
        <p className="text-sm sm:text-base text-light-secondary mt-1 sm:mt-2">Revisa y aprueba solicitudes de usuarios que desean ser organizadores</p>
      </div>

      {/* Promover Organizador por Documento */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Asignar Rol de Organizador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-light-secondary mb-4">
            Busca un usuario por su número de documento y asígnale el rol de organizador directamente, sin necesidad de solicitud.
          </p>
          <form onSubmit={handlePromover} className="flex gap-3 items-end">
            <div className="flex-1 max-w-sm">
              <label className="block text-sm font-medium text-light-text mb-1">
                Nro. de Documento
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-secondary" />
                <input
                  type="text"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="Ej: 4567890"
                  className="w-full pl-10 pr-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={promoviendo}
              disabled={promoviendo || !documento.trim()}
            >
              <ShieldCheck className="h-4 w-4 mr-1" />
              Hacer Organizador
            </Button>
          </form>

          {promoverResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              promoverResult.usuario
                ? 'bg-green-900/30 text-green-400 border border-green-800'
                : 'bg-red-900/30 text-red-400 border border-red-800'
            }`}>
              <p>{promoverResult.message}</p>
              {promoverResult.usuario && (
                <p className="text-xs mt-1 text-light-secondary">
                  {promoverResult.usuario.nombre} {promoverResult.usuario.apellido} — {promoverResult.usuario.email}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {([
          { value: 'PENDIENTE', label: 'Pendientes' },
          { value: 'APROBADA', label: 'Aprobadas' },
          { value: 'RECHAZADA', label: 'Rechazadas' },
          { value: '', label: 'Todas' },
        ] as { value: FilterEstado; label: string }[]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterEstado(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterEstado === f.value
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-card text-light-secondary hover:bg-dark-hover border border-dark-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Cargando solicitudes..." />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Solicitudes
              {solicitudes.length > 0 && (
                <Badge variant="info">{solicitudes.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {solicitudes.length === 0 ? (
              <div className="text-center py-8 text-light-secondary">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay solicitudes {filterEstado ? filterEstado.toLowerCase() + 's' : ''}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {solicitudes.map((solicitud) => (
                  <div
                    key={solicitud.id}
                    className="border border-dark-border rounded-lg p-4 hover:bg-dark-hover"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {solicitud.user.nombre} {solicitud.user.apellido}
                          </h3>
                          {estadoBadge(solicitud.estado)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-light-secondary">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {solicitud.user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {solicitud.telefono}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {solicitud.ciudad}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(solicitud.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {solicitud.organizacion && (
                          <p className="text-sm text-light-secondary mt-2">
                            <strong>Organización:</strong> {solicitud.organizacion}
                          </p>
                        )}

                        <div className="mt-3 space-y-2">
                          <details className="group">
                            <summary className="text-sm font-medium text-primary-400 cursor-pointer flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              Ver experiencia y motivación
                            </summary>
                            <div className="mt-2 p-3 bg-dark-surface rounded-lg text-sm space-y-2">
                              <div>
                                <p className="font-medium text-light-text mb-1">Experiencia:</p>
                                <p className="text-light-secondary whitespace-pre-wrap">{solicitud.experiencia}</p>
                              </div>
                              <div>
                                <p className="font-medium text-light-text mb-1">Motivación:</p>
                                <p className="text-light-secondary whitespace-pre-wrap">{solicitud.motivacion}</p>
                              </div>
                            </div>
                          </details>
                        </div>

                        {solicitud.motivo && (
                          <p className="text-sm text-red-400 mt-2">
                            <strong>Motivo de rechazo:</strong> {solicitud.motivo}
                          </p>
                        )}
                      </div>

                      {solicitud.estado === 'PENDIENTE' && (
                        <div className="flex gap-2 items-start">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAprobar(solicitud.id)}
                            loading={actionLoading === solicitud.id}
                            disabled={actionLoading !== null}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRechazar(solicitud.id)}
                            loading={actionLoading === solicitud.id}
                            disabled={actionLoading !== null}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminOrganizadoresPage;
