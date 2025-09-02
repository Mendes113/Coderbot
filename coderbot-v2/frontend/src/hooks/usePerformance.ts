import { useEffect, useState, useCallback } from 'react';

export interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  fid: number | null;
  ttfb: number | null;
}

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    ttfb: null,
  });

  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Detectar conexão lenta
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const isSlow = connection?.effectiveType === 'slow-2g' ||
                     connection?.effectiveType === '2g' ||
                     connection?.downlink < 1.5;

      setIsSlowConnection(isSlow);

      const handleConnectionChange = () => {
        const newIsSlow = connection?.effectiveType === 'slow-2g' ||
                         connection?.effectiveType === '2g' ||
                         connection?.downlink < 1.5;
        setIsSlowConnection(newIsSlow);
      };

      connection?.addEventListener('change', handleConnectionChange);
      return () => connection?.removeEventListener('change', handleConnectionChange);
    }
  }, []);

  const measurePerformance = useCallback(() => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || null;
      const lcp = paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime || null;

      setMetrics(prev => ({
        ...prev,
        fcp,
        lcp,
        ttfb: navigation?.responseStart || null,
      }));
    }
  }, []);

  useEffect(() => {
    measurePerformance();

    // Monitorar LCP
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        setMetrics(prev => ({
          ...prev,
          lcp: lastEntry.startTime,
        }));
      });

      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setMetrics(prev => ({
          ...prev,
          cls: clsValue,
        }));
      });

      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          setMetrics(prev => ({
            ...prev,
            fid: (entry as any).processingStart - entry.startTime,
          }));
        }
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('Performance observer not supported');
      }

      return () => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
      };
    }
  }, [measurePerformance]);

  return {
    metrics,
    isSlowConnection,
    measurePerformance,
  };
};
