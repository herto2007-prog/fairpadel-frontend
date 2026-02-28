import { Button } from '@/components/ui';
import {
  Printer,
  X,
  DollarSign,
  Calendar,
  User,
  GraduationCap,
  Receipt,
} from 'lucide-react';
import type { ReciboData } from '@/types';

const CONCEPTO_LABELS: Record<string, string> = {
  CLASE: 'Clase',
  PAQUETE: 'Paquete',
  DEUDA: 'Pago de deuda',
  ADELANTO: 'Adelanto',
  OTRO: 'Otro',
};

const METODO_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  QR: 'QR',
  OTRO: 'Otro',
};

interface Props {
  recibo: ReciboData;
  onClose: () => void;
}

const ComprobanteRecibo = ({ recibo, onClose }: Props) => {
  const { pago, instructor, alumnoNombre, alumnoTelefono } = recibo;

  const fechaFormatted = new Date(pago.fecha + (pago.fecha.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('es-PY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const emitidoFormatted = new Date().toLocaleDateString('es-PY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      <div className="relative z-50 w-full max-w-md mx-4">
        {/* Action buttons (hidden on print) */}
        <div className="flex justify-end gap-2 mb-3 no-print">
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Imprimir
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Receipt card (printable) */}
        <div className="recibo-print bg-dark-card rounded-lg border border-dark-border p-6 space-y-5">
          {/* Header */}
          <div className="text-center border-b border-dark-border pb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Receipt className="h-5 w-5 text-primary-400" />
              <h2 className="text-lg font-bold text-light-text">RECIBO DE PAGO</h2>
            </div>
            {pago.numeroRecibo && (
              <p className="text-sm font-mono text-primary-400">N° {String(pago.numeroRecibo).padStart(4, '0')}</p>
            )}
          </div>

          {/* Instructor */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-light-muted">
              <GraduationCap className="h-3.5 w-3.5" />
              Instructor
            </div>
            <p className="text-sm font-medium text-light-text">
              {instructor.user.nombre} {instructor.user.apellido}
            </p>
            {instructor.user.telefono && (
              <p className="text-xs text-light-secondary">Tel: {instructor.user.telefono}</p>
            )}
          </div>

          {/* Alumno */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-light-muted">
              <User className="h-3.5 w-3.5" />
              Alumno
            </div>
            <p className="text-sm font-medium text-light-text">{alumnoNombre}</p>
            {alumnoTelefono && (
              <p className="text-xs text-light-secondary">Tel: {alumnoTelefono}</p>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-dark-surface rounded-lg p-4 space-y-3">
            {/* Monto */}
            <div className="text-center">
              <p className="text-xs text-light-muted mb-1">Monto</p>
              <p className="text-2xl font-bold text-green-400 flex items-center justify-center gap-1">
                <DollarSign className="h-6 w-6" />
                Gs. {pago.monto.toLocaleString()}
              </p>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dark-border">
              <div>
                <p className="text-[10px] text-light-muted">Método</p>
                <p className="text-xs text-light-text font-medium">
                  {METODO_LABELS[pago.metodoPago] || pago.metodoPago}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-light-muted">Concepto</p>
                <p className="text-xs text-light-text font-medium">
                  {CONCEPTO_LABELS[pago.concepto] || pago.concepto}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-light-muted">Fecha de pago</p>
                <p className="text-xs text-light-text font-medium">{fechaFormatted}</p>
              </div>
              {pago.reserva && (
                <div>
                  <p className="text-[10px] text-light-muted">Clase</p>
                  <p className="text-xs text-light-text font-medium">
                    {new Date(pago.reserva.fecha + (pago.reserva.fecha.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })}
                    {' '}{pago.reserva.horaInicio}-{pago.reserva.horaFin}
                  </p>
                </div>
              )}
            </div>

            {/* Descripcion */}
            {pago.descripcion && (
              <div className="pt-2 border-t border-dark-border">
                <p className="text-[10px] text-light-muted">Descripción</p>
                <p className="text-xs text-light-secondary">{pago.descripcion}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-3 border-t border-dark-border">
            <p className="text-[10px] text-light-muted flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              Emitido el {emitidoFormatted}
            </p>
            <p className="text-[10px] text-light-muted mt-1">Emitido por FairPadel</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprobanteRecibo;
