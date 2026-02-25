import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Loading } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';
import { sedesService } from '@/services';
import { matchesService } from '@/services/matchesService';
import inscripcionesService from '@/services/inscripcionesService';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import type { Tournament, TournamentCategory, TorneoCancha, Match, Pareja, Inscripcion } from '@/types';
import { BracketView } from '@/features/matches/components/BracketView';
import { ScoreModal } from '@/features/matches/components/ScoreModal';
import { CanchasTab } from '@/features/tournaments/components/CanchasTab';
import { FinanzasTab } from '@/features/tournaments/components/finanzas/FinanzasTab';
import { ResumenTab } from '@/features/tournaments/components/resumen/ResumenTab';
import {
  ArrowLeft,
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
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'resumen' | 'editar' | 'inscripciones' | 'finanzas' | 'sorteo' | 'canchas' | 'ayudantes' | 'acreditacion' | 'reportes';

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
    { key: 'finanzas', label: 'Finanzas', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'sorteo', label: 'Sorteo', icon: <Trophy className="w-4 h-4" /> },
    { key: 'canchas', label: 'Canchas y Horarios', icon: <Layers className="w-4 h-4" /> },
    { key: 'ayudantes', label: 'Ayudantes', icon: <UserPlus className="w-4 h-4" /> },
    { key: 'acreditacion', label: 'Acreditación', icon: <ClipboardCheck className="w-4 h-4" /> },
    { key: 'reportes', label: 'Reportes', icon: <FileText className="w-4 h-4" /> },
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
        {activeTab === 'inscripciones' && <InscripcionesTab stats={stats} onToggle={handleToggleInscripcion} togglingCategory={togglingCategory} tournament={tournament} onRefresh={loadData} />}
        {activeTab === 'finanzas' && <FinanzasTab tournament={tournament} />}
        {activeTab === 'sorteo' && <SorteoTab tournament={tournament} stats={stats} onRefresh={loadData} isPremium={user?.esPremium || false} />}
        {activeTab === 'canchas' && <CanchasTab tournament={tournament} stats={stats} onSaved={loadData} />}
        {activeTab === 'ayudantes' && <AyudantesTab tournament={tournament} />}
        {activeTab === 'acreditacion' && <AcreditacionTab tournament={tournament} />}
        {activeTab === 'reportes' && <ReportesTab tournament={tournament} isPremium={isPremium} />}
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

function InscripcionesTab({ stats, onToggle, togglingCategory, tournament, onRefresh }: { stats: TournamentStats | null; onToggle: (id: string) => void; togglingCategory: string | null; tournament: Tournament; onRefresh: () => Promise<void> }) {
  const categorias = stats?.categorias || [];
  const [closingAll, setClosingAll] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const openCount = categorias.filter((c) => c.inscripcionAbierta && c.estado === 'INSCRIPCIONES_ABIERTAS').length;

  const handleCerrarTodas = async () => {
    setClosingAll(true);
    try {
      const result = await tournamentsService.cerrarTodasLasInscripciones(tournament.id);
      toast.success(result.message);
      setShowConfirmClose(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cerrar inscripciones');
    } finally {
      setClosingAll(false);
    }
  };

  // Inscription deadline info
  const deadline = tournament.fechaLimiteInscr ? new Date(tournament.fechaLimiteInscr) : null;
  const deadlinePassed = deadline ? new Date() > deadline : false;

  return (
    <Card className="p-6">
      {/* Deadline alert */}
      {deadline && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${deadlinePassed ? 'bg-red-900/30 border border-red-500/50' : 'bg-blue-900/30 border border-blue-500/50'}`}>
          <Clock className={`w-5 h-5 flex-shrink-0 ${deadlinePassed ? 'text-red-400' : 'text-blue-400'}`} />
          <div>
            <p className={`text-sm font-medium ${deadlinePassed ? 'text-red-400' : 'text-blue-400'}`}>
              {deadlinePassed ? 'Fecha límite vencida' : 'Fecha límite de inscripción'}
            </p>
            <p className={`text-xs ${deadlinePassed ? 'text-red-400/70' : 'text-blue-400/70'}`}>
              {formatDate(tournament.fechaLimiteInscr)}
              {deadlinePassed && ' — Las nuevas inscripciones serán rechazadas automáticamente'}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Gestión de Inscripciones por Categoría</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-light-secondary">Total: {stats?.inscripcionesTotal || 0} parejas inscritas</span>
          {openCount > 0 && (
            <button
              onClick={() => setShowConfirmClose(true)}
              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Cerrar Todas ({openCount})
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-light-secondary mb-6">Habilita o deshabilita las inscripciones para cada categoría individualmente.</p>

      {/* Confirm close all modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirmClose(false)}>
          <div className="bg-dark-card rounded-xl border border-dark-border max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                Cerrar Todas las Inscripciones
              </h3>
              <p className="text-sm text-light-secondary mb-4">
                ¿Estás seguro de que deseas cerrar las inscripciones de las <strong>{openCount} categoría(s)</strong> que están abiertas?
              </p>
              <p className="text-xs text-light-secondary mb-4">
                Las categorías que ya tienen sorteo o están en curso no serán afectadas. Puedes reabrir categorías individualmente después.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmClose(false)}>Cancelar</Button>
                <Button variant="primary" className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleCerrarTodas} loading={closingAll}>
                  <Lock className="w-4 h-4 mr-1" /> Cerrar Todas
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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

// CanchasTab extracted to: @/features/tournaments/components/CanchasTab.tsx

// ===================== TAB: AYUDANTES =====================

function AyudantesTab({ tournament }: { tournament: Tournament }) {
  const { user } = useAuthStore();
  const isPremiumOrAdmin = user?.esPremium || useAuthStore.getState().hasRole('admin');
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

  if (!isPremiumOrAdmin) {
    return (
      <div className="text-center py-12">
        <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-dark-text mb-2">Función Premium</h3>
        <p className="text-dark-textSecondary mb-4 max-w-md mx-auto">
          Agrega ayudantes y árbitros a tu torneo para que te ayuden a cargar resultados.
        </p>
        <Link to="/premium">
          <Button className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold">
            <Crown className="h-4 w-4 mr-2" /> Activar Premium - $3/mes
          </Button>
        </Link>
      </div>
    );
  }

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

// ===================== TAB: ACREDITACIÓN (Mesa de Acreditación) =====================

function AcreditacionTab({ tournament }: { tournament: Tournament }) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('todas');
  const [filterEstado, setFilterEstado] = useState<'todas' | 'pendientes' | 'confirmadas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [presenteIds, setPresenteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadInscripciones();
  }, [tournament.id]);

  const loadInscripciones = async () => {
    try {
      const data = await inscripcionesService.getByTournament(tournament.id);
      setInscripciones(data);
      // Auto-mark confirmed ones as presente by default (can be toggled)
      const confirmed = new Set(data.filter((i) => i.estado === 'CONFIRMADA').map((i) => i.id));
      setPresenteIds(confirmed);
    } catch (err) {
      console.error('Error loading inscripciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarRapido = async (inscripcionId: string) => {
    setProcessingId(inscripcionId);
    try {
      await inscripcionesService.confirmarPago(tournament.id, inscripcionId);
      toast.success('Pago confirmado');
      setPresenteIds((prev) => new Set(prev).add(inscripcionId));
      await loadInscripciones();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al confirmar');
    } finally {
      setProcessingId(null);
    }
  };

  const togglePresente = (id: string) => {
    setPresenteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get unique categories from inscriptions
  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    inscripciones.forEach((i) => {
      if (i.category) cats.set(i.categoryId, i.category.nombre);
    });
    return Array.from(cats.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [inscripciones]);

  const filteredInscripciones = useMemo(() => {
    let result = inscripciones;

    // Filter out cancelled
    result = result.filter((i) => i.estado !== 'CANCELADA');

    if (filterCategory !== 'todas') {
      result = result.filter((i) => i.categoryId === filterCategory);
    }

    if (filterEstado === 'pendientes') {
      result = result.filter((i) => ['PENDIENTE_PAGO', 'PENDIENTE_CONFIRMACION', 'PENDIENTE_PAGO_PRESENCIAL'].includes(i.estado));
    } else if (filterEstado === 'confirmadas') {
      result = result.filter((i) => i.estado === 'CONFIRMADA');
    }

    if (searchTerm.trim()) {
      const search = searchTerm.trim().toLowerCase();
      result = result.filter((insc) => {
        const j1 = insc.pareja?.jugador1;
        const j2 = insc.pareja?.jugador2;
        const j1Name = j1 ? `${j1.nombre} ${j1.apellido}`.toLowerCase() : '';
        const j2Name = j2 ? `${j2.nombre} ${j2.apellido}`.toLowerCase() : '';
        const j1Doc = j1?.documento?.toLowerCase() || '';
        const j2Doc = j2?.documento?.toLowerCase() || insc.pareja?.jugador2Documento?.toLowerCase() || '';
        return j1Name.includes(search) || j2Name.includes(search) || j1Doc.includes(search) || j2Doc.includes(search);
      });
    }

    return result;
  }, [inscripciones, filterCategory, filterEstado, searchTerm]);

  const totalPresentes = filteredInscripciones.filter((i) => presenteIds.has(i.id)).length;

  if (loading) {
    return <div className="flex justify-center py-12"><Loading size="lg" text="Cargando acreditación..." /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xl font-bold text-green-400">{totalPresentes}</p>
          <p className="text-[10px] text-light-secondary">Presentes</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold text-yellow-400">{filteredInscripciones.length - totalPresentes}</p>
          <p className="text-[10px] text-light-secondary">Pendientes</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold text-light-text">{filteredInscripciones.length}</p>
          <p className="text-[10px] text-light-secondary">Total</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-secondary" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o cédula..."
          className="w-full pl-10 pr-4 py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg text-xs text-light-text focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="todas">Todas las categorías</option>
          {categories.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {(['todas', 'pendientes', 'confirmadas'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterEstado(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterEstado === f ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Inscriptions list — card layout optimized for tablet/mobile */}
      <div className="space-y-2">
        {filteredInscripciones.length === 0 ? (
          <Card className="p-8 text-center">
            <ClipboardCheck className="w-12 h-12 text-light-secondary mx-auto mb-3 opacity-50" />
            <p className="text-light-secondary">No hay inscripciones para mostrar</p>
          </Card>
        ) : (
          filteredInscripciones.map((insc) => {
            const j1 = insc.pareja?.jugador1;
            const j2 = insc.pareja?.jugador2;
            const isPresente = presenteIds.has(insc.id);
            const isPendiente = ['PENDIENTE_PAGO', 'PENDIENTE_CONFIRMACION', 'PENDIENTE_PAGO_PRESENCIAL'].includes(insc.estado);

            return (
              <Card
                key={insc.id}
                className={`p-3 transition-colors ${isPresente ? 'border-green-500/30 bg-green-900/10' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox presente */}
                  <button
                    onClick={() => togglePresente(insc.id)}
                    className={`w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isPresente
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-dark-border hover:border-primary-500'
                    }`}
                  >
                    {isPresente && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {j1 ? `${j1.nombre} ${j1.apellido}` : '—'}
                      </p>
                      <span className="text-[10px] text-light-secondary bg-dark-surface px-1.5 py-0.5 rounded">
                        {insc.category?.nombre?.replace(' Caballeros', ' ♂').replace(' Damas', ' ♀') || '—'}
                      </span>
                    </div>
                    <p className="text-xs text-light-secondary truncate">
                      {j2 ? `${j2.nombre} ${j2.apellido}` : insc.pareja?.jugador2Documento || '—'}
                    </p>
                  </div>

                  {/* Estado + Action */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {insc.estado === 'CONFIRMADA' ? (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-green-900/30 text-green-400 font-medium">
                        Pagó
                      </span>
                    ) : isPendiente ? (
                      <button
                        onClick={() => handleConfirmarRapido(insc.id)}
                        disabled={processingId === insc.id}
                        className="px-2.5 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        {processingId === insc.id ? '...' : '✓ Pago'}
                      </button>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-red-900/30 text-red-400">
                        {insc.estado.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// ===================== TAB: REPORTES =====================

function ReportesTab({ tournament, isPremium }: { tournament: Tournament; isPremium: boolean }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: 'resultados' | 'financiero' | 'asistencia') => {
    setDownloading(type);
    try {
      if (type === 'resultados') {
        await tournamentsService.downloadReporteResultados(tournament.id);
      } else if (type === 'financiero') {
        await tournamentsService.downloadReporteFinanciero(tournament.id);
      } else {
        await tournamentsService.downloadReporteAsistencia(tournament.id);
      }
      toast.success('Reporte descargado');
    } catch (error: any) {
      console.error('Error downloading report:', error);
      toast.error(error?.response?.data?.message || 'Error al descargar el reporte');
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      key: 'resultados' as const,
      title: 'Resultados del Torneo',
      description: 'Bracket completo con campeones, finalistas y semifinalistas por categoría. Incluye tabla de resultados con scores.',
      format: 'PDF',
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
      formatIcon: <FileText className="w-4 h-4" />,
      color: 'border-yellow-500/30 bg-yellow-900/10',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      premium: false,
      requiresState: ['EN_CURSO', 'FINALIZADO'] as string[],
    },
    {
      key: 'financiero' as const,
      title: 'Reporte Financiero',
      description: 'Resumen de ingresos, comisiones y neto. Desglose por categoría con inscripciones confirmadas, pendientes y rechazadas.',
      format: 'Excel',
      icon: <DollarSign className="w-6 h-6 text-green-400" />,
      formatIcon: <FileSpreadsheet className="w-4 h-4" />,
      color: 'border-green-500/30 bg-green-900/10',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      premium: false,
      requiresState: [] as string[],
    },
    {
      key: 'asistencia' as const,
      title: 'Reporte de Asistencia',
      description: 'Listado de parejas confirmadas por categoría con estadísticas de partidos jugados, ganados y efectividad.',
      format: 'Excel',
      icon: <Users className="w-6 h-6 text-blue-400" />,
      formatIcon: <FileSpreadsheet className="w-4 h-4" />,
      color: 'border-blue-500/30 bg-blue-900/10',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      premium: false,
      requiresState: [] as string[],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-light-text">Reportes del Torneo</h3>
        <p className="text-sm text-light-secondary mt-1">
          Descarga reportes en PDF o Excel con la información del torneo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const isDisabled = report.requiresState.length > 0 && !report.requiresState.includes(tournament.estado);
          const isLocked = report.premium && !isPremium;
          const isDownloading = downloading === report.key;

          return (
            <Card
              key={report.key}
              className={`p-5 border ${report.color} ${isDisabled ? 'opacity-50' : ''} transition-all`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-dark-surface rounded-lg">
                  {report.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-light-text">{report.title}</h4>
                    {isLocked && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-indigo-900/40 text-indigo-300 rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Premium
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium bg-dark-surface text-light-secondary rounded">
                    {report.formatIcon} {report.format}
                  </span>
                </div>
              </div>

              <p className="text-sm text-light-secondary mb-4 leading-relaxed">
                {report.description}
              </p>

              {isDisabled ? (
                <div className="flex items-center gap-2 text-xs text-light-secondary">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span>Disponible cuando el torneo esté en curso o finalizado</span>
                </div>
              ) : isLocked ? (
                <div className="flex items-center gap-2 text-xs text-indigo-300">
                  <Lock className="w-4 h-4" />
                  <span>Actualiza a Premium para descargar</span>
                </div>
              ) : (
                <button
                  onClick={() => handleDownload(report.key)}
                  disabled={isDownloading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${report.buttonColor} disabled:opacity-50`}
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Descargar {report.format}
                    </>
                  )}
                </button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Additional quick downloads section */}
      <Card className="p-5 border border-dark-border">
        <h4 className="font-semibold text-light-text mb-3">Otros Reportes</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={async () => {
              try {
                await tournamentsService.exportInscripcionesExcel(tournament.id);
                toast.success('Excel de inscripciones descargado');
              } catch (error) {
                toast.error('Error al descargar inscripciones');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-light-text bg-dark-surface hover:bg-dark-hover border border-dark-border rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Inscripciones (Excel)
          </button>
          <button
            onClick={async () => {
              try {
                await tournamentsService.downloadReportePartidos(tournament.id);
                toast.success('Excel de partidos descargado');
              } catch {
                toast.error('Error al descargar partidos');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-light-text bg-dark-surface hover:bg-dark-hover border border-dark-border rounded-lg transition-colors"
          >
            <Calendar className="w-4 h-4 text-orange-400" />
            Partidos por Sede (Excel)
          </button>
        </div>
      </Card>
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

  // Multi-select sorteo
  const [selectedForSorteo, setSelectedForSorteo] = useState<Set<string>>(new Set());
  const [showDateModal, setShowDateModal] = useState(false);
  const [sorteoFechaInicio, setSorteoFechaInicio] = useState('');
  const [sorteoTargetCategories, setSorteoTargetCategories] = useState<string[]>([]);
  const [sorteoProgress, setSorteoProgress] = useState<{ current: number; total: number; currentName: string } | null>(null);

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

  // Helper: fecha de hoy en YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const openDateModal = (categoryIds: string[]) => {
    setSorteoTargetCategories(categoryIds);
    // Default: fecha inicio del torneo, o hoy si no hay
    const defaultDate = tournament.fechaInicio
      ? new Date(tournament.fechaInicio).toISOString().slice(0, 10)
      : todayStr;
    // No permitir fecha anterior a hoy
    setSorteoFechaInicio(defaultDate >= todayStr ? defaultDate : todayStr);
    setShowDateModal(true);
  };

  const handleSortear = (categoryId: string) => {
    openDateModal([categoryId]);
  };

  const handleSortearSeleccionadas = () => {
    const ids = sortableCategories
      .filter((tc) => selectedForSorteo.has(tc.categoryId))
      .map((tc) => tc.categoryId);
    if (ids.length > 0) openDateModal(ids);
  };

  const handleConfirmSorteo = async () => {
    setShowDateModal(false);
    const categories = sorteoTargetCategories;
    const fecha = sorteoFechaInicio;
    if (!categories.length) return;

    setMessage('');
    setSorteoProgress({ current: 0, total: categories.length, currentName: '' });
    let successCount = 0;
    let lastError = '';

    let schedulingWarnings: string[] = [];

    for (let i = 0; i < categories.length; i++) {
      const catId = categories[i];
      const catName = categorias.find((c) => c.categoryId === catId)?.category?.nombre || catId;
      setSorteando(catId);
      setSorteoProgress({ current: i + 1, total: categories.length, currentName: catName });
      try {
        const result = await matchesService.sortearCategoria(tournament.id, catId, fecha || undefined);
        successCount++;
        // Verificar si hubo partidos sin agendar
        if (result?.scheduling?.sinSlot > 0) {
          schedulingWarnings.push(`${catName}: ${result.scheduling.sinSlot} partidos sin cancha/horario`);
        }
      } catch (error: any) {
        lastError = `${catName}: ${error.response?.data?.message || error.message}`;
      }
    }

    setSorteando(null);
    setSorteoProgress(null);
    setSelectedForSorteo(new Set());

    if (successCount === categories.length) {
      const fechaInfo = fecha ? ` (fecha: ${fecha})` : '';
      const warning = schedulingWarnings.length > 0
        ? `. ⚠️ ${schedulingWarnings.join('; ')}. Agregue horarios en el último día desde la pestaña Canchas y use "Reagendar".`
        : '';
      setMessage(`Sorteo realizado para ${successCount} categoria${successCount > 1 ? 's' : ''}${fechaInfo}${warning}`);
      setMessageType(schedulingWarnings.length > 0 ? 'error' : 'success');
    } else if (successCount > 0) {
      setMessage(`${successCount}/${categories.length} exitosos. Error: ${lastError}`);
      setMessageType('error');
    } else {
      setMessage(lastError || 'Error al realizar el sorteo');
      setMessageType('error');
    }

    await onRefresh();

    // Si fue una sola categoría, auto-cargar fixture
    if (categories.length === 1 && successCount === 1) {
      await loadFixture(categories[0]);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortableCategories = useMemo(() => categorias.filter(canSortear), [categorias, hasCanchas, tournament.estado]);
  const sortableSelected = useMemo(
    () => sortableCategories.filter((tc) => selectedForSorteo.has(tc.categoryId)),
    [sortableCategories, selectedForSorteo],
  );

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedForSorteo((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedForSorteo(
      sortableSelected.length === sortableCategories.length
        ? new Set()
        : new Set(sortableCategories.map((tc) => tc.categoryId)),
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
        <div className="min-w-0 flex items-center gap-2">
          {canSortear(tc) && sortableCategories.length > 1 && (
            <input
              type="checkbox"
              checked={selectedForSorteo.has(tc.categoryId)}
              onChange={() => toggleCategorySelection(tc.categoryId)}
              className="accent-primary-500 flex-shrink-0"
              disabled={sorteando !== null}
            />
          )}
          <div>
            <p className="font-medium text-sm sm:text-base">{tc.category?.nombre}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {getEstadoBadge(tc.estado)}
              <span className="text-xs text-light-secondary">{tc.inscripcionesCount} parejas</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
          {canSortear(tc) && (
            <>
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
              {tc.estado === 'FIXTURE_BORRADOR' && !isPremium && (
                <span className="text-[10px] text-yellow-400">Premium</span>
              )}
            </>
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

        {sortableCategories.length > 1 && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-dark-surface border border-dark-border">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-light-secondary">
              <input
                type="checkbox"
                checked={sortableSelected.length === sortableCategories.length && sortableCategories.length > 0}
                onChange={toggleSelectAll}
                className="accent-primary-500"
                disabled={sorteando !== null}
              />
              Seleccionar todas
            </label>
            {sortableSelected.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSortearSeleccionadas}
                disabled={sorteando !== null}
                className="text-xs sm:text-sm ml-auto"
              >
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                Sortear Seleccionadas ({sortableSelected.length})
              </Button>
            )}
          </div>
        )}

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

        {sorteoProgress && (
          <div className="p-3 rounded-md text-sm mb-4 bg-blue-900/30 text-blue-400 border border-blue-500/50 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Sorteando {sorteoProgress.current}/{sorteoProgress.total}: {sorteoProgress.currentName}...
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
              {/* Botón Reagendar — visible si hay matches sin cancha */}
              {fixtureData.some(m => !m.torneoCanchaId && m.estado !== 'WO' && m.estado !== 'CANCELADO') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!tournament?.id || !selectedCategory) return;
                    try {
                      setMessage('Reagendando partidos sin cancha...');
                      setMessageType('success');
                      const result = await matchesService.reagendarSinCancha(tournament.id, selectedCategory);
                      if (result.asignados > 0) {
                        setMessage(`✅ ${result.asignados} partidos reagendados${result.sinSlot > 0 ? `. ⚠️ ${result.sinSlot} aún sin horario en último día.` : '.'}`);
                        setMessageType(result.sinSlot > 0 ? 'error' : 'success');
                        await loadFixture(selectedCategory);
                      } else {
                        setMessage(`⚠️ No se pudo reagendar. ${result.sinSlot} partidos sin slot disponible. Agregue horarios en el último día.`);
                        setMessageType('error');
                      }
                    } catch (error: any) {
                      setMessage(error.response?.data?.message || 'Error al reagendar');
                      setMessageType('error');
                    }
                  }}
                  className="text-xs sm:text-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  Reagendar
                </Button>
              )}
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
          onResultSaved={(result) => {
            if (selectedCategory) loadFixture(selectedCategory);
            setScoreModalMatch(null);
            // Auto-finalize prompt: if this was the last match in the category
            if (result?.categoriaCompleta && scoreModalMatch.ronda === 'FINAL') {
              toast((t) => (
                <div className="flex flex-col gap-2">
                  <span className="font-medium">🏆 ¡La final ha terminado!</span>
                  <span className="text-sm text-gray-400">¿Deseas finalizar la categoría y calcular rankings?</span>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        if (selectedCategory) {
                          handleShowStandings(selectedCategory);
                        }
                      }}
                      className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600"
                    >
                      Finalizar Categoría
                    </button>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="px-3 py-1.5 bg-dark-surface text-light-secondary text-sm rounded-lg hover:bg-dark-border"
                    >
                      Más tarde
                    </button>
                  </div>
                </div>
              ), { duration: 15000 });
            } else if (result?.categoriaCompleta) {
              toast.success('Todos los partidos de esta categoría están completos. Puedes finalizarla desde el panel de categorías.');
            }
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

      {/* Modal de fecha para sorteo */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-lg mb-4">
              {sorteoTargetCategories.length === 1
                ? 'Fecha de inicio de partidos'
                : `Sortear ${sorteoTargetCategories.length} categorias`}
            </h3>

            <p className="text-sm text-light-secondary mb-3">
              {sorteoTargetCategories.length === 1
                ? '¿Qué fecha inician los partidos de esta categoria?'
                : '¿Qué fecha inician los partidos de estas categorias?'}
            </p>

            <div className="mb-4 flex flex-wrap gap-1">
              {sorteoTargetCategories.map((catId) => {
                const cat = categorias.find((c) => c.categoryId === catId);
                return (
                  <span key={catId} className="text-xs bg-dark-surface px-2 py-1 rounded-full">
                    {cat?.category?.nombre || catId}
                  </span>
                );
              })}
            </div>

            <label className="block text-sm font-medium mb-1">Fecha de inicio</label>
            <input
              type="date"
              value={sorteoFechaInicio}
              min={todayStr}
              onChange={(e) => setSorteoFechaInicio(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-light-secondary mt-1">
              Solo se usaran horarios de cancha a partir de esta fecha.
            </p>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowDateModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirmSorteo}
                disabled={!sorteoFechaInicio}
              >
                <Trophy className="w-4 h-4 mr-1" /> Sortear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
