import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { inscripcionesService } from '@/services/inscripcionesService';
import tournamentsService from '@/services/tournamentsService';
import { Loading, Card, CardContent, Badge, Button } from '@/components/ui';
import type { Inscripcion, CuentaBancaria, Pago } from '@/types';
import { InscripcionEstado, PagoEstado } from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
  Calendar,
  MapPin,
  Users,
  Upload,
  Building2,
  Phone,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  ImagePlus,
  X,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MisInscripcionesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cuentasCache, setCuentasCache] = useState<Record<string, CuentaBancaria[]>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInscripciones();
  }, []);

  // Cleanup file preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const loadInscripciones = async () => {
    setError(null);
    try {
      const data = await inscripcionesService.getMyInscripciones();
      setInscripciones(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al cargar inscripciones';
      setError(msg);
      toast.error(msg);
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
      // ignore — cuentas are optional info
    }
  };

  const handleExpand = (inscripcion: Inscripcion) => {
    const newId = expandedId === inscripcion.id ? null : inscripcion.id;
    setExpandedId(newId);
    clearFileSelection();
    setConfirmCancelId(null);
    if (newId && inscripcion.tournamentId) {
      loadCuentas(inscripcion.tournamentId);
    }
  };

  const clearFileSelection = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede superar los 5MB');
      return;
    }

    if (filePreview) URL.revokeObjectURL(filePreview);
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleUploadComprobante = async (inscripcionId: string) => {
    if (!selectedFile) {
      toast.error('Seleccioná una imagen del comprobante');
      return;
    }
    setUploadingId(inscripcionId);
    try {
      await inscripcionesService.uploadComprobante(inscripcionId, selectedFile);
      toast.success('Comprobante enviado correctamente');
      clearFileSelection();
      setExpandedId(null);
      await loadInscripciones();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al subir comprobante');
    } finally {
      setUploadingId(null);
    }
  };

  const handleCancel = async (inscripcionId: string) => {
    setCancellingId(inscripcionId);
    try {
      await inscripcionesService.cancel(inscripcionId);
      toast.success('Inscripción cancelada');
      setConfirmCancelId(null);
      setExpandedId(null);
      await loadInscripciones();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cancelar');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (estado: InscripcionEstado | string) => {
    const variants: Record<string, { variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; label: string }> = {
      [InscripcionEstado.PENDIENTE_PAGO]: { variant: 'warning', label: 'Pendiente de Pago' },
      [InscripcionEstado.PENDIENTE_CONFIRMACION]: { variant: 'info', label: 'Comprobante Enviado' },
      [InscripcionEstado.PENDIENTE_PAGO_PRESENCIAL]: { variant: 'warning', label: 'Pago Presencial' },
      [InscripcionEstado.CONFIRMADA]: { variant: 'success', label: 'Confirmada' },
      [InscripcionEstado.RECHAZADA]: { variant: 'danger', label: 'Rechazada' },
      [InscripcionEstado.CANCELADA]: { variant: 'default', label: 'Cancelada' },
    };
    const config = variants[estado] || { variant: 'default' as const, label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Filter logic: "pendientes" groups all pending states together
  const filteredInscripciones = (() => {
    if (!filter) return inscripciones;
    if (filter === 'PENDIENTES') {
      return inscripciones.filter((i) =>
        [InscripcionEstado.PENDIENTE_PAGO, InscripcionEstado.PENDIENTE_CONFIRMACION, InscripcionEstado.PENDIENTE_PAGO_PRESENCIAL].includes(i.estado as InscripcionEstado)
      );
    }
    return inscripciones.filter((i) => i.estado === filter);
  })();

  // Count helpers for filter badges
  const countByFilter = (f: string) => {
    if (!f) return inscripciones.length;
    if (f === 'PENDIENTES') {
      return inscripciones.filter((i) =>
        [InscripcionEstado.PENDIENTE_PAGO, InscripcionEstado.PENDIENTE_CONFIRMACION, InscripcionEstado.PENDIENTE_PAGO_PRESENCIAL].includes(i.estado as InscripcionEstado)
      ).length;
    }
    return inscripciones.filter((i) => i.estado === f).length;
  };

  const needsAction = (estado: InscripcionEstado | string) =>
    [InscripcionEstado.PENDIENTE_PAGO, InscripcionEstado.RECHAZADA].includes(estado as InscripcionEstado);

  const canCancel = (estado: InscripcionEstado | string) =>
    [InscripcionEstado.PENDIENTE_PAGO, InscripcionEstado.PENDIENTE_CONFIRMACION, InscripcionEstado.PENDIENTE_PAGO_PRESENCIAL].includes(estado as InscripcionEstado);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando inscripciones..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-light-text">Error al cargar inscripciones</h3>
            <p className="text-light-secondary mb-4">{error}</p>
            <Button onClick={() => { setLoading(true); loadInscripciones(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Mis Inscripciones</h1>
        <p className="text-sm sm:text-base text-light-secondary mt-1 sm:mt-2">Revisá el estado de tus inscripciones a torneos</p>
      </div>

      {/* Filter buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: '', label: 'Todas' },
          { key: 'PENDIENTES', label: 'Pendientes' },
          { key: InscripcionEstado.CONFIRMADA, label: 'Confirmadas' },
          { key: InscripcionEstado.RECHAZADA, label: 'Rechazadas' },
          { key: InscripcionEstado.CANCELADA, label: 'Canceladas' },
        ].map(({ key, label }) => {
          const count = countByFilter(key);
          return (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(key)}
            >
              {label} ({count})
            </Button>
          );
        })}
      </div>

      {filteredInscripciones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-light-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-light-text">
              {filter ? 'No hay inscripciones con este filtro' : 'No tenés inscripciones'}
            </h3>
            <p className="text-light-secondary mb-4">
              {filter ? 'Probá con otro filtro o mirá todas tus inscripciones' : 'Explorá los torneos disponibles y participá'}
            </p>
            {filter ? (
              <Button variant="outline" onClick={() => setFilter('')}>Ver todas</Button>
            ) : (
              <Button onClick={() => navigate('/tournaments')}>Ver Torneos</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInscripciones.map((inscripcion) => {
            const isExpanded = expandedId === inscripcion.id;
            const cuentas = cuentasCache[inscripcion.tournamentId] || [];
            const isPendientePago = inscripcion.estado === InscripcionEstado.PENDIENTE_PAGO;
            const isRechazada = inscripcion.estado === InscripcionEstado.RECHAZADA;
            // Get pagos from array (new) or single pago (backward compat)
            const pagos: Pago[] = inscripcion.pagos || (inscripcion.pago ? [inscripcion.pago] : []);
            const primerPago = pagos[0];
            const showPaySection = needsAction(inscripcion.estado) && primerPago?.metodoPago === 'TRANSFERENCIA';
            // Individual payment: find my pending pago
            const isIndividual = inscripcion.modoPago === 'INDIVIDUAL';
            const miPago = isIndividual ? pagos.find((p) => p.jugadorId === user?.id) : null;
            const companeroPago = isIndividual ? pagos.find((p) => p.jugadorId !== user?.id) : null;
            const miPagoPendiente = miPago && miPago.estado === PagoEstado.PENDIENTE;

            return (
              <Card key={inscripcion.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <Link
                          to={`/tournaments/${inscripcion.tournamentId}`}
                          className="text-base sm:text-xl font-semibold truncate hover:text-primary-400 transition-colors"
                        >
                          {inscripcion.tournament?.nombre || 'Torneo'}
                        </Link>
                        {getStatusBadge(inscripcion.estado)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-light-secondary">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {inscripcion.tournament?.fechaInicio
                            ? new Date(inscripcion.tournament.fechaInicio).toLocaleDateString('es-PY')
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
                          <span className="text-light-text">
                            {inscripcion.pareja.jugador1?.nombre} {inscripcion.pareja.jugador1?.apellido}
                          </span>
                          {' & '}
                          <span className="text-light-text">
                            {inscripcion.pareja.jugador2
                              ? `${inscripcion.pareja.jugador2.nombre} ${inscripcion.pareja.jugador2.apellido}`
                              : `Doc: ${inscripcion.pareja.jugador2Documento}`}
                          </span>
                        </div>
                      )}

                      {/* Pago info */}
                      {pagos.length > 0 && (
                        <div className="mt-2 text-xs text-light-secondary">
                          {isIndividual ? (
                            <>
                              <span>Pago individual | Mi parte: Gs. {new Intl.NumberFormat('es-PY').format(Number(miPago?.monto || 0))}</span>
                              {companeroPago && (
                                <span className="ml-2">
                                  | Compañero: {companeroPago.estado === PagoEstado.CONFIRMADO
                                    ? <span className="text-green-400">Pagado</span>
                                    : <span className="text-yellow-400">Pendiente</span>}
                                </span>
                              )}
                            </>
                          ) : (
                            <>Método: {primerPago?.metodoPago} | Monto: Gs. {new Intl.NumberFormat('es-PY').format(Number(primerPago?.monto || 0))}</>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 items-start shrink-0">
                      {needsAction(inscripcion.estado) && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleExpand(inscripcion)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">{isPendientePago ? 'Pagar' : 'Reintentar'}</span>
                        </Button>
                      )}
                      {inscripcion.estado === InscripcionEstado.PENDIENTE_CONFIRMACION && (
                        <Badge variant="info" className="text-xs whitespace-nowrap">
                          Esperando confirmación
                        </Badge>
                      )}
                      {inscripcion.estado === InscripcionEstado.PENDIENTE_PAGO_PRESENCIAL && (
                        <Badge variant="warning" className="text-xs whitespace-nowrap">
                          Pagá al organizador
                        </Badge>
                      )}
                      <button
                        onClick={() => handleExpand(inscripcion)}
                        className="p-2 text-light-secondary hover:text-light-text hover:bg-dark-hover rounded transition-colors"
                        aria-label={isExpanded ? 'Contraer' : 'Expandir'}
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
                            {inscripcion.comprobantes[0]?.motivoRechazo || 'Sin motivo especificado'}
                          </p>
                        </div>
                      )}

                      {/* Individual payment: "Pagar mi parte" info */}
                      {isIndividual && miPagoPendiente && (
                        <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                          <p className="text-sm font-medium text-amber-400 mb-1">Tu pago individual está pendiente</p>
                          <p className="text-xs text-amber-300">
                            Monto: Gs. {new Intl.NumberFormat('es-PY').format(Number(miPago?.monto || 0))}
                          </p>
                          {companeroPago && (
                            <p className="text-xs text-light-secondary mt-1">
                              Estado del compañero: {companeroPago.estado === PagoEstado.CONFIRMADO
                                ? 'Pagado ✓'
                                : 'Pendiente'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Bank accounts + file upload (for TRANSFERENCIA pending/rechazada) */}
                      {showPaySection && (
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

                          {/* Comprobante file upload */}
                          <div>
                            <label className="block text-sm font-medium text-light-text mb-2">
                              Subir comprobante de transferencia
                            </label>

                            {/* File preview */}
                            {filePreview && (
                              <div className="relative mb-3 inline-block">
                                <img
                                  src={filePreview}
                                  alt="Preview del comprobante"
                                  className="max-h-40 rounded-lg border border-dark-border"
                                />
                                <button
                                  onClick={clearFileSelection}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  aria-label="Quitar imagen"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id={`file-upload-${inscripcion.id}`}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1"
                              >
                                <ImagePlus className="w-4 h-4 mr-2" />
                                {selectedFile ? selectedFile.name : 'Seleccionar imagen'}
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleUploadComprobante(inscripcion.id)}
                                loading={uploadingId === inscripcion.id}
                                disabled={!selectedFile}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Enviar
                              </Button>
                            </div>
                            <p className="text-xs text-light-secondary mt-1">
                              Formatos: JPG, PNG, WEBP. Máx 5MB.
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
                                  {comp.estado === 'APROBADA' ? 'Aprobado' : comp.estado === 'RECHAZADA' ? 'Rechazado' : 'Pendiente'}
                                </Badge>
                                <a
                                  href={comp.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-400 hover:underline flex items-center gap-1"
                                >
                                  Ver comprobante <ExternalLink className="w-3 h-3" />
                                </a>
                                {comp.motivoRechazo && (
                                  <span className="text-xs text-red-400">— {comp.motivoRechazo}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cancel button with confirmation */}
                      {canCancel(inscripcion.estado) && (
                        <div className="flex justify-end">
                          {confirmCancelId === inscripcion.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-red-400">
                                ¿Seguro que querés cancelar?
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmCancelId(null)}
                              >
                                No
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(inscripcion.id)}
                                loading={cancellingId === inscripcion.id}
                                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                              >
                                Sí, cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmCancelId(inscripcion.id)}
                              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                            >
                              Cancelar inscripción
                            </Button>
                          )}
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
