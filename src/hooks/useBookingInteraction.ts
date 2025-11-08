import { useState, useEffect } from 'react';

export const useBookingInteraction = () => {
  const [bookingStarted, setBookingStarted] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'booking_interaction') {
        setBookingStarted(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { bookingStarted };
};
