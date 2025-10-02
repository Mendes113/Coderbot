import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPWA: boolean;
  isStandalone: boolean;
  platform: string;
  orientation: 'portrait' | 'landscape';
}

export function useMobileDetection(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isPWA: false,
    isStandalone: false,
    platform: 'unknown',
    orientation: 'portrait'
  });

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Detect platform
      let platform = 'unknown';
      if (/android/.test(userAgent)) platform = 'android';
      else if (/iphone|ipad|ipod/.test(userAgent)) platform = 'ios';
      else if (/windows/.test(userAgent)) platform = 'windows';
      else if (/mac/.test(userAgent)) platform = 'macos';
      else if (/linux/.test(userAgent)) platform = 'linux';

      // Detect device type
      const isMobile = width <= 768 || /android|iphone|ipod|blackberry|windows phone/.test(userAgent);
      const isTablet = (width > 768 && width <= 1024) || (/ipad/.test(userAgent));
      const isDesktop = !isMobile && !isTablet;

      // Detect PWA mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;
      const isPWA = isStandalone || window.matchMedia('(display-mode: standalone)').matches;

      // Detect orientation
      const orientation = width > height ? 'landscape' : 'portrait';

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isPWA,
        isStandalone,
        platform,
        orientation
      });
    };

    // Check initially
    checkDevice();

    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    // Listen for PWA mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
      mediaQuery.removeEventListener('change', checkDevice);
    };
  }, []);

  return detection;
}
