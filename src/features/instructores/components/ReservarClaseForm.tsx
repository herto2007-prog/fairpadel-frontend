import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instructoresService } from '@/services/instructoresService';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, Button } from '@/components/ui';
import {
  Calendar,
  Clock,
  Users,
  User as UserIcon,
  MessageSquare,
  DollarSign,
  Loader2,
  CheckCircle,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Instructor, HorarioSlot } from '@/types';

interface Props {
  instructor: Instructor;
}

const ReservarClaseForm = ({ instructor }: Props) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [tipo, setTipo] = useState<'INDIVIDUAL' | 'GRUPAL'>('INDIVIDUAL');
  const [fecha, setFecha] = useState('');
  const [horariosDisponibles, setHorariosDisponibles] = useState<HorarioSlot[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    if (fecha) {
      loadHorarios();
      setSelectedSlot(null);
    }
  }, [fecha]);

  const loadHorarios = async () => {
    setLoadingHorarios(true);
    try {
      const data = await instructoresService.getHorariosDisponibles(instructor.id, fecha);
      setHorariosDisponibles(data);
    } catch (err) {
      console.error('Error loading horarios:', err);
      setHorariosDisponibles([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const precio = tipo === 'INDIVIDUAL'
    ? instructor.precioIndividual
    : instructor.precioGrupal;

  const handleEnviar = async () => {
    if (!isAuthenticated) {
      toast.error('Tenés que iniciar sesión para reservar');
      navigate('/login');
      return;
    }
    if (!selectedSlot || !fecha) return;

    setSending(true);
    try {
      await instructoresService.crearReserva(instructor.id, {
        tipo,
        fecha,
        horaInicio: selectedSlot,
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
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
          <h3 className="text-lg font-semibold text-light-text mb-1">Solicitud Enviada</h3>
          <p className="text-sm text-light-secondary mb-4">
            Tu solicitud de reserva fue enviada. El instructor la revisará y te confirmará.
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/mis-clases')}>
            Ver mis reservas
          </Button>
        </CardContent>
      </Card>
    );
  }

  const slotsDisponibles = horariosDisponibles.filter((s) => s.disponible);

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <h3 className="font-semibold text-light-text flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-400" />
          Reservar Clase
        </h3>

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

        {/* Fecha */}
        <div>
          <label className="block text-xs text-light-muted mb-2">Fecha</label>
          <input
            type="date"
            value={fecha}
            min={minDate}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Horarios */}
        {fecha && (
          <div>
            <label className="block text-xs text-light-muted mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Horarios disponibles
            </label>
            {loadingHorarios ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
              </div>
            ) : slotsDisponibles.length === 0 ? (
              <p className="text-xs text-light-muted text-center py-3">
                No hay horarios disponibles para esta fecha
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slotsDisponibles.map((slot) => (
                  <button
                    key={slot.horaInicio}
                    onClick={() => setSelectedSlot(slot.horaInicio)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      selectedSlot === slot.horaInicio
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-dark-border text-light-secondary hover:bg-dark-hover'
                    }`}
                  >
                    {slot.horaInicio} - {slot.horaFin}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mensaje */}
        {selectedSlot && (
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
        )}

        {/* Precio + Enviar */}
        {selectedSlot && (
          <div className="flex items-center justify-between pt-2 border-t border-dark-border">
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
        )}
      </CardContent>
    </Card>
  );
};

export default ReservarClaseForm;
