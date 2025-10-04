import { useState } from 'react';
import { Loader2, Target, Users, Calendar, Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MissionType,
  MissionStatus,
  createClassMission,
} from '@/integrations/pocketbase/client';

interface MissionCreatorProps {
  classId: string;
  onMissionCreated?: () => void;
}

const missionTypeLabels: Record<MissionType, string> = {
  chat_interaction: 'Interação com IA',
  code_execution: 'Execução de Código',
  exercise_completion: 'Conclusão de Exercícios',
  notes_creation: 'Criação de Notas',
  custom: 'Personalizada',
};

const missionTypeDescriptions: Record<MissionType, string> = {
  chat_interaction: 'Enviar mensagens para a IA e receber respostas',
  code_execution: 'Executar código no ambiente de programação',
  exercise_completion: 'Completar exercícios e atividades propostas',
  notes_creation: 'Criar e compartilhar notas musicais',
  custom: 'Missão personalizada definida pelo professor',
};

const predefinedMissions = [
  {
    title: 'Converse com a IA - 20 mensagens',
    type: 'chat_interaction' as MissionType,
    target_value: 20,
    description: 'Envie 20 mensagens para a IA e receba respostas para praticar comunicação',
  },
  {
    title: 'Primeiro programa',
    type: 'code_execution' as MissionType,
    target_value: 1,
    description: 'Execute seu primeiro programa no ambiente de desenvolvimento',
  },
  {
    title: 'Complete 5 exercícios',
    type: 'exercise_completion' as MissionType,
    target_value: 5,
    description: 'Complete 5 exercícios para praticar os conceitos aprendidos',
  },
];

export const MissionCreator = ({ classId, onMissionCreated }: MissionCreatorProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MissionType>('chat_interaction');
  const [targetValue, setTargetValue] = useState(20);
  const [rewardPoints, setRewardPoints] = useState(100);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>();
  const [usePredefined, setUsePredefined] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('chat_interaction');
    setTargetValue(20);
    setRewardPoints(100);
    setStartsAt('');
    setEndsAt('');
    setMaxParticipants(undefined);
    setUsePredefined(false);
  };

  const handlePredefinedSelect = (mission: typeof predefinedMissions[0]) => {
    setTitle(mission.title);
    setDescription(mission.description);
    setType(mission.type);
    setTargetValue(mission.target_value);
    setUsePredefined(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Digite um título para a missão');
      return;
    }

    if (targetValue <= 0) {
      toast.error('O valor alvo deve ser maior que zero');
      return;
    }

    if (rewardPoints < 0) {
      toast.error('Os pontos de recompensa não podem ser negativos');
      return;
    }

    setSubmitting(true);

    try {
      await createClassMission({
        classId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        target_value: targetValue,
        reward_points: rewardPoints,
        starts_at: startsAt || undefined,
        ends_at: endsAt || undefined,
        max_participants: maxParticipants,
      });

      toast.success('Missão criada com sucesso!');
      resetForm();
      setOpen(false);
      onMissionCreated?.();
    } catch (error) {
      console.error('Erro ao criar missão:', error);
      toast.error('Não foi possível criar a missão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Target className="h-4 w-4" />
          Criar Missão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar nova missão</DialogTitle>
          <DialogDescription>
            Crie atividades e missões para motivar os alunos a interagirem com a plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Missões pré-definidas */}
          <div className="space-y-2">
            <Label>Missões rápidas</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {predefinedMissions.map((mission, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  className="justify-start h-auto p-3"
                  onClick={() => handlePredefinedSelect(mission)}
                  disabled={submitting}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">{mission.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {mission.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Clique em uma missão acima para usar como modelo
            </p>
          </div>

          {/* Tipo de missão */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de missão *</Label>
            <Select value={type} onValueChange={(value) => setType(value as MissionType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(missionTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {missionTypeDescriptions[value as MissionType]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Digite o título da missão"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 caracteres</p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva os objetivos e regras da missão (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={submitting}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{description.length}/500 caracteres</p>
          </div>

          {/* Configurações da missão */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="target">Valor alvo *</Label>
              <Input
                id="target"
                type="number"
                placeholder="Ex: 20 mensagens"
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                min={1}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Quantas ações o aluno deve realizar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward">Pontos de recompensa *</Label>
              <Input
                id="reward"
                type="number"
                placeholder="Ex: 100 pontos"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(parseInt(e.target.value) || 0)}
                min={0}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Pontos concedidos ao completar a missão
              </p>
            </div>
          </div>

          {/* Datas opcionais */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Data de início (opcional)</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ends_at">Data de fim (opcional)</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Máximo de participantes */}
          <div className="space-y-2">
            <Label htmlFor="max_participants">Máximo de participantes (opcional)</Label>
            <Input
              id="max_participants"
              type="number"
              placeholder="Deixe vazio para participantes ilimitados"
              value={maxParticipants || ''}
              onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value) : undefined)}
              min={1}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Limite o número de alunos que podem participar desta missão
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Criar Missão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
