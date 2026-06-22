import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { suscripcionService, EstadoSuscripcion } from '../../../services/suscripcionService';
import { sedesService } from '../../../services/sedesService';
import { useToast } from '../../../components/ui/ToastProvider';
import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  ArrowLeft,
  History,
  XCircle,
  MessageCircle,
} from 'lucide-react';
import { useNoIndex } from '../../../hooks/useNoIndex';

interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
}

const PRECIO_MENSUAL = 50000;

export default function SuscripcionPage() {
  useNoIndex();
  const { sedeId: sedeIdParam } = useParams<{ sedeId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmModalProps } = useConfirm();

  const [sede, setSede] = useState<Sede | null>(null);
  const [estado, setEstado] = useState<EstadoSuscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);
  const [cancelandoSuscripcion, setCancelandoSuscripcion] = useState(false);

  useEffect(() => {
    if (sedeIdParam) {
      loadSede();
      loadEstado();
    }
  }, [sedeIdParam]);

  const loadSede = async () => {
    try {
      const data = await sedesService.getById(sedeIdParam!);
      setSede(data);
    } catch {
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

  const loadHistorial = async () => {
    try {
      const data = await suscripcionService.getHistorialPagos(sedeIdParam!);
      setHistorialPagos(Array.isArray(data) ? data : []);
    } catch {
      showError('Error', 'No se pudo cargar el historial de pagos');
    }
  };

  const toggleHistorial = () => {
    if (!showHistorial) loadHistorial();
    setShowHistorial(!showHistorial);
  };

  const handleCancelarSuscripcion = async () => {
    const confirmed = await confirm({
      title: '¿Cancelar suscripción?',
      message: 'Tu sede seguirá activa hasta el vencimiento del período pagado. Después de esa fecha, no podrás recibir nuevas reservas.',
      confirmText: 'Cancelar suscripción',
      cancelText: 'Mantener suscripción',
      variant: 'warning',
    });
    if (!confirmed) return;

    setCancelandoSuscripcion(true);
    try {
      const resultado = await suscripcionService.cancelarSuscripcion(sedeIdParam!);
      showSuccess('Suscripción cancelada', `Tenés ${resultado.data?.diasRestantes ?? 0} días restantes de acceso.`);
      loadEstado();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo cancelar la suscripción');
    } finally {
      setCancelandoSuscripcion(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const formatMonto = (monto: number) => `Gs. ${monto.toLocaleString('es-PY')}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#df2531]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Volver
          </button>
          <h1 className="text-3xl font-bold mb-2">Servicio de reservas</h1>
          {sede && <p className="text-gray-400">{sede.nombre} - {sede.ciudad}</p>}
        </div>

        {/* Estado Actual */}
        <div className={`rounded-xl border p-6 mb-8 ${
          estado?.activa ? 'bg-green-500/10 border-green-500/30' : 'bg-[#151921] border-[#232838]'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${estado?.activa ? 'bg-green-500/20' : 'bg-[#df2531]/20'}`}>
              {estado?.activa ? <CheckCircle size={32} className="text-green-500" /> : <AlertCircle size={32} className="text-[#df2531]" />}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">
                {estado?.activa ? 'Servicio activo' : 'Servicio inactivo'}
              </h2>
              {estado?.activa ? (
                <div className="space-y-2">
                  <p className="text-green-400">Tu servicio está activo: los jugadores pueden reservar tus canchas.</p>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={16} />
                    <span>Vence el: <strong className="text-white">{formatDate(estado.venceEn)}</strong></span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-500/20">
                    <button
                      onClick={handleCancelarSuscripcion}
                      disabled={cancelandoSuscripcion}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                      {cancelandoSuscripcion ? (
                        <><div className="animate-spin h-4 w-4 border-b-2 border-red-400 rounded-full" /> Cancelando...</>
                      ) : (
                        <><XCircle size={16} /> Cancelar suscripción</>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Tu sede seguirá activa hasta el vencimiento del período pagado.</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">
                  Activá el servicio para empezar a recibir reservas de canchas. Los jugadores ven tu disponibilidad y reservan directo.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Plan + cómo activar - solo si no está activa */}
        {!estado?.activa && (
          <div className="bg-[#151921] rounded-xl border border-[#232838] p-6 mb-8">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold">Plan mensual</h3>
                <p className="text-sm text-gray-400">Facturado mes a mes</p>
              </div>
              <p className="text-3xl font-bold">
                {formatMonto(PRECIO_MENSUAL)} <span className="text-sm font-normal text-gray-400">/mes</span>
              </p>
            </div>

            <div className="bg-[#0B0E14] rounded-lg p-4 mb-6">
              <h4 className="font-medium mb-3 text-gray-300">Incluye:</h4>
              <ul className="space-y-2">
                {[
                  'Reservas online de tus canchas, 24/7',
                  'Notificaciones automáticas a los jugadores',
                  'Gestión de disponibilidad y bloqueos',
                  'Panel de reservas y estadísticas de tu sede',
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cómo activar (manual / coordinar con FairPadel) */}
            <div className="bg-[#df2531]/10 border border-[#df2531]/30 rounded-lg p-4 flex gap-3">
              <MessageCircle size={22} className="text-[#df2531] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white mb-1">¿Cómo lo activo?</p>
                <p className="text-sm text-gray-300">
                  Coordiná el pago con FairPadel para activar el servicio. En cuanto confirmemos el pago,
                  tu sede queda lista para recibir reservas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Historial de Pagos */}
        <div className="bg-[#151921] rounded-xl border border-[#232838] p-6">
          <button onClick={toggleHistorial} className="w-full flex items-center justify-between text-left">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History size={20} className="text-[#df2531]" />
              Historial de pagos
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
                            {formatDate(pago.fechaPago || pago.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            {pago.metodo === 'REGALO' ? 'Regalo' : formatMonto(pago.monto)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">
                            {formatDate(pago.periodoDesde)} - {formatDate(pago.periodoHasta)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              pago.estado === 'COMPLETADO' ? 'bg-green-500/20 text-green-400'
                                : pago.estado === 'PENDIENTE' ? 'bg-yellow-500/20 text-yellow-400'
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

        <ConfirmModal
          isOpen={confirmModalProps.isOpen}
          onClose={confirmModalProps.close}
          onConfirm={confirmModalProps.handleConfirm}
          title={confirmModalProps.title}
          message={confirmModalProps.message}
          confirmText={confirmModalProps.confirmText}
          cancelText={confirmModalProps.cancelText}
          variant={confirmModalProps.variant}
        />
      </div>
    </div>
  );
}
