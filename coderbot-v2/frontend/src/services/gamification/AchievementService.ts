// src/services/gamification/AchievementService.ts
import { pb } from '@/integrations/pocketbase/client';
import type { UserAchievement, EasterEggDefinition, GetAchievementsOptions, UserAchievementStats } from './types';

/**
 * Gerencia o desbloqueio e consulta de achievements
 */
export class AchievementService {
  /**
   * Desbloqueia um achievement para o usuário
   */
  async unlockAchievement(
    userId: string,
    definition: EasterEggDefinition,
    metadata?: Record<string, any>
  ): Promise<UserAchievement> {
    try {
      // Verificar se já existe (proteção extra além do unique constraint)
      const existing = await pb.collection('user_achievements').getFirstListItem<UserAchievement>(
        `user = "${userId}" && achievement_id = "${definition.id}"`
      ).catch(() => null);

      if (existing) {
        console.log(`[AchievementService] Achievement already unlocked: ${definition.name}`);
        return existing;
      }

      // Criar novo achievement
      const achievement = await pb.collection('user_achievements').create<UserAchievement>({
        user: userId,
        achievement_id: definition.id,
        achievement_name: definition.name,
        display_name: definition.display_name,
        description: definition.description,
        achievement_message: definition.achievement_message,
        unlocked_at: new Date().toISOString(),
        is_new: true,
        points: definition.points,
        metadata: {
          ...metadata,
          icon: definition.icon,
          category: definition.category,
          difficulty: definition.difficulty
        }
      });

      console.log(`[AchievementService] Achievement unlocked: ${definition.name} (+${definition.points} pontos)`);
      
      return achievement;
    } catch (error) {
      console.error('[AchievementService] Failed to unlock achievement:', error);
      throw error;
    }
  }

  /**
   * Busca achievements do usuário
   */
  async getUserAchievements(
    userId: string,
    options?: GetAchievementsOptions
  ): Promise<UserAchievement[]> {
    try {
      let filter = `user = "${userId}"`;
      
      if (options?.onlyNew) {
        filter += ' && is_new = true';
      }
      
      if (options?.category) {
        filter += ` && metadata.category = "${options.category}"`;
      }

      const sortMap = {
        newest: '-unlocked_at',
        points: '-points',
        name: 'display_name'
      };

      const achievements = await pb.collection('user_achievements').getFullList<UserAchievement>({
        filter,
        sort: sortMap[options?.sortBy || 'newest']
      });

      return achievements;
    } catch (error) {
      console.error('[AchievementService] Failed to fetch achievements:', error);
      return [];
    }
  }

  /**
   * Marca achievement como visto (is_new = false)
   */
  async markAsSeen(achievementId: string): Promise<void> {
    try {
      await pb.collection('user_achievements').update(achievementId, {
        is_new: false
      });
    } catch (error) {
      console.error('[AchievementService] Failed to mark as seen:', error);
    }
  }

  /**
   * Calcula total de pontos do usuário
   */
  async getUserTotalPoints(userId: string): Promise<number> {
    try {
      const achievements = await this.getUserAchievements(userId);
      return achievements.reduce((total, achievement) => total + (achievement.points || 0), 0);
    } catch (error) {
      console.error('[AchievementService] Failed to calculate total points:', error);
      return 0;
    }
  }

  /**
   * Estatísticas de achievements do usuário
   */
  async getUserStats(userId: string): Promise<UserAchievementStats> {
    const achievements = await this.getUserAchievements(userId);
    
    return {
      total: achievements.length,
      newCount: achievements.filter(a => a.is_new).length,
      totalPoints: achievements.reduce((sum, a) => sum + (a.points || 0), 0),
      byCategory: this.groupBy(achievements, a => a.metadata?.category || 'unknown'),
      byDifficulty: this.groupBy(achievements, a => a.metadata?.difficulty || 'unknown')
    };
  }

  /**
   * Marca todos os achievements como vistos
   */
  async markAllAsSeen(userId: string): Promise<void> {
    try {
      const newAchievements = await this.getUserAchievements(userId, { onlyNew: true });
      
      await Promise.all(
        newAchievements.map(achievement => this.markAsSeen(achievement.id))
      );
      
      console.log(`[AchievementService] Marked ${newAchievements.length} achievements as seen`);
    } catch (error) {
      console.error('[AchievementService] Failed to mark all as seen:', error);
    }
  }

  /**
   * Verifica se um achievement específico foi desbloqueado
   */
  async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const achievement = await pb.collection('user_achievements').getFirstListItem<UserAchievement>(
        `user = "${userId}" && achievement_id = "${achievementId}"`
      );
      
      return !!achievement;
    } catch (error) {
      return false;
    }
  }

  /**
   * Agrupa achievements por uma função de chave
   */
  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = keyFn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
