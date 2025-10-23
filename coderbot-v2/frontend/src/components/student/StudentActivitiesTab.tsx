import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Target,
  Trophy,
  Clock,
  CheckCircle,
  Play,
  AlertTriangle,
  Search,
  Filter,
  TrendingUp,
  Award,
  BookOpen,
  MessageSquare,
  Code,
  Music,
  Calendar,
  Star,
} from 'lucide-react';
import { useActivityProgress } from '@/hooks/useActivityProgress';
import { useMissions, type Mission } from '@/hooks/useMissions';

interface StudentActivitiesTabProps {
  missions: Mission[];
  isLoading: boolean;
  error: string | null;
}

const missionTypeIcons: Record<string, React.ReactNode> = {
  chat_interaction: <MessageSquare className="h-4 w-4" />,
  code_execution: <Code className="h-4 w-4" />,
  exercise_completion: <BookOpen className="h-4 w-4" />,
  notes_creation: <Music className="h-4 w-4" />,
  quiz: <Trophy className="h-4 w-4" />,
  exercise: <Code className="h-4 w-4" />,
  project: <Target className="h-4 w-4" />,
  learning_path: <BookOpen className="h-4 w-4" />,
  discussion: <MessageSquare className="h-4 w-4" />,
  custom: <Target className="h-4 w-4" />,
};

const missionTypeLabels: Record<string, string> = {
  chat_interaction: 'Conversa com IA',
  code_execution: 'Execução de Código',
  exercise_completion: 'Exercícios',
  notes_creation: 'Notas Musicais',
  quiz: 'Quiz',
  exercise: 'Exercício',
  project: 'Projeto',
  learning_path: 'Trilha de Aprendizado',
  discussion: 'Discussão',
  custom: 'Personalizada',
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

export const StudentActivitiesTab: React.FC<StudentActivitiesTabProps> = ({
  missions,
  isLoading,
  error,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Filtrar missões baseado nos filtros
  const filteredMissions = useMemo(() => {
    let filtered = [...missions];

    // Filtro por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(mission =>
        mission.title.toLowerCase().includes(query) ||
        mission.description.toLowerCase().includes(query) ||
        missionTypeLabels[mission.type].toLowerCase().includes(query)
      );
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(mission => mission.type === filterType);
    }

    // Filtro por status (usando lógica simplificada - em produção seria baseado no progresso real)
    if (filterStatus !== 'all') {
      // Por enquanto, vamos simular baseado no status da missão
      filtered = filtered.filter(mission => {
        if (filterStatus === 'active') return mission.status === 'active';
        if (filterStatus === 'completed') return mission.status === 'completed';
        return true;
      });
    }

    // Filtro por dificuldade
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(mission => mission.difficulty === filterDifficulty);
    }

    return filtered;
  }, [missions, searchQuery, filterType, filterStatus, filterDifficulty]);

  // Estatísticas das missões
  const stats = useMemo(() => {
    const total = missions.length;
    const active = missions.filter(m => m.status === 'active').length;
    const completed = missions.filter(m => m.status === 'completed').length;
    const totalPoints = missions.reduce((sum, m) => sum + m.reward_points, 0);

    return { total, active, completed, totalPoints };
  }, [missions]);

  // Estatísticas das missões filtradas
  const filteredStats = useMemo(() => {
    const total = filteredMissions.length;
    const active = filteredMissions.filter(m => m.status === 'active').length;
    const completed = filteredMissions.filter(m => m.status === 'completed').length;
    const totalPoints = filteredMissions.reduce((sum, m) => sum + m.reward_points, 0);

    return { total, active, completed, totalPoints };
  }, [filteredMissions]);

  const handleStartActivity = (mission: Mission) => {
    // Navegar para a atividade apropriada baseado no tipo
    switch (mission.type) {
      case 'chat_interaction':
        window.location.href = '/dashboard/chat';
        break;
      case 'notes_creation':
        window.location.href = '/dashboard/notes';
        break;
      case 'code_execution':
        window.location.href = '/dashboard/code-editor';
        break;
      case 'exercise_completion':
        window.location.href = '/dashboard/exercises';
        break;
      default:
        window.location.href = '/dashboard/chat';
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar atividades</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Atividades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {filteredStats.total} filtradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para fazer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Missões finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Recompensas disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Use os filtros para encontrar atividades específicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(missionTypeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dificuldade</label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as dificuldades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as dificuldades</SelectItem>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ações</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterStatus('all');
                    setFilterDifficulty('all');
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Atividades */}
      {filteredMissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma atividade encontrada</h3>
            <p className="text-sm text-muted-foreground text-center">
              {missions.length === 0
                ? "Você ainda não tem atividades disponíveis. Entre em contato com seu professor para receber missões."
                : "Tente ajustar os filtros para encontrar as atividades desejadas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMissions.map((mission) => (
            <Card key={mission.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {missionTypeIcons[mission.type]}
                    <CardTitle className="text-base">{mission.title}</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {mission.reward_points} pts
                  </Badge>
                </div>
                {mission.description && (
                  <CardDescription className="mt-1">
                    {mission.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    {missionTypeLabels[mission.type]}
                  </Badge>
                  {mission.difficulty && (
                    <Badge className={getDifficultyColor(mission.difficulty)}>
                      {getDifficultyLabel(mission.difficulty)}
                    </Badge>
                  )}
                  <Badge variant={mission.status === 'active' ? 'default' : 'secondary'}>
                    {mission.status === 'active' ? 'Ativa' : 'Completa'}
                  </Badge>
                </div>

                {mission.estimatedDuration && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{mission.estimatedDuration} min</span>
                  </div>
                )}

                {mission.topics && mission.topics.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    <span>{mission.topics.length} tópicos</span>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => handleStartActivity(mission)}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {mission.status === 'active' ? 'Iniciar Atividade' : 'Revisar'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
