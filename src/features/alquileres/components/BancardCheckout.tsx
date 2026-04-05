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
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Cargar script de Bancard
  useEffect(() => {
    // Si ya hay un script cargado y Bancard está disponible, usarlo
    if (window.Bancard?.Checkout) {
      setScriptLoaded(true);
      return;
    }

    const loadScript = () => {
      // Limpiar script anterior si existe
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      // NOTA: No usar crossOrigin para evitar problemas CORS con Bancard
      scriptRef.current = script;
      
      script.onload = () => {
        // Esperar a que Bancard esté disponible
        const checkBancard = setInterval(() => {
          if (window.Bancard?.Checkout) {
            clearInterval(checkBancard);
            setScriptLoaded(true);
            retryCount.current = 0;
          }
        }, 100);

        // Timeout de 3 segundos para verificar si Bancard cargó
        setTimeout(() => {
          clearInterval(checkBancard);
          if (!window.Bancard?.Checkout && retryCount.current < maxRetries) {
            retryCount.current++;
            console.log(`Reintentando cargar Bancard... (${retryCount.current}/${maxRetries})`);
            loadScript();
          } else if (!window.Bancard?.Checkout) {
            setScriptError('No se pudo cargar el formulario de pago después de varios intentos.');
          }
        }, 3000);
      };
      
      script.onerror = () => {
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          console.log(`Error cargando script, reintentando... (${retryCount.current}/${maxRetries})`);
          setTimeout(loadScript, 1000);
        } else {
          setScriptError('Error al cargar el formulario de pago. Verifica tu conexión.');
        }
      };

      document.head.appendChild(script);
    };

    loadScript();
    
    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
      }
    };
  }, [scriptUrl]);

  // Crear el formulario cuando el script esté cargado
  useEffect(() => {
    if (!scriptLoaded || !processId || !containerRef.current) return;

    // Limpiar el contenedor antes de crear el formulario
    containerRef.current.innerHTML = '';

    // Pequeño delay para asegurar que el DOM está listo
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
    }, 200);

    return () => clearTimeout(timer);
  }, [scriptLoaded, processId]);

  // Escuchar mensajes del iframe de Bancard
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Log de todos los mensajes para debug
      console.log('Mensaje recibido - Origen:', event.origin, 'Datos:', event.data);
      
      // Si no es de Bancard ni de nuestro dominio, ignorar
      const isBancardOrigin = event.origin.includes('infonet.com.py');
      if (!isBancardOrigin && event.origin !== window.location.origin) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        console.log('Procesando mensaje de Bancard:', data);
        
        // Ignorar mensajes de ajuste de altura
        if (data.iframeHeight) {
          return;
        }
        
        // Mensajes de éxito
        if (data.status === 'success' || 
            data.message === 'Operación exitosa' || 
            data.response === 'S' ||
            data.operation?.response === 'S') {
          console.log('Pago exitoso detectado');
          onPaymentSuccess?.();
        } 
        // Mensajes de error
        else if (data.status === 'error' || 
                 data.status === 'failure' || 
                 data.response === 'N' ||
                 data.operation?.response === 'N') {
          const errorMsg = data.message || 
                          data.response_description || 
                          data.operation?.response_description || 
                          'Error en el pago';
          console.log('Error de pago:', errorMsg);
          onPaymentError?.(errorMsg);
        } 
        // Mensaje de cancelación
        else if (data.status === 'cancel') {
          console.log('Pago cancelado');
          onPaymentCancel?.();
        }
        // Si hay operation con response, verificar
        else if (data.operation) {
          if (data.operation.response === 'S') {
            console.log('Pago exitoso (desde operation)');
            onPaymentSuccess?.();
          } else if (data.operation.response === 'N') {
            const errorMsg = data.operation.response_description || 'Error en el pago';
            console.log('Error de pago (desde operation):', errorMsg);
            onPaymentError?.(errorMsg);
          }
        }
      } catch (e) {
        console.error('Error procesando mensaje:', e);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPaymentSuccess, onPaymentError, onPaymentCancel]);

  // Timeout de seguridad
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!scriptLoaded && !scriptError) {
        setScriptError('El formulario de pago está tardando demasiado en cargar.');
      }
    }, 20000);

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
          💡 Tip: Si el problema persiste, intenta en una pestaña de incógnito o desactiva extensiones del navegador.
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
        className={`${scriptLoaded ? 'block' : 'hidden'}`}
        style={{ 
          minHeight: '580px',
          overflow: 'visible'
        }}
      />
      
      {scriptLoaded && (
        <p className="mt-4 text-xs text-gray-500 text-center">
          Pago procesado de forma segura por Bancard
        </p>
      )}
    </div>
  );
}
