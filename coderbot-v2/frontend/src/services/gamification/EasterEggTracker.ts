// src/services/gamification/EasterEggTracker.ts
import { pb } from '@/integrations/pocketbase/client';
import type { EasterEggDefinition, EasterEggProgress } from './types';

/**
 * Responsável por rastrear o progresso de easter eggs e determinar quando são completados
 */
export class EasterEggTracker {
  private definitions: Map<string, EasterEggDefinition> = new Map();
  private progressCache: Map<string, EasterEggProgress> = new Map();

  /**
   * Inicializa o tracker carregando as definições ativas do PocketBase
   */
  async initialize(): Promise<void> {
    try {
      const records = await pb.collection('easter_egg_definitions').getFullList<EasterEggDefinition>({
        filter: 'is_active = true',
        sort: 'name'
      });
      
      records.forEach(def => {
        this.definitions.set(def.name, def);
      });
      
      console.log(`[EasterEggTracker] Loaded ${this.definitions.size} active easter eggs`);
    } catch (error) {
      console.error('[EasterEggTracker] Failed to load definitions:', error);
    }
  }

  /**
   * Rastreia uma ação do usuário e verifica se completa um easter egg
   */
  async trackAction(
    userId: string,
    easterEggName: string,
    actionData?: Record<string, any>
  ): Promise<{ completed: boolean; progress: EasterEggProgress }> {
    const definition = this.definitions.get(easterEggName);
    
    if (!definition) {
      console.warn(`[EasterEggTracker] Easter egg "${easterEggName}" not found or inactive`);
      return { completed: false, progress: {} as EasterEggProgress };
    }

    // Carregar ou criar progresso
    let progress = await this.getOrCreateProgress(userId, definition.id);
    
    // Se já completado antes, retornar sem processar (EVITA NOTIFICAÇÕES DUPLICADAS)
    if (progress.is_completed) {
      console.log(`[EasterEggTracker] Easter egg "${easterEggName}" already completed for user ${userId}`);
      return { completed: false, progress }; // FALSE = não é nova conquista
    }

    // Atualizar progresso baseado no tipo de trigger
    const updated = await this.updateProgress(definition, progress, actionData);
    
    // Verificar se completou
    const completed = this.checkCompletion(definition, updated);
    
    if (completed) {
      updated.is_completed = true;
      updated.completed_at = new Date().toISOString();
    }
    
    // Salvar progresso atualizado
    const savedProgress = await pb.collection('user_easter_egg_progress').update<EasterEggProgress>(updated.id, {
      current_value: updated.current_value,
      session_data: updated.session_data,
      is_completed: updated.is_completed,
      completed_at: updated.completed_at,
      attempts: updated.attempts + 1
    });

    // Atualizar cache
    this.progressCache.set(`${userId}:${definition.id}`, savedProgress);
    
    return { completed, progress: savedProgress };
  }

  /**
   * Obtém ou cria um registro de progresso
   */
  private async getOrCreateProgress(
    userId: string,
    easterEggId: string
  ): Promise<EasterEggProgress> {
    const cacheKey = `${userId}:${easterEggId}`;
    
    // Tentar cache primeiro
    if (this.progressCache.has(cacheKey)) {
      return this.progressCache.get(cacheKey)!;
    }

    try {
      // Buscar no banco
      const existing = await pb.collection('user_easter_egg_progress').getFirstListItem<EasterEggProgress>(
        `user = "${userId}" && easter_egg = "${easterEggId}"`
      );
      
      this.progressCache.set(cacheKey, existing);
      return existing;
    } catch (error) {
      // Se não existe, criar novo
      const newProgress = await pb.collection('user_easter_egg_progress').create<EasterEggProgress>({
        user: userId,
        easter_egg: easterEggId,
        current_value: 0,
        session_data: {},
        is_completed: false,
        attempts: 0
      });
      
      this.progressCache.set(cacheKey, newProgress);
      return newProgress;
    }
  }

  /**
   * Atualiza o progresso baseado no tipo de trigger
   */
  private async updateProgress(
    definition: EasterEggDefinition,
    progress: EasterEggProgress,
    actionData?: Record<string, any>
  ): Promise<EasterEggProgress> {
    const now = Date.now();
    const sessionData = progress.session_data || {};
    const config = definition.trigger_config;

    switch (definition.trigger_type) {
      case 'clicks': {
        const lastActionAt = sessionData.last_action_at || 0;
        const timeWindow = config.timeWindow || 1000;
        
        // Se passou muito tempo desde última ação, resetar
        if (config.resetOnDelay && (now - lastActionAt) > timeWindow) {
          progress.current_value = 1;
        } else {
          progress.current_value += 1;
        }
        
        sessionData.last_action_at = now;
        break;
      }
      
      case 'sequence': {
        // Implementar lógica de sequência
        const actionHistory = sessionData.action_history || [];
        
        if (actionData?.key) {
          actionHistory.push({
            key: actionData.key,
            timestamp: now
          });
        }
        
        // Manter apenas histórico relevante (últimas 20 ações ou dentro do timeWindow)
        const timeWindow = config.timeWindow || 5000;
        const filteredHistory = actionHistory.filter((action: any) => 
          (now - action.timestamp) < timeWindow
        ).slice(-20);
        
        sessionData.action_history = filteredHistory;
        
        // Verificar se a sequência está correta
        const sequence = config.sequence || [];
        const recentKeys = filteredHistory.slice(-sequence.length).map((a: any) => a.key);
        
        // Verificar match parcial ou completo
        let matchCount = 0;
        for (let i = 0; i < Math.min(recentKeys.length, sequence.length); i++) {
          if (recentKeys[i] === sequence[i]) {
            matchCount++;
          } else {
            break; // Sequência quebrada
          }
        }
        
        progress.current_value = matchCount;
        break;
      }
      
      case 'time_based': {
        // Implementar lógica baseada em tempo
        // Por exemplo: tempo total no sistema, sessões consecutivas, etc.
        if (actionData?.duration) {
          progress.current_value = (progress.current_value || 0) + actionData.duration;
        }
        sessionData.last_action_at = now;
        break;
      }
      
      case 'combo': {
        // Implementar lógica de combo (múltiplas ações diferentes)
        const comboActions = sessionData.combo_actions || [];
        
        if (actionData?.action) {
          comboActions.push({
            action: actionData.action,
            timestamp: now
          });
        }
        
        // Manter apenas ações recentes
        const timeWindow = config.timeWindow || 3000;
        const filteredCombo = comboActions.filter((action: any) => 
          (now - action.timestamp) < timeWindow
        );
        
        sessionData.combo_actions = filteredCombo;
        progress.current_value = filteredCombo.length;
        break;
      }
    }

    progress.session_data = sessionData;
    return progress;
  }

  /**
   * Verifica se o easter egg foi completado
   */
  private checkCompletion(
    definition: EasterEggDefinition,
    progress: EasterEggProgress
  ): boolean {
    switch (definition.trigger_type) {
      case 'clicks':
        return progress.current_value >= (definition.trigger_config.requiredClicks || 3);
      
      case 'sequence': {
        const sequence = definition.trigger_config.sequence || [];
        return progress.current_value >= sequence.length;
      }
      
      case 'time_based': {
        // Verificar se atingiu o tempo necessário (em ms)
        const requiredTime = definition.trigger_config.timeWindow || 60000; // 1 minuto default
        return progress.current_value >= requiredTime;
      }
      
      case 'combo': {
        const requiredActions = definition.trigger_config.requiredClicks || 5;
        return progress.current_value >= requiredActions;
      }
      
      default:
        return false;
    }
  }

  /**
   * Limpa o cache de progresso
   */
  clearCache(): void {
    this.progressCache.clear();
  }

  /**
   * Obtém todas as definições ativas
   */
  getDefinitions(): EasterEggDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Obtém uma definição específica
   */
  getDefinition(name: string): EasterEggDefinition | undefined {
    return this.definitions.get(name);
  }

  /**
   * Recarrega as definições do banco de dados
   */
  async reloadDefinitions(): Promise<void> {
    this.definitions.clear();
    await this.initialize();
  }
}
