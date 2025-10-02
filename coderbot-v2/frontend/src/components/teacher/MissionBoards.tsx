import { useState, useEffect } from 'react';
import { Loader2, Plus, Target, Trophy, Users, Calendar, Settings } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  MissionBoardRecord,
  ClassMissionRecord,
  MissionStatus,
  MissionType,
  listClassMissions,
  listClassMissionBoards,
  createMissionBoard,
  getCurrentUser,
} from '@/integrations/pocketbase/client';

interface MissionBoardsProps {
  classId: string;
  onRefresh?: () => void;
}

const missionTypeLabels: Record<MissionType, string> = {
  chat_interaction: 'Interação com IA',
  code_execution: 'Execução de Código',
  exercise_completion: 'Conclusão de Exercícios',
  notes_creation: 'Criação de Notas',
  custom: 'Personalizada',
};

const statusColors: Record<MissionStatus, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  expired: 'bg-gray-100 text-gray-800',
  paused: 'bg-yellow-100 text-yellow-800',
};

export const MissionBoards = ({ classId, onRefresh }: MissionBoardsProps) => {
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState<MissionBoardRecord[]>([]);
  const [missions, setMissions] = useState<ClassMissionRecord[]>([]);
  const [selectedMissions, setSelectedMissions] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [boardsData, missionsData] = await Promise.all([
        listClassMissionBoards(classId),
        listClassMissions(classId, { status: 'active' }),
      ]);
      setBoards(boardsData);
      setMissions(missionsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados das missões');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) {
      toast.error('Digite um título para o quadro');
      return;
    }

    if (selectedMissions.length === 0) {
      toast.error('Selecione pelo menos uma missão');
      return;
    }

    setCreating(true);

    try {
      await createMissionBoard({
        classId,
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim() || undefined,
        missionIds: selectedMissions,
      });

      toast.success('Quadro criado com sucesso!');
      setShowCreateDialog(false);
      setNewBoardTitle('');
      setNewBoardDescription('');
      setSelectedMissions([]);
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao criar quadro:', error);
      toast.error('Não foi possível criar o quadro. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const toggleMissionSelection = (missionId: string) => {
    setSelectedMissions(prev =>
      prev.includes(missionId)
        ? prev.filter(id => id !== missionId)
        : [...prev, missionId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quadros de Missões</h3>
          <p className="text-sm text-muted-foreground">
            Organize missões em quadros temáticos para melhor acompanhamento
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Quadro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar novo quadro de missões</DialogTitle>
              <DialogDescription>
                Organize missões relacionadas em um quadro temático.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="board-title">Título do quadro *</Label>
                <Input
                  id="board-title"
                  placeholder="Ex: Missões de Programação Básica"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  maxLength={100}
                  disabled={creating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="board-description">Descrição (opcional)</Label>
                <Textarea
                  id="board-description"
                  placeholder="Descreva o objetivo deste conjunto de missões"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  maxLength={300}
                  disabled={creating}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Selecione as missões para incluir no quadro</Label>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
                  {missions.map((mission) => (
                    <div
                      key={mission.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMissions.includes(mission.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => toggleMissionSelection(mission.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{mission.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {mission.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {missionTypeLabels[mission.type]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Meta: {mission.target_value}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {mission.reward_points} pontos
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {missions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma missão disponível. Crie missões primeiro.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateBoard} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Quadro
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mission Boards Grid */}
      {boards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum quadro criado</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Organize suas missões em quadros temáticos para facilitar o acompanhamento do progresso dos alunos.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Quadro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Card key={board.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{board.title}</CardTitle>
                    {board.description && (
                      <CardDescription className="mt-1">
                        {board.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{board.missions.length} missões</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Quadro ativo</span>
                  </div>
                </div>

                {/* Preview of missions in board */}
                <div className="space-y-2">
                  {board.missions.slice(0, 3).map((missionId) => {
                    const mission = missions.find(m => m.id === missionId);
                    if (!mission) return null;

                    return (
                      <div key={missionId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{mission.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {missionTypeLabels[mission.type]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {mission.reward_points} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {board.missions.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{board.missions.length - 3} missões adicionais
                    </p>
                  )}
                </div>

                <Button className="w-full" variant="outline">
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
