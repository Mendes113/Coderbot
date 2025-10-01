import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Target,
  Award,
  RefreshCw,
  Calendar,
  BookOpen,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, pb } from '@/integrations/pocketbase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClassMetrics {
  total_interactions: number;
  forum_interactions: number;
  chat_interactions: number;
  active_students: number;
  total_students: number;
  engagement_metrics: {
    avg_session_duration?: number;
    peak_hours?: number[];
    participation_rate?: number;
  };
  performance_metrics: {
    avg_quiz_score?: number;
    completion_rate?: number;
    improvement_trend?: 'up' | 'down' | 'stable';
  };
}

interface ClassAnalyticsData {
  classId: string;
  className: string;
  metrics: ClassMetrics;
  daily_data: Array<{
    date: string;
    interactions: number;
    forum_interactions: number;
    chat_interactions: number;
    active_students: number;
  }>;
  student_engagement: Array<{
    student_id: string;
    student_name: string;
    interactions: number;
    last_activity: string;
    engagement_score: number;
  }>;
  subject_breakdown: Array<{
    subject: string;
    interactions: number;
    students: number;
  }>;
}

interface ClassAnalyticsProps {
  classId?: string;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ClassAnalytics: React.FC<ClassAnalyticsProps> = ({ classId, className }) => {
  const [data, setData] = useState<ClassAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const user = getCurrentUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = subDays(endDate, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90);

      // Get forum interactions
      const forumInteractions = await pb.collection('forum_user_interactions').getFullList({
        filter: `class = "${classId}" && created >= "${startDate.toISOString()}"`,
        sort: 'created',
      });

      // Get chat interactions
      const chatInteractions = await pb.collection('chat_interactions').getFullList({
        filter: `class = "${classId}" && created >= "${startDate.toISOString()}"`,
        sort: 'created',
      });

      // Get daily class metrics if available
      const dailyMetrics = await pb.collection('daily_class_metrics').getFullList({
        filter: `class = "${classId}" && metric_date >= "${format(startDate, 'yyyy-MM-dd')}"`,
        sort: 'metric_date',
      });

      // Process data
      const totalInteractions = forumInteractions.length + chatInteractions.length;
      const uniqueStudents = new Set([
        ...forumInteractions.map(i => i.user),
        ...chatInteractions.map(i => i.user)
      ]).size;

      // Get class info
      const classInfo = await pb.collection('classes').getOne(classId);

      // Calculate daily data
      const dailyData = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayStart = startOfDay(d);
        const dayEnd = endOfDay(d);

        const dayForumInteractions = forumInteractions.filter(i => {
          const created = new Date(i.created);
          return created >= dayStart && created <= dayEnd;
        });

        const dayChatInteractions = chatInteractions.filter(i => {
          const created = new Date(i.created);
          return created >= dayStart && created <= dayEnd;
        });

        dailyData.push({
          date: dateStr,
          interactions: dayForumInteractions.length + dayChatInteractions.length,
          forum_interactions: dayForumInteractions.length,
          chat_interactions: dayChatInteractions.length,
          active_students: new Set([
            ...dayForumInteractions.map(i => i.user),
            ...dayChatInteractions.map(i => i.user)
          ]).size,
        });
      }

      // Calculate student engagement
      const studentStats = new Map();
      [...forumInteractions, ...chatInteractions].forEach(interaction => {
        const userId = interaction.user;
        if (!studentStats.has(userId)) {
          studentStats.set(userId, {
            interactions: 0,
            last_activity: interaction.created,
          });
        }
        studentStats.get(userId).interactions++;
        const interactionDate = new Date(interaction.created);
        const lastActivity = new Date(studentStats.get(userId).last_activity);
        if (interactionDate > lastActivity) {
          studentStats.get(userId).last_activity = interaction.created;
        }
      });

      const studentEngagement = Array.from(studentStats.entries()).map(([studentId, stats]) => ({
        student_id: studentId,
        student_name: `Aluno ${studentId.slice(-4)}`, // Simplified for demo
        interactions: stats.interactions,
        last_activity: stats.last_activity,
        engagement_score: Math.min(stats.interactions * 10, 100), // Simple scoring
      })).sort((a, b) => b.interactions - a.interactions);

      // Calculate subject breakdown
      const subjectStats = new Map();
      chatInteractions.forEach(interaction => {
        const subject = interaction.metadata?.subject || 'Não especificado';
        if (!subjectStats.has(subject)) {
          subjectStats.set(subject, { interactions: 0, students: new Set() });
        }
        subjectStats.get(subject).interactions++;
        subjectStats.get(subject).students.add(interaction.user);
      });

      const subjectBreakdown = Array.from(subjectStats.entries()).map(([subject, stats]) => ({
        subject,
        interactions: stats.interactions,
        students: stats.students.size,
      })).sort((a, b) => b.interactions - a.interactions);

      const analyticsData: ClassAnalyticsData = {
        classId,
        className: className || classInfo.name || 'Turma',
        metrics: {
          total_interactions: totalInteractions,
          forum_interactions: forumInteractions.length,
          chat_interactions: chatInteractions.length,
          active_students: uniqueStudents,
          total_students: classInfo.expand?.members?.length || 0,
          engagement_metrics: {
            participation_rate: uniqueStudents / (classInfo.expand?.members?.length || 1) * 100,
          },
          performance_metrics: {
            improvement_trend: 'stable', // Would need more complex calculation
          },
        },
        daily_data: dailyData,
        student_engagement: studentEngagement,
        subject_breakdown: subjectBreakdown,
      };

      setData(analyticsData);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  }, [classId, className, timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Dados não disponíveis</h3>
            <p className="text-muted-foreground">
              Não foi possível carregar os dados de analytics da turma.
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Analytics - {data.className}
          </h2>
          <p className="text-muted-foreground">
            Análise detalhada das interações e engajamento da turma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Interações</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.total_interactions}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.forum_interactions} fórum, {data.metrics.chat_interactions} chat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.active_students}</div>
            <p className="text-xs text-muted-foreground">
              de {data.metrics.total_students} alunos ({Math.round((data.metrics.active_students / data.metrics.total_students) * 100)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Participação</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.engagement_metrics.participation_rate?.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              alunos participando ativamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência</CardTitle>
            {data.metrics.performance_metrics.improvement_trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : data.metrics.performance_metrics.improvement_trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <Activity className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.performance_metrics.improvement_trend === 'up' ? '↗' :
               data.metrics.performance_metrics.improvement_trend === 'down' ? '↘' : '→'}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.performance_metrics.improvement_trend === 'up' ? 'Melhorando' :
               data.metrics.performance_metrics.improvement_trend === 'down' ? 'Declinando' : 'Estável'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Atividade Diária</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="subjects">Por Matéria</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interações ao Longo do Tempo</CardTitle>
              <CardDescription>
                Número de interações no fórum e chat por dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.daily_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="forum_interactions" stroke="#8884d8" name="Fórum" />
                  <Line type="monotone" dataKey="chat_interactions" stroke="#82ca9d" name="Chat" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Alunos por Engajamento</CardTitle>
                <CardDescription>
                  Alunos mais ativos na turma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.student_engagement.slice(0, 5).map((student, index) => (
                    <div key={student.student_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="text-sm font-medium">{student.student_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Última atividade: {format(new Date(student.last_activity), 'dd/MM', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{student.interactions}</p>
                        <p className="text-xs text-muted-foreground">interações</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Atividade</CardTitle>
                <CardDescription>
                  Proporção entre fórum e chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Fórum', value: data.metrics.forum_interactions, color: '#8884d8' },
                        { name: 'Chat', value: data.metrics.chat_interactions, color: '#82ca9d' },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interações por Matéria</CardTitle>
              <CardDescription>
                Distribuição das interações por assunto/materia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.subject_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="interactions" fill="#8884d8" name="Interações" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClassAnalytics;
