import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { suscripcionService, EstadoSuscripcion, IniciarPagoResponse } from '../../../services/suscripcionService';
import { sedesService } from '../../../services/sedesService';
import { useToast } from '../../../components/ui/ToastProvider';
import BancardCheckout from '../components/BancardCheckout';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Clock,
  Shield,
  ArrowLeft,
  History
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
  const [pagoData, setPagoData] = useState<IniciarPagoResponse | null>(null);
  const [configBancard, setConfigBancard] = useState<{ scriptUrl: string; publicKey: string } | null>(null);
  const [tipoSuscripcion, setTipoSuscripcion] = useState<'MENSUAL' | 'ANUAL'>('MENSUAL');
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);

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
      setConfigBancard(config);
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
      const data = await suscripcionService.iniciarPago(sedeIdParam!, tipoSuscripcion);
      setPagoData(data);
      showSuccess('Pago iniciado', 'Ingresa los datos de tu tarjeta en el formulario seguro.');
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo iniciar el pago');
    } finally {
      setIniciandoPago(false);
    }
  };

  const handlePaymentSuccess = () => {
    showSuccess('¡Pago exitoso!', 'Procesando tu suscripción...');
    // Esperar un momento y recargar estado
    setTimeout(() => {
      setPagoData(null);
      loadEstado();
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    showError('Error en el pago', error);
    setPagoData(null);
  };

  const handlePaymentCancel = () => {
    showError('Pago cancelado', 'Puedes intentarlo nuevamente cuando quieras.');
    setPagoData(null);
  };

  const toggleHistorial = () => {
    if (!showHistorial) {
      loadHistorial();
    }
    setShowHistorial(!showHistorial);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatMonto = (centavos: number) => {
    return `$${(centavos / 100).toFixed(2)} USD`;
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

        {/* Formulario de Pago o Selector de Plan */}
        {!estado?.activa && (
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-6 mb-8">
            {!pagoData ? (
              <>
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
                    <p className="text-3xl font-bold mb-1">$9.99 <span className="text-sm font-normal text-gray-400">USD/mes</span></p>
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
                    <p className="text-3xl font-bold mb-1">$107.89 <span className="text-sm font-normal text-gray-400">USD/año</span></p>
                    <p className="text-sm text-gray-400">Equivalente a $8.99/mes</p>
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

                {/* Botón de pago */}
                <button
                  onClick={handleIniciarPago}
                  disabled={iniciandoPago}
                  className="w-full py-4 bg-[#df2531] hover:bg-[#c41f2a] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                >
                  {iniciandoPago ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando...
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
                  Pago seguro procesado por Bancard
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <CreditCard className="text-[#df2531]" />
                  Completar pago
                </h3>
                <p className="text-gray-400 mb-6">
                  Monto a pagar: <strong className="text-white">{pagoData.montoFormateado}</strong>
                </p>

                {configBancard && (
                  <BancardCheckout
                    processId={pagoData.processId}
                    scriptUrl={configBancard.scriptUrl}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    onPaymentCancel={handlePaymentCancel}
                  />
                )}

                <button
                  onClick={() => setPagoData(null)}
                  className="mt-4 w-full py-3 border border-[#232838] hover:bg-[#232838] rounded-lg transition-colors"
                >
                  Cancelar y volver
                </button>
              </>
            )}
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
