import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentsService } from '@/services/tournamentsService';
import { circuitosService } from '@/services/circuitosService';
import { Button, Input, Card, Checkbox } from '@/components/ui';
import type { Category, Sede, Circuito } from '@/types';
import { Modalidad } from '@/types';
import { useAuthStore } from '@/store/authStore';
import SedeSelector from '../components/SedeSelector';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  MapPin,
  Layers,
  Image,
  Crown,
  AlertTriangle,
  Save,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STEP_LABELS = [
  'Información',
  'Sede y Fechas',
  'Categorías',
  'Resumen',
];

const CreateTournamentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isPremium = user?.esPremium || false;
  const MAX_CATEGORIES_FREE = 12;

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [circuitos, setCircuitos] = useState<Circuito[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedModalidades, setSelectedModalidades] = useState<Modalidad[]>([Modalidad.TRADICIONAL]);
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);
  const [selectedCircuito, setSelectedCircuito] = useState<string>('');

  // Flyer
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string>('');
  const flyerInputRef = useRef<HTMLInputElement>(null);

  // Form
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    pais: 'Paraguay',
    region: 'Alto Parana',
    ciudad: 'Ciudad del Este',
    fechaInicio: '',
    fechaFin: '',
    fechaLimiteInscripcion: '',
    flyerUrl: '',
    costoInscripcion: 0,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [cats, circs] = await Promise.all([
        tournamentsService.getCategories(),
        circuitosService.getAll().catch(() => []),
      ]);
      setCategories(cats);
      setCircuitos(circs.filter((c: Circuito) => c.estado === 'ACTIVO'));
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  // Category helpers
  const maleCategories = categories.filter((c) => c.tipo === 'MASCULINO');
  const femaleCategories = categories.filter((c) => c.tipo === 'FEMENINO');

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      if (!isPremium && prev.length >= MAX_CATEGORIES_FREE) {
        toast.error(`Plan gratuito: máximo ${MAX_CATEGORIES_FREE} categorías`);
        return prev;
      }
      return [...prev, categoryId];
    });
  };

  const handleModalidadToggle = (modalidad: Modalidad) => {
    setSelectedModalidades((prev) =>
      prev.includes(modalidad)
        ? prev.filter((m) => m !== modalidad)
        : [...prev, modalidad]
    );
  };

  // Flyer upload handler
  const handleFlyerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El flyer no puede superar 10MB');
      return;
    }
    setFlyerFile(file);
    setFlyerPreview(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, flyerUrl: '' }));
  };

  // Validation per step
  const canProceed = (s: number): boolean => {
    switch (s) {
      case 1:
        return formData.nombre.trim().length >= 5 && formData.pais.trim().length > 0 && formData.ciudad.trim().length > 0;
      case 2:
        return !!formData.fechaInicio && !!formData.fechaFin && !!formData.fechaLimiteInscripcion;
      case 3:
        return selectedCategories.length > 0 && selectedModalidades.length > 0;
      default:
        return true;
    }
  };

  const validateDates = (): string | null => {
    const fi = new Date(formData.fechaInicio);
    const ff = new Date(formData.fechaFin);
    const fl = new Date(formData.fechaLimiteInscripcion);
    if (ff <= fi) return 'La fecha de fin debe ser posterior a la de inicio';
    if (fl >= fi) return 'La fecha límite de inscripción debe ser anterior a la de inicio';
    return null;
  };

  const handleNext = () => {
    setError('');
    if (step === 2) {
      const dateErr = validateDates();
      if (dateErr) { setError(dateErr); return; }
    }
    if (canProceed(step)) setStep(step + 1);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Need either a flyer file or URL
      let flyerUrl = formData.flyerUrl;
      if (!flyerUrl && !flyerFile) {
        flyerUrl = 'https://placehold.co/800x400/1a1a2e/FFFFFF?text=FairPadel+Torneo';
      }

      const tournamentData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        pais: formData.pais,
        region: formData.region,
        ciudad: formData.ciudad,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        fechaLimiteInscripcion: formData.fechaLimiteInscripcion,
        flyerUrl: flyerUrl || 'https://placehold.co/800x400/1a1a2e/FFFFFF?text=FairPadel',
        costoInscripcion: Number(formData.costoInscripcion),
        sedeId: selectedSede?.id || undefined,
        sede: selectedSede?.nombre || undefined,
        direccion: selectedSede?.direccion || undefined,
        mapsUrl: selectedSede?.mapsUrl || undefined,
        categorias: selectedCategories,
        modalidades: selectedModalidades,
      };

      const tournament = await tournamentsService.create(tournamentData);

      // Upload flyer if file was selected
      if (flyerFile && tournament.id) {
        try {
          await tournamentsService.uploadFlyer(tournament.id, flyerFile);
        } catch {
          // Non-fatal: tournament created, flyer upload failed
          toast.error('Torneo creado, pero hubo un error al subir el flyer. Puedes subirlo después.');
        }
      }

      toast.success('Torneo creado como borrador');
      navigate(`/tournaments/${tournament.id}/manage`);
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message.join(', '));
      } else {
        setError(message || 'Error al crear el torneo');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============ RENDER HELPERS ============

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PY', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const formatGs = (n: number) => {
    return n > 0 ? `Gs. ${n.toLocaleString('es-PY')}` : 'Gratis';
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 hover:bg-dark-hover rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Crear Torneo</h1>
          <p className="text-sm text-light-secondary">Paso {step} de {STEP_LABELS.length}</p>
        </div>
      </div>

      {/* Premium indicator */}
      {!isPremium && (
        <div className="mb-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400">
            Plan gratuito: 1 torneo activo, máximo {MAX_CATEGORIES_FREE} categorías.
            <span className="font-medium ml-1">Actualiza a Premium para más.</span>
          </p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${step > s ? 'bg-green-500 text-white' : step === s ? 'bg-primary-500 text-white ring-4 ring-primary-500/30' : 'bg-dark-border text-light-secondary'}`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className={`text-[10px] sm:text-xs mt-1 font-medium ${step >= s ? 'text-primary-400' : 'text-light-secondary'}`}>
                  {label}
                </span>
              </div>
              {s < STEP_LABELS.length && (
                <div className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded ${step > s ? 'bg-green-500' : 'bg-dark-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ==================== STEP 1: Información Básica ==================== */}
      {step === 1 && (
        <Card className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold">Información Básica</h2>
          </div>

          <Input
            label="Nombre del Torneo *"
            type="text"
            placeholder="Ej: Copa FairPadel 2026 (mínimo 5 caracteres)"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-light-text mb-1">Descripción</label>
            <textarea
              className="w-full rounded-lg border border-dark-border bg-dark-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              placeholder="Describe tu torneo (opcional)..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="País *"
              type="text"
              value={formData.pais}
              onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
            />
            <Input
              label="Región *"
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            />
            <Input
              label="Ciudad *"
              type="text"
              value={formData.ciudad}
              onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
            />
          </div>

          <Input
            label="Costo de Inscripción (Gs.) *"
            type="number"
            placeholder="150000 (0 = gratis)"
            value={formData.costoInscripcion}
            onChange={(e) => setFormData({ ...formData, costoInscripcion: Number(e.target.value) })}
          />

          {/* Circuito (opcional) */}
          {circuitos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-light-text mb-1">
                Circuito (opcional)
              </label>
              <select
                className="w-full rounded-lg border border-dark-border bg-dark-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedCircuito}
                onChange={(e) => setSelectedCircuito(e.target.value)}
              >
                <option value="">Sin circuito</option>
                {circuitos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Flyer */}
          <div>
            <label className="block text-sm font-medium text-light-text mb-2">
              <Image className="w-4 h-4 inline mr-1" />
              Flyer del Torneo
            </label>

            {flyerPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-dark-border">
                <img src={flyerPreview} alt="Flyer preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setFlyerFile(null); setFlyerPreview(''); }}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md hover:bg-black/80"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => flyerInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-dark-border rounded-lg p-6 text-center hover:border-primary-500/50 transition-colors"
                >
                  <Image className="w-8 h-8 mx-auto text-light-secondary mb-2" />
                  <p className="text-sm text-light-secondary">Click para subir una imagen</p>
                  <p className="text-xs text-light-secondary/60 mt-1">JPG, PNG hasta 10MB</p>
                </button>
                <input
                  ref={flyerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFlyerSelect}
                />
                <div className="text-center text-xs text-light-secondary">o</div>
                <Input
                  label=""
                  type="url"
                  placeholder="Pegar URL del flyer (https://...)"
                  value={formData.flyerUrl}
                  onChange={(e) => setFormData({ ...formData, flyerUrl: e.target.value })}
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ==================== STEP 2: Sede y Fechas ==================== */}
      {step === 2 && (
        <Card className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold">Sede y Fechas</h2>
          </div>

          {/* Sede */}
          <div>
            <h3 className="text-sm font-medium text-light-text mb-2">Sede del Torneo (opcional)</h3>
            <SedeSelector
              selectedSedeId={selectedSede?.id || null}
              onSelect={(sede) => setSelectedSede(sede)}
              ciudad={formData.ciudad}
            />
            {selectedSede && (
              <div className="mt-2 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <p className="text-sm text-primary-400">
                  <strong>{selectedSede.nombre}</strong>
                  {selectedSede.direccion && ` — ${selectedSede.direccion}`}
                </p>
                <p className="text-xs text-primary-500/70 mt-0.5">
                  {selectedSede.canchas?.length || 0} cancha(s)
                </p>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-medium text-light-text">Fechas del Torneo</h3>
            </div>
            <p className="text-xs text-light-secondary mb-3">
              La fecha límite de inscripción debe ser <strong>anterior</strong> a la fecha de inicio.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Fecha de Inicio *"
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
              />
              <Input
                label="Fecha de Fin *"
                type="date"
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
              />
              <Input
                label="Límite Inscripción *"
                type="date"
                value={formData.fechaLimiteInscripcion}
                onChange={(e) => setFormData({ ...formData, fechaLimiteInscripcion: e.target.value })}
              />
            </div>
          </div>
        </Card>
      )}

      {/* ==================== STEP 3: Categorías y Modalidades ==================== */}
      {step === 3 && (
        <Card className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold">Categorías y Modalidades</h2>
            </div>
            <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
              !isPremium && selectedCategories.length >= MAX_CATEGORIES_FREE
                ? 'bg-red-900/30 text-red-400'
                : 'bg-primary-500/20 text-primary-400'
            }`}>
              {selectedCategories.length}{!isPremium ? `/${MAX_CATEGORIES_FREE}` : ''}
            </span>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const allIds = categories.map((c) => c.id);
                const limited = isPremium ? allIds : allIds.slice(0, MAX_CATEGORIES_FREE);
                setSelectedCategories(limited);
              }}
              className="text-xs px-3 py-1.5 bg-primary-500/20 text-primary-400 rounded-full hover:bg-primary-500/30 transition-colors"
            >
              Marcar todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategories([])}
              className="text-xs px-3 py-1.5 bg-dark-surface text-light-secondary rounded-full hover:bg-dark-hover transition-colors"
            >
              Desmarcar todos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Masculino */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-400">Caballeros</h4>
                <button
                  type="button"
                  onClick={() => {
                    const maleIds = maleCategories.map((c) => c.id);
                    const allSelected = maleIds.every((id) => selectedCategories.includes(id));
                    if (allSelected) {
                      setSelectedCategories((prev) => prev.filter((id) => !maleIds.includes(id)));
                    } else {
                      const toAdd = maleIds.filter((id) => !selectedCategories.includes(id));
                      if (!isPremium && selectedCategories.length + toAdd.length > MAX_CATEGORIES_FREE) {
                        toast.error(`Máximo ${MAX_CATEGORIES_FREE} categorías en plan gratuito`);
                        return;
                      }
                      setSelectedCategories((prev) => [...new Set([...prev, ...maleIds])]);
                    }
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {maleCategories.every((c) => selectedCategories.includes(c.id)) ? 'Desmarcar' : 'Marcar todos'}
                </button>
              </div>
              <div className="space-y-1.5">
                {maleCategories.map((category) => (
                  <Checkbox
                    key={category.id}
                    label={category.nombre}
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                ))}
              </div>
            </div>

            {/* Femenino */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-pink-400">Damas</h4>
                <button
                  type="button"
                  onClick={() => {
                    const femaleIds = femaleCategories.map((c) => c.id);
                    const allSelected = femaleIds.every((id) => selectedCategories.includes(id));
                    if (allSelected) {
                      setSelectedCategories((prev) => prev.filter((id) => !femaleIds.includes(id)));
                    } else {
                      const toAdd = femaleIds.filter((id) => !selectedCategories.includes(id));
                      if (!isPremium && selectedCategories.length + toAdd.length > MAX_CATEGORIES_FREE) {
                        toast.error(`Máximo ${MAX_CATEGORIES_FREE} categorías en plan gratuito`);
                        return;
                      }
                      setSelectedCategories((prev) => [...new Set([...prev, ...femaleIds])]);
                    }
                  }}
                  className="text-xs text-pink-400 hover:text-pink-300"
                >
                  {femaleCategories.every((c) => selectedCategories.includes(c.id)) ? 'Desmarcar' : 'Marcar todas'}
                </button>
              </div>
              <div className="space-y-1.5">
                {femaleCategories.map((category) => (
                  <Checkbox
                    key={category.id}
                    label={category.nombre}
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Modalidades */}
          <div className="pt-4 border-t border-dark-border">
            <h3 className="text-sm font-medium text-light-text mb-3">Modalidades *</h3>
            <div className="flex flex-wrap gap-3">
              {Object.values(Modalidad).map((modalidad) => (
                <button
                  key={modalidad}
                  type="button"
                  onClick={() => handleModalidadToggle(modalidad)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    selectedModalidades.includes(modalidad)
                      ? 'bg-primary-500/20 text-primary-400 border-primary-500/50'
                      : 'bg-dark-bg text-light-secondary border-dark-border hover:border-light-secondary'
                  }`}
                >
                  {selectedModalidades.includes(modalidad) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                  {modalidad}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ==================== STEP 4: Resumen ==================== */}
      {step === 4 && (
        <Card className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold">Resumen del Torneo</h2>
          </div>

          {/* Flyer preview */}
          {(flyerPreview || formData.flyerUrl) && (
            <div className="rounded-lg overflow-hidden border border-dark-border">
              <img
                src={flyerPreview || formData.flyerUrl}
                alt="Flyer"
                className="w-full h-40 sm:h-52 object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <SummaryRow label="Nombre" value={formData.nombre} />
              <SummaryRow label="Ubicación" value={`${formData.ciudad}, ${formData.region}, ${formData.pais}`} />
              <SummaryRow label="Costo" value={formatGs(formData.costoInscripcion)} />
              {selectedSede && <SummaryRow label="Sede" value={selectedSede.nombre} />}
              {selectedCircuito && (
                <SummaryRow label="Circuito" value={circuitos.find((c) => c.id === selectedCircuito)?.nombre || ''} />
              )}
            </div>
            <div className="space-y-3">
              <SummaryRow label="Inicio" value={formatDateDisplay(formData.fechaInicio)} />
              <SummaryRow label="Fin" value={formatDateDisplay(formData.fechaFin)} />
              <SummaryRow label="Cierre Inscripción" value={formatDateDisplay(formData.fechaLimiteInscripcion)} />
            </div>
          </div>

          {/* Categories summary */}
          <div className="border-t border-dark-border pt-4">
            <h3 className="text-sm font-medium text-light-text mb-2">
              {selectedCategories.length} Categorías — {selectedModalidades.join(', ')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-400 font-medium mb-1">Caballeros</p>
                <div className="flex flex-wrap gap-1">
                  {categories.filter((c) => selectedCategories.includes(c.id) && c.tipo === 'MASCULINO').map((c) => (
                    <span key={c.id} className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">
                      {c.nombre.replace(' Caballeros', '')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-pink-400 font-medium mb-1">Damas</p>
                <div className="flex flex-wrap gap-1">
                  {categories.filter((c) => selectedCategories.includes(c.id) && c.tipo === 'FEMENINO').map((c) => (
                    <span key={c.id} className="text-xs bg-pink-900/30 text-pink-400 px-2 py-0.5 rounded">
                      {c.nombre.replace(' Damas', '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {formData.descripcion && (
            <div className="border-t border-dark-border pt-4">
              <p className="text-xs text-light-secondary mb-1">Descripción</p>
              <p className="text-sm text-light-text whitespace-pre-line">{formData.descripcion}</p>
            </div>
          )}

          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-400">
              <Save className="w-3.5 h-3.5 inline mr-1" />
              El torneo se creará como <strong>Borrador</strong>. Podrás editarlo, configurar canchas, cuentas bancarias, y publicarlo cuando esté listo.
            </p>
          </div>
        </Card>
      )}

      {/* ==================== Navigation Buttons ==================== */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <Button variant="outline" onClick={() => { setError(''); setStep(step - 1); }}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Anterior
          </Button>
        ) : (
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        )}

        {step < STEP_LABELS.length ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!canProceed(step)}
          >
            Siguiente <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            className="min-w-[160px]"
          >
            <Save className="w-4 h-4 mr-1.5" /> Crear Torneo
          </Button>
        )}
      </div>
    </div>
  );
};

// Helper
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-light-secondary">{label}</p>
      <p className="text-sm font-medium text-light-text">{value}</p>
    </div>
  );
}

export default CreateTournamentPage;
