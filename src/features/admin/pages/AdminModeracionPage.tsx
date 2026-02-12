import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { Loading, Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import {
  Image,
  Check,
  X,
  Flag,
  User,
  AlertTriangle,
  Eye,
  Trash2,
  Shield,
} from 'lucide-react';

type Tab = 'fotos' | 'reportes-fotos' | 'reportes-usuarios';

interface FotoModeracion {
  id: string;
  urlImagen: string;
  urlThumbnail: string | null;
  descripcion: string | null;
  tipo: string;
  estadoModeracion: string;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  tournament?: {
    id: string;
    nombre: string;
  } | null;
}

interface ReporteFoto {
  id: string;
  motivo: string;
  estado: string;
  createdAt: string;
  foto: {
    id: string;
    urlImagen: string;
    urlThumbnail: string | null;
    user: {
      id: string;
      nombre: string;
      apellido: string;
    };
  };
  user: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

interface ReporteUsuario {
  id: string;
  motivo: string;
  descripcion: string | null;
  estado: string;
  createdAt: string;
  reportador: {
    id: string;
    nombre: string;
    apellido: string;
  };
  reportado: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

const AdminModeracionPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('fotos');
  const [fotos, setFotos] = useState<FotoModeracion[]>([]);
  const [reportesFotos, setReportesFotos] = useState<ReporteFoto[]>([]);
  const [reportesUsuarios, setReportesUsuarios] = useState<ReporteUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'fotos') {
        const data = await adminService.getFotosModeracion();
        setFotos(data);
      } else if (activeTab === 'reportes-fotos') {
        const data = await adminService.getReportesFotos('PENDIENTE');
        setReportesFotos(data);
      } else {
        const data = await adminService.getReportesUsuarios('PENDIENTE');
        setReportesUsuarios(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== Fotos ==========
  const handleAprobarFoto = async (id: string) => {
    setActionLoading(id);
    try {
      await adminService.aprobarFoto(id);
      setFotos(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error aprobando foto:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEliminarFoto = async (id: string) => {
    const motivo = prompt('Motivo de eliminación:');
    if (!motivo) return;

    setActionLoading(id);
    try {
      await adminService.eliminarFoto(id, motivo);
      setFotos(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error eliminando foto:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // ========== Reportes Fotos ==========
  const handleResolverReporteFoto = async (id: string, accion: string) => {
    if (accion === 'ELIMINAR_FOTO') {
      if (!confirm('Esto eliminará la foto reportada. ¿Continuar?')) return;
    }
    setActionLoading(id);
    try {
      await adminService.resolverReporteFoto(id, accion);
      setReportesFotos(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error resolviendo reporte:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // ========== Reportes Usuarios ==========
  const handleResolverReporteUsuario = async (id: string, accion: string) => {
    if (accion === 'SUSPENDER') {
      if (!confirm('Esto suspenderá al usuario reportado. ¿Continuar?')) return;
    }
    setActionLoading(id);
    try {
      await adminService.resolverReporteUsuario(id, accion);
      setReportesUsuarios(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error resolviendo reporte:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'fotos', label: 'Fotos Pendientes', icon: <Image className="w-4 h-4" /> },
    { key: 'reportes-fotos', label: 'Reportes de Fotos', icon: <Flag className="w-4 h-4" /> },
    { key: 'reportes-usuarios', label: 'Reportes de Usuarios', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-light-text">Moderación de Contenido</h1>
        <p className="text-light-secondary mt-2">Revisa fotos pendientes y resuelve reportes de la comunidad</p>
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

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh]">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Cargando..." />
        </div>
      ) : (
        <>
          {activeTab === 'fotos' && <FotosTab fotos={fotos} actionLoading={actionLoading} onAprobar={handleAprobarFoto} onEliminar={handleEliminarFoto} onPreview={setPreviewUrl} />}
          {activeTab === 'reportes-fotos' && <ReportesFotosTab reportes={reportesFotos} actionLoading={actionLoading} onResolver={handleResolverReporteFoto} onPreview={setPreviewUrl} />}
          {activeTab === 'reportes-usuarios' && <ReportesUsuariosTab reportes={reportesUsuarios} actionLoading={actionLoading} onResolver={handleResolverReporteUsuario} />}
        </>
      )}
    </div>
  );
};

// ========== Tab: Fotos Pendientes ==========

function FotosTab({
  fotos,
  actionLoading,
  onAprobar,
  onEliminar,
  onPreview,
}: {
  fotos: FotoModeracion[];
  actionLoading: string | null;
  onAprobar: (id: string) => void;
  onEliminar: (id: string) => void;
  onPreview: (url: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Fotos Pendientes de Moderación
          {fotos.length > 0 && <Badge variant="warning">{fotos.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fotos.length === 0 ? (
          <div className="text-center py-8 text-light-secondary">
            <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay fotos pendientes de moderación</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className="border border-dark-border rounded-lg overflow-hidden hover:border-dark-hover"
              >
                <div className="relative aspect-video bg-dark-surface">
                  <img
                    src={foto.urlThumbnail || foto.urlImagen}
                    alt={foto.descripcion || 'Foto'}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onPreview(foto.urlImagen)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80"
                  >
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-light-secondary" />
                    <span className="text-sm font-medium">{foto.user.nombre} {foto.user.apellido}</span>
                  </div>
                  {foto.descripcion && (
                    <p className="text-xs text-light-secondary mb-2 line-clamp-2">{foto.descripcion}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-light-secondary mb-3">
                    <Badge variant="info">{foto.tipo}</Badge>
                    {foto.tournament && (
                      <span className="truncate">{foto.tournament.nombre}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      className="flex-1"
                      onClick={() => onAprobar(foto.id)}
                      loading={actionLoading === foto.id}
                      disabled={actionLoading !== null}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={() => onEliminar(foto.id)}
                      loading={actionLoading === foto.id}
                      disabled={actionLoading !== null}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== Tab: Reportes de Fotos ==========

function ReportesFotosTab({
  reportes,
  actionLoading,
  onResolver,
  onPreview,
}: {
  reportes: ReporteFoto[];
  actionLoading: string | null;
  onResolver: (id: string, accion: string) => void;
  onPreview: (url: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-5 h-5" />
          Reportes de Fotos
          {reportes.length > 0 && <Badge variant="warning">{reportes.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reportes.length === 0 ? (
          <div className="text-center py-8 text-light-secondary">
            <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay reportes de fotos pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportes.map((reporte) => (
              <div
                key={reporte.id}
                className="border border-dark-border rounded-lg p-4 hover:bg-dark-hover"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Foto thumbnail */}
                  <div
                    className="w-full md:w-32 h-24 rounded-lg overflow-hidden bg-dark-surface cursor-pointer flex-shrink-0"
                    onClick={() => onPreview(reporte.foto.urlImagen)}
                  >
                    <img
                      src={reporte.foto.urlThumbnail || reporte.foto.urlImagen}
                      alt="Foto reportada"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">
                          <span className="text-light-secondary">Reportada por:</span>{' '}
                          {reporte.user.nombre} {reporte.user.apellido}
                        </p>
                        <p className="text-sm text-light-secondary mt-1">
                          <span className="font-medium text-light-text">Autor foto:</span>{' '}
                          {reporte.foto.user.nombre} {reporte.foto.user.apellido}
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Motivo:</span> {reporte.motivo}
                        </p>
                        <p className="text-xs text-light-secondary mt-1">
                          {new Date(reporte.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onResolver(reporte.id, 'ELIMINAR_FOTO')}
                          loading={actionLoading === reporte.id}
                          disabled={actionLoading !== null}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar foto
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onResolver(reporte.id, 'IGNORAR')}
                          loading={actionLoading === reporte.id}
                          disabled={actionLoading !== null}
                        >
                          Ignorar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== Tab: Reportes de Usuarios ==========

function ReportesUsuariosTab({
  reportes,
  actionLoading,
  onResolver,
}: {
  reportes: ReporteUsuario[];
  actionLoading: string | null;
  onResolver: (id: string, accion: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Reportes de Usuarios
          {reportes.length > 0 && <Badge variant="warning">{reportes.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reportes.length === 0 ? (
          <div className="text-center py-8 text-light-secondary">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay reportes de usuarios pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportes.map((reporte) => (
              <div
                key={reporte.id}
                className="border border-dark-border rounded-lg p-4 hover:bg-dark-hover"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 p-2 bg-dark-surface rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-light-secondary">Reportado por</p>
                          <p className="text-sm font-medium">{reporte.reportador.nombre} {reporte.reportador.apellido}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-red-900/20 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-xs text-light-secondary">Usuario reportado</p>
                          <p className="text-sm font-medium">{reporte.reportado.nombre} {reporte.reportado.apellido}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Motivo:</span> {reporte.motivo}
                      </p>
                      {reporte.descripcion && (
                        <p className="text-sm text-light-secondary">{reporte.descripcion}</p>
                      )}
                      <p className="text-xs text-light-secondary">
                        {new Date(reporte.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-start flex-shrink-0">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onResolver(reporte.id, 'SUSPENDER')}
                      loading={actionLoading === reporte.id}
                      disabled={actionLoading !== null}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Suspender
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onResolver(reporte.id, 'IGNORAR')}
                      loading={actionLoading === reporte.id}
                      disabled={actionLoading !== null}
                    >
                      Ignorar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminModeracionPage;
