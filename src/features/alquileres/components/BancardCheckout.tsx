import { useEffect, useRef, useState } from 'react';

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

// Estilos por defecto para el formulario de Bancard
const defaultStyles = {
  'form-background-color': '#151921',
  'button-background-color': '#df2531',
  'button-text-color': '#ffffff',
  'button-border-color': '#df2531',
  'input-background-color': '#0B0E14',
  'input-text-color': '#ffffff',
  'input-placeholder-color': '#6b7280',
  'color-texto-etiquetas': '#ffffff',
  'color-placeholder': '#6b7280',
  'color-mensajes-error': '#ef4444',
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
    // Si el script ya está cargado
    if (window.Bancard) {
      setScriptLoaded(true);
      return;
    }

    // Verificar si ya existe el script en el DOM
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existingScript) {
      // Esperar a que cargue
      const checkBancard = setInterval(() => {
        if (window.Bancard) {
          setScriptLoaded(true);
          clearInterval(checkBancard);
        }
      }, 100);
      return () => clearInterval(checkBancard);
    }

    // Crear y cargar el script
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    
    script.onload = () => {
      setScriptLoaded(true);
    };
    
    script.onerror = () => {
      setScriptError('Error al cargar el formulario de pago. Por favor, recarga la página.');
    };

    document.body.appendChild(script);

    return () => {
      // No removemos el script ya que puede ser reutilizado
    };
  }, [scriptUrl]);

  // Crear el formulario cuando el script esté cargado y tengamos processId
  useEffect(() => {
    if (!scriptLoaded || !processId || !containerRef.current) return;

    try {
      if (window.Bancard?.Checkout) {
        window.Bancard.Checkout.createForm(
          containerRef.current.id,
          processId,
          defaultStyles
        );
      } else {
        setScriptError('Error inicializando el formulario de pago.');
      }
    } catch (error) {
      setScriptError('Error al crear el formulario de pago.');
      console.error('Error creating Bancard form:', error);
    }
  }, [scriptLoaded, processId]);

  // Escuchar mensajes del iframe de Bancard
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar origen del mensaje (solo de Bancard)
      const bancardOrigins = ['https://vpos.infonet.com.py', 'https://vpos.infonet.com.py:8888'];
      if (!bancardOrigins.includes(event.origin)) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Manejar diferentes estados del pago
        if (data.status === 'success' || data.message === 'Operación exitosa') {
          onPaymentSuccess?.();
        } else if (data.status === 'error' || data.status === 'failure') {
          onPaymentError?.(data.message || 'Error en el pago');
        } else if (data.status === 'cancel') {
          onPaymentCancel?.();
        }
      } catch (e) {
        // Ignorar mensajes que no son JSON válido
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPaymentSuccess, onPaymentError, onPaymentCancel]);

  if (scriptError) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#df2531]"></div>
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
