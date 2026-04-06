import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { suscripcionService, EstadoSuscripcion } from '../../../services/suscripcionService';
import { sedesService } from '../../../services/sedesService';
import { useToast } from '../../../components/ui/ToastProvider';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Clock,
  Shield,
  ArrowLeft,
  History,
  RotateCcw,
  Search
} from 'lucide-react';

interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
}

export default function SuscripcionPage() {
  const { sedeId: sedeIdParam } = useParams<{ sedeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [sede, setSede] = useState<Sede | null>(null);
  const [estado, setEstado] = useState<EstadoSuscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [iniciandoPago, setIniciandoPago] = useState(false);
  const [configBancard, setConfigBancard] = useState<{ publicKey: string; baseUrl: string } | null>(null);
  const [tipoSuscripcion, setTipoSuscripcion] = useState<'MENSUAL' | 'ANUAL'>('MENSUAL');
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);
  const [testingPagoId, setTestingPagoId] = useState<string | null>(null);
  const [testingAction, setTestingAction] = useState<'rollback' | 'consultar' | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (sedeIdParam) {
      loadSede();
      loadEstado();
      loadConfigBancard();
    }
  }, [sedeIdParam]);

  // Verificar si viene de un pago exitoso (parámetro en URL)
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      showSuccess('¡Pago exitoso!', 'Tu suscripción ha sido activada correctamente.');
      // Limpiar parámetros de URL
      navigate(`/sede/${sedeIdParam}/suscripcion`, { replace: true });
      // Recargar estado
      loadEstado();
    } else if (status === 'cancel') {
      showError('Pago cancelado', 'El pago fue cancelado. Puedes intentarlo nuevamente.');
      navigate(`/sede/${sedeIdParam}/suscripcion`, { replace: true });
    } else if (status === 'error') {
      showError('Error en el pago', 'Hubo un problema procesando tu pago. Intenta nuevamente.');
      navigate(`/sede/${sedeIdParam}/suscripcion`, { replace: true });
    }
  }, [searchParams]);

  const loadSede = async () => {
    try {
      const data = await sedesService.getById(sedeIdParam!);
      setSede(data);
    } catch (err) {
      showError('Error', 'No se pudo cargar la información de la sede');
    }
  };

  const loadEstado = async () => {
    try {
      setLoading(true);
      const data = await suscripcionService.getEstado(sedeIdParam!);
      setEstado(data);
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo cargar el estado de la suscripción');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigBancard = async () => {
    try {
      const config = await suscripcionService.getConfigBancard();
      // Solo necesitamos baseUrl para la redirección
      setConfigBancard({
        publicKey: config.publicKey,
        baseUrl: config.baseUrl
      });
    } catch (err) {
      console.error('Error cargando config Bancard:', err);
    }
  };

  const loadHistorial = async () => {
    try {
      const data = await suscripcionService.getHistorialPagos(sedeIdParam!);
      setHistorialPagos(data);
    } catch (err) {
      showError('Error', 'No se pudo cargar el historial de pagos');
    }
  };

  const handleIniciarPago = async () => {
    try {
      setIniciandoPago(true);
      console.log('[DEBUG] Iniciando pago:', { sedeId: sedeIdParam, tipo: tipoSuscripcion });
      
      const data = await suscripcionService.iniciarPago(sedeIdParam!, tipoSuscripcion);
      console.log('[DEBUG] Respuesta iniciarPago:', data);
      
      // Guardar datos del pago en localStorage para recuperarlos al volver
      localStorage.setItem('suscripcion_pago_id', data.pagoId);
      localStorage.setItem('suscripcion_sede_id', sedeIdParam!);
      localStorage.setItem('suscripcion_timestamp', Date.now().toString());
      console.log('[DEBUG] Datos guardados en localStorage:', {
        pagoId: data.pagoId,
        sedeId: sedeIdParam,
        processId: data.processId,
      });
      
      // Redirigir al checkout de Bancard (flujo de redirección vPOS 1.0)
      // Según documentación Bancard: https://vpos.infonet.com.py:8888/checkout/new?process_id=XXX
      const bancardCheckoutUrl = `${configBancard?.baseUrl}/checkout/new?process_id=${data.processId}`;
      console.log('[DEBUG] Redirigiendo a Bancard:', bancardCheckoutUrl);
      window.location.href = bancardCheckoutUrl;
      
    } catch (err: any) {
      console.error('[DEBUG] Error iniciando pago:', err);
      console.error('[DEBUG] Error response:', err.response?.data);
      showError('Error', err.response?.data?.message || 'No se pudo iniciar el pago');
      setIniciandoPago(false);
    }
  };

  const toggleHistorial = () => {
    if (!showHistorial) {
      loadHistorial();
    }
    setShowHistorial(!showHistorial);
  };

  // ============================================
  // FUNCIONES DE TESTING PARA BANCARD
  // ============================================

  const handleRollback = async (shopProcessId: string) => {
    if (!confirm('¿Estás seguro de que querés hacer rollback de esta transacción?\n\nEsto cancelará/reversará el pago en Bancard.')) {
      return;
    }

    setTestingPagoId(shopProcessId);
    setTestingAction('rollback');

    try {
      const resultado = await suscripcionService.rollbackTransaccion(shopProcessId);
      console.log('Rollback resultado:', resultado);
      showSuccess('Rollback exitoso', resultado.data?.messages?.[0]?.dsc || 'Transacción reversada correctamente');
      // Recargar historial
      loadHistorial();
      loadEstado();
    } catch (err: any) {
      showError('Error en rollback', err.response?.data?.message || 'No se pudo realizar el rollback');
    } finally {
      setTestingPagoId(null);
      setTestingAction(null);
    }
  };

  const handleConsultarEnBancard = async (shopProcessId: string) => {
    setTestingPagoId(shopProcessId);
    setTestingAction('consultar');

    try {
      const resultado = await suscripcionService.consultarTransaccion(shopProcessId);
      console.log('Consulta Bancard:', resultado);
      
      const estado = resultado.confirmation?.response === 'S' ? 'Aprobada' : 
                     resultado.confirmation?.response === 'N' ? 'Rechazada' : 'Pendiente/No encontrada';
      
      showSuccess(
        `Estado en Bancard: ${estado}`,
        `Monto: ${resultado.confirmation?.amount || 'N/A'} ${resultado.confirmation?.currency || ''}`
      );
    } catch (err: any) {
      showError('Error consultando', err.response?.data?.message || 'No se pudo consultar en Bancard');
    } finally {
      setTestingPagoId(null);
      setTestingAction(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatMonto = (monto: number) => {
    return `Gs. ${monto.toLocaleString('es-PY')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df2531]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Volver
          </button>
          
          <h1 className="text-3xl font-bold mb-2">
            Suscripción de Reservas
          </h1>
          {sede && (
            <p className="text-gray-400">
              {sede.nombre} - {sede.ciudad}
            </p>
          )}
        </div>

        {/* Estado Actual */}
        <div className={`rounded-xl border p-6 mb-8 ${
          estado?.activa 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-[#151921] border-[#232838]'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              estado?.activa ? 'bg-green-500/20' : 'bg-[#df2531]/20'
            }`}>
              {estado?.activa ? (
                <CheckCircle size={32} className="text-green-500" />
              ) : (
                <AlertCircle size={32} className="text-[#df2531]" />
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">
                {estado?.activa ? 'Suscripción Activa' : 'Suscripción Inactiva'}
              </h2>
              
              {estado?.activa ? (
                <div className="space-y-2">
                  <p className="text-green-400">
                    Tu suscripción está activa y puedes recibir reservas.
                  </p>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={16} />
                    <span>Vence el: <strong className="text-white">{formatDate(estado.venceEn)}</strong></span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">
                  Activa tu suscripción para comenzar a recibir reservas de canchas.
                  Los clientes podrán ver tu disponibilidad y reservar directamente.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Selector de Plan - Solo visible si no está activa */}
        {!estado?.activa && (
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-6 mb-8">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <CreditCard className="text-[#df2531]" />
              Selecciona tu plan
            </h3>

            {/* Opciones de plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setTipoSuscripcion('MENSUAL')}
                className={`p-6 rounded-lg border-2 text-left transition-all ${
                  tipoSuscripcion === 'MENSUAL'
                    ? 'border-[#df2531] bg-[#df2531]/10'
                    : 'border-[#232838] hover:border-[#df2531]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Plan Mensual</span>
                  {tipoSuscripcion === 'MENSUAL' && (
                    <CheckCircle size={20} className="text-[#df2531]" />
                  )}
                </div>
                <p className="text-3xl font-bold mb-1">Gs. 1.000 <span className="text-sm font-normal text-gray-400">/mes</span></p>
                <p className="text-sm text-gray-400">Facturado mensualmente</p>
              </button>

              <button
                onClick={() => setTipoSuscripcion('ANUAL')}
                className={`p-6 rounded-lg border-2 text-left transition-all relative overflow-hidden ${
                  tipoSuscripcion === 'ANUAL'
                    ? 'border-[#df2531] bg-[#df2531]/10'
                    : 'border-[#232838] hover:border-[#df2531]/50'
                }`}
              >
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                  Ahorra 10%
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Plan Anual</span>
                  {tipoSuscripcion === 'ANUAL' && (
                    <CheckCircle size={20} className="text-[#df2531]" />
                  )}
                </div>
                <p className="text-3xl font-bold mb-1">Gs. 10.000 <span className="text-sm font-normal text-gray-400">/año</span></p>
                <p className="text-sm text-gray-400">¡Pagás 10 meses, llevás 12!</p>
              </button>
            </div>

            {/* Beneficios */}
            <div className="bg-[#0B0E14] rounded-lg p-4 mb-8">
              <h4 className="font-medium mb-3 text-gray-300">Incluye:</h4>
              <ul className="space-y-2">
                {[
                  'Sistema completo de reservas online',
                  'Notificaciones automáticas por WhatsApp/Email',
                  'Gestión de disponibilidad en tiempo real',
                  'Panel de administración de reservas',
                  'Soporte técnico prioritario'
                ].map((beneficio, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    {beneficio}
                  </li>
                ))}
              </ul>
            </div>

            {/* Botón de pago - Redirige a Bancard */}
            <button
              onClick={handleIniciarPago}
              disabled={iniciandoPago}
              className="w-full py-4 bg-[#df2531] hover:bg-[#c41f2a] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              {iniciandoPago ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Redirigiendo a Bancard...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Pagar con Tarjeta
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield size={16} />
              Pago seguro procesado por Bancard. Serás redirigido a su sitio seguro.
            </div>
          </div>
        )}

        {/* Historial de Pagos */}
        <div className="bg-[#151921] rounded-xl border border-[#232838] p-6">
          <button
            onClick={toggleHistorial}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History size={20} className="text-[#df2531]" />
              Historial de Pagos
            </h3>
            <span className="text-gray-400">{showHistorial ? '▲' : '▼'}</span>
          </button>

          {showHistorial && (
            <div className="mt-4">
              {historialPagos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay pagos registrados</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#232838]">
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Fecha</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Monto</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Período</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Estado</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-400">Testing Bancard</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialPagos.map((pago) => (
                        <tr key={pago.id} className="border-b border-[#232838]/50">
                          <td className="py-3 px-4 text-sm">
                            {new Date(pago.createdAt).toLocaleDateString('es-PY')}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            {formatMonto(pago.monto)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">
                            {formatDate(pago.periodoDesde)} - {formatDate(pago.periodoHasta)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              pago.estado === 'COMPLETADO' 
                                ? 'bg-green-500/20 text-green-400' 
                                : pago.estado === 'PENDIENTE'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {pago.estado === 'COMPLETADO' && <CheckCircle size={12} />}
                              {pago.estado === 'PENDIENTE' && <Clock size={12} />}
                              {pago.estado === 'FALLIDO' && <AlertCircle size={12} />}
                              {pago.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {pago.referencia && (
                              <div className="flex items-center gap-2">
                                {/* Consultar en Bancard - disponible para todos */}
                                <button
                                  onClick={() => handleConsultarEnBancard(pago.referencia)}
                                  disabled={testingPagoId === pago.referencia}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs transition-colors disabled:opacity-50"
                                  title="Consultar estado en Bancard"
                                >
                                  {testingPagoId === pago.referencia && testingAction === 'consultar' ? (
                                    <div className="animate-spin h-3 w-3 border-b-2 border-blue-400 rounded-full" />
                                  ) : (
                                    <Search size={12} />
                                  )}
                                  Consultar
                                </button>

                                {/* Rollback - solo para PENDIENTE o COMPLETADO */}
                                {(pago.estado === 'PENDIENTE' || pago.estado === 'COMPLETADO') && (
                                  <button
                                    onClick={() => handleRollback(pago.referencia)}
                                    disabled={testingPagoId === pago.referencia}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors disabled:opacity-50 ${
                                      pago.estado === 'COMPLETADO'
                                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                        : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                                    }`}
                                    title={pago.estado === 'COMPLETADO' ? 'Reversar transacción aprobada' : 'Cancelar pago pendiente'}
                                  >
                                    {testingPagoId === pago.referencia && testingAction === 'rollback' ? (
                                      <div className="animate-spin h-3 w-3 border-b-2 border-white rounded-full" />
                                    ) : (
                                      <RotateCcw size={12} />
                                    )}
                                    {pago.estado === 'COMPLETADO' ? 'Reversar' : 'Cancelar'}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
