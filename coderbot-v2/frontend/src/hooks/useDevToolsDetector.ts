import { useEffect, useState } from 'react';

/**
 * Hook para detectar quando as DevTools estão abertas
 * @param onDetect Callback executado quando DevTools são detectadas (primeira vez)
 * @param enabled Se a detecção está ativa (padrão: true)
 */
export const useDevToolsDetector = (
  onDetect: () => void,
  enabled: boolean = true
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDetected, setHasDetected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let devtoolsOpen = false;

    // Método 1: Detectar diferença de tamanho de janela
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      const orientation = widthThreshold ? 'vertical' : 'horizontal';
      
      if (
        !(heightThreshold && widthThreshold) &&
        ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) ||
          widthThreshold ||
          heightThreshold)
      ) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          setIsOpen(true);
          if (!hasDetected) {
            setHasDetected(true);
            onDetect();
          }
        }
      } else {
        if (devtoolsOpen) {
          devtoolsOpen = false;
          setIsOpen(false);
        }
      }
    };

    // Método 2: Detectar via console.log timing
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          setIsOpen(true);
          if (!hasDetected) {
            setHasDetected(true);
            onDetect();
          }
        }
        return '';
      }
    });

    // Verificar periodicamente
    const interval = setInterval(() => {
      detectDevTools();
      console.log('%c', element); // Trigger o getter
    }, 1000);

    // Verificação inicial
    detectDevTools();

    return () => {
      clearInterval(interval);
    };
  }, [enabled, onDetect, hasDetected]);

  return { isOpen, hasDetected };
};

// Estender a interface Window para Firebug
declare global {
  interface Window {
    Firebug?: {
      chrome?: {
        isInitialized?: boolean;
      };
    };
  }
}
