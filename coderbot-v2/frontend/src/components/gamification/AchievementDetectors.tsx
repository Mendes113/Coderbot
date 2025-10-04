import { useEffect, useState, useRef } from 'react';
import { useKonamiCode } from '@/hooks/useKonamiCode';
import { useDevToolsDetector } from '@/hooks/useDevToolsDetector';
import { 
  useTextPatternDetector, 
  useVimCommandDetector,
  useNavigationPatternDetector 
} from '@/hooks/usePatternDetectors';
import { useGamification } from '@/hooks/useGamification';
import { toast } from 'sonner';
import { MatrixRain } from '@/components/effects/MatrixRain';
import { achievementConfigService, AchievementConfig } from '@/services/gamification/AchievementConfigService';
import { sendAchievementNotification } from '@/services/notifications/achievementNotifications';
import { useAuthState } from '@/hooks/useAuthState';

/**
 * Componente responsável por detectar e rastrear achievements globais
 * Deve ser montado uma única vez no nível da aplicação (App.tsx)
 * 
 * ⚠️ BUG CORRIGIDO:
 * - Antes: getCurrentUser() retornava snapshot não-reativo (logout não desabilitava hooks)
 * - Agora: useAuthState() reage a mudanças no pb.authStore.onChange()
 * - Prevenção de duplicatas: debounce de 2s entre notificações do mesmo achievement
 */
export const AchievementDetectors = () => {
  const { trackAction } = useGamification();
  const [showMatrix, setShowMatrix] = useState(false);
  const [achievements, setAchievements] = useState<AchievementConfig[]>([]);
  
  // 🔥 FIX: Usar hook reativo ao invés de snapshot
  const { currentUser, isAuthenticated } = useAuthState();
  
  // 🔥 FIX: Debounce para prevenir notificações duplicadas
  const notificationTimestamps = useRef<Record<string, number>>({});

  // 🐛 DEBUG: Log de montagem/desmontagem do componente
  useEffect(() => {
    const instanceId = Math.random().toString(36).substr(2, 9);
    console.log(`🔧 [AchievementDetectors-${instanceId}] MOUNTED`);
    
    return () => {
      console.log(`🔧 [AchievementDetectors-${instanceId}] UNMOUNTED`);
    };
  }, []);

  console.log('🎮 [AchievementDetectors] Rendering with auth:', { 
    userId: currentUser?.id || 'none',
    isAuthenticated 
  });

  // Carregar achievements dinamicamente (apenas uma vez por auth change)
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const configs = await achievementConfigService.loadAchievements();
        setAchievements(configs);
        console.log('🎮 [AchievementDetectors] Loaded', configs.length, 'achievements');
      } catch (error) {
        console.error('[AchievementDetectors] Failed to load achievements:', error);
      }
    };

    // Só carregar achievements se usuário estiver autenticado
    if (currentUser) {
      loadAchievements();
    } else {
      // Limpar achievements quando logout
      setAchievements([]);
      console.log('🎮 [AchievementDetectors] Cleared achievements - user logged out');
    }
  }, [currentUser?.id]); // Apenas quando o ID do usuário mudar

  // Log dos achievements carregados (debug) - remover depois
  useEffect(() => {
    if (achievements.length > 0) {
      console.log('📋 [AchievementDetectors] Available achievements:', 
        achievements.map(a => a.name).join(', ')
      );
    }
  }, [achievements]);

  // Helper para rastrear achievement com notificação + debounce anti-duplicata
  const trackAchievementWithNotification = async (
    achievementName: string,
    actionData: Record<string, any>
  ) => {
    // 🔥 FIX: Debounce de 2 segundos para prevenir duplicatas
    const now = Date.now();
    const lastNotification = notificationTimestamps.current[achievementName];
    
    if (lastNotification && now - lastNotification < 2000) {
      console.log('⏱️ [trackAchievementWithNotification] DEBOUNCED - too soon since last notification:', {
        achievementName,
        timeSinceLastMs: now - lastNotification
      });
      return { completed: false, achievement: null };
    }
    
    console.log('🎯 [trackAchievementWithNotification] Called for:', achievementName, actionData);
    
    const result = await trackAction(achievementName, actionData);
    
    console.log('🎯 [trackAchievementWithNotification] trackAction result:', {
      completed: result.completed,
      isNew: result.achievement?.is_new,
      hasUser: !!currentUser
    });
    
    // Se foi desbloqueado pela primeira vez, enviar notificação
    if (result.completed && result.achievement?.is_new && currentUser) {
      console.log('📧 [trackAchievementWithNotification] Achievement is NEW - sending notification...');
      
      const achievement = achievementConfigService.getAchievementByName(achievementName);
      
      console.log('🔍 [trackAchievementWithNotification] Achievement config:', achievement);
      
      if (achievement) {
        await sendAchievementNotification({
          userId: currentUser.id,
          achievementName: achievement.name,
          achievementIcon: achievement.icon,
          achievementDescription: achievement.description,
          points: achievement.points
        });
        
        // Registrar timestamp da notificação para debounce
        notificationTimestamps.current[achievementName] = now;
        
        console.log('✅ [trackAchievementWithNotification] Notification sent successfully');
      } else {
        console.warn('⚠️ [trackAchievementWithNotification] Achievement config not found for:', achievementName);
      }
    } else {
      console.log('ℹ️ [trackAchievementWithNotification] No notification sent because:', {
        wasCompleted: result.completed,
        wasNew: result.achievement?.is_new,
        hasUser: !!currentUser
      });
    }
    
    return result;
  };

  // 🔒 Só ativar hooks se usuário estiver autenticado
  const hooksEnabled = isAuthenticated && !!currentUser;
  
  console.log('🎮 [AchievementDetectors] Hooks enabled:', hooksEnabled, {
    isAuthenticated,
    hasCurrentUser: !!currentUser
  });

  // 🎮 Easter Egg: Konami Code
  useKonamiCode(
    async () => {
      await trackAchievementWithNotification('konami_code', {
        timestamp: new Date().toISOString(),
        message: '↑↑↓↓←→←→BA - Código secreto ativado!'
      });
      
      // Mostrar animação Matrix ao invés de confetti
      setShowMatrix(true);
      
      toast.success('🎮 Konami Code Ativado!', {
        description: 'Você descobriu o código secreto dos gamers raiz!'
      });
    },
    hooksEnabled // Ativo apenas se usuário autenticado
  );

  // 🛠️ Easter Egg: Dev Tools Detective
  useDevToolsDetector(
    async () => {
      await trackAchievementWithNotification('curious_mind', {
        timestamp: new Date().toISOString(),
        message: 'Abrindo as DevTools... Curioso, ein? 🕵️'
      });
      
      toast.info('🛠️ Detetive das DevTools!', {
        description: 'Você descobriu os segredos do código! Curioso...'
      });
    },
    hooksEnabled // Ativo apenas se usuário autenticado
  );

  // ⌨️ Easter Egg: Vim Master (detectar comandos Vim)
  useVimCommandDetector(
    async () => {
      await trackAchievementWithNotification('vim_master', {
        timestamp: new Date().toISOString(),
        message: 'Comandos Vim detectados! :wq para sair 😎'
      });
      
      toast.success('⌨️ Vim Master!', {
        description: 'Você é um verdadeiro ninja do teclado! :wq'
      });
    },
    hooksEnabled // Ativo apenas se usuário autenticado
  );

  // 🗺️ Easter Egg: Treasure Hunter (explorar todas as páginas)
  useNavigationPatternDetector(
    ['/dashboard/chat', '/dashboard/student', '/dashboard/whiteboard', '/dashboard/notes', '/profile'],
    async (visitedPaths) => {
      await trackAchievementWithNotification('treasure_hunter', {
        timestamp: new Date().toISOString(),
        visitedPaths,
        message: `Explorou ${visitedPaths.length} áreas da plataforma!`
      });
      
      toast.success('🗺️ Caçador de Tesouros!', {
        description: `Você explorou todas as ${visitedPaths.length} áreas da plataforma!`
      });
    },
    hooksEnabled, // Ativo apenas se usuário autenticado
    120000 // 2 minutos para visitar todas as páginas
  );

  // 🌅 Easter Egg: Early Bird (acesso entre 5h-7h)
  useTextPatternDetector(
    ['early_bird_check'],
    async () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 7) {
        await trackAchievementWithNotification('early_bird', {
          timestamp: new Date().toISOString(),
          hour,
          message: 'Acordou cedo para estudar! 🌅'
        });
        
        toast.success('🌅 Madrugador!', {
          description: 'Estudando às 5h da manhã? Você é dedicado!'
        });
      }
    },
    hooksEnabled, // Ativo apenas se usuário autenticado
    5000
  );

  // 🦉 Easter Egg: Night Owl (acesso entre 23h-2h)
  useTextPatternDetector(
    ['night_owl_check'],
    async () => {
      const hour = new Date().getHours();
      if (hour >= 23 || hour < 2) {
        await trackAchievementWithNotification('night_owl', {
          timestamp: new Date().toISOString(),
          hour,
          message: 'Estudando de madrugada! 🦉'
        });
        
        toast.info('🦉 Coruja Noturna!', {
          description: 'Programando até tarde? Não esqueça de dormir!'
        });
      }
    },
    hooksEnabled, // Ativo apenas se usuário autenticado
    5000
  );  return (
    <>
      {showMatrix && (
        <MatrixRain
          duration={3000}
          onComplete={() => setShowMatrix(false)}
        />
      )}
    </>
  );
};
