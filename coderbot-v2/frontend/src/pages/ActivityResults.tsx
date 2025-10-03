import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Clock,
  Award,
  Trophy,
  CheckCircle,
  Calendar,
  User,
  TrendingUp,
  Target,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import {
  getCurrentUser,
  ClassActivityRecord,
  ActivityAttemptRecord,
  getClassActivity,
  getStudentActivityAttempts,
  pb,
} from "@/integrations/pocketbase/client";

// Interface para estatísticas de tentativa
interface AttemptStats {
  attempt: ActivityAttemptRecord;
  studentName: string;
  percentage: number;
}

// Interface para estatísticas gerais
interface ActivityStats {
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  averageTime: number;
  highestScore: number;
  lowestScore: number;
  students: AttemptStats[];
}

const ActivityResults: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ClassActivityRecord | null>(null);
  const [myAttempts, setMyAttempts] = useState<ActivityAttemptRecord[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<ActivityAttemptRecord | null>(null);
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  // Verificar se usuário é professor
  useEffect(() => {
    if (currentUser && activity) {
      setIsTeacher(currentUser.id === activity.teacher);
    }
  }, [currentUser, activity]);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, [activityId, currentUser]);

  const loadData = async () => {
    if (!activityId || !currentUser) {
      toast.error("Atividade ou usuário não encontrado");
      navigate(-1);
      return;
    }

    try {
      setLoading(true);

      // Carregar atividade
      const activityData = await getClassActivity(activityId);
      if (!activityData) {
        toast.error("Atividade não encontrada");
        navigate(-1);
        return;
      }
      setActivity(activityData);

      // Se for estudante, carregar apenas suas tentativas
      if (currentUser.role === "student") {
        const attempts = await getStudentActivityAttempts(activityId, currentUser.id);
        const completedAttempts = attempts.filter((a) => a.status === "completed");
        setMyAttempts(completedAttempts);

        // Selecionar última tentativa por padrão
        if (completedAttempts.length > 0) {
          setSelectedAttempt(completedAttempts[0]);
        }
      }

      // Se for professor, carregar estatísticas de todos os alunos
      if (currentUser.role === "teacher") {
        await loadTeacherStats(activityData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar resultados");
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherStats = async (activityData: ClassActivityRecord) => {
    try {
      // Buscar todas as tentativas da atividade
      const allAttempts = await pb
        .collection("activity_attempts")
        .getFullList<ActivityAttemptRecord>({
          filter: `activity = "${activityData.id}"`,
          sort: "-created",
          expand: "student",
        });

      if (allAttempts.length === 0) {
        setStats({
          totalAttempts: 0,
          completedAttempts: 0,
          averageScore: 0,
          averageTime: 0,
          highestScore: 0,
          lowestScore: 0,
          students: [],
        });
        return;
      }

      // Filtrar apenas tentativas completas
      const completedAttempts = allAttempts.filter((a) => a.status === "completed");

      // Agrupar por aluno (pegar melhor tentativa de cada)
      const studentBestAttempts = new Map<string, ActivityAttemptRecord>();
      completedAttempts.forEach((attempt) => {
        const existing = studentBestAttempts.get(attempt.student);
        if (!existing || attempt.score > existing.score) {
          studentBestAttempts.set(attempt.student, attempt);
        }
      });

      // Calcular estatísticas
      const scores = completedAttempts.map((a) => a.score);
      const times = completedAttempts.map((a) => a.timeSpent);

      const totalScore = scores.reduce((sum, s) => sum + s, 0);
      const totalTime = times.reduce((sum, t) => sum + t, 0);

      // Preparar dados dos alunos
      const studentsData: AttemptStats[] = Array.from(studentBestAttempts.values()).map(
        (attempt) => {
          const studentName =
            (attempt.expand?.student as any)?.name || "Aluno desconhecido";
          const percentage = (attempt.score / attempt.maxScore) * 100;
          return {
            attempt,
            studentName,
            percentage,
          };
        }
      );

      // Ordenar por score (maior primeiro)
      studentsData.sort((a, b) => b.attempt.score - a.attempt.score);

      setStats({
        totalAttempts: allAttempts.length,
        completedAttempts: completedAttempts.length,
        averageScore: completedAttempts.length > 0 ? totalScore / completedAttempts.length : 0,
        averageTime: completedAttempts.length > 0 ? totalTime / completedAttempts.length : 0,
        highestScore: Math.max(...scores, 0),
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
        students: studentsData,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      toast.error("Erro ao carregar estatísticas da turma");
    }
  };

  // Carregar survey para revisão
  const loadAttemptSurvey = (attempt: ActivityAttemptRecord) => {
    if (!activity) return;

    try {
      const model = new Model(activity.surveyJson);
      model.mode = "display"; // Modo somente leitura
      model.data = attempt.answers;
      setSurveyModel(model);
      setSelectedAttempt(attempt);
    } catch (error) {
      console.error("Erro ao carregar survey:", error);
      toast.error("Erro ao carregar respostas");
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!activityId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
        <Alert variant="destructive">
          <AlertDescription>ID da atividade não fornecido</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
        <Alert variant="destructive">
          <AlertDescription>Atividade não encontrada</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ==================== VISUALIZAÇÃO DO ESTUDANTE ====================
  if (currentUser?.role === "student") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{activity.title}</h1>
              <p className="text-muted-foreground">Meus Resultados</p>
            </div>
          </div>

          {/* Resumo das tentativas */}
          {myAttempts.length === 0 ? (
            <Alert>
              <AlertDescription>
                Você ainda não completou esta atividade.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Cards de estatísticas gerais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Tentativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{myAttempts.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {activity.maxAttempts
                        ? `de ${activity.maxAttempts} permitidas`
                        : "ilimitadas"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Melhor Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.max(...myAttempts.map((a) => a.score))} /{" "}
                      {myAttempts[0].maxScore}
                    </div>
                    <Progress
                      value={
                        (Math.max(...myAttempts.map((a) => a.score)) /
                          myAttempts[0].maxScore) *
                        100
                      }
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      Pontos Ganhos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {activity.rewardPoints}
                      <span className="text-sm text-muted-foreground ml-1">pts</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ao completar
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de tentativas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Histórico de Tentativas
                  </CardTitle>
                  <CardDescription>
                    Clique em uma tentativa para revisar suas respostas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myAttempts.map((attempt, index) => {
                    const percentage = (attempt.score / attempt.maxScore) * 100;
                    const isSelected = selectedAttempt?.id === attempt.id;

                    return (
                      <div
                        key={attempt.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                        }`}
                        onClick={() => loadAttemptSurvey(attempt)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                percentage >= 70 ? "default" : "secondary"
                              }
                            >
                              Tentativa {myAttempts.length - index}
                            </Badge>
                            <span className="text-2xl font-bold">
                              {attempt.score} / {attempt.maxScore}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(attempt.timeSpent)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(attempt.completedAt || attempt.created)}
                            </span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Revisão da tentativa selecionada */}
              {selectedAttempt && surveyModel && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Revisão de Respostas
                    </CardTitle>
                    <CardDescription>
                      Tentativa de {formatDate(selectedAttempt.completedAt || selectedAttempt.created)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Survey model={surveyModel} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ==================== VISUALIZAÇÃO DO PROFESSOR ====================
  if (isTeacher && stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{activity.title}</h1>
              <p className="text-muted-foreground">Estatísticas da Turma</p>
            </div>
          </div>

          {/* Estatísticas gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Participação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.students.length}</div>
                <p className="text-xs text-muted-foreground">
                  alunos completaram
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalAttempts} tentativas totais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Média da Turma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageScore.toFixed(1)}
                </div>
                <Progress
                  value={(stats.averageScore / activity.rewardPoints) * 100}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  de {activity.rewardPoints} pontos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Melhor / Pior
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.highestScore} / {stats.lowestScore}
                </div>
                <p className="text-xs text-muted-foreground">
                  maior e menor score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Tempo Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(Math.round(stats.averageTime))}
                </div>
                <p className="text-xs text-muted-foreground">
                  tempo de conclusão
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ranking de alunos */}
          {stats.students.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum aluno completou esta atividade ainda.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ranking de Alunos
                </CardTitle>
                <CardDescription>
                  Melhor tentativa de cada aluno
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.students.map((studentData, index) => {
                    const { attempt, studentName, percentage } = studentData;
                    const medal =
                      index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";

                    return (
                      <div
                        key={attempt.id}
                        className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{medal || `#${index + 1}`}</span>
                            <div>
                              <div className="font-semibold">{studentName}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(attempt.timeSpent)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(attempt.completedAt || attempt.created)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {attempt.score} / {attempt.maxScore}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <Alert variant="destructive">
        <AlertDescription>Acesso não autorizado</AlertDescription>
      </Alert>
    </div>
  );
};

export default ActivityResults;
