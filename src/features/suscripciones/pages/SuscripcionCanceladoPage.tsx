import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, Crown } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function SuscripcionCanceladoPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-orange-500/20 flex items-center justify-center">
            <XCircle className="h-12 w-12 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-light-text mb-2">
            Pago cancelado
          </h1>
          <p className="text-light-secondary mb-6">
            El proceso de pago fue cancelado. No se realizó ningún cobro a tu tarjeta.
            Podés intentarlo de nuevo cuando quieras.
          </p>

          <div className="bg-dark-bg rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              <span className="text-light-text font-medium text-sm">¿Querés ser Premium?</span>
            </div>
            <p className="text-light-muted text-xs">
              Por solo $3 USD/mes accedés a SMS, feed social, estadísticas avanzadas,
              y si sos organizador: torneos ilimitados, ayudantes, re-sorteo y más.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/premium" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold">
                <Crown className="h-4 w-4 mr-1" />
                Intentar de nuevo
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
