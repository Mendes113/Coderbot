import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Save, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react';
import { ActivityType, createClassActivity } from '@/integrations/pocketbase/client';

const activityTypeLabels: Record<ActivityType, string> = {
  quiz: 'Quiz',
  survey: 'Pesquisa',
  form: 'Formulário',
  poll: 'Enquete',
};

const activityTypeDescriptions: Record<ActivityType, string> = {
  quiz: 'Questionário com pontuação automática',
  survey: 'Pesquisa de opinião sem pontuação',
  form: 'Formulário de coleta de dados',
  poll: 'Votação rápida em opções',
};

const CreateActivity: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('quiz');
  const [rewardPoints, setRewardPoints] = useState(100);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [timeLimit, setTimeLimit] = useState(0);
  const [surveyCreator, setSurveyCreator] = useState<SurveyCreator | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Inicializar SurveyJS Creator
  useEffect(() => {
    const options = {
      showLogicTab: true,
      showTranslationTab: false,
      isAutoSave: false,
      showSurveyTitle: true,
    };
    const creator = new SurveyCreator(options);
    creator.text = JSON.stringify({
      title: 'Nova Atividade',
      description: 'Descreva sua atividade aqui',
      pages: [
        {
          name: 'page1',
          elements: [
            {
              type: 'radiogroup',
              name: 'question1',
              title: 'Qual é a resposta correta?',
              isRequired: true,
              choices: [
                { value: 'option1', text: 'Opção 1' },
                { value: 'option2', text: 'Opção 2' },
                { value: 'option3', text: 'Opção 3' },
              ],
              correctAnswer: 'option1',
            },
          ],
        },
      ],
    });
    setSurveyCreator(creator);
  }, []);

  const handleSubmit = async () => {
    if (!classId) {
      toast.error('ID da turma não encontrado');
      return;
    }

    if (!title.trim()) {
      toast.error('Digite um título para a atividade');
      return;
    }

    if (!surveyCreator) {
      toast.error('Erro ao inicializar o editor');
      return;
    }

    if (rewardPoints < 0) {
      toast.error('Os pontos de recompensa não podem ser negativos');
      return;
    }

    if (maxAttempts < 1) {
      toast.error('O número de tentativas deve ser pelo menos 1');
      return;
    }

    setSubmitting(true);

    try {
      const surveyJson = JSON.parse(surveyCreator.text);

      await createClassActivity({
        classId,
        title: title.trim(),
        description: description.trim() || 'Atividade interativa',
        activityType: activityType,
        surveyJson: surveyJson,
        rewardPoints: rewardPoints,
        maxAttempts: maxAttempts,
        timeLimit: timeLimit > 0 ? timeLimit : undefined,
      });

      toast.success('Atividade criada com sucesso!');
      navigate(`/class/${classId}`);
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      toast.error('Não foi possível criar a atividade. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!classId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
        <Alert variant="destructive">
          <AlertDescription>ID da turma não fornecido</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/class/${classId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Criar Nova Atividade</h1>
            <p className="text-muted-foreground">
              Configure e crie quizzes, pesquisas ou formulários interativos
            </p>
          </div>
        </div>

        {/* Configurações da Atividade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Configurações da Atividade
            </CardTitle>
            <CardDescription>
              Defina as propriedades básicas da sua atividade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Quiz de Matemática - Álgebra Linear"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={submitting}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo desta atividade..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                disabled={submitting}
                rows={3}
              />
            </div>

            {/* Grid de Configurações */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="activity-type">Tipo *</Label>
                <Select value={activityType} onValueChange={(value) => setActivityType(value as ActivityType)}>
                  <SelectTrigger id="activity-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(activityTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{label}</span>
                          <span className="text-xs text-muted-foreground">
                            {activityTypeDescriptions[value as ActivityType]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pontos */}
              <div className="space-y-2">
                <Label htmlFor="reward-points">Pontos de Recompensa</Label>
                <Input
                  id="reward-points"
                  type="number"
                  min="0"
                  step="10"
                  value={rewardPoints}
                  onChange={(e) => setRewardPoints(parseInt(e.target.value) || 0)}
                  disabled={submitting}
                />
              </div>

              {/* Tentativas */}
              <div className="space-y-2">
                <Label htmlFor="max-attempts">Máximo de Tentativas</Label>
                <Input
                  id="max-attempts"
                  type="number"
                  min="1"
                  max="10"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                  disabled={submitting}
                />
              </div>

              {/* Tempo Limite */}
              <div className="space-y-2">
                <Label htmlFor="time-limit">Tempo Limite (min)</Label>
                <Input
                  id="time-limit"
                  type="number"
                  min="0"
                  step="5"
                  placeholder="0 = sem limite"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                  disabled={submitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editor SurveyJS - Fullscreen */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Editor de Perguntas</CardTitle>
            <CardDescription>
              Crie e configure as perguntas da sua atividade. Use o editor visual para adicionar diferentes tipos de questões.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {surveyCreator && (
              <div className="min-h-[600px]">
                <SurveyCreatorComponent creator={surveyCreator} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-4 pb-8">
          <Button
            variant="outline"
            onClick={() => navigate(`/class/${classId}`)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} size="lg">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Criar Atividade
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateActivity;
