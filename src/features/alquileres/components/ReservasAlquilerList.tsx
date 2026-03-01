import { useState, useEffect } from 'react';
import { alquileresService } from '@/services/alquileresService';
import {
  CheckCircle2, XCircle, Clock, Ban, AlertTriangle,
  UserCheck, DollarSign, Calendar, Phone, User
} from 'lucide-react';
import { Loading, Badge, Button } from '@/components/ui';
import toast from 'react-hot-toast';
import type { ReservaCancha, ReservaCanchaEstado, MetodoPagoAlquiler } from '@/types';

interface Props {
  sedeId: string;
}

const estadoBadgeVariant: Record<ReservaCanchaEstado, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'outline' }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  CONFIRMADA: { label: 'Confirmada', variant: 'success' },
  RECHAZADA: { label: 'Rechazada', variant: 'danger' },
  CANCELADA: { label: 'Cancelada', variant: 'outline' },
  COMPLETADA: { label: 'Completada', variant: 'info' },
  NO_SHOW: { label: 'No Show', variant: 'danger' },
};

function formatFecha(f: string) {
  const d = new Date(f + 'T12:00:00');
  return d.toLocaleDateString('es-PY', { weekday: 'short', day: '2-digit', month: 'short' });
}
function formatPrecio(p: number) { return p.toLocaleString('es-PY') + ' Gs'; }

export default function ReservasAlquilerList({ sedeId }: Props) {
  const [reservas, setReservas] = useState<ReservaCancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const data = await alquileresService.getReservasSede(sedeId, {
        estado: filtroEstado || undefined,
        fecha: filtroFecha || undefined,
      });
      setReservas(Array.isArray(data) ? data : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchReservas(); }, [sedeId, filtroEstado, filtroFecha]);

  const handleConfirmar = async (id: string) => {
    setActionLoading(id);
    try {
      await alquileresService.confirmarReserva(id);
      toast.success('Reserva confirmada');
      fetchReservas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setActionLoading(null); }
  };

  const handleRechazar = async (id: string) => {
    const motivo = prompt('Motivo del rechazo (opcional):');
    if (motivo === null) return; // cancelled
    setActionLoading(id);
    try {
      await alquileresService.rechazarReserva(id, motivo || undefined);
      toast.success('Reserva rechazada');
      fetchReservas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setActionLoading(null); }
  };

  const handleCompletar = async (id: string) => {
    setActionLoading(id);
    try {
      await alquileresService.completarReserva(id);
      toast.success('Reserva completada');
      fetchReservas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setActionLoading(null); }
  };

  const handleNoShow = async (id: string) => {
    if (!confirm('Marcar como No Show?')) return;
    setActionLoading(id);
    try {
      await alquileresService.marcarNoShow(id);
      toast.success('Marcado como No Show');
      fetchReservas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setActionLoading(null); }
  };

  const handleMarcarPago = async (id: string) => {
    const metodo = prompt('Método de pago: EFECTIVO, TRANSFERENCIA, QR, OTRO');
    if (!metodo) return;
    setActionLoading(id);
    try {
      await alquileresService.marcarPago(id, true, metodo.toUpperCase() as MetodoPagoAlquiler);
      toast.success('Pago registrado');
      fetchReservas();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setActionLoading(null); }
  };

  const getUserName = (r: any) => {
    if (r.nombreExterno) return r.nombreExterno;
    if (r.user) return `${r.user.nombre} ${r.user.apellido}`;
    return 'Sin nombre';
  };

  const getUserPhone = (r: any) => {
    if (r.telefonoExterno) return r.telefonoExterno;
    if (r.user?.telefono) return r.user.telefono;
    return null;
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 flex-wrap flex-1">
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
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filtroEstado === f.value
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                  : 'bg-dark-card border border-dark-border text-light-muted hover:text-light-text hover:bg-dark-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-12 text-light-muted text-sm">
          No hay reservas{filtroEstado ? ` con estado ${filtroEstado.toLowerCase()}` : ''}.
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map((r: any) => {
            const badgeInfo = estadoBadgeVariant[r.estado as ReservaCanchaEstado];
            const isLoading = actionLoading === r.id;
            return (
              <div key={r.id} className="bg-dark-card rounded-xl border border-dark-border p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-light-text text-sm">{r.sedeCancha?.nombre || 'Cancha'}</span>
                      <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                      {r.pagado && (
                        <Badge variant="success" className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Pagado{r.metodoPago ? ` (${r.metodoPago})` : ''}
                        </Badge>
                      )}
                      {r.compromisoPago && (
                        <Badge variant="danger" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Compromiso pago
                        </Badge>
                      )}
                      {r.creadoPorEncargado && (
                        <Badge variant="default" className="bg-purple-500/20 text-purple-400 border-purple-500/30">Manual</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-light-muted">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> {getUserName(r)}
                      </span>
                      {getUserPhone(r) && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {getUserPhone(r)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatFecha(r.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {r.horaInicio} - {r.horaFin}
                      </span>
                      <span className="font-mono">{formatPrecio(r.precio)}</span>
                    </div>
                    {r.notas && <p className="text-xs text-light-muted mt-1 italic">"{r.notas}"</p>}
                    {r.motivoRechazo && <p className="text-xs text-red-400 mt-1">Motivo: {r.motivoRechazo}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {r.estado === 'PENDIENTE' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleConfirmar(r.id)}
                          loading={isLoading}
                          className="text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Confirmar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRechazar(r.id)}
                          disabled={isLoading}
                          className="text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}
                    {r.estado === 'CONFIRMADA' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompletar(r.id)}
                          loading={isLoading}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Completar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNoShow(r.id)}
                          disabled={isLoading}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          No Show
                        </Button>
                        {!r.pagado && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleMarcarPago(r.id)}
                            disabled={isLoading}
                            className="text-xs"
                          >
                            <DollarSign className="w-3.5 h-3.5 mr-1" />
                            Pago
                          </Button>
                        )}
                      </>
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
