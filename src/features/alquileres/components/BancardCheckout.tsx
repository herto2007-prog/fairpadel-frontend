import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// Tipos para el objeto global Bancard
declare global {
  interface Window {
    Bancard?: {
      Checkout: {
        createForm: (containerId: string, processId: string, styles?: Record<string, string>) => void;
        destroyForm?: () => void;
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
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Cargar script de Bancard con manejo mejorado de conflictos
  useEffect(() => {
    // Limpiar cualquier script anterior de Bancard para evitar conflictos
    const existingScripts = document.querySelectorAll('script[src*="bancard-checkout"]');
    existingScripts.forEach(s => s.remove());
    
    // Limpiar el objeto global Bancard si existe
    if (window.Bancard) {
      try {
        // @ts-ignore
        delete window.Bancard;
      } catch (e) {
        // Ignorar si no se puede eliminar
      }
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.crossOrigin = 'anonymous';
    scriptRef.current = script;
    
    script.onload = () => {
      // Esperar un momento para asegurar que Bancard está listo
      setTimeout(() => {
        if (window.Bancard?.Checkout) {
          setScriptLoaded(true);
        } else {
          setScriptError('No se pudo inicializar el formulario de pago. Intenta recargar la página.');
        }
      }, 500);
    };
    
    script.onerror = () => {
      setScriptError('Error al cargar el formulario de pago. Verifica tu conexión e intenta nuevamente.');
    };

    document.body.appendChild(script);
    
    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [scriptUrl]);

  // Crear el formulario cuando el script esté cargado
  useEffect(() => {
    if (!scriptLoaded || !processId || !containerRef.current) return;

    // Limpiar el contenedor antes de crear el formulario
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Esperar a que el DOM esté listo
    const timer = setTimeout(() => {
      try {
        if (window.Bancard?.Checkout && containerRef.current) {
          window.Bancard.Checkout.createForm(
            containerRef.current.id,
            processId,
            fairpadelStyles
          );
        }
      } catch (error) {
        console.error('Error creando formulario Bancard:', error);
        setScriptError('Error al crear el formulario de pago. Intenta recargar la página.');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [scriptLoaded, processId]);

  // Escuchar mensajes del iframe de Bancard
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Aceptar mensajes de los orígenes de Bancard
      const bancardOrigins = [
        'https://vpos.infonet.com.py',
        'https://vpos.infonet.com.py:8888',
        'https://payments.infonet.com.py',
        'https://payments.infonet.com.py:8888',
      ];
      
      // También aceptar mensajes de localhost para testing
      if (!bancardOrigins.includes(event.origin) && !event.origin.includes('localhost')) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        console.log('Mensaje de Bancard recibido:', data);
        
        if (data.status === 'success' || data.message === 'Operación exitosa' || data.response === 'S') {
          onPaymentSuccess?.();
        } else if (data.status === 'error' || data.status === 'failure' || data.response === 'N') {
          onPaymentError?.(data.message || data.response_description || 'Error en el pago');
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

  // Timeout de seguridad - si el script no carga en 15 segundos, mostrar error
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!scriptLoaded && !scriptError) {
        setScriptError('El formulario de pago está tardando demasiado en cargar. Verifica tu conexión o intenta en una pestaña de incógnito.');
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [scriptLoaded, scriptError]);

  if (scriptError) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 mb-4">{scriptError}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Recargar página
          </button>
          <button
            onClick={() => onPaymentCancel?.()}
            className="px-4 py-2 border border-red-500/50 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
          >
            Cancelar y volver
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          💡 Tip: Si el problema persiste, intenta en una pestaña de incógnito o desactiva extensiones del navegador temporalmente.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!scriptLoaded && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#df2531] mb-4" />
          <span className="text-gray-400">Cargando formulario de pago seguro...</span>
          <p className="mt-2 text-sm text-gray-500">Esto puede tomar unos segundos</p>
        </div>
      )}
      
      <div
        id="bancard-checkout-container"
        ref={containerRef}
        className={`${scriptLoaded ? 'block' : 'hidden'} min-h-[400px]`}
      />
      
      {scriptLoaded && (
        <p className="mt-4 text-xs text-gray-500 text-center">
          Pago procesado de forma segura por Bancard
        </p>
      )}
    </div>
  );
}
