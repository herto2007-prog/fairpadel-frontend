import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { inscripcionesService } from '@/services/inscripcionesService';
import tournamentsService from '@/services/tournamentsService';
import type { Inscripcion, CuentaBancaria } from '@/types';
import { MetodoPago } from '@/types';
import { CreditCard, Building2, Banknote, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [showCuentas, setShowCuentas] = useState(false);

  useEffect(() => {
    if (isOpen && inscripcion.tournamentId) {
      tournamentsService.getCuentasBancarias(inscripcion.tournamentId).then(setCuentasBancarias).catch(() => {});
    }
  }, [isOpen, inscripcion.tournamentId]);

  const habilitarBancard = inscripcion.tournament?.habilitarBancard;

  const paymentMethods = [
    ...(habilitarBancard
      ? [
          {
            id: MetodoPago.BANCARD,
            name: 'Tarjeta de Crédito/Débito',
            description: 'Paga con Bancard (Visa, Mastercard)',
            icon: CreditCard,
          },
        ]
      : []),
    {
      id: MetodoPago.TRANSFERENCIA,
      name: 'Transferencia Bancaria',
      description: 'Transferí y opcionalmente subí tu comprobante',
      icon: Building2,
    },
    {
      id: MetodoPago.EFECTIVO,
      name: 'Efectivo',
      description: 'Paga presencialmente al organizador',
      icon: Banknote,
    },
  ];

  const monto = inscripcion.tournament?.costoInscripcion || 0;

  const handleSubmitComprobante = async () => {
    if (!comprobanteUrl.trim()) {
      // Just close — comprobante is optional
      toast.success('Inscripción registrada. Podés subir el comprobante más tarde.');
      onSuccess?.();
      onClose();
      return;
    }

    setLoading(true);
    setError('');
    try {
      await inscripcionesService.uploadComprobante(inscripcion.id, comprobanteUrl);
      toast.success('Comprobante enviado. Esperá la confirmación del organizador.');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al subir comprobante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Método de Pago" size="md">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="p-4 bg-dark-surface rounded-lg">
          <p className="text-sm text-light-secondary">Monto a pagar:</p>
          <p className="text-2xl font-bold text-primary-500">
            Gs. {new Intl.NumberFormat('es-PY').format(Number(monto))}
          </p>
        </div>

        {!showCuentas ? (
          <>
            <div className="space-y-3">
              <p className="font-medium">Seleccioná el método de pago:</p>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method.id);
                      if (method.id === MetodoPago.TRANSFERENCIA) {
                        setShowCuentas(true);
                      }
                    }}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors flex items-center gap-4 ${
                      selectedMethod === method.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-border hover:border-dark-hover'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        selectedMethod === method.id ? 'text-primary-500' : 'text-light-secondary'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-light-secondary">{method.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedMethod === MetodoPago.EFECTIVO && (
              <div className="p-3 bg-green-900/30 rounded-lg border border-green-500/30">
                <p className="text-sm text-green-400">
                  Coordiná con el organizador para pagar presencialmente.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              {selectedMethod && selectedMethod !== MetodoPago.TRANSFERENCIA && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    toast.success('Método seleccionado. El organizador confirmará tu pago.');
                    onSuccess?.();
                    onClose();
                  }}
                  className="flex-1"
                >
                  Confirmar
                </Button>
              )}
            </div>
          </>
        ) : (
          /* Transferencia — Show bank accounts + optional comprobante */
          <>
            <div className="space-y-3">
              <p className="font-medium text-primary-400">Datos para transferir:</p>
              {cuentasBancarias.length > 0 ? (
                cuentasBancarias.map((cuenta) => (
                  <div key={cuenta.id} className="p-3 bg-dark-surface rounded-lg border border-dark-border">
                    <p className="font-semibold text-light-text">{cuenta.banco}</p>
                    <p className="text-sm text-light-secondary">Titular: {cuenta.titular}</p>
                    <p className="text-sm text-light-secondary">CI/RUC: {cuenta.cedulaRuc}</p>
                    {cuenta.nroCuenta && <p className="text-sm text-light-secondary">Cuenta: {cuenta.nroCuenta}</p>}
                    {cuenta.aliasSpi && <p className="text-sm text-primary-400 font-medium">Alias SPI: {cuenta.aliasSpi}</p>}
                    {cuenta.telefonoComprobante && (
                      <p className="text-sm text-light-secondary flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> WhatsApp: {cuenta.telefonoComprobante}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-light-secondary">
                  El organizador no configuró datos bancarios. Contactalo directamente.
                </p>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-light-text mb-1">
                  URL del comprobante (opcional)
                </label>
                <input
                  type="url"
                  value={comprobanteUrl}
                  onChange={(e) => setComprobanteUrl(e.target.value)}
                  placeholder="https://... (link a imagen del comprobante)"
                  className="w-full rounded-md border border-dark-border bg-dark-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-light-secondary mt-1">
                  Podés subir el comprobante más tarde desde "Mis Inscripciones"
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCuentas(false)} className="flex-1">
                Volver
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmitComprobante}
                loading={loading}
                className="flex-1"
              >
                {comprobanteUrl.trim() ? 'Enviar Comprobante' : 'Continuar sin comprobante'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PagoModal;
