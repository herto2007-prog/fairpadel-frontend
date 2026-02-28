import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { instructoresService } from '@/services/instructoresService';
import { Loading, Card, CardContent, Button } from '@/components/ui';
import {
  GraduationCap,
  Search,
  MapPin,
  Award,
  DollarSign,
  User,
  CheckCircle,
  Home,
  ChevronRight,
  Calendar,
  Users,
  Eye,
  Loader2,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Instructor } from '@/types';
import MisClasesTab from '../components/MisClasesTab';

type TabKey = 'buscar' | 'mis-clases';

const BuscarInstructoresPage = () => {
  const { isAuthenticated, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const isInstructor = hasRole('instructor');

  const [activeTab, setActiveTab] = useState<TabKey>('buscar');

  // Search state
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ciudad, setCiudad] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Probar módulo
  const [probando, setProbando] = useState(false);

  useEffect(() => {
    if (activeTab === 'buscar') loadInstructores();
  }, [page]);

  useEffect(() => {
    if (activeTab !== 'buscar') return;
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      loadInstructores();
    }, 400);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [ciudad, especialidad]);

  const loadInstructores = async () => {
    setLoading(true);
    try {
      const data = await instructoresService.buscarInstructores({
        ciudad: ciudad.trim() || undefined,
        especialidad: especialidad.trim() || undefined,
        page,
        limit: 12,
      });
      setInstructores(data.instructores);
      setTotal(data.total);
      setTotalPages(Math.ceil(data.total / 12));
    } catch (error) {
      console.error('Error buscando instructores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProbarModulo = async () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    setProbando(true);
    try {
      const res = await instructoresService.probarModulo();
      toast.success(res.message);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al enviar solicitud';
      toast.error(msg);
    } finally {
      setProbando(false);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'buscar', label: 'Buscar Instructor' },
    ...(isAuthenticated ? [{ key: 'mis-clases' as TabKey, label: 'Mis Clases' }] : []),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary-400" />
          </div>
          Instructores de Pádel
        </h1>
        <p className="text-sm text-light-secondary mt-2 ml-[52px]">
          Encontrá al instructor ideal para mejorar tu juego o gestioná tus clases
        </p>
      </div>

      {/* Tab Bar */}
      {tabs.length > 1 && (
        <div className="flex gap-1 mb-6 bg-dark-card rounded-lg p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-500 text-white'
                  : 'text-light-secondary hover:bg-dark-hover hover:text-light-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'buscar' && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-muted" />
              <input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Filtrar por ciudad..."
                className="w-full pl-10 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-muted" />
              <input
                type="text"
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                placeholder="Filtrar por especialidad..."
                className="w-full pl-10 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Results count */}
          {!loading && (
            <p className="text-sm text-light-muted mb-4">
              {total} instructor{total !== 1 ? 'es' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" text="Buscando instructores..." />
            </div>
          ) : instructores.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="h-16 w-16 mx-auto mb-4 text-light-muted opacity-50" />
              <h2 className="text-lg font-semibold text-light-text mb-1">No se encontraron instructores</h2>
              <p className="text-sm text-light-secondary">Probá con otros filtros o volvé más tarde</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {instructores.map((inst) => (
                  <Link key={inst.id} to={`/instructores/${inst.id}`}>
                    <Card className="h-full hover:border-primary-500/50 transition-all hover:scale-[1.01] group">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          {inst.user?.fotoUrl ? (
                            <img
                              src={inst.user.fotoUrl}
                              alt={inst.user.nombre}
                              className="h-14 w-14 rounded-full object-cover flex-shrink-0 ring-2 ring-dark-border group-hover:ring-primary-500/50 transition-all"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 ring-2 ring-dark-border group-hover:ring-primary-500/50 transition-all">
                              <User className="h-6 w-6 text-primary-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-light-text truncate group-hover:text-primary-400 transition-colors">
                                {inst.user?.nombre} {inst.user?.apellido}
                              </h3>
                              {inst.verificado && (
                                <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-light-muted flex items-center gap-1 mt-0.5">
                              <Award className="h-3 w-3" />
                              {inst.experienciaAnios} años exp.
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-light-muted group-hover:text-primary-400 transition-colors mt-1" />
                        </div>

                        {inst.especialidades && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {inst.especialidades.split(',').slice(0, 4).map((esp) => (
                              <span key={esp} className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full text-[10px] font-medium">
                                {esp.trim()}
                              </span>
                            ))}
                            {inst.especialidades.split(',').length > 4 && (
                              <span className="px-2 py-0.5 bg-dark-surface text-light-muted rounded-full text-[10px]">
                                +{inst.especialidades.split(',').length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-light-muted">
                          <div className="flex items-center gap-2">
                            {inst.user?.ciudad && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {inst.user.ciudad}
                              </span>
                            )}
                            {inst.aceptaDomicilio && (
                              <span className="flex items-center gap-0.5 text-green-400">
                                <Home className="h-3 w-3" />
                                Domicilio
                              </span>
                            )}
                          </div>
                          {inst.precioIndividual && (
                            <span className="flex items-center gap-0.5 text-light-secondary font-medium">
                              <DollarSign className="h-3 w-3" />
                              Gs. {inst.precioIndividual.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-sm border border-dark-border text-light-secondary hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1.5 text-sm text-light-muted">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm border border-dark-border text-light-secondary hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* Sección Promocional */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="mt-12 border-t border-dark-border pt-10">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-light-text mb-2">
                ¿Sos instructor de pádel?
              </h2>
              <p className="text-sm sm:text-base text-light-secondary">
                Potenciá tu negocio con las herramientas de FairPadel
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
              <div className="flex items-start gap-3 p-4 bg-dark-card rounded-xl border border-dark-border">
                <div className="h-10 w-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-light-text mb-0.5">Agenda inteligente</h3>
                  <p className="text-xs text-light-muted">Gestioná tu disponibilidad semanal y recibí reservas automáticamente</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-dark-card rounded-xl border border-dark-border">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-light-text mb-0.5">Control financiero</h3>
                  <p className="text-xs text-light-muted">Registrá pagos, controlá deudas y emití comprobantes de tus clases</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-dark-card rounded-xl border border-dark-border">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-light-text mb-0.5">Seguimiento de alumnos</h3>
                  <p className="text-xs text-light-muted">Historial, asistencia, notas y progreso de cada alumno en un solo lugar</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-dark-card rounded-xl border border-dark-border">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-light-text mb-0.5">Visibilidad en la plataforma</h3>
                  <p className="text-xs text-light-muted">Tu perfil visible para todos los jugadores de la comunidad FairPadel</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              {!isAuthenticated ? (
                <Link to="/register">
                  <Button variant="primary" className="px-6">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Registrate y empezá
                  </Button>
                </Link>
              ) : isInstructor ? (
                <Link to="/instructor">
                  <Button variant="primary" className="px-6">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ir a Mi Panel
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/instructor/solicitar">
                    <Button variant="primary" className="px-6">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Solicitar ser Instructor
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="px-6 border border-dark-border"
                    onClick={handleProbarModulo}
                    disabled={probando}
                  >
                    {probando ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    Probar Módulo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mis-clases' && <MisClasesTab />}
    </div>
  );
};

export default BuscarInstructoresPage;
