import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instructoresService } from '@/services/instructoresService';
import { useAuthStore } from '@/store/authStore';
import { Loading, Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import {
  GraduationCap,
  Clock,
  Award,
  Target,
  DollarSign,
  MapPin,
  FileText,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Send,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { SolicitudInstructor } from '@/types';

const STEP_LABELS = ['Experiencia', 'Especialidades y Tarifas', 'Descripción y Envío'];

const ESPECIALIDADES = [
  'Volea',
  'Bandeja',
  'Saque',
  'Táctica',
  'Físico',
  'Principiantes',
  'Niños',
  'Competitivo',
];

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competitivo'];

const SolicitarInstructorPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [solicitudExistente, setSolicitudExistente] = useState<SolicitudInstructor | null>(null);

  // Form state
  const [experienciaAnios, setExperienciaAnios] = useState(0);
  const [certificaciones, setCertificaciones] = useState('');
  const [nivelesSeleccionados, setNivelesSeleccionados] = useState<string[]>([]);
  const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] = useState<string[]>([]);
  const [precioIndividual, setPrecioIndividual] = useState('');
  const [precioGrupal, setPrecioGrupal] = useState('');
  const [ciudades, setCiudades] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    // Si ya es instructor, redirigir al dashboard
    if (hasRole('instructor')) {
      navigate('/instructor', { replace: true });
      return;
    }
    checkSolicitudExistente();
  }, []);

  const checkSolicitudExistente = async () => {
    try {
      const data = await instructoresService.obtenerMiSolicitud();
      if (data) {
        setSolicitudExistente(data);
      }
    } catch {
      // No tiene solicitud — todo ok
    } finally {
      setLoading(false);
    }
  };

  const toggleNivel = (nivel: string) => {
    setNivelesSeleccionados((prev) =>
      prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel]
    );
  };

  const toggleEspecialidad = (esp: string) => {
    setEspecialidadesSeleccionadas((prev) =>
      prev.includes(esp) ? prev.filter((e) => e !== esp) : [...prev, esp]
    );
  };

  const canProceed = (s: number): boolean => {
    switch (s) {
      case 1:
        return experienciaAnios >= 0 && nivelesSeleccionados.length > 0;
      case 2:
        return especialidadesSeleccionadas.length > 0;
      case 3:
        return descripcion.trim().length >= 10;
      default:
        return false;
    }
  };

  const handleNext = () => {
    setError('');
    if (canProceed(step)) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await instructoresService.solicitarSerInstructor({
        experienciaAnios,
        certificaciones: certificaciones.trim() || undefined,
        especialidades: especialidadesSeleccionadas.join(','),
        nivelesEnsenanza: nivelesSeleccionados.join(','),
        descripcion: descripcion.trim(),
        precioIndividual: precioIndividual ? parseInt(precioIndividual) : undefined,
        precioGrupal: precioGrupal ? parseInt(precioGrupal) : undefined,
        ciudades: ciudades.trim() || undefined,
      });
      toast.success('Solicitud enviada correctamente');
      navigate('/profile', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al enviar la solicitud';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loading size="lg" text="Cargando..." />
      </div>
    );
  }

  // Si ya tiene solicitud pendiente, mostrar estado
  if (solicitudExistente) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Solicitud de Instructor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              {solicitudExistente.estado === 'PENDIENTE' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-light-text mb-2">Solicitud en Revisión</h2>
                  <p className="text-light-secondary">
                    Tu solicitud está siendo revisada por el equipo de FairPadel.
                    Te notificaremos cuando haya una respuesta.
                  </p>
                  <Badge variant="warning" className="mt-4">Pendiente</Badge>
                </>
              )}
              {solicitudExistente.estado === 'APROBADA' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-light-text mb-2">Solicitud Aprobada</h2>
                  <p className="text-light-secondary mb-4">
                    Ya sos instructor en FairPadel.
                  </p>
                  <Button variant="primary" onClick={() => navigate('/instructor')}>
                    Ir a Mi Panel
                  </Button>
                </>
              )}
              {solicitudExistente.estado === 'RECHAZADA' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-light-text mb-2">Solicitud Rechazada</h2>
                  {solicitudExistente.motivo && (
                    <p className="text-red-400 text-sm mb-2">
                      <strong>Motivo:</strong> {solicitudExistente.motivo}
                    </p>
                  )}
                  <p className="text-light-secondary">
                    Podés volver a enviar una solicitud con información actualizada.
                  </p>
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => setSolicitudExistente(null)}
                  >
                    Enviar Nueva Solicitud
                  </Button>
                </>
              )}
            </div>
            <div className="mt-6 p-4 bg-dark-surface rounded-lg space-y-2 text-sm">
              <p><strong className="text-light-text">Experiencia:</strong> <span className="text-light-secondary">{solicitudExistente.experienciaAnios} años</span></p>
              {solicitudExistente.especialidades && (
                <p><strong className="text-light-text">Especialidades:</strong> <span className="text-light-secondary">{solicitudExistente.especialidades}</span></p>
              )}
              {solicitudExistente.nivelesEnsenanza && (
                <p><strong className="text-light-text">Niveles:</strong> <span className="text-light-secondary">{solicitudExistente.nivelesEnsenanza}</span></p>
              )}
              <p><strong className="text-light-text">Fecha:</strong> <span className="text-light-secondary">{new Date(solicitudExistente.createdAt).toLocaleDateString('es-PY')}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Solicitar ser Instructor</h1>
        <p className="text-sm text-light-secondary mt-1">Completá el formulario para ser parte del equipo de instructores de FairPadel</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isComplete = step > stepNum;
          const isCurrent = step === stepNum;
          return (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-primary-500 text-white ring-2 ring-primary-500/50'
                      : 'bg-dark-surface text-light-muted border border-dark-border'
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${isCurrent ? 'text-primary-400' : 'text-light-muted'}`}>
                  {label}
                </span>
              </div>
              {idx < STEP_LABELS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${isComplete ? 'bg-green-500' : 'bg-dark-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Experiencia */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary-400" />
              Experiencia y Formación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Años experiencia */}
            <div>
              <label className="block text-sm font-medium text-light-text mb-1">
                Años de experiencia como instructor *
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={experienciaAnios}
                onChange={(e) => setExperienciaAnios(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full max-w-xs px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text focus:outline-none focus:border-primary-500"
              />
              <p className="text-xs text-light-muted mt-1">Incluí experiencia como jugador/a y como profesor/a</p>
            </div>

            {/* Certificaciones */}
            <div>
              <label className="block text-sm font-medium text-light-text mb-1">
                Certificaciones (opcional)
              </label>
              <textarea
                value={certificaciones}
                onChange={(e) => setCertificaciones(e.target.value)}
                placeholder="Ej: Certificado FPP Nivel 1, Curso de entrenamiento deportivo..."
                rows={3}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>

            {/* Niveles de enseñanza */}
            <div>
              <label className="block text-sm font-medium text-light-text mb-2">
                Niveles que podés enseñar *
              </label>
              <div className="flex flex-wrap gap-2">
                {NIVELES.map((nivel) => (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => toggleNivel(nivel)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      nivelesSeleccionados.includes(nivel)
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                        : 'bg-dark-surface text-light-secondary border border-dark-border hover:border-primary-500/30'
                    }`}
                  >
                    {nivel}
                  </button>
                ))}
              </div>
              {nivelesSeleccionados.length === 0 && (
                <p className="text-xs text-yellow-500 mt-1">Seleccioná al menos un nivel</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Especialidades y Tarifas */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary-400" />
              Especialidades y Tarifas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Especialidades */}
            <div>
              <label className="block text-sm font-medium text-light-text mb-2">
                Especialidades *
              </label>
              <div className="flex flex-wrap gap-2">
                {ESPECIALIDADES.map((esp) => (
                  <button
                    key={esp}
                    type="button"
                    onClick={() => toggleEspecialidad(esp)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      especialidadesSeleccionadas.includes(esp)
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                        : 'bg-dark-surface text-light-secondary border border-dark-border hover:border-primary-500/30'
                    }`}
                  >
                    {esp}
                  </button>
                ))}
              </div>
              {especialidadesSeleccionadas.length === 0 && (
                <p className="text-xs text-yellow-500 mt-1">Seleccioná al menos una especialidad</p>
              )}
            </div>

            {/* Tarifas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-light-text mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Precio clase individual (Gs.)
                </label>
                <input
                  type="number"
                  min={0}
                  value={precioIndividual}
                  onChange={(e) => setPrecioIndividual(e.target.value)}
                  placeholder="Ej: 150000"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Precio clase grupal (Gs.)
                </label>
                <input
                  type="number"
                  min={0}
                  value={precioGrupal}
                  onChange={(e) => setPrecioGrupal(e.target.value)}
                  placeholder="Ej: 80000"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
            <p className="text-xs text-light-muted">Las tarifas son opcionales. Podés actualizarlas después.</p>

            {/* Ciudades */}
            <div>
              <label className="block text-sm font-medium text-light-text mb-1">
                <MapPin className="h-4 w-4 inline mr-1" />
                Ciudades donde das clases (opcional)
              </label>
              <input
                type="text"
                value={ciudades}
                onChange={(e) => setCiudades(e.target.value)}
                placeholder="Ej: Asunción, Luque, San Lorenzo"
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
              />
              <p className="text-xs text-light-muted mt-1">Separadas por coma</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Descripción y Resumen */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-400" />
              Descripción y Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-light-text mb-1">
                Descripción personal * <span className="text-light-muted font-normal">({descripcion.length}/500)</span>
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value.slice(0, 500))}
                placeholder="Contá brevemente sobre vos, tu estilo de enseñanza y qué pueden esperar tus alumnos..."
                rows={5}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500 resize-none"
              />
              {descripcion.trim().length < 10 && (
                <p className="text-xs text-yellow-500 mt-1">Mínimo 10 caracteres</p>
              )}
            </div>

            {/* Resumen */}
            <div className="p-4 bg-dark-surface rounded-lg space-y-3">
              <h3 className="font-semibold text-light-text text-sm">Resumen de tu solicitud</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <SummaryRow label="Experiencia" value={`${experienciaAnios} años`} />
                <SummaryRow label="Niveles" value={nivelesSeleccionados.join(', ') || 'No definido'} />
                <SummaryRow label="Especialidades" value={especialidadesSeleccionadas.join(', ') || 'No definido'} />
                {precioIndividual && <SummaryRow label="Precio individual" value={`Gs. ${parseInt(precioIndividual).toLocaleString()}`} />}
                {precioGrupal && <SummaryRow label="Precio grupal" value={`Gs. ${parseInt(precioGrupal).toLocaleString()}`} />}
                {ciudades && <SummaryRow label="Ciudades" value={ciudades} />}
                {certificaciones && <SummaryRow label="Certificaciones" value={certificaciones} />}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Footer */}
      <div className="flex justify-between mt-6">
        {step === 1 ? (
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        ) : (
          <Button variant="ghost" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
        )}

        {step < 3 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!canProceed(step)}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || !canProceed(3)}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Enviar Solicitud
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="text-light-muted">{label}:</span>{' '}
    <span className="text-light-text">{value}</span>
  </div>
);

export default SolicitarInstructorPage;
