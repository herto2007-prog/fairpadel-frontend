import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { Loading, Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal } from '@/components/ui';
import toast from 'react-hot-toast';
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
  Search,
  UserCheck,
  UserX,
  Users,
  Filter,
  RefreshCw,
  Camera,
} from 'lucide-react';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

type Tab = 'fotos' | 'reportes-fotos' | 'reportes-usuarios' | 'usuarios';

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

interface UsuarioAdmin {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  email: string;
  telefono: string;
  ciudad: string | null;
  estado: string;
  esPremium: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════
// CONFIRM MODAL (reusable)
// ═══════════════════════════════════════

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
  loading = false,
  requireMotivo = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo?: string) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'success' | 'primary';
  loading?: boolean;
  requireMotivo?: boolean;
}) {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    if (requireMotivo && !motivo.trim()) {
      toast.error('Debes ingresar un motivo');
      return;
    }
    onConfirm(requireMotivo ? motivo.trim() : undefined);
    setMotivo('');
  };

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-light-secondary">{message}</p>
        {requireMotivo && (
          <div>
            <label className="block text-sm font-medium text-light-secondary mb-1">
              Motivo
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ingresa el motivo..."
              className="w-full rounded-md border bg-dark-input border-dark-border text-light-text px-3 py-2 text-sm placeholder:text-light-muted focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px] resize-none"
              autoFocus
            />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={handleConfirm}
            loading={loading}
            disabled={requireMotivo && !motivo.trim()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════
// SUMMARY STATS BAR
// ═══════════════════════════════════════

function SummaryStats({
  stats,
  loading,
}: {
  stats: { fotosPendientes: number; reportesFotos: number; reportesUsuarios: number; usuariosSuspendidos: number };
  loading: boolean;
}) {
  const items = [
    { label: 'Fotos pendientes', value: stats.fotosPendientes, icon: Camera, color: 'text-yellow-400' },
    { label: 'Reportes fotos', value: stats.reportesFotos, icon: Flag, color: 'text-orange-400' },
    { label: 'Reportes usuarios', value: stats.reportesUsuarios, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Suspendidos', value: stats.usuariosSuspendidos, icon: UserX, color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-dark-card border border-dark-border rounded-lg p-3 flex items-center gap-3"
        >
          <div className={`p-2 rounded-lg bg-dark-surface ${item.color}`}>
            <item.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-light-secondary">{item.label}</p>
            <p className="text-lg font-bold text-light-text">
              {loading ? '...' : item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════

const AdminModeracionPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('fotos');
  const [fotos, setFotos] = useState<FotoModeracion[]>([]);
  const [reportesFotos, setReportesFotos] = useState<ReporteFoto[]>([]);
  const [reportesUsuarios, setReportesUsuarios] = useState<ReporteUsuario[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Summary stats
  const [stats, setStats] = useState({ fotosPendientes: 0, reportesFotos: 0, reportesUsuarios: 0, usuariosSuspendidos: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant: 'danger' | 'success' | 'primary';
    requireMotivo: boolean;
    onConfirm: (motivo?: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    confirmVariant: 'danger',
    requireMotivo: false,
    onConfirm: () => {},
  });

  // Reports filter
  const [reportFilter, setReportFilter] = useState<'PENDIENTE' | 'ALL'>('PENDIENTE');

  // Usuarios tab state
  const [userSearch, setUserSearch] = useState('');
  const [userEstadoFilter, setUserEstadoFilter] = useState<string>('');

  // Load summary stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const [fotosData, reportesFotosData, reportesUsuariosData, suspendidosData] = await Promise.all([
        adminService.getFotosModeracion(),
        adminService.getReportesFotos('PENDIENTE'),
        adminService.getReportesUsuarios('PENDIENTE'),
        adminService.getUsuarios('', 'SUSPENDIDO'),
      ]);
      setStats({
        fotosPendientes: fotosData.length,
        reportesFotos: reportesFotosData.length,
        reportesUsuarios: reportesUsuariosData.length,
        usuariosSuspendidos: suspendidosData.length,
      });
    } catch {
      // silently fail stats
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, reportFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'fotos') {
        const data = await adminService.getFotosModeracion();
        setFotos(data);
      } else if (activeTab === 'reportes-fotos') {
        const estado = reportFilter === 'ALL' ? undefined : 'PENDIENTE';
        const data = await adminService.getReportesFotos(estado);
        setReportesFotos(data);
      } else if (activeTab === 'reportes-usuarios') {
        const estado = reportFilter === 'ALL' ? undefined : 'PENDIENTE';
        const data = await adminService.getReportesUsuarios(estado);
        setReportesUsuarios(data);
      } else if (activeTab === 'usuarios') {
        const data = await adminService.getUsuarios(userSearch || undefined, userEstadoFilter || undefined);
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (opts: Omit<typeof confirmModal, 'isOpen'>) => {
    setConfirmModal({ ...opts, isOpen: true });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // ========== Fotos ==========
  const handleAprobarFoto = async (id: string) => {
    setActionLoading(id);
    try {
      await adminService.aprobarFoto(id);
      setFotos(prev => prev.filter(f => f.id !== id));
      setStats(prev => ({ ...prev, fotosPendientes: Math.max(0, prev.fotosPendientes - 1) }));
      toast.success('Foto aprobada');
    } catch {
      toast.error('Error al aprobar foto');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEliminarFoto = (id: string) => {
    openConfirm({
      title: 'Eliminar Foto',
      message: '¿Estás seguro de que quieres eliminar esta foto? Se notificará al usuario.',
      confirmLabel: 'Eliminar',
      confirmVariant: 'danger',
      requireMotivo: true,
      onConfirm: async (motivo?: string) => {
        if (!motivo) return;
        setActionLoading(id);
        closeConfirm();
        try {
          await adminService.eliminarFoto(id, motivo);
          setFotos(prev => prev.filter(f => f.id !== id));
          setStats(prev => ({ ...prev, fotosPendientes: Math.max(0, prev.fotosPendientes - 1) }));
          toast.success('Foto eliminada');
        } catch {
          toast.error('Error al eliminar foto');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // ========== Reportes Fotos ==========
  const handleResolverReporteFoto = (id: string, accion: string) => {
    if (accion === 'ELIMINAR_FOTO') {
      openConfirm({
        title: 'Eliminar Foto Reportada',
        message: '¿Estás seguro? La foto reportada será eliminada permanentemente.',
        confirmLabel: 'Eliminar foto',
        confirmVariant: 'danger',
        requireMotivo: false,
        onConfirm: async () => {
          setActionLoading(id);
          closeConfirm();
          try {
            await adminService.resolverReporteFoto(id, 'ELIMINAR_FOTO');
            setReportesFotos(prev => prev.filter(r => r.id !== id));
            setStats(prev => ({ ...prev, reportesFotos: Math.max(0, prev.reportesFotos - 1) }));
            toast.success('Foto eliminada y reporte resuelto');
          } catch {
            toast.error('Error al resolver reporte');
          } finally {
            setActionLoading(null);
          }
        },
      });
    } else {
      resolveReporteFotoIgnorar(id);
    }
  };

  const resolveReporteFotoIgnorar = async (id: string) => {
    setActionLoading(id);
    try {
      await adminService.resolverReporteFoto(id, 'IGNORAR');
      setReportesFotos(prev => prev.filter(r => r.id !== id));
      setStats(prev => ({ ...prev, reportesFotos: Math.max(0, prev.reportesFotos - 1) }));
      toast.success('Reporte ignorado');
    } catch {
      toast.error('Error al ignorar reporte');
    } finally {
      setActionLoading(null);
    }
  };

  // ========== Reportes Usuarios ==========
  const handleResolverReporteUsuario = (id: string, accion: string) => {
    if (accion === 'SUSPENDER') {
      openConfirm({
        title: 'Suspender Usuario',
        message: 'El usuario reportado será suspendido y no podrá acceder a la plataforma.',
        confirmLabel: 'Suspender',
        confirmVariant: 'danger',
        requireMotivo: false,
        onConfirm: async () => {
          setActionLoading(id);
          closeConfirm();
          try {
            await adminService.resolverReporteUsuario(id, 'SUSPENDER');
            setReportesUsuarios(prev => prev.filter(r => r.id !== id));
            setStats(prev => ({
              ...prev,
              reportesUsuarios: Math.max(0, prev.reportesUsuarios - 1),
              usuariosSuspendidos: prev.usuariosSuspendidos + 1,
            }));
            toast.success('Usuario suspendido y reporte resuelto');
          } catch {
            toast.error('Error al suspender usuario');
          } finally {
            setActionLoading(null);
          }
        },
      });
    } else {
      resolveReporteUsuarioIgnorar(id);
    }
  };

  const resolveReporteUsuarioIgnorar = async (id: string) => {
    setActionLoading(id);
    try {
      await adminService.resolverReporteUsuario(id, 'IGNORAR');
      setReportesUsuarios(prev => prev.filter(r => r.id !== id));
      setStats(prev => ({ ...prev, reportesUsuarios: Math.max(0, prev.reportesUsuarios - 1) }));
      toast.success('Reporte ignorado');
    } catch {
      toast.error('Error al ignorar reporte');
    } finally {
      setActionLoading(null);
    }
  };

  // ========== Usuarios ==========
  const handleSuspenderUsuario = (usuario: UsuarioAdmin) => {
    openConfirm({
      title: 'Suspender Usuario',
      message: `¿Estás seguro de que quieres suspender a ${usuario.nombre} ${usuario.apellido}? No podrá acceder a la plataforma.`,
      confirmLabel: 'Suspender',
      confirmVariant: 'danger',
      requireMotivo: true,
      onConfirm: async (motivo?: string) => {
        if (!motivo) return;
        setActionLoading(usuario.id);
        closeConfirm();
        try {
          await adminService.suspenderUsuario(usuario.id, motivo);
          setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, estado: 'SUSPENDIDO' } : u));
          setStats(prev => ({ ...prev, usuariosSuspendidos: prev.usuariosSuspendidos + 1 }));
          toast.success(`${usuario.nombre} ${usuario.apellido} suspendido`);
        } catch {
          toast.error('Error al suspender usuario');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleActivarUsuario = (usuario: UsuarioAdmin) => {
    openConfirm({
      title: 'Reactivar Usuario',
      message: `¿Quieres reactivar la cuenta de ${usuario.nombre} ${usuario.apellido}?`,
      confirmLabel: 'Reactivar',
      confirmVariant: 'success',
      requireMotivo: false,
      onConfirm: async () => {
        setActionLoading(usuario.id);
        closeConfirm();
        try {
          await adminService.activarUsuario(usuario.id);
          setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, estado: 'ACTIVO' } : u));
          setStats(prev => ({ ...prev, usuariosSuspendidos: Math.max(0, prev.usuariosSuspendidos - 1) }));
          toast.success(`${usuario.nombre} ${usuario.apellido} reactivado`);
        } catch {
          toast.error('Error al reactivar usuario');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleSearchUsuarios = useCallback(() => {
    if (activeTab === 'usuarios') {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userSearch, userEstadoFilter]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'fotos', label: 'Fotos Pendientes', icon: <Image className="w-4 h-4" />, count: stats.fotosPendientes },
    { key: 'reportes-fotos', label: 'Reportes Fotos', icon: <Flag className="w-4 h-4" />, count: stats.reportesFotos },
    { key: 'reportes-usuarios', label: 'Reportes Usuarios', icon: <AlertTriangle className="w-4 h-4" />, count: stats.reportesUsuarios },
    { key: 'usuarios', label: 'Gestión de Usuarios', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Moderación de Contenido</h1>
          <p className="text-sm sm:text-base text-light-secondary mt-1 sm:mt-2">
            Revisa fotos pendientes, reportes y gestiona usuarios
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { loadStats(); loadData(); }}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Actualizar
        </Button>
      </div>

      {/* Summary stats */}
      <SummaryStats stats={stats} loading={statsLoading} />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
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
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary-500/30 text-primary-300 font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports filter toggle (for reports tabs) */}
      {(activeTab === 'reportes-fotos' || activeTab === 'reportes-usuarios') && (
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-light-secondary" />
          <span className="text-sm text-light-secondary">Mostrar:</span>
          <button
            onClick={() => setReportFilter('PENDIENTE')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              reportFilter === 'PENDIENTE'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'bg-dark-card text-light-secondary border border-dark-border hover:bg-dark-hover'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setReportFilter('ALL')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              reportFilter === 'ALL'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'bg-dark-card text-light-secondary border border-dark-border hover:bg-dark-hover'
            }`}
          >
            Todos
          </button>
        </div>
      )}

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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        loading={actionLoading !== null}
        requireMotivo={confirmModal.requireMotivo}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Cargando..." />
        </div>
      ) : (
        <>
          {activeTab === 'fotos' && (
            <FotosTab
              fotos={fotos}
              actionLoading={actionLoading}
              onAprobar={handleAprobarFoto}
              onEliminar={handleEliminarFoto}
              onPreview={setPreviewUrl}
            />
          )}
          {activeTab === 'reportes-fotos' && (
            <ReportesFotosTab
              reportes={reportesFotos}
              actionLoading={actionLoading}
              onResolver={handleResolverReporteFoto}
              onPreview={setPreviewUrl}
              showResolved={reportFilter === 'ALL'}
            />
          )}
          {activeTab === 'reportes-usuarios' && (
            <ReportesUsuariosTab
              reportes={reportesUsuarios}
              actionLoading={actionLoading}
              onResolver={handleResolverReporteUsuario}
              showResolved={reportFilter === 'ALL'}
            />
          )}
          {activeTab === 'usuarios' && (
            <UsuariosTab
              usuarios={usuarios}
              actionLoading={actionLoading}
              search={userSearch}
              estadoFilter={userEstadoFilter}
              onSearchChange={setUserSearch}
              onEstadoFilterChange={setUserEstadoFilter}
              onSearch={handleSearchUsuarios}
              onSuspender={handleSuspenderUsuario}
              onActivar={handleActivarUsuario}
              onReload={loadData}
            />
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// TAB: FOTOS PENDIENTES
// ═══════════════════════════════════════

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
          <div className="text-center py-12 text-light-secondary">
            <Check className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-70" />
            <p className="font-medium">¡Todo al día!</p>
            <p className="text-sm mt-1">No hay fotos pendientes de moderación</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className="border border-dark-border rounded-lg overflow-hidden hover:border-dark-hover transition-colors"
              >
                <div className="relative aspect-video bg-dark-surface">
                  <img
                    src={foto.urlThumbnail || foto.urlImagen}
                    alt={foto.descripcion || 'Foto'}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onPreview(foto.urlImagen)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="info">{foto.tipo}</Badge>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-light-secondary flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {foto.user.nombre} {foto.user.apellido}
                    </span>
                  </div>
                  {foto.descripcion && (
                    <p className="text-xs text-light-secondary mb-2 line-clamp-2">{foto.descripcion}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-light-muted mb-3">
                    {foto.tournament && (
                      <span className="truncate">📍 {foto.tournament.nombre}</span>
                    )}
                    <span className="ml-auto">{new Date(foto.createdAt).toLocaleDateString()}</span>
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

// ═══════════════════════════════════════
// TAB: REPORTES DE FOTOS
// ═══════════════════════════════════════

function ReportesFotosTab({
  reportes,
  actionLoading,
  onResolver,
  onPreview,
  showResolved,
}: {
  reportes: ReporteFoto[];
  actionLoading: string | null;
  onResolver: (id: string, accion: string) => void;
  onPreview: (url: string) => void;
  showResolved: boolean;
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
          <div className="text-center py-12 text-light-secondary">
            <Check className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-70" />
            <p className="font-medium">Sin reportes</p>
            <p className="text-sm mt-1">
              {showResolved ? 'No hay reportes registrados' : 'No hay reportes de fotos pendientes'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportes.map((reporte) => {
              const isResolved = reporte.estado !== 'PENDIENTE';
              return (
                <div
                  key={reporte.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isResolved
                      ? 'border-dark-border/50 bg-dark-surface/30 opacity-70'
                      : 'border-dark-border hover:bg-dark-hover'
                  }`}
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

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
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
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-light-muted">
                              {new Date(reporte.createdAt).toLocaleDateString()}
                            </span>
                            {isResolved && (
                              <Badge variant="success">Resuelto</Badge>
                            )}
                          </div>
                        </div>

                        {!isResolved && (
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
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════
// TAB: REPORTES DE USUARIOS
// ═══════════════════════════════════════

function ReportesUsuariosTab({
  reportes,
  actionLoading,
  onResolver,
  showResolved,
}: {
  reportes: ReporteUsuario[];
  actionLoading: string | null;
  onResolver: (id: string, accion: string) => void;
  showResolved: boolean;
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
          <div className="text-center py-12 text-light-secondary">
            <Shield className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-70" />
            <p className="font-medium">Sin reportes</p>
            <p className="text-sm mt-1">
              {showResolved ? 'No hay reportes registrados' : 'No hay reportes de usuarios pendientes'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportes.map((reporte) => {
              const isResolved = reporte.estado !== 'PENDIENTE';
              return (
                <div
                  key={reporte.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isResolved
                      ? 'border-dark-border/50 bg-dark-surface/30 opacity-70'
                      : 'border-dark-border hover:bg-dark-hover'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 p-2 bg-dark-surface rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-light-secondary">Reportado por</p>
                            <p className="text-sm font-medium truncate">
                              {reporte.reportador.nombre} {reporte.reportador.apellido}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-red-900/20 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-light-secondary">Usuario reportado</p>
                            <p className="text-sm font-medium truncate">
                              {reporte.reportado.nombre} {reporte.reportado.apellido}
                            </p>
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
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-light-muted">
                            {new Date(reporte.createdAt).toLocaleDateString()}
                          </span>
                          {isResolved && (
                            <Badge variant="success">Resuelto</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isResolved && (
                      <div className="flex gap-2 items-start flex-shrink-0">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onResolver(reporte.id, 'SUSPENDER')}
                          loading={actionLoading === reporte.id}
                          disabled={actionLoading !== null}
                        >
                          <UserX className="h-4 w-4 mr-1" />
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
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════
// TAB: GESTIÓN DE USUARIOS
// ═══════════════════════════════════════

const ESTADO_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Activo', value: 'ACTIVO' },
  { label: 'Suspendido', value: 'SUSPENDIDO' },
  { label: 'No Verificado', value: 'NO_VERIFICADO' },
  { label: 'Inactivo', value: 'INACTIVO' },
];

const estadoBadge: Record<string, { variant: 'success' | 'danger' | 'warning' | 'info'; label: string }> = {
  ACTIVO: { variant: 'success', label: 'Activo' },
  SUSPENDIDO: { variant: 'danger', label: 'Suspendido' },
  NO_VERIFICADO: { variant: 'warning', label: 'No Verificado' },
  INACTIVO: { variant: 'info', label: 'Inactivo' },
};

function UsuariosTab({
  usuarios,
  actionLoading,
  search,
  estadoFilter,
  onSearchChange,
  onEstadoFilterChange,
  onSearch,
  onSuspender,
  onActivar,
  onReload,
}: {
  usuarios: UsuarioAdmin[];
  actionLoading: string | null;
  search: string;
  estadoFilter: string;
  onSearchChange: (val: string) => void;
  onEstadoFilterChange: (val: string) => void;
  onSearch: () => void;
  onSuspender: (usuario: UsuarioAdmin) => void;
  onActivar: (usuario: UsuarioAdmin) => void;
  onReload: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
      onReload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gestión de Usuarios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search / Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por nombre, email o documento..."
              className="w-full h-10 rounded-md border bg-dark-input border-dark-border text-light-text pl-10 pr-3 py-2 text-sm placeholder:text-light-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            {ESTADO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onEstadoFilterChange(opt.value);
                  // Trigger reload after state change
                  setTimeout(() => onReload(), 50);
                }}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
                  estadoFilter === opt.value
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                    : 'bg-dark-surface text-light-secondary border border-dark-border hover:bg-dark-hover'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { onSearch(); onReload(); }}
            className="sm:w-auto"
          >
            <Search className="w-4 h-4 mr-1" />
            Buscar
          </Button>
        </div>

        {/* Users table */}
        {usuarios.length === 0 ? (
          <div className="text-center py-12 text-light-secondary">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Sin resultados</p>
            <p className="text-sm mt-1">Usa el buscador para encontrar usuarios</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-light-muted mb-3">{usuarios.length} usuario(s) encontrados</p>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {usuarios.map((u) => {
                const badge = estadoBadge[u.estado] || { variant: 'info' as const, label: u.estado };
                return (
                  <div key={u.id} className="border border-dark-border rounded-lg p-3 bg-dark-surface/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{u.nombre} {u.apellido}</p>
                        <p className="text-xs text-light-secondary">{u.email}</p>
                        <p className="text-xs text-light-muted">Doc: {u.documento}</p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-light-muted">
                        {u.esPremium && <Badge variant="warning">Premium</Badge>}
                        {u.ciudad && <span>{u.ciudad}</span>}
                      </div>
                      <div className="flex gap-2">
                        {u.estado === 'SUSPENDIDO' ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => onActivar(u)}
                            loading={actionLoading === u.id}
                            disabled={actionLoading !== null}
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            Reactivar
                          </Button>
                        ) : u.estado === 'ACTIVO' ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onSuspender(u)}
                            loading={actionLoading === u.id}
                            disabled={actionLoading !== null}
                          >
                            <UserX className="h-3.5 w-3.5 mr-1" />
                            Suspender
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-left">
                    <th className="pb-3 font-medium text-light-secondary">Usuario</th>
                    <th className="pb-3 font-medium text-light-secondary">Documento</th>
                    <th className="pb-3 font-medium text-light-secondary">Ciudad</th>
                    <th className="pb-3 font-medium text-light-secondary">Estado</th>
                    <th className="pb-3 font-medium text-light-secondary">Premium</th>
                    <th className="pb-3 font-medium text-light-secondary">Registro</th>
                    <th className="pb-3 font-medium text-light-secondary text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {usuarios.map((u) => {
                    const badge = estadoBadge[u.estado] || { variant: 'info' as const, label: u.estado };
                    return (
                      <tr key={u.id} className="hover:bg-dark-hover/50 transition-colors">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{u.nombre} {u.apellido}</p>
                            <p className="text-xs text-light-secondary">{u.email}</p>
                          </div>
                        </td>
                        <td className="py-3 text-light-secondary font-mono text-xs">{u.documento}</td>
                        <td className="py-3 text-light-secondary">{u.ciudad || '—'}</td>
                        <td className="py-3">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="py-3">
                          {u.esPremium ? (
                            <span className="text-yellow-400 text-xs font-medium">⭐ Premium</span>
                          ) : (
                            <span className="text-light-muted text-xs">Free</span>
                          )}
                        </td>
                        <td className="py-3 text-light-muted text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          {u.estado === 'SUSPENDIDO' ? (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => onActivar(u)}
                              loading={actionLoading === u.id}
                              disabled={actionLoading !== null}
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1" />
                              Reactivar
                            </Button>
                          ) : u.estado === 'ACTIVO' ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => onSuspender(u)}
                              loading={actionLoading === u.id}
                              disabled={actionLoading !== null}
                            >
                              <UserX className="h-3.5 w-3.5 mr-1" />
                              Suspender
                            </Button>
                          ) : (
                            <span className="text-xs text-light-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminModeracionPage;
