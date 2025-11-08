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
  onFailure: (error: Error) => void
) => {
  const script = document.createElement('script');
  script.src = 'https://link.msgsndr.com/js/form_embed.js';
  script.type = 'text/javascript';
  script.async = true;
  
  script.onload = () => {
    try {
      if (window.GHL?.loadBookingWidget) {
        const [firstName = '', ...lastNameParts] = (contactData.name || '').split(' ');
        
        window.GHL.loadBookingWidget({
          elementId: 'ghl-calendar-container',
          calendarId,
          firstName,
          lastName: lastNameParts.join(' '),
          email: contactData.email || '',
          phone: contactData.whatsapp || ''
        });
        
        onSuccess();
      } else {
        throw new Error('GHL widget not available after script load');
      }
    } catch (error) {
      onFailure(error instanceof Error ? error : new Error('Failed to initialize GHL widget'));
    }
  };
  
  script.onerror = () => {
    onFailure(new Error('Failed to load GHL booking script'));
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
