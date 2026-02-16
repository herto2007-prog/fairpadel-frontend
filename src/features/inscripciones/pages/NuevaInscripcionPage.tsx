import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loading, Badge, Input } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';
import inscripcionesService, { CreateInscripcionDto } from '@/services/inscripcionesService';
import usersService from '@/services/usersService';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Tournament, Category, User, CuentaBancaria } from '@/types';
import { CheckCircle, AlertCircle, Search, CreditCard, Building, Banknote, ArrowLeft, ArrowRight, Loader2, Phone, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

type Modalidad = 'TRADICIONAL' | 'MIXTO' | 'SUMA';
type MetodoPago = 'BANCARD' | 'TRANSFERENCIA' | 'EFECTIVO';

// Orden de categorías (de mayor a menor - 1ra es la más alta)
const CATEGORY_ORDER: Record<string, number> = {
  '1ra': 1,
  '2da': 2,
  '3ra': 3,
  '4ta': 4,
  '5ta': 5,
  '6ta': 6,
  '7ma': 7,
  '8va': 8,
  '9na': 9,
  '10ma': 10,
};

// Función para extraer el número de categoría del nombre
const getCategoryLevel = (categoryName: string): number => {
  for (const [key, value] of Object.entries(CATEGORY_ORDER)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return 99; // Categorías desconocidas al final
};

// Función para verificar si es categoría de Caballeros
const isCaballerosCategory = (categoryName: string): boolean => {
  return categoryName.toLowerCase().includes('caballeros');
};

export default function NuevaInscripcionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const tournamentId = searchParams.get('tournamentId');

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Datos del torneo
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  
  // Formulario - Pareja
  const [jugador2Documento, setJugador2Documento] = useState('');
  const [jugador2, setJugador2] = useState<User | null>(null);
  const [jugador2Loading, setJugador2Loading] = useState(false);
  const [jugador2NotFound, setJugador2NotFound] = useState(false);
  const [acceptNotRegistered, setAcceptNotRegistered] = useState(false);
  const [searchMode, setSearchMode] = useState<'documento' | 'nombre'>('documento');
  const [nombreSearch, setNombreSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchingNombre, setSearchingNombre] = useState(false);
  const [consentCompanero, setConsentCompanero] = useState(false);
  
  // Formulario - Categoría y Modalidad
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedModalidad, setSelectedModalidad] = useState<Modalidad>('TRADICIONAL');
  
  // Formulario - Pago
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<MetodoPago | ''>('');
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);

  // Resultado
  const [inscripcionResult, setInscripcionResult] = useState<any>(null);

  // Comprobante upload (Step 5 — transferencia)
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [uploadingComprobante, setUploadingComprobante] = useState(false);
  const [comprobanteUploaded, setComprobanteUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tournamentId) {
      loadData();
    } else {
      setError('No se especificó el torneo');
      setLoading(false);
    }
  }, [tournamentId]);

  // Determinar la modalidad activa
  useEffect(() => {
    if (tournament?.modalidades?.length === 1) {
      setSelectedModalidad(tournament.modalidades[0].modalidad as Modalidad);
    }
  }, [tournament]);

  const loadData = async () => {
    try {
      const [tournamentData, categoriesData, cuentas] = await Promise.all([
        tournamentsService.getById(tournamentId!),
        tournamentsService.getCategories(),
        tournamentsService.getCuentasBancarias(tournamentId!),
      ]);
      setTournament(tournamentData);
      setCuentasBancarias(cuentas);

      // Filtrar categorías del torneo (solo las que tienen inscripción abierta)
      const openCategoryIds = (tournamentData.categorias || [])
        .filter((c: any) => c.inscripcionAbierta !== false)
        .map((c: any) => c.categoryId || c.category?.id);
      setAllCategories(categoriesData.filter((c: Category) => openCategoryIds.includes(c.id)));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos del torneo');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FILTRADO Y ORDENAMIENTO DE CATEGORÍAS
  // ═══════════════════════════════════════════════════════════════
  const filteredAndSortedCategories = useMemo(() => {
    if (!user || !allCategories.length) return [];

    let filtered = [...allCategories];

    // REGLA: Si el usuario es MASCULINO y modalidad es TRADICIONAL
    // Solo puede ver categorías de CABALLEROS
    if (user.genero === 'MASCULINO' && selectedModalidad === 'TRADICIONAL') {
      filtered = filtered.filter(cat => isCaballerosCategory(cat.nombre));
    }

    // REGLA: Si el usuario es FEMENINO y modalidad es TRADICIONAL
    // Puede ver DAMAS y CABALLEROS (pero con reglas específicas que se validan en backend)

    // REGLA: Restricción por nivel de categoría del jugador
    // En TRADICIONAL, solo puede inscribirse en su categoría o 1 nivel arriba
    if (user.categoriaActual && selectedModalidad === 'TRADICIONAL') {
      const userOrden = user.categoriaActual.orden;
      filtered = filtered.filter(cat => {
        // Same gender type check
        if (cat.tipo !== user.categoriaActual!.tipo) return true; // Different gender categories pass through
        const diff = userOrden - cat.orden;
        return diff >= 0 && diff <= 1; // Same level or 1 above
      });
    }

    // REGLA: MIXTO y SUMA no tienen restricción de género/nivel en frontend

    // Ordenar de mayor a menor (1ra primero, 8va último)
    filtered.sort((a, b) => {
      const levelA = getCategoryLevel(a.nombre);
      const levelB = getCategoryLevel(b.nombre);
      return levelA - levelB;
    });

    return filtered;
  }, [allCategories, user, selectedModalidad]);

  const buscarJugador2 = async () => {
    if (!jugador2Documento.trim()) return;

    setJugador2Loading(true);
    setJugador2(null);
    setJugador2NotFound(false);
    setAcceptNotRegistered(false);
    setSearchResults([]);

    try {
      const userData = await usersService.getByDocumento(jugador2Documento);
      setJugador2(userData);
    } catch {
      setJugador2NotFound(true);
    } finally {
      setJugador2Loading(false);
    }
  };

  const buscarPorNombre = async () => {
    if (!nombreSearch.trim() || nombreSearch.trim().length < 2) return;

    setSearchingNombre(true);
    setSearchResults([]);
    setJugador2(null);
    setJugador2NotFound(false);

    try {
      const results = await usersService.search(nombreSearch.trim());
      // Filter out current user
      const filtered = results.filter((u: User) => u.id !== user?.id);
      setSearchResults(filtered);
      if (filtered.length === 0) {
        setJugador2NotFound(true);
      }
    } catch {
      setJugador2NotFound(true);
    } finally {
      setSearchingNombre(false);
    }
  };

  const selectJugadorFromResults = (selected: User) => {
    setJugador2(selected);
    setJugador2Documento(selected.documento || '');
    setSearchResults([]);
    setJugador2NotFound(false);
  };

  const validarGenero = (): { valid: boolean; message: string } => {
    if (!jugador2) {
      return { valid: true, message: '' };
    }

    if (selectedModalidad === 'TRADICIONAL') {
      if (user?.genero !== jugador2.genero) {
        return {
          valid: false,
          message: 'En modalidad Tradicional, ambos jugadores deben ser del mismo género',
        };
      }
    }

    if (selectedModalidad === 'MIXTO') {
      if (user?.genero === jugador2.genero) {
        return {
          valid: false,
          message: 'En modalidad Mixto, los jugadores deben ser de géneros diferentes',
        };
      }
    }

    return { valid: true, message: '' };
  };

  // Validaciones de pasos
  const canProceedStep1 = jugador2Documento.trim().length > 0 && (jugador2 || (jugador2NotFound && acceptNotRegistered)) && consentCompanero;
  const canProceedStep2 = selectedCategory && selectedModalidad && validarGenero().valid;
  const canProceedStep3 = Number(tournament?.costoInscripcion) === 0 || selectedMetodoPago !== '';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return; }
    setComprobanteFile(file);
    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
    setComprobantePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setComprobanteFile(null);
    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
    setComprobantePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadComprobante = async () => {
    if (!comprobanteFile || !inscripcionResult) return;
    setUploadingComprobante(true);
    try {
      await inscripcionesService.uploadComprobante(inscripcionResult.id, comprobanteFile);
      toast.success('Comprobante enviado');
      setComprobanteUploaded(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al subir comprobante');
    } finally {
      setUploadingComprobante(false);
    }
  };

  const handleSubmit = async () => {
    if (!tournament || (!canProceedStep3 && Number(tournament.costoInscripcion) > 0)) return;

    setSubmitting(true);
    setError('');

    try {
      const data: CreateInscripcionDto = {
        tournamentId: tournament.id,
        categoryId: selectedCategory,
        modalidad: selectedModalidad,
        jugador2Documento,
        metodoPago: Number(tournament.costoInscripcion) === 0 ? 'EFECTIVO' : selectedMetodoPago as MetodoPago,
      };

      const result = await inscripcionesService.create(data);
      setInscripcionResult(result);
      setStep(5);
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message.join(', '));
      } else {
        setError(message || 'Error al procesar la inscripción');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" text="Cargando..." />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-light-secondary mb-4">{error || 'Torneo no encontrado'}</p>
          <Button onClick={() => navigate('/tournaments')}>
            Volver a Torneos
          </Button>
        </Card>
      </div>
    );
  }

  const generoValidation = validarGenero();
  const selectedCategoryData = allCategories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-dark-surface py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-light-secondary hover:text-light-text mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <h1 className="text-2xl font-bold">Inscripción al Torneo</h1>
          <p className="text-light-secondary">{tournament.nombre}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${step >= s ? 'bg-primary-500 text-white' : 'bg-dark-border text-light-secondary'}`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 5 && (
                <div className={`w-8 sm:w-12 h-1 ${step > s ? 'bg-primary-500' : 'bg-dark-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PASO 1: DATOS DE LA PAREJA */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Paso 1: Datos de la Pareja</h2>

            {/* Jugador 1 (Usuario actual) */}
            <div className="mb-6 p-4 bg-primary-500/10 rounded-lg border border-primary-500/30">
              <p className="text-sm text-primary-500 font-medium mb-2">👤 JUGADOR 1 (Tú)</p>
              <p className="font-semibold">{user?.nombre} {user?.apellido}</p>
              <p className="text-sm text-light-secondary">Doc: {user?.documento}</p>
              <p className="text-sm text-light-secondary">Género: {user?.genero}</p>
            </div>

            {/* Jugador 2 (Búsqueda) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-light-text mb-2">
                👥 JUGADOR 2 - Buscar compañero/a
              </label>

              {/* Search mode toggle */}
              <div className="flex gap-1 mb-3">
                <button
                  type="button"
                  onClick={() => { setSearchMode('documento'); setSearchResults([]); setJugador2NotFound(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${searchMode === 'documento' ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'}`}
                >
                  Por Documento
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchMode('nombre'); setSearchResults([]); setJugador2NotFound(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${searchMode === 'nombre' ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'}`}
                >
                  Por Nombre
                </button>
              </div>

              {searchMode === 'documento' ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Ej: 4567890"
                    value={jugador2Documento}
                    onChange={(e) => {
                      setJugador2Documento(e.target.value);
                      setJugador2(null);
                      setJugador2NotFound(false);
                      setAcceptNotRegistered(false);
                      setConsentCompanero(false);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarJugador2(); } }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={buscarJugador2}
                    disabled={!jugador2Documento.trim() || jugador2Loading}
                  >
                    {jugador2Loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Nombre o apellido..."
                      value={nombreSearch}
                      onChange={(e) => setNombreSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarPorNombre(); } }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={buscarPorNombre}
                      disabled={nombreSearch.trim().length < 2 || searchingNombre}
                    >
                      {searchingNombre ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  {/* Search results dropdown */}
                  {searchResults.length > 0 && !jugador2 && (
                    <div className="mt-2 bg-dark-card border border-dark-border rounded-lg max-h-48 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => selectJugadorFromResults(result)}
                          className="w-full px-4 py-2.5 text-left hover:bg-dark-hover transition-colors border-b border-dark-border/50 last:border-0 flex items-center gap-3"
                        >
                          {result.fotoUrl ? (
                            <img src={result.fotoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                              {result.nombre?.[0]}{result.apellido?.[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{result.nombre} {result.apellido}</p>
                            <p className="text-xs text-light-secondary">
                              Doc: {result.documento} · {result.genero} {result.ciudad ? `· ${result.ciudad}` : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resultado búsqueda - Encontrado */}
            {jugador2 && (
              <div className="mb-6 p-4 bg-primary-500/10 rounded-lg border border-primary-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-primary-500">Jugador encontrado</span>
                </div>
                <p className="font-semibold">{jugador2.nombre} {jugador2.apellido}</p>
                <p className="text-sm text-light-secondary">Género: {jugador2.genero}</p>
                {jugador2.ciudad && <p className="text-sm text-light-secondary">Ciudad: {jugador2.ciudad}</p>}
              </div>
            )}

            {/* Resultado búsqueda - No encontrado */}
            {jugador2NotFound && (
              <div className="mb-6 p-4 bg-yellow-900/30 rounded-lg border border-yellow-500/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-yellow-400">Jugador no registrado</span>
                </div>
                <p className="text-sm text-yellow-400 mb-3">
                  Este jugador aún no tiene cuenta en FairPadel.
                </p>
                <p className="text-sm text-yellow-400 mb-3">
                  ℹ️ Puedes continuar con la inscripción. La pareja se activará cuando
                  este jugador se registre con el documento: <strong>{jugador2Documento}</strong>
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptNotRegistered}
                    onChange={(e) => setAcceptNotRegistered(e.target.checked)}
                    className="w-4 h-4 text-primary-500 rounded"
                  />
                  <span className="text-sm text-yellow-400">Entiendo y deseo continuar</span>
                </label>
              </div>
            )}

            {/* Consent disclaimer — shown when partner is selected */}
            {(jugador2 || (jugador2NotFound && acceptNotRegistered)) && (
              <div className="mb-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentCompanero}
                    onChange={(e) => setConsentCompanero(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-primary-500 rounded flex-shrink-0"
                  />
                  <span className="text-sm text-amber-400">
                    Confirmo que mi compañero/a <strong>{jugador2 ? `${jugador2.nombre} ${jugador2.apellido}` : `(Doc: ${jugador2Documento})`}</strong> ha autorizado esta inscripción y está de acuerdo en participar del torneo.
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
              >
                Continuar <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PASO 2: CATEGORÍA Y MODALIDAD */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Paso 2: Categoría y Modalidad</h2>

            {/* Info: categoría actual del jugador */}
            {user?.categoriaActual && selectedModalidad === 'TRADICIONAL' && (
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Tu categoría actual:</strong> {user.categoriaActual.nombre}.
                  {' '}Podés inscribirte en tu categoría
                  {user.categoriaActual.orden > 1 && ' o aspirar a la categoría inmediata superior'}.
                </p>
              </div>
            )}

            {/* Modalidad - Solo si hay más de una */}
            {tournament.modalidades && tournament.modalidades.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-light-text mb-3">
                  ⚡ Selecciona la modalidad *
                </label>
                <div className="space-y-2">
                  {tournament.modalidades.map((mod: any) => (
                    <label
                      key={mod.modalidad}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                        ${selectedModalidad === mod.modalidad
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-border hover:bg-dark-hover'}`}
                    >
                      <input
                        type="radio"
                        name="modalidad"
                        value={mod.modalidad}
                        checked={selectedModalidad === mod.modalidad}
                        onChange={(e) => {
                          setSelectedModalidad(e.target.value as Modalidad);
                          setSelectedCategory(''); // Reset categoría al cambiar modalidad
                        }}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">{mod.modalidad}</p>
                        <p className="text-xs text-light-secondary">
                          {mod.modalidad === 'TRADICIONAL' && 'Ambos jugadores del mismo género'}
                          {mod.modalidad === 'MIXTO' && 'Un hombre y una mujer'}
                          {mod.modalidad === 'SUMA' && 'Combinación de categorías (sin restricción de género)'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Info de restricción */}
            {user?.genero === 'MASCULINO' && selectedModalidad === 'TRADICIONAL' && (
              <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/50">
                <p className="text-sm text-blue-400">
                  ℹ️ Como jugador masculino en modalidad Tradicional, solo puedes inscribirte en categorías de <strong>Caballeros</strong>.
                </p>
              </div>
            )}

            {/* Categoría */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-light-text mb-3">
                🎾 Selecciona tu categoría *
              </label>
              
              {filteredAndSortedCategories.length === 0 ? (
                <div className="p-4 bg-dark-surface rounded-lg text-center text-light-secondary">
                  No hay categorías disponibles para esta configuración
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredAndSortedCategories.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                        ${selectedCategory === cat.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-border hover:bg-dark-hover'}`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.id}
                        checked={selectedCategory === cat.id}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">{cat.nombre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Validación de género */}
            {!generoValidation.valid && (
              <div className="mb-6 p-4 bg-red-900/30 rounded-lg border border-red-500/50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-400">{generoValidation.message}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                Continuar <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PASO 3: RESUMEN */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Paso 3: Resumen de Inscripción</h2>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-dark-surface rounded-lg">
                <p className="text-sm text-light-secondary mb-1">🏆 Torneo</p>
                <p className="font-semibold">{tournament.nombre}</p>
                <p className="text-sm text-light-secondary">📍 {tournament.ciudad}</p>
                <p className="text-sm text-light-secondary">📅 {formatDate(tournament.fechaInicio)} - {formatDate(tournament.fechaFin)}</p>
              </div>

              <div className="p-4 bg-dark-surface rounded-lg">
                <p className="text-sm text-light-secondary mb-1">👥 Pareja</p>
                <p className="font-medium">• {user?.nombre} {user?.apellido}</p>
                <p className="font-medium">
                  • {jugador2 
                    ? `${jugador2.nombre} ${jugador2.apellido}` 
                    : `Doc: ${jugador2Documento} (pendiente de registro)`}
                </p>
              </div>

              <div className="p-4 bg-dark-surface rounded-lg">
                <p className="text-sm text-light-secondary mb-1">🎾 Categoría</p>
                <p className="font-semibold">{selectedCategoryData?.nombre}</p>
              </div>

              <div className="p-4 bg-dark-surface rounded-lg">
                <p className="text-sm text-light-secondary mb-1">⚡ Modalidad</p>
                <p className="font-semibold">{selectedModalidad}</p>
              </div>

              <div className="p-4 bg-primary-500/10 rounded-lg border-2 border-primary-500/30">
                <p className="text-sm text-primary-500 mb-1">💰 MONTO A PAGAR</p>
                <p className="text-3xl font-bold text-primary-500">
                  {Number(tournament.costoInscripcion) > 0 
                    ? formatCurrency(Number(tournament.costoInscripcion))
                    : '¡GRATIS!'}
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver
              </Button>
              <Button 
                onClick={() => Number(tournament.costoInscripcion) > 0 ? setStep(4) : handleSubmit()}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
                ) : Number(tournament.costoInscripcion) > 0 ? (
                  <>Continuar al pago <ArrowRight className="h-4 w-4 ml-2" /></>
                ) : (
                  <>Confirmar Inscripción</>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PASO 4: MÉTODO DE PAGO */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Paso 4: Método de Pago</h2>
            
            <p className="text-light-secondary mb-4">
              Monto a pagar: <strong className="text-primary-500">{formatCurrency(Number(tournament.costoInscripcion))}</strong>
            </p>

            <div className="space-y-3 mb-6">
              {/* Bancard — solo si habilitado por el organizador */}
              {tournament.habilitarBancard && (
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                    ${selectedMetodoPago === 'BANCARD'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-border hover:bg-dark-hover'}`}
                >
                  <input
                    type="radio"
                    name="metodoPago"
                    value="BANCARD"
                    checked={selectedMetodoPago === 'BANCARD'}
                    onChange={(e) => setSelectedMetodoPago(e.target.value as MetodoPago)}
                    className="mr-4"
                  />
                  <CreditCard className="h-6 w-6 mr-3 text-blue-600" />
                  <div>
                    <p className="font-medium">Tarjeta de crédito/débito (Bancard)</p>
                    <p className="text-sm text-light-secondary">Pago inmediato y seguro</p>
                  </div>
                </label>
              )}

              {/* Transferencia */}
              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                  ${selectedMetodoPago === 'TRANSFERENCIA'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-border hover:bg-dark-hover'}`}
              >
                <input
                  type="radio"
                  name="metodoPago"
                  value="TRANSFERENCIA"
                  checked={selectedMetodoPago === 'TRANSFERENCIA'}
                  onChange={(e) => setSelectedMetodoPago(e.target.value as MetodoPago)}
                  className="mr-4"
                />
                <Building className="h-6 w-6 mr-3 text-purple-600" />
                <div>
                  <p className="font-medium">Transferencia bancaria</p>
                  <p className="text-sm text-light-secondary">Transferí y subí tu comprobante desde Mis Inscripciones</p>
                </div>
              </label>

              {/* Efectivo */}
              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                  ${selectedMetodoPago === 'EFECTIVO'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-border hover:bg-dark-hover'}`}
              >
                <input
                  type="radio"
                  name="metodoPago"
                  value="EFECTIVO"
                  checked={selectedMetodoPago === 'EFECTIVO'}
                  onChange={(e) => setSelectedMetodoPago(e.target.value as MetodoPago)}
                  className="mr-4"
                />
                <Banknote className="h-6 w-6 mr-3 text-green-600" />
                <div>
                  <p className="font-medium">Efectivo (Presencial)</p>
                  <p className="text-sm text-light-secondary">Paga directamente al organizador</p>
                </div>
              </label>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!selectedMetodoPago || submitting}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
                ) : (
                  <>Confirmar Inscripción</>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PASO 5: CONFIRMACIÓN */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 5 && inscripcionResult && (
          <Card className="p-6 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-primary-500">¡Inscripción Registrada!</h2>
            </div>

            <div className="mb-6 p-4 bg-dark-surface rounded-lg text-left">
              <p className="text-sm text-light-secondary mb-1">Estado de tu inscripción:</p>
              <Badge 
                variant={
                  inscripcionResult.estado === 'CONFIRMADA' ? 'success' :
                  inscripcionResult.estado === 'PENDIENTE_PAGO_PRESENCIAL' ? 'warning' :
                  'default'
                }
                className="text-sm"
              >
                {inscripcionResult.estado.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Instrucciones según método de pago */}
            {selectedMetodoPago === 'TRANSFERENCIA' && (
              <div className="mb-6 p-4 bg-blue-900/30 rounded-lg text-left">
                <h3 className="font-bold text-blue-400 mb-2">🏦 Próximos pasos</h3>
                <ol className="text-sm text-blue-400 list-decimal list-inside space-y-1 mb-4">
                  <li>Transferí {formatCurrency(Number(tournament.costoInscripcion))} a cualquiera de estas cuentas</li>
                  <li>Subí la foto del comprobante acá abajo</li>
                  <li>El organizador va a confirmar tu pago</li>
                </ol>

                {cuentasBancarias.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-blue-300 uppercase">Datos para transferir:</p>
                    {cuentasBancarias.map((cuenta) => (
                      <div key={cuenta.id} className="p-3 bg-blue-950/50 rounded-lg border border-blue-500/20">
                        <p className="font-semibold text-blue-300">{cuenta.banco}</p>
                        <p className="text-sm text-blue-400">Titular: {cuenta.titular}</p>
                        <p className="text-sm text-blue-400">CI/RUC: {cuenta.cedulaRuc}</p>
                        {cuenta.nroCuenta && <p className="text-sm text-blue-400">Cuenta: {cuenta.nroCuenta}</p>}
                        {cuenta.aliasSpi && <p className="text-sm text-blue-300 font-medium">Alias SPI: {cuenta.aliasSpi}</p>}
                        {cuenta.telefonoComprobante && (
                          <p className="text-sm text-blue-400 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> Comprobante por WhatsApp: {cuenta.telefonoComprobante}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-blue-400/70 mb-4">
                    El organizador aún no configuró datos bancarios. Contactalo directamente para coordinar la transferencia.
                  </p>
                )}

                {/* Upload comprobante inline */}
                {!comprobanteUploaded ? (
                  <div className="mt-3 pt-3 border-t border-blue-500/20">
                    <p className="text-sm font-medium text-blue-300 mb-2">📷 Subir comprobante de transferencia</p>
                    {comprobantePreview ? (
                      <div className="relative mb-2">
                        <img
                          src={comprobantePreview}
                          alt="Comprobante"
                          className="w-full max-h-40 object-contain rounded-lg border border-blue-500/20 bg-blue-950/30"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 border-2 border-dashed border-blue-500/30 rounded-lg hover:border-blue-500/60 hover:bg-blue-500/5 transition-colors flex flex-col items-center gap-1 text-blue-400"
                      >
                        <Upload className="w-6 h-6" />
                        <span className="text-sm font-medium">Toca para subir imagen</span>
                        <span className="text-xs opacity-70">JPG, PNG (máx. 5MB)</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {comprobanteFile && (
                      <Button
                        onClick={handleUploadComprobante}
                        disabled={uploadingComprobante}
                        className="w-full mt-2"
                      >
                        {uploadingComprobante ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo...</>
                        ) : (
                          <>Enviar Comprobante</>
                        )}
                      </Button>
                    )}
                    <p className="text-xs text-blue-400/60 mt-1">
                      También podés subir el comprobante después desde "Mis Inscripciones"
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-blue-500/20">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Comprobante enviado correctamente</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedMetodoPago === 'EFECTIVO' && (
              <div className="mb-6 p-4 bg-green-900/30 rounded-lg text-left">
                <h3 className="font-bold text-green-400 mb-2">💵 Pago en Efectivo</h3>
                <p className="text-sm text-green-400 mb-2">
                  Coordina con el organizador para realizar el pago presencial.
                </p>
                <p className="text-sm text-green-400">
                  <strong>Monto a pagar:</strong> {formatCurrency(Number(tournament.costoInscripcion))}
                </p>
                {tournament.sede && (
                  <p className="text-sm text-green-400 mt-2">
                    <strong>Sede:</strong> {tournament.sede}
                  </p>
                )}
              </div>
            )}

            {selectedMetodoPago === 'BANCARD' && (
              <div className="mb-6 p-4 bg-purple-900/30 rounded-lg text-left">
                <h3 className="font-bold text-purple-400 mb-2">💳 Pago con Tarjeta</h3>
                <p className="text-sm text-purple-400 mb-3">
                  Serás redirigido a Bancard para completar el pago de forma segura.
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Ir a pagar con Bancard
                </Button>
              </div>
            )}

            {Number(tournament.costoInscripcion) === 0 && (
              <div className="mb-6 p-4 bg-primary-500/10 rounded-lg text-left">
                <h3 className="font-bold text-primary-500 mb-2">🎉 ¡Torneo Gratuito!</h3>
                <p className="text-sm text-primary-500">
                  Tu inscripción está confirmada. ¡Nos vemos en la cancha!
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/inscripciones')}>
                Ver Mis Inscripciones
              </Button>
              <Button variant="outline" onClick={() => navigate('/tournaments')}>
                Volver a Torneos
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}