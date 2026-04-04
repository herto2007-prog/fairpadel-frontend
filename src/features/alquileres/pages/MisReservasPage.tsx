import { useEffect, useState, useMemo } from 'react';
import { alquileresService, Reserva } from '../../../services/alquileresService';
import { useToast } from '../../../components/ui/ToastProvider';
import { formatDatePY } from '../../../utils/date';
import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Clock3, AlertCircle } from 'lucide-react';

const estadoConfig = {
  PENDIENTE: { 
    icon: Clock3, 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'Pendiente' 
  },
  CONFIRMADA: { 
    icon: CheckCircle, 
    color: 'text-green-500', 
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Confirmada' 
  },
  CANCELADA: { 
    icon: XCircle, 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    label: 'Cancelada' 
  },
  RECHAZADA: { 
    icon: XCircle, 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Rechazada' 
  },
};

// Verificar si se puede cancelar (más de 4 horas antes del inicio)
const puedeCancelar = (reserva: Reserva): boolean => {
  if (reserva.estado === 'CANCELADA' || (reserva.estado as string) === 'RECHAZADA') return false;
  
  const ahora = new Date();
  const [year, month, day] = reserva.fecha.split('-').map(Number);
  const [hour, minute] = reserva.horaInicio.split(':').map(Number);
  const fechaInicio = new Date(year, month - 1, day, hour, minute);
  
  const diffMs = fechaInicio.getTime() - ahora.getTime();
  const diffHoras = diffMs / (1000 * 60 * 60);
  
  return diffHoras > 4;
};

// Agrupar reservas por fecha relativa
const agruparPorFecha = (reservas: Reserva[]) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const mañana = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);
  
  const estaSemana = new Date(hoy);
  estaSemana.setDate(estaSemana.getDate() + 7);
  
  const grupos: { 
    key: string; 
    label: string; 
    reservas: Reserva[];
    destacado: boolean;
  }[] = [
    { key: 'hoy', label: 'Hoy', reservas: [], destacado: true },
    { key: 'mañana', label: 'Mañana', reservas: [], destacado: true },
    { key: 'estaSemana', label: 'Esta semana', reservas: [], destacado: false },
    { key: 'proximas', label: 'Próximas', reservas: [], destacado: false },
    { key: 'pasadas', label: 'Pasadas', reservas: [], destacado: false },
  ];
  
  reservas.forEach(reserva => {
    const [year, month, day] = reserva.fecha.split('-').map(Number);
    const fechaReserva = new Date(year, month - 1, day);
    
    // Fecha pasada o canceladas/rechazadas recientes
    if (fechaReserva < hoy || reserva.estado === 'CANCELADA' || (reserva.estado as string) === 'RECHAZADA') {
      grupos[4].reservas.push(reserva);
      return;
    }
    
    // Hoy
    if (fechaReserva.getTime() === hoy.getTime()) {
      grupos[0].reservas.push(reserva);
      return;
    }
    
    // Mañana
    if (fechaReserva.getTime() === mañana.getTime()) {
      grupos[1].reservas.push(reserva);
      return;
    }
    
    // Esta semana (hasta 7 días)
    if (fechaReserva <= estaSemana) {
      grupos[2].reservas.push(reserva);
      return;
    }
    
    // Próximas
    grupos[3].reservas.push(reserva);
  });
  
  // Solo retornar grupos con reservas
  return grupos.filter(g => g.reservas.length > 0);
};

// Card individual de reserva
const ReservaCard = ({ 
  reserva, 
  onCancelar,
  destacado = false 
}: { 
  reserva: Reserva; 
  onCancelar: (id: string) => void;
  destacado?: boolean;
}) => {
  const config = estadoConfig[reserva.estado];
  const Icon = config.icon;
  const cancelable = puedeCancelar(reserva);
  
  return (
    <div 
      className={`
        rounded-xl border p-4 transition-all
        ${destacado ? 'bg-[#1a1f2e] border-[#df2531]/30' : 'bg-[#151921] border-[#232838]'}
        ${reserva.estado === 'CANCELADA' || (reserva.estado as string) === 'RECHAZADA' ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header: Estado y Cancelación */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
              <Icon size={12} />
              {config.label}
            </span>
            
            {cancelable && (
              <button
                onClick={() => onCancelar(reserva.id)}
                className="text-xs text-red-400 hover:text-red-300 underline"
              >
                Cancelar
              </button>
            )}
            
            {reserva.estado === 'CONFIRMADA' && !cancelable && (
              <span className="text-xs text-gray-500">
                No modificable
              </span>
            )}
          </div>
          
          {/* Info principal */}
          <h3 className="font-semibold text-white truncate">
            {reserva.sedeCancha?.sede.nombre}
          </h3>
          
          <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
            <MapPin size={14} className="text-[#df2531] flex-shrink-0" />
            <span className="truncate">{reserva.sedeCancha?.nombre}</span>
          </div>
          
          {/* Horario */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Clock size={14} className="text-gray-500" />
              <span className="font-medium">{reserva.horaInicio} - {reserva.horaFin}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-gray-400">
              <Calendar size={14} className="text-gray-500" />
              <span>{formatDatePY(reserva.fecha)}</span>
            </div>
          </div>
        </div>
        
        {/* Indicador visual para destacados */}
        {destacado && reserva.estado !== 'CANCELADA' && (reserva.estado as string) !== 'RECHAZADA' && (
          <div className="w-2 h-2 rounded-full bg-[#df2531] animate-pulse flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  );
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

  const grupos = useMemo(() => agruparPorFecha(reservas), [reservas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df2531]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mis Reservas</h1>
          <p className="text-gray-400 mt-1">
            {reservas.filter(r => r.estado !== 'CANCELADA' && (r.estado as string) !== 'RECHAZADA').length} reservas activas
          </p>
        </div>

        {/* Contenido */}
        {grupos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#151921] rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No tienes reservas</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              Explora las canchas disponibles y reserva tu próximo turno de padel
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {grupos.map((grupo) => (
              <section key={grupo.key}>
                {/* Header del grupo */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className={`
                    text-sm font-semibold uppercase tracking-wider
                    ${grupo.destacado ? 'text-[#df2531]' : 'text-gray-500'}
                  `}>
                    {grupo.label}
                  </h2>
                  <div className="flex-1 h-px bg-[#232838]" />
                  <span className="text-xs text-gray-500 bg-[#151921] px-2 py-1 rounded-full">
                    {grupo.reservas.length}
                  </span>
                </div>
                
                {/* Cards del grupo */}
                <div className="space-y-3">
                  {grupo.reservas.map((reserva) => (
                    <ReservaCard
                      key={reserva.id}
                      reserva={reserva}
                      onCancelar={handleCancelar}
                      destacado={grupo.destacado}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        
        {/* Info de política */}
        <div className="mt-12 p-4 bg-[#151921] rounded-xl border border-[#232838]">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-[#df2531] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Política de cancelación</h4>
              <p className="text-xs text-gray-400 mt-1">
                Podés cancelar tus reservas hasta 4 horas antes del horario de inicio. 
                Después de ese tiempo, la reserva no podrá ser modificada.
              </p>
            </div>
          </div>
        </div>
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
