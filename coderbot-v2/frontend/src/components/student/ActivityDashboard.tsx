import { useState } from 'react';
import { Target, Trophy, Clock, CheckCircle, Play, Music, MessageCircle, Code, BookOpen } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useActivityProgress } from '@/hooks/useActivityProgress';

interface ActivityDashboardProps {
  classId: string;
}

const missionTypeIcons: Record<string, React.ReactNode> = {
  chat_interaction: <MessageCircle className="h-4 w-4" />,
  code_execution: <Code className="h-4 w-4" />,
  exercise_completion: <BookOpen className="h-4 w-4" />,
  notes_creation: <Music className="h-4 w-4" />,
  custom: <Target className="h-4 w-4" />,
};

const missionTypeLabels: Record<string, string> = {
  chat_interaction: 'Conversa com IA',
  code_execution: 'Execução de Código',
  exercise_completion: 'Exercícios',
  notes_creation: 'Notas Musicais',
  custom: 'Personalizada',
};

export const ActivityDashboard = ({ classId }: ActivityDashboardProps) => {
  const { activities, loading, updateActivityProgress } = useActivityProgress(classId);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  const completedActivities = activities.filter(a => a.isCompleted);
  const inProgressActivities = activities.filter(a => a.isInProgress && !a.isCompleted);
  const availableActivities = activities.filter(a => !a.isInProgress && !a.isCompleted);

  const handleStartActivity = async (activity: any) => {
    const success = await updateActivityProgress(activity.mission.id, activity.mission.type, 1);
    if (success) {
      // Redirecionar para a atividade apropriada baseado no tipo
      switch (activity.mission.type) {
        case 'chat_interaction':
          // Abrir chat
          window.location.href = '/chat';
          break;
        case 'notes_creation':
          // Abrir notas musicais
          window.location.href = '/notes';
          break;
        case 'code_execution':
          // Abrir editor de código
          window.location.href = '/editor';
          break;
        default:
          // Atividade genérica
          break;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missões Disponíveis</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableActivities.length}</div>
            <p className="text-xs text-muted-foreground">
              Atividades para começar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressActivities.length}</div>
            <p className="text-xs text-muted-foreground">
              Atividades iniciadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedActivities.length}</div>
            <p className="text-xs text-muted-foreground">
              Missões completadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">
            Disponíveis ({availableActivities.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            Em Progresso ({inProgressActivities.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídas ({completedActivities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableActivities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma missão disponível</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Todas as missões foram concluídas ou ainda não há missões ativas nesta turma.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableActivities.map((activity) => (
                <Card key={activity.mission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {missionTypeIcons[activity.mission.type]}
                        <CardTitle className="text-base">{activity.mission.title}</CardTitle>
                      </div>
                      <Badge variant="secondary">
                        {activity.mission.reward_points} pts
                      </Badge>
                    </div>
                    {activity.mission.description && (
                      <CardDescription className="mt-1">
                        {activity.mission.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {missionTypeLabels[activity.mission.type]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Meta: {activity.mission.target_value}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{activity.currentValue}/{activity.targetValue}</span>
                      </div>
                      <Progress value={activity.percentage} className="h-2" />
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleStartActivity(activity)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar Missão
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          {inProgressActivities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma atividade em progresso</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Você ainda não iniciou nenhuma missão. Comece uma na aba "Disponíveis".
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressActivities.map((activity) => (
                <Card key={activity.mission.id} className="border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {missionTypeIcons[activity.mission.type]}
                        <CardTitle className="text-base">{activity.mission.title}</CardTitle>
                      </div>
                      <Badge className="bg-primary/10 text-primary">
                        Em Progresso
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span className="font-medium">
                          {activity.currentValue}/{activity.targetValue}
                        </span>
                      </div>
                      <Progress value={activity.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {activity.percentage.toFixed(0)}% concluído
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleStartActivity(activity)}
                    >
                      Continuar Missão
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedActivities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma missão concluída</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Complete suas primeiras missões para vê-las aqui!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedActivities.map((activity) => (
                <Card key={activity.mission.id} className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-base">{activity.mission.title}</CardTitle>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <Trophy className="h-3 w-3 mr-1" />
                        +{activity.mission.reward_points} pts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Concluído</span>
                        <span className="font-medium text-green-600">
                          {activity.targetValue}/{activity.targetValue}
                        </span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        {missionTypeLabels[activity.mission.type]}
                      </Badge>
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Activity Detail Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedActivity && missionTypeIcons[selectedActivity.mission.type]}
              {selectedActivity?.mission.title}
            </DialogTitle>
            <DialogDescription>
              {selectedActivity?.mission.description}
            </DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">{missionTypeLabels[selectedActivity.mission.type]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recompensa</p>
                  <p className="font-medium">{selectedActivity.mission.reward_points} pontos</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{selectedActivity.currentValue}/{selectedActivity.targetValue}</span>
                </div>
                <Progress value={selectedActivity.percentage} className="h-2" />
              </div>

              <Button
                className="w-full"
                onClick={() => handleStartActivity(selectedActivity)}
              >
                {selectedActivity.isInProgress ? 'Continuar' : 'Iniciar'} Missão
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
