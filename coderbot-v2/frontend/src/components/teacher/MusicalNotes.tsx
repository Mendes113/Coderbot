import { useState, useEffect } from 'react';
import { Loader2, Music, Plus, Play, Eye, EyeOff, Filter } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  MusicalNoteRecord,
  listClassMusicalNotes,
  createMusicalNote,
  getCurrentUser,
} from '@/integrations/pocketbase/client';

interface MusicalNotesProps {
  classId: string;
  isTeacher?: boolean;
  onRefresh?: () => void;
}

const noteTypeLabels = {
  melody: 'Melodia',
  harmony: 'Harmonia',
  rhythm: 'Ritmo',
  composition: 'Composição',
  theory: 'Teoria',
};

const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export const MusicalNotes = ({ classId, isTeacher = false, onRefresh }: MusicalNotesProps) => {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<MusicalNoteRecord[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<'melody' | 'harmony' | 'rhythm' | 'composition' | 'theory'>('melody');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isPublic, setIsPublic] = useState(true);
  const [audioUrl, setAudioUrl] = useState('');

  useEffect(() => {
    loadNotes();
  }, [classId, filterType, filterDifficulty, showPublicOnly]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const options: any = {};

      if (filterType !== 'all') {
        options.type = filterType;
      }

      if (filterDifficulty !== 'all') {
        options.difficulty = filterDifficulty;
      }

      if (showPublicOnly) {
        options.is_public = true;
      }

      const notesData = await listClassMusicalNotes(classId, options);
      setNotes(notesData);
    } catch (error) {
      console.error('Erro ao carregar notas musicais:', error);
      toast.error('Erro ao carregar notas musicais');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setNoteType('melody');
    setDifficulty('beginner');
    setIsPublic(true);
    setAudioUrl('');
  };

  const handleCreateNote = async () => {
    if (!title.trim()) {
      toast.error('Digite um título para a nota');
      return;
    }

    if (!content.trim()) {
      toast.error('Digite o conteúdo da nota');
      return;
    }

    setCreating(true);

    try {
      await createMusicalNote({
        classId,
        title: title.trim(),
        content: content.trim(),
        note_type: noteType,
        difficulty,
        is_public: isPublic,
        audio_url: audioUrl || undefined,
      });

      toast.success('Nota musical criada com sucesso!');
      resetForm();
      setShowCreateDialog(false);
      loadNotes();
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao criar nota musical:', error);
      toast.error('Não foi possível criar a nota musical. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    if (filterType !== 'all' && note.note_type !== filterType) return false;
    if (filterDifficulty !== 'all' && note.difficulty !== filterDifficulty) return false;
    if (showPublicOnly && !note.is_public) return false;
    return true;
  });

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
          <h3 className="text-lg font-semibold">Notas Musicais</h3>
          <p className="text-sm text-muted-foreground">
            {isTeacher
              ? 'Gerencie as composições e exercícios musicais dos alunos'
              : 'Crie e compartilhe suas composições musicais'
            }
          </p>
        </div>

        {!isTeacher && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar nova nota musical</DialogTitle>
                <DialogDescription>
                  Compartilhe sua composição ou exercício musical com a turma.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="note-title">Título *</Label>
                  <Input
                    id="note-title"
                    placeholder="Ex: Minha primeira melodia"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    disabled={creating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note-content">Conteúdo/Descrição *</Label>
                  <Textarea
                    id="note-content"
                    placeholder="Descreva sua composição, inclua instruções ou conceitos musicais..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={1000}
                    disabled={creating}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de nota *</Label>
                    <Select value={noteType} onValueChange={(value) => setNoteType(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(noteTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dificuldade *</Label>
                    <Select value={difficulty} onValueChange={(value) => setDifficulty(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(difficultyLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audio-url">URL do áudio (opcional)</Label>
                  <Input
                    id="audio-url"
                    placeholder="https://exemplo.com/minha-musica.mp3"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    disabled={creating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole o link de uma gravação da sua composição
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={creating}
                    className="rounded"
                  />
                  <Label htmlFor="is-public" className="text-sm">
                    Tornar pública (visível para todos os alunos da turma)
                  </Label>
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
                <Button onClick={handleCreateNote} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Music className="mr-2 h-4 w-4" />
                      Criar Nota
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(noteTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as dificuldades</SelectItem>
                {Object.entries(difficultyLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showPublicOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPublicOnly(!showPublicOnly)}
            >
              {showPublicOnly ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              Apenas públicas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isTeacher ? 'Nenhuma nota musical criada' : 'Nenhuma nota encontrada'}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {isTeacher
                ? 'Os alunos ainda não criaram notas musicais nesta turma.'
                : 'Seja o primeiro a compartilhar uma composição musical!'
              }
            </p>
            {!isTeacher && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Nota
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-2">{note.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Por: {note.expand?.student?.name || note.expand?.teacher?.name || 'Usuário'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {note.is_public ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {noteTypeLabels[note.note_type]}
                    </Badge>
                    <Badge className={`text-xs ${difficultyColors[note.difficulty]}`}>
                      {difficultyLabels[note.difficulty]}
                    </Badge>
                  </div>
                </div>

                {note.audio_url && (
                  <Button variant="outline" size="sm" className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Ouvir Áudio
                  </Button>
                )}

                <div className="text-xs text-muted-foreground">
                  Criado em: {new Date(note.created).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
