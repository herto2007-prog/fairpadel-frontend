import { useState, useEffect, useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import { inscripcionesService } from '@/services/inscripcionesService';
import tournamentsService from '@/services/tournamentsService';
import type { Inscripcion, CuentaBancaria } from '@/types';
import { MetodoPago } from '@/types';
import { CreditCard, Building2, Banknote, Phone, Upload, X } from 'lucide-react';
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
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [showCuentas, setShowCuentas] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inscripcion.tournamentId) {
      tournamentsService.getCuentasBancarias(inscripcion.tournamentId).then(setCuentasBancarias).catch(() => {});
    }
  }, [isOpen, inscripcion.tournamentId]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
    };
  }, [comprobantePreview]);

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
      description: 'Transferí y subí tu comprobante',
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede superar 5MB');
      return;
    }

    setComprobanteFile(file);
    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
    setComprobantePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setComprobanteFile(null);
    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
    setComprobantePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitComprobante = async () => {
    if (!comprobanteFile) {
      // Just close — comprobante is optional
      toast.success('Inscripción registrada. Podés subir el comprobante más tarde.');
      onSuccess?.();
      onClose();
      return;
    }

    setLoading(true);
    setError('');
    try {
      await inscripcionesService.uploadComprobante(inscripcion.id, comprobanteFile);
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
          /* Transferencia — Show bank accounts + file upload for comprobante */
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

              {/* File upload for comprobante */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-light-text mb-2">
                  Foto del comprobante (opcional)
                </label>

                {comprobantePreview ? (
                  <div className="relative">
                    <img
                      src={comprobantePreview}
                      alt="Comprobante"
                      className="w-full max-h-48 object-contain rounded-lg border border-dark-border bg-dark-surface"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-light-secondary mt-1">{comprobanteFile?.name}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 border-2 border-dashed border-dark-border rounded-lg hover:border-primary-500/50 hover:bg-primary-500/5 transition-colors flex flex-col items-center gap-2 text-light-secondary"
                  >
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Toca para subir imagen</span>
                    <span className="text-xs">JPG, PNG (máx. 5MB)</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
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
                {comprobanteFile ? 'Enviar Comprobante' : 'Continuar sin comprobante'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PagoModal;
