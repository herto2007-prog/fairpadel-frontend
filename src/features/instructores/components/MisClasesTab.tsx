import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { instructoresService } from '@/services/instructoresService';
import { Loading, Card, CardContent, Badge, Button } from '@/components/ui';
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  MessageSquare,
  Inbox,
  Loader2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ReservaInstructor } from '@/types';

const estadoBadge: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
  PENDIENTE: 'warning',
  CONFIRMADA: 'info',
  COMPLETADA: 'success',
  RECHAZADA: 'danger',
  CANCELADA: 'default',
};

const MisClasesTab = () => {
  const [reservas, setReservas] = useState<ReservaInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [cancelando, setCancelando] = useState<string | null>(null);

  useEffect(() => {
    loadReservas();
  }, [filtro]);

  const loadReservas = async () => {
    setLoading(true);
    try {
      const data = await instructoresService.obtenerMisReservas(filtro || undefined);
      setReservas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading reservas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id: string) => {
    setCancelando(id);
    try {
      await instructoresService.cancelarMiReserva(id);
      toast.success('Reserva cancelada');
      loadReservas();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al cancelar');
    } finally {
      setCancelando(null);
    }
  };

  const filtros = [
    { label: 'Todas', value: '' },
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Confirmadas', value: 'CONFIRMADA' },
    { label: 'Completadas', value: 'COMPLETADA' },
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
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Cargando reservas..." />
        </div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="h-12 w-12 mx-auto mb-3 text-light-muted opacity-50" />
          <h2 className="text-base font-semibold text-light-text mb-1">No tenés reservas</h2>
          <p className="text-sm text-light-secondary">
            {filtro ? 'No hay reservas con ese filtro' : 'Buscá un instructor arriba y reservá tu primera clase'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/instructores/${r.instructorId}`}
                        className="flex items-center gap-2 hover:text-primary-400 transition-colors"
                      >
                        <User className="h-4 w-4 text-light-muted" />
                        <span className="text-sm font-medium text-light-text">
                          {r.instructor?.user?.nombre} {r.instructor?.user?.apellido}
                        </span>
                      </Link>
                      <Badge variant={estadoBadge[r.estado] || 'default'}>
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
                  {(r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelar(r.id)}
                      disabled={cancelando === r.id}
                    >
                      {cancelando === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                      )}
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisClasesTab;
