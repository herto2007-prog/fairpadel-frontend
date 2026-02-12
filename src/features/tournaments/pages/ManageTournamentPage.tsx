import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loading, Checkbox } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';
import { sedesService } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Tournament, TournamentCategory, SedeCancha, TorneoCancha, TorneoPelotasRonda } from '@/types';
import {
  ArrowLeft,
  BarChart3,
  Edit3,
  Users,
  LayoutDashboard,
  ToggleLeft,
  ToggleRight,
  Crown,
  Lock,
  Calendar,
  MapPin,
  DollarSign,
  Trophy,
  Clock,
  CircleDot,
  Layers,
  Save,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';

type Tab = 'resumen' | 'editar' | 'inscripciones' | 'canchas' | 'pelotas' | 'ayudantes' | 'dashboard';

interface TournamentStats {
  inscripcionesTotal: number;
  partidosTotal: number;
  canchasConfiguradas: number;
  categorias: (TournamentCategory & { inscripcionesCount: number })[];
}

export default function ManageTournamentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const [togglingCategory, setTogglingCategory] = useState<string | null>(null);

  const isAdmin = hasRole('admin');
  const isPremium = user?.esPremium || isAdmin;

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [tournamentData, statsData] = await Promise.all([
        tournamentsService.getById(id!),
        tournamentsService.getStats(id!).catch(() => null),
      ]);
      setTournament(tournamentData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInscripcion = async (tournamentCategoryId: string) => {
    if (!id) return;
    setTogglingCategory(tournamentCategoryId);
    try {
      await tournamentsService.toggleInscripcionCategoria(id, tournamentCategoryId);
      await loadData();
    } catch (error) {
      console.error('Error toggling inscripcion:', error);
    } finally {
      setTogglingCategory(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <p className="text-light-secondary">Torneo no encontrado</p>
          <Button className="mt-4" onClick={() => navigate('/my-tournaments')}>Volver a Mis Torneos</Button>
        </Card>
      </div>
    );
  }

  const canEdit = !['EN_CURSO', 'FINALIZADO', 'CANCELADO'].includes(tournament.estado);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; premium?: boolean }[] = [
    { key: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'editar', label: 'Editar', icon: <Edit3 className="w-4 h-4" /> },
    { key: 'inscripciones', label: 'Inscripciones', icon: <Users className="w-4 h-4" /> },
    { key: 'canchas', label: 'Canchas y Horarios', icon: <Layers className="w-4 h-4" /> },
    { key: 'pelotas', label: 'Pelotas por Ronda', icon: <CircleDot className="w-4 h-4" />, premium: true },
    { key: 'ayudantes', label: 'Ayudantes', icon: <UserPlus className="w-4 h-4" /> },
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" />, premium: true },
  ];

  const estadoColor: Record<string, string> = {
    BORRADOR: 'bg-dark-surface text-light-text',
    PENDIENTE_APROBACION: 'bg-yellow-900/30 text-yellow-400',
    PUBLICADO: 'bg-green-900/30 text-green-400',
    EN_CURSO: 'bg-blue-900/30 text-blue-400',
    FINALIZADO: 'bg-purple-900/30 text-purple-400',
    RECHAZADO: 'bg-red-900/30 text-red-400',
    CANCELADO: 'bg-red-900/30 text-red-400',
  };

  return (
    <div className="min-h-screen bg-dark-surface">
      <div className="bg-dark-card border-b border-dark-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/tournaments/${id}`)} className="p-2 hover:bg-dark-hover rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{tournament.nombre}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[tournament.estado] || ''}`}>
                  {tournament.estado.replace('_', ' ')}
                </span>
                <span className="text-sm text-light-secondary flex items-center gap-1"><MapPin className="w-3 h-3" /> {tournament.ciudad}</span>
                <span className="text-sm text-light-secondary flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(tournament.fechaInicio)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === tab.key ? 'bg-primary-500/20 text-primary-400 border-b-2 border-primary-500' : 'text-light-secondary hover:text-light-text hover:bg-dark-hover'}`}
              >
                {tab.icon}
                {tab.label}
                {tab.premium && !isPremium && <Lock className="w-3 h-3 ml-1" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {activeTab === 'resumen' && <ResumenTab tournament={tournament} stats={stats} />}
        {activeTab === 'editar' && <EditarTab tournament={tournament} canEdit={canEdit} navigate={navigate} />}
        {activeTab === 'inscripciones' && <InscripcionesTab stats={stats} onToggle={handleToggleInscripcion} togglingCategory={togglingCategory} />}
        {activeTab === 'canchas' && <CanchasTab tournament={tournament} />}
        {activeTab === 'pelotas' && <PelotasRondaTab tournament={tournament} stats={stats} isPremium={isPremium} />}
        {activeTab === 'ayudantes' && <AyudantesTab tournament={tournament} />}
        {activeTab === 'dashboard' && <DashboardPremiumTab tournament={tournament} stats={stats} isPremium={isPremium} />}
      </div>
    </div>
  );
}

// ===================== HELPERS =====================

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-dark-border last:border-0">
      <span className="text-sm text-light-secondary">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// ===================== TAB: RESUMEN =====================

function ResumenTab({ tournament, stats }: { tournament: Tournament; stats: TournamentStats | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-900/30 rounded-lg"><Users className="w-6 h-6 text-blue-400" /></div>
            <div><p className="text-2xl font-bold">{stats?.inscripcionesTotal || 0}</p><p className="text-sm text-light-secondary">Inscripciones</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-900/30 rounded-lg"><MapPin className="w-6 h-6 text-green-400" /></div>
            <div><p className="text-2xl font-bold">{stats?.canchasConfiguradas || 0}</p><p className="text-sm text-light-secondary">Canchas</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-900/30 rounded-lg"><Trophy className="w-6 h-6 text-purple-400" /></div>
            <div><p className="text-2xl font-bold">{stats?.partidosTotal || 0}</p><p className="text-sm text-light-secondary">Partidos</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-900/30 rounded-lg"><DollarSign className="w-6 h-6 text-amber-400" /></div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(Number(tournament.costoInscripcion) * (stats?.inscripcionesTotal || 0))}</p>
              <p className="text-sm text-light-secondary">Recaudación est.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Información General</h3>
          <div className="space-y-3">
            <InfoRow label="Nombre" value={tournament.nombre} />
            <InfoRow label="Ciudad" value={`${tournament.ciudad}, ${tournament.pais}`} />
            <InfoRow label="Fecha Inicio" value={formatDate(tournament.fechaInicio)} />
            <InfoRow label="Fecha Fin" value={formatDate(tournament.fechaFin)} />
            <InfoRow label="Límite Inscripción" value={formatDate(tournament.fechaLimiteInscr)} />
            <InfoRow label="Costo" value={formatCurrency(Number(tournament.costoInscripcion))} />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Categorías</h3>
          {stats?.categorias && stats.categorias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-400 mb-3">Caballeros</h4>
                <div className="space-y-2">
                  {stats.categorias.filter((tc) => (tc.category?.nombre || '').toLowerCase().includes('caballeros')).map((tc) => (
                    <div key={tc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{tc.category?.nombre}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tc.inscripcionAbierta ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                          {tc.inscripcionAbierta ? 'Abierta' : 'Cerrada'}
                        </span>
                      </div>
                      <span className="text-sm text-light-secondary">{tc.inscripcionesCount} parejas</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-pink-400 mb-3">Damas</h4>
                <div className="space-y-2">
                  {stats.categorias.filter((tc) => (tc.category?.nombre || '').toLowerCase().includes('damas')).map((tc) => (
                    <div key={tc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{tc.category?.nombre}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tc.inscripcionAbierta ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                          {tc.inscripcionAbierta ? 'Abierta' : 'Cerrada'}
                        </span>
                      </div>
                      <span className="text-sm text-light-secondary">{tc.inscripcionesCount} parejas</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-light-secondary text-sm">Sin categorías configuradas</p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ===================== TAB: EDITAR =====================

function EditarTab({ tournament, canEdit, navigate }: { tournament: Tournament; canEdit: boolean; navigate: (path: string) => void }) {
  if (!canEdit) {
    return (
      <Card className="p-8 text-center">
        <Lock className="w-12 h-12 text-light-secondary mx-auto mb-4" />
        <h3 className="text-lg font-bold text-light-text mb-2">Edición no disponible</h3>
        <p className="text-light-secondary">No se puede editar un torneo con estado <strong>{tournament.estado.replace('_', ' ')}</strong>.</p>
      </Card>
    );
  }
  return (
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-2">Editar datos del torneo</h3>
      <p className="text-light-secondary text-sm mb-4">Modificá los datos básicos, fechas, categorías, modalidades y sede del torneo.</p>
      <Button variant="primary" onClick={() => navigate(`/tournaments/${tournament.id}/edit`)}>
        <Edit3 className="w-4 h-4 mr-2" />Abrir formulario de edición
      </Button>
    </Card>
  );
}

// ===================== TAB: INSCRIPCIONES =====================

function InscripcionesTab({ stats, onToggle, togglingCategory }: { stats: TournamentStats | null; onToggle: (id: string) => void; togglingCategory: string | null }) {
  const categorias = stats?.categorias || [];
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Gestión de Inscripciones por Categoría</h3>
        <span className="text-sm text-light-secondary">Total: {stats?.inscripcionesTotal || 0} parejas inscritas</span>
      </div>
      <p className="text-sm text-light-secondary mb-6">Habilita o deshabilita las inscripciones para cada categoría individualmente.</p>
      {categorias.length === 0 ? (
        <div className="text-center py-8 text-light-secondary"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No hay categorías configuradas</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Caballeros', color: 'blue', filter: 'caballeros' },
            { title: 'Damas', color: 'pink', filter: 'damas' },
          ].map((grupo) => {
            const cats = categorias.filter((tc) => (tc.category?.nombre || '').toLowerCase().includes(grupo.filter));
            if (cats.length === 0) return null;
            return (
              <div key={grupo.filter}>
                <h4 className={`font-medium text-${grupo.color}-400 mb-3`}>{grupo.title}</h4>
                <div className="space-y-3">
                  {cats.map((tc) => (
                    <div key={tc.id} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${tc.inscripcionAbierta ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
                      <div className="flex items-center gap-3">
                        <CircleDot className={`w-5 h-5 ${tc.inscripcionAbierta ? 'text-green-400' : 'text-red-400'}`} />
                        <div>
                          <p className="font-medium">{tc.category?.nombre}</p>
                          <p className="text-xs text-light-secondary">{tc.inscripcionesCount} pareja(s) inscrita(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${tc.inscripcionAbierta ? 'text-green-400' : 'text-red-400'}`}>
                          {tc.inscripcionAbierta ? 'Abiertas' : 'Cerradas'}
                        </span>
                        <button onClick={() => onToggle(tc.id)} disabled={togglingCategory === tc.id} className={`p-1 rounded-md transition-colors ${togglingCategory === tc.id ? 'opacity-50' : 'hover:bg-white/50'}`}>
                          {tc.inscripcionAbierta ? <ToggleRight className="w-8 h-8 text-green-400" /> : <ToggleLeft className="w-8 h-8 text-red-400" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ===================== TAB: CANCHAS Y HORARIOS =====================

function CanchasTab({ tournament }: { tournament: Tournament }) {
  const [sedes, setSedes] = useState<any[]>([]);
  const [allSedes, setAllSedes] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<Record<string, { fecha: string; horaInicio: string; horaFin: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddSede, setShowAddSede] = useState(false);
  const [addingSedeId, setAddingSedeId] = useState('');
  const [minutosPorPartido, setMinutosPorPartido] = useState<number>((tournament as any).minutosPorPartido || 60);
  const [savingMinutos, setSavingMinutos] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar canchas configuradas del torneo
      const data: any = await sedesService.getTorneoCanchas(tournament.id);
      const torneoCanchas = Array.isArray(data) ? data : (data?.canchasConfiguradas || data?.torneoCanchas || []);
      setSelectedIds(torneoCanchas.map((tc: TorneoCancha) => tc.sedeCanchaId));

      const horariosMap: Record<string, { fecha: string; horaInicio: string; horaFin: string }[]> = {};
      torneoCanchas.forEach((tc: TorneoCancha) => {
        if (tc.horarios && tc.horarios.length > 0) {
          horariosMap[tc.sedeCanchaId] = tc.horarios.map((h) => ({
            fecha: h.fecha?.split('T')[0] || '',
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
          }));
        }
      });
      setHorarios(horariosMap);

      // Cargar sedes del torneo (principal + adicionales)
      const sedesData = await sedesService.getSedesDeTorneo(tournament.id).catch(() => []);
      // Si no hay sedes desde el endpoint, usar la sede principal
      if (sedesData.length === 0 && tournament.sedeId) {
        const sedePrincipal = await sedesService.getById(tournament.sedeId);
        setSedes([sedePrincipal]);
      } else {
        setSedes(sedesData);
      }

      // Cargar todas las sedes disponibles (para agregar más)
      const todasLasSedes = await sedesService.getAll({ activo: true });
      setAllSedes(todasLasSedes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCancha = (sedeCanchaId: string) => {
    setSelectedIds((prev) =>
      prev.includes(sedeCanchaId) ? prev.filter((id) => id !== sedeCanchaId) : [...prev, sedeCanchaId]
    );
  };

  const addHorario = (sedeCanchaId: string) => {
    setHorarios((prev) => ({
      ...prev,
      [sedeCanchaId]: [...(prev[sedeCanchaId] || []), { fecha: tournament.fechaInicio?.split('T')[0] || '', horaInicio: '08:00', horaFin: '22:00' }],
    }));
  };

  const removeHorario = (sedeCanchaId: string, index: number) => {
    setHorarios((prev) => ({
      ...prev,
      [sedeCanchaId]: prev[sedeCanchaId]?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateHorario = (sedeCanchaId: string, index: number, field: string, value: string) => {
    setHorarios((prev) => ({
      ...prev,
      [sedeCanchaId]: prev[sedeCanchaId]?.map((h, i) => (i === index ? { ...h, [field]: value } : h)) || [],
    }));
  };

  const handleAddSede = async () => {
    if (!addingSedeId) return;
    setMessage('');
    try {
      await sedesService.agregarSedeATorneo(tournament.id, addingSedeId);
      setShowAddSede(false);
      setAddingSedeId('');
      setMessage('Sede agregada exitosamente');
      await loadData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error al agregar la sede');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const canchas = selectedIds.map((sedeCanchaId) => ({
        sedeCanchaId,
        horarios: horarios[sedeCanchaId] || [],
      }));
      await sedesService.configurarTorneoCanchas(tournament.id, { canchas });
      setMessage('Configuración guardada exitosamente');
      await loadData();
    } catch (error) {
      console.error('Error saving:', error);
      setMessage('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMinutos = async () => {
    setSavingMinutos(true);
    try {
      await tournamentsService.update(tournament.id, { minutosPorPartido } as any);
      setMessage('Minutos por partido actualizados');
    } catch {
      setMessage('Error al guardar minutos por partido');
    } finally {
      setSavingMinutos(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loading size="lg" /></div>;

  if (!tournament.sedeId && sedes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MapPin className="w-12 h-12 text-light-secondary mx-auto mb-4" />
        <h3 className="text-lg font-bold text-light-text mb-2">Sin sede configurada</h3>
        <p className="text-light-secondary">Primero debes seleccionar una sede en la pestaña de edición para poder configurar canchas.</p>
      </Card>
    );
  }

  // Sedes que aún no están vinculadas al torneo
  const sedeIdsVinculadas = sedes.map((s) => s.id);
  const sedesDisponiblesParaAgregar = allSedes.filter((s) => !sedeIdsVinculadas.includes(s.id));

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md text-sm ${message.includes('Error') ? 'bg-red-900/30 text-red-400 border border-red-500/50' : 'bg-green-900/30 text-green-400 border border-green-500/50'}`}>
          {message}
        </div>
      )}

      {/* Configuración de minutos por partido */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Duración estimada por partido
            </h3>
            <p className="text-sm text-light-secondary">Define cuántos minutos dura cada partido en promedio (para calcular horarios)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMinutosPorPartido((prev) => Math.max(15, prev - 15))}
                className="w-8 h-8 rounded-full bg-dark-surface hover:bg-dark-hover flex items-center justify-center font-bold"
              >-</button>
              <span className="w-16 text-center font-bold text-lg">{minutosPorPartido} min</span>
              <button
                onClick={() => setMinutosPorPartido((prev) => Math.min(180, prev + 15))}
                className="w-8 h-8 rounded-full bg-dark-surface hover:bg-dark-hover flex items-center justify-center font-bold"
              >+</button>
            </div>
            <Button variant="primary" onClick={handleSaveMinutos} loading={savingMinutos}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Botón agregar más sedes */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Sedes del Torneo</h3>
            <p className="text-sm text-light-secondary">{sedes.length} sede(s) vinculada(s)</p>
          </div>
          {sedesDisponiblesParaAgregar.length > 0 && (
            <button
              onClick={() => setShowAddSede(!showAddSede)}
              className="flex items-center gap-1 text-sm px-3 py-1.5 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" /> Agregar Sede
            </button>
          )}
        </div>
        {showAddSede && (
          <div className="mt-4 p-3 bg-dark-surface rounded-lg border border-dark-border flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-light-secondary mb-1">Seleccionar sede</label>
              <select
                value={addingSedeId}
                onChange={(e) => setAddingSedeId(e.target.value)}
                className="w-full text-sm border border-dark-border bg-dark-card rounded px-2 py-1.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">-- Seleccionar --</option>
                {sedesDisponiblesParaAgregar.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre} - {s.ciudad} ({s.canchas?.length || 0} canchas)</option>
                ))}
              </select>
            </div>
            <Button variant="primary" onClick={handleAddSede} disabled={!addingSedeId}>
              Agregar
            </Button>
          </div>
        )}
      </Card>

      {/* Canchas por sede */}
      {sedes.map((sede) => {
        const canchasActivas = (sede.canchas || []).filter((c: SedeCancha) => c.activa);
        return (
          <Card key={sede.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  {sede.nombre}
                </h3>
                <p className="text-xs text-light-secondary">{sede.direccion || sede.ciudad}</p>
              </div>
              <span className="text-xs text-light-secondary">{canchasActivas.length} cancha(s)</span>
            </div>

            {canchasActivas.length === 0 ? (
              <div className="text-center py-4 text-light-secondary text-sm">No hay canchas activas en esta sede</div>
            ) : (
              <div className="space-y-4">
                {canchasActivas.map((cancha: SedeCancha) => {
                  const isSelected = selectedIds.includes(cancha.id);
                  const canchaHorarios = horarios[cancha.id] || [];
                  return (
                    <div key={cancha.id} className={`border rounded-lg transition-colors ${isSelected ? 'border-primary-500/50 bg-primary-500/20' : 'border-dark-border'}`}>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox label="" checked={isSelected} onChange={() => handleToggleCancha(cancha.id)} />
                          <div>
                            <p className="font-medium">{cancha.nombre}</p>
                            <p className="text-xs text-light-secondary">{cancha.tipo}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <button onClick={() => addHorario(cancha.id)} className="text-xs px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full hover:bg-primary-500/30 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Agregar horario
                          </button>
                        )}
                      </div>

                      {isSelected && canchaHorarios.length > 0 && (
                        <div className="border-t border-dark-border px-4 py-3 bg-dark-card rounded-b-lg">
                          <p className="text-xs font-medium text-light-secondary mb-2">Horarios configurados:</p>
                          <div className="space-y-2">
                            {canchaHorarios.map((h, idx) => (
                              <div key={idx} className="flex items-center gap-3 flex-wrap">
                                <input type="date" value={h.fecha} onChange={(e) => updateHorario(cancha.id, idx, 'fecha', e.target.value)}
                                  className="text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                                <input type="time" value={h.horaInicio} onChange={(e) => updateHorario(cancha.id, idx, 'horaInicio', e.target.value)}
                                  className="text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                                <span className="text-light-secondary">a</span>
                                <input type="time" value={h.horaFin} onChange={(e) => updateHorario(cancha.id, idx, 'horaFin', e.target.value)}
                                  className="text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                                <button onClick={() => removeHorario(cancha.id, idx)} className="p-1 text-red-400 hover:text-red-300">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isSelected && canchaHorarios.length === 0 && (
                        <div className="border-t border-dark-border px-4 py-3 bg-dark-card rounded-b-lg">
                          <p className="text-xs text-light-secondary italic">Sin horarios configurados. Agrega horarios para esta cancha.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      <div className="flex items-center justify-between">
        <p className="text-sm text-light-secondary">{selectedIds.length} cancha(s) seleccionada(s) en total</p>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4 mr-2" /> Guardar Configuración
        </Button>
      </div>
    </div>
  );
}

// ===================== TAB: PELOTAS POR RONDA (PREMIUM) =====================

const RONDAS_DISPONIBLES = [
  { key: 'ronda1', label: 'Ronda 1 (Fase de Grupos / Clasificación)', desc: 'Primeros partidos del torneo - fase inicial donde se definen posiciones' },
  { key: 'ronda2', label: 'Ronda 2 (Zona / Repechaje)', desc: 'Segunda fase de grupos o repechaje para equipos eliminados' },
  { key: 'ronda3', label: 'Ronda 3 (Cruce de Zonas)', desc: 'Cruces entre ganadores de diferentes zonas' },
  { key: 'octavos', label: 'Octavos de Final', desc: '16 parejas compiten - se clasifican 8' },
  { key: 'cuartos', label: 'Cuartos de Final', desc: '8 parejas compiten - se clasifican 4' },
  { key: 'semis', label: 'Semifinales', desc: '4 parejas compiten - se clasifican 2 finalistas' },
  { key: 'final', label: 'Final', desc: 'Partido definitorio del campeón' },
];

function PelotasRondaTab({ tournament, stats, isPremium }: { tournament: Tournament; stats: TournamentStats | null; isPremium: boolean }) {
  const [rondas, setRondas] = useState<{ ronda: string; cantidadPelotas: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPelotas();
  }, []);

  const loadPelotas = async () => {
    try {
      const data = await tournamentsService.getPelotasRonda(tournament.id);
      if (data && data.length > 0) {
        setRondas(data.map((r: TorneoPelotasRonda) => ({ ronda: r.ronda, cantidadPelotas: r.cantidadPelotas })));
      } else {
        // Configuración predeterminada: 2 pelotas por partido en todas las rondas
        setRondas(RONDAS_DISPONIBLES.map((r) => ({ ronda: r.key, cantidadPelotas: 2 })));
      }
    } catch {
      // Si falla (no premium), cargar defaults
      setRondas(RONDAS_DISPONIBLES.map((r) => ({ ronda: r.key, cantidadPelotas: 2 })));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (ronda: string, value: number) => {
    setRondas((prev) => prev.map((r) => (r.ronda === ronda ? { ...r, cantidadPelotas: value } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await tournamentsService.updatePelotasRonda(tournament.id, rondas);
      setMessage('Configuración de pelotas guardada');
    } catch {
      setMessage('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (!isPremium) {
    return (
      <Card className="p-8 text-center">
        <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Configuración de Pelotas por Ronda</h3>
        <p className="text-light-secondary mb-4 max-w-md mx-auto">
          Configura la cantidad de pelotas que se usarán en cada ronda del torneo.
          El predeterminado es 2 pelotas por partido. Esta función permite personalizar por ronda (ej: 3 pelotas en finales).
        </p>
        <Button variant="primary" className="bg-amber-500 hover:bg-amber-600">
          <Crown className="w-4 h-4 mr-2" /> Hacete Premium
        </Button>
      </Card>
    );
  }

  if (loading) return <div className="flex justify-center py-12"><Loading size="lg" /></div>;

  const totalParejas = stats?.inscripcionesTotal || 0;
  const totalPartidos = totalParejas > 0 ? totalParejas - 1 : 0;
  const totalPelotas = rondas.reduce((acc, r) => {
    // Estimación simple basada en partidos por ronda
    const partidosRonda = r.ronda === 'final' ? 1 : r.ronda === 'semis' ? 2 : r.ronda === 'cuartos' ? 4 : r.ronda === 'octavos' ? 8 : Math.ceil(totalPartidos / RONDAS_DISPONIBLES.length);
    return acc + partidosRonda * r.cantidadPelotas;
  }, 0);

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md text-sm ${message.includes('Error') ? 'bg-red-900/30 text-red-400 border border-red-500/50' : 'bg-green-900/30 text-green-400 border border-green-500/50'}`}>
          {message}
        </div>
      )}

      <Card className="p-6">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <CircleDot className="w-5 h-5 text-amber-500" />
          Pelotas por Ronda
        </h3>
        <p className="text-sm text-light-secondary mb-6">
          Configura cuántas pelotas se usarán por partido en cada ronda. El predeterminado es 2 pelotas.
          Para finales normalmente se usan 3 pelotas nuevas.
        </p>

        <div className="space-y-3">
          {RONDAS_DISPONIBLES.map((rondaDef) => {
            const rondaData = rondas.find((r) => r.ronda === rondaDef.key);
            const cantidad = rondaData?.cantidadPelotas || 2;
            return (
              <div key={rondaDef.key} className="flex items-center justify-between p-3 rounded-lg border border-dark-border bg-dark-card hover:bg-dark-hover">
                <div>
                  <span className="font-medium text-sm">{rondaDef.label}</span>
                  <p className="text-xs text-light-secondary mt-0.5">{rondaDef.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleChange(rondaDef.key, Math.max(1, cantidad - 1))}
                    className="w-8 h-8 rounded-full bg-dark-surface hover:bg-dark-hover flex items-center justify-center text-lg font-bold"
                  >-</button>
                  <span className="w-8 text-center font-bold text-lg">{cantidad}</span>
                  <button
                    onClick={() => handleChange(rondaDef.key, Math.min(6, cantidad + 1))}
                    className="w-8 h-8 rounded-full bg-dark-surface hover:bg-dark-hover flex items-center justify-center text-lg font-bold"
                  >+</button>
                  <span className="text-xs text-light-secondary ml-2">pelotas</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-amber-900/30 border border-amber-500/50 rounded-lg">
          <p className="text-sm text-amber-400">
            <strong>Estimación total:</strong> ~{totalPelotas} pelotas necesarias para {totalPartidos} partidos estimados ({totalParejas} parejas)
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Guardar Configuración
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ===================== TAB: AYUDANTES =====================

function AyudantesTab({ tournament }: { tournament: Tournament }) {
  const [ayudantes, setAyudantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [documento, setDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('ayudante');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAyudantes();
  }, []);

  const loadAyudantes = async () => {
    try {
      const data = await tournamentsService.getAyudantes(tournament.id);
      setAyudantes(data);
    } catch (error) {
      console.error('Error loading ayudantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!documento.trim()) return;
    setAdding(true);
    setMessage('');
    try {
      await tournamentsService.addAyudante(tournament.id, { documento: documento.trim(), nombre: nombre.trim() || undefined, rol });
      setDocumento('');
      setNombre('');
      setRol('ayudante');
      setMessage('Ayudante agregado exitosamente');
      await loadAyudantes();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error al agregar ayudante');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (ayudanteId: string) => {
    try {
      await tournamentsService.removeAyudante(tournament.id, ayudanteId);
      await loadAyudantes();
    } catch (error) {
      console.error('Error removing ayudante:', error);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loading size="lg" /></div>;

  const ROLES = [
    { value: 'ayudante', label: 'Ayudante General' },
    { value: 'arbitro', label: 'Árbitro' },
    { value: 'mesa', label: 'Mesa de Control' },
  ];

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md text-sm ${message.includes('Error') ? 'bg-red-900/30 text-red-400 border border-red-500/50' : 'bg-green-900/30 text-green-400 border border-green-500/50'}`}>
          {message}
        </div>
      )}

      <Card className="p-6">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary-500" />
          Agregar Ayudante
        </h3>
        <p className="text-sm text-light-secondary mb-4">
          Designa responsables que puedan ayudar a gestionar el torneo. La asignación es por número de documento.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-light-secondary mb-1">Documento *</label>
            <input
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Ej: 4567890"
              className="w-full text-sm border rounded px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary mb-1">Nombre (opcional)</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del ayudante"
              className="w-full text-sm border rounded px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-light-secondary mb-1">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full text-sm border rounded px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="primary" onClick={handleAdd} loading={adding} disabled={!documento.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Agregar
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Ayudantes del Torneo ({ayudantes.length})</h3>
        {ayudantes.length === 0 ? (
          <div className="text-center py-8 text-light-secondary">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay ayudantes asignados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ayudantes.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 border border-dark-border rounded-lg bg-dark-card hover:bg-dark-hover">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {a.user ? `${a.user.nombre} ${a.user.apellido}` : a.nombre || `Doc: ${a.documento}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-light-secondary">Doc: {a.documento}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400">
                        {ROLES.find((r) => r.value === a.rol)?.label || a.rol}
                      </span>
                      {a.user && <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-400">Registrado</span>}
                      {!a.user && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400">No registrado</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRemove(a.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ===================== TAB: DASHBOARD PREMIUM =====================

function DashboardPremiumTab({ tournament, stats, isPremium }: { tournament: Tournament; stats: TournamentStats | null; isPremium: boolean }) {
  const [pelotasConfig, setPelotasConfig] = useState<TorneoPelotasRonda[]>([]);

  useEffect(() => {
    if (isPremium) {
      tournamentsService.getPelotasRonda(tournament.id).then(setPelotasConfig).catch(() => {});
    }
  }, [isPremium]);

  if (!isPremium) {
    return (
      <Card className="p-8 text-center">
        <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Dashboard Premium</h3>
        <p className="text-light-secondary mb-6 max-w-md mx-auto">
          Accede a reportes avanzados: calcula canchas, horas y pelotas necesarias para tu torneo.
        </p>
        <Button variant="primary" className="bg-amber-500 hover:bg-amber-600">
          <Crown className="w-4 h-4 mr-2" /> Hacete Premium
        </Button>
      </Card>
    );
  }

  const totalParejas = stats?.inscripcionesTotal || 0;
  const totalCategorias = stats?.categorias?.length || 0;
  const totalPartidosEstimado = totalParejas > 0 ? totalParejas - 1 : 0;
  const rondasEstimadas = totalParejas > 0 ? Math.ceil(Math.log2(totalParejas)) : 0;
  const partidosPorRonda = Math.ceil(totalParejas / 2);
  const duracionPartidoMin = (tournament as any).minutosPorPartido || 60;
  const canchasDisponibles = stats?.canchasConfiguradas || 1;
  const horasNecesarias = canchasDisponibles > 0 ? Math.ceil((totalPartidosEstimado * duracionPartidoMin) / (60 * canchasDisponibles)) : 0;

  // Calcular pelotas desde la configuración real
  const pelotasPorDefecto = 2;
  const pelotasNecesarias = pelotasConfig.length > 0
    ? pelotasConfig.reduce((acc, r) => {
        const partidosRonda = r.ronda === 'final' ? 1 : r.ronda === 'semis' ? 2 : r.ronda === 'cuartos' ? 4 : r.ronda === 'octavos' ? 8 : Math.ceil(totalPartidosEstimado / 7);
        return acc + partidosRonda * r.cantidadPelotas;
      }, 0)
    : totalPartidosEstimado * pelotasPorDefecto;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3"><MapPin className="w-8 h-8 text-primary-500" /><div><p className="text-3xl font-bold">{canchasDisponibles}</p><p className="text-sm text-light-secondary">Canchas configuradas</p></div></div>
        </Card>
        <Card className="p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3"><Clock className="w-8 h-8 text-blue-500" /><div><p className="text-3xl font-bold">{horasNecesarias}h</p><p className="text-sm text-light-secondary">Horas estimadas</p></div></div>
          <p className="text-xs text-light-secondary mt-2">Con {canchasDisponibles} cancha(s) a {duracionPartidoMin}min/partido</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3"><CircleDot className="w-8 h-8 text-amber-500" /><div><p className="text-3xl font-bold">{pelotasNecesarias}</p><p className="text-sm text-light-secondary">Pelotas necesarias</p></div></div>
          <p className="text-xs text-light-secondary mt-2">{pelotasConfig.length > 0 ? 'Basado en config. por ronda' : `${pelotasPorDefecto} pelotas/partido (default)`}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary-500" /> Resumen del Torneo</h3>
          <div className="space-y-3">
            <InfoRow label="Total de parejas" value={String(totalParejas)} />
            <InfoRow label="Total de categorías" value={String(totalCategorias)} />
            <InfoRow label="Partidos estimados" value={String(totalPartidosEstimado)} />
            <InfoRow label="Rondas estimadas" value={String(rondasEstimadas)} />
            <InfoRow label="Partidos ronda inicial" value={String(partidosPorRonda)} />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary-500" /> Proyección Financiera</h3>
          <div className="space-y-3">
            <InfoRow label="Costo inscripción" value={formatCurrency(Number(tournament.costoInscripcion))} />
            <InfoRow label="Inscripciones" value={String(totalParejas)} />
            <InfoRow label="Recaudación" value={formatCurrency(Number(tournament.costoInscripcion) * totalParejas)} />
            <InfoRow label="Costo pelotas (est.)" value={formatCurrency(pelotasNecesarias * 15000)} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-primary-500" /> Desglose por Categoría</h3>
        {stats?.categorias && stats.categorias.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-dark-border text-left"><th className="py-2 px-3 font-medium text-light-secondary">Categoría</th><th className="py-2 px-3 text-center">Parejas</th><th className="py-2 px-3 text-center">Partidos</th><th className="py-2 px-3 text-center">Rondas</th><th className="py-2 px-3 text-center">Estado</th></tr></thead>
              <tbody>
                {stats.categorias.map((tc) => {
                  const p = tc.inscripcionesCount;
                  return (
                    <tr key={tc.id} className="border-b border-dark-border last:border-0 hover:bg-dark-hover">
                      <td className="py-3 px-3 font-medium">{tc.category?.nombre}</td>
                      <td className="py-3 px-3 text-center">{p}</td>
                      <td className="py-3 px-3 text-center">{p > 0 ? p - 1 : 0}</td>
                      <td className="py-3 px-3 text-center">{p > 0 ? Math.ceil(Math.log2(p)) : 0}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${tc.inscripcionAbierta ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                          {tc.inscripcionAbierta ? 'Abierta' : 'Cerrada'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="text-light-secondary text-sm text-center py-4">Sin datos</p>}
      </Card>
    </div>
  );
}
