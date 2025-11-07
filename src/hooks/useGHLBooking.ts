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
    isLoading: false,
    isLoaded: false,
    error: null
  });

  useEffect(() => {
    if (!enabled) {
      console.log('🔮 GHL Booking disabled, skipping load');
      return;
    }

    console.log('🔮 Initializing GHL booking widget...', {
      calendarId,
      contactData: {
        name: contactData.name,
        email: contactData.email,
        phone: contactData.whatsapp
      }
    });

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Crear y cargar script de GHL
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => {
      try {
        // Esperar a que GHL esté disponible y cargar el widget
        if (window.GHL && window.GHL.loadBookingWidget) {
          console.log('✅ GHL script loaded, initializing widget with pre-filled data');

          const [firstName = '', ...lastNameParts] = (contactData.name || '').split(' ');
          const lastName = lastNameParts.join(' ');

          window.GHL.loadBookingWidget({
            elementId: 'ghl-calendar-container',
            calendarId: calendarId,
            // Pre-rellenar datos del quiz
            firstName: firstName,
            lastName: lastName,
            email: contactData.email || '',
            phone: contactData.whatsapp || '',
          });

          setState({ isLoading: false, isLoaded: true, error: null });
          onLoad?.();
        } else {
          throw new Error('GHL widget not available after script load');
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error loading GHL widget');
        console.error('❌ Error loading GHL booking widget:', err);
        setState({ isLoading: false, isLoaded: false, error: err });
        onError?.(err);
      }
    };

    script.onerror = () => {
      const err = new Error('Failed to load GHL booking script');
      console.error('❌ Failed to load GHL script:', err);
      setState({ isLoading: false, isLoaded: false, error: err });
      onError?.(err);
    };

    document.body.appendChild(script);

    // Cleanup
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
        console.log('🧹 GHL booking script cleaned up');
      }
    };
  }, [enabled, calendarId, contactData.name, contactData.email, contactData.whatsapp]);

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
