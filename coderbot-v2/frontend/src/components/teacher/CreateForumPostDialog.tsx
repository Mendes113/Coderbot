import { useState, useRef } from 'react';
import { Loader2, Plus, Link2, FileText, X, Target } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import {
  ClassForumPostType,
  CLASS_FORUM_TYPES,
  ClassForumLink,
  createClassForumPost,
} from '@/integrations/pocketbase/client';

interface CreateForumPostDialogProps {
  classId: string;
  onPostCreated?: () => void;
}

const forumTypeLabels: Record<ClassForumPostType, string> = {
  aviso: 'Aviso',
  info: 'Info',
  conteudo: 'Conteúdo',
  links: 'Links',
  mensagens: 'Mensagens',
};

const forumTypeDescriptions: Record<ClassForumPostType, string> = {
  aviso: 'Comunicados importantes e urgentes',
  info: 'Informações gerais da turma',
  conteudo: 'Materiais didáticos e recursos',
  links: 'Referências e recursos externos',
  mensagens: 'Mensagens gerais e discussões',
  atividade: 'Lançar atividades e missões para os alunos',
};

export const CreateForumPostDialog = ({ classId, onPostCreated }: CreateForumPostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ClassForumPostType>('mensagens');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [links, setLinks] = useState<ClassForumLink[]>([]);
  const [linkInput, setLinkInput] = useState({ url: '', label: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado específico para atividades
  const [activityType, setActivityType] = useState<'mission' | 'quick_task' | 'project'>('mission');
  const [activityTarget, setActivityTarget] = useState(20);
  const [activityReward, setActivityReward] = useState(100);
  const [activityInstructions, setActivityInstructions] = useState('');

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('mensagens');
    setAttachments([]);
    setLinks([]);
    setLinkInput({ url: '', label: '' });
    setActivityType('mission');
    setActivityTarget(20);
    setActivityReward(100);
    setActivityInstructions('');
  };

  const handleAddLink = () => {
    const url = linkInput.url.trim();
    if (!url) {
      toast.message('Digite uma URL válida');
      return;
    }

    const newLink: ClassForumLink = {
      url,
      label: linkInput.label.trim() || url,
    };

    setLinks([...links, newLink]);
    setLinkInput({ url: '', label: '' });
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalSize = [...attachments, ...newFiles].reduce((acc, file) => acc + file.size, 0);

    // Limite de 50MB total
    if (totalSize > 52428800) {
      toast.error('O tamanho total dos arquivos não pode exceder 50MB');
      return;
    }

    setAttachments([...attachments, ...newFiles]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.message('Digite um título para o post');
      return;
    }

    // Validação específica para atividades
    if (type === 'atividade') {
      if (activityTarget <= 0) {
        toast.error('A meta da atividade deve ser maior que zero');
        return;
      }
      if (activityReward < 0) {
        toast.error('Os pontos de recompensa não podem ser negativos');
        return;
      }
      if (!activityInstructions.trim()) {
        toast.error('Digite as instruções da atividade');
        return;
      }
    }

    setSubmitting(true);

    try {
      await createClassForumPost({
        classId,
        title: title.trim(),
        content: content.trim() || undefined,
        type,
        attachments: attachments.length > 0 ? attachments : undefined,
        links: links.length > 0 ? links : undefined,
      });

      toast.success('Post criado com sucesso!');
      resetForm();
      setOpen(false);
      onPostCreated?.();
    } catch (error) {
      console.error('Erro ao criar post:', error);
      toast.error('Não foi possível criar o post. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Criar Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Criar novo post no fórum</DialogTitle>
          <DialogDescription>
            Compartilhe avisos, materiais, links e mensagens com os alunos da turma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de post */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de post *</Label>
            <Select value={type} onValueChange={(value) => setType(value as ClassForumPostType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASS_FORUM_TYPES.map((forumType) => (
                  <SelectItem key={forumType} value={forumType}>
                    <div className="flex flex-col">
                      <span className="font-medium">{forumTypeLabels[forumType]}</span>
                      <span className="text-xs text-muted-foreground">
                        {forumTypeDescriptions[forumType]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Digite o título do post"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">{title.length}/120 caracteres</p>
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <SimpleEditor
              value={content}
              onChange={setContent}
              readOnly={submitting}
              placeholder="Digite o conteúdo do post (opcional)"
            />
            <p className="text-xs text-muted-foreground">
              Use a barra de ferramentas para formatar o texto, adicionar listas e links.
            </p>
          </div>

          {/* Configurações específicas para atividades */}
          {type === 'atividade' && (
            <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">Configurações da Atividade</Label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="activity-type">Tipo de atividade</Label>
                  <Select value={activityType} onValueChange={(value) => setActivityType(value as any)}>
                    <SelectTrigger id="activity-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mission">Missão</SelectItem>
                      <SelectItem value="quick_task">Tarefa Rápida</SelectItem>
                      <SelectItem value="project">Projeto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity-target">Meta</Label>
                  <Input
                    id="activity-target"
                    type="number"
                    placeholder="Ex: 20 mensagens"
                    value={activityTarget}
                    onChange={(e) => setActivityTarget(parseInt(e.target.value) || 1)}
                    min={1}
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Quantidade de ações necessárias
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-reward">Pontos de recompensa</Label>
                <Input
                  id="activity-reward"
                  type="number"
                  placeholder="Ex: 100 pontos"
                  value={activityReward}
                  onChange={(e) => setActivityReward(parseInt(e.target.value) || 0)}
                  min={0}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Pontos concedidos ao completar a atividade
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-instructions">Instruções da atividade</Label>
                <Textarea
                  id="activity-instructions"
                  placeholder="Descreva detalhadamente como os alunos devem realizar esta atividade..."
                  value={activityInstructions}
                  onChange={(e) => setActivityInstructions(e.target.value)}
                  maxLength={500}
                  disabled={submitting}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {activityInstructions.length}/500 caracteres
                </p>
              </div>

              {/* Preview da atividade */}
              <div className="p-3 bg-background border rounded-md">
                <h4 className="font-medium text-sm mb-2">Preview da atividade:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Tipo:</strong> {activityType === 'mission' ? 'Missão' : activityType === 'quick_task' ? 'Tarefa Rápida' : 'Projeto'}</p>
                  <p><strong>Meta:</strong> {activityTarget} ações</p>
                  <p><strong>Recompensa:</strong> {activityReward} pontos</p>
                  {activityInstructions && (
                    <p><strong>Instruções:</strong> {activityInstructions}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Anexos */}
          <div className="space-y-2">
            <Label>Arquivos anexos (opcional)</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                disabled={submitting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting || attachments.length >= 10}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Adicionar arquivos
              </Button>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(index)}
                      disabled={submitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  {attachments.length}/10 arquivos · Total:{' '}
                  {(attachments.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="space-y-2">
            <Label>Links (opcional)</Label>
            <div className="space-y-2 rounded-lg border border-dashed border-border/60 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="URL do link"
                  value={linkInput.url}
                  onChange={(e) => setLinkInput({ ...linkInput, url: e.target.value })}
                  disabled={submitting}
                />
                <Input
                  placeholder="Título (opcional)"
                  value={linkInput.label}
                  onChange={(e) => setLinkInput({ ...linkInput, label: e.target.value })}
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddLink}
                  disabled={submitting || !linkInput.url.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {links.length > 0 && (
                <div className="mt-3 space-y-2">
                  {links.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{link.label}</span>
                          <span className="text-xs text-muted-foreground">{link.url}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLink(index)}
                        disabled={submitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Post'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};




