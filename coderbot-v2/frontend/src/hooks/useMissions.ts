import { useQuery } from '@tanstack/react-query';
import { pb } from '@/integrations/pocketbase/client';
import { useState, useCallback } from 'react';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'chat_interaction' | 'code_execution' | 'exercise_completion' | 'notes_creation' | 'custom';
  status: 'active' | 'completed' | 'expired' | 'paused';
  target_value: number;
  reward_points: number;
  class: string; // ID da turma
  teacher: string; // ID do professor
  starts_at?: string;
  ends_at?: string;
  max_participants?: number;
  created: string;
  updated: string;
  // Campos opcionais para compatibilidade
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  topics?: string[];
  tags?: string[];
  estimatedDuration?: number; // em minutos
  learningObjectives?: string[];
  resources?: Array<{
    title: string;
    url: string;
    type: 'video' | 'article' | 'documentation' | 'example';
  }>;
  // Aliases para compatibilidade com código antigo
  classId?: string;
  createdBy?: string;
  dueDate?: string;
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
      console.log('[useMissions] 🚀 Query iniciada!', { classId, status, autoFetch });
      
      if (!classId) {
        // Buscar turmas do usuário primeiro
        const user = pb.authStore.record;
        if (!user?.id) {
          console.log('[useMissions] ❌ Usuário não autenticado');
          throw new Error('Usuário não autenticado');
        }

        console.log('[useMissions] ✅ Usuário autenticado:', user.id, user.email);

        // Buscar matrículas do usuário (qualquer role: student, teacher, admin)
        const enrollments = await pb.collection('class_members').getFullList({
          filter: `user = "${user.id}"`,
          sort: '-created',
        });

        console.log('[useMissions] Turmas encontradas:', enrollments.length);

        if (enrollments.length === 0) {
          console.log('[useMissions] Nenhuma turma encontrada para o usuário');
          return [];
        }

        // Buscar missões de todas as turmas do usuário
        const classIds = enrollments.map(e => e.class);
        console.log('[useMissions] IDs das turmas:', classIds);
        
        // Criar filtro com OR para cada turma
        const classFilters = classIds.map(id => `class = "${id}"`).join(' || ');
        const filter = `(${classFilters}) && status = "active"`;
        console.log('[useMissions] Filtro de missões:', filter);
        
        const records = await pb.collection('class_missions').getFullList<Mission>({
          filter,
          sort: '-created',
          expand: 'class,teacher',
        });

        console.log('[useMissions] Missões encontradas:', records.length, records);

        return records;
      }

      // Buscar missões de uma turma específica
      console.log('[useMissions] Buscando missões da turma:', classId);
      const records = await pb.collection('class_missions').getFullList<Mission>({
        filter: `class = "${classId}" && status = "${status}"`,
        sort: '-created',
        expand: 'class,teacher',
      });

      console.log('[useMissions] Missões da turma encontradas:', records.length);

      return records;
    },
    enabled: autoFetch,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });

  // Log de erros
  if (error) {
    console.error('[useMissions] ❌ Erro na query:', error);
  }

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

  // Log de debug para verificar o estado
  console.log('[useMissions] 📊 Estado atual:', {
    missionsCount: missions.length,
    isLoading,
    error: error?.message,
    selectedMission: selectedMission?.title,
    autoFetch,
    classId,
    status
  });

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
