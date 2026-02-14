import { useState, useEffect, useRef } from 'react';
import { publicidadService, type Banner, type BannerStats } from '@/services/publicidadService';
import { Button, Card, CardContent } from '@/components/ui';
import {
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  BarChart2,
  Image,
  ExternalLink,
  MousePointer2,
  Eye,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ZONAS = [
  'HEADER',
  'SIDEBAR',
  'ENTRE_TORNEOS',
  'FOOTER',
  'HOME_HERO',
  'HOME_MEDIO',
  'TORNEO_DETALLE',
];

const ZONA_LABELS: Record<string, string> = {
  HEADER: 'Header',
  SIDEBAR: 'Sidebar',
  ENTRE_TORNEOS: 'Entre Torneos',
  FOOTER: 'Footer',
  HOME_HERO: 'Home Hero',
  HOME_MEDIO: 'Home Medio',
  TORNEO_DETALLE: 'Detalle Torneo',
};

const AdminPublicidadPage = () => {
  const [tab, setTab] = useState<'banners' | 'stats'>('banners');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState<BannerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    zona: 'HOME_HERO',
    linkUrl: '',
    activo: true,
    fechaInicio: '',
    fechaFin: '',
    orden: 0,
    anunciante: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (tab === 'stats') loadStats();
  }, [tab]);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await publicidadService.listarBanners();
      setBanners(data);
    } catch {
      toast.error('Error cargando banners');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await publicidadService.obtenerEstadisticas();
      setStats(data);
    } catch {
      toast.error('Error cargando estadísticas');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      zona: 'HOME_HERO',
      linkUrl: '',
      activo: true,
      fechaInicio: '',
      fechaFin: '',
      orden: 0,
      anunciante: '',
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditingBanner(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      titulo: banner.titulo,
      zona: banner.zona,
      linkUrl: banner.linkUrl || '',
      activo: banner.activo,
      fechaInicio: banner.fechaInicio ? banner.fechaInicio.substring(0, 10) : '',
      fechaFin: banner.fechaFin ? banner.fechaFin.substring(0, 10) : '',
      orden: banner.orden,
      anunciante: banner.anunciante || '',
    });
    setPreviewUrl(banner.imagenUrl);
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner && !selectedFile) {
      toast.error('Debes seleccionar una imagen');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('titulo', formData.titulo);
      fd.append('zona', formData.zona);
      if (formData.linkUrl) fd.append('linkUrl', formData.linkUrl);
      fd.append('activo', String(formData.activo));
      if (formData.fechaInicio) fd.append('fechaInicio', new Date(formData.fechaInicio).toISOString());
      if (formData.fechaFin) fd.append('fechaFin', new Date(formData.fechaFin).toISOString());
      fd.append('orden', String(formData.orden));
      if (formData.anunciante) fd.append('anunciante', formData.anunciante);
      if (selectedFile) fd.append('file', selectedFile);

      if (editingBanner) {
        await publicidadService.actualizarBanner(editingBanner.id, fd);
        toast.success('Banner actualizado');
      } else {
        await publicidadService.crearBanner(fd);
        toast.success('Banner creado');
      }

      resetForm();
      loadBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error guardando banner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (banner: Banner) => {
    try {
      await publicidadService.toggleActivo(banner.id);
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, activo: !b.activo } : b)),
      );
    } catch {
      toast.error('Error cambiando estado');
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`¿Eliminar banner "${banner.titulo}"?`)) return;
    try {
      await publicidadService.eliminarBanner(banner.id);
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      toast.success('Banner eliminado');
    } catch {
      toast.error('Error eliminando banner');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-light-text">Publicidad</h1>
        <Button variant="primary" onClick={openCreateForm}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Banner
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('banners')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'banners'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'
          }`}
        >
          <Image className="h-4 w-4 inline-block mr-1" />
          Banners
        </button>
        <button
          onClick={() => setTab('stats')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'stats'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'
          }`}
        >
          <BarChart2 className="h-4 w-4 inline-block mr-1" />
          Estadísticas
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-light-text">
                {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
              </h2>
              <button onClick={resetForm} className="text-light-muted hover:text-light-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-light-secondary mb-1">Título</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-light-text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-secondary mb-1">Zona</label>
                  <select
                    value={formData.zona}
                    onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-light-text"
                  >
                    {ZONAS.map((z) => (
                      <option key={z} value={z}>{ZONA_LABELS[z]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-secondary mb-1">Link URL (opcional)</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-light-text"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-secondary mb-1">Anunciante (opcional)</label>
                  <input
                    type="text"
                    value={formData.anunciante}
                    onChange={(e) => setFormData({ ...formData, anunciante: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-light-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-secondary mb-1">Fecha inicio (opcional)</label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-light-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-secondary mb-1">Fecha fin (opcional)</label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-light-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-secondary mb-1">Orden</label>
                  <input
                    type="number"
                    value={formData.orden}
                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-light-text"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="w-4 h-4 rounded border-dark-border"
                    />
                    <span className="text-sm text-light-secondary">Activo</span>
                  </label>
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-light-secondary mb-1">
                  Imagen {!editingBanner && '*'}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-light-secondary hover:bg-dark-hover transition-colors"
                  >
                    Seleccionar imagen
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile && (
                    <span className="text-sm text-light-muted">{selectedFile.name}</span>
                  )}
                </div>
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="mt-3 max-h-48 rounded-lg border border-dark-border" />
                )}
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="primary" loading={saving}>
                  {editingBanner ? 'Guardar cambios' : 'Crear banner'}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Banners Tab */}
      {tab === 'banners' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-light-muted">Cargando...</div>
          ) : banners.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Image className="h-12 w-12 mx-auto text-light-muted mb-3" />
                <p className="text-light-secondary">No hay banners creados</p>
                <p className="text-sm text-light-muted mt-1">Crea tu primer banner publicitario</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {banners.map((banner) => (
                <Card key={banner.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      {/* Preview */}
                      <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-dark-bg border border-dark-border">
                        {banner.imagenUrl ? (
                          <img src={banner.imagenUrl} alt={banner.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-light-muted">
                            <Image className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-light-text truncate">{banner.titulo}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            banner.activo ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                          }`}>
                            {banner.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-light-muted">
                          <span className="bg-dark-bg px-2 py-0.5 rounded">{ZONA_LABELS[banner.zona] || banner.zona}</span>
                          {banner.anunciante && <span>{banner.anunciante}</span>}
                          <span className="flex items-center gap-1">
                            <MousePointer2 className="h-3 w-3" />
                            {banner.clicks}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {banner.impresiones}
                          </span>
                          {banner.linkUrl && (
                            <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(banner)}
                          className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                          title={banner.activo ? 'Desactivar' : 'Activar'}
                        >
                          {banner.activo ? (
                            <ToggleRight className="h-5 w-5 text-green-400" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-light-muted" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditForm(banner)}
                          className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4 text-light-secondary" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner)}
                          className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && stats && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-primary-400">{stats.totalBanners}</p>
                <p className="text-xs text-light-muted">Total Banners</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-green-400">{stats.bannersActivos}</p>
                <p className="text-xs text-light-muted">Activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.totalClicks.toLocaleString()}</p>
                <p className="text-xs text-light-muted">Total Clicks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.ctr}%</p>
                <p className="text-xs text-light-muted">CTR General</p>
              </CardContent>
            </Card>
          </div>

          {/* Per-banner stats */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left px-4 py-3 text-light-muted font-medium">Banner</th>
                    <th className="text-center px-4 py-3 text-light-muted font-medium">Zona</th>
                    <th className="text-center px-4 py-3 text-light-muted font-medium">Clicks</th>
                    <th className="text-center px-4 py-3 text-light-muted font-medium">Impresiones</th>
                    <th className="text-center px-4 py-3 text-light-muted font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.banners.map((b) => (
                    <tr key={b.id} className="border-b border-dark-border/50 hover:bg-dark-hover">
                      <td className="px-4 py-3 text-light-text">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${b.activo ? 'bg-green-400' : 'bg-red-400'}`} />
                          {b.titulo}
                        </div>
                      </td>
                      <td className="text-center px-4 py-3 text-light-secondary">
                        <span className="bg-dark-bg px-2 py-0.5 rounded text-xs">{ZONA_LABELS[b.zona] || b.zona}</span>
                      </td>
                      <td className="text-center px-4 py-3 text-light-text">{b.clicks.toLocaleString()}</td>
                      <td className="text-center px-4 py-3 text-light-text">{b.impresiones.toLocaleString()}</td>
                      <td className="text-center px-4 py-3 text-primary-400 font-medium">{b.ctr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPublicidadPage;
