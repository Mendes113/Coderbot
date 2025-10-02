import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ClassMissionRecord,
  StudentMissionProgressRecord,
  MissionType,
  listClassMissions,
  getStudentMissionProgress,
  updateStudentMissionProgress,
  getCurrentUser,
  registerUserAction,
} from '@/integrations/pocketbase/client';

interface ActivityProgress {
  mission: ClassMissionRecord;
  progress: StudentMissionProgressRecord | null;
  currentValue: number;
  targetValue: number;
  percentage: number;
  isCompleted: boolean;
  isInProgress: boolean;
}

interface UseActivityProgressReturn {
  activities: ActivityProgress[];
  loading: boolean;
  refreshActivities: () => Promise<void>;
  updateActivityProgress: (missionId: string, actionType: MissionType, increment?: number) => Promise<boolean>;
  getActivityProgress: (missionId: string) => ActivityProgress | null;
}

export const useActivityProgress = (classId: string): UseActivityProgressReturn => {
  const [activities, setActivities] = useState<ActivityProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    try {
      const [missions, user] = await Promise.all([
        listClassMissions(classId, { status: 'active' }),
        getCurrentUser(),
      ]);

      if (!user) {
        setActivities([]);
        return;
      }

      const progressPromises = missions.map(async (mission) => {
        const progress = await getStudentMissionProgress(mission.id, user.id);

        const currentValue = progress?.current_value || 0;
        const targetValue = mission.target_value;
        const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;

        return {
          mission,
          progress,
          currentValue,
          targetValue,
          percentage,
          isCompleted: progress?.status === 'completed' || percentage >= 100,
          isInProgress: progress?.status === 'in_progress' && !progress?.completed_at,
        };
      });

      const activitiesData = await Promise.all(progressPromises);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      toast.error('Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const updateActivityProgress = useCallback(async (
    missionId: string,
    actionType: MissionType,
    increment: number = 1
  ): Promise<boolean> => {
    try {
      const user = getCurrentUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return false;
      }

      const activity = activities.find(a => a.mission.id === missionId);
      if (!activity) {
        toast.error('Atividade não encontrada');
        return false;
      }

      if (activity.isCompleted) {
        return true; // Já está completo
      }

      const newValue = activity.currentValue + increment;
      const shouldComplete = newValue >= activity.targetValue;

      await updateStudentMissionProgress(
        missionId,
        user.id,
        newValue,
        {
          actionType,
          timestamp: new Date().toISOString(),
          previousValue: activity.currentValue,
        }
      );

      // Registrar ação de gamificação
      await registerUserAction(user.id, actionType, `mission_${missionId}`);

      // Se completou a missão, dar pontos extras
      if (shouldComplete) {
        await registerUserAction(user.id, 'complete_mission', `mission_${missionId}_${activity.mission.reward_points}`);
        toast.success(`🎉 Missão "${activity.mission.title}" completa! +${activity.mission.reward_points} pontos!`);
      } else {
        toast.success(`Progresso atualizado: ${newValue}/${activity.targetValue}`);
      }

      await loadActivities(); // Recarregar dados
      return true;
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      toast.error('Erro ao atualizar progresso da atividade');
      return false;
    }
  }, [activities]);

  const getActivityProgress = useCallback((missionId: string): ActivityProgress | null => {
    return activities.find(a => a.mission.id === missionId) || null;
  }, [activities]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return {
    activities,
    loading,
    refreshActivities: loadActivities,
    updateActivityProgress,
    getActivityProgress,
  };
};
