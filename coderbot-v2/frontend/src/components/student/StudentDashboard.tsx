import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  School,
  RefreshCw,
  Info,
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  SortDesc,
  Target,
  Trophy,
  TrendingUp,
  Play,
  Star,
  Code,
  Music,
  BookOpen,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  joinClassByCode,
  listClassEvents,
  listMyClasses,
  getLastInteractionsForClasses,
  getCurrentUser,
  getStudentMissionProgress,
} from "@/integrations/pocketbase/client";
import { useMissions, type Mission } from "@/hooks/useMissions";
import { useActivityProgress } from "@/hooks/useActivityProgress";
import type { ClassEvent } from "@/integrations/pocketbase/client";

type StudentClass = {
  membershipId?: string;
  classId: string;
  title: string;
  description?: string;
  teacherName?: string;
};

type MissionProgress = {
  missionId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  isCompleted: boolean;
  isInProgress: boolean;
};

type UpcomingEvent = {
  id: string;
  title: string;
  startsAt: string;
  type?: string;
};

type ClassMetrics = {
  totalEvents: number;
  dueSoon: number;
  overdue: number;
  upcoming?: UpcomingEvent;
  typeCounts: Record<string, number>;
};

type ClassSummaryState =
  | { status: "loading" }
  | { status: "ready"; metrics: ClassMetrics }
  | { status: "error"; error: string };

const EVENT_TYPE_LABELS: Record<string, string> = {
  assignment: "Atividade",
  exam: "Avaliação",
  exercise: "Exercício",
  lecture: "Aula",
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getEventTypeLabel(type?: string): string {
  if (!type) return "Evento";
  return EVENT_TYPE_LABELS[type as keyof typeof EVENT_TYPE_LABELS] ?? "Evento";
}

function formatDateTime(value?: string): string | null {
  const date = parseDate(value);
  if (!date) return null;
  return dateTimeFormatter.format(date);
}

function formatRelativeTime(value?: string): string | null {
  const date = parseDate(value);
  if (!date) return null;
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes === 0) return "agora";
  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes > 0
      ? `em ${diffMinutes} min`
      : `há ${Math.abs(diffMinutes)} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `em ${diffHours} h` : `há ${Math.abs(diffHours)} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return diffDays > 0
    ? `em ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`
    : `há ${Math.abs(diffDays)} dias`;
}

function computeClassMetrics(events: ClassEvent[]): ClassMetrics {
  const now = Date.now();
  const dueSoonThresholdMs = 1000 * 60 * 60 * 48; // 48 horas
  let dueSoon = 0;
  let overdue = 0;
  const typeCounts: Record<string, number> = {};
  const futureEvents: { event: ClassEvent; timestamp: number }[] = [];

  for (const event of events) {
    const typeKey = event?.type ?? "outros";
    typeCounts[typeKey] = (typeCounts[typeKey] ?? 0) + 1;

    const start = parseDate(event?.starts_at);
    const end = parseDate(event?.ends_at);
    const reference = start ?? end;
    if (!reference) continue;

    const ts = reference.getTime();
    if (ts >= now) {
      if (ts - now <= dueSoonThresholdMs) {
        dueSoon += 1;
      }
      futureEvents.push({ event, timestamp: ts });
    } else {
      overdue += 1;
    }
  }

  futureEvents.sort((a, b) => a.timestamp - b.timestamp);
  const next = futureEvents[0];

  return {
    totalEvents: events.length,
    dueSoon,
    overdue,
    upcoming: next
      ? {
          id: next.event.id,
          title: next.event.title,
          startsAt: next.event.starts_at ?? new Date(next.timestamp).toISOString(),
          type: next.event.type,
        }
      : undefined,
    typeCounts,
  };
}

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [classSummaries, setClassSummaries] = useState<Record<string, ClassSummaryState>>({});
  const [classInteractions, setClassInteractions] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [sortByInteraction, setSortByInteraction] = useState<boolean>(false);
  const [joinCode, setJoinCode] = useState<string>("");
  const [joining, setJoining] = useState<boolean>(false);
  const [joinFeedback, setJoinFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("classes");
  const [missionProgress, setMissionProgress] = useState<Map<string, MissionProgress>>(new Map());

  // Hook para buscar missões de todas as turmas
  const { missions, isLoading: missionsLoading, error: missionsError } = useMissions({
    status: 'active',
    autoFetch: true
  });

  // Função para carregar progresso das missões
  const loadMissionProgress = async () => {
    if (missions.length === 0) return;

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const progressPromises = missions.map(async (mission) => {
        const progress = await getStudentMissionProgress(mission.id, currentUser.id);

        const currentValue = progress?.current_value || 0;
        const targetValue = mission.target_value;
        const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;

        return {
          missionId: mission.id,
          currentValue,
          targetValue,
          percentage,
          isCompleted: progress?.status === 'completed' || percentage >= 100,
          isInProgress: progress?.status === 'in_progress' && !progress?.completed_at,
        };
      });

      const progressResults = await Promise.all(progressPromises);
      const progressMap = new Map();

      progressResults.forEach((progress) => {
        progressMap.set(progress.missionId, progress);
      });

      setMissionProgress(progressMap);
    } catch (error) {
      console.error('Erro ao carregar progresso das missões:', error);
    }
  };

  // Carregar progresso quando as missões forem carregadas
  useEffect(() => {
    if (missions.length > 0) {
      loadMissionProgress();
    }
  }, [missions]);

  // Função helper para obter progresso de uma missão
  const getMissionProgress = (missionId: string): MissionProgress | null => {
    return missionProgress.get(missionId) || null;
  };

  // Função helper para obter o nome da classe de uma missão
  const getMissionClassName = (mission: Mission): string => {
    if (mission.expand?.class?.title) {
      return mission.expand.class.title;
    }
    if (mission.expand?.class?.name) {
      return mission.expand.class.name;
    }
    return 'Turma';
  };

  const loadMyClasses = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);
    setError("");

    try {
      const list = await listMyClasses();
      const deduped = new Map<string, StudentClass>();

      (Array.isArray(list) ? list : []).forEach((membership: any) => {
        const classRecord =
          (membership?.expand && membership.expand.class)
            ? membership.expand.class
            : typeof membership?.class === "object"
            ? membership.class
            : null;

        const classId =
          typeof membership?.class === "string"
            ? membership.class
            : classRecord?.id ?? membership?.id;

        if (!classId) {
          return;
        }

        const teacherData = (classRecord?.expand?.teacher ?? classRecord?.teacher) as any;
        const teacherName =
          typeof teacherData === "string"
            ? undefined
            : teacherData?.name ?? teacherData?.full_name ?? teacherData?.email;

        const studentClass: StudentClass = {
          membershipId: membership?.id,
          classId,
          title: classRecord?.title ?? classRecord?.name ?? membership?.title ?? "Turma",
          description: classRecord?.description ?? "",
          teacherName,
        };

        if (!deduped.has(classId)) {
          deduped.set(classId, studentClass);
        }
      });

      setClasses(Array.from(deduped.values()));
    } catch (err) {
      console.error("Erro ao carregar turmas do estudante", err);
      setError("Não foi possível carregar suas turmas.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadMyClasses();
  }, []);

  useEffect(() => {
    if (!joinFeedback) return;
    const timer = window.setTimeout(() => setJoinFeedback(null), 6000);
    return () => window.clearTimeout(timer);
  }, [joinFeedback]);

  useEffect(() => {
    let cancelled = false;

    if (!classes.length) {
      setClassSummaries({});
      return () => {
        cancelled = true;
      };
    }

    const initialState: Record<string, ClassSummaryState> = {};
    classes.forEach((cls) => {
      initialState[cls.classId] = { status: "loading" };
    });
    setClassSummaries(initialState);

    classes.forEach((cls) => {
      listClassEvents(cls.classId)
        .then((events) => {
          if (cancelled) return;
          const metrics = computeClassMetrics(events);
          setClassSummaries((prev) => ({
            ...prev,
            [cls.classId]: { status: "ready", metrics },
          }));
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("Erro ao buscar eventos da turma", cls.classId, err);
          const message = err?.response?.data?.detail ?? "Não foi possível carregar as atividades dessa turma agora.";
          setClassSummaries((prev) => ({
            ...prev,
            [cls.classId]: { status: "error", error: message },
          }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [classes]);

  // Load user interactions for sorting
  useEffect(() => {
    if (!currentUser || classes.length === 0 || !sortByInteraction) {
      return;
    }

    const classIds = classes.map(cls => cls.classId);
    getLastInteractionsForClasses((currentUser as any).id, classIds)
      .then(interactions => {
        setClassInteractions(interactions);
      })
      .catch(err => {
        console.error('Erro ao buscar interações:', err);
      });
  }, [currentUser, classes, sortByInteraction]);

  // Funções auxiliares para as atividades
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

  const handleJoinClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = joinCode.trim();
    if (!code) {
      setJoinFeedback({ type: "error", message: "Informe um código antes de continuar." });
      return;
    }

    setJoining(true);
    setJoinFeedback(null);

    try {
      await joinClassByCode(code);
      setJoinFeedback({ type: "success", message: "Código aceito! Atualizamos suas turmas." });
      setJoinCode("");
      await loadMyClasses({ silent: true });
    } catch (err: any) {
      console.error("Erro ao ingressar na turma via código", err);
      let message = "Não foi possível entrar na turma. Verifique o código e tente novamente.";
      if (err instanceof Error && err.message === "EMPTY_CODE") {
        message = "Informe um código antes de continuar.";
      } else if (err?.response?.status === 400) {
        message = err?.response?.data?.detail ?? "Código inválido ou expirado.";
      } else if (err?.response?.status === 403) {
        message = "Você não possui permissão para entrar nessa turma.";
      } else if (err?.response?.status === 404) {
        message = "Nenhuma turma encontrada para este código.";
      }
      setJoinFeedback({ type: "error", message });
    } finally {
      setJoining(false);
    }
  };

  const filtered = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    let result = query 
      ? classes.filter((cls) => {
          const haystack = [cls.title, cls.description, cls.teacherName].filter(Boolean) as string[];
          return haystack.some((field) => field.toLowerCase().includes(query));
        })
      : [...classes];

    // Apply sorting by interaction if enabled
    if (sortByInteraction) {
      result.sort((a, b) => {
        const aLastInteraction = classInteractions[a.classId];
        const bLastInteraction = classInteractions[b.classId];
        
        // Classes with no interaction go to the end
        if (!aLastInteraction && !bLastInteraction) return 0;
        if (!aLastInteraction) return 1;
        if (!bLastInteraction) return -1;

        // Sort by most recent interaction first
        return new Date(bLastInteraction).getTime() - new Date(aLastInteraction).getTime();
      });
    }

    return result;
  }, [classes, filterQuery, sortByInteraction, classInteractions]);

  const renderSummary = (state: ClassSummaryState | undefined) => {
    if (!state || state.status === "loading") {
      return (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-muted-foreground/30 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando cronograma...
        </div>
      );
    }

    if (state.status === "error") {
      return (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar as atividades</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      );
    }

    const { metrics } = state;
    const upcoming = metrics.upcoming;
    const formattedDate = formatDateTime(upcoming?.startsAt);
    const relative = formatRelativeTime(upcoming?.startsAt);

    const typeBadges = Object.entries(metrics.typeCounts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-education-primary">
            <CalendarDays className="h-4 w-4" />
            Próxima atividade
          </div>
          {upcoming ? (
            <>
              <div className="text-base font-semibold leading-snug">{upcoming.title || "Atividade sem título"}</div>
              <div className="text-sm text-muted-foreground">
                {getEventTypeLabel(upcoming.type)} • {formattedDate ?? "data a definir"}
                {relative ? ` (${relative})` : ""}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Assim que o professor publicar um evento ou atividade, ele aparece aqui.
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Atividades
            </div>
            <div className="mt-2 text-xl font-semibold">{metrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">planejadas</p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Em 48 horas
            </div>
            <div className="mt-2 text-xl font-semibold text-education-primary">{metrics.dueSoon}</div>
            <p className="text-xs text-muted-foreground">prazo próximo</p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              Atrasadas
            </div>
            <div className="mt-2 text-xl font-semibold text-destructive">{metrics.overdue}</div>
            <p className="text-xs text-muted-foreground">precisam de atenção</p>
          </div>
        </div>

        {typeBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {typeBadges.map(([type, count]) => (
              <Badge key={type} variant="outline" className="bg-muted/40 font-normal">
                {getEventTypeLabel(type)}: {count}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <School className="h-7 w-7 text-education-primary" />
          Dashboard do Estudante
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => loadMyClasses()} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Minhas Turmas
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Minhas Atividades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Filtrar por turma, professor ou descrição..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-72"
              />
              <Button
                variant={sortByInteraction ? "default" : "outline"}
                onClick={() => setSortByInteraction(!sortByInteraction)}
                className="gap-2"
              >
                <SortDesc className="h-4 w-4" />
                {sortByInteraction ? "Ordenado por interação" : "Ordenar por interação"}
              </Button>
            </div>
          </div>

          <Card className="max-w-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Entrar em uma nova turma</CardTitle>
              <CardDescription>
                Use o código compartilhado pelo professor para adicionar a turma ao seu painel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleJoinClass} className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Código da turma"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    maxLength={64}
                    className="sm:flex-1"
                    autoComplete="off"
                  />
                  <Button type="submit" disabled={joining} className="sm:w-auto">
                    {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar entrada"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O código diferencia maiúsculas e minúsculas e pode expirar conforme as regras definidas pelo professor.
                </p>
              </form>

              {joinFeedback && (
                <Alert variant={joinFeedback.type === "error" ? "destructive" : "default"}>
                  {joinFeedback.type === "error" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-education-primary" />
                  )}
                  <AlertTitle>
                    {joinFeedback.type === "error" ? "Não foi possível entrar" : "Tudo certo!"}
                  </AlertTitle>
                  <AlertDescription>{joinFeedback.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar turmas</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Carregando turmas...
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma turma encontrada</CardTitle>
                <CardDescription>
                  {classes.length === 0
                    ? "Você ainda não está inscrito em nenhuma turma. Utilize o código acima quando receber um convite."
                    : "Tente ajustar o filtro para encontrar a turma desejada."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((cls) => {
                const summaryState = classSummaries[cls.classId];
                return (
                  <Card key={cls.classId} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-lg font-semibold truncate">{cls.title}</CardTitle>
                      {cls.description && (
                        <CardDescription className="line-clamp-2">{cls.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">{renderSummary(summaryState)}</CardContent>
                    <CardFooter className="flex flex-col gap-3">
                      <div className="flex w-full gap-2">
                        <Button
                          onClick={() => navigate(`/class/${cls.classId}`)}
                          className="flex-1 gap-2"
                          variant="default"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Acessar Fórum
                        </Button>
                        <Button
                          onClick={() => navigate(`/class/${cls.classId}`)}
                          className="gap-2"
                          variant="outline"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex w-full flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Info className="h-3.5 w-3.5" />
                          {cls.teacherName ? `Professor: ${cls.teacherName}` : "Professor não definido"}
                        </span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {cls.classId}
                    </Badge>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Atividades</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{missions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Missões disponíveis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ativas</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {missions.filter(m => m.status === 'active').length}
                  </div>
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
                  <div className="text-2xl font-bold text-green-600">
                    {missions.filter(m => m.status === 'completed').length}
                  </div>
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
                  <div className="text-2xl font-bold text-yellow-600">
                    {missions.reduce((sum, m) => sum + m.reward_points, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recompensas disponíveis
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Atividades */}
            {missionsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : missions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma atividade encontrada</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Você ainda não tem atividades disponíveis. Entre em contato com seu professor para receber missões.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {missions.map((mission) => (
                  <Card key={mission.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {missionTypeIcons[mission.type] || <Target className="h-4 w-4" />}
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
                          {missionTypeLabels[mission.type] || mission.type}
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

                      {/* Informações da turma */}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <School className="h-3 w-3" />
                        <span>{getMissionClassName(mission)}</span>
                      </div>

                      {mission.estimatedDuration && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{mission.estimatedDuration} min</span>
                        </div>
                      )}

                      {/* Barra de progresso */}
                      {(() => {
                        const progress = getMissionProgress(mission.id);
                        if (!progress) return null;

                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progresso</span>
                              <span className="font-medium">
                                {progress.currentValue}/{progress.targetValue}
                              </span>
                            </div>
                            <Progress
                              value={progress.percentage}
                              className={`h-2 ${progress.isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}
                            />
                            {progress.isCompleted && (
                              <div className="flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                <span>Concluída!</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

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
        </TabsContent>
      </Tabs>
    </div>
  );
};

