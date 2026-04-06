import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Home } from 'lucide-react';
import { suscripcionService } from '../../../services/suscripcionService';

export default function SuscripcionConfirmacionPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando el estado de tu pago...');

  useEffect(() => {
    const verificarPago = async () => {
      try {
        // Recuperar datos del pago guardados en localStorage
        const pagoId = localStorage.getItem('suscripcion_pago_id');
        const sedeId = localStorage.getItem('suscripcion_sede_id');
        const timestamp = localStorage.getItem('suscripcion_timestamp');
        
        // Limpiar datos de localStorage
        localStorage.removeItem('suscripcion_pago_id');
        localStorage.removeItem('suscripcion_sede_id');
        localStorage.removeItem('suscripcion_timestamp');
        
        if (!pagoId || !sedeId) {
          setStatus('error');
          setMessage('No se encontró información del pago. Por favor, intenta nuevamente.');
          return;
        }
        
        // Verificar que la sesión no haya expirado (30 minutos)
        if (timestamp && Date.now() - parseInt(timestamp) > 30 * 60 * 1000) {
          setStatus('error');
          setMessage('La sesión de pago ha expirado. Por favor, intenta nuevamente.');
          return;
        }
        
        // Esperar 3 segundos para dar tiempo al webhook de Bancard
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verificar estado del pago en nuestro backend
        const resultado = await suscripcionService.verificarPago(sedeId, pagoId);
        
        if (resultado.pago.estado === 'COMPLETADO') {
          setStatus('success');
          setMessage('¡Tu suscripción ha sido activada exitosamente!');
        } else if (resultado.pago.estado === 'FALLIDO') {
          setStatus('error');
          setMessage('El pago no pudo ser procesado. Por favor, intenta con otro método de pago.');
        } else {
          // Si aún está pendiente, intentar verificar en Bancard directamente
          if (resultado.pago.referencia) {
            try {
              const resultadoBancard = await suscripcionService.verificarEnBancard(resultado.pago.referencia);
              if (resultadoBancard.status === 'success') {
                setStatus('success');
                setMessage('¡Tu suscripción ha sido activada exitosamente!');
                return;
              }
            } catch (e) {
              console.log('No se pudo verificar en Bancard:', e);
            }
          }
          
          setStatus('error');
          setMessage('No pudimos confirmar tu pago. Si completaste el pago, contacta soporte.');
        }
      } catch (error: any) {
        console.error('Error verificando pago:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Hubo un problema al verificar tu pago. Por favor, contacta soporte.');
      }
    };

    verificarPago();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#151921] rounded-2xl border border-[#232838] p-8 text-center"
      >
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Procesando pago</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-400">¡Pago exitoso!</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/mis-sedes')}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#df2531] hover:bg-[#c41f2a] rounded-xl font-medium transition-colors"
              >
                <Home className="w-5 h-5" />
                Ir a Mis Sedes
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 w-full py-3 border border-[#232838] hover:bg-[#232838] rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Volver
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-400">Pago no completado</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#df2531] hover:bg-[#c41f2a] rounded-xl font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Intentar nuevamente
              </button>
              <button
                onClick={() => navigate('/mis-sedes')}
                className="flex items-center justify-center gap-2 w-full py-3 border border-[#232838] hover:bg-[#232838] rounded-xl transition-colors"
              >
                <Home className="w-5 h-5" />
                Ir a Mis Sedes
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
