import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { RESULT_MESSAGES } from "@/constants/resultMessages";

interface GHLCalendarIframeProps {
  calendarId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export const GHLCalendarIframe = ({ 
  calendarId, 
  firstName = '', 
  lastName = '', 
  email = '', 
  phone = '' 
}: GHLCalendarIframeProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Construir URL del calendario con parámetros pre-rellenados
  const buildCalendarUrl = () => {
    const baseUrl = `https://api.leadconnectorhq.com/widget/booking/${calendarId}`;
    const params = new URLSearchParams();
    
    if (firstName) params.append('firstName', firstName);
    if (lastName) params.append('lastName', lastName);
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);
    
    const queryString = params.toString();
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    console.log('🔵 [GHL IFRAME] URL del calendario:', url);
    return url;
  };

  const handleLoad = () => {
    console.log('✅ [GHL IFRAME] Calendario cargado correctamente');
    setIsLoading(false);
  };

  const handleError = () => {
    console.error('❌ [GHL IFRAME] Error al cargar calendario');
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <Card className="bg-destructive/10 border-destructive/30 p-4 text-center">
        <p className="text-sm text-destructive">
          Error al cargar el calendario. Por favor, recarga la página.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
        <p className="text-xs text-blue-200/90">
          {RESULT_MESSAGES.qualified.dataPreloaded}
        </p>
      </div>

      <Card className="bg-card/50 border-border p-2 md:p-4 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Cargando calendario...</p>
            </div>
          </div>
        )}
        
        <iframe
          src={buildCalendarUrl()}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '600px',
            border: 'none',
            borderRadius: '8px'
          }}
          title="Calendario de reservas"
          onLoad={handleLoad}
          onError={handleError}
          allow="payment"
        />
      </Card>
    </div>
  );
};
