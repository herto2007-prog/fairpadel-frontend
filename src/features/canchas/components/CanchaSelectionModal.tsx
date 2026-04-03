import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Sun, ChevronRight, Check } from 'lucide-react';
import { useToast } from '../../../components/ui/ToastProvider';
import { alquileresService } from '../../../services/alquileresService';

interface Slot {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

interface Cancha {
  cancha: {
    id: string;
    nombre: string;
    tipo: string;
    tieneLuz: boolean;
  };
  slots: Slot[];
}

interface SedeInfo {
  id: string;
  nombre: string;
  ciudad: string;
  logoUrl?: string;
  direccion?: string;
}

interface CanchaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sede: SedeInfo | { id: string; nombre: string; ciudad: string; logoUrl?: string; direccion?: string };
  canchas: Cancha[];
  fecha: string;
  duracionMinutos: number;
  onReservaSuccess?: () => void;
}

const TIPO_CANCHA_LABELS: Record<string, string> = {
  SINTETICO: 'Sintético',
  CEMENTO: 'Cemento',
  PANORAMICO: 'Panorámico',
};

export function CanchaSelectionModal({
  isOpen,
  onClose,
  sede,
  canchas,
  fecha,
  duracionMinutos,
  onReservaSuccess,
}: CanchaSelectionModalProps) {
  const { showSuccess, showError } = useToast();
  const [selectedCancha, setSelectedCancha] = useState<Cancha | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'selection' | 'confirmation'>('selection');

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedCancha(null);
      setSelectedSlot(null);
      setStep('selection');
      setLoading(false);
    }
  }, [isOpen]);

  const formatDuracion = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}m`;
  };

  const formatFecha = (fechaStr: string): string => {
    // Parsear YYYY-MM-DD manualmente para evitar bugs de timezone
    const [year, month, day] = fechaStr.split('-').map(Number);
    
    // Crear fecha con hora de Paraguay (12:00 -03:00) para obtener el día correcto
    const date = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00-03:00`);
    
    return date.toLocaleDateString('es-PY', {
      timeZone: 'America/Asuncion',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const handleSlotSelect = (cancha: Cancha, slot: Slot) => {
    setSelectedCancha(cancha);
    setSelectedSlot(slot);
    setStep('confirmation');
  };

  const handleBack = () => {
    setStep('selection');
    setSelectedCancha(null);
    setSelectedSlot(null);
  };

  const handleReservar = async () => {
    if (!selectedCancha || !selectedSlot) return;

    setLoading(true);
    try {
      await alquileresService.crearReserva({
        sedeCanchaId: selectedCancha.cancha.id,
        fecha,
        horaInicio: selectedSlot.horaInicio,
        horaFin: selectedSlot.horaFin,
        duracionMinutos,
        // Nota: el precio no se gestiona en la plataforma
      });

      showSuccess(
        'Reserva creada',
        `Tu reserva para ${formatFecha(fecha)} a las ${selectedSlot.horaInicio} fue creada exitosamente`
      );

      onReservaSuccess?.();
      onClose();
    } catch (err: any) {
      showError(
        'Error al reservar',
        err.response?.data?.message || 'No se pudo crear la reserva'
      );
    } finally {
      setLoading(false);
    }
  };

  const canchasConSlots = canchas.filter((c) => c.slots.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 -translate-x-1/2 top-4 bottom-4 w-[calc(100vw-32px)] md:w-[90vw] md:max-w-3xl md:top-[5vh] md:bottom-[5vh] md:max-h-[90vh] bg-[#0B0E14] border border-white/10 rounded-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                {sede.logoUrl ? (
                  <img
                    src={sede.logoUrl}
                    alt={sede.nombre}
                    className="w-10 h-10 rounded-lg object-contain bg-white/5"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#df2531] to-[#ff4757] flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {sede.nombre.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">{sede.nombre}</h2>
                  <div className="flex items-center gap-1 text-white/50 text-sm">
                    <MapPin size={12} />
                    <span>{sede.ciudad}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {step === 'selection' ? (
                <>
                  {/* Info de fecha y duración */}
                  <div className="flex items-center gap-4 mb-4 p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-white/70">
                      <Clock size={16} className="text-[#df2531]" />
                      <span className="text-sm">{formatFecha(fecha)}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2 text-white/70">
                      <Sun size={16} className="text-[#df2531]" />
                      <span className="text-sm">{formatDuracion(duracionMinutos)}</span>
                    </div>
                  </div>

                  {/* Lista de canchas - Grid de 2 columnas en desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {canchasConSlots.map((cancha) => (
                      <div
                        key={cancha.cancha.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-white font-medium text-sm">
                              {cancha.cancha.nombre}
                            </h4>
                            <div className="flex items-center gap-1 text-white/50 text-xs">
                              <span>{TIPO_CANCHA_LABELS[cancha.cancha.tipo] || cancha.cancha.tipo}</span>
                              {cancha.cancha.tieneLuz && (
                                <>
                                  <span>•</span>
                                  <span className="text-yellow-400">Con luz</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="text-green-400 text-xs">
                            {cancha.slots.length} horarios
                          </span>
                        </div>

                        {/* Grid de horarios - más compacto */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                          {cancha.slots.map((slot) => (
                            <button
                              key={slot.horaInicio}
                              onClick={() => handleSlotSelect(cancha, slot)}
                              className="flex flex-col items-center py-1.5 px-1 bg-white/5 hover:bg-[#df2531] border border-white/10 hover:border-[#df2531] rounded-lg transition-all group"
                            >
                              <span className="text-xs font-medium text-white group-hover:text-white">
                                {slot.horaInicio}
                              </span>
                              <span className="text-[10px] text-white/40 group-hover:text-white/70">
                                a {slot.horaFin}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {canchasConSlots.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-white/30" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        No hay horarios disponibles
                      </h3>
                      <p className="text-white/50 text-sm">
                        Intenta con otra fecha o duración
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Confirmación */}
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-6"
                  >
                    <ChevronRight className="rotate-180" size={16} />
                    Volver a horarios
                  </button>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">
                      Confirmar reserva
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-white/10">
                        <span className="text-white/60">Complejo</span>
                        <span className="text-white font-medium">{sede.nombre}</span>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-white/10">
                        <span className="text-white/60">Cancha</span>
                        <span className="text-white font-medium">
                          {selectedCancha?.cancha.nombre}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-white/10">
                        <span className="text-white/60">Fecha</span>
                        <span className="text-white font-medium">
                          {formatFecha(fecha)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-white/10">
                        <span className="text-white/60">Horario</span>
                        <span className="text-white font-medium">
                          {selectedSlot?.horaInicio} - {selectedSlot?.horaFin}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-white/10">
                        <span className="text-white/60">Duración</span>
                        <span className="text-white font-medium">
                          {formatDuracion(duracionMinutos)}
                        </span>
                      </div>


                    </div>
                  </div>

                  {/* Botón confirmar */}
                  <button
                    onClick={handleReservar}
                    disabled={loading}
                    className="w-full py-4 bg-[#df2531] hover:bg-[#df2531]/80 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Confirmar reserva
                      </>
                    )}
                  </button>

                  <p className="text-center text-white/40 text-sm mt-4">
                    Al confirmar, aceptas los términos y condiciones de reserva
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
