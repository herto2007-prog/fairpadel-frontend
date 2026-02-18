import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Loading } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';
import { sedesService } from '@/services';
import { matchesService } from '@/services/matchesService';
import inscripcionesService from '@/services/inscripcionesService';
import adminService from '@/services/adminService';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Tournament, TournamentCategory, TorneoCancha, TorneoPelotasRonda, Match, Pareja, Inscripcion } from '@/types';
import { BracketView } from '@/features/matches/components/BracketView';
import { ScoreModal } from '@/features/matches/components/ScoreModal';
import { CanchasTab } from '@/features/tournaments/components/CanchasTab';
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
  Download,
  FileText,
  FileSpreadsheet,
  Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'resumen' | 'editar' | 'inscripciones' | 'pagos' | 'finanzas' | 'sorteo' | 'canchas' | 'pelotas' | 'ayudantes' | 'acreditacion' | 'reportes' | 'dashboard';

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
    { key: 'finanzas', label: 'Finanzas', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'sorteo', label: 'Sorteo', icon: <Trophy className="w-4 h-4" /> },
    { key: 'canchas', label: 'Canchas y Horarios', icon: <Layers className="w-4 h-4" /> },
    { key: 'pelotas', label: 'Pelotas por Ronda', icon: <CircleDot className="w-4 h-4" />, premium: true },
    { key: 'ayudantes', label: 'Ayudantes', icon: <UserPlus className="w-4 h-4" /> },
    { key: 'acreditacion', label: 'Acreditación', icon: <ClipboardCheck className="w-4 h-4" /> },
    { key: 'reportes', label: 'Reportes', icon: <FileText className="w-4 h-4" /> },
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
        {activeTab === 'inscripciones' && <InscripcionesTab stats={stats} onToggle={handleToggleInscripcion} togglingCategory={togglingCategory} tournament={tournament} onRefresh={loadData} />}
        {activeTab === 'pagos' && <PagosTab tournament={tournament} />}
        {activeTab === 'finanzas' && <FinanzasTab tournament={tournament} />}
        {activeTab === 'sorteo' && <SorteoTab tournament={tournament} stats={stats} onRefresh={loadData} isPremium={user?.esPremium || false} />}
        {activeTab === 'canchas' && <CanchasTab tournament={tournament} stats={stats} onSaved={loadData} />}
        {activeTab === 'pelotas' && <PelotasRondaTab tournament={tournament} stats={stats} isPremium={isPremium} />}
        {activeTab === 'ayudantes' && <AyudantesTab tournament={tournament} />}
        {activeTab === 'acreditacion' && <AcreditacionTab tournament={tournament} />}
        {activeTab === 'reportes' && <ReportesTab tournament={tournament} isPremium={isPremium} />}
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
  const [showCancelarTorneo, setShowCancelarTorneo] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancellingTorneo, setCancellingTorneo] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublicarModal, setShowPublicarModal] = useState(false);

  const puedePublicar = ['BORRADOR', 'RECHAZADO'].includes(tournament.estado);

  const handlePublicarTorneo = async () => {
    setPublishing(true);
    try {
      await tournamentsService.publish(tournament.id);
      toast.success('Torneo enviado a aprobación exitosamente');
      setShowPublicarModal(false);
      await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al publicar torneo');
    } finally {
      setPublishing(false);
    }
  };

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

          {/* Shortlink copiable */}
          {tournament.slug && (
            <div className="mt-4 pt-4 border-t border-dark-border">
              <p className="text-xs text-light-secondary mb-1">Link de inscripción:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-dark-surface px-3 py-2 rounded-lg text-primary-400 truncate">
                  {window.location.origin}/t/{tournament.slug}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/t/${tournament.slug}`);
                    toast.success('Link copiado');
                  }}
                  className="px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg text-xs font-medium hover:bg-primary-500/30 transition-colors whitespace-nowrap"
                >
                  Copiar
                </button>
              </div>
            </div>
          )}
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

      {/* Publicar Torneo */}
      {puedePublicar && (
        <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary-400">
                {tournament.estado === 'RECHAZADO' ? 'Re-enviar a Aprobación' : 'Publicar Torneo'}
              </p>
              <p className="text-xs text-primary-400/70">
                {tournament.estado === 'RECHAZADO'
                  ? 'Si ya corregiste las observaciones, puedes re-enviar el torneo para aprobación.'
                  : '¿Terminaste de configurar el torneo? Envialo a aprobación para que sea publicado.'}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowPublicarModal(true)}
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4 mr-2" />
            {tournament.estado === 'RECHAZADO' ? 'Re-enviar' : 'Publicar Torneo'}
          </Button>
        </div>
      )}

      {/* Cancelar Torneo */}
      {['BORRADOR', 'PENDIENTE_APROBACION', 'PUBLICADO', 'RECHAZADO'].includes(tournament.estado) && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Cancelar Torneo</p>
              <p className="text-xs text-red-400/70">Esta acción cancelará el torneo y todas las inscripciones activas.</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-900/30 flex-shrink-0"
            onClick={() => setShowCancelarTorneo(true)}
          >
            Cancelar Torneo
          </Button>
        </div>
      )}

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

      {/* Modal confirmar cancelar torneo */}
      {showCancelarTorneo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelarTorneo(false)}>
          <div className="bg-dark-card rounded-xl border border-dark-border max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Cancelar Torneo
              </h3>
              <p className="text-sm text-light-secondary mb-4">
                ¿Estás seguro de que deseas cancelar <strong>{tournament.nombre}</strong>?
              </p>
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg mb-4">
                <p className="text-sm text-red-400">
                  Esta acción cancelará el torneo y todas las inscripciones activas. No se puede deshacer.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-light-text mb-1">
                  Motivo de cancelación <span className="text-red-400">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                  rows={3}
                  placeholder="Ingresa el motivo de la cancelación..."
                  value={cancelMotivo}
                  onChange={(e) => setCancelMotivo(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCancelarTorneo(false); setCancelMotivo(''); }}>
                  Volver
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    if (!cancelMotivo.trim()) {
                      toast.error('Debes ingresar un motivo de cancelación');
                      return;
                    }
                    setCancellingTorneo(true);
                    try {
                      const result = await tournamentsService.cancelarTorneo(tournament.id, cancelMotivo);
                      toast.success(`Torneo cancelado. ${result.inscripcionesCanceladas} inscripciones canceladas.`);
                      setShowCancelarTorneo(false);
                      setCancelMotivo('');
                      await onRefresh();
                    } catch (error: any) {
                      toast.error(error.response?.data?.message || 'Error al cancelar torneo');
                    } finally {
                      setCancellingTorneo(false);
                    }
                  }}
                  loading={cancellingTorneo}
                  disabled={!cancelMotivo.trim()}
                >
                  Confirmar Cancelación
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar publicar torneo */}
      {showPublicarModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowPublicarModal(false)}>
          <div className="bg-dark-card rounded-xl border border-dark-border max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-400" />
                {tournament.estado === 'RECHAZADO' ? 'Re-enviar a Aprobación' : 'Publicar Torneo'}
              </h3>
              <p className="text-sm text-light-secondary mb-4">
                ¿Estás seguro de que deseas enviar <strong>{tournament.nombre}</strong> para aprobación?
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-light-secondary">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Un administrador revisará el torneo
                </div>
                <div className="flex items-center gap-2 text-sm text-light-secondary">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Una vez aprobado, será visible para todos los jugadores
                </div>
              </div>
              <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg mb-4">
                <p className="text-sm text-blue-400 flex items-center gap-2">
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  Asegurate de haber configurado categorías, fechas y sede antes de publicar.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPublicarModal(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handlePublicarTorneo}
                  loading={publishing}
                >
                  <Send className="w-4 h-4 mr-1" /> Enviar a Aprobación
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
        </div>
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
                  <th className="px-4 py-3 text-light-secondary font-medium">Fecha</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInscripciones.map((insc) => {
                  const isPendiente = ['PENDIENTE_PAGO', 'PENDIENTE_CONFIRMACION', 'PENDIENTE_PAGO_PRESENCIAL'].includes(insc.estado);
                  const j1 = insc.pareja?.jugador1;
                  const j2 = insc.pareja?.jugador2;
                  const comprobante = insc.comprobantes && insc.comprobantes.length > 0 ? insc.comprobantes[insc.comprobantes.length - 1] : null;

                  const pagos = insc.pagos || (insc.pago ? [insc.pago] : []);
                  const primerPago = pagos[0];
                  const isIndividual = insc.modoPago === 'INDIVIDUAL';
                  const fechaConfirm = pagos.find((p: any) => p.fechaConfirm)?.fechaConfirm;

                  return (
                    <tr key={insc.id} className="border-b border-dark-border/50 hover:bg-dark-hover/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-light-text">
                          {j1 ? `${j1.nombre} ${j1.apellido}` : '—'}
                        </div>
                        <div className="text-light-secondary text-xs">
                          {j2 ? `${j2.nombre} ${j2.apellido}` : insc.pareja?.jugador2Documento ? `Doc: ${insc.pareja.jugador2Documento}` : '—'}
                        </div>
                        {isIndividual && (
                          <span className="text-[10px] px-1.5 py-0.5 mt-1 inline-block bg-blue-900/30 text-blue-400 rounded-full">Pago Individual</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-light-secondary">
                        {insc.category?.nombre || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {isIndividual ? (
                          <div className="space-y-1">
                            {pagos.map((p: any, idx: number) => (
                              <div key={p.id || idx} className="flex items-center gap-1">
                                <span className="text-[10px] text-light-secondary">{idx === 0 ? 'J1' : 'J2'}:</span>
                                {getMetodoBadge(p.metodoPago)}
                                <span className={`text-[10px] ${p.estado === 'CONFIRMADO' ? 'text-green-400' : p.estado === 'RECHAZADO' ? 'text-red-400' : 'text-yellow-400'}`}>
                                  {p.estado === 'CONFIRMADO' ? '✓' : p.estado === 'RECHAZADO' ? '✗' : '⏳'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          getMetodoBadge(primerPago?.metodoPago)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getEstadoBadge(insc.estado)}
                      </td>
                      <td className="px-4 py-3">
                        {comprobante ? (
                          <div className="flex items-center gap-2">
                            <a href={comprobante.url} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={comprobante.url} alt="Comprobante" className="w-10 h-10 object-cover rounded border border-dark-border hover:opacity-80 transition-opacity" />
                            </a>
                            <div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${comprobante.estado === 'APROBADA' ? 'bg-green-900/30 text-green-400' : comprobante.estado === 'RECHAZADA' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                {comprobante.estado}
                              </span>
                              {comprobante.motivoRechazo && (
                                <p className="text-[10px] text-red-400/70 mt-0.5 max-w-[120px] truncate" title={comprobante.motivoRechazo}>
                                  {comprobante.motivoRechazo}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-light-secondary text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-light-secondary space-y-0.5">
                          <p title="Fecha de inscripción">{new Date(insc.createdAt || '').toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                          {fechaConfirm && (
                            <p className="text-green-400" title="Fecha de confirmación">
                              ✓ {new Date(fechaConfirm).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </p>
                          )}
                        </div>
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

// ===================== FINANZAS TAB =====================

interface DashboardFinanciero {
  costoInscripcion: number;
  totalInscripciones: number;
  totalRecaudado: number;
  totalComisiones: number;
  totalNeto: number;
  pagosConfirmados: number;
  pagosPendientes: number;
  pagosRechazados: number;
  inscripcionesGratis: number;
  porCategoria: {
    categoryId: string;
    categoryNombre: string;
    totalInscritas: number;
    confirmadas: number;
    pendientes: number;
    rechazadas: number;
    montoRecaudado: number;
    montoComisiones: number;
  }[];
}

function FinanzasTab({ tournament }: { tournament: Tournament }) {
  const [data, setData] = useState<DashboardFinanciero | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('admin');

  // Commission config (admin only)
  const [comisionData, setComisionData] = useState<{ comisionPorcentaje: number | null; comisionGlobal: number } | null>(null);
  const [comisionMode, setComisionMode] = useState<'global' | 'custom'>('global');
  const [comisionInput, setComisionInput] = useState('');
  const [savingComision, setSavingComision] = useState(false);

  useEffect(() => {
    tournamentsService.getDashboardFinanciero(tournament.id)
      .then(setData)
      .catch(() => toast.error('Error al cargar datos financieros'))
      .finally(() => setLoading(false));
  }, [tournament.id]);

  useEffect(() => {
    if (!isAdmin) return;
    adminService.getComisionTorneo(tournament.id)
      .then((res) => {
        setComisionData(res);
        if (res.comisionPorcentaje !== null && res.comisionPorcentaje !== undefined) {
          setComisionMode('custom');
          setComisionInput(String(res.comisionPorcentaje));
        } else {
          setComisionMode('global');
          setComisionInput('');
        }
      })
      .catch(() => {});
  }, [tournament.id, isAdmin]);

  const handleSaveComision = async () => {
    setSavingComision(true);
    try {
      const value = comisionMode === 'global' ? null : parseFloat(comisionInput);
      if (comisionMode === 'custom' && (isNaN(value!) || value! < 0 || value! > 100)) {
        toast.error('La comisión debe ser un número entre 0 y 100');
        return;
      }
      await adminService.setComisionTorneo(tournament.id, value);
      toast.success(comisionMode === 'global' ? 'Usando comisión global' : `Comisión configurada a ${value}%`);
      // Refresh commission data
      const res = await adminService.getComisionTorneo(tournament.id);
      setComisionData(res);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar comisión');
    } finally {
      setSavingComision(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await tournamentsService.exportInscripcionesExcel(tournament.id);
      toast.success('Excel descargado');
    } catch {
      toast.error('Error al exportar Excel');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loading size="lg" text="Cargando finanzas..." /></div>;
  if (!data) return <Card className="p-8 text-center"><p className="text-light-secondary">No se pudieron cargar los datos financieros</p></Card>;

  return (
    <div className="space-y-6">
      {/* Header with export button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Dashboard Financiero</h2>
        <Button
          variant="outline"
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exportando...' : 'Exportar Excel'}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{formatCurrency(data.totalRecaudado)}</p>
          <p className="text-xs text-light-secondary">Recaudado</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{formatCurrency(data.totalComisiones)}</p>
          <p className="text-xs text-light-secondary">Comisiones</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary-400">{formatCurrency(data.totalNeto)}</p>
          <p className="text-xs text-light-secondary">Neto</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-light-text">{data.totalInscripciones}</p>
          <p className="text-xs text-light-secondary">Inscripciones</p>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-500" /> Resumen de Pagos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 bg-green-900/20 rounded-lg text-center">
            <p className="text-xl font-bold text-green-400">{data.pagosConfirmados}</p>
            <p className="text-xs text-green-400/70">Confirmados</p>
          </div>
          <div className="p-3 bg-yellow-900/20 rounded-lg text-center">
            <p className="text-xl font-bold text-yellow-400">{data.pagosPendientes}</p>
            <p className="text-xs text-yellow-400/70">Pendientes</p>
          </div>
          <div className="p-3 bg-red-900/20 rounded-lg text-center">
            <p className="text-xl font-bold text-red-400">{data.pagosRechazados}</p>
            <p className="text-xs text-red-400/70">Rechazados</p>
          </div>
          {data.inscripcionesGratis > 0 && (
            <div className="p-3 bg-blue-900/20 rounded-lg text-center">
              <p className="text-xl font-bold text-blue-400">{data.inscripcionesGratis}</p>
              <p className="text-xs text-blue-400/70">Gratis</p>
            </div>
          )}
        </div>
        <div className="text-sm text-light-secondary">
          Costo por inscripción: <strong className="text-light-text">{formatCurrency(data.costoInscripcion)}</strong>
        </div>
      </Card>

      {/* Per-category breakdown */}
      {data.porCategoria.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-500" /> Desglose por Categoría
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left">
                  <th className="px-3 py-2 text-light-secondary font-medium">Categoría</th>
                  <th className="px-3 py-2 text-light-secondary font-medium text-center">Inscritas</th>
                  <th className="px-3 py-2 text-light-secondary font-medium text-center">Confirmadas</th>
                  <th className="px-3 py-2 text-light-secondary font-medium text-center">Pendientes</th>
                  <th className="px-3 py-2 text-light-secondary font-medium text-right">Recaudado</th>
                  <th className="px-3 py-2 text-light-secondary font-medium text-right">Comisiones</th>
                </tr>
              </thead>
              <tbody>
                {data.porCategoria.map((cat) => (
                  <tr key={cat.categoryId} className="border-b border-dark-border/50 hover:bg-dark-hover/30">
                    <td className="px-3 py-2 font-medium text-light-text">{cat.categoryNombre}</td>
                    <td className="px-3 py-2 text-center">{cat.totalInscritas}</td>
                    <td className="px-3 py-2 text-center text-green-400">{cat.confirmadas}</td>
                    <td className="px-3 py-2 text-center text-yellow-400">{cat.pendientes}</td>
                    <td className="px-3 py-2 text-right text-green-400">{formatCurrency(cat.montoRecaudado)}</td>
                    <td className="px-3 py-2 text-right text-red-400">{formatCurrency(cat.montoComisiones)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-dark-border font-bold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-center">{data.totalInscripciones}</td>
                  <td className="px-3 py-2 text-center text-green-400">{data.pagosConfirmados + data.inscripcionesGratis}</td>
                  <td className="px-3 py-2 text-center text-yellow-400">{data.pagosPendientes}</td>
                  <td className="px-3 py-2 text-right text-green-400">{formatCurrency(data.totalRecaudado)}</td>
                  <td className="px-3 py-2 text-right text-red-400">{formatCurrency(data.totalComisiones)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Admin: Commission Configuration */}
      {isAdmin && comisionData && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary-500" /> Comisión FairPadel
          </h3>
          <p className="text-sm text-light-secondary mb-4">
            Configurar el porcentaje de comisión que FairPadel cobra al organizador por cada inscripción en este torneo.
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="comisionMode"
                checked={comisionMode === 'global'}
                onChange={() => { setComisionMode('global'); setComisionInput(''); }}
                className="accent-primary-500"
              />
              <span className="text-sm">
                Usar comisión global ({comisionData.comisionGlobal}%)
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="comisionMode"
                checked={comisionMode === 'custom'}
                onChange={() => setComisionMode('custom')}
                className="accent-primary-500"
              />
              <span className="text-sm">Comisión personalizada:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={comisionInput}
                  onChange={(e) => { setComisionInput(e.target.value); setComisionMode('custom'); }}
                  disabled={comisionMode !== 'custom'}
                  placeholder={String(comisionData.comisionGlobal)}
                  className="w-20 px-2 py-1.5 text-sm bg-dark-card border border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-40"
                />
                <span className="text-sm text-light-secondary">%</span>
              </div>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={handleSaveComision}
              disabled={savingComision}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingComision ? 'Guardando...' : 'Guardar Comisión'}
            </Button>
            {comisionData.comisionPorcentaje !== null && comisionData.comisionPorcentaje !== undefined && (
              <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-1 rounded-full">
                Actualmente: {comisionData.comisionPorcentaje}%
              </span>
            )}
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
    </div>
  );
}
