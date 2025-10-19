/// <reference types="vite/client" />

interface Window {
  parentIFrame?: {
    size: () => void;
    getId: () => string;
    sendMessage: (message: any, targetOrigin?: string) => void;
  };
}
