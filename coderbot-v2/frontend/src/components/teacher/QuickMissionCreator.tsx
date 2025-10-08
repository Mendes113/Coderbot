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

  const selectedMission = predefinedMissions[selectedMissionIndex];

  return (
    <div className="space-y-4">
      {/* Mission Preview Card */}
      <div className="p-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 backdrop-blur-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{selectedMission.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedMission.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-sm border">
            <Target className="h-3 w-3 text-primary" />
            <span className="font-medium">{selectedMission.target_value} ações</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-sm border">
            <Zap className="h-3 w-3 text-amber-500" />
            <span className="font-medium">{selectedMission.reward_points} pontos</span>
          </div>
        </div>
      </div>

      {/* Mission Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <span>Escolha uma missão pré-definida:</span>
        </label>
        <Select
          value={selectedMissionIndex.toString()}
          onValueChange={(value) => setSelectedMissionIndex(parseInt(value))}
        >
          <SelectTrigger className="h-auto py-2.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {predefinedMissions.map((mission, index) => (
              <SelectItem key={index} value={index.toString()} className="py-3">
                <div className="flex flex-col gap-1">
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

      {/* Create Button */}
      <Button
        onClick={handleCreateMission}
        disabled={creating}
        className="w-full h-11 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
      >
        {creating ? (
          <>
            <Zap className="mr-2 h-4 w-4 animate-spin" />
            Criando missão...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Criar Missão
          </>
        )}
      </Button>
    </div>
  );
};






