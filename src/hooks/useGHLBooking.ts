import { useEffect, useState } from 'react';

interface GHLBookingConfig {
  calendarId: string;
  contactData: {
    name?: string;
    email?: string;
    whatsapp?: string;
  };
  enabled?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface GHLBookingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
}

const loadGHLScript = (
  calendarId: string, 
  contactData: { name?: string; email?: string; whatsapp?: string },
  onSuccess: () => void,
  onFailure: (error: Error) => void,
  retryCount = 0
) => {
  const MAX_RETRIES = 2;
  const SCRIPT_TIMEOUT = 15000; // 15 seconds
  const GHL_CHECK_TIMEOUT = 5000; // 5 seconds for window.GHL
  
  console.log(`🔵 [GHL] Intento ${retryCount + 1}/${MAX_RETRIES + 1} de cargar calendario...`);
  
  const script = document.createElement('script');
  script.src = 'https://link.msgsndr.com/js/form_embed.js';
  script.type = 'text/javascript';
  script.async = true;
  
  let scriptTimeoutId: ReturnType<typeof setTimeout>;
  let ghlCheckTimeoutId: ReturnType<typeof setTimeout>;
  
  // Timeout general para el script
  scriptTimeoutId = setTimeout(() => {
    console.error('⏱️ [GHL] Timeout cargando script');
    script.remove();
    
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 [GHL] Reintentando (${retryCount + 1}/${MAX_RETRIES})...`);
      setTimeout(() => {
        loadGHLScript(calendarId, contactData, onSuccess, onFailure, retryCount + 1);
      }, 1000);
    } else {
      onFailure(new Error('Timeout loading GHL script after retries'));
    }
  }, SCRIPT_TIMEOUT);
  
  script.onload = () => {
    clearTimeout(scriptTimeoutId);
    console.log('✅ [GHL] Script cargado');
    
    // Esperar a que window.GHL esté disponible
    const checkGHL = (attempts = 0) => {
      const maxAttempts = 50; // 50 intentos x 100ms = 5 segundos
      
      if (window.GHL?.loadBookingWidget) {
        clearTimeout(ghlCheckTimeoutId);
        console.log('✅ [GHL] window.GHL disponible');
        
        try {
          // Parsear nombre
          const [firstName = '', ...lastNameParts] = (contactData.name || '').split(' ');
          const lastName = lastNameParts.join(' ');
          
          const config = {
            elementId: 'ghl-calendar-container',
            calendarId,
            firstName,
            lastName,
            email: contactData.email || '',
            phone: contactData.whatsapp || ''
          };
          
          console.log('🔵 [GHL] Inicializando widget con:', {
            ...config,
            phone: config.phone ? '***' + config.phone.slice(-4) : '' // Ocultar teléfono en logs
          });
          
          window.GHL.loadBookingWidget(config);
          
          console.log('✅ [GHL] Widget inicializado correctamente');
          onSuccess();
          
        } catch (error) {
          console.error('❌ [GHL] Error inicializando widget:', error);
          clearTimeout(ghlCheckTimeoutId);
          onFailure(error instanceof Error ? error : new Error('Failed to initialize GHL widget'));
        }
        
      } else if (attempts < maxAttempts) {
        // Reintentar en 100ms
        setTimeout(() => checkGHL(attempts + 1), 100);
        
      } else {
        // Ya pasaron 5 segundos y window.GHL no está disponible
        console.error('❌ [GHL] window.GHL no disponible después de 5 segundos');
        clearTimeout(ghlCheckTimeoutId);
        
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 [GHL] Reintentando desde cero (${retryCount + 1}/${MAX_RETRIES})...`);
          script.remove();
          setTimeout(() => {
            loadGHLScript(calendarId, contactData, onSuccess, onFailure, retryCount + 1);
          }, 1000);
        } else {
          onFailure(new Error('window.GHL not available after retries'));
        }
      }
    };
    
    // Timeout para la verificación de window.GHL
    ghlCheckTimeoutId = setTimeout(() => {
      console.error('⏱️ [GHL] Timeout esperando window.GHL');
      if (retryCount < MAX_RETRIES) {
        script.remove();
        setTimeout(() => {
          loadGHLScript(calendarId, contactData, onSuccess, onFailure, retryCount + 1);
        }, 1000);
      } else {
        onFailure(new Error('Timeout waiting for window.GHL'));
      }
    }, GHL_CHECK_TIMEOUT);
    
    checkGHL();
  };
  
  script.onerror = () => {
    clearTimeout(scriptTimeoutId);
    console.error('❌ [GHL] Error cargando script');
    
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 [GHL] Reintentando (${retryCount + 1}/${MAX_RETRIES})...`);
      setTimeout(() => {
        loadGHLScript(calendarId, contactData, onSuccess, onFailure, retryCount + 1);
      }, 1000);
    } else {
      onFailure(new Error('Failed to load GHL script after retries'));
    }
  };
  
  document.body.appendChild(script);
  return script;
};

/**
 * Hook para encapsular toda la lógica de carga del widget de GHL.
 * Maneja la carga del script, inicialización del widget, y pre-llenado de datos.
 */
export const useGHLBooking = ({
  calendarId,
  contactData,
  enabled = true,
  onLoad,
  onError
}: GHLBookingConfig): GHLBookingState => {
  const [state, setState] = useState<GHLBookingState>({
    isLoading: true,
    isLoaded: false,
    error: null
  });

  useEffect(() => {
    if (!enabled) {
      setState({ isLoading: false, isLoaded: false, error: null });
      return;
    }

    let scriptElement: HTMLScriptElement | null = null;

    const handleSuccess = () => {
      setState({ isLoading: false, isLoaded: true, error: null });
      onLoad?.();
    };

    const handleFailure = (error: Error) => {
      console.error('GHL Booking Error:', error);
      setState({ isLoading: false, isLoaded: false, error });
      onError?.(error);
    };

    scriptElement = loadGHLScript(calendarId, contactData, handleSuccess, handleFailure);

    return () => {
      if (scriptElement && document.body.contains(scriptElement)) {
        document.body.removeChild(scriptElement);
      }
    };
  }, [calendarId, contactData.name, contactData.email, contactData.whatsapp, enabled, onLoad, onError]);

  return state;
};

// Declaración de tipos para window.GHL
declare global {
  interface Window {
    GHL?: {
      loadBookingWidget: (config: {
        elementId: string;
        calendarId: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
      }) => void;
    };
  }
}
