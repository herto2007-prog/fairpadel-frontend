import { useEffect, useState } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';

interface BancardCheckoutProps {
  processId: string;
  scriptUrl: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
  onPaymentCancel?: () => void;
}

export default function BancardCheckout({
  processId,
  scriptUrl,
}: BancardCheckoutProps) {
  const [error, setError] = useState<string | null>(null);

  // Extraer la URL base de Bancard del scriptUrl
  // scriptUrl: https://vpos.infonet.com.py:8888/checkout/javascript/dist/bancard-checkout-4.0.0.js
  const getBancardBaseUrl = () => {
    try {
      const url = new URL(scriptUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      return 'https://vpos.infonet.com.py:8888';
    }
  };

  const bancardBaseUrl = getBancardBaseUrl();
  const paymentUrl = `${bancardBaseUrl}/checkout/new?process_id=${processId}`;

  useEffect(() => {
    // Abrir automáticamente en nueva pestaña
    if (processId) {
      const newWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // El navegador bloqueó el popup
        setError('Por favor, permite las ventanas emergentes o haz clic en el botón de abajo para continuar');
      }
    }
  }, [processId, paymentUrl]);

  if (error) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <p className="text-amber-400 mb-4">{error}</p>
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#df2531] hover:bg-[#c41f2a] text-white rounded-lg font-medium transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          Ir a pagar en Bancard
        </a>
      </div>
    );
  }

  return (
    <div className="bg-[#151921] rounded-xl border border-[#232838] p-8 text-center">
      <div className="w-16 h-16 bg-[#df2531]/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <ExternalLink className="w-8 h-8 text-[#df2531]" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">Serás redirigido a Bancard</h3>
      <p className="text-gray-400 mb-6">
        Para completar tu pago de forma segura, serás redirigido a la plataforma de Bancard.
        Una vez finalizado, volverás automáticamente a FairPadel.
      </p>

      <div className="flex flex-col gap-3">
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#df2531] hover:bg-[#c41f2a] text-white rounded-lg font-medium transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          Continuar al pago seguro
        </a>
        
        <p className="text-sm text-gray-500">
          Si no se abrió automáticamente, haz clic en el botón de arriba
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-[#232838]">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <img 
            src="https://www.bancard.com.py/wp-content/uploads/2021/05/cropped-favicon-32x32.png" 
            alt="Bancard" 
            className="w-5 h-5"
          />
          Pago seguro procesado por Bancard
        </div>
      </div>
    </div>
  );
}
