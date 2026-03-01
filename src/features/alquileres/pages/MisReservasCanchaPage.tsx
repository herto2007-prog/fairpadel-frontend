import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, AlertTriangle, XCircle } from 'lucide-react';
import { Loading, Badge, Button } from '@/components/ui';
import { alquileresService } from '@/services/alquileresService';
import toast from 'react-hot-toast';
import type { ReservaCancha, ReservaCanchaEstado } from '@/types';

const estadoBadgeVariant: Record<ReservaCanchaEstado, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'outline' }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  CONFIRMADA: { label: 'Confirmada', variant: 'success' },
  RECHAZADA: { label: 'Rechazada', variant: 'danger' },
  CANCELADA: { label: 'Cancelada', variant: 'outline' },
  COMPLETADA: { label: 'Completada', variant: 'info' },
  NO_SHOW: { label: 'No Show', variant: 'danger' },
};

function formatFecha(fechaStr: string): string {
  const dateStr = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr;
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-PY', { weekday: 'short', day: '2-digit', month: 'short' });
}

function formatPrecio(precio: number): string {
  return precio.toLocaleString('es-PY') + ' Gs';
}

export default function MisReservasCanchaPage() {
  const [reservas, setReservas] = useState<ReservaCancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cancelando, setCancelando] = useState<string | null>(null);

  const fetchReservas = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await alquileresService.getMisReservas(filtroEstado || undefined);
      setReservas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, [filtroEstado]);

  const handleCancelar = async (reservaId: string) => {
    if (!confirm('¿Estás seguro de que querés cancelar esta reserva?')) return;
    setCancelando(reservaId);
    try {
      const result = await alquileresService.cancelarReserva(reservaId);
      if (result.compromisoPago) {
        toast('Reserva cancelada con compromiso de pago. Debés abonar el turno igualmente.', { icon: '⚠️' });
      } else {
        toast.success('Reserva cancelada');
      }
      fetchReservas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cancelar');
    } finally {
      setCancelando(null);
    }
  };

  const canCancel = (r: ReservaCancha) => {
    return r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Mis Reservas de Cancha</h1>
        <p className="text-sm sm:text-base text-light-secondary mt-1">Gestioná tus reservas de alquiler de canchas</p>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: '', label: 'Todas' },
          { value: 'PENDIENTE', label: 'Pendientes' },
          { value: 'CONFIRMADA', label: 'Confirmadas' },
          { value: 'COMPLETADA', label: 'Completadas' },
          { value: 'CANCELADA', label: 'Canceladas' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroEstado(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filtroEstado === f.value
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-card border border-dark-border text-light-muted hover:text-light-text hover:bg-dark-hover'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loading />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">{error}</div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-light-muted mx-auto mb-3" />
          <p className="text-light-muted">No tenés reservas{filtroEstado ? ` con estado ${filtroEstado.toLowerCase()}` : ''}.</p>
          <Link to="/canchas" className="text-primary-500 text-sm hover:underline mt-2 inline-block">
            Buscar canchas disponibles
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => {
            const badgeInfo = estadoBadgeVariant[r.estado];
            return (
              <div
                key={r.id}
                className="bg-dark-card rounded-xl border border-dark-border p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-light-text text-sm">
                        {(r as any).sedeCancha?.nombre || 'Cancha'}
                      </h3>
                      <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                      {r.pagado && (
                        <Badge variant="success">Pagado</Badge>
                      )}
                      {r.compromisoPago && (
                        <Badge variant="danger" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Compromiso de pago
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-light-muted">
                      {(r as any).sedeCancha?.sede?.nombre && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {(r as any).sedeCancha.sede.nombre}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatFecha(r.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {r.horaInicio} - {r.horaFin}
                      </span>
                    </div>

                    {r.motivoRechazo && (
                      <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {r.motivoRechazo}
                      </p>
                    )}
                  </div>

                  {/* Precio + Acción */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <span className="font-mono font-semibold text-light-text text-sm">
                      {formatPrecio(r.precio)}
                    </span>
                    {canCancel(r) && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelar(r.id)}
                        loading={cancelando === r.id}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
