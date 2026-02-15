import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle, Crown, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { suscripcionesService } from '../../../services/suscripcionesService';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';

type Estado = 'procesando' | 'exito' | 'error';

export default function SuscripcionConfirmacionPage() {
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuthStore();
  const [estado, setEstado] = useState<Estado>('procesando');
  const [mensaje, setMensaje] = useState('');

  const suscripcionId = searchParams.get('suscripcionId');
  const transactionId = searchParams.get('transactionId');

  useEffect(() => {
    confirmarPago();
  }, []);

  const confirmarPago = async () => {
    if (!suscripcionId) {
      setEstado('error');
      setMensaje('No se encontró la información de suscripción.');
      return;
    }

    try {
      const resultado = await suscripcionesService.confirmarPago(
        suscripcionId,
        transactionId || undefined,
      );
      setEstado('exito');
      setMensaje(resultado.message);
      toast.success('Premium activado!');

      // Update user premium flag in store
      if (user) {
        setUser({ ...user, esPremium: true });
      }
    } catch (err: any) {
      setEstado('error');
      setMensaje(
        err.response?.data?.message ||
        'Hubo un problema al confirmar tu pago. Contacta a soporte.'
      );
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <Card>
        <CardContent className="p-8 text-center">
          {estado === 'procesando' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-light-text mb-2">
                Procesando tu pago...
              </h1>
              <p className="text-light-secondary">
                Estamos verificando tu pago con la pasarela. Esto puede tomar unos segundos.
              </p>
            </>
          )}

          {estado === 'exito' && (
            <>
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-light-text mb-2">
                Premium Activado!
              </h1>
              <p className="text-light-secondary mb-6">
                {mensaje}
              </p>
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">FairPadel Premium</span>
                </div>
                <p className="text-light-secondary text-sm">
                  Ya tenés acceso a todos los beneficios premium.
                  Disfrutá de notificaciones SMS, feed social, estadísticas avanzadas y más.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/premium" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Ver mi suscripción
                  </Button>
                </Link>
                <Link to="/" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold">
                    Ir al inicio
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </>
          )}

          {estado === 'error' && (
            <>
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-light-text mb-2">
                Error al procesar el pago
              </h1>
              <p className="text-light-secondary mb-6">
                {mensaje}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/premium" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Intentar de nuevo
                  </Button>
                </Link>
                <Link to="/" className="flex-1">
                  <Button variant="ghost" className="w-full">
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
