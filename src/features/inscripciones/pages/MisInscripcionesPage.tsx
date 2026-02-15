import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inscripcionesService } from '@/services/inscripcionesService';
import tournamentsService from '@/services/tournamentsService';
import { Loading, Card, CardContent, Badge, Button } from '@/components/ui';
import type { Inscripcion, CuentaBancaria } from '@/types';
import { InscripcionEstado } from '@/types';
import { Calendar, MapPin, Users, Upload, Building2, Phone, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const MisInscripcionesPage = () => {
  const navigate = useNavigate();
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cuentasCache, setCuentasCache] = useState<Record<string, CuentaBancaria[]>>({});
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    loadInscripciones();
  }, []);

  const loadInscripciones = async () => {
    try {
      const data = await inscripcionesService.getMyInscripciones();
      setInscripciones(data);
    } catch (error) {
      console.error('Error loading inscripciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCuentas = async (tournamentId: string) => {
    if (cuentasCache[tournamentId]) return;
    try {
      const cuentas = await tournamentsService.getCuentasBancarias(tournamentId);
      setCuentasCache((prev) => ({ ...prev, [tournamentId]: cuentas }));
    } catch {
      // ignore
    }
  };

  const handleExpand = (inscripcion: Inscripcion) => {
    const newId = expandedId === inscripcion.id ? null : inscripcion.id;
    setExpandedId(newId);
    setComprobanteUrl('');
    if (newId && inscripcion.tournamentId) {
      loadCuentas(inscripcion.tournamentId);
    }
  };

  const handleUploadComprobante = async (inscripcionId: string) => {
    if (!comprobanteUrl.trim()) {
      toast.error('Ingresá el link del comprobante');
      return;
    }
    setUploadingId(inscripcionId);
    try {
      await inscripcionesService.uploadComprobante(inscripcionId, comprobanteUrl);
      toast.success('Comprobante enviado');
      setComprobanteUrl('');
      setExpandedId(null);
      await loadInscripciones();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al subir comprobante');
    } finally {
      setUploadingId(null);
    }
  };

  const getStatusBadge = (estado: InscripcionEstado) => {
    const variants: Record<InscripcionEstado, { variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; label: string }> = {
      [InscripcionEstado.PENDIENTE_PAGO]: { variant: 'warning', label: 'Pendiente de Pago' },
      [InscripcionEstado.PENDIENTE_CONFIRMACION]: { variant: 'info', label: 'Comprobante Enviado' },
      [InscripcionEstado.PENDIENTE_PAGO_PRESENCIAL]: { variant: 'warning', label: 'Pago Presencial Pendiente' },
      [InscripcionEstado.CONFIRMADA]: { variant: 'success', label: 'Confirmada' },
      [InscripcionEstado.RECHAZADA]: { variant: 'danger', label: 'Rechazada' },
      [InscripcionEstado.CANCELADA]: { variant: 'default', label: 'Cancelada' },
    };
    const { variant, label } = variants[estado];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredInscripciones = filter
    ? inscripciones.filter((i) => i.estado === filter)
    : inscripciones;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando inscripciones..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Mis Inscripciones</h1>
        <p className="text-sm sm:text-base text-light-secondary mt-1 sm:mt-2">Revisá el estado de tus inscripciones a torneos</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant={filter === '' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('')}>
          Todas ({inscripciones.length})
        </Button>
        <Button
          variant={filter === InscripcionEstado.PENDIENTE_PAGO ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(InscripcionEstado.PENDIENTE_PAGO)}
        >
          Pendientes
        </Button>
        <Button
          variant={filter === InscripcionEstado.CONFIRMADA ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(InscripcionEstado.CONFIRMADA)}
        >
          Confirmadas
        </Button>
        <Button
          variant={filter === InscripcionEstado.RECHAZADA ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(InscripcionEstado.RECHAZADA)}
        >
          Rechazadas
        </Button>
      </div>

      {filteredInscripciones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">No tienes inscripciones</h3>
            <p className="text-light-secondary mb-4">
              Explorá los torneos disponibles y participá
            </p>
            <Button onClick={() => navigate('/tournaments')}>Ver Torneos</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInscripciones.map((inscripcion) => {
            const isExpanded = expandedId === inscripcion.id;
            const cuentas = cuentasCache[inscripcion.tournamentId] || [];
            const isPendientePago = inscripcion.estado === InscripcionEstado.PENDIENTE_PAGO;
            const isPendienteConfirmacion = inscripcion.estado === InscripcionEstado.PENDIENTE_CONFIRMACION;
            const isPendientePresencial = inscripcion.estado === InscripcionEstado.PENDIENTE_PAGO_PRESENCIAL;
            const isRechazada = inscripcion.estado === InscripcionEstado.RECHAZADA;

            return (
              <Card key={inscripcion.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <h3 className="text-base sm:text-xl font-semibold truncate">
                          {inscripcion.tournament?.nombre || 'Torneo'}
                        </h3>
                        {getStatusBadge(inscripcion.estado)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-light-secondary">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {inscripcion.tournament?.fechaInicio
                            ? new Date(inscripcion.tournament.fechaInicio).toLocaleDateString()
                            : 'Fecha no disponible'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {inscripcion.tournament?.ciudad || 'Ciudad'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {inscripcion.category?.nombre || 'Categoría'}
                        </span>
                      </div>
                      {inscripcion.pareja && (
                        <div className="mt-2 text-sm">
                          <span className="text-light-secondary">Pareja: </span>
                          {inscripcion.pareja.jugador1?.nombre} {inscripcion.pareja.jugador1?.apellido} &{' '}
                          {inscripcion.pareja.jugador2
                            ? `${inscripcion.pareja.jugador2.nombre} ${inscripcion.pareja.jugador2.apellido}`
                            : `Doc: ${inscripcion.pareja.jugador2Documento}`}
                        </div>
                      )}

                      {/* Pago info */}
                      {inscripcion.pago && (
                        <div className="mt-2 text-xs text-light-secondary">
                          Método: {inscripcion.pago.metodoPago} | Monto: Gs. {new Intl.NumberFormat('es-PY').format(Number(inscripcion.pago.monto))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 items-start">
                      {(isPendientePago || isRechazada) && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleExpand(inscripcion)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {isPendientePago ? 'Pagar' : 'Reintentar'}
                        </Button>
                      )}
                      {isPendienteConfirmacion && (
                        <Badge variant="info" className="text-xs">
                          Esperando confirmación...
                        </Badge>
                      )}
                      {isPendientePresencial && (
                        <Badge variant="warning" className="text-xs">
                          Pagá al organizador
                        </Badge>
                      )}
                      <button
                        onClick={() => handleExpand(inscripcion)}
                        className="p-2 text-light-secondary hover:text-light-text hover:bg-dark-hover rounded transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-dark-border space-y-4">
                      {/* Rejection reason */}
                      {isRechazada && inscripcion.comprobantes && inscripcion.comprobantes.length > 0 && (
                        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <p className="text-sm font-medium text-red-400 mb-1">Motivo de rechazo:</p>
                          <p className="text-sm text-red-300">
                            {inscripcion.comprobantes[inscripcion.comprobantes.length - 1]?.motivoRechazo || 'Sin motivo especificado'}
                          </p>
                        </div>
                      )}

                      {/* Bank accounts (for TRANSFERENCIA) */}
                      {(isPendientePago || isRechazada) && inscripcion.pago?.metodoPago === 'TRANSFERENCIA' && (
                        <>
                          {cuentas.length > 0 ? (
                            <div>
                              <p className="text-sm font-medium text-primary-400 mb-2 flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                Datos para transferir:
                              </p>
                              <div className="space-y-2">
                                {cuentas.map((cuenta) => (
                                  <div key={cuenta.id} className="p-3 bg-dark-surface rounded-lg border border-dark-border text-sm">
                                    <p className="font-semibold text-light-text">{cuenta.banco}</p>
                                    <p className="text-light-secondary">Titular: {cuenta.titular} | CI/RUC: {cuenta.cedulaRuc}</p>
                                    {cuenta.nroCuenta && <p className="text-light-secondary">Cuenta: {cuenta.nroCuenta}</p>}
                                    {cuenta.aliasSpi && <p className="text-primary-400 font-medium">Alias SPI: {cuenta.aliasSpi}</p>}
                                    {cuenta.telefonoComprobante && (
                                      <p className="text-light-secondary flex items-center gap-1 mt-1">
                                        <Phone className="w-3 h-3" /> WhatsApp: {cuenta.telefonoComprobante}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-light-secondary">
                              El organizador no configuró datos bancarios. Contactalo directamente.
                            </p>
                          )}

                          {/* Comprobante upload */}
                          <div>
                            <label className="block text-sm font-medium text-light-text mb-1">
                              Subir comprobante (opcional)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={comprobanteUrl}
                                onChange={(e) => setComprobanteUrl(e.target.value)}
                                placeholder="https://... (link a imagen del comprobante)"
                                className="flex-1 rounded-md border border-dark-border bg-dark-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleUploadComprobante(inscripcion.id)}
                                loading={uploadingId === inscripcion.id}
                                disabled={!comprobanteUrl.trim()}
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-light-secondary mt-1">
                              Subí un link a la imagen de tu comprobante de transferencia
                            </p>
                          </div>
                        </>
                      )}

                      {/* Existing comprobantes */}
                      {inscripcion.comprobantes && inscripcion.comprobantes.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-light-text mb-2">Comprobantes enviados:</p>
                          <div className="space-y-1">
                            {inscripcion.comprobantes.map((comp) => (
                              <div key={comp.id} className="flex items-center gap-2 text-sm">
                                <Badge
                                  variant={comp.estado === 'APROBADA' ? 'success' : comp.estado === 'RECHAZADA' ? 'danger' : 'info'}
                                >
                                  {comp.estado}
                                </Badge>
                                <a
                                  href={comp.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-400 hover:underline flex items-center gap-1"
                                >
                                  Ver comprobante <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cancel button */}
                      {(isPendientePago || isPendienteConfirmacion || isPendientePresencial) && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await inscripcionesService.cancel(inscripcion.id);
                                toast.success('Inscripción cancelada');
                                await loadInscripciones();
                                setExpandedId(null);
                              } catch (err: any) {
                                toast.error(err.response?.data?.message || 'Error al cancelar');
                              }
                            }}
                            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                          >
                            Cancelar inscripción
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisInscripcionesPage;
