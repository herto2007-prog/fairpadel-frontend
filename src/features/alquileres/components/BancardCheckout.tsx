import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// Tipos para el objeto global Bancard
declare global {
  interface Window {
    Bancard?: {
      Checkout: {
        createForm: (containerId: string, processId: string, styles?: Record<string, string>) => void;
      };
    };
  }
}

interface BancardCheckoutProps {
  processId: string;
  scriptUrl: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
  onPaymentCancel?: () => void;
}

// Estilos personalizados para que combine con FairPadel
const fairpadelStyles = {
  'form-background-color': '#151921',
  'button-background-color': '#df2531',
  'button-text-color': '#ffffff',
  'button-border-color': '#df2531',
  'input-background-color': '#0B0E14',
  'input-text-color': '#ffffff',
  'input-placeholder-color': '#6b7280',
};

export default function BancardCheckout({
  processId,
  scriptUrl,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}: BancardCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  // Cargar script de Bancard
  useEffect(() => {
    if (window.Bancard) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existingScript) {
      const checkBancard = setInterval(() => {
        if (window.Bancard) {
          setScriptLoaded(true);
          clearInterval(checkBancard);
        }
      }, 100);
      return () => clearInterval(checkBancard);
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptError('Error al cargar el formulario de pago. Intenta recargar la página.');

    document.body.appendChild(script);
  }, [scriptUrl]);

  // Crear el formulario cuando el script esté cargado
  useEffect(() => {
    if (!scriptLoaded || !processId || !containerRef.current) return;

    try {
      if (window.Bancard?.Checkout) {
        window.Bancard.Checkout.createForm(
          containerRef.current.id,
          processId,
          fairpadelStyles
        );
      }
    } catch (error) {
      setScriptError('Error al crear el formulario de pago.');
    }
  }, [scriptLoaded, processId]);

  // Escuchar mensajes del iframe de Bancard
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const bancardOrigins = ['https://vpos.infonet.com.py', 'https://vpos.infonet.com.py:8888'];
      if (!bancardOrigins.includes(event.origin)) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.status === 'success' || data.message === 'Operación exitosa') {
          onPaymentSuccess?.();
        } else if (data.status === 'error' || data.status === 'failure') {
          onPaymentError?.(data.message || 'Error en el pago');
        } else if (data.status === 'cancel') {
          onPaymentCancel?.();
        }
      } catch (e) {
        // Ignorar mensajes inválidos
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPaymentSuccess, onPaymentError, onPaymentCancel]);

  if (scriptError) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400">{scriptError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Recargar página
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!scriptLoaded && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
          <span className="ml-3 text-gray-400">Cargando formulario de pago...</span>
        </div>
      )}
      
      <div
        id="bancard-checkout-container"
        ref={containerRef}
        className={`${scriptLoaded ? 'block' : 'hidden'} min-h-[400px]`}
      />
      
      <p className="mt-4 text-xs text-gray-500 text-center">
        Pago procesado de forma segura por Bancard
      </p>
    </div>
  );
}
