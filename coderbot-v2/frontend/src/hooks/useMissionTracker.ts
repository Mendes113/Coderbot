import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ClassMissionRecord,
  MissionType,
  listClassMissions,
  getStudentMissionProgress,
  updateStudentMissionProgress,
  getCurrentUser,
  registerUserAction,
} from '@/integrations/pocketbase/client';

/**
 * Hook para rastrear automaticamente o progresso das missões do aluno.
 * 
 * Este hook monitora as ações do usuário e atualiza o progresso das missões
 * relevantes automaticamente.
 * 
 * @param classId - ID da turma atual (opcional)
 * @returns Funções para rastrear diferentes tipos de ações
 */
export const useMissionTracker = (classId?: string) => {
  const [activeMissions, setActiveMissions] = useState<ClassMissionRecord[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Carregar missões ativas da turma
  useEffect(() => {
    const loadMissions = async () => {
      if (!classId) return;

      try {
        const user = getCurrentUser();
        if (!user) return;

        setUserId(user.id);

        const missions = await listClassMissions(classId, { status: 'active' });
        setActiveMissions(missions);
      } catch (error) {
        console.error('Erro ao carregar missões:', error);
      }
    };

    loadMissions();
  }, [classId]);

  /**
   * Rastreia uma ação e atualiza o progresso das missões relevantes.
   * 
   * @param missionType - Tipo da missão (chat_interaction, code_execution, etc.)
   * @param increment - Valor a incrementar (padrão: 1)
   * @param metadata - Metadados adicionais para contexto
   */
  const trackAction = useCallback(async (
    missionType: MissionType,
    increment: number = 1,
    metadata?: Record<string, any>
  ) => {
    if (!userId || isTracking) return;

    setIsTracking(true);

    try {
      // Encontrar missões relevantes do tipo especificado
      const relevantMissions = activeMissions.filter(m => m.type === missionType);

      if (relevantMissions.length === 0) {
        // Sem missões ativas deste tipo, apenas registrar ação para gamificação
        await registerUserAction(userId, missionType, JSON.stringify(metadata || {}));
        return;
      }

      // Atualizar progresso de cada missão relevante
      for (const mission of relevantMissions) {
        try {
          const progress = await getStudentMissionProgress(mission.id, userId);
          const currentValue = progress?.current_value || 0;
          const newValue = currentValue + increment;

          // Verificar se completou a missão
          const isCompleted = newValue >= mission.target_value;

          await updateStudentMissionProgress(
            mission.id,
            userId,
            newValue,
            {
              ...metadata,
              actionType: missionType,
              timestamp: new Date().toISOString(),
              previousValue: currentValue,
            }
          );

          // Registrar ação de gamificação
          await registerUserAction(userId, missionType, `mission_${mission.id}`);

          // Se completou, dar pontos extras e notificar
          if (isCompleted && progress?.status !== 'completed') {
            await registerUserAction(
              userId,
              'complete_mission',
              `mission_${mission.id}_${mission.reward_points}`
            );

            toast.success(
              `🎉 Missão "${mission.title}" completa! +${mission.reward_points} pontos!`,
              {
                duration: 5000,
                icon: '🏆',
              }
            );
          } else if (newValue % 5 === 0 && !isCompleted) {
            // Feedback a cada 5 ações
            toast.success(
              `Progresso: ${newValue}/${mission.target_value} - ${mission.title}`,
              {
                duration: 2000,
              }
            );
          }
        } catch (error) {
          console.error(`Erro ao atualizar progresso da missão ${mission.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Erro ao rastrear ação:', error);
    } finally {
      setIsTracking(false);
    }
  }, [userId, activeMissions, isTracking]);

  /**
   * Rastreia uma mensagem enviada no chat.
   * Atualiza missões do tipo 'chat_interaction'.
   */
  const trackChatMessage = useCallback(async (messageContent: string) => {
    await trackAction('chat_interaction', 1, {
      messageLength: messageContent.length,
      timestamp: new Date().toISOString(),
    });
  }, [trackAction]);

  /**
   * Rastreia uma execução de código.
   * Atualiza missões do tipo 'code_execution'.
   */
  const trackCodeExecution = useCallback(async (language: string, codeLength: number) => {
    await trackAction('code_execution', 1, {
      language,
      codeLength,
      timestamp: new Date().toISOString(),
    });
  }, [trackAction]);

  /**
   * Rastreia criação ou salvamento de uma nota.
   * Atualiza missões do tipo 'notes_creation'.
   */
  const trackNoteCreation = useCallback(async (noteTitle: string, noteLength: number) => {
    await trackAction('notes_creation', 1, {
      noteTitle,
      noteLength,
      timestamp: new Date().toISOString(),
    });
  }, [trackAction]);

  /**
   * Rastreia conclusão de um exercício.
   * Atualiza missões do tipo 'exercise_completion'.
   */
  const trackExerciseCompletion = useCallback(async (exerciseId: string, score?: number) => {
    await trackAction('exercise_completion', 1, {
      exerciseId,
      score,
      timestamp: new Date().toISOString(),
    });
  }, [trackAction]);

  /**
   * Rastreia uma ação customizada.
   * Atualiza missões do tipo 'custom'.
   */
  const trackCustomAction = useCallback(async (actionName: string, metadata?: Record<string, any>) => {
    await trackAction('custom', 1, {
      actionName,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }, [trackAction]);

  /**
   * Recarrega as missões ativas.
   * Útil após criar novas missões ou quando o progresso precisa ser atualizado.
   */
  const refreshMissions = useCallback(async () => {
    if (!classId) return;

    try {
      const missions = await listClassMissions(classId, { status: 'active' });
      setActiveMissions(missions);
    } catch (error) {
      console.error('Erro ao recarregar missões:', error);
    }
  }, [classId]);

  return {
    // Estado
    activeMissions,
    isTracking,
    hasActiveMissions: activeMissions.length > 0,

    // Funções de rastreamento específicas
    trackChatMessage,
    trackCodeExecution,
    trackNoteCreation,
    trackExerciseCompletion,
    trackCustomAction,

    // Funções utilitárias
    trackAction,
    refreshMissions,
  };
};
