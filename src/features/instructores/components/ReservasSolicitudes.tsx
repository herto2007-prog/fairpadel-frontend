import { useState, useEffect } from 'react';
import { instructoresService } from '@/services/instructoresService';
import { Card, CardContent, Badge, Button, Modal } from '@/components/ui';
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
  UserPlus,
  FileText,
  Save,
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

  // Notes modal
  const [notasModalId, setNotasModalId] = useState<string | null>(null);
  const [notasText, setNotasText] = useState('');
  const [savingNotas, setSavingNotas] = useState(false);

  useEffect(() => {
    loadReservas();
  }, [filtro]);

  const loadReservas = async () => {
    setLoading(true);
    try {
      const data = await instructoresService.obtenerReservasInstructor(
        filtro || undefined
      );
      setReservas(Array.isArray(data) ? data : []);
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

  const handleTogglePago = async (r: ReservaInstructor) => {
    setActionLoading(r.id);
    try {
      await instructoresService.marcarPago(r.id, !r.pagado);
      setReservas((prev) => prev.map((res) => (res.id === r.id ? { ...res, pagado: !r.pagado } : res)));
      toast.success(r.pagado ? 'Marcado como pendiente' : 'Marcado como pagado');
    } catch (err: any) {
      toast.error('Error al actualizar pago');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAsistencia = async (r: ReservaInstructor, asistio: boolean) => {
    setActionLoading(r.id);
    try {
      await instructoresService.marcarAsistencia(r.id, asistio);
      setReservas((prev) => prev.map((res) => (res.id === r.id ? { ...res, asistio } : res)));
      toast.success(asistio ? 'Asistencia confirmada' : 'Marcado como ausente');
    } catch (err: any) {
      toast.error('Error al actualizar asistencia');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotas = async () => {
    if (!notasModalId) return;
    setSavingNotas(true);
    try {
      await instructoresService.guardarNotas(notasModalId, notasText);
      setReservas((prev) => prev.map((res) => (res.id === notasModalId ? { ...res, notas: notasText } : res)));
      toast.success('Notas guardadas');
      setNotasModalId(null);
    } catch (err: any) {
      toast.error('Error al guardar notas');
    } finally {
      setSavingNotas(false);
    }
  };

  const openNotasModal = (r: ReservaInstructor) => {
    setNotasText(r.notas || '');
    setNotasModalId(r.id);
  };

  const getAlumnoName = (r: ReservaInstructor): string => {
    if (r.solicitante) {
      return `${r.solicitante.nombre} ${r.solicitante.apellido}`;
    }
    return r.alumnoExternoNombre || 'Sin nombre';
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
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.solicitante ? (
                        <User className="h-4 w-4 text-light-muted" />
                      ) : (
                        <UserPlus className="h-4 w-4 text-light-muted" />
                      )}
                      <span className="text-sm font-medium text-light-text">
                        {getAlumnoName(r)}
                      </span>
                      {!r.solicitante && r.alumnoExternoNombre && (
                        <Badge variant="default" className="text-[10px]">Externo</Badge>
                      )}
                      {r.creadoPorInstructor && (
                        <Badge variant="info" className="text-[10px]">Manual</Badge>
                      )}
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

                    {/* Payment & Attendance chips */}
                    {['CONFIRMADA', 'COMPLETADA'].includes(r.estado) && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {/* Pago chip */}
                        <button
                          onClick={() => handleTogglePago(r)}
                          disabled={actionLoading === r.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                            r.pagado
                              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                          }`}
                        >
                          <DollarSign className="h-2.5 w-2.5" />
                          {r.pagado ? 'Pagado' : 'Pendiente'}
                        </button>

                        {/* Asistencia chips */}
                        {r.asistio === true && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400">
                            <CheckCircle className="h-2.5 w-2.5" /> Asistió
                          </span>
                        )}
                        {r.asistio === false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400">
                            <XCircle className="h-2.5 w-2.5" /> No asistió
                          </span>
                        )}
                        {r.asistio === null && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleToggleAsistencia(r, true)}
                              disabled={actionLoading === r.id}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-dark-surface text-light-muted hover:bg-green-500/10 hover:text-green-400 transition-colors"
                            >
                              <CheckCircle className="h-2.5 w-2.5" /> Asistió
                            </button>
                            <button
                              onClick={() => handleToggleAsistencia(r, false)}
                              disabled={actionLoading === r.id}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-dark-surface text-light-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            >
                              <XCircle className="h-2.5 w-2.5" /> Ausente
                            </button>
                          </div>
                        )}

                        {/* Notas button */}
                        <button
                          onClick={() => openNotasModal(r)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                            r.notas
                              ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                              : 'bg-dark-surface text-light-muted hover:bg-dark-hover'
                          }`}
                        >
                          <FileText className="h-2.5 w-2.5" />
                          {r.notas ? 'Notas' : '+ Notas'}
                        </button>
                      </div>
                    )}

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

      {/* Notas Modal */}
      <Modal
        isOpen={!!notasModalId}
        onClose={() => setNotasModalId(null)}
        title="Notas de la clase"
        size="sm"
      >
        <div className="space-y-3">
          <textarea
            value={notasText}
            onChange={(e) => setNotasText(e.target.value.slice(0, 500))}
            rows={4}
            placeholder="Escribí notas sobre esta clase..."
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary/50 focus:outline-none focus:border-primary-500 resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setNotasModalId(null)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveNotas} disabled={savingNotas}>
              {savingNotas ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReservasSolicitudes;
