import { useState } from 'react';
import { Target, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  MissionType,
  createClassMission,
} from '@/integrations/pocketbase/client';

interface QuickMissionCreatorProps {
  classId: string;
  onMissionCreated?: () => void;
}

const predefinedMissions = [
  {
    title: 'Converse com a IA - 20 mensagens',
    type: 'chat_interaction' as MissionType,
    target_value: 20,
    reward_points: 100,
    description: 'Envie 20 mensagens para a IA e receba respostas para praticar comunicação',
  },
  {
    title: 'Primeiro programa',
    type: 'code_execution' as MissionType,
    target_value: 1,
    reward_points: 50,
    description: 'Execute seu primeiro programa no ambiente de desenvolvimento',
  },
  {
    title: 'Crie sua primeira nota musical',
    type: 'notes_creation' as MissionType,
    target_value: 1,
    reward_points: 75,
    description: 'Crie e compartilhe sua primeira composição musical',
  },
  {
    title: 'Complete 5 exercícios',
    type: 'exercise_completion' as MissionType,
    target_value: 5,
    reward_points: 150,
    description: 'Complete 5 exercícios para praticar os conceitos aprendidos',
  },
  {
    title: 'Missão personalizada - 10 pontos',
    type: 'custom' as MissionType,
    target_value: 10,
    reward_points: 200,
    description: 'Missão personalizada definida pelo professor',
  },
];

export const QuickMissionCreator = ({ classId, onMissionCreated }: QuickMissionCreatorProps) => {
  const [selectedMissionIndex, setSelectedMissionIndex] = useState<number>(0);
  const [creating, setCreating] = useState(false);

  const handleCreateMission = async () => {
    const missionTemplate = predefinedMissions[selectedMissionIndex];

    setCreating(true);

    try {
      await createClassMission({
        classId,
        title: missionTemplate.title,
        description: missionTemplate.description,
        type: missionTemplate.type,
        target_value: missionTemplate.target_value,
        reward_points: missionTemplate.reward_points,
      });

      toast.success(`Missão criada com sucesso: ${missionTemplate.title}`);
      onMissionCreated?.();
    } catch (error) {
      console.error('Erro ao criar missão:', error);
      toast.error('Não foi possível criar a missão. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Criar Missão Rápida</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">Escolha uma missão pré-definida:</label>
          <Select
            value={selectedMissionIndex.toString()}
            onValueChange={(value) => setSelectedMissionIndex(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {predefinedMissions.map((mission, index) => (
                <SelectItem key={index} value={index.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{mission.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {mission.target_value} ações • {mission.reward_points} pontos
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground">
          {predefinedMissions[selectedMissionIndex].description}
        </div>

        <Button
          onClick={handleCreateMission}
          disabled={creating}
          className="w-full"
        >
          {creating ? (
            <>
              <Zap className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Criar Missão
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

