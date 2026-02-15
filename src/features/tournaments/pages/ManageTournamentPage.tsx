import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loading, Checkbox } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';
import { sedesService } from '@/services';
import { matchesService } from '@/services/matchesService';
import inscripcionesService from '@/services/inscripcionesService';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Tournament, TournamentCategory, SedeCancha, TorneoCancha, TorneoPelotasRonda, Match, Pareja, Inscripcion } from '@/types';
import { BracketView } from '@/features/matches/components/BracketView';
import { ScoreModal } from '@/features/matches/components/ScoreModal';
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
  ArrowRightLeft,
  Eye,
  Send,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'resumen' | 'editar' | 'inscripciones' | 'pagos' | 'sorteo' | 'canchas' | 'pelotas' | 'ayudantes' | 'dashboard';

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
    { key: 'pagos', label: 'Pagos', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'sorteo', label: 'Sorteo', icon: <Trophy className="w-4 h-4" /> },
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
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={() => navigate(`/tournaments/${id}`)} className="p-2 hover:bg-dark-hover rounded-lg transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">{tournament.nombre}</h1>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[tournament.estado] || ''}`}>
                  {tournament.estado.replace('_', ' ')}
                </span>
                <span className="text-xs sm:text-sm text-light-secondary flex items-center gap-1"><MapPin className="w-3 h-3" /> {tournament.ciudad}</span>
                <span className="text-xs sm:text-sm text-light-secondary flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(tournament.fechaInicio)}</span>
              </div>
            </div>
          </div>
          {/* Tabs — icons only on mobile, icons + labels on desktop */}
          <div className="flex gap-0.5 sm:gap-1 mt-4 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                title={tab.label}
                className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0
                  ${activeTab === tab.key ? 'bg-primary-500/20 text-primary-400 border-b-2 border-primary-500' : 'text-light-secondary hover:text-light-text hover:bg-dark-hover'}`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.premium && !isPremium && <Lock className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {activeTab === 'resumen' && <ResumenTab tournament={tournament} stats={stats} onRefresh={loadData} />}
        {activeTab === 'editar' && <EditarTab tournament={tournament} canEdit={canEdit} navigate={navigate} />}
        {activeTab === 'inscripciones' && <InscripcionesTab stats={stats} onToggle={handleToggleInscripcion} togglingCategory={togglingCategory} />}
        {activeTab === 'pagos' && <PagosTab tournament={tournament} />}
        {activeTab === 'sorteo' && <SorteoTab tournament={tournament} stats={stats} onRefresh={loadData} isPremium={user?.esPremium || false} />}
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

function ResumenTab({ tournament, stats, onRefresh }: { tournament: Tournament; stats: TournamentStats | null; onRefresh: () => Promise<void> }) {
  const [finalizingTorneo, setFinalizingTorneo] = useState(false);
  const [showFinalizarTorneo, setShowFinalizarTorneo] = useState(false);

  const categoriasFinalizadas = stats?.categorias?.filter((tc) => tc.estado === 'FINALIZADA').length || 0;
  const totalCategorias = stats?.categorias?.length || 0;
  const todasFinalizadas = totalCategorias > 0 && categoriasFinalizadas === totalCategorias;
  const puedeFinalizarTorneo = todasFinalizadas && tournament.estado === 'EN_CURSO';

  const handleFinalizarTorneo = async () => {
    setFinalizingTorneo(true);
    try {
      await tournamentsService.finalizarTorneo(tournament.id);
      toast.success('Torneo finalizado exitosamente');
      setShowFinalizarTorneo(false);
      await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al finalizar torneo');
    } finally {
      setFinalizingTorneo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de finalización */}
      {puedeFinalizarTorneo && (
        <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div>
              <p className="font-bold text-green-400">Todas las categorías están finalizadas</p>
              <p className="text-sm text-green-400/70">Puedes finalizar el torneo para cerrar el ciclo y consolidar resultados.</p>
            </div>
          </div>
          <Button
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowFinalizarTorneo(true)}
          >
            <Trophy className="w-4 h-4 mr-2" /> Finalizar Torneo
          </Button>
        </div>
      )}

      {/* Progreso de categorías */}
      {tournament.estado === 'EN_CURSO' && totalCategorias > 0 && !todasFinalizadas && (
        <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-400">Progreso de Finalización</p>
            <p className="text-sm text-blue-400">{categoriasFinalizadas} / {totalCategorias} categorías</p>
          </div>
          <div className="w-full bg-dark-surface rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(categoriasFinalizadas / totalCategorias) * 100}%` }}
            />
          </div>
        </div>
      )}

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

      {/* Modal confirmar finalizar torneo */}
      {showFinalizarTorneo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowFinalizarTorneo(false)}>
          <div className="bg-dark-card rounded-xl border border-dark-border max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Finalizar Torneo
              </h3>
              <p className="text-sm text-light-secondary mb-4">
                ¿Estás seguro de que deseas finalizar <strong>{tournament.nombre}</strong>?
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {totalCategorias} categorías finalizadas
                </div>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Rankings y puntos registrados
                </div>
              </div>
              <div className="p-3 bg-orange-900/30 border border-orange-500/50 rounded-lg mb-4">
                <p className="text-sm text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  El torneo pasará a estado FINALIZADO y no podrá editarse.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowFinalizarTorneo(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleFinalizarTorneo}
                  loading={finalizingTorneo}
                >
                  <Trophy className="w-4 h-4 mr-1" /> Finalizar Torneo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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

// ===================== PAGOS TAB =====================

function PagosTab({ tournament }: { tournament: Tournament }) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'pendientes' | 'confirmadas' | 'rechazadas'>('todas');
  const [searchCedula, setSearchCedula] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  useEffect(() => {
    loadInscripciones();
  }, [tournament.id]);

  const loadInscripciones = async () => {
    try {
      const data = await inscripcionesService.getByTournament(tournament.id);
      setInscripciones(data);
    } catch (err) {
      console.error('Error loading inscripciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async (inscripcionId: string) => {
    setProcessingId(inscripcionId);
    try {
      await inscripcionesService.confirmarPago(tournament.id, inscripcionId);
      toast.success('Pago confirmado');
      await loadInscripciones();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al confirmar pago');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazar = async (inscripcionId: string) => {
    const motivo = rejectMotivo[inscripcionId] || '';
    setProcessingId(inscripcionId);
    try {
      await inscripcionesService.rechazarPago(tournament.id, inscripcionId, motivo || undefined);
      toast.success('Pago rechazado');
      setShowRejectInput(null);
      await loadInscripciones();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al rechazar pago');
    } finally {
      setProcessingId(null);
    }
  };

  const pendientes = inscripciones.filter((i) =>
    ['PENDIENTE_PAGO', 'PENDIENTE_CONFIRMACION', 'PENDIENTE_PAGO_PRESENCIAL'].includes(i.estado),
  );
  const confirmadas = inscripciones.filter((i) => i.estado === 'CONFIRMADA');
  const rechazadas = inscripciones.filter((i) => i.estado === 'RECHAZADA');

  const filteredInscripciones = useMemo(() => {
    let result = filter === 'pendientes'
      ? pendientes
      : filter === 'confirmadas'
        ? confirmadas
        : filter === 'rechazadas'
          ? rechazadas
          : inscripciones;

    if (searchCedula.trim()) {
      const search = searchCedula.trim().toLowerCase();
      result = result.filter((insc) => {
        const j1Doc = (insc.pareja as any)?.jugador1?.documento?.toLowerCase() || '';
        const j2Doc = (insc.pareja as any)?.jugador2?.documento?.toLowerCase() || '';
        const j2DocField = (insc.pareja as any)?.jugador2Documento?.toLowerCase() || '';
        return j1Doc.includes(search) || j2Doc.includes(search) || j2DocField.includes(search);
      });
    }

    return result;
  }, [inscripciones, filter, searchCedula, pendientes, confirmadas, rechazadas]);

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE_PAGO: 'bg-yellow-900/30 text-yellow-400',
      PENDIENTE_CONFIRMACION: 'bg-blue-900/30 text-blue-400',
      PENDIENTE_PAGO_PRESENCIAL: 'bg-orange-900/30 text-orange-400',
      CONFIRMADA: 'bg-green-900/30 text-green-400',
      RECHAZADA: 'bg-red-900/30 text-red-400',
      CANCELADA: 'bg-dark-surface text-light-secondary',
    };
    const labels: Record<string, string> = {
      PENDIENTE_PAGO: 'Pago pendiente',
      PENDIENTE_CONFIRMACION: 'Comprobante enviado',
      PENDIENTE_PAGO_PRESENCIAL: 'Presencial pendiente',
      CONFIRMADA: 'Confirmada',
      RECHAZADA: 'Rechazada',
      CANCELADA: 'Cancelada',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[estado] || 'bg-dark-surface text-light-secondary'}`}>
        {labels[estado] || estado}
      </span>
    );
  };

  const getMetodoBadge = (metodo?: string) => {
    if (!metodo) return null;
    const colors: Record<string, string> = {
      BANCARD: 'text-blue-400',
      TRANSFERENCIA: 'text-purple-400',
      EFECTIVO: 'text-green-400',
    };
    return <span className={`text-xs font-medium ${colors[metodo] || ''}`}>{metodo}</span>;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loading size="lg" text="Cargando pagos..." /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{pendientes.length}</p>
          <p className="text-xs text-light-secondary">Pendientes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{confirmadas.length}</p>
          <p className="text-xs text-light-secondary">Confirmadas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{rechazadas.length}</p>
          <p className="text-xs text-light-secondary">Rechazadas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-light-text">{inscripciones.length}</p>
          <p className="text-xs text-light-secondary">Total</p>
        </Card>
      </div>

      {/* Search by cédula */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-secondary" />
        <input
          type="text"
          value={searchCedula}
          onChange={(e) => setSearchCedula(e.target.value)}
          placeholder="Buscar por cédula del jugador..."
          className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['todas', 'pendientes', 'confirmadas', 'rechazadas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredInscripciones.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-light-secondary">No hay inscripciones en esta categoría</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left">
                  <th className="px-4 py-3 text-light-secondary font-medium">Pareja</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Categoría</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Método</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Estado</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Comprobante</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInscripciones.map((insc) => {
                  const isPendiente = ['PENDIENTE_PAGO', 'PENDIENTE_CONFIRMACION', 'PENDIENTE_PAGO_PRESENCIAL'].includes(insc.estado);
                  const j1 = insc.pareja?.jugador1;
                  const j2 = insc.pareja?.jugador2;
                  const comprobante = insc.comprobantes && insc.comprobantes.length > 0 ? insc.comprobantes[insc.comprobantes.length - 1] : null;

                  return (
                    <tr key={insc.id} className="border-b border-dark-border/50 hover:bg-dark-hover/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-light-text">
                          {j1 ? `${j1.nombre} ${j1.apellido}` : '—'}
                        </div>
                        <div className="text-light-secondary text-xs">
                          {j2 ? `${j2.nombre} ${j2.apellido}` : insc.pareja?.jugador2Documento ? `Doc: ${insc.pareja.jugador2Documento}` : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-light-secondary">
                        {insc.category?.nombre || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {getMetodoBadge(insc.pago?.metodoPago)}
                      </td>
                      <td className="px-4 py-3">
                        {getEstadoBadge(insc.estado)}
                      </td>
                      <td className="px-4 py-3">
                        {comprobante ? (
                          <a
                            href={comprobante.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:underline text-xs"
                          >
                            Ver
                          </a>
                        ) : (
                          <span className="text-light-secondary text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isPendiente && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleConfirmar(insc.id)}
                              disabled={processingId === insc.id}
                              className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
                            >
                              {processingId === insc.id ? '...' : '✓ Confirmar'}
                            </button>
                            {showRejectInput === insc.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={rejectMotivo[insc.id] || ''}
                                  onChange={(e) => setRejectMotivo((prev) => ({ ...prev, [insc.id]: e.target.value }))}
                                  placeholder="Motivo (opcional)"
                                  className="w-32 px-2 py-1 text-xs bg-dark-card border border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                                <button
                                  onClick={() => handleRechazar(insc.id)}
                                  disabled={processingId === insc.id}
                                  className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                >
                                  {processingId === insc.id ? '...' : 'Enviar'}
                                </button>
                                <button
                                  onClick={() => setShowRejectInput(null)}
                                  className="text-light-secondary text-xs hover:text-light-text"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowRejectInput(insc.id)}
                                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium hover:bg-red-500/30 transition-colors"
                              >
                                ✗ Rechazar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ===================== SORTEO TAB =====================

function SorteoTab({ tournament, stats, onRefresh, isPremium }: { tournament: Tournament; stats: TournamentStats | null; onRefresh: () => Promise<void>; isPremium: boolean }) {
  const [sorteando, setSorteando] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [fixtureData, setFixtureData] = useState<Match[]>([]);
  const [loadingFixture, setLoadingFixture] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fixtureRef = useRef<HTMLDivElement>(null);
  const [publishing, setPublishing] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Record<string, { fechaProgramada: string; horaProgramada: string; torneoCanchaId: string }>>({});
  const [savingSchedule, setSavingSchedule] = useState<string | null>(null);
  const [swapMode, setSwapMode] = useState(false);
  const [swapSelection, setSwapSelection] = useState<string[]>([]);
  const [swapping, setSwapping] = useState(false);
  const [torneoCanchas, setTorneoCanchas] = useState<TorneoCancha[]>([]);
  const [scoreModalMatch, setScoreModalMatch] = useState<Match | null>(null);
  const [finalizingCategory, setFinalizingCategory] = useState<string | null>(null);
  const [standingsData, setStandingsData] = useState<any>(null);
  const [showStandingsModal, setShowStandingsModal] = useState<string | null>(null);
  const [loadingStandings, setLoadingStandings] = useState(false);

  const categorias = stats?.categorias || [];
  const caballeros = categorias.filter((c) => c.category?.tipo === 'MASCULINO');
  const damas = categorias.filter((c) => c.category?.tipo === 'FEMENINO');

  // Cargar lista de canchas del torneo para el dropdown
  useEffect(() => {
    const loadCanchas = async () => {
      try {
        const data: any = await sedesService.getTorneoCanchas(tournament.id);
        const canchas = Array.isArray(data) ? data : (data?.canchasConfiguradas || data?.torneoCanchas || []);
        setTorneoCanchas(canchas);
      } catch (e) {
        console.error('Error loading canchas for sorteo:', e);
      }
    };
    loadCanchas();
  }, [tournament.id]);

  const handleSortear = async (categoryId: string) => {
    setSorteando(categoryId);
    setMessage('');
    try {
      const result = await matchesService.sortearCategoria(tournament.id, categoryId);
      setMessage(result.message || 'Sorteo realizado exitosamente');
      setMessageType('success');
      await onRefresh();
      // Auto-cargar fixture después del sorteo
      await loadFixture(categoryId);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error al realizar el sorteo');
      setMessageType('error');
    } finally {
      setSorteando(null);
    }
  };

  const loadFixture = async (categoryId: string) => {
    setLoadingFixture(true);
    setSelectedCategory(categoryId);
    setFixtureData([]);
    setMessage('');
    try {
      const data = await matchesService.obtenerFixtureInterno(tournament.id, categoryId);
      if (!data || typeof data !== 'object') {
        setFixtureData([]);
        setMessage('La API devolvió una respuesta vacía');
        setMessageType('error');
        return;
      }

      // El backend devuelve { [categoryId]: { category, rondas: { OCTAVOS: [...], ... } } }
      // Intentar con la key exacta, o con la primera key disponible
      const catData = data[categoryId] || (Object.keys(data).length > 0 ? Object.values(data)[0] as any : null);

      if (catData && catData.rondas) {
        const allMatches = Object.values(catData.rondas).flat() as Match[];
        setFixtureData(allMatches);
        if (allMatches.length === 0) {
          setMessage('El fixture no tiene partidos aún');
          setMessageType('error');
        }
        // Auto-scroll al fixture
        setTimeout(() => {
          fixtureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setFixtureData([]);
        setMessage('No se encontraron partidos para esta categoría');
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('Error loading fixture:', error);
      console.error('Error details:', error.response?.status, error.response?.data);
      setFixtureData([]);
      setMessage(error.response?.data?.message || `Error al cargar fixture: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoadingFixture(false);
    }
  };

  const handlePublicar = async (categoryId: string) => {
    setPublishing(true);
    setMessage('');
    try {
      const result = await matchesService.publicarFixture(tournament.id, categoryId);
      setMessage(result.message || 'Fixture publicado exitosamente');
      setMessageType('success');
      await onRefresh();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error al publicar fixture');
      setMessageType('error');
    } finally {
      setPublishing(false);
    }
  };

  const handleReprogramar = async (matchId: string) => {
    const editData = editingSchedule[matchId];
    if (!editData) return;
    setSavingSchedule(matchId);
    try {
      await matchesService.reprogramarPartido(matchId, {
        fechaProgramada: editData.fechaProgramada,
        horaProgramada: editData.horaProgramada,
        torneoCanchaId: editData.torneoCanchaId || undefined,
      });
      setMessage('Horario actualizado');
      setMessageType('success');
      setEditingSchedule((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      if (selectedCategory) await loadFixture(selectedCategory);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error al reprogramar');
      setMessageType('error');
    } finally {
      setSavingSchedule(null);
    }
  };

  const handleSwapSelect = (matchId: string) => {
    setSwapSelection((prev) => {
      if (prev.includes(matchId)) return prev.filter((id) => id !== matchId);
      if (prev.length >= 2) return [matchId];
      return [...prev, matchId];
    });
  };

  const handleSwapConfirm = async () => {
    if (swapSelection.length !== 2) return;
    setSwapping(true);
    try {
      await matchesService.swapMatchSchedules(swapSelection[0], swapSelection[1]);
      setMessage('Horarios intercambiados exitosamente');
      setMessageType('success');
      setSwapSelection([]);
      setSwapMode(false);
      if (selectedCategory) await loadFixture(selectedCategory);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error al intercambiar horarios');
      setMessageType('error');
    } finally {
      setSwapping(false);
    }
  };

  const handleShowStandings = async (categoryId: string) => {
    setLoadingStandings(true);
    setShowStandingsModal(categoryId);
    try {
      const data = await matchesService.obtenerStandings(tournament.id, categoryId);
      setStandingsData(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar standings');
      setShowStandingsModal(null);
    } finally {
      setLoadingStandings(false);
    }
  };

  const handleFinalizarCategoria = async (categoryId: string) => {
    setFinalizingCategory(categoryId);
    try {
      const result = await matchesService.finalizarCategoria(tournament.id, categoryId);
      toast.success('Categoría finalizada exitosamente. Rankings actualizados.');

      // Mostrar promociones si las hubo
      if (result?.promociones && result.promociones.length > 0) {
        result.promociones.forEach((p: any) => {
          toast.success(
            `⬆️ ${p.nombre}: ${p.categoriaAnterior} → ${p.categoriaNueva}`,
            { duration: 8000, icon: '🏆' }
          );
        });
      }

      setShowStandingsModal(null);
      setStandingsData(null);
      await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al finalizar categoría');
    } finally {
      setFinalizingCategory(null);
    }
  };

  /**
   * Checks if all matches in the currently loaded fixture are finalized.
   * Used to determine whether to show the "Finalizar" button for a category.
   */
  const isCategoryComplete = (categoryId: string): boolean => {
    if (selectedCategory !== categoryId || fixtureData.length === 0) return false;
    // All matches with both parejas assigned must be FINALIZADO or WO
    const matchesConParejas = fixtureData.filter((m) => m.pareja1Id);
    if (matchesConParejas.length === 0) return false;
    return matchesConParejas.every((m) => m.estado === 'FINALIZADO' || m.estado === 'WO' || m.estado === 'CANCELADO');
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      INSCRIPCIONES_ABIERTAS: { bg: 'bg-green-900/30', text: 'text-green-400', label: 'Inscripciones Abiertas' },
      INSCRIPCIONES_CERRADAS: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', label: 'Listas para Sorteo' },
      FIXTURE_BORRADOR: { bg: 'bg-orange-900/30', text: 'text-orange-400', label: 'Fixture Borrador' },
      SORTEO_REALIZADO: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'Fixture Publicado' },
      EN_CURSO: { bg: 'bg-purple-900/30', text: 'text-purple-400', label: 'En Curso' },
      FINALIZADA: { bg: 'bg-gray-900/30', text: 'text-gray-400', label: 'Finalizada' },
    };
    const c = config[estado] || config.INSCRIPCIONES_ABIERTAS;
    return <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const hasCanchas = (stats?.canchasConfiguradas || 0) > 0;

  const canSortear = (tc: TournamentCategory & { inscripcionesCount: number }) => {
    return (
      (tc.estado === 'INSCRIPCIONES_CERRADAS' || tc.estado === 'FIXTURE_BORRADOR') &&
      tc.inscripcionesCount >= 2 &&
      ['PUBLICADO', 'EN_CURSO'].includes(tournament.estado) &&
      hasCanchas
    );
  };

  const getParejaLabel = (pareja?: Pareja) => {
    if (!pareja) return 'TBD';
    const j1 = pareja.jugador1;
    const j2 = pareja.jugador2;
    if (!j1) return 'TBD';
    return `${j1.nombre?.charAt(0)}. ${j1.apellido} / ${j2 ? `${j2.nombre?.charAt(0)}. ${j2.apellido}` : 'TBD'}`;
  };

  const renderCategoriaRow = (tc: TournamentCategory & { inscripcionesCount: number }) => (
    <div key={tc.id} className="p-3 sm:p-4 rounded-lg border border-dark-border bg-dark-card space-y-2 sm:space-y-0">
      <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
        <div className="min-w-0">
          <p className="font-medium text-sm sm:text-base">{tc.category?.nombre}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {getEstadoBadge(tc.estado)}
            <span className="text-xs text-light-secondary">{tc.inscripcionesCount} parejas</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
          {canSortear(tc) && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSortear(tc.categoryId)}
              loading={sorteando === tc.categoryId}
              disabled={sorteando !== null}
              className="text-xs sm:text-sm"
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> {tc.estado === 'FIXTURE_BORRADOR' ? 'Re-Sortear' : 'Sortear'}
            </Button>
          )}
          {['FIXTURE_BORRADOR', 'SORTEO_REALIZADO', 'EN_CURSO'].includes(tc.estado) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadFixture(tc.categoryId)}
              loading={loadingFixture && selectedCategory === tc.categoryId}
              className="text-xs sm:text-sm"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> Fixture
            </Button>
          )}
          {tc.estado === 'FIXTURE_BORRADOR' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handlePublicar(tc.categoryId)}
              loading={publishing}
              className="text-xs sm:text-sm"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> Publicar
            </Button>
          )}
          {tc.estado === 'INSCRIPCIONES_ABIERTAS' && (
            <span className="text-xs text-yellow-400">Cierra inscripciones primero</span>
          )}
          {tc.estado === 'INSCRIPCIONES_CERRADAS' && tc.inscripcionesCount < 2 && (
            <span className="text-xs text-red-400">Min. 2 parejas</span>
          )}
          {(tc.estado === 'INSCRIPCIONES_CERRADAS' || tc.estado === 'FIXTURE_BORRADOR') && tc.inscripcionesCount >= 2 && !hasCanchas && (
            <span className="text-xs text-orange-400">Configura canchas primero</span>
          )}
          {['SORTEO_REALIZADO', 'EN_CURSO'].includes(tc.estado) && isCategoryComplete(tc.categoryId) && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleShowStandings(tc.categoryId)}
              loading={loadingStandings && showStandingsModal === tc.categoryId}
              className="text-xs sm:text-sm"
            >
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> Finalizar
            </Button>
          )}
          {tc.estado === 'FINALIZADA' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Finalizada
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-2">Sorteo y Fixture por Categoria</h3>
        <p className="text-sm text-light-secondary mb-4">
          Cierra inscripciones → Sortear (genera fixture borrador con seeding) → Revisar/Editar → Publicar.
          Las demas categorias pueden seguir recibiendo inscripciones.
        </p>

        {!hasCanchas && (
          <div className="p-3 rounded-md text-sm mb-4 bg-orange-900/30 text-orange-400 border border-orange-500/50 flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>Necesitas configurar <strong>canchas y horarios</strong> en la pestaña &quot;Canchas y Horarios&quot; antes de poder realizar el sorteo.</span>
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-md text-sm mb-4 ${
            messageType === 'error'
              ? 'bg-red-900/30 text-red-400 border border-red-500/50'
              : 'bg-green-900/30 text-green-400 border border-green-500/50'
          }`}>
            {message}
          </div>
        )}

        {categorias.length === 0 ? (
          <div className="text-center py-8 text-light-secondary">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay categorias configuradas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {caballeros.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-light-secondary uppercase tracking-wide mb-3">Caballeros</h4>
                <div className="space-y-2">{caballeros.map(renderCategoriaRow)}</div>
              </div>
            )}
            {damas.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-light-secondary uppercase tracking-wide mb-3">Damas</h4>
                <div className="space-y-2">{damas.map(renderCategoriaRow)}</div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Vista del Fixture */}
      {selectedCategory && (loadingFixture || fixtureData.length > 0) && (
        <Card className="p-4 sm:p-6" ref={fixtureRef}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="font-bold text-base sm:text-lg">
              Fixture
              {(() => {
                const cat = categorias.find(c => c.categoryId === selectedCategory);
                return cat ? ` — ${cat.category?.nombre}` : '';
              })()}
            </h3>
            <div className="flex gap-2 items-center flex-shrink-0">
              {isPremium ? (
                <Button
                  variant={swapMode ? 'danger' : 'outline'}
                  size="sm"
                  onClick={() => { setSwapMode(!swapMode); setSwapSelection([]); }}
                  className="text-xs sm:text-sm"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">{swapMode ? 'Cancelar Swap' : 'Intercambiar Horarios'}</span>
                  <span className="sm:hidden">{swapMode ? 'Cancelar' : 'Swap'}</span>
                </Button>
              ) : (
                <span className="text-xs text-light-secondary flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Swap Premium
                </span>
              )}
            </div>
          </div>

          {/* Bracket visual */}
          {loadingFixture ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" />
            </div>
          ) : fixtureData.length > 0 ? (
            <BracketView matches={fixtureData} onMatchClick={setScoreModalMatch} />
          ) : (
            <div className="text-center py-8 text-light-secondary">
              <p>No se encontraron partidos para esta categoría</p>
            </div>
          )}

          {/* Swap preview */}
          {swapMode && swapSelection.length === 2 && (
            <div className="mt-4 p-3 sm:p-4 bg-amber-900/30 border border-amber-500/50 rounded-lg">
              <p className="text-xs sm:text-sm text-amber-400 mb-3">Intercambiar horarios:</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 text-sm mb-3">
                <div className="flex-1 p-2 bg-dark-surface rounded text-xs sm:text-sm">
                  {(() => {
                    const m = fixtureData.find((m) => m.id === swapSelection[0]);
                    if (!m) return '';
                    const canchaName = m.torneoCancha?.sedeCancha?.nombre || 'Sin cancha';
                    return `${getParejaLabel(m.pareja1)} vs ${getParejaLabel(m.pareja2)} — ${canchaName} ${m.horaProgramada || 'Sin hora'}`;
                  })()}
                </div>
                <ArrowRightLeft className="w-5 h-5 text-amber-400 self-center rotate-90 sm:rotate-0 flex-shrink-0" />
                <div className="flex-1 p-2 bg-dark-surface rounded text-xs sm:text-sm">
                  {(() => {
                    const m = fixtureData.find((m) => m.id === swapSelection[1]);
                    if (!m) return '';
                    const canchaName = m.torneoCancha?.sedeCancha?.nombre || 'Sin cancha';
                    return `${getParejaLabel(m.pareja1)} vs ${getParejaLabel(m.pareja2)} — ${canchaName} ${m.horaProgramada || 'Sin hora'}`;
                  })()}
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={handleSwapConfirm} loading={swapping}>
                Confirmar Intercambio
              </Button>
            </div>
          )}

          {/* Grilla editable de partidos */}
          {fixtureData.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3 text-sm sm:text-base">Grilla de Partidos</h4>

            {/* Desktop: table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    {swapMode && <th className="py-2 px-3 text-center w-10"></th>}
                    <th className="py-2 px-3 text-left">Ronda</th>
                    <th className="py-2 px-3 text-left">Pareja 1</th>
                    <th className="py-2 px-3 text-left">Pareja 2</th>
                    <th className="py-2 px-3 text-left">Cancha</th>
                    <th className="py-2 px-3 text-left">Fecha</th>
                    <th className="py-2 px-3 text-left">Hora</th>
                    <th className="py-2 px-3 text-left">Estado</th>
                    <th className="py-2 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fixtureData.map((match) => {
                    const isEditing = !!editingSchedule[match.id];
                    const isSelected = swapSelection.includes(match.id);
                    return (
                      <tr
                        key={match.id}
                        className={`border-b border-dark-border ${isSelected ? 'bg-amber-900/20' : ''} ${swapMode ? 'cursor-pointer hover:bg-dark-hover' : ''}`}
                        onClick={swapMode ? () => handleSwapSelect(match.id) : undefined}
                      >
                        {swapMode && (
                          <td className="py-2 px-3 text-center">
                            <input type="checkbox" checked={isSelected} readOnly className="rounded" />
                          </td>
                        )}
                        <td className="py-2 px-3 font-medium">{
                          {
                            ACOMODACION_1: 'Acomodación 1',
                            ACOMODACION_2: 'Acomodación 2',
                            DIECISEISAVOS: 'Dieciseisavos',
                            OCTAVOS: 'Octavos',
                            CUARTOS: 'Cuartos',
                            SEMIFINAL: 'Semifinal',
                            FINAL: 'Final',
                          }[match.ronda] || match.ronda
                        }</td>
                        <td className="py-2 px-3">{getParejaLabel(match.pareja1)}</td>
                        <td className="py-2 px-3">{getParejaLabel(match.pareja2)}</td>
                        <td className="py-2 px-3">
                          {isEditing ? (
                            <select
                              value={editingSchedule[match.id]?.torneoCanchaId || ''}
                              onChange={(e) => setEditingSchedule((prev) => ({
                                ...prev,
                                [match.id]: { ...prev[match.id], torneoCanchaId: e.target.value },
                              }))}
                              className="text-sm bg-dark-surface border border-dark-border rounded px-2 py-1 text-light-text max-w-[140px]"
                            >
                              <option value="">Sin cancha</option>
                              {torneoCanchas.map((tc) => (
                                <option key={tc.id} value={tc.id}>
                                  {tc.sedeCancha?.nombre || tc.sedeCanchaId}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs">
                              {match.torneoCancha?.sedeCancha?.nombre || 'Sin cancha'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editingSchedule[match.id]?.fechaProgramada || ''}
                              onChange={(e) => setEditingSchedule((prev) => ({
                                ...prev,
                                [match.id]: { ...prev[match.id], fechaProgramada: e.target.value },
                              }))}
                              className="text-sm bg-dark-surface border border-dark-border rounded px-2 py-1 text-light-text"
                            />
                          ) : (
                            match.fechaProgramada ? new Date(match.fechaProgramada).toLocaleDateString() : 'Sin fecha'
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {isEditing ? (
                            <input
                              type="time"
                              value={editingSchedule[match.id]?.horaProgramada || ''}
                              onChange={(e) => setEditingSchedule((prev) => ({
                                ...prev,
                                [match.id]: { ...prev[match.id], horaProgramada: e.target.value },
                              }))}
                              className="text-sm bg-dark-surface border border-dark-border rounded px-2 py-1 text-light-text"
                            />
                          ) : (
                            match.horaProgramada || 'Sin hora'
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            match.estado === 'FINALIZADO' ? 'bg-green-900/30 text-green-400' :
                            match.estado === 'WO' ? 'bg-red-900/30 text-red-400' :
                            'bg-gray-900/30 text-gray-400'
                          }`}>
                            {match.estado === 'WO' ? 'BYE' : match.estado}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex gap-1 justify-center">
                          {!swapMode && match.estado !== 'FINALIZADO' && match.estado !== 'WO' && (
                            isEditing ? (
                              <>
                                <Button size="sm" variant="primary" onClick={() => handleReprogramar(match.id)} loading={savingSchedule === match.id}>
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingSchedule((prev) => {
                                  const next = { ...prev };
                                  delete next[match.id];
                                  return next;
                                })}>
                                  ✕
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setEditingSchedule((prev) => ({
                                ...prev,
                                [match.id]: {
                                  fechaProgramada: match.fechaProgramada?.split('T')[0] || '',
                                  horaProgramada: match.horaProgramada || '',
                                  torneoCanchaId: match.torneoCanchaId || '',
                                },
                              }))}>
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            )
                          )}
                          {match.pareja1Id && match.pareja2Id
                            && match.estado !== 'FINALIZADO' && match.estado !== 'WO' && match.estado !== 'CANCELADO'
                            && !swapMode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setScoreModalMatch(match)}
                              title="Cargar resultado"
                              className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                            >
                              <ClipboardCheck className="w-3 h-3" />
                            </Button>
                          )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: card view */}
            <div className="md:hidden space-y-2">
              {fixtureData.map((match) => {
                const isEditing = !!editingSchedule[match.id];
                const isSelected = swapSelection.includes(match.id);
                const rondaLabel: Record<string, string> = {
                  ACOMODACION_1: 'Acom. 1', ACOMODACION_2: 'Acom. 2',
                  DIECISEISAVOS: '16avos', OCTAVOS: '8vos',
                  CUARTOS: '4tos', SEMIFINAL: 'Semi', FINAL: 'Final',
                };
                return (
                  <div
                    key={match.id}
                    className={`p-3 rounded-lg border bg-dark-card ${isSelected ? 'border-amber-500/50 bg-amber-900/20' : 'border-dark-border'} ${swapMode ? 'cursor-pointer active:bg-dark-hover' : ''}`}
                    onClick={swapMode ? () => handleSwapSelect(match.id) : undefined}
                  >
                    {/* Top row: ronda + estado + swap checkbox */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {swapMode && <input type="checkbox" checked={isSelected} readOnly className="rounded" />}
                        <span className="text-xs font-semibold text-primary-400">{rondaLabel[match.ronda] || match.ronda}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        match.estado === 'FINALIZADO' ? 'bg-green-900/30 text-green-400' :
                        match.estado === 'WO' ? 'bg-red-900/30 text-red-400' :
                        'bg-gray-900/30 text-gray-400'
                      }`}>
                        {match.estado === 'WO' ? 'BYE' : match.estado}
                      </span>
                    </div>

                    {/* Parejas */}
                    <div className="text-sm space-y-0.5 mb-2">
                      <p className={`truncate ${match.parejaGanadoraId === match.pareja1Id ? 'font-semibold text-green-400' : ''}`}>
                        {getParejaLabel(match.pareja1)}
                      </p>
                      <p className="text-light-secondary text-xs">vs</p>
                      <p className={`truncate ${match.parejaGanadoraId === match.pareja2Id ? 'font-semibold text-green-400' : ''}`}>
                        {getParejaLabel(match.pareja2)}
                      </p>
                    </div>

                    {/* Schedule info */}
                    {isEditing ? (
                      <div className="space-y-2 mb-2">
                        <select
                          value={editingSchedule[match.id]?.torneoCanchaId || ''}
                          onChange={(e) => setEditingSchedule((prev) => ({
                            ...prev,
                            [match.id]: { ...prev[match.id], torneoCanchaId: e.target.value },
                          }))}
                          className="w-full text-xs bg-dark-surface border border-dark-border rounded px-2 py-1.5 text-light-text"
                        >
                          <option value="">Sin cancha</option>
                          {torneoCanchas.map((tc) => (
                            <option key={tc.id} value={tc.id}>{tc.sedeCancha?.nombre || tc.sedeCanchaId}</option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={editingSchedule[match.id]?.fechaProgramada || ''}
                            onChange={(e) => setEditingSchedule((prev) => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], fechaProgramada: e.target.value },
                            }))}
                            className="text-xs bg-dark-surface border border-dark-border rounded px-2 py-1.5 text-light-text"
                          />
                          <input
                            type="time"
                            value={editingSchedule[match.id]?.horaProgramada || ''}
                            onChange={(e) => setEditingSchedule((prev) => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], horaProgramada: e.target.value },
                            }))}
                            className="text-xs bg-dark-surface border border-dark-border rounded px-2 py-1.5 text-light-text"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-xs text-light-secondary mb-2">
                        <span>{match.torneoCancha?.sedeCancha?.nombre || 'Sin cancha'}</span>
                        <span>{match.fechaProgramada ? new Date(match.fechaProgramada).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' }) : 'Sin fecha'}</span>
                        <span>{match.horaProgramada || 'Sin hora'}</span>
                      </div>
                    )}

                    {/* Actions */}
                    {!swapMode && (
                      <div className="flex gap-1.5">
                        {match.estado !== 'FINALIZADO' && match.estado !== 'WO' && (
                          isEditing ? (
                            <>
                              <Button size="sm" variant="primary" onClick={() => handleReprogramar(match.id)} loading={savingSchedule === match.id} className="text-xs flex-1">
                                <Save className="w-3 h-3 mr-1" /> Guardar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingSchedule((prev) => {
                                const next = { ...prev };
                                delete next[match.id];
                                return next;
                              })} className="text-xs">
                                ✕
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setEditingSchedule((prev) => ({
                              ...prev,
                              [match.id]: {
                                fechaProgramada: match.fechaProgramada?.split('T')[0] || '',
                                horaProgramada: match.horaProgramada || '',
                                torneoCanchaId: match.torneoCanchaId || '',
                              },
                            }))} className="text-xs">
                              <Edit3 className="w-3 h-3 mr-1" /> Editar
                            </Button>
                          )
                        )}
                        {match.pareja1Id && match.pareja2Id
                          && match.estado !== 'FINALIZADO' && match.estado !== 'WO' && match.estado !== 'CANCELADO' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setScoreModalMatch(match)}
                            className="text-xs text-green-400 border-green-500/30 hover:bg-green-500/10"
                          >
                            <ClipboardCheck className="w-3 h-3 mr-1" /> Resultado
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </Card>
      )}

      {/* Score Modal para cargar resultados */}
      {scoreModalMatch && (
        <ScoreModal
          isOpen={!!scoreModalMatch}
          onClose={() => setScoreModalMatch(null)}
          match={scoreModalMatch}
          onResultSaved={() => {
            if (selectedCategory) loadFixture(selectedCategory);
            setScoreModalMatch(null);
          }}
        />
      )}

      {/* Modal de Standings + Confirmar Finalización */}
      {showStandingsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setShowStandingsModal(null); setStandingsData(null); }}>
          <div className="bg-dark-card rounded-xl border border-dark-border max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Finalizar Categoría
              </h3>
              <p className="text-sm text-light-secondary mb-4">
                {(() => {
                  const cat = categorias.find((c) => c.categoryId === showStandingsModal);
                  return cat?.category?.nombre || '';
                })()}
              </p>

              {loadingStandings ? (
                <div className="flex justify-center py-8"><Loading size="lg" /></div>
              ) : standingsData?.standings ? (
                <>
                  <div className="space-y-2 mb-4">
                    {standingsData.standings.map((entry: any, idx: number) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${
                        entry.orden === 1 ? 'border-amber-500/50 bg-amber-900/20' :
                        entry.orden === 2 ? 'border-gray-400/50 bg-gray-900/20' :
                        'border-dark-border bg-dark-surface'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            entry.orden === 1 ? 'bg-amber-500/30 text-amber-400' :
                            entry.orden === 2 ? 'bg-gray-500/30 text-gray-300' :
                            'bg-dark-card text-light-secondary'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">
                              {entry.pareja?.jugador1 ? `${entry.pareja.jugador1.nombre} ${entry.pareja.jugador1.apellido}` : ''}
                              {entry.pareja?.jugador2 ? ` / ${entry.pareja.jugador2.nombre} ${entry.pareja.jugador2.apellido}` : ''}
                            </p>
                            <p className="text-xs text-light-secondary">{entry.posicion}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${
                          entry.orden === 1 ? 'text-amber-400' : entry.orden === 2 ? 'text-gray-300' : 'text-light-secondary'
                        }`}>
                          +{entry.puntos} pts
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-orange-900/30 border border-orange-500/50 rounded-lg mb-4">
                    <p className="text-sm text-orange-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      Esta acción asignará los puntos a los rankings y no se puede deshacer.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setShowStandingsModal(null); setStandingsData(null); }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleFinalizarCategoria(showStandingsModal)}
                      loading={finalizingCategory === showStandingsModal}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar Finalización
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-light-secondary text-center py-4">No hay datos disponibles</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
