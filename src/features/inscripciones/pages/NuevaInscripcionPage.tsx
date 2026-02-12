import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loading, Badge, Input } from '@/components/ui';
import tournamentsService from '@/services/tournamentsService';
import inscripcionesService, { CreateInscripcionDto } from '@/services/inscripcionesService';
import usersService from '@/services/usersService';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Tournament, Category, User } from '@/types';
import { CheckCircle, AlertCircle, Search, CreditCard, Building, Banknote, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

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
  
  // Formulario - Categoría y Modalidad
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedModalidad, setSelectedModalidad] = useState<Modalidad>('TRADICIONAL');
  
  // Formulario - Pago
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<MetodoPago | ''>('');

  // Resultado
  const [inscripcionResult, setInscripcionResult] = useState<any>(null);

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
      const [tournamentData, categoriesData] = await Promise.all([
        tournamentsService.getById(tournamentId!),
        tournamentsService.getCategories(),
      ]);
      setTournament(tournamentData);
      
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
    // Por ahora mostramos todas las del torneo

    // REGLA: MIXTO y SUMA no tienen restricción de género en frontend
    // Se muestran todas las categorías del torneo

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
    
    try {
      const userData = await usersService.getByDocumento(jugador2Documento);
      setJugador2(userData);
    } catch {
      setJugador2NotFound(true);
    } finally {
      setJugador2Loading(false);
    }
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
  const canProceedStep1 = jugador2Documento.trim().length > 0 && (jugador2 || (jugador2NotFound && acceptNotRegistered));
  const canProceedStep2 = selectedCategory && selectedModalidad && validarGenero().valid;
  const canProceedStep3 = Number(tournament?.costoInscripcion) === 0 || selectedMetodoPago !== '';

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
                👥 JUGADOR 2 - Documento de tu compañero/a
              </label>
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
                  }}
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
                <div className="grid grid-cols-2 gap-2">
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
              {/* Bancard */}
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
                  <p className="text-sm text-light-secondary">Sube tu comprobante después</p>
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
                <ol className="text-sm text-blue-400 list-decimal list-inside space-y-1">
                  <li>Realiza la transferencia por {formatCurrency(Number(tournament.costoInscripcion))}</li>
                  <li>Ve a "Mis Inscripciones" en tu perfil</li>
                  <li>Sube el comprobante de pago</li>
                  <li>Espera la confirmación del organizador</li>
                </ol>
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