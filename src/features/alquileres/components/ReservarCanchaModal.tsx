import { useState } from 'react';
import { MapPin, Clock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { alquileresService } from '@/services/alquileresService';
import { Button, Modal, Badge } from '@/components/ui';
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
          ? 'Reserva enviada! El encargado la confirmará pronto.'
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
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar reserva" size="md">
      <div className="space-y-4">
        {/* Sede + Cancha */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-light-text">{sedeName}</p>
            <p className="text-sm text-light-muted">
              {canchaNombre} — {tipoCanchaLabel[canchaTipo]}
            </p>
          </div>
        </div>

        {/* Fecha + Hora */}
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-light-text capitalize">{formatFecha(fecha)}</p>
            <p className="text-sm text-light-muted">
              {slot.horaInicio} - {slot.horaFin} ({duracionMinutos} min)
            </p>
          </div>
        </div>

        {/* Precio */}
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-primary-400 shrink-0" />
          <span className="text-lg font-bold text-primary-400">{formatPrecio(slot.precio)}</span>
        </div>

        {/* Pago en sede */}
        <div className="bg-dark-hover rounded-lg p-3 text-sm text-light-muted">
          El pago se realiza directamente en la sede.
        </div>

        {/* Approval warning/info */}
        {requiereAprobacion ? (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-400">
                Tu reserva quedará pendiente de aprobación por el encargado de la sede.
              </p>
              <div className="mt-1.5">
                <Badge variant="warning">Pendiente de aprobación</Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-green-400">
                Esta sede tiene confirmación automática. Tu reserva será confirmada al instante.
              </p>
              <div className="mt-1.5">
                <Badge variant="success">Confirmación automática</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="text-xs text-light-muted block mb-1">Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas opcionales..."
            className="w-full px-3 py-2 bg-dark-input border border-dark-border rounded-md text-sm text-light-text placeholder:text-light-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancelar
          </Button>
          <Button variant="primary" loading={loading} onClick={handleReservar} className="flex-1">
            Confirmar reserva
          </Button>
        </div>
      </div>
    </Modal>
  );
}
