// src/services/gamification/types.ts
import type { RecordModel as PBRecord } from 'pocketbase';

/**
 * Configuração de um Easter Egg (carregada do PocketBase)
 */
export interface EasterEggDefinition extends PBRecord {
  name: string; // Identificador único
  display_name: string;
  description: string;
  trigger_type: 'clicks' | 'sequence' | 'time_based' | 'combo';
  trigger_config: {
    requiredClicks?: number;
    timeWindow?: number; // ms
    sequence?: string[];
    resetOnDelay?: boolean;
  };
  achievement_message: string;
  points: number;
  icon: string;
  is_active: boolean;
  category: 'ui_interaction' | 'exploration' | 'achievement' | 'secret';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
}

/**
 * Achievement desbloqueado pelo usuário
 */
export interface UserAchievement extends PBRecord {
  user: string;
  achievement_id: string;
  achievement_name: string;
  display_name: string;
  description: string;
  achievement_message: string;
  unlocked_at: string; // ISO date
  is_new: boolean;
  points: number;
  metadata?: {
    trigger_count?: number;
    trigger_type?: string;
    component?: string;
    icon?: string;
    category?: string;
    difficulty?: string;
    [key: string]: any;
  };
}

/**
 * Progresso do usuário em um easter egg específico
 */
export interface EasterEggProgress extends PBRecord {
  user: string;
  easter_egg: string; // ID da definição
  current_value: number;
  session_data?: {
    last_action_at?: number; // timestamp
    action_history?: any[];
    [key: string]: any;
  };
  is_completed: boolean;
  completed_at?: string;
  attempts: number;
  metadata?: Record<string, any>;
}

/**
 * Resultado do tracking de uma ação
 */
export interface TrackingResult {
  success: boolean;
  completed: boolean;
  achievement?: UserAchievement;
  progress?: EasterEggProgress;
  message?: string;
  error?: string;
}

/**
 * Estatísticas de achievements do usuário
 */
export interface UserAchievementStats {
  total: number;
  newCount: number;
  totalPoints: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
}

/**
 * Opções para buscar achievements
 */
export interface GetAchievementsOptions {
  onlyNew?: boolean;
  category?: string;
  sortBy?: 'newest' | 'points' | 'name';
}
