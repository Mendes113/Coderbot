import { useQuery } from '@tanstack/react-query';
import { pb } from '@/integrations/pocketbase/client';
import { useState, useCallback } from 'react';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'exercise' | 'project' | 'learning_path' | 'discussion';
  status: 'active' | 'completed' | 'pending';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  topics?: string[];
  dueDate?: string;
  classId: string;
  createdBy: string;
  created: string;
  updated: string;
  tags?: string[];
  estimatedDuration?: number; // em minutos
  learningObjectives?: string[];
  resources?: Array<{
    title: string;
    url: string;
    type: 'video' | 'article' | 'documentation' | 'example';
  }>;
}

interface UseMissionsOptions {
  classId?: string;
  status?: 'active' | 'completed' | 'pending';
  autoFetch?: boolean;
}

export const useMissions = (options: UseMissionsOptions = {}) => {
  const { classId, status = 'active', autoFetch = true } = options;
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  // Buscar missões da turma
  const {
    data: missions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['missions', classId, status],
    queryFn: async () => {
      if (!classId) {
        // Buscar turmas do usuário primeiro
        const user = pb.authStore.record;
        if (!user?.id) {
          throw new Error('Usuário não autenticado');
        }

        // Buscar matrículas ativas do usuário
        const enrollments = await pb.collection('class_enrollments').getFullList({
          filter: `student = "${user.id}" && status = "active"`,
          sort: '-created',
        });

        if (enrollments.length === 0) {
          return [];
        }

        // Buscar missões de todas as turmas do usuário
        const classIds = enrollments.map(e => e.classId);
        const filter = `classId ?~ "${classIds.join('|')}" && status = "${status}"`;
        
        const records = await pb.collection('class_missions').getFullList<Mission>({
          filter,
          sort: '-created',
          expand: 'classId,createdBy',
        });

        return records;
      }

      // Buscar missões de uma turma específica
      const records = await pb.collection('class_missions').getFullList<Mission>({
        filter: `classId = "${classId}" && status = "${status}"`,
        sort: '-created',
        expand: 'classId,createdBy',
      });

      return records;
    },
    enabled: autoFetch,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Selecionar missão
  const selectMission = useCallback((mission: Mission | null) => {
    setSelectedMission(mission);
    
    // Salvar no localStorage para persistir entre sessões
    if (mission) {
      localStorage.setItem('selectedMission', JSON.stringify(mission));
    } else {
      localStorage.removeItem('selectedMission');
    }
  }, []);

  // Restaurar missão selecionada do localStorage
  const restoreSelectedMission = useCallback(() => {
    const stored = localStorage.getItem('selectedMission');
    if (stored) {
      try {
        const mission = JSON.parse(stored);
        setSelectedMission(mission);
        return mission;
      } catch (e) {
        console.error('Erro ao restaurar missão:', e);
        localStorage.removeItem('selectedMission');
      }
    }
    return null;
  }, []);

  // Limpar missão selecionada
  const clearSelectedMission = useCallback(() => {
    setSelectedMission(null);
    localStorage.removeItem('selectedMission');
  }, []);

  // Filtrar missões por tipo
  const filterByType = useCallback((type: Mission['type']) => {
    return missions.filter(m => m.type === type);
  }, [missions]);

  // Filtrar missões por dificuldade
  const filterByDifficulty = useCallback((difficulty: Mission['difficulty']) => {
    return missions.filter(m => m.difficulty === difficulty);
  }, [missions]);

  // Buscar missão por ID
  const getMissionById = useCallback((missionId: string) => {
    return missions.find(m => m.id === missionId);
  }, [missions]);

  return {
    missions,
    isLoading,
    error,
    refetch,
    selectedMission,
    selectMission,
    clearSelectedMission,
    restoreSelectedMission,
    filterByType,
    filterByDifficulty,
    getMissionById,
  };
};
