import { pb } from '@/integrations/pocketbase/client';

export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  trigger_config: {
    type: 'click' | 'sequence' | 'time_based' | 'combo' | 'navigation';
    target?: string;
    count?: number;
    sequence?: string[];
    timeWindow?: number;
    paths?: string[];
    hourStart?: number;
    hourEnd?: number;
  };
  is_active: boolean;
}

/**
 * Serviço para carregar configurações de achievements dinamicamente do PocketBase
 */
export class AchievementConfigService {
  private static instance: AchievementConfigService;
  private achievements: AchievementConfig[] = [];
  private loaded: boolean = false;

  private constructor() {}

  static getInstance(): AchievementConfigService {
    if (!AchievementConfigService.instance) {
      AchievementConfigService.instance = new AchievementConfigService();
    }
    return AchievementConfigService.instance;
  }

  /**
   * Carrega todos os achievements ativos do PocketBase
   */
  async loadAchievements(): Promise<AchievementConfig[]> {
    if (this.loaded) {
      return this.achievements;
    }

    try {
      const records = await pb.collection('easter_egg_definitions').getFullList({
        filter: 'is_active = true',
        sort: 'difficulty,name'
      });

      this.achievements = records.map(record => ({
        id: record.id,
        name: record.name,
        description: record.description,
        icon: record.icon,
        points: record.points,
        difficulty: record.difficulty,
        trigger_config: record.trigger_config,
        is_active: record.is_active
      }));

      this.loaded = true;
      console.log(`[AchievementConfig] Loaded ${this.achievements.length} achievements`);
      
      return this.achievements;
    } catch (error) {
      console.error('[AchievementConfig] Failed to load achievements:', error);
      return [];
    }
  }

  /**
   * Retorna achievements filtrados por tipo de trigger
   */
  getAchievementsByType(type: string): AchievementConfig[] {
    return this.achievements.filter(
      a => a.trigger_config.type === type
    );
  }

  /**
   * Retorna achievement específico por nome
   */
  getAchievementByName(name: string): AchievementConfig | undefined {
    return this.achievements.find(a => a.name === name);
  }

  /**
   * Força recarregamento dos achievements
   */
  async reload(): Promise<AchievementConfig[]> {
    this.loaded = false;
    return this.loadAchievements();
  }
}

export const achievementConfigService = AchievementConfigService.getInstance();
