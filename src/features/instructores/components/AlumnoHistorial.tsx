import { useState, useEffect } from 'react';
import { instructoresService } from '@/services/instructoresService';
import { Loading, Card, CardContent, Badge } from '@/components/ui';
import {
  User as UserIcon,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { AlumnoResumen, ReservaInstructor } from '@/types';

const estadoBadge: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
  PENDIENTE: 'warning',
  CONFIRMADA: 'info',
  COMPLETADA: 'success',
  RECHAZADA: 'danger',
  CANCELADA: 'default',
};

interface Props {
  alumno: AlumnoResumen;
  onBack: () => void;
}

const AlumnoHistorial = ({ alumno }: Props) => {
  const [reservas, setReservas] = useState<ReservaInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadHistorial();
  }, [alumno]);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      if (alumno.tipo === 'registrado' && alumno.id) {
        const data = await instructoresService.obtenerHistorialAlumno(alumno.id);
        setReservas(Array.isArray(data) ? data : []);
      } else {
        const data = await instructoresService.obtenerHistorialAlumno('externo', alumno.nombre);
        setReservas(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading historial:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePago = async (r: ReservaInstructor) => {
    setUpdatingId(r.id);
    try {
      await instructoresService.marcarPago(r.id, !r.pagado);
      setReservas((prev) =>
        prev.map((res) => (res.id === r.id ? { ...res, pagado: !r.pagado } : res))
      );
      toast.success(r.pagado ? 'Marcado como pendiente' : 'Marcado como pagado');
    } catch (err: any) {
      toast.error('Error al actualizar pago');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleAsistencia = async (r: ReservaInstructor, asistio: boolean) => {
    setUpdatingId(r.id);
    try {
      await instructoresService.marcarAsistencia(r.id, asistio);
      setReservas((prev) =>
        prev.map((res) => (res.id === r.id ? { ...res, asistio } : res))
      );
      toast.success(asistio ? 'Asistencia confirmada' : 'Marcado como ausente');
    } catch (err: any) {
      toast.error('Error al actualizar asistencia');
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats
  const totalClases = reservas.length;
  const totalPagado = reservas.filter((r) => r.pagado).reduce((sum, r) => sum + r.precio, 0);
  const deuda = reservas.filter((r) => !r.pagado && ['CONFIRMADA', 'COMPLETADA'].includes(r.estado)).reduce((sum, r) => sum + r.precio, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando historial..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {alumno.fotoUrl ? (
                <img src={alumno.fotoUrl} alt={alumno.nombre} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-primary-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-light-text">
                  {alumno.nombre} {alumno.apellido || ''}
                </h2>
                <Badge variant={alumno.tipo === 'registrado' ? 'info' : 'default'}>
                  {alumno.tipo === 'registrado' ? 'FairPadel' : 'Externo'}
                </Badge>
              </div>
              {alumno.telefono && (
                <p className="text-xs text-light-muted flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {alumno.telefono}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-2 bg-dark-surface rounded-lg">
              <p className="text-lg font-bold text-light-text">{totalClases}</p>
              <p className="text-[10px] text-light-muted">Clases</p>
            </div>
            <div className="text-center p-2 bg-dark-surface rounded-lg">
              <p className="text-lg font-bold text-green-400">
                {totalPagado > 0 ? `${(totalPagado / 1000).toFixed(0)}k` : '0'}
              </p>
              <p className="text-[10px] text-light-muted">Pagado (Gs.)</p>
            </div>
            <div className="text-center p-2 bg-dark-surface rounded-lg">
              <p className={`text-lg font-bold ${deuda > 0 ? 'text-red-400' : 'text-light-text'}`}>
                {deuda > 0 ? `${(deuda / 1000).toFixed(0)}k` : '0'}
              </p>
              <p className="text-[10px] text-light-muted">Deuda (Gs.)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservas list */}
      {reservas.length === 0 ? (
        <div className="text-center py-8">
          <Inbox className="h-10 w-10 mx-auto mb-2 text-light-muted opacity-50" />
          <p className="text-sm text-light-secondary">Sin historial</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservas.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    {/* Date + Estado */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-light-text flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-light-muted" />
                        {new Date(r.fecha).toLocaleDateString('es-PY', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-xs text-light-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {r.horaInicio} - {r.horaFin}
                      </span>
                      <Badge variant={estadoBadge[r.estado] || 'default'} className="text-[10px]">
                        {r.estado}
                      </Badge>
                      <Badge variant="default" className="text-[10px]">{r.tipo}</Badge>
                    </div>

                    {/* Precio + Pago */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-light-secondary">
                        <DollarSign className="h-3 w-3" />
                        Gs. {r.precio.toLocaleString()}
                      </span>
                      {r.pagado ? (
                        <span className="text-green-400 flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3" /> Pagado
                        </span>
                      ) : (
                        <span className="text-yellow-400 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" /> Pendiente
                        </span>
                      )}
                      {r.asistio === true && (
                        <span className="text-green-400 flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3" /> Asistió
                        </span>
                      )}
                      {r.asistio === false && (
                        <span className="text-red-400 flex items-center gap-0.5">
                          <XCircle className="h-3 w-3" /> No asistió
                        </span>
                      )}
                    </div>

                    {r.notas && (
                      <p className="text-xs text-light-muted italic mt-1">{r.notas}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {['CONFIRMADA', 'COMPLETADA'].includes(r.estado) && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleTogglePago(r)}
                        disabled={updatingId === r.id}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                          r.pagado
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                        }`}
                      >
                        {updatingId === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : r.pagado ? (
                          '$ Pagado'
                        ) : (
                          '$ Cobrar'
                        )}
                      </button>
                      {r.asistio === null && (
                        <>
                          <button
                            onClick={() => handleToggleAsistencia(r, true)}
                            disabled={updatingId === r.id}
                            className="px-2 py-1 rounded text-[10px] font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          >
                            Asistió
                          </button>
                          <button
                            onClick={() => handleToggleAsistencia(r, false)}
                            disabled={updatingId === r.id}
                            className="px-2 py-1 rounded text-[10px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          >
                            Ausente
                          </button>
                        </>
                      )}
                    </div>
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

export default AlumnoHistorial;
