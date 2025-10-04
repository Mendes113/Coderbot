// src/hooks/useGamification.ts
import { useState, useEffect, useCallback } from 'react';
import { gamificationService } from '@/services/gamification/GamificationService';
import type { UserAchievement, UserAchievementStats, GetAchievementsOptions } from '@/services/gamification/types';
import { toast } from '@/components/ui/sonner';

/**
 * Hook customizado para facilitar o uso do serviço de gamificação em componentes React
 */
export function useGamification() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<UserAchievementStats>({
    total: 0,
    newCount: 0,
    totalPoints: 0,
    byCategory: {},
    byDifficulty: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  /**
   * Rastreia uma ação de easter egg e mostra toast se completado PELA PRIMEIRA VEZ
   */
  const trackAction = useCallback(async (
    easterEggName: string,
    actionData?: Record<string, any>,
    options?: { showToast?: boolean }
  ) => {
    const result = await gamificationService.trackEasterEggAction(easterEggName, actionData);
    
    // ✅ Só mostra toast se completou AGORA (não se já estava completado antes)
    if (result.completed && result.achievement && result.achievement.is_new && (options?.showToast !== false)) {
      toast.success(result.achievement.display_name, {
        description: result.achievement.achievement_message,
        duration: 5000,
        icon: result.achievement.metadata?.icon || '🏆'
      });
      
      // Recarregar achievements após desbloquear
      await loadAchievements();
    }
    
    return result;
  }, []);

  /**
   * Carrega achievements do usuário
   */
  const loadAchievements = useCallback(async (options?: GetAchievementsOptions) => {
    setIsLoading(true);
    try {
      const [userAchievements, userStats] = await Promise.all([
        gamificationService.getUserAchievements(options),
        gamificationService.getUserStats()
      ]);
      
      setAchievements(userAchievements);
      setStats(userStats);
    } catch (error: any) {
      // Ignorar erros de auto-cancelamento do PocketBase
      if (error?.originalError?.code === 0 || error?.message?.includes('autocancelled')) {
        console.debug('[useGamification] Request autocancelled (expected behavior)');
        return;
      }
      console.error('[useGamification] Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Marca achievement como visto
   */
  const markAsSeen = useCallback(async (achievementId: string) => {
    await gamificationService.markAchievementAsSeen(achievementId);
    await loadAchievements(); // Recarregar para atualizar contagem de novos
  }, [loadAchievements]);

  /**
   * Marca todos os achievements como vistos
   */
  const markAllAsSeen = useCallback(async () => {
    await gamificationService.markAllAchievementsAsSeen();
    await loadAchievements();
  }, [loadAchievements]);

  /**
   * Verifica se usuário tem um achievement específico
   */
  const hasAchievement = useCallback(async (achievementId: string) => {
    return gamificationService.hasAchievement(achievementId);
  }, []);

  /**
   * Obtém total de pontos
   */
  const getTotalPoints = useCallback(async () => {
    return gamificationService.getUserTotalPoints();
  }, []);

  /**
   * Obtém easter eggs disponíveis
   */
  const getAvailableEasterEggs = useCallback(() => {
    return gamificationService.getAvailableEasterEggs();
  }, []);

  /**
   * Cria notificação personalizada
   */
  const createNotification = useCallback(async (
    title: string,
    content: string,
    options?: {
      icon?: string;
      animation?: 'shake' | 'bounce' | 'glow' | 'confetti';
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }
  ) => {
    await gamificationService.createCustomNotification(title, content, options);
  }, []);

  /**
   * Inicializar ao montar
   */
  useEffect(() => {
    const initializeService = async () => {
      // Evitar inicializações duplicadas
      if (isInitializing || isInitialized) {
        return;
      }

      setIsInitializing(true);
      
      try {
        if (!gamificationService.isInitialized()) {
          await gamificationService.initialize();
        }
        setIsInitialized(true);
        await loadAchievements();
      } catch (error: any) {
        // Ignorar erros de auto-cancelamento
        if (error?.originalError?.code === 0 || error?.message?.includes('autocancelled')) {
          console.debug('[useGamification] Initialization request autocancelled');
        } else {
          console.error('[useGamification] Failed to initialize:', error);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeService();
  }, []); // Empty deps - só inicializa uma vez

  return {
    achievements,
    stats,
    isLoading,
    isInitialized,
    trackAction,
    loadAchievements,
    markAsSeen,
    markAllAsSeen,
    hasAchievement,
    getTotalPoints,
    getAvailableEasterEggs,
    createNotification
  };
}
