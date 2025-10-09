import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Trophy,
  BookOpen,
  Code2,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Mission } from '@/hooks/useMissions';

interface MissionSelectorProps {
  missions: Mission[];
  selectedMission: Mission | null;
  onSelectMission: (mission: Mission) => void;
  isLoading?: boolean;
  isCompact?: boolean;
  className?: string;
}

const getMissionIcon = (type: Mission['type']) => {
  switch (type) {
    case 'quiz':
      return Trophy;
    case 'exercise':
      return Code2;
    case 'project':
      return Target;
    case 'learning_path':
      return BookOpen;
    case 'discussion':
      return MessageSquare;
    default:
      return Target;
  }
};

const getMissionTypeLabel = (type: Mission['type']) => {
  const labels = {
    quiz: 'Quiz',
    exercise: 'Exercício',
    project: 'Projeto',
    learning_path: 'Trilha de Aprendizado',
    discussion: 'Discussão',
  };
  return labels[type];
};

const getDifficultyColor = (difficulty?: Mission['difficulty']) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'advanced':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getDifficultyLabel = (difficulty?: Mission['difficulty']) => {
  const labels = {
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  };
  return difficulty ? labels[difficulty] : 'Não definido';
};

// Versão expandida (tela inicial)
export const MissionSelectorExpanded: React.FC<MissionSelectorProps> = ({
  missions,
  selectedMission,
  onSelectMission,
  isLoading,
  className,
}) => {
  const [hoveredMission, setHoveredMission] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 space-y-4', className)}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 animate-pulse flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Carregando missões...</p>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 space-y-4 text-center', className)}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Nenhuma missão disponível</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Seu professor ainda não criou nenhuma missão para esta turma. 
            Volte mais tarde ou entre em contato com seu professor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col w-full max-w-4xl mx-auto', className)}>
      {/* Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg mb-4">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
          Escolha sua Missão
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Selecione um tema de aprendizado para começar sua jornada de estudos
        </p>
      </div>

      {/* Grid de Missões */}
      <ScrollArea className="max-h-[500px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((mission) => {
            const Icon = getMissionIcon(mission.type);
            const isHovered = hoveredMission === mission.id;

            return (
              <button
                key={mission.id}
                onClick={() => onSelectMission(mission)}
                onMouseEnter={() => setHoveredMission(mission.id)}
                onMouseLeave={() => setHoveredMission(null)}
                className={cn(
                  'group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left',
                  'hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1',
                  'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950',
                  selectedMission?.id === mission.id
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20 ring-4 ring-purple-100 dark:ring-purple-900/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700'
                )}
              >
                {/* Badge de selecionado */}
                {selectedMission?.id === mission.id && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Header do card */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                    'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/20',
                    isHovered && 'scale-110 rotate-3'
                  )}>
                    <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {mission.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {getMissionTypeLabel(mission.type)}
                      </Badge>
                      {mission.difficulty && (
                        <Badge className={cn('text-xs', getDifficultyColor(mission.difficulty))}>
                          {getDifficultyLabel(mission.difficulty)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {mission.description}
                </p>

                {/* Footer com informações */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {!!mission.estimatedDuration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{mission.estimatedDuration} min</span>
                    </div>
                  )}
                  {mission.topics && mission.topics.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      <span>{mission.topics.length} tópicos</span>
                    </div>
                  )}
                </div>

                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-transparent group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none" />
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer com dica */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-purple-500" />
          Clique em uma missão para começar a conversar sobre o tema
        </p>
      </div>
    </div>
  );
};

// Versão compacta (dropdown lateral)
export const MissionSelectorCompact: React.FC<MissionSelectorProps> = ({
  missions,
  selectedMission,
  onSelectMission,
  isLoading,
  className,
}) => {
  console.log('[MissionSelectorCompact] 📦 Props recebidas:', {
    missionsCount: missions.length,
    isLoading,
    selectedMission: selectedMission?.title,
    missions: missions.map(m => ({ id: m.id, title: m.title }))
  });

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={cn('w-full', className)}>
          <SelectValue placeholder="Carregando..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (missions.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className={cn('w-full', className)}>
          <SelectValue placeholder="Nenhuma missão disponível" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={selectedMission?.id}
      onValueChange={(missionId) => {
        const mission = missions.find(m => m.id === missionId);
        if (mission) onSelectMission(mission);
      }}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder="Selecione uma missão">
          {selectedMission && (
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = getMissionIcon(selectedMission.type);
                return <Icon className="w-4 h-4" />;
              })()}
              <span className="truncate">{selectedMission.title}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Missões Disponíveis</SelectLabel>
          {missions.map((mission) => {
            const Icon = getMissionIcon(mission.type);
            return (
              <SelectItem key={mission.id} value={mission.id}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="truncate">{mission.title}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

// Componente principal que alterna entre os dois modos
export const MissionSelector: React.FC<MissionSelectorProps> = (props) => {
  if (props.isCompact) {
    return <MissionSelectorCompact {...props} />;
  }
  return <MissionSelectorExpanded {...props} />;
};
