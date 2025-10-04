import { useEffect, useState } from 'react';
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
import { getCurrentUser } from '@/integrations/pocketbase/client';

/**
 * Componente responsável por detectar e rastrear achievements globais
 * Deve ser montado uma única vez no nível da aplicação (App.tsx)
 */
export const AchievementDetectors = () => {
  const { trackAction } = useGamification();
  const [showMatrix, setShowMatrix] = useState(false);
  const [achievements, setAchievements] = useState<AchievementConfig[]>([]);
  const currentUser = getCurrentUser();

  // Carregar achievements dinamicamente
  useEffect(() => {
    const loadAchievements = async () => {
      const configs = await achievementConfigService.loadAchievements();
      setAchievements(configs);
      console.log('[AchievementDetectors] Loaded achievements:', configs.length);
    };

    loadAchievements();
  }, []);

  // Helper para rastrear achievement com notificação
  const trackAchievementWithNotification = async (
    achievementName: string,
    actionData: Record<string, any>
  ) => {
    const result = await trackAction(achievementName, actionData);
    
    // Se foi desbloqueado pela primeira vez, enviar notificação
    if (result.completed && result.achievement?.is_new && currentUser) {
      const achievement = achievementConfigService.getAchievementByName(achievementName);
      if (achievement) {
        await sendAchievementNotification({
          userId: currentUser.id,
          achievementName: achievement.name,
          achievementIcon: achievement.icon,
          achievementDescription: achievement.description,
          points: achievement.points
        });
      }
    }
    
    return result;
  };

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
    achievements.length > 0 // Só ativar após carregar achievements
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
    achievements.length > 0
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
    achievements.length > 0
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
    achievements.length > 0,
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
    achievements.length > 0,
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
    achievements.length > 0,
    5000
  );

  return (
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
