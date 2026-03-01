import { useState } from 'react';
import { X, MapPin, Clock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { alquileresService } from '@/services/alquileresService';
import toast from 'react-hot-toast';
import type { SlotAlquiler, TipoCancha } from '@/types';

const tipoCanchaLabel: Record<TipoCancha, string> = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  SEMI_TECHADA: 'Semi-techada',
};

function formatPrecio(precio: number): string {
  return precio.toLocaleString('es-PY') + ' Gs';
}

function formatFecha(fechaStr: string): string {
  const fecha = new Date(fechaStr + 'T12:00:00');
  return fecha.toLocaleDateString('es-PY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReserved: () => void;
  sedeId: string;
  sedeName: string;
  canchaId: string;
  canchaNombre: string;
  canchaTipo: TipoCancha;
  fecha: string;
  slot: SlotAlquiler;
  requiereAprobacion: boolean;
  duracionMinutos: number;
}

export default function ReservarCanchaModal({
  isOpen,
  onClose,
  onReserved,
  sedeId,
  sedeName,
  canchaId,
  canchaNombre,
  canchaTipo,
  fecha,
  slot,
  requiereAprobacion,
  duracionMinutos,
}: Props) {
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleReservar = async () => {
    setLoading(true);
    try {
      await alquileresService.crearReserva(sedeId, {
        sedeCanchaId: canchaId,
        fecha,
        horaInicio: slot.horaInicio,
        notas: notas.trim() || undefined,
      });
      toast.success(
        requiereAprobacion
          ? 'Reserva enviada! El encargado la confirmara pronto.'
          : 'Reserva confirmada!'
      );
      onReserved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al reservar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-dark-card rounded-xl border border-dark-border w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h3 className="font-semibold text-dark-text">Confirmar Reserva</h3>
          <button onClick={onClose} className="p-1 hover:bg-dark-hover rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Sede + Cancha */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-dark-text">{sedeName}</p>
              <p className="text-sm text-dark-muted">
                {canchaNombre} — {tipoCanchaLabel[canchaTipo]}
              </p>
            </div>
          </div>

          {/* Fecha + Hora */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-dark-text capitalize">{formatFecha(fecha)}</p>
              <p className="text-sm text-dark-muted">
                {slot.horaInicio} - {slot.horaFin} ({duracionMinutos} min)
              </p>
            </div>
          </div>

          {/* Precio */}
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-primary shrink-0" />
            <span className="text-lg font-bold text-primary">{formatPrecio(slot.precio)}</span>
          </div>

          {/* Pago en sede */}
          <div className="bg-dark-hover rounded-lg p-3 text-sm text-dark-muted">
            El pago se realiza directamente en la sede.
          </div>

          {/* Approval warning/info */}
          {requiereAprobacion ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-400">
                Tu reserva quedara pendiente de aprobacion por el encargado de la sede.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm text-green-400">
                Esta sede tiene confirmacion automatica. Tu reserva sera confirmada al instante.
              </p>
            </div>
          )}

          {/* Notas */}
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas opcionales..."
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-dark-border">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-lg border border-dark-border text-dark-muted hover:bg-dark-hover transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleReservar}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Reservando...' : 'Confirmar Reserva'}
          </button>
        </div>
      </div>
    </div>
  );
}
