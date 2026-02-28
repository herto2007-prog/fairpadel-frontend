import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instructoresService } from '@/services/instructoresService';
import { useAuthStore } from '@/store/authStore';
import { Loading, Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import {
  GraduationCap,
  Target,
  DollarSign,
  MapPin,
  Edit3,
  Save,
  X,
  Award,
  Calendar,
  Users,
  BarChart2,
  BookOpen,
  Loader2,
  Clock,
  ClipboardList,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Instructor, FinanzasResumen } from '@/types';
import DisponibilidadConfig from '../components/DisponibilidadConfig';
import AgendaSemanal from '../components/AgendaSemanal';
import ReservasSolicitudes from '../components/ReservasSolicitudes';
import AlumnosList from '../components/AlumnosList';
import FinanzasResumenComponent from '../components/FinanzasResumen';
import CrearClaseModal from '../components/CrearClaseModal';
import RetencionMetrics from '../components/RetencionMetrics';

type Tab = 'agenda' | 'disponibilidad' | 'solicitudes' | 'alumnos' | 'finanzas' | 'metricas' | 'perfil';

const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'agenda', label: 'Agenda', icon: Calendar },
  { key: 'disponibilidad', label: 'Disponibilidad', icon: Clock },
  { key: 'solicitudes', label: 'Solicitudes', icon: ClipboardList },
  { key: 'alumnos', label: 'Alumnos', icon: Users },
  { key: 'finanzas', label: 'Finanzas', icon: DollarSign },
  { key: 'metricas', label: 'Métricas', icon: BarChart2 },
  { key: 'perfil', label: 'Perfil', icon: BookOpen },
];

const InstructorDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('agenda');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCrearClase, setShowCrearClase] = useState(false);

  // Stats
  const [stats, setStats] = useState<FinanzasResumen | null>(null);
  const [alumnosCount, setAlumnosCount] = useState<number>(0);

  // Editable fields
  const [descripcion, setDescripcion] = useState('');
  const [precioIndividual, setPrecioIndividual] = useState('');
  const [precioGrupal, setPrecioGrupal] = useState('');
  const [aceptaDomicilio, setAceptaDomicilio] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await instructoresService.obtenerMiPerfil();
      setInstructor(data);
      setDescripcion(data.descripcion || '');
      setPrecioIndividual(data.precioIndividual?.toString() || '');
      setPrecioGrupal(data.precioGrupal?.toString() || '');
      setAceptaDomicilio(data.aceptaDomicilio);

      // Load stats in background
      loadStats();
    } catch (err: any) {
      console.error('Error loading instructor profile:', err);
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        navigate('/instructor/solicitar', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [finanzas, alumnos] = await Promise.all([
        instructoresService.obtenerFinanzas(),
        instructoresService.obtenerAlumnos(),
      ]);
      setStats(finanzas);
      setAlumnosCount(Array.isArray(alumnos) ? alumnos.length : 0);
    } catch (err) {
      // Stats are non-critical, silently fail
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await instructoresService.actualizarPerfil({
        descripcion: descripcion.trim() || undefined,
        precioIndividual: precioIndividual ? parseInt(precioIndividual) : undefined,
        precioGrupal: precioGrupal ? parseInt(precioGrupal) : undefined,
        aceptaDomicilio,
      });
      setInstructor(updated);
      setEditing(false);
      toast.success('Perfil actualizado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (instructor) {
      setDescripcion(instructor.descripcion || '');
      setPrecioIndividual(instructor.precioIndividual?.toString() || '');
      setPrecioGrupal(instructor.precioGrupal?.toString() || '');
      setAceptaDomicilio(instructor.aceptaDomicilio);
    }
    setEditing(false);
  };

  const handleClaseCreada = () => {
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loading size="lg" text="Cargando panel..." />
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-light-muted" />
        <p className="text-light-secondary">No se pudo cargar tu perfil de instructor.</p>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/instructor/solicitar')}>
          Solicitar ser Instructor
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-light-text flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary-400" />
            Panel de Instructor
          </h1>
          <p className="text-sm text-light-secondary mt-1">
            Bienvenido, {user?.nombre} {user?.apellido}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setShowCrearClase(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva Clase
          </Button>
          <Badge variant={instructor.estado === 'APROBADO' ? 'success' : 'danger'}>
            {instructor.estado}
          </Badge>
          {instructor.verificado && (
            <Badge variant="info">Verificado</Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === key
                ? 'bg-primary-500 text-white'
                : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'agenda' && <AgendaSemanal />}
      {activeTab === 'disponibilidad' && <DisponibilidadConfig />}
      {activeTab === 'solicitudes' && <ReservasSolicitudes />}
      {activeTab === 'alumnos' && <AlumnosList />}
      {activeTab === 'finanzas' && <FinanzasResumenComponent />}
      {activeTab === 'metricas' && <RetencionMetrics />}
      {activeTab === 'perfil' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-1 text-blue-400" />
                <p className="text-xl font-bold text-light-text">
                  {stats ? stats.clasesCompletadas : '—'}
                </p>
                <p className="text-xs text-light-muted">Clases este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-1 text-green-400" />
                <p className="text-xl font-bold text-light-text">
                  {alumnosCount > 0 ? alumnosCount : '—'}
                </p>
                <p className="text-xs text-light-muted">Alumnos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart2 className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
                <p className="text-xl font-bold text-light-text">—</p>
                <p className="text-xs text-light-muted">Valoración</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-1 text-primary-400" />
                <p className="text-xl font-bold text-light-text">
                  {stats && stats.totalCobrado > 0
                    ? `${(stats.totalCobrado / 1000).toFixed(0)}k`
                    : '—'}
                </p>
                <p className="text-xs text-light-muted">Ingresos del mes</p>
              </CardContent>
            </Card>
          </div>

          {/* Perfil Editable */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Mi Perfil de Instructor
                </CardTitle>
                {!editing ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Guardar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info fija */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-light-muted" />
                  <span className="text-light-muted">Experiencia:</span>
                  <span className="text-light-text font-medium">{instructor.experienciaAnios} años</span>
                </div>
                {instructor.certificaciones && (
                  <div className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-light-muted mt-0.5" />
                    <span className="text-light-muted">Certificaciones:</span>
                    <span className="text-light-text">{instructor.certificaciones}</span>
                  </div>
                )}
              </div>

              {/* Especialidades */}
              {instructor.especialidades && (
                <div>
                  <p className="text-sm font-medium text-light-text mb-1.5 flex items-center gap-1">
                    <Target className="h-4 w-4" /> Especialidades
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {instructor.especialidades.split(',').map((esp) => (
                      <span key={esp} className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full text-xs">
                        {esp.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Niveles */}
              {instructor.nivelesEnsenanza && (
                <div>
                  <p className="text-sm font-medium text-light-text mb-1.5">Niveles de enseñanza</p>
                  <div className="flex flex-wrap gap-1.5">
                    {instructor.nivelesEnsenanza.split(',').map((niv) => (
                      <span key={niv} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs">
                        {niv.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ubicaciones */}
              {instructor.ubicaciones && instructor.ubicaciones.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-light-text mb-1.5 flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Ubicaciones
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {instructor.ubicaciones.map((ub) => (
                      <span key={ub.id} className="text-sm text-light-secondary">
                        {ub.sede?.nombre || ub.nombreCustom || ub.ciudad}
                        {ub.esPrincipal && <span className="text-primary-400 ml-1">(principal)</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-dark-border" />

              {/* Campos editables */}
              <div>
                <label className="block text-sm font-medium text-light-text mb-1">Descripción</label>
                {editing ? (
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value.slice(0, 500))}
                    rows={4}
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text focus:outline-none focus:border-primary-500 resize-none text-sm"
                  />
                ) : (
                  <p className="text-sm text-light-secondary whitespace-pre-wrap">
                    {instructor.descripcion || 'Sin descripción aún'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-light-text mb-1">
                    <DollarSign className="h-3 w-3 inline" /> Precio clase individual (Gs.)
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={precioIndividual}
                      onChange={(e) => setPrecioIndividual(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text focus:outline-none focus:border-primary-500 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-light-secondary">
                      {instructor.precioIndividual ? `Gs. ${instructor.precioIndividual.toLocaleString()}` : 'No definido'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-text mb-1">
                    <DollarSign className="h-3 w-3 inline" /> Precio clase grupal (Gs.)
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={precioGrupal}
                      onChange={(e) => setPrecioGrupal(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text focus:outline-none focus:border-primary-500 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-light-secondary">
                      {instructor.precioGrupal ? `Gs. ${instructor.precioGrupal.toLocaleString()}` : 'No definido'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  {editing ? (
                    <input
                      type="checkbox"
                      checked={aceptaDomicilio}
                      onChange={(e) => setAceptaDomicilio(e.target.checked)}
                      className="rounded border-dark-border bg-dark-bg text-primary-500 focus:ring-primary-500"
                    />
                  ) : (
                    <span className={`h-4 w-4 rounded border flex items-center justify-center ${aceptaDomicilio ? 'bg-primary-500 border-primary-500' : 'border-dark-border'}`}>
                      {aceptaDomicilio && <span className="text-white text-xs">&#10003;</span>}
                    </span>
                  )}
                  <span className="text-light-text">Acepta clases a domicilio</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Crear Clase Modal */}
      {instructor && (
        <CrearClaseModal
          isOpen={showCrearClase}
          onClose={() => setShowCrearClase(false)}
          instructor={instructor}
          onCreated={handleClaseCreada}
        />
      )}
    </div>
  );
};

export default InstructorDashboardPage;
