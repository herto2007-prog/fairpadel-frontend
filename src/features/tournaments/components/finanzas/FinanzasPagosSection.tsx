import { useState, useEffect, useMemo } from 'react';
import { Card, Loading } from '@/components/ui';
import inscripcionesService from '@/services/inscripcionesService';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Tournament, Inscripcion } from '@/types';

interface Props {
  tournament: Tournament;
}

export function FinanzasPagosSection({ tournament }: Props) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'pendientes' | 'confirmadas' | 'rechazadas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  useEffect(() => {
    loadInscripciones();
  }, [tournament.id]);

  const loadInscripciones = async () => {
    try {
      const data = await inscripcionesService.getByTournament(tournament.id);
      setInscripciones(data);
    } catch (err) {
      console.error('Error loading inscripciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async (inscripcionId: string) => {
    setProcessingId(inscripcionId);
    try {
      await inscripcionesService.confirmarPago(tournament.id, inscripcionId);
      toast.success('Pago confirmado');
      await loadInscripciones();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al confirmar pago');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazar = async (inscripcionId: string) => {
    const motivo = rejectMotivo[inscripcionId] || '';
    setProcessingId(inscripcionId);
    try {
      await inscripcionesService.rechazarPago(tournament.id, inscripcionId, motivo || undefined);
      toast.success('Pago rechazado');
      setShowRejectInput(null);
      await loadInscripciones();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al rechazar pago');
    } finally {
      setProcessingId(null);
    }
  };

  const pendientes = inscripciones.filter((i) =>
    ['PENDIENTE_PAGO', 'PENDIENTE_CONFIRMACION', 'PENDIENTE_PAGO_PRESENCIAL'].includes(i.estado),
  );
  const confirmadas = inscripciones.filter((i) => i.estado === 'CONFIRMADA');
  const rechazadas = inscripciones.filter((i) => i.estado === 'RECHAZADA');

  const filteredInscripciones = useMemo(() => {
    let result = filter === 'pendientes'
      ? pendientes
      : filter === 'confirmadas'
        ? confirmadas
        : filter === 'rechazadas'
          ? rechazadas
          : inscripciones;

    if (searchTerm.trim()) {
      const search = searchTerm.trim().toLowerCase();
      result = result.filter((insc) => {
        const j1 = (insc.pareja as any)?.jugador1;
        const j2 = (insc.pareja as any)?.jugador2;
        const j1Name = j1 ? `${j1.nombre} ${j1.apellido}`.toLowerCase() : '';
        const j1Doc = j1?.documento?.toLowerCase() || '';
        const j2Name = j2 ? `${j2.nombre} ${j2.apellido}`.toLowerCase() : '';
        const j2Doc = j2?.documento?.toLowerCase() || '';
        const j2DocField = (insc.pareja as any)?.jugador2Documento?.toLowerCase() || '';
        return j1Name.includes(search) || j1Doc.includes(search) || j2Name.includes(search) || j2Doc.includes(search) || j2DocField.includes(search);
      });
    }

    return result;
  }, [inscripciones, filter, searchTerm, pendientes, confirmadas, rechazadas]);

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE_PAGO: 'bg-yellow-900/30 text-yellow-400',
      PENDIENTE_CONFIRMACION: 'bg-blue-900/30 text-blue-400',
      PENDIENTE_PAGO_PRESENCIAL: 'bg-orange-900/30 text-orange-400',
      CONFIRMADA: 'bg-green-900/30 text-green-400',
      RECHAZADA: 'bg-red-900/30 text-red-400',
      CANCELADA: 'bg-dark-surface text-light-secondary',
    };
    const labels: Record<string, string> = {
      PENDIENTE_PAGO: 'Pago pendiente',
      PENDIENTE_CONFIRMACION: 'Comprobante enviado',
      PENDIENTE_PAGO_PRESENCIAL: 'Presencial pendiente',
      CONFIRMADA: 'Confirmada',
      RECHAZADA: 'Rechazada',
      CANCELADA: 'Cancelada',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[estado] || 'bg-dark-surface text-light-secondary'}`}>
        {labels[estado] || estado}
      </span>
    );
  };

  const getMetodoBadge = (metodo?: string) => {
    if (!metodo) return null;
    const colors: Record<string, string> = {
      BANCARD: 'text-blue-400',
      TRANSFERENCIA: 'text-purple-400',
      EFECTIVO: 'text-green-400',
    };
    return <span className={`text-xs font-medium ${colors[metodo] || ''}`}>{metodo}</span>;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loading size="lg" text="Cargando pagos..." /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{pendientes.length}</p>
          <p className="text-xs text-light-secondary">Pendientes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{confirmadas.length}</p>
          <p className="text-xs text-light-secondary">Confirmadas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{rechazadas.length}</p>
          <p className="text-xs text-light-secondary">Rechazadas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-light-text">{inscripciones.length}</p>
          <p className="text-xs text-light-secondary">Total</p>
        </Card>
      </div>

      {/* Search by name or cédula */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-secondary" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o cédula del jugador..."
          className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-light-text placeholder-light-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['todas', 'pendientes', 'confirmadas', 'rechazadas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-surface text-light-secondary hover:bg-dark-hover'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredInscripciones.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-light-secondary">No hay inscripciones que coincidan</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left">
                  <th className="px-4 py-3 text-light-secondary font-medium">Pareja</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Categoría</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Método</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Estado</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Comprobante</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Fecha</th>
                  <th className="px-4 py-3 text-light-secondary font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInscripciones.map((insc) => {
                  const isPendiente = ['PENDIENTE_PAGO', 'PENDIENTE_CONFIRMACION', 'PENDIENTE_PAGO_PRESENCIAL'].includes(insc.estado);
                  const j1 = insc.pareja?.jugador1;
                  const j2 = insc.pareja?.jugador2;
                  const comprobante = insc.comprobantes && insc.comprobantes.length > 0 ? insc.comprobantes[insc.comprobantes.length - 1] : null;

                  const pagos = insc.pagos || (insc.pago ? [insc.pago] : []);
                  const primerPago = pagos[0];
                  const isIndividual = insc.modoPago === 'INDIVIDUAL';
                  const fechaConfirm = pagos.find((p: any) => p.fechaConfirm)?.fechaConfirm;

                  return (
                    <tr key={insc.id} className="border-b border-dark-border/50 hover:bg-dark-hover/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-light-text">
                          {j1 ? `${j1.nombre} ${j1.apellido}` : '—'}
                        </div>
                        <div className="text-light-secondary text-xs">
                          {j2 ? `${j2.nombre} ${j2.apellido}` : insc.pareja?.jugador2Documento ? `Doc: ${insc.pareja.jugador2Documento}` : '—'}
                        </div>
                        {isIndividual && (
                          <span className="text-[10px] px-1.5 py-0.5 mt-1 inline-block bg-blue-900/30 text-blue-400 rounded-full">Pago Individual</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-light-secondary">
                        {insc.category?.nombre || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {isIndividual ? (
                          <div className="space-y-1">
                            {pagos.map((p: any, idx: number) => (
                              <div key={p.id || idx} className="flex items-center gap-1">
                                <span className="text-[10px] text-light-secondary">{idx === 0 ? 'J1' : 'J2'}:</span>
                                {getMetodoBadge(p.metodoPago)}
                                <span className={`text-[10px] ${p.estado === 'CONFIRMADO' ? 'text-green-400' : p.estado === 'RECHAZADO' ? 'text-red-400' : 'text-yellow-400'}`}>
                                  {p.estado === 'CONFIRMADO' ? '✓' : p.estado === 'RECHAZADO' ? '✗' : '⏳'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          getMetodoBadge(primerPago?.metodoPago)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getEstadoBadge(insc.estado)}
                      </td>
                      <td className="px-4 py-3">
                        {comprobante ? (
                          <div className="flex items-center gap-2">
                            <a href={comprobante.url} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={comprobante.url} alt="Comprobante" className="w-10 h-10 object-cover rounded border border-dark-border hover:opacity-80 transition-opacity" />
                            </a>
                            <div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${comprobante.estado === 'APROBADA' ? 'bg-green-900/30 text-green-400' : comprobante.estado === 'RECHAZADA' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                {comprobante.estado}
                              </span>
                              {comprobante.motivoRechazo && (
                                <p className="text-[10px] text-red-400/70 mt-0.5 max-w-[120px] truncate" title={comprobante.motivoRechazo}>
                                  {comprobante.motivoRechazo}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-light-secondary text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-light-secondary space-y-0.5">
                          <p title="Fecha de inscripción">{new Date(insc.createdAt || '').toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                          {fechaConfirm && (
                            <p className="text-green-400" title="Fecha de confirmación">
                              {'✓'} {new Date(fechaConfirm).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isPendiente && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleConfirmar(insc.id)}
                              disabled={processingId === insc.id}
                              className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
                            >
                              {processingId === insc.id ? '...' : '✓ Confirmar'}
                            </button>
                            {showRejectInput === insc.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={rejectMotivo[insc.id] || ''}
                                  onChange={(e) => setRejectMotivo((prev) => ({ ...prev, [insc.id]: e.target.value }))}
                                  placeholder="Motivo (opcional)"
                                  className="w-32 px-2 py-1 text-xs bg-dark-card border border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                                <button
                                  onClick={() => handleRechazar(insc.id)}
                                  disabled={processingId === insc.id}
                                  className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                >
                                  {processingId === insc.id ? '...' : 'Enviar'}
                                </button>
                                <button
                                  onClick={() => setShowRejectInput(null)}
                                  className="text-light-secondary text-xs hover:text-light-text"
                                >
                                  {'✕'}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowRejectInput(insc.id)}
                                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium hover:bg-red-500/30 transition-colors"
                              >
                                {'✗'} Rechazar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
