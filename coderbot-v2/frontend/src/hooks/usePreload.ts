import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface PreloadConfig {
  routes: string[];
  components: (() => Promise<any>)[];
  delay?: number;
}

export const usePreload = (config: PreloadConfig) => {
  const location = useLocation();

  const preloadComponent = useCallback(async (component: () => Promise<any>) => {
    try {
      // Preload em background sem bloquear
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      document.head.appendChild(link);

      // Carregar componente
      await component();

      // Cleanup
      document.head.removeChild(link);
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }, []);

  const preloadNearbyRoutes = useCallback(() => {
    const currentPath = location.pathname;
    const nearbyRoutes = config.routes.filter(route => {
      // Preload rotas relacionadas (mesmo nível de navegação)
      const currentSegments = currentPath.split('/').filter(Boolean);
      const routeSegments = route.split('/').filter(Boolean);

      // Se estiver na dashboard, preload outras rotas da dashboard
      if (currentPath.includes('/dashboard/')) {
        return route.includes('/dashboard/') && route !== currentPath;
      }

      // Preload rota pai/filho
      return currentSegments.length === routeSegments.length ||
             Math.abs(currentSegments.length - routeSegments.length) === 1;
    });

    // Preload com delay para não impactar performance inicial
    setTimeout(() => {
      nearbyRoutes.forEach((route, index) => {
        const component = config.components[index];
        if (component) {
          setTimeout(() => preloadComponent(component), index * 1000);
        }
      });
    }, config.delay || 2000);
  }, [location.pathname, config, preloadComponent]);

  useEffect(() => {
    preloadNearbyRoutes();
  }, [preloadNearbyRoutes]);

  return { preloadComponent, preloadNearbyRoutes };
};
