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
    target?: string;
    requiredClicks?: number;
    timeWindow?: number; // ms
    sequence?: string[];
    text_sequence?: string[];
    resetOnDelay?: boolean;
    consecutive_days?: number;
    hour_range?: [number, number];
    action?: string;
    required_pages?: string[];
    in_order?: boolean;
      [key: string]: any;
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
  easter_egg: string; // ID da definição do easter egg
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked_at: string; // ISO date
  is_new: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  metadata?: {
    trigger_count?: number;
    trigger_type?: string;
    component?: string;
    [key: string]: any;
  };
  expand?: {
    easter_egg?: EasterEggDefinition;
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
