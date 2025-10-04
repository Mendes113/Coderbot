// src/services/gamification/GamificationService.ts
import { getCurrentUser } from '@/integrations/pocketbase/client';
import { EasterEggTracker } from './EasterEggTracker';
import { AchievementService } from './AchievementService';
import { NotificationService } from './NotificationService';
import type { 
  TrackingResult, 
  EasterEggDefinition, 
  UserAchievement, 
  GetAchievementsOptions,
  UserAchievementStats 
} from './types';

/**
 * Serviço principal de gamificação - Facade Pattern
 * Orquestra todos os sub-serviços e fornece API simplificada
 */
class GamificationService {
  private tracker: EasterEggTracker;
  private achievementService: AchievementService;
  private notificationService: NotificationService;
  private initialized: boolean = false;

  constructor() {
    this.tracker = new EasterEggTracker();
    this.achievementService = new AchievementService();
    this.notificationService = new NotificationService();
  }

  /**
   * Inicializa todos os serviços de gamificação
   */
  async initialize(): Promise<void> {
    try {
      await this.tracker.initialize();
    } catch (error) {
      console.error('[GamificationService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Rastreia uma ação de easter egg e processa o resultado
   * @param easterEggName - Nome do easter egg (ex: 'notification_clicks')
   * @param actionData - Dados adicionais da ação (opcional)
   * @returns Resultado do tracking incluindo se foi completado
   */
  async trackEasterEggAction(
    easterEggName: string,
    actionData?: Record<string, any>
  ): Promise<TrackingResult> {
    try {
      // Obter usuário atual
      const user = getCurrentUser();
      if (!user?.id) {
        return {
          success: false,
          completed: false,
          error: 'User not authenticated'
        };
      }

      // Rastrear ação
      const { completed, progress } = await this.tracker.trackAction(
        user.id,
        easterEggName,
        actionData
      );

      // Se não completou, retornar apenas o progresso
      if (!completed) {
        return {
          success: true,
          completed: false,
          progress,
          message: 'Action tracked successfully'
        };
      }

      // Se completou, desbloquear achievement
      const definition = this.tracker.getDefinition(easterEggName);
      if (!definition) {
        return {
          success: false,
          completed: true,
          error: 'Easter egg definition not found'
        };
      }

      const achievement = await this.achievementService.unlockAchievement(
        user.id,
        definition,
        {
          trigger_count: progress.current_value,
          trigger_type: definition.trigger_type,
          ...actionData
        }
      );

      // Enviar notificação de achievement
      await this.notificationService.createAchievementNotification(
        user.id,
        achievement
      );

      return {
        success: true,
        completed: true,
        achievement,
        progress,
        message: `Achievement unlocked: ${definition.display_name}`
      };
    } catch (error) {
      console.error('[GamificationService] Error tracking action:', error);
      return {
        success: false,
        completed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obtém achievements do usuário
   */
  async getUserAchievements(options?: GetAchievementsOptions): Promise<UserAchievement[]> {
    const user = getCurrentUser();
    if (!user?.id) return [];
    
    return this.achievementService.getUserAchievements(user.id, options);
  }

  /**
   * Obtém estatísticas do usuário
   */
  async getUserStats(): Promise<UserAchievementStats> {
    const user = getCurrentUser();
    if (!user?.id) {
      return {
        total: 0,
        newCount: 0,
        totalPoints: 0,
        byCategory: {},
        byDifficulty: {}
      };
    }
    
    return this.achievementService.getUserStats(user.id);
  }

  /**
   * Marca achievement como visto
   */
  async markAchievementAsSeen(achievementId: string): Promise<void> {
    return this.achievementService.markAsSeen(achievementId);
  }

  /**
   * Marca todos os achievements como vistos
   */
  async markAllAchievementsAsSeen(): Promise<void> {
    const user = getCurrentUser();
    if (!user?.id) return;
    
    return this.achievementService.markAllAsSeen(user.id);
  }

  /**
   * Verifica se usuário tem um achievement específico
   */
  async hasAchievement(achievementId: string): Promise<boolean> {
    const user = getCurrentUser();
    if (!user?.id) return false;
    
    return this.achievementService.hasAchievement(user.id, achievementId);
  }

  /**
   * Obtém total de pontos do usuário
   */
  async getUserTotalPoints(): Promise<number> {
    const user = getCurrentUser();
    if (!user?.id) return 0;
    
    return this.achievementService.getUserTotalPoints(user.id);
  }

  /**
   * Obtém todas as definições de easter eggs disponíveis
   */
  getAvailableEasterEggs(): EasterEggDefinition[] {
    return this.tracker.getDefinitions();
  }

  /**
   * Obtém uma definição específica de easter egg
   */
  getEasterEggDefinition(name: string): EasterEggDefinition | undefined {
    return this.tracker.getDefinition(name);
  }

  /**
   * Recarrega as definições de easter eggs do banco
   */
  async reloadEasterEggs(): Promise<void> {
    return this.tracker.reloadDefinitions();
  }

  /**
   * Limpa caches (útil para testes ou logout)
   */
  clearCache(): void {
    this.tracker.clearCache();
    console.log('[GamificationService] Cache cleared');
  }

  /**
   * Verifica se o serviço está inicializado
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Cria uma notificação de gamificação personalizada
   */
  async createCustomNotification(
    title: string,
    content: string,
    options?: {
      icon?: string;
      animation?: 'shake' | 'bounce' | 'glow' | 'confetti';
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }
  ): Promise<void> {
    const user = getCurrentUser();
    if (!user?.id) return;
    
    return this.notificationService.createGamificationNotification(
      user.id,
      title,
      content,
      options
    );
  }
}

// Exportar instância singleton
export const gamificationService = new GamificationService();

// Exportar tipos para uso externo
export type { 
  TrackingResult, 
  EasterEggDefinition, 
  UserAchievement, 
  EasterEggProgress,
  GetAchievementsOptions,
  UserAchievementStats 
} from './types';

// Exportar a classe também para testes
export { GamificationService };
