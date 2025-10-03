import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { Loader2, Clock, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  ClassActivityRecord,
  ActivityAttemptRecord,
  getClassActivity,
  getLatestActivityAttempt,
  createActivityAttempt,
  updateActivityAttempt,
  getCurrentUser,
  addPointsToUser,
  createNotification,
} from '@/integrations/pocketbase/client';

interface ActivityPlayerProps {
  activityId: string;
  onComplete?: (attempt: ActivityAttemptRecord) => void;
  onError?: (error: Error) => void;
}

export const ActivityPlayer = ({ activityId, onComplete, onError }: ActivityPlayerProps) => {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ClassActivityRecord | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<ActivityAttemptRecord | null>(null);
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  // Timer
  useEffect(() => {
    if (!startTime || submitted) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setTimeElapsed(elapsed);

      // Check time limit
      if (activity?.time_limit && elapsed >= activity.time_limit * 60) {
        handleTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, submitted, activity?.time_limit]);

  // Load activity and check for existing attempt
  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Load activity
      const activityData = await getClassActivity(activityId);
      if (!activityData) {
        throw new Error('Atividade não encontrada');
      }

      setActivity(activityData);

      // Check for existing attempt
      const latestAttempt = await getLatestActivityAttempt(activityId, currentUser.id);
      
      if (latestAttempt && latestAttempt.status === 'in_progress') {
        // Continue existing attempt
        setCurrentAttempt(latestAttempt);
        initializeSurvey(activityData, latestAttempt);
      } else if (latestAttempt && latestAttempt.status === 'completed') {
        // Check if can start new attempt
        const attemptCount = await countUserAttempts(activityId, currentUser.id);
        if (activityData.max_attempts && attemptCount >= activityData.max_attempts) {
          toast.error('Você já atingiu o número máximo de tentativas para esta atividade');
          setSubmitted(true);
          setLoading(false);
          return;
        }
        // Ready to start new attempt
        initializeSurvey(activityData, null);
      } else {
        // First attempt
        initializeSurvey(activityData, null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar atividade:', error);
      toast.error('Não foi possível carregar a atividade');
      onError?.(error as Error);
      setLoading(false);
    }
  };

  const countUserAttempts = async (activityId: string, studentId: string): Promise<number> => {
    try {
      const attempts = await getLatestActivityAttempt(activityId, studentId);
      return attempts ? 1 : 0; // Simplified - would need a proper count function
    } catch {
      return 0;
    }
  };

  const initializeSurvey = (activityData: ClassActivityRecord, existingAttempt: ActivityAttemptRecord | null) => {
    const survey = new Model(activityData.survey_json);
    
    // Load existing answers if continuing
    if (existingAttempt?.answers) {
      survey.data = existingAttempt.answers;
    }

    // Configure survey
    survey.showCompletedPage = false;
    survey.showProgressBar = 'top';
    survey.progressBarType = 'pages';
    
    // Handle completion
    survey.onComplete.add(handleSurveyComplete);

    setSurveyModel(survey);
  };

  const handleStartAttempt = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const attempt = await createActivityAttempt(activityId, currentUser.id);
      if (!attempt) {
        throw new Error('Não foi possível iniciar a atividade');
      }

      setCurrentAttempt(attempt);
      setStartTime(new Date());
      toast.success('Atividade iniciada! Boa sorte! 🚀');
    } catch (error) {
      console.error('Erro ao iniciar tentativa:', error);
      toast.error('Não foi possível iniciar a atividade');
    }
  };

  const handleSurveyComplete = async (sender: Model) => {
    if (submitted || !currentAttempt) return;

    setSubmitted(true);
    const answers = sender.data;
    const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;

    try {
      // Calculate score
      let score = 0;
      let maxScore = 0;

      // For quizzes with correct answers, calculate score
      if (activity?.activity_type === 'quiz') {
        sender.getAllQuestions().forEach((question) => {
          maxScore += 1;
          const correctAnswer = question.correctAnswer;
          const userAnswer = sender.getValue(question.name);

          if (correctAnswer !== undefined && correctAnswer === userAnswer) {
            score += 1;
          }
        });
      }

      // Update attempt
      const updatedAttempt = await updateActivityAttempt(currentAttempt.id, {
        answers,
        score: maxScore > 0 ? score : undefined,
        maxScore: maxScore > 0 ? maxScore : undefined,
        timeSpent: timeSpent,
        status: 'completed',
      });

      if (!updatedAttempt) {
        throw new Error('Erro ao salvar respostas');
      }

      // Award points if configured
      if (activity.reward_points && activity.reward_points > 0) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          await addPointsToUser(currentUser.id, activity.reward_points);
          
          // Send notification to student
          await createNotification({
            recipientId: currentUser.id,
            senderId: activity.teacher, // Teacher is the sender
            title: 'Atividade Concluída! 🎉',
            content: `Parabéns! Você completou "${activity.title}" e ganhou ${activity.reward_points} pontos!`,
            type: 'achievement',
            metadata: {
              activity_id: activity.id,
              activity_title: activity.title,
              points_earned: activity.reward_points,
              score: score,
              max_score: maxScore,
            },
          });

          toast.success(`Atividade concluída! Você ganhou ${activity.reward_points} pontos! 🎉`);
        }
      } else {
        toast.success('Atividade concluída com sucesso! 🎉');
      }

      onComplete?.(updatedAttempt);
    } catch (error) {
      console.error('Erro ao finalizar atividade:', error);
      toast.error('Erro ao salvar suas respostas. Tente novamente.');
      setSubmitted(false);
    }
  };

  const handleTimeUp = async () => {
    if (submitted || !currentAttempt || !surveyModel) return;

    setSubmitted(true);
    toast.warning('Tempo esgotado! Suas respostas serão salvas automaticamente.');

    const answers = surveyModel.data;
    const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;

    try {
      await updateActivityAttempt(currentAttempt.id, {
        answers,
        timeSpent: timeSpent,
        status: 'completed',
      });

      onComplete?.(currentAttempt);
    } catch (error) {
      console.error('Erro ao salvar tentativa:', error);
      toast.error('Erro ao salvar suas respostas');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activity) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>Atividade não encontrada ou você não tem permissão para acessá-la.</AlertDescription>
      </Alert>
    );
  }

  // Show start screen if no attempt started
  if (!currentAttempt) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{activity.title}</CardTitle>
              <CardDescription className="mt-2">{activity.description}</CardDescription>
            </div>
            <Badge variant="outline" className="h-fit">
              {activity.activity_type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activity info */}
          <div className="grid gap-4 sm:grid-cols-3">
            {activity.reward_points && activity.reward_points > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Pontos</p>
                  <p className="text-2xl font-bold">{activity.reward_points}</p>
                </div>
              </div>
            )}

            {activity.max_attempts && (
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                <div className="p-2 rounded-full bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tentativas</p>
                  <p className="text-2xl font-bold">{activity.max_attempts}</p>
                </div>
              </div>
            )}

            {activity.time_limit && activity.time_limit > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tempo Limite</p>
                  <p className="text-2xl font-bold">{activity.time_limit} min</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Instruções</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Leia cada pergunta com atenção antes de responder</li>
                <li>Você pode navegar entre as páginas usando os botões</li>
                {activity.time_limit && activity.time_limit > 0 && (
                  <li>⏱️ Você terá {activity.time_limit} minutos para completar</li>
                )}
                {activity.max_attempts && (
                  <li>📝 Você tem {activity.max_attempts} tentativas disponíveis</li>
                )}
                <li>Clique em "Finalizar" quando terminar todas as perguntas</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Start button */}
          <Button onClick={handleStartAttempt} size="lg" className="w-full">
            Iniciar Atividade
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show completed screen
  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Atividade Concluída!
          </CardTitle>
          <CardDescription>Suas respostas foram salvas com sucesso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentAttempt.score !== undefined && currentAttempt.max_score !== undefined && (
            <div className="p-6 rounded-lg border bg-gradient-to-br from-primary/5 to-purple-500/5">
              <p className="text-sm text-muted-foreground mb-2">Sua pontuação:</p>
              <p className="text-4xl font-bold">
                {currentAttempt.score} / {currentAttempt.max_score}
              </p>
              <p className="text-lg text-muted-foreground mt-1">
                {Math.round((currentAttempt.score / currentAttempt.max_score) * 100)}%
              </p>
            </div>
          )}

          {currentAttempt.time_spent !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Tempo gasto: {formatTime(currentAttempt.time_spent)}</span>
            </div>
          )}

          {activity.reward_points && activity.reward_points > 0 && (
            <div className="flex items-center gap-2 text-amber-600">
              <Award className="h-4 w-4" />
              <span>Você ganhou {activity.reward_points} pontos!</span>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => navigate(`/activity/${activityId}/results`)}
              className="flex-1"
            >
              Ver Resultados Completos
            </Button>
            {onComplete && currentAttempt && (
              <Button onClick={() => onComplete(currentAttempt)} className="flex-1">
                Voltar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show survey
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{activity.title}</CardTitle>
            <CardDescription>{activity.description}</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {activity.time_limit && activity.time_limit > 0 && (
              <Badge variant={timeElapsed >= activity.time_limit * 60 * 0.8 ? 'destructive' : 'secondary'}>
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(activity.time_limit * 60 - timeElapsed)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {surveyModel && <Survey model={surveyModel} />}
      </CardContent>
    </Card>
  );
};
