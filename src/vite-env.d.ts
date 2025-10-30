/// <reference types="vite/client" />

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
