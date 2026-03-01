import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { alquileresService } from '@/services/alquileresService';
import toast from 'react-hot-toast';
import type { ReservaCancha, ReservaCanchaEstado } from '@/types';

const estadoBadge: Record<ReservaCanchaEstado, { label: string; className: string }> = {
  PENDIENTE: { label: 'Pendiente', className: 'bg-yellow-500/20 text-yellow-400' },
  CONFIRMADA: { label: 'Confirmada', className: 'bg-green-500/20 text-green-400' },
  RECHAZADA: { label: 'Rechazada', className: 'bg-red-500/20 text-red-400' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-500/20 text-gray-400' },
  COMPLETADA: { label: 'Completada', className: 'bg-blue-500/20 text-blue-400' },
  NO_SHOW: { label: 'No Show', className: 'bg-red-500/20 text-red-400' },
};

function formatFecha(fechaStr: string): string {
  const d = new Date(fechaStr + 'T12:00:00');
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
        <h1 className="text-2xl font-bold text-dark-text">Mis Reservas de Cancha</h1>
        <p className="text-dark-muted mt-1">Gestiona tus reservas de alquiler de canchas</p>
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
                ? 'bg-primary text-white'
                : 'bg-dark-card border border-dark-border text-dark-muted hover:text-dark-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">{error}</div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-dark-muted mx-auto mb-3" />
          <p className="text-dark-muted">No tenés reservas{filtroEstado ? ` con estado ${filtroEstado.toLowerCase()}` : ''}.</p>
          <Link to="/canchas" className="text-primary text-sm hover:underline mt-2 inline-block">
            Buscar canchas disponibles
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => {
            const badge = estadoBadge[r.estado];
            return (
              <div
                key={r.id}
                className="bg-dark-card rounded-xl border border-dark-border p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-dark-text text-sm">
                        {(r as any).sedeCancha?.nombre || 'Cancha'}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                      {r.pagado && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          Pagado
                        </span>
                      )}
                      {r.compromisoPago && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Compromiso de pago
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-dark-muted">
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

                  {/* Precio + Accion */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <span className="font-mono font-semibold text-dark-text text-sm">
                      {formatPrecio(r.precio)}
                    </span>
                    {canCancel(r) && (
                      <button
                        onClick={() => handleCancelar(r.id)}
                        disabled={cancelando === r.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        {cancelando === r.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Cancelar'
                        )}
                      </button>
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
