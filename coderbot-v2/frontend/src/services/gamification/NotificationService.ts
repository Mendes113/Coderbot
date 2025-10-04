// src/services/gamification/NotificationService.ts
import { pb } from '@/integrations/pocketbase/client';
import type { UserAchievement } from './types';

/**
 * Cria notificações especiais para achievements desbloqueados
 */
export class NotificationService {
  /**
   * Cria notificação de achievement com animação especial
   */
  async createAchievementNotification(
    userId: string,
    achievement: UserAchievement,
    senderId?: string
  ): Promise<void> {
    try {
      const notification = await pb.collection('notifications').create({
        recipient: userId,
        sender: senderId || userId, // Self-notification se não especificado
        type: 'achievement',
        title: `🎉 ${achievement.display_name} Desbloqueado!`,
        content: achievement.achievement_message,
        achievement_id: achievement.id,
        icon: achievement.metadata?.icon || '🏆',
        animation: this.getAnimationByDifficulty(achievement.metadata?.difficulty),
        priority: 'high',
        read: false,
        metadata: {
          points: achievement.points,
          category: achievement.metadata?.category,
          difficulty: achievement.metadata?.difficulty
        }
      });

      console.log(`[NotificationService] Achievement notification created: ${notification.id}`);
    } catch (error) {
      console.error('[NotificationService] Failed to create achievement notification:', error);
      throw error;
    }
  }

  /**
   * Cria notificação de progresso (opcional - para motivar usuário)
   */
  async createProgressNotification(
    userId: string,
    easterEggName: string,
    currentValue: number,
    requiredValue: number
  ): Promise<void> {
    try {
      const percentage = Math.round((currentValue / requiredValue) * 100);
      
      // Só enviar notificação em marcos importantes (50%, 75%, 90%)
      if (![50, 75, 90].includes(percentage)) return;

      await pb.collection('notifications').create({
        recipient: userId,
        sender: userId,
        type: 'info',
        title: '📊 Progresso de Easter Egg',
        content: `Você está ${percentage}% perto de desbloquear um segredo! Continue explorando...`,
        icon: '🔍',
        animation: 'bounce',
        priority: 'normal',
        read: false,
        metadata: {
          easter_egg_name: easterEggName,
          progress: percentage
        }
      });
    } catch (error) {
      console.error('[NotificationService] Failed to create progress notification:', error);
    }
  }

  /**
   * Seleciona animação baseada na dificuldade
   */
  private getAnimationByDifficulty(difficulty?: string): string {
    const animations: Record<string, string> = {
      easy: 'bounce',
      medium: 'shake',
      hard: 'glow',
      legendary: 'confetti'
    };
    
    return animations[difficulty || 'medium'] || 'bounce';
  }

  /**
   * Cria notificação genérica de gamificação
   */
  async createGamificationNotification(
    userId: string,
    title: string,
    content: string,
    options?: {
      icon?: string;
      animation?: 'shake' | 'bounce' | 'glow' | 'confetti';
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }
  ): Promise<void> {
    try {
      await pb.collection('notifications').create({
        recipient: userId,
        sender: userId,
        type: 'info',
        title,
        content,
        icon: options?.icon || '🎮',
        animation: options?.animation || 'bounce',
        priority: options?.priority || 'normal',
        read: false
      });
    } catch (error) {
      console.error('[NotificationService] Failed to create gamification notification:', error);
    }
  }
}
