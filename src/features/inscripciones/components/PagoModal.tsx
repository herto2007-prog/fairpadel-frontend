import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { inscripcionesService } from '@/services/inscripcionesService';
import type { Inscripcion } from '@/types';
import { MetodoPago } from '@/types';
import { CreditCard, Building2, Banknote } from 'lucide-react';

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  inscripcion: Inscripcion;
  onSuccess?: () => void;
}

export const PagoModal: React.FC<PagoModalProps> = ({
  isOpen,
  onClose,
  inscripcion,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<MetodoPago | null>(null);

  const handlePay = async () => {
    if (!selectedMethod) {
      setError('Selecciona un método de pago');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await inscripcionesService.initPayment(inscripcion.id, selectedMethod);
      
      if (selectedMethod === MetodoPago.BANCARD && response.redirectUrl) {
        // Redirigir a Bancard
        window.location.href = response.redirectUrl;
      } else {
        // Transferencia o efectivo - mostrar instrucciones
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: MetodoPago.BANCARD,
      name: 'Tarjeta de Crédito/Débito',
      description: 'Paga con Bancard (Visa, Mastercard)',
      icon: CreditCard,
    },
    {
      id: MetodoPago.TRANSFERENCIA,
      name: 'Transferencia Bancaria',
      description: 'Sube tu comprobante después',
      icon: Building2,
    },
    {
      id: MetodoPago.EFECTIVO,
      name: 'Efectivo',
      description: 'Paga presencialmente en el torneo',
      icon: Banknote,
    },
  ];

  const monto = inscripcion.tournament?.costoInscripcion || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Realizar Pago" size="md">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="p-4 bg-dark-surface rounded-lg">
          <p className="text-sm text-light-secondary">Monto a pagar:</p>
          <p className="text-2xl font-bold text-primary-500">
            Gs. {new Intl.NumberFormat('es-PY').format(monto)}
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-medium">Selecciona el método de pago:</p>
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors flex items-center gap-4 ${
                  selectedMethod === method.id
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-border hover:border-dark-hover'
                }`}
              >
                <Icon className={`h-6 w-6 ${
                  selectedMethod === method.id ? 'text-primary-500' : 'text-light-secondary'
                }`} />
                <div>
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-light-secondary">{method.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handlePay}
            loading={loading}
            disabled={!selectedMethod}
            className="flex-1"
          >
            {selectedMethod === MetodoPago.BANCARD ? 'Pagar Ahora' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PagoModal;