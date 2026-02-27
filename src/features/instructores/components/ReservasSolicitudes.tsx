import { useState, useEffect } from 'react';
import { instructoresService } from '@/services/instructoresService';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import {
  Loader2,
  User,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  MessageSquare,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ReservaInstructor } from '@/types';

const ReservasSolicitudes = () => {
  const [reservas, setReservas] = useState<ReservaInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('PENDIENTE');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rechazarId, setRechazarId] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  useEffect(() => {
    loadReservas();
  }, [filtro]);

  const loadReservas = async () => {
    setLoading(true);
    try {
      const data = await instructoresService.obtenerReservasInstructor(
        filtro || undefined
      );
      setReservas(data);
    } catch (err) {
      console.error('Error loading reservas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async (id: string) => {
    setActionLoading(id);
    try {
      await instructoresService.confirmarReserva(id);
      toast.success('Reserva confirmada');
      loadReservas();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al confirmar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRechazar = async (id: string) => {
    setActionLoading(id);
    try {
      await instructoresService.rechazarReserva(id, motivoRechazo.trim() || undefined);
      toast.success('Reserva rechazada');
      setRechazarId(null);
      setMotivoRechazo('');
      loadReservas();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al rechazar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompletar = async (id: string) => {
    setActionLoading(id);
    try {
      await instructoresService.completarReserva(id);
      toast.success('Clase marcada como completada');
      loadReservas();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al completar');
    } finally {
      setActionLoading(null);
    }
  };

  const filtros = [
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Confirmadas', value: 'CONFIRMADA' },
    { label: 'Completadas', value: 'COMPLETADA' },
    { label: 'Todas', value: '' },
  ];

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtro === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
        </div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="h-12 w-12 mx-auto mb-3 text-light-muted opacity-50" />
          <p className="text-sm text-light-secondary">
            No hay reservas {filtro ? filtro.toLowerCase() + 's' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-light-muted" />
                      <span className="text-sm font-medium text-light-text">
                        {r.solicitante?.nombre} {r.solicitante?.apellido}
                      </span>
                      <Badge variant={
                        r.estado === 'PENDIENTE' ? 'warning' :
                        r.estado === 'CONFIRMADA' ? 'info' :
                        r.estado === 'COMPLETADA' ? 'success' :
                        r.estado === 'RECHAZADA' ? 'danger' : 'default'
                      }>
                        {r.estado}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-light-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(r.fecha).toLocaleDateString('es-PY', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {r.horaInicio} - {r.horaFin}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Gs. {r.precio.toLocaleString()}
                      </span>
                      <Badge variant="default">{r.tipo}</Badge>
                    </div>

                    {r.mensaje && (
                      <div className="flex items-start gap-1.5 mt-1">
                        <MessageSquare className="h-3 w-3 text-light-muted mt-0.5" />
                        <p className="text-xs text-light-muted italic">{r.mensaje}</p>
                      </div>
                    )}

                    {r.respuesta && (
                      <p className="text-xs text-red-400 mt-1">Motivo: {r.respuesta}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.estado === 'PENDIENTE' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfirmar(r.id)}
                          disabled={actionLoading === r.id}
                        >
                          {actionLoading === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          )}
                          Confirmar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRechazarId(rechazarId === r.id ? null : r.id)}
                          disabled={actionLoading === r.id}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}
                    {r.estado === 'CONFIRMADA' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCompletar(r.id)}
                        disabled={actionLoading === r.id}
                      >
                        {actionLoading === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        Completar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Rechazar form */}
                {rechazarId === r.id && (
                  <div className="mt-3 p-3 bg-dark-surface rounded-lg space-y-2">
                    <input
                      type="text"
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      placeholder="Motivo del rechazo (opcional)"
                      className="w-full px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setRechazarId(null); setMotivoRechazo(''); }}>
                        Cancelar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRechazar(r.id)}
                        disabled={actionLoading === r.id}
                      >
                        Confirmar Rechazo
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReservasSolicitudes;
