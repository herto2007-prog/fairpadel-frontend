import { useState, useEffect } from 'react';
import { circuitosService } from '@/services/circuitosService';
import {
  Loading,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
} from '@/components/ui';
import type {
  Circuito,
  CircuitoStanding,
  CreateCircuitoDto,
  Tournament,
} from '@/types';
import { CircuitoEstado } from '@/types';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  Trophy,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  BarChart3,
  Globe,
} from 'lucide-react';

// =============================================
// HELPER: Format date for display
// =============================================
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// =============================================
// HELPER: Badge variant for CircuitoEstado
// =============================================
const estadoBadgeVariant = (
  estado: CircuitoEstado
): 'success' | 'warning' | 'danger' | 'default' => {
  switch (estado) {
    case CircuitoEstado.ACTIVO:
      return 'success';
    case CircuitoEstado.FINALIZADO:
      return 'warning';
    case CircuitoEstado.CANCELADO:
      return 'danger';
    default:
      return 'default';
  }
};

// =============================================
// HELPER: Badge variant for Tournament estado
// =============================================
const torneoEstadoBadgeVariant = (
  estado: string
): 'success' | 'info' | 'warning' | 'danger' | 'default' => {
  switch (estado) {
    case 'PUBLICADO':
      return 'success';
    case 'EN_CURSO':
      return 'info';
    case 'FINALIZADO':
      return 'warning';
    case 'CANCELADO':
    case 'RECHAZADO':
      return 'danger';
    default:
      return 'default';
  }
};

// =============================================
// COMPONENT: Circuito Form (inline create/edit)
// =============================================
interface CircuitoFormProps {
  circuito?: Circuito | null;
  onSubmit: (data: CreateCircuitoDto) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const CircuitoForm: React.FC<CircuitoFormProps> = ({
  circuito,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [formData, setFormData] = useState<CreateCircuitoDto>({
    nombre: circuito?.nombre || '',
    descripcion: circuito?.descripcion || '',
    pais: circuito?.pais || 'Paraguay',
    region: circuito?.region || '',
    ciudad: circuito?.ciudad || '',
    temporada: circuito?.temporada || new Date().getFullYear().toString(),
    fechaInicio: circuito?.fechaInicio
      ? circuito.fechaInicio.substring(0, 10)
      : '',
    fechaFin: circuito?.fechaFin ? circuito.fechaFin.substring(0, 10) : '',
    logoUrl: circuito?.logoUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!formData.temporada.trim()) {
      toast.error('La temporada es obligatoria');
      return;
    }
    if (!formData.fechaInicio) {
      toast.error('La fecha de inicio es obligatoria');
      return;
    }
    if (!formData.fechaFin) {
      toast.error('La fecha de fin es obligatoria');
      return;
    }
    if (formData.fechaFin < formData.fechaInicio) {
      toast.error('La fecha de fin debe ser posterior a la de inicio');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Card className="border-primary-500/50">
      <CardHeader>
        <CardTitle className="text-lg">
          {circuito ? `Editar: ${circuito.nombre}` : 'Nuevo Circuito'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Ej: Circuito Nacional de Padel 2026"
              required
            />
            <Input
              label="Temporada *"
              value={formData.temporada}
              onChange={(e) =>
                setFormData({ ...formData, temporada: e.target.value })
              }
              placeholder="Ej: 2026"
              required
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-light-secondary mb-1">
              Descripcion
            </label>
            <textarea
              className="flex w-full rounded-md border bg-dark-input border-dark-border text-light-text px-3 py-2 text-sm ring-offset-dark-bg placeholder:text-light-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-y"
              value={formData.descripcion || ''}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              placeholder="Descripcion del circuito..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Pais *"
              value={formData.pais}
              onChange={(e) =>
                setFormData({ ...formData, pais: e.target.value })
              }
              placeholder="Paraguay"
              required
            />
            <Input
              label="Region"
              value={formData.region || ''}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              placeholder="Ej: Central"
            />
            <Input
              label="Ciudad"
              value={formData.ciudad || ''}
              onChange={(e) =>
                setFormData({ ...formData, ciudad: e.target.value })
              }
              placeholder="Ej: Asuncion"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Inicio *"
              type="date"
              value={formData.fechaInicio}
              onChange={(e) =>
                setFormData({ ...formData, fechaInicio: e.target.value })
              }
              required
            />
            <Input
              label="Fecha Fin *"
              type="date"
              value={formData.fechaFin}
              onChange={(e) =>
                setFormData({ ...formData, fechaFin: e.target.value })
              }
              required
            />
          </div>

          <Input
            label="URL Logo"
            type="url"
            value={formData.logoUrl || ''}
            onChange={(e) =>
              setFormData({ ...formData, logoUrl: e.target.value })
            }
            placeholder="https://..."
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={loading} className="flex-1">
              {circuito ? 'Actualizar Circuito' : 'Guardar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// =============================================
// COMPONENT: Standings Table
// =============================================
interface StandingsTableProps {
  standings: CircuitoStanding[];
  loading: boolean;
  genero: string;
  onGeneroChange: (genero: string) => void;
}

const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  loading,
  genero,
  onGeneroChange,
}) => {
  return (
    <div className="mt-3 border border-dark-border rounded-lg bg-dark-surface overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border bg-dark-hover">
        <BarChart3 className="h-4 w-4 text-primary-400" />
        <span className="text-sm font-medium text-light-text">Standings</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => onGeneroChange('MASCULINO')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              genero === 'MASCULINO'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-card text-light-secondary hover:text-light-text'
            }`}
          >
            Masculino
          </button>
          <button
            onClick={() => onGeneroChange('FEMENINO')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              genero === 'FEMENINO'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-card text-light-secondary hover:text-light-text'
            }`}
          >
            Femenino
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8">
          <Loading size="sm" text="Cargando standings..." />
        </div>
      ) : standings.length === 0 ? (
        <div className="py-8 text-center text-sm text-light-secondary">
          No hay datos de standings para este genero
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border text-left text-light-secondary">
                <th className="px-4 py-2 w-12">#</th>
                <th className="px-4 py-2">Jugador</th>
                <th className="px-4 py-2">Ciudad</th>
                <th className="px-4 py-2 text-right">Puntos</th>
                <th className="px-4 py-2 text-right">Torneos</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => (
                <tr
                  key={s.jugador.id}
                  className="border-b border-dark-border last:border-b-0 hover:bg-dark-hover transition-colors"
                >
                  <td className="px-4 py-2.5 font-medium text-light-secondary">
                    {s.posicion || idx + 1}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-light-text">
                    {s.jugador.nombre} {s.jugador.apellido}
                  </td>
                  <td className="px-4 py-2.5 text-light-secondary">
                    {s.jugador.ciudad || '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-primary-400">
                    {s.puntosTotales}
                  </td>
                  <td className="px-4 py-2.5 text-right text-light-secondary">
                    {s.torneosJugados}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =============================================
// COMPONENT: Circuito Card (expandable)
// =============================================
interface CircuitoCardProps {
  circuito: Circuito;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (circuito: Circuito) => void;
  onDelete: (id: string) => void;
  onFinalizar: (id: string) => void;
  actionLoading: string | null;
}

const CircuitoCard: React.FC<CircuitoCardProps> = ({
  circuito,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onFinalizar,
  actionLoading,
}) => {
  const [torneos, setTorneos] = useState<Tournament[]>(
    circuito.torneos || []
  );
  const [torneosDisponibles, setTorneosDisponibles] = useState<any[]>([]);
  const [selectedTorneoId, setSelectedTorneoId] = useState('');
  const [addingTorneo, setAddingTorneo] = useState(false);
  const [removingTorneoId, setRemovingTorneoId] = useState<string | null>(null);

  const [showStandings, setShowStandings] = useState(false);
  const [standings, setStandings] = useState<CircuitoStanding[]>([]);
  const [standingsGenero, setStandingsGenero] = useState('MASCULINO');
  const [standingsLoading, setStandingsLoading] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      loadTorneosDisponibles();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (showStandings) {
      loadStandings(standingsGenero);
    }
  }, [standingsGenero, showStandings]);

  const loadTorneosDisponibles = async () => {
    try {
      const data = await circuitosService.getTorneosDisponibles();
      setTorneosDisponibles(data);
    } catch {
      // silent - dropdown just stays empty
    }
  };

  const loadStandings = async (genero: string) => {
    setStandingsLoading(true);
    try {
      const data = await circuitosService.getStandings(circuito.id, genero);
      setStandings(data);
    } catch {
      toast.error('Error al cargar standings');
      setStandings([]);
    } finally {
      setStandingsLoading(false);
    }
  };

  const handleAgregarTorneo = async () => {
    if (!selectedTorneoId) {
      toast.error('Selecciona un torneo');
      return;
    }
    setAddingTorneo(true);
    try {
      await circuitosService.agregarTorneo(circuito.id, selectedTorneoId);
      toast.success('Torneo agregado al circuito');
      // Add to local list
      const added = torneosDisponibles.find(
        (t) => t.id === selectedTorneoId
      );
      if (added) {
        setTorneos((prev) => [...prev, added as Tournament]);
        setTorneosDisponibles((prev) =>
          prev.filter((t) => t.id !== selectedTorneoId)
        );
      }
      setSelectedTorneoId('');
    } catch {
      toast.error('Error al agregar torneo');
    } finally {
      setAddingTorneo(false);
    }
  };

  const handleRemoverTorneo = async (tournamentId: string) => {
    if (!confirm('Remover este torneo del circuito?')) return;
    setRemovingTorneoId(tournamentId);
    try {
      await circuitosService.removerTorneo(circuito.id, tournamentId);
      toast.success('Torneo removido del circuito');
      const removed = torneos.find((t) => t.id === tournamentId);
      setTorneos((prev) => prev.filter((t) => t.id !== tournamentId));
      if (removed) {
        setTorneosDisponibles((prev) => [...prev, removed as any]);
      }
    } catch {
      toast.error('Error al remover torneo');
    } finally {
      setRemovingTorneoId(null);
    }
  };

  const torneosCount = torneos.length || circuito._count?.torneos || 0;

  return (
    <Card>
      <div className="p-4">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {circuito.logoUrl ? (
              <img
                src={circuito.logoUrl}
                alt={circuito.nombre}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-500 font-bold text-lg">
                {circuito.nombre.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-light-text">
                  {circuito.nombre}
                </h3>
                <Badge variant={estadoBadgeVariant(circuito.estado)}>
                  {circuito.estado}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-light-secondary mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {circuito.temporada}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {circuito.pais}
                  {circuito.ciudad && `, ${circuito.ciudad}`}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(circuito.fechaInicio)} -{' '}
                  {formatDate(circuito.fechaFin)}
                </span>
              </div>
              {circuito.descripcion && (
                <p className="text-xs text-light-secondary mt-1 line-clamp-2">
                  {circuito.descripcion}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {circuito.estado === CircuitoEstado.ACTIVO && (
              <button
                onClick={() => onFinalizar(circuito.id)}
                disabled={actionLoading === `finalizar-${circuito.id}`}
                className="p-2 text-light-secondary hover:text-green-400 hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Finalizar circuito"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onEdit(circuito)}
              className="p-2 text-light-secondary hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Editar circuito"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(circuito.id)}
              disabled={actionLoading === `delete-${circuito.id}`}
              className="p-2 text-light-secondary hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
              title="Eliminar circuito"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          className="mt-3 flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400 font-medium"
        >
          <Trophy className="h-4 w-4" />
          Torneos ({torneosCount})
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Expanded Section */}
        {isExpanded && (
          <div className="mt-3 border-t border-dark-border pt-3 space-y-3">
            {/* Torneos list */}
            {torneos.length === 0 ? (
              <p className="text-sm text-light-secondary text-center py-4">
                No hay torneos asociados a este circuito
              </p>
            ) : (
              <div className="space-y-2">
                {torneos.map((torneo) => (
                  <div
                    key={torneo.id}
                    className="flex items-center justify-between p-3 border border-dark-border rounded-lg hover:bg-dark-hover transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <Trophy className="h-4 w-4 text-primary-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-light-text text-sm truncate">
                          {torneo.nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant={torneoEstadoBadgeVariant(torneo.estado)}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {torneo.estado}
                          </Badge>
                          <span className="text-xs text-light-secondary">
                            {formatDate(torneo.fechaInicio)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoverTorneo(torneo.id)}
                      disabled={removingTorneoId === torneo.id}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30 flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add tournament selector */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label="Agregar Torneo"
                  value={selectedTorneoId}
                  onChange={(e) => setSelectedTorneoId(e.target.value)}
                >
                  <option value="">-- Seleccionar torneo --</option>
                  {torneosDisponibles.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} ({formatDate(t.fechaInicio)})
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAgregarTorneo}
                disabled={!selectedTorneoId || addingTorneo}
                loading={addingTorneo}
                className="h-10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>

            {/* Standings toggle */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowStandings(!showStandings);
                  if (!showStandings && standings.length === 0) {
                    loadStandings(standingsGenero);
                  }
                }}
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showStandings ? 'Ocultar Standings' : 'Ver Standings'}
              </Button>
            </div>

            {/* Standings table */}
            {showStandings && (
              <StandingsTable
                standings={standings}
                loading={standingsLoading}
                genero={standingsGenero}
                onGeneroChange={(g) => setStandingsGenero(g)}
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// =============================================
// PAGE: AdminCircuitosPage
// =============================================
const AdminCircuitosPage = () => {
  const [circuitos, setCircuitos] = useState<Circuito[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCircuito, setEditingCircuito] = useState<Circuito | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadCircuitos();
  }, [filterEstado]);

  const loadCircuitos = async () => {
    setLoading(true);
    try {
      const data = await circuitosService.adminGetAll(
        filterEstado || undefined
      );
      setCircuitos(data);
    } catch {
      toast.error('Error al cargar circuitos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateCircuitoDto) => {
    setFormLoading(true);
    try {
      await circuitosService.create(data);
      toast.success('Circuito creado exitosamente');
      setShowForm(false);
      await loadCircuitos();
    } catch {
      toast.error('Error al crear circuito');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CreateCircuitoDto) => {
    if (!editingCircuito) return;
    setFormLoading(true);
    try {
      await circuitosService.update(editingCircuito.id, data);
      toast.success('Circuito actualizado exitosamente');
      setEditingCircuito(null);
      setShowForm(false);
      await loadCircuitos();
    } catch {
      toast.error('Error al actualizar circuito');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Estas seguro de eliminar este circuito? Se removeran todas las asociaciones con torneos.'
      )
    )
      return;
    setActionLoading(`delete-${id}`);
    try {
      await circuitosService.delete(id);
      toast.success('Circuito eliminado');
      setCircuitos((prev) => prev.filter((c) => c.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      toast.error('Error al eliminar circuito');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinalizar = async (id: string) => {
    if (!confirm('Finalizar este circuito? Esta accion no se puede deshacer.'))
      return;
    setActionLoading(`finalizar-${id}`);
    try {
      await circuitosService.finalizar(id);
      toast.success('Circuito finalizado');
      await loadCircuitos();
    } catch {
      toast.error('Error al finalizar circuito');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleStartEdit = (circuito: Circuito) => {
    setEditingCircuito(circuito);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCircuito(null);
  };

  if (loading && circuitos.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando circuitos..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-light-text flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary-400" />
            Gestionar Circuitos
          </h1>
          <p className="text-light-secondary mt-1">
            Administra circuitos, asocia torneos y consulta standings
          </p>
        </div>
        {!showForm && (
          <Button
            variant="primary"
            onClick={() => {
              setShowForm(true);
              setEditingCircuito(null);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Circuito
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <Select
          label="Filtrar por estado"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="">Todos</option>
          <option value={CircuitoEstado.ACTIVO}>Activo</option>
          <option value={CircuitoEstado.FINALIZADO}>Finalizado</option>
          <option value={CircuitoEstado.CANCELADO}>Cancelado</option>
        </Select>
      </div>

      {/* Inline create/edit form */}
      {showForm && (
        <div className="mb-6">
          <CircuitoForm
            circuito={editingCircuito}
            onSubmit={editingCircuito ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
            loading={formLoading}
          />
        </div>
      )}

      {/* Circuitos list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loading size="md" text="Actualizando..." />
        </div>
      ) : circuitos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-12 w-12 text-light-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-light-text mb-2">
              {filterEstado
                ? 'No se encontraron circuitos con ese estado'
                : 'No hay circuitos registrados'}
            </h3>
            <p className="text-light-secondary mb-4">
              {filterEstado
                ? 'Intenta con otro filtro de estado'
                : 'Crea el primer circuito para empezar a organizar torneos'}
            </p>
            {!filterEstado && !showForm && (
              <Button
                variant="primary"
                onClick={() => {
                  setShowForm(true);
                  setEditingCircuito(null);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Circuito
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {circuitos.map((circuito) => (
            <CircuitoCard
              key={circuito.id}
              circuito={circuito}
              isExpanded={expandedId === circuito.id}
              onToggleExpand={() => handleToggleExpand(circuito.id)}
              onEdit={handleStartEdit}
              onDelete={handleDelete}
              onFinalizar={handleFinalizar}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {circuitos.length > 0 && (
        <div className="mt-6 text-sm text-light-secondary text-center">
          {circuitos.length} circuito(s) encontrado(s)
          {filterEstado && ` con estado ${filterEstado}`}
        </div>
      )}
    </div>
  );
};

export default AdminCircuitosPage;
