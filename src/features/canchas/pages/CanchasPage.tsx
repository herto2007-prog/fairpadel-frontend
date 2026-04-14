import { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Clock, MessageCircle } from 'lucide-react';
import { api } from '../../../services/api';
import { DateCarousel } from '../../../components/ui/DateCarousel';
import { DurationSelector } from '../../../components/ui/DurationSelector';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { formatDatePYLong, getDateOnlyPY } from '../../../utils/date';
import { CanchaSelectionModal } from '../components/CanchaSelectionModal';
import { useNoIndex } from '../../../hooks/useNoIndex';

interface SedeDisponibilidad {
  sede: {
    id: string;
    nombre: string;
    ciudad: string;
    logoUrl?: string;
    direccion?: string;
  };
  canchasDisponibles: number;
  totalCanchas: number;
  horarios: string[];
  totalHorarios: number;
  canchas: Array<{
    cancha: {
      id: string;
      nombre: string;
      tipo: string;
      tieneLuz: boolean;
    };
    slots: Array<{
      horaInicio: string;
      horaFin: string;
      disponible: boolean;
    }>;
  }>;
}

export function CanchasPage() {
  useNoIndex();
  const [fecha, setFecha] = useState(() => getDateOnlyPY());
  const [duracionMinutos, setDuracionMinutos] = useState(120);
  const [loading, setLoading] = useState(false);
  const [sedes, setSedes] = useState<SedeDisponibilidad[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<SedeDisponibilidad | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const abortController = new AbortController();
    cargarDisponibilidad(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fecha, duracionMinutos]);

  const cargarDisponibilidad = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/alquileres/disponibilidad-global', {
        params: {
          fecha,
          duracionMinutos,
        },
        signal,
      });
      setSedes(data.sedes || []);
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return; // Ignorar errores de cancelación
      }
      setError('Error al cargar disponibilidad');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReservar = (sede: SedeDisponibilidad) => {
    setSedeSeleccionada(sede);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reservar Cancha</h1>
          <p className="text-white/60">
            {formatDatePYLong(fecha)}
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 space-y-4">
          {/* Carrusel de fechas - primera línea, centrado */}
          <div className="flex justify-center">
            <DateCarousel selectedDate={fecha} onSelectDate={setFecha} />
          </div>
          
          {/* Selector de duración - segunda línea, centrado */}
          <div className="flex justify-center">
            <DurationSelector
              duracionMinutos={duracionMinutos}
              onChange={setDuracionMinutos}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Buscando canchas disponibles...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 mb-2 font-medium">{error}</p>
            <p className="text-white/40 text-sm mb-4">No pudimos cargar la disponibilidad de canchas</p>
            <button
              onClick={() => cargarDisponibilidad()}
              className="px-4 py-2 bg-[#df2531] text-white rounded-lg hover:bg-[#df2531]/80 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Sin resultados */}
        {!loading && !error && sedes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay complejos disponibles
            </h3>
            <p className="text-white/50 max-w-md mx-auto mb-4">
              Actualmente no hay sedes con sistema de reservas activo. 
              Los complejos deportivos deben activar su suscripción para aparecer aquí.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-white/60 mb-3">
                💡 <strong className="text-white">¿Tenés un complejo?</strong><br />
                Registrá tu sede y activá el sistema de reservas para comenzar a recibir jugadores.
              </p>
              <a
                href="https://wa.me/595982342473?text=Hola%20FairPadel!%20Tengo%20un%20complejo%20de%20padel%20y%20quiero%20saber%20más%20sobre%20el%20sistema%20de%20reservas."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <MessageCircle size={18} />
                Contactar por WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Grid de Sedes */}
        {!loading && !error && sedes.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-white mb-4">
              Selecciona un complejo
              <span className="text-white/40 text-base font-normal ml-2">
                ({sedes.length} disponibles)
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sedes.map((item) => (
                <div
                  key={item.sede.id}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-[#df2531]/30 hover:bg-white/[0.05] transition-all group"
                >
                  {/* Logo/Header */}
                  <div className="h-32 bg-white/5 flex items-center justify-center p-6 relative">
                    {item.sede.logoUrl ? (
                      <img
                        src={item.sede.logoUrl}
                        alt={item.sede.nombre}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#df2531] to-[#ff4757] flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {item.sede.nombre.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {item.sede.nombre}
                    </h3>
                    <div className="flex items-center gap-1 text-white/50 text-sm mb-4">
                      <MapPin size={14} />
                      <span>{item.sede.ciudad}</span>
                      {item.sede.direccion && (
                        <span className="text-white/30">- {item.sede.direccion}</span>
                      )}
                    </div>

                    {/* Canchas disponibles */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-green-400 text-sm font-medium">
                        {item.canchasDisponibles} cancha{item.canchasDisponibles !== 1 ? 's' : ''} disponible{item.canchasDisponibles !== 1 ? 's' : ''}
                      </span>
                      <span className="text-white/30 text-sm">
                        de {item.totalCanchas}
                      </span>
                    </div>

                    {/* Horarios */}
                    {item.horarios.length > 0 && (
                      <div className="mb-4">
                        <p className="text-white/40 text-xs mb-2 flex items-center gap-1">
                          <Clock size={12} />
                          Horarios disponibles:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.horarios.map((hora) => (
                            <span
                              key={hora}
                              className="px-2 py-0.5 bg-white/5 text-white/70 text-xs rounded-md"
                            >
                              {hora}
                            </span>
                          ))}
                          {item.totalHorarios > item.horarios.length && (
                            <span className="px-2 py-0.5 bg-white/5 text-white/40 text-xs rounded-md">
                              +{item.totalHorarios - item.horarios.length} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botón */}
                    <button
                      onClick={() => handleReservar(item)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-[#df2531] border border-white/10 hover:border-[#df2531] rounded-xl text-white/80 hover:text-white transition-all group/btn"
                    >
                      <span>Ver canchas</span>
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de selección de cancha - siempre renderizado para animación de salida */}
      <CanchaSelectionModal
        isOpen={modalOpen && !!sedeSeleccionada}
        onClose={() => setModalOpen(false)}
        sede={sedeSeleccionada?.sede || { id: '', nombre: '', ciudad: '' }}
        canchas={sedeSeleccionada?.canchas || []}
        fecha={fecha}
        duracionMinutos={duracionMinutos}
        onReservaSuccess={() => {
          cargarDisponibilidad();
        }}
      />
    </div>
  );
}
