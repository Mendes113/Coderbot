import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  User,
  Mail,
  BookOpen,
  Calendar,
  Settings,
  Trash2,
  Plus,
  SendIcon,
  FileText,
  CheckCircle
} from 'lucide-react';
import { pb } from '@/integrations/pocketbase/client';
import { toast } from '@/components/ui/use-toast';
import { createInvite, listClassEvents, createClassEvent, hasClassApiKey, setClassApiKey, ClassEvent, listClassMembers, removeClassMember } from '@/integrations/pocketbase/client';

// Tipos
interface ClassInfo {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  created: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  progress: number;
  joinDate: string;
}

interface Exercise {
  id: string;
  title: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Assignment {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  assignedDate: string;
  dueDate: string;
  totalStudents: number;
  completedCount: number;
}

interface InvitationState {
  email: string;
}

export const ClassDetails: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  
  // Estados
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  
  const [invitation, setInvitation] = useState<InvitationState>({
    email: ''
  });
  
  const [newAssignment, setNewAssignment] = useState({
    exerciseId: '',
    dueDate: ''
  });

  // Eventos da turma
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [newEvent, setNewEvent] = useState<{ type: string; title: string; starts_at: string; description?: string }>({
    type: 'lecture',
    title: '',
    starts_at: ''
  });

  // API key da turma
  const [provider, setProvider] = useState<'openai'|'claude'|'deepseek'|'other'>('claude');
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState<string | undefined>(undefined);
  
  // Buscar dados da turma
  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) return;
      setIsLoading(true);
      
      try {
        // Buscar informações da turma
        const classData = await pb.collection('classes').getOne(classId);
        setClassInfo({
          id: classData.id,
          name: classData.name,
          description: classData.description,
          createdBy: classData.createdBy,
          created: new Date(classData.created).toLocaleDateString()
        });
        
        // Buscar membros reais (via backend -> class_members com expand user)
        try {
          const members = await listClassMembers(classId);
          const mapped = (members || []).map((m: any) => ({
            id: m.user, // usamos o userId para operações
            name: m.expand?.user?.name || m.expand?.user?.username || 'Aluno',
            email: m.expand?.user?.email || '',
            progress: 0,
            joinDate: m.created ? new Date(m.created).toLocaleDateString() : ''
          }));
          setStudents(mapped);
        } catch (_) {
          setStudents([]);
        }
        
        // Buscar exercícios criados pelo professor
        const exercisesData = await pb.collection('exercises').getList(1, 100, {
          filter: `createdBy = "${pb.authStore.model?.id}"`,
          sort: '-created'
        });
        
        const mappedExercises = exercisesData.items.map(item => ({
          id: item.id,
          title: item.title,
          subject: item.subject,
          difficulty: item.difficulty
        }));
        setExercises(mappedExercises);

        // Buscar eventos
        try {
          const evts = await listClassEvents(classId);
          setEvents(evts);
        } catch (_) {}

        // Verificar API key da turma (provider padrão)
        try {
          const info = await hasClassApiKey(classId, provider);
          setMaskedKey(info?.masked);
        } catch (_) {}
        
        // Buscar atribuições de exercícios para esta turma
        const assignmentsData = await pb.collection('class_assignments').getList(1, 100, {
          filter: `class = "${classId}"`,
          expand: 'exercise'
        });
        
        const mappedAssignments = await Promise.all(assignmentsData.items.map(async item => {
          // Contar quantos alunos completaram
          const completedCount = await pb.collection('student_exercises').getList(1, 1, {
            filter: `assignment = "${item.id}" && completed = true`,
            requestKey: null
          });
          
          return {
            id: item.id,
            exerciseId: item.exercise,
            exerciseTitle: item.expand?.exercise?.title || 'Exercício',
            assignedDate: new Date(item.created).toLocaleDateString(),
            dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Sem prazo',
            totalStudents: students.length,
            completedCount: completedCount.totalItems
          };
        }));
        setAssignments(mappedAssignments);
        
      } catch (error) {
        console.error('Erro ao buscar dados da turma:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as informações da turma.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClassData();
  }, [classId, provider]);
  
  // Função para convidar aluno para a turma
  const handleInviteStudent = async () => {
    try {
      if (!classId) return;
      await createInvite({ class_id: classId, email: invitation.email, ttl_hours: 72 });
      
      setInvitation({ email: '' });
      setIsInviting(false);
      
      toast({
        title: 'Convite enviado',
        description: `Convite enviado para ${invitation.email}`
      });
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: 'Erro ao enviar convite',
        description: 'Não foi possível enviar o convite.',
        variant: 'destructive'
      });
    }
  };

  // Eventos
  const handleCreateEvent = async () => {
    try {
      if (!classId || !newEvent.title || !newEvent.type || !newEvent.starts_at) return;
      const startsIso = new Date(newEvent.starts_at).toISOString();
      await createClassEvent(classId, { type: newEvent.type, title: newEvent.title, description: newEvent.description, starts_at: startsIso, visibility: 'class' });
      const evts = await listClassEvents(classId);
      setEvents(evts);
      setNewEvent({ type: 'lecture', title: '', starts_at: '' });
      toast({ title: 'Evento criado', description: 'O evento foi adicionado à turma.' });
    } catch (e) {
      toast({ title: 'Erro ao criar evento', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    }
  };

  // API key da turma
  const handleSaveClassApiKey = async () => {
    try {
      if (!classId || !apiKey) return;
      await setClassApiKey(classId, provider, apiKey, true);
      const info = await hasClassApiKey(classId, provider);
      setMaskedKey(info?.masked);
      setApiKey('');
      toast({ title: 'API key salva', description: 'A turma está configurada para usar esta chave.' });
    } catch (_) {
      toast({ title: 'Erro ao salvar API key', description: 'Verifique a chave e tente novamente.', variant: 'destructive' });
    }
  };
  
  // Função para atribuir exercício à turma
  const handleAssignExercise = async () => {
    try {
      // Criar a atribuição para a turma
      const assignment = await pb.collection('class_assignments').create({
        class: classId,
        exercise: newAssignment.exerciseId,
        dueDate: newAssignment.dueDate ? new Date(newAssignment.dueDate).toISOString() : null,
        createdBy: pb.authStore.model?.id
      });
      
      // Para cada aluno da turma, criar um registro de exercício
      for (const student of students) {
        await pb.collection('student_exercises').create({
          student: student.id,
          exercise: newAssignment.exerciseId,
          assignment: assignment.id,
          completed: false,
          dueDate: newAssignment.dueDate ? new Date(newAssignment.dueDate).toISOString() : null
        });
      }
      
      // Atualizar a lista de atribuições
      const selectedExercise = exercises.find(ex => ex.id === newAssignment.exerciseId);
      
      setAssignments(prev => [
        ...prev,
        {
          id: assignment.id,
          exerciseId: newAssignment.exerciseId,
          exerciseTitle: selectedExercise?.title || 'Exercício',
          assignedDate: new Date().toLocaleDateString(),
          dueDate: newAssignment.dueDate ? new Date(newAssignment.dueDate).toLocaleDateString() : 'Sem prazo',
          totalStudents: students.length,
          completedCount: 0
        }
      ]);
      
      setNewAssignment({
        exerciseId: '',
        dueDate: ''
      });
      
      toast({
        title: 'Exercício atribuído',
        description: 'O exercício foi atribuído para todos os alunos da turma.'
      });
    } catch (error) {
      console.error('Erro ao atribuir exercício:', error);
      toast({
        title: 'Erro ao atribuir exercício',
        description: 'Não foi possível atribuir o exercício à turma.',
        variant: 'destructive'
      });
    }
  };
  
  // Função para remover aluno da turma
  const handleRemoveStudent = async (studentId: string) => {
    try {
      if (!classId) return;
      await removeClassMember(classId, studentId);
      setStudents(prev => prev.filter(student => student.id !== studentId));
      toast({ title: 'Aluno removido', description: 'O aluno foi removido da turma com sucesso.' });
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      toast({
        title: 'Erro ao remover aluno',
        description: 'Não foi possível remover o aluno da turma.',
        variant: 'destructive'
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="container flex justify-center items-center h-64">
        <p>Carregando dados da turma...</p>
      </div>
    );
  }
  
  if (!classInfo) {
    return (
      <div className="container p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">Turma não encontrada</h2>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container p-4 mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{classInfo.name}</h1>
          <p className="text-muted-foreground">Criada em {classInfo.created}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Sobre a Turma</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{classInfo.description || "Sem descrição."}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students">
            <User className="mr-2 h-4 w-4" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <BookOpen className="mr-2 h-4 w-4" />
            Exercícios
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>
        
        {/* Tab de Alunos */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Alunos da Turma</CardTitle>
                  <CardDescription>
                    Gerencie os alunos inscritos nesta turma
                  </CardDescription>
                </div>
                <Dialog open={isInviting} onOpenChange={setIsInviting}>
                  <DialogTrigger asChild>
                    <Button>
                      <Mail className="mr-2 h-4 w-4" /> Convidar Aluno
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Convidar Aluno</DialogTitle>
                      <DialogDescription>
                        Envie um convite por email para adicionar um aluno à turma
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="inviteEmail" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          value={invitation.email}
                          onChange={(e) => setInvitation({ email: e.target.value })}
                          className="col-span-3"
                          placeholder="Email do aluno"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsInviting(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleInviteStudent}>Enviar Convite</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>{students.length} alunos inscritos</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Data de Ingresso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-secondary rounded-full h-2.5">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs whitespace-nowrap">{student.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.joinDate}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => handleRemoveStudent(student.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Exercícios */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Atribuir Exercício</CardTitle>
              <CardDescription>Selecione um exercício e um prazo (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="exercise">Exercício</Label>
                  <select id="exercise" className="w-full rounded-md border px-3 py-2" value={newAssignment.exerciseId} onChange={(e) => setNewAssignment({ ...newAssignment, exerciseId: e.target.value })}>
                    <option value="">Selecionar...</option>
                    {exercises.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="due">Prazo</Label>
                  <Input id="due" type="date" value={newAssignment.dueDate} onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleAssignExercise} disabled={!newAssignment.exerciseId}>
                <SendIcon className="mr-2 h-4 w-4" /> Atribuir
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Configurações */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Key da Turma</CardTitle>
                <CardDescription>Defina a chave do provedor que será usada por esta turma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <Label>Provedor</Label>
                    <select className="w-full rounded-md border px-3 py-2" value={provider} onChange={(e) => setProvider(e.target.value as any)}>
                      <option value="claude">Claude</option>
                      <option value="openai">OpenAI</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>API Key</Label>
                    <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={maskedKey ? `Atual: ${maskedKey}` : 'Cole a API key aqui'} />
                  </div>
                </div>
                <Button onClick={handleSaveClassApiKey} disabled={!apiKey}>Salvar Key</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eventos da Turma</CardTitle>
                <CardDescription>Crie e gerencie eventos (aula, prova, exercício)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <select className="w-full rounded-md border px-3 py-2" value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}>
                      <option value="lecture">Aula</option>
                      <option value="exam">Prova</option>
                      <option value="exercise">Exercício</option>
                      <option value="assignment">Trabalho</option>
                    </select>
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Início</Label>
                    <Input type="datetime-local" value={newEvent.starts_at} onChange={(e) => setNewEvent({ ...newEvent, starts_at: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input value={newEvent.description || ''} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
                </div>
                <Button onClick={handleCreateEvent} disabled={!newEvent.title || !newEvent.starts_at}>Criar Evento</Button>

                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Início</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map(ev => (
                        <TableRow key={ev.id}>
                          <TableCell>{ev.type}</TableCell>
                          <TableCell>{ev.title}</TableCell>
                          <TableCell>{ev.starts_at ? new Date(ev.starts_at).toLocaleString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClassDetails; 