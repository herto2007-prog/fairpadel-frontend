import { useEffect, useState } from 'react';
import { alquileresService, Reserva } from '../../../services/alquileresService';
import { useToast } from '../../../components/ui/ToastProvider';
import { formatDatePY } from '../../../utils/date';
import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Clock3 } from 'lucide-react';

const estadoConfig = {
  PENDIENTE: { icon: Clock3, color: 'text-yellow-500', label: 'Pendiente' },
  CONFIRMADA: { icon: CheckCircle, color: 'text-green-500', label: 'Confirmada' },
  CANCELADA: { icon: XCircle, color: 'text-red-500', label: 'Cancelada' },
  RECHAZADA: { icon: XCircle, color: 'text-red-500', label: 'Rechazada' },
};

// Verificar si se puede cancelar (más de 4 horas antes del inicio)
const puedeCancelar = (reserva: Reserva): boolean => {
  const ahora = new Date();
  
  // Crear fecha de inicio de la reserva
  const [year, month, day] = reserva.fecha.split('-').map(Number);
  const [hour, minute] = reserva.horaInicio.split(':').map(Number);
  const fechaInicio = new Date(year, month - 1, day, hour, minute);
  
  // Calcular diferencia en horas
  const diffMs = fechaInicio.getTime() - ahora.getTime();
  const diffHoras = diffMs / (1000 * 60 * 60);
  
  return diffHoras > 4;
};

export default function MisReservasPage() {
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmState } = useConfirm();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservas();
  }, []);

  const loadReservas = async () => {
    try {
      setLoading(true);
      const data = await alquileresService.getMisReservas();
      setReservas(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id: string) => {
    const confirmed = await confirm({
      title: 'Cancelar reserva',
      message: '¿Estás seguro de cancelar esta reserva? Esta acción no se puede deshacer.',
      confirmText: 'Cancelar reserva',
      cancelText: 'Mantener',
      variant: 'warning',
    });
    if (!confirmed) return;
    
    try {
      await alquileresService.cancelarReserva(id, {});
      showSuccess('Reserva cancelada', 'Tu reserva ha sido cancelada exitosamente');
      loadReservas();
    } catch (err: any) {
      showError('Error al cancelar', err.response?.data?.message || 'No se pudo cancelar la reserva');
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mis Reservas</h1>

        <div className="space-y-4">
          {reservas.map((reserva) => {
            const config = estadoConfig[reserva.estado];
            const Icon = config.icon;

            return (
              <div
                key={reserva.id}
                className="bg-[#151921] rounded-lg border border-[#232838] p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-[#df2531]" />
                      <span className="font-medium">
                        {reserva.sedeCancha?.sede.nombre} - {reserva.sedeCancha?.nombre}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={16} />
                      <span>{formatDatePY(reserva.fecha)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock size={16} />
                      <span>{reserva.horaInicio} - {reserva.horaFin}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Icon size={16} className={config.color} />
                      <span className={config.color}>{config.label}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    {/* Puede cancelar si está pendiente o confirmada y faltan más de 4h */}
                    {(reserva.estado === 'PENDIENTE' || reserva.estado === 'CONFIRMADA') && puedeCancelar(reserva) && (
                      <button
                        onClick={() => handleCancelar(reserva.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Cancelar reserva
                      </button>
                    )}
                    
                    {/* Mostrar info si ya no se puede cancelar */}
                    {reserva.estado === 'CONFIRMADA' && !puedeCancelar(reserva) && (
                      <p className="text-xs text-gray-500">
                        No se puede cancelar (menos de 4h)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {reservas.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No tienes reservas de canchas
          </div>
        )}
      </div>
      
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={confirmState.close}
        onConfirm={confirmState.handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
}
