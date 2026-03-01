import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Search, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Loading, Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { alquileresService } from '@/services/alquileresService';
import StepIndicator from '../components/StepIndicator';
import SedeResultCard from '../components/SedeResultCard';
import ReservarCanchaModal from '../components/ReservarCanchaModal';
import type { SedeDisponibilidadResult, CanchaDisponibleResult } from '@/types';
import { TipoCancha } from '@/types';

const WIZARD_STEPS = ['Ubicación', 'Fecha y hora', 'Resultados', 'Elegir cancha'];

const tipoCanchaLabel: Record<TipoCancha, string> = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  SEMI_TECHADA: 'Semi-techada',
};

const tipoCanchaBadge: Record<TipoCancha, 'info' | 'success' | 'warning'> = {
  INDOOR: 'info',
  OUTDOOR: 'success',
  SEMI_TECHADA: 'warning',
};

function formatPrecio(precio: number): string {
  return precio.toLocaleString('es-PY') + ' Gs';
}

function formatFechaDisplay(fechaStr: string): string {
  const dateStr = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr;
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' });
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h < 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

export default function CanchasListPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Wizard state
  const [step, setStep] = useState(1);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [ciudadesLoading, setCiudadesLoading] = useState(true);
  const [ciudad, setCiudad] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [resultados, setResultados] = useState<SedeDisponibilidadResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSede, setSelectedSede] = useState<SedeDisponibilidadResult | null>(null);
  const [selectedCancha, setSelectedCancha] = useState<CanchaDisponibleResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Fetch cities on mount
  useEffect(() => {
    const fetchCiudades = async () => {
      setCiudadesLoading(true);
      try {
        const data = await alquileresService.getCiudadesConAlquiler();
        setCiudades(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Error cargando ciudades');
      } finally {
        setCiudadesLoading(false);
      }
    };
    fetchCiudades();
  }, []);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Check if a time slot is in the past (when fecha is today)
  function isTimeSlotPast(slot: string): boolean {
    if (fecha !== today) return false;
    const now = new Date();
    const [h, m] = slot.split(':').map(Number);
    return h < now.getHours() || (h === now.getHours() && m <= now.getMinutes());
  }

  // Search handler
  async function handleBuscar() {
    setSearchLoading(true);
    try {
      const response = await alquileresService.buscarDisponibilidad(ciudad, fecha, horaInicio);
      setResultados(response.sedes);
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error buscando disponibilidad');
    } finally {
      setSearchLoading(false);
    }
  }

  // Open reservation modal
  function openReservaModal(sede: SedeDisponibilidadResult, cancha: CanchaDisponibleResult) {
    if (!isAuthenticated) {
      toast.error('Debés iniciar sesión para reservar');
      return;
    }
    setSelectedSede(sede);
    setSelectedCancha(cancha);
    setModalOpen(true);
  }

  // Go back one step
  function goBack() {
    if (step === 4) {
      setSelectedSede(null);
      setStep(3);
    } else {
      setStep(step - 1);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Alquiler de Canchas</h1>
        <p className="text-sm text-light-secondary mt-1">
          Reservá tu cancha de pádel en los mejores clubes
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator steps={WIZARD_STEPS} currentStep={step} />
      </div>

      {/* Back button (steps 2-4) */}
      {step > 1 && (
        <div className="mb-4">
          <Button variant="ghost" onClick={goBack} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </div>
      )}

      {/* ──────────────────────────────────────────── */}
      {/* Step 1: Ubicación                            */}
      {/* ──────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-light-text">Elegí tu ciudad</h2>
          </div>

          {ciudadesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loading />
            </div>
          ) : ciudades.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="w-12 h-12 text-light-muted mx-auto mb-3" />
              <p className="text-light-muted">
                No hay ciudades con canchas disponibles en este momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {ciudades.map((c) => (
                <button
                  key={c}
                  onClick={() => setCiudad(c)}
                  className={`py-3 px-4 rounded-lg text-sm text-left transition-colors ${
                    ciudad === c
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                      : 'bg-dark-card border border-dark-border text-light-muted hover:bg-dark-hover'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Button
              variant="primary"
              disabled={!ciudad}
              onClick={() => setStep(2)}
              className="w-full sm:w-auto"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────── */}
      {/* Step 2: Fecha y Hora                         */}
      {/* ──────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          {/* Date picker */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-light-text">Elegí la fecha</h2>
            </div>
            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                // Reset time if switching to today and current selection is past
                if (e.target.value === today && horaInicio && isTimeSlotPast(horaInicio)) {
                  setHoraInicio('');
                }
              }}
              min={today}
              className="w-full px-4 py-3 bg-dark-input border border-dark-border rounded-lg text-light-text focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>

          {/* Time slots */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-light-text">Elegí la hora</h2>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isPast = isTimeSlotPast(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => !isPast && setHoraInicio(slot)}
                    disabled={isPast}
                    className={`py-3 px-4 rounded-lg text-sm transition-colors ${
                      isPast
                        ? 'bg-dark-card border border-dark-border text-light-muted/40 cursor-not-allowed'
                        : horaInicio === slot
                          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                          : 'bg-dark-card border border-dark-border text-light-muted hover:bg-dark-hover'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search button */}
          <Button
            variant="primary"
            disabled={!fecha || !horaInicio || searchLoading}
            loading={searchLoading}
            onClick={handleBuscar}
            className="w-full sm:w-auto gap-2"
          >
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>
      )}

      {/* ──────────────────────────────────────────── */}
      {/* Step 3: Resultados                           */}
      {/* ──────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-light-text">
              Canchas disponibles en {ciudad}
            </h2>
            <p className="text-sm text-light-muted mt-0.5 capitalize">
              {formatFechaDisplay(fecha)} a las {horaInicio}
            </p>
          </div>

          {resultados.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="w-12 h-12 text-light-muted mx-auto mb-3" />
              <p className="text-light-muted mb-4">
                No hay canchas disponibles para ese horario. Probá con otro horario o fecha.
              </p>
              <Button variant="primary" onClick={() => setStep(2)}>
                Cambiar búsqueda
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {resultados.map((sede) => (
                <SedeResultCard
                  key={sede.id}
                  sede={sede}
                  onReservar={(cancha) => openReservaModal(sede, cancha)}
                  onVerCanchas={(s) => {
                    setSelectedSede(s);
                    setStep(4);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────── */}
      {/* Step 4: Elegir Cancha                        */}
      {/* ──────────────────────────────────────────── */}
      {step === 4 && selectedSede && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-light-text">
              {selectedSede.nombre} — Elegí tu cancha
            </h2>
          </div>

          <div className="space-y-3">
            {selectedSede.canchasDisponibles.map((cancha) => (
              <div
                key={cancha.canchaId}
                className="bg-dark-card rounded-xl border border-dark-border p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1.5">
                  <h3 className="font-semibold text-light-text truncate">{cancha.canchaNombre}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={tipoCanchaBadge[cancha.canchaTipo]}>
                      {tipoCanchaLabel[cancha.canchaTipo]}
                    </Badge>
                    <span className="text-sm text-primary-400 font-medium">
                      {formatPrecio(cancha.precio)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => openReservaModal(selectedSede, cancha)}
                >
                  Seleccionar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────── */}
      {/* Step 5: Confirmation Modal                   */}
      {/* ──────────────────────────────────────────── */}
      {selectedSede && selectedCancha && (
        <ReservarCanchaModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedCancha(null);
          }}
          onReserved={() => navigate('/mis-reservas-cancha')}
          sedeId={selectedSede.id}
          sedeName={selectedSede.nombre}
          canchaId={selectedCancha.canchaId}
          canchaNombre={selectedCancha.canchaNombre}
          canchaTipo={selectedCancha.canchaTipo}
          fecha={fecha}
          slot={{
            horaInicio,
            horaFin: selectedCancha.horaFin,
            disponible: true,
            precio: selectedCancha.precio,
            motivo: null,
          }}
          requiereAprobacion={selectedSede.config.requiereAprobacion}
          duracionMinutos={selectedSede.config.duracionSlotMinutos}
        />
      )}
    </div>
  );
}
