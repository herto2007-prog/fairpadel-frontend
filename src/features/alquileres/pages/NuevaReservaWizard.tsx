import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ChevronRight, ChevronLeft, Search, Filter, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Loading, Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { alquileresService } from '@/services/alquileresService';
import type { SedeAlquilerResumen, DisponibilidadDia } from '@/types';
import { TipoCancha } from '@/types';

const tipoCanchaLabel: Record<TipoCancha, string> = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  SEMI_TECHADA: 'Semi-techada',
};

const tipoCanchaColors: Record<TipoCancha, string> = {
  INDOOR: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  OUTDOOR: 'bg-green-500/20 text-green-400 border-green-500/50',
  SEMI_TECHADA: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
};

function formatPrecio(precio: number): string {
  if (precio >= 1000000) return (precio / 1000000).toFixed(1) + 'M Gs';
  if (precio >= 1000) return (precio / 1000).toFixed(0) + 'k Gs';
  return precio + ' Gs';
}

function formatFecha(fechaStr: string): string {
  const d = new Date(fechaStr + 'T12:00:00');
  return d.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getDiasSemana(): { fecha: string; label: string; dia: number }[] {
  const dias = [];
  const hoy = new Date();
  const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  for (let i = 0; i < 14; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    const fechaStr = fecha.toISOString().split('T')[0];
    dias.push({
      fecha: fechaStr,
      label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : nombres[fecha.getDay()],
      dia: fecha.getDate(),
    });
  }
  return dias;
}

export default function NuevaReservaWizard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  // Wizard state
  const [step, setStep] = useState(1);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [ciudad, setCiudad] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [tipoCanchaFiltro, setTipoCanchaFiltro] = useState<TipoCancha | ''>('');
  const [precioMax, setPrecioMax] = useState<number | ''>('');
  
  // Data
  const [sedes, setSedes] = useState<SedeAlquilerResumen[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<SedeAlquilerResumen | null>(null);
  const [disponibilidadDia, setDisponibilidadDia] = useState<DisponibilidadDia | null>(null);
  const [loading, setLoading] = useState(false);
  const [reservando, setReservando] = useState(false);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<{ id: string; nombre: string; tipo: TipoCancha; precio: number } | null>(null);
  const [notas, setNotas] = useState('');

  const diasSemana = useMemo(() => getDiasSemana(), []);

  // Load ciudades on mount
  useEffect(() => {
    alquileresService.getCiudadesConAlquiler()
      .then(setCiudades)
      .catch(() => toast.error('Error cargando ciudades'));
  }, []);

  // Step 2: Load sedes when ciudad changes
  useEffect(() => {
    if (!ciudad) return;
    setLoading(true);
    alquileresService.getSedesConAlquiler({ ciudad })
      .then(setSedes)
      .catch(() => toast.error('Error cargando sedes'))
      .finally(() => setLoading(false));
  }, [ciudad]);

  // Step 3: Load disponibilidad
  const cargarDisponibilidad = async (sede: SedeAlquilerResumen, fechaSel: string) => {
    setLoading(true);
    try {
      const data = await alquileresService.getDisponibilidadDia(sede.id, fechaSel);
      setDisponibilidadDia(data);
      setSedeSeleccionada(sede);
      setStep(3);
    } catch {
      toast.error('Error cargando disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  // Filter sedes
  const sedesFiltradas = useMemo(() => {
    return sedes.filter(s => {
      if (tipoCanchaFiltro && !s.tiposCanchas.includes(tipoCanchaFiltro)) return false;
      if (precioMax && s.precioMin > precioMax) return false;
      return true;
    });
  }, [sedes, tipoCanchaFiltro, precioMax]);

  // Get available time slots for selected court
  const getSlotsDisponibles = (canchaId: string) => {
    if (!disponibilidadDia) return [];
    const cancha = disponibilidadDia.canchas.find(c => c.canchaId === canchaId);
    if (!cancha) return [];
    return cancha.slots.filter(s => s.disponible);
  };

  // Handle reservation
  const handleReservar = async () => {
    if (!isAuthenticated) {
      toast.error('Debés iniciar sesión para reservar');
      return;
    }
    if (!sedeSeleccionada || !canchaSeleccionada || !fecha || !horaInicio) return;

    setReservando(true);
    try {
      await alquileresService.crearReserva(sedeSeleccionada.id, {
        sedeCanchaId: canchaSeleccionada.id,
        fecha,
        horaInicio,
        notas: notas.trim() || undefined,
      });
      toast.success('¡Reserva confirmada!');
      navigate('/mis-reservas-cancha');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al reservar');
    } finally {
      setReservando(false);
    }
  };

  // Generar slots de hora para el selector
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 6; h < 23; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-light-text mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-400" />
          ¿Dónde querés jugar?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ciudades.map((c) => (
            <button
              key={c}
              onClick={() => { setCiudad(c); setStep(2); }}
              className={`py-4 px-4 rounded-xl text-sm font-medium transition-all ${
                ciudad === c
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-card border border-dark-border text-light-muted hover:bg-dark-hover hover:border-primary-500/50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-light-text flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-400" />
          Sedes en {ciudad}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
          <ChevronLeft className="w-4 h-4" /> Cambiar ciudad
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 p-3 bg-dark-card rounded-xl border border-dark-border">
        <div className="flex items-center gap-2 text-light-muted text-sm">
          <Filter className="w-4 h-4" /> Filtrar:
        </div>
        <select
          value={tipoCanchaFiltro}
          onChange={(e) => setTipoCanchaFiltro(e.target.value as TipoCancha | '')}
          className="bg-dark-input border border-dark-border rounded-lg px-3 py-1.5 text-sm text-light-text"
        >
          <option value="">Todas las canchas</option>
          {Object.entries(tipoCanchaLabel).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value ? parseInt(e.target.value) : '')}
          className="bg-dark-input border border-dark-border rounded-lg px-3 py-1.5 text-sm text-light-text"
        >
          <option value="">Cualquier precio</option>
          <option value={50000}>Hasta 50k</option>
          <option value={100000}>Hasta 100k</option>
          <option value={150000}>Hasta 150k</option>
        </select>
      </div>

      {/* Grid de sedes */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      ) : sedesFiltradas.length === 0 ? (
        <div className="text-center py-12 text-light-muted">
          No hay sedes que coincidan con los filtros
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sedesFiltradas.map((sede) => (
            <div
              key={sede.id}
              className="bg-dark-card rounded-xl border border-dark-border overflow-hidden hover:border-primary-500/50 transition-colors group"
            >
              {sede.imagenFondo ? (
                <div className="h-32 overflow-hidden">
                  <img 
                    src={sede.imagenFondo} 
                    alt={sede.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-primary-400/50" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-light-text">{sede.nombre}</h3>
                    <p className="text-sm text-light-muted">{sede.direccion || sede.ciudad}</p>
                  </div>
                  {sede.logoUrl && (
                    <img src={sede.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain bg-dark-surface" />
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {sede.tiposCanchas.slice(0, 3).map(tipo => (
                    <Badge key={tipo} variant="default" className={tipoCanchaColors[tipo]}>
                      {tipoCanchaLabel[tipo]}
                    </Badge>
                  ))}
                  <Badge variant="default" className="bg-dark-surface text-light-muted">
                    {sede.canchasCount} canchas
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm">
                    <span className="text-primary-400 font-semibold">{formatPrecio(sede.precioMin)}</span>
                    {sede.precioMax > sede.precioMin && (
                      <span className="text-light-muted"> - {formatPrecio(sede.precioMax)}</span>
                    )}
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => setStep(2.5)}
                  >
                    Ver disponibilidad
                  </Button>
                </div>

                {/* Selector de fecha inline */}
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <p className="text-xs text-light-muted mb-2">Elegí una fecha:</p>
                  <div className="flex gap-1 overflow-x-auto pb-2">
                    {diasSemana.map((d) => (
                      <button
                        key={d.fecha}
                        onClick={() => { setFecha(d.fecha); cargarDisponibilidad(sede, d.fecha); }}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-center min-w-[60px] transition-colors ${
                          fecha === d.fecha
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-surface border border-dark-border text-light-muted hover:bg-dark-hover'
                        }`}
                      >
                        <div className="text-xs">{d.label}</div>
                        <div className="font-semibold">{d.dia}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => {
    if (!disponibilidadDia || !sedeSeleccionada) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
            <ChevronLeft className="w-4 h-4" /> Volver
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-light-text">{sedeSeleccionada.nombre}</h2>
            <p className="text-sm text-light-muted capitalize">{formatFecha(fecha)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" text="Cargando horarios..." />
          </div>
        ) : (
          <div className="space-y-4">
            {disponibilidadDia.canchas.map((cancha) => {
              const slots = cancha.slots.filter(s => s.disponible);
              if (slots.length === 0) return null;

              return (
                <div key={cancha.canchaId} className="bg-dark-card rounded-xl border border-dark-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-light-text">{cancha.canchaNombre}</h3>
                      <Badge variant="default" className={tipoCanchaColors[cancha.canchaTipo]}>
                        {tipoCanchaLabel[cancha.canchaTipo]}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-light-muted mb-2">Horarios disponibles:</p>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.horaInicio}
                        onClick={() => {
                          setHoraInicio(slot.horaInicio);
                          setCanchaSeleccionada({
                            id: cancha.canchaId,
                            nombre: cancha.canchaNombre,
                            tipo: cancha.canchaTipo,
                            precio: slot.precio,
                          });
                          setStep(4);
                        }}
                        className="px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-sm text-light-text hover:bg-primary-500/20 hover:border-primary-500/50 hover:text-primary-400 transition-colors"
                      >
                        {slot.horaInicio}
                        <span className="text-light-muted ml-1">- {formatPrecio(slot.precio)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => {
    if (!sedeSeleccionada || !canchaSeleccionada || !horaInicio) return null;

    const slot = disponibilidadDia?.canchas
      .find(c => c.canchaId === canchaSeleccionada.id)
      ?.slots.find(s => s.horaInicio === horaInicio);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
            <ChevronLeft className="w-4 h-4" /> Volver
          </Button>
          <h2 className="text-lg font-semibold text-light-text">Confirmar reserva</h2>
        </div>

        {/* Resumen tipo ticket */}
        <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500/20 to-primary-600/10 p-4 border-b border-dark-border">
            <h3 className="font-bold text-light-text text-lg">{sedeSeleccionada.nombre}</h3>
            <p className="text-light-muted text-sm">{sedeSeleccionada.direccion}</p>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-light-muted">Fecha</p>
                <p className="font-medium text-light-text capitalize">{formatFecha(fecha)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-light-muted">Horario</p>
                <p className="font-medium text-light-text">
                  {horaInicio} - {slot?.horaFin}
                  <span className="text-light-muted ml-2">({disponibilidadDia?.duracionSlotMinutos} min)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-light-muted">Cancha</p>
                <p className="font-medium text-light-text">
                  {canchaSeleccionada.nombre}
                  <Badge variant="default" className={`ml-2 ${tipoCanchaColors[canchaSeleccionada.tipo]}`}>
                    {tipoCanchaLabel[canchaSeleccionada.tipo]}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="border-t border-dark-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-light-muted">Total a pagar en sede:</span>
                <span className="text-2xl font-bold text-primary-400">
                  {formatPrecio(canchaSeleccionada.precio)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="text-sm text-light-muted block mb-2">
            Notas para el club (opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: Llevamos pelotas, somos 4 jugadores..."
            className="w-full px-4 py-3 bg-dark-input border border-dark-border rounded-xl text-light-text placeholder:text-light-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
          />
        </div>

        {/* Info política */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-dark-surface border border-dark-border">
          <Info className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-light-muted">
            Podés cancelar tu reserva hasta 4 horas antes sin cargo. 
            Después de ese plazo quedará registrado el compromiso de pago.
          </p>
        </div>

        {/* Botón confirmar */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={reservando}
          onClick={handleReservar}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Confirmar reserva
        </Button>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Reservar Cancha</h1>
        <p className="text-light-muted mt-1">Encontrá y reservá tu cancha en minutos</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full transition-colors ${
              s <= step ? 'bg-primary-500' : 'bg-dark-border'
            }`}
          />
        ))}
      </div>

      {/* Steps */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  );
}
