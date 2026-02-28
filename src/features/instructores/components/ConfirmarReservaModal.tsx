import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { instructoresService } from '@/services/instructoresService';
import { Modal, Button } from '@/components/ui';
import {
  Calendar,
  Clock,
  Users,
  User as UserIcon,
  MessageSquare,
  DollarSign,
  Loader2,
  Send,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Instructor } from '@/types';

interface Props {
  instructor: Instructor;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  onClose: () => void;
  onCreated: () => void;
}

const ConfirmarReservaModal = ({ instructor, fecha, horaInicio, horaFin, onClose, onCreated }: Props) => {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<'INDIVIDUAL' | 'GRUPAL'>('INDIVIDUAL');
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const precio = tipo === 'INDIVIDUAL'
    ? instructor.precioIndividual
    : instructor.precioGrupal;

  const fechaFormatted = new Date(fecha + 'T00:00:00').toLocaleDateString('es-PY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleEnviar = async () => {
    setSending(true);
    try {
      await instructoresService.crearReserva(instructor.id, {
        tipo,
        fecha,
        horaInicio,
        mensaje: mensaje.trim() || undefined,
      });
      toast.success('Solicitud de reserva enviada');
      setEnviado(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al reservar');
    } finally {
      setSending(false);
    }
  };

  if (enviado) {
    return (
      <Modal isOpen onClose={onCreated} title="Reserva Enviada" size="sm">
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
          <h3 className="text-lg font-semibold text-light-text mb-1">Solicitud Enviada</h3>
          <p className="text-sm text-light-secondary mb-4">
            Tu solicitud fue enviada. El instructor la revisará y te confirmará.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="ghost" size="sm" onClick={onCreated}>
              Cerrar
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/instructores?tab=mis-clases')}>
              Ver mis reservas
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Confirmar Reserva" size="sm">
      <div className="space-y-4">
        {/* Instructor */}
        <div className="flex items-center gap-3 p-3 bg-dark-surface rounded-lg">
          {instructor.user?.fotoUrl ? (
            <img
              src={instructor.user.fotoUrl}
              alt={instructor.user.nombre}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-primary-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-light-text">
              {instructor.user?.nombre} {instructor.user?.apellido}
            </p>
            <p className="text-xs text-light-muted">Instructor</p>
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-dark-surface rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-light-muted mb-1">
              <Calendar className="h-3 w-3" />
              Fecha
            </div>
            <p className="text-sm text-light-text capitalize">{fechaFormatted}</p>
          </div>
          <div className="p-3 bg-dark-surface rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-light-muted mb-1">
              <Clock className="h-3 w-3" />
              Horario
            </div>
            <p className="text-sm text-light-text">{horaInicio} - {horaFin}</p>
          </div>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-xs text-light-muted mb-2">Tipo de clase</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTipo('INDIVIDUAL')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                tipo === 'INDIVIDUAL'
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-dark-border text-light-secondary hover:bg-dark-hover'
              }`}
            >
              <UserIcon className="h-4 w-4" />
              Individual
            </button>
            <button
              onClick={() => setTipo('GRUPAL')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                tipo === 'GRUPAL'
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-dark-border text-light-secondary hover:bg-dark-hover'
              }`}
            >
              <Users className="h-4 w-4" />
              Grupal
            </button>
          </div>
        </div>

        {/* Mensaje */}
        <div>
          <label className="block text-xs text-light-muted mb-2 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Mensaje (opcional)
          </label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value.slice(0, 300))}
            rows={2}
            placeholder="Contale al instructor qué querés trabajar..."
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>

        {/* Precio + Enviar */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-border">
          <div className="text-sm">
            {precio ? (
              <span className="flex items-center gap-1 text-light-text font-semibold">
                <DollarSign className="h-4 w-4 text-green-400" />
                Gs. {precio.toLocaleString()}
              </span>
            ) : (
              <span className="text-light-muted text-xs">Precio a coordinar</span>
            )}
          </div>
          <Button variant="primary" onClick={handleEnviar} disabled={sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Enviar Solicitud
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmarReservaModal;
