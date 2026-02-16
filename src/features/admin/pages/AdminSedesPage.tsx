import { useState, useEffect, useCallback } from 'react';
import { sedesService } from '@/services/sedesService';
import {
  Loading,
  Card,
  CardContent,
  Button,
  Input,
  Modal,
  Badge,
  Select,
} from '@/components/ui';
import type { Sede, SedeCancha, CreateSedeDto, CreateSedeCanchaDto } from '@/types';
import { TipoCancha } from '@/types';
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  RotateCcw,
  Search,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════
// COMPONENTE: Formulario de Sede
// ═══════════════════════════════════════════
interface SedeFormProps {
  sede?: Sede | null;
  onSubmit: (data: CreateSedeDto) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const SedeForm: React.FC<SedeFormProps> = ({ sede, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<CreateSedeDto>({
    nombre: '',
    ciudad: '',
    direccion: '',
    mapsUrl: '',
    telefono: '',
    logoUrl: '',
    imagenFondo: '',
    horarioAtencion: '',
    contactoEncargado: '',
    canvasWidth: 800,
    canvasHeight: 600,
  });

  // Reset form when sede prop changes
  useEffect(() => {
    if (sede) {
      setFormData({
        nombre: sede.nombre || '',
        ciudad: sede.ciudad || '',
        direccion: sede.direccion || '',
        mapsUrl: sede.mapsUrl || '',
        telefono: sede.telefono || '',
        logoUrl: sede.logoUrl || '',
        imagenFondo: sede.imagenFondo || '',
        horarioAtencion: sede.horarioAtencion || '',
        contactoEncargado: sede.contactoEncargado || '',
        canvasWidth: sede.canvasWidth || 800,
        canvasHeight: sede.canvasHeight || 600,
      });
    } else {
      setFormData({
        nombre: '',
        ciudad: '',
        direccion: '',
        mapsUrl: '',
        telefono: '',
        logoUrl: '',
        imagenFondo: '',
        horarioAtencion: '',
        contactoEncargado: '',
        canvasWidth: 800,
        canvasHeight: 600,
      });
    }
  }, [sede]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre de la Sede *"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Club Deportivo Asuncion"
          required
        />
        <Input
          label="Ciudad *"
          value={formData.ciudad}
          onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
          placeholder="Ciudad del Este"
          required
        />
      </div>

      <Input
        label="Direccion"
        value={formData.direccion || ''}
        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
        placeholder="Av. Principal 123"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Telefono"
          value={formData.telefono || ''}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          placeholder="+595 981 123456"
        />
        <Input
          label="Contacto Encargado"
          value={formData.contactoEncargado || ''}
          onChange={(e) => setFormData({ ...formData, contactoEncargado: e.target.value })}
          placeholder="Juan Perez"
        />
      </div>

      <Input
        label="URL Google Maps"
        type="url"
        value={formData.mapsUrl || ''}
        onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
        placeholder="https://maps.google.com/..."
      />

      <Input
        label="Horario de Atencion"
        value={formData.horarioAtencion || ''}
        onChange={(e) => setFormData({ ...formData, horarioAtencion: e.target.value })}
        placeholder="Lun-Vie 07:00-22:00, Sab-Dom 08:00-20:00"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="URL Logo"
          type="url"
          value={formData.logoUrl || ''}
          onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
          placeholder="https://..."
        />
        <Input
          label="URL Imagen de Fondo"
          type="url"
          value={formData.imagenFondo || ''}
          onChange={(e) => setFormData({ ...formData, imagenFondo: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={loading} className="flex-1">
          {sede ? 'Actualizar Sede' : 'Crear Sede'}
        </Button>
      </div>
    </form>
  );
};

// ═══════════════════════════════════════════
// COMPONENTE: Formulario de Cancha
// ═══════════════════════════════════════════
interface CanchaFormProps {
  cancha?: SedeCancha | null;
  onSubmit: (data: CreateSedeCanchaDto) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const CanchaForm: React.FC<CanchaFormProps> = ({ cancha, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<CreateSedeCanchaDto>({
    nombre: '',
    tipo: TipoCancha.OUTDOOR,
    posicionX: 0,
    posicionY: 0,
    ancho: 100,
    alto: 150,
    rotacion: 0,
    imagenUrl: '',
  });

  // Reset form when cancha prop changes
  useEffect(() => {
    if (cancha) {
      setFormData({
        nombre: cancha.nombre || '',
        tipo: cancha.tipo || TipoCancha.OUTDOOR,
        posicionX: cancha.posicionX || 0,
        posicionY: cancha.posicionY || 0,
        ancho: cancha.ancho || 100,
        alto: cancha.alto || 150,
        rotacion: cancha.rotacion || 0,
        imagenUrl: cancha.imagenUrl || '',
      });
    } else {
      setFormData({
        nombre: '',
        tipo: TipoCancha.OUTDOOR,
        posicionX: 0,
        posicionY: 0,
        ancho: 100,
        alto: 150,
        rotacion: 0,
        imagenUrl: '',
      });
    }
  }, [cancha]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre de la Cancha *"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Cancha 1"
          required
        />
        <Select
          label="Tipo de Cancha"
          value={formData.tipo || TipoCancha.OUTDOOR}
          onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoCancha })}
        >
          <option value={TipoCancha.INDOOR}>Indoor (Techada)</option>
          <option value={TipoCancha.OUTDOOR}>Outdoor (Abierta)</option>
          <option value={TipoCancha.SEMI_TECHADA}>Semi-Techada</option>
        </Select>
      </div>

      <Input
        label="URL Imagen"
        type="url"
        value={formData.imagenUrl || ''}
        onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
        placeholder="https://..."
      />

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={loading} className="flex-1">
          {cancha ? 'Actualizar Cancha' : 'Agregar Cancha'}
        </Button>
      </div>
    </form>
  );
};

// ═══════════════════════════════════════════
// COMPONENTE: Card de Cancha
// ═══════════════════════════════════════════
interface CanchaCardProps {
  cancha: SedeCancha;
  onEdit: (cancha: SedeCancha) => void;
  onDelete: (canchaId: string) => void;
  deleting?: boolean;
}

const CanchaCard: React.FC<CanchaCardProps> = ({ cancha, onEdit, onDelete, deleting }) => {
  const tipoBadge: Record<string, string> = {
    INDOOR: 'bg-blue-900/30 text-blue-400',
    OUTDOOR: 'bg-green-900/30 text-green-400',
    SEMI_TECHADA: 'bg-yellow-900/30 text-yellow-400',
  };

  const tipoLabel: Record<string, string> = {
    INDOOR: 'Indoor',
    OUTDOOR: 'Outdoor',
    SEMI_TECHADA: 'Semi-Techada',
  };

  return (
    <div className={`flex items-center justify-between p-3 border border-dark-border rounded-lg hover:bg-dark-hover ${!cancha.activa ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
          <LayoutGrid className="h-5 w-5 text-primary-500" />
        </div>
        <div>
          <p className="font-medium">{cancha.nombre}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full ${tipoBadge[cancha.tipo] || 'bg-dark-surface text-light-text'}`}>
              {tipoLabel[cancha.tipo] || cancha.tipo}
            </span>
            {!cancha.activa && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400">
                Inactiva
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(cancha)}
          className="p-2 text-light-secondary hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
          title="Editar cancha"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(cancha.id)}
          disabled={deleting}
          className="p-2 text-light-secondary hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
          title={cancha.activa ? 'Desactivar cancha' : 'Cancha ya inactiva'}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// COMPONENTE: Card de Sede (expandible)
// ═══════════════════════════════════════════
interface SedeCardProps {
  sede: Sede;
  onEdit: (sede: Sede) => void;
  onDelete: (sedeId: string) => void;
  onReactivar: (sedeId: string) => void;
}

const SedeCard: React.FC<SedeCardProps> = ({ sede, onEdit, onDelete, onReactivar }) => {
  const [expanded, setExpanded] = useState(false);
  const [canchas, setCanchas] = useState<SedeCancha[]>(sede.canchas || []);
  const [loadingCanchas, setLoadingCanchas] = useState(false);
  const [showCanchaForm, setShowCanchaForm] = useState(false);
  const [editingCancha, setEditingCancha] = useState<SedeCancha | null>(null);
  const [canchaLoading, setCanchaLoading] = useState(false);
  const [deletingCanchaId, setDeletingCanchaId] = useState<string | null>(null);
  const [showDeleteCanchaModal, setShowDeleteCanchaModal] = useState(false);
  const [canchaToDelete, setCanchaToDelete] = useState<string | null>(null);

  const loadCanchas = useCallback(async () => {
    setLoadingCanchas(true);
    try {
      const data = await sedesService.getCanchas(sede.id);
      setCanchas(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al cargar canchas');
    } finally {
      setLoadingCanchas(false);
    }
  }, [sede.id]);

  const handleExpand = () => {
    if (!expanded && canchas.length === 0) {
      loadCanchas();
    }
    setExpanded(!expanded);
  };

  const handleCreateCancha = async (data: CreateSedeCanchaDto) => {
    setCanchaLoading(true);
    try {
      await sedesService.createCancha(sede.id, data);
      await loadCanchas();
      setShowCanchaForm(false);
      toast.success('Cancha creada exitosamente');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al crear cancha');
    } finally {
      setCanchaLoading(false);
    }
  };

  const handleUpdateCancha = async (data: CreateSedeCanchaDto) => {
    if (!editingCancha) return;
    setCanchaLoading(true);
    try {
      await sedesService.updateCancha(sede.id, editingCancha.id, data);
      await loadCanchas();
      setEditingCancha(null);
      toast.success('Cancha actualizada exitosamente');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al actualizar cancha');
    } finally {
      setCanchaLoading(false);
    }
  };

  const handleDeleteCancha = async () => {
    if (!canchaToDelete) return;
    setDeletingCanchaId(canchaToDelete);
    try {
      await sedesService.deleteCancha(sede.id, canchaToDelete);
      setCanchas((prev) => prev.map((c) =>
        c.id === canchaToDelete ? { ...c, activa: false } : c,
      ));
      toast.success('Cancha desactivada exitosamente');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al desactivar cancha');
    } finally {
      setDeletingCanchaId(null);
      setShowDeleteCanchaModal(false);
      setCanchaToDelete(null);
    }
  };

  const openDeleteCanchaModal = (canchaId: string) => {
    setCanchaToDelete(canchaId);
    setShowDeleteCanchaModal(true);
  };

  return (
    <>
      <Card>
        <div className="p-4">
          {/* Header de la sede */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {sede.logoUrl ? (
                <img src={sede.logoUrl} alt={sede.nombre} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-500 font-bold text-lg">
                  {sede.nombre.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{sede.nombre}</h3>
                  <Badge variant={sede.activo ? 'success' : 'danger'}>
                    {sede.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-light-secondary mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {sede.ciudad}
                    {sede.direccion && ` - ${sede.direccion}`}
                  </span>
                  {sede.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {sede.telefono}
                    </span>
                  )}
                </div>
                {sede.horarioAtencion && (
                  <p className="text-xs text-light-secondary mt-1">{sede.horarioAtencion}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onEdit(sede)}
                className="p-2 text-light-secondary hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                title="Editar sede"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              {sede.activo ? (
                <button
                  onClick={() => onDelete(sede.id)}
                  className="p-2 text-light-secondary hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Desactivar sede"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => onReactivar(sede.id)}
                  className="p-2 text-light-secondary hover:text-green-400 hover:bg-green-900/30 rounded-lg transition-colors"
                  title="Reactivar sede"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Boton expandir canchas */}
          <button
            onClick={handleExpand}
            className="mt-3 flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400 font-medium"
          >
            <LayoutGrid className="h-4 w-4" />
            Canchas ({canchas.filter((c) => c.activa !== false).length || sede.canchas?.filter((c) => c.activa !== false).length || 0})
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Lista de canchas (expandida) */}
          {expanded && (
            <div className="mt-3 border-t border-dark-border pt-3 space-y-3">
              {loadingCanchas ? (
                <Loading size="sm" text="Cargando canchas..." />
              ) : (
                <>
                  {canchas.length === 0 && !showCanchaForm && (
                    <p className="text-sm text-light-secondary text-center py-4">
                      No hay canchas registradas en esta sede
                    </p>
                  )}

                  {canchas.map((cancha) => (
                    <CanchaCard
                      key={cancha.id}
                      cancha={cancha}
                      onEdit={(c) => {
                        setEditingCancha(c);
                        setShowCanchaForm(false);
                      }}
                      onDelete={openDeleteCanchaModal}
                      deleting={deletingCanchaId === cancha.id}
                    />
                  ))}

                  {/* Formulario de nueva cancha */}
                  {showCanchaForm && (
                    <div className="border border-dark-border rounded-lg p-4 bg-dark-surface">
                      <h4 className="font-medium mb-3">Nueva Cancha</h4>
                      <CanchaForm
                        onSubmit={handleCreateCancha}
                        onCancel={() => setShowCanchaForm(false)}
                        loading={canchaLoading}
                      />
                    </div>
                  )}

                  {/* Formulario de editar cancha */}
                  {editingCancha && (
                    <div className="border border-dark-border rounded-lg p-4 bg-blue-900/30">
                      <h4 className="font-medium mb-3">Editar: {editingCancha.nombre}</h4>
                      <CanchaForm
                        cancha={editingCancha}
                        onSubmit={handleUpdateCancha}
                        onCancel={() => setEditingCancha(null)}
                        loading={canchaLoading}
                      />
                    </div>
                  )}

                  {!showCanchaForm && !editingCancha && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCanchaForm(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Cancha
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Delete Cancha Confirmation Modal */}
      <Modal
        isOpen={showDeleteCanchaModal}
        onClose={() => { setShowDeleteCanchaModal(false); setCanchaToDelete(null); }}
        title="Desactivar cancha"
        size="sm"
      >
        <p className="text-sm text-light-secondary mb-4">
          Esta accion desactivara la cancha. Podras reactivarla editandola mas tarde. Las canchas con partidos programados no pueden desactivarse.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowDeleteCanchaModal(false); setCanchaToDelete(null); }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDeleteCancha}
            loading={!!deletingCanchaId}
            className="bg-red-500 hover:bg-red-600"
          >
            Desactivar
          </Button>
        </div>
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════
// PAGINA PRINCIPAL: Admin Sedes
// ═══════════════════════════════════════════
const AdminSedesPage = () => {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSedeForm, setShowSedeForm] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filterCiudad, setFilterCiudad] = useState('');
  const [filterNombre, setFilterNombre] = useState('');
  const [filterActivo, setFilterActivo] = useState<'all' | 'active' | 'inactive'>('all');

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sedeToDelete, setSedeToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    setLoading(true);
    try {
      const data = await sedesService.getAll();
      setSedes(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al cargar sedes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSede = async (data: CreateSedeDto) => {
    setFormLoading(true);
    try {
      await sedesService.create(data);
      await loadSedes();
      setShowSedeForm(false);
      toast.success('Sede creada exitosamente');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al crear sede');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateSede = async (data: CreateSedeDto) => {
    if (!editingSede) return;
    setFormLoading(true);
    try {
      await sedesService.update(editingSede.id, data);
      await loadSedes();
      setEditingSede(null);
      toast.success('Sede actualizada exitosamente');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al actualizar sede');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (sedeId: string) => {
    setSedeToDelete(sedeId);
    setShowDeleteModal(true);
  };

  const handleDeleteSede = async () => {
    if (!sedeToDelete) return;
    setDeleteLoading(true);
    try {
      await sedesService.delete(sedeToDelete);
      // Update the sede to inactive in local state (soft delete)
      setSedes((prev) => prev.map((s) =>
        s.id === sedeToDelete ? { ...s, activo: false } : s,
      ));
      toast.success('Sede desactivada exitosamente');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al desactivar sede');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSedeToDelete(null);
    }
  };

  const handleReactivarSede = async (sedeId: string) => {
    try {
      await sedesService.reactivar(sedeId);
      setSedes((prev) => prev.map((s) =>
        s.id === sedeId ? { ...s, activo: true } : s,
      ));
      toast.success('Sede reactivada exitosamente');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al reactivar sede');
    }
  };

  // Client-side filtering
  const filteredSedes = sedes.filter((s) => {
    if (filterCiudad && !s.ciudad.toLowerCase().includes(filterCiudad.toLowerCase())) {
      return false;
    }
    if (filterNombre && !s.nombre.toLowerCase().includes(filterNombre.toLowerCase())) {
      return false;
    }
    if (filterActivo === 'active' && !s.activo) return false;
    if (filterActivo === 'inactive' && s.activo) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando sedes..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Gestion de Sedes</h1>
          <p className="text-sm sm:text-base text-light-secondary mt-1 sm:mt-2">Administra sedes y canchas para los torneos</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setShowSedeForm(true);
            setEditingSede(null);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sede
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-secondary" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filterNombre}
            onChange={(e) => setFilterNombre(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder:text-light-muted text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <Input
          placeholder="Filtrar por ciudad..."
          value={filterCiudad}
          onChange={(e) => setFilterCiudad(e.target.value)}
        />
        <Select
          value={filterActivo}
          onChange={(e) => setFilterActivo(e.target.value as 'all' | 'active' | 'inactive')}
        >
          <option value="all">Todas</option>
          <option value="active">Solo activas</option>
          <option value="inactive">Solo inactivas</option>
        </Select>
      </div>

      {/* Modal crear/editar sede */}
      <Modal
        isOpen={showSedeForm || editingSede !== null}
        onClose={() => {
          setShowSedeForm(false);
          setEditingSede(null);
        }}
        title={editingSede ? `Editar: ${editingSede.nombre}` : 'Nueva Sede'}
      >
        <SedeForm
          sede={editingSede}
          onSubmit={editingSede ? handleUpdateSede : handleCreateSede}
          onCancel={() => {
            setShowSedeForm(false);
            setEditingSede(null);
          }}
          loading={formLoading}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSedeToDelete(null); }}
        title="Desactivar sede"
        size="sm"
      >
        <p className="text-sm text-light-secondary mb-4">
          Esta accion desactivara la sede. No se eliminara permanentemente y podras reactivarla despues. Las sedes con torneos activos no pueden desactivarse.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowDeleteModal(false); setSedeToDelete(null); }}
            disabled={deleteLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDeleteSede}
            loading={deleteLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            Desactivar
          </Button>
        </div>
      </Modal>

      {/* Lista de sedes */}
      {filteredSedes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-light-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-light-text mb-2">
              {filterCiudad || filterNombre ? 'No se encontraron sedes' : 'No hay sedes registradas'}
            </h3>
            <p className="text-light-secondary mb-4">
              {filterCiudad || filterNombre
                ? 'Intenta con otros filtros'
                : 'Crea la primera sede para empezar a gestionar canchas'}
            </p>
            {!filterCiudad && !filterNombre && (
              <Button variant="primary" onClick={() => setShowSedeForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Sede
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSedes.map((sede) => (
            <SedeCard
              key={sede.id}
              sede={sede}
              onEdit={(s) => {
                setEditingSede(s);
                setShowSedeForm(false);
              }}
              onDelete={openDeleteModal}
              onReactivar={handleReactivarSede}
            />
          ))}
        </div>
      )}

      {/* Resumen */}
      {sedes.length > 0 && (
        <div className="mt-6 text-sm text-light-secondary text-center">
          {sedes.filter((s) => s.activo).length} sede(s) activa(s) de {sedes.length} total &middot;{' '}
          {sedes.reduce((acc, s) => acc + (s.canchas?.filter((c) => c.activa !== false).length || 0), 0)} cancha(s) activa(s)
        </div>
      )}
    </div>
  );
};

export default AdminSedesPage;
