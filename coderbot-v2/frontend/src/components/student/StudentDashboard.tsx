import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { joinClassByCode, listClassEvents, listMyClasses } from "@/integrations/pocketbase/client";
import type { ClassEvent } from "@/integrations/pocketbase/client";

type StudentClass = {
  membershipId?: string;
  classId: string;
  title: string;
  description?: string;
  teacherName?: string;
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
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [classSummaries, setClassSummaries] = useState<Record<string, ClassSummaryState>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [joining, setJoining] = useState<boolean>(false);
  const [joinFeedback, setJoinFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
    if (!query) return classes;
    return classes.filter((cls) => {
      const haystack = [cls.title, cls.description, cls.teacherName].filter(Boolean) as string[];
      return haystack.some((field) => field.toLowerCase().includes(query));
    });
  }, [classes, filterQuery]);

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
          Minhas Turmas
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Filtrar por turma, professor ou descrição..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-72"
          />
          <Button variant="outline" onClick={() => loadMyClasses()} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
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
                      ID {cls.classId}
                    </Badge>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

