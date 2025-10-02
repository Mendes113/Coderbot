import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarIcon,
  Edit,
  FileText,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import { CreateForumPostDialog } from '@/components/teacher/CreateForumPostDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { MentionTextarea } from '@/components/ui/mention-textarea';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { extractMentions, createMentionNotifications, highlightMentions } from '@/utils/mentions';
import {
  CLASS_FORUM_TYPES,
  ClassForumCommentRecord,
  ClassForumLink,
  ClassForumPostRecord,
  ClassForumPostType,
  createClassForumComment,
  getCurrentUser,
  getClassByIdentifier,
  isCurrentUserMemberOfClass,
  listClassForumComments,
  listClassForumPosts,
  pb,
  updateClassForumPost,
  UserRecord,
} from '@/integrations/pocketbase/client';

type ForumInteractionType = 'post_viewed' | 'post_expanded' | 'comment_created' | 'external_link_clicked';

const forumTypeMeta: Record<ClassForumPostType, { label: string; badgeClass: string; description: string }> = {
  aviso: {
    label: 'Aviso',
    badgeClass: 'border-red-200 bg-red-100/80 text-red-700 dark:bg-red-950/40 dark:text-red-200',
    description: 'Atualizações urgentes ou comunicados importantes da turma.',
  },
  info: {
    label: 'Info',
    badgeClass: 'border-sky-200 bg-sky-100/80 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200',
    description: 'Informações gerais que os alunos precisam acompanhar.',
  },
  conteudo: {
    label: 'Conteúdo',
    badgeClass: 'border-violet-200 bg-violet-100/80 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200',
    description: 'Materiais de apoio, aulas gravadas e recursos didáticos.',
  },
  arquivos: {
    label: 'Arquivos',
    badgeClass: 'border-amber-200 bg-amber-100/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
    description: 'Uploads de documentos e materiais para download.',
  },
  links: {
    label: 'Links',
    badgeClass: 'border-emerald-200 bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
    description: 'Referências externas, artigos e vídeos recomendados.',
  },
  mensagens: {
    label: 'Mensagens',
    badgeClass: 'border-slate-200 bg-slate-100/80 text-slate-700 dark:bg-slate-950/40 dark:text-slate-200',
    description: 'Espaço aberto para dúvidas rápidas e interações gerais.',
  },
  atividade: {
    label: 'Atividade',
    badgeClass: 'border-orange-200 bg-orange-100/80 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200',
    description: 'Tarefas, exercícios e atividades práticas para os alunos.',
  },
};

type ForumFilterOption = 'all' | ClassForumPostType;

type CommentsState = Record<string, ClassForumCommentRecord[]>;
type LoadingState = Record<string, boolean>;
type DraftState = Record<string, string>;
type EditingPostState = {
  id: string;
  title: string;
  content: string;
  type: ClassForumPostType;
} | null;

type ViewingPostState = {
  post: ClassForumPostRecord;
  comments: ClassForumCommentRecord[];
} | null;

type Params = {
  classId?: string;
};

const normalizeLinks = (links: unknown): ClassForumLink[] => {
  if (!links) {
    return [];
  }

  if (Array.isArray(links)) {
    return links
      .map((item): ClassForumLink | undefined => {
        if (!item) {
          return undefined;
        }

        if (typeof item === 'string') {
          return { url: item, label: item };
        }

        if (typeof item === 'object' && 'url' in item) {
          const url = typeof (item as Record<string, unknown>).url === 'string' ? (item as Record<string, unknown>).url as string : '';
          if (!url) {
            return undefined;
          }
          const label = typeof (item as Record<string, unknown>).label === 'string'
            ? ((item as Record<string, unknown>).label as string)
            : undefined;
          return { url, label };
        }

        return undefined;
      })
      .filter((item): item is ClassForumLink => Boolean(item && item.url));
  }

  if (typeof links === 'string') {
    return [{ url: links, label: links }];
  }

  if (typeof links === 'object' && links && 'url' in (links as Record<string, unknown>)) {
    const data = links as Record<string, unknown>;
    const url = typeof data.url === 'string' ? data.url as string : '';
    if (!url) {
      return [];
    }
    const label = typeof data.label === 'string' ? (data.label as string) : undefined;
    return [{ url, label }];
  }

  return [];
};

/**
 * Verifica se o usuário atual pode editar um post específico.
 * - Professores podem editar sempre
 * - Alunos podem editar apenas nos primeiros 15 minutos após criação
 */
const canEditPost = (post: ClassForumPostRecord, currentUser: UserRecord | undefined): boolean => {
  if (!currentUser || !post.expand?.author) {
    return false;
  }

  // Verifica se é o autor do post
  if (post.expand.author.id !== currentUser.id) {
    return false;
  }

  // Professores podem editar sempre
  if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
    return true;
  }

  // Alunos podem editar apenas nos primeiros 15 minutos
  if (currentUser.role === 'student') {
    const postDate = new Date(post.created);
    const now = new Date();
    const fifteenMinutesInMs = 15 * 60 * 1000;

    return (now.getTime() - postDate.getTime()) <= fifteenMinutesInMs;
  }

  return false;
};

const renderLoadingState = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-6">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <p className="mt-4 text-sm text-muted-foreground">Carregando o fórum da turma...</p>
  </div>
);

const renderNotFoundState = (onBack: () => void) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/20 px-6 text-center">
    <div className="rounded-full bg-muted p-4 text-muted-foreground">
      <MessageCircle className="h-8 w-8" />
    </div>
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Turma não encontrada</h1>
      <p className="text-sm text-muted-foreground">
        Verifique se o endereço está correto ou peça ao professor o link atualizado do fórum.
      </p>
    </div>
    <Button variant="outline" onClick={onBack}>
      <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
    </Button>
  </div>
);

const renderForbiddenState = (onBack: () => void) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/20 px-6 text-center">
    <div className="rounded-full bg-amber-100 p-4 text-amber-600 dark:bg-amber-950/40 dark:text-amber-200">
      <Users className="h-8 w-8" />
    </div>
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Acesso restrito à turma</h1>
      <p className="text-sm text-muted-foreground">
        Apenas alunos matriculados e o professor responsável podem visualizar este fórum. Solicite acesso ao professor se acredita ser um erro.
      </p>
    </div>
    <Button onClick={onBack}>
      <ArrowLeft className="mr-2 h-4 w-4" /> Ir para o painel
    </Button>
  </div>
);

const ClassForumPage = () => {
  const { classId: classIdentifier } = useParams<Params>();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = user?.id;
  const userRole = user?.role;

  const [classInfo, setClassInfo] = useState<any | null>(null);
  const [loadingClass, setLoadingClass] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [posts, setPosts] = useState<ClassForumPostRecord[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedType, setSelectedType] = useState<ForumFilterOption>('all');
  const [expandedPosts, setExpandedPosts] = useState<string[]>([]);
  const [commentsMap, setCommentsMap] = useState<CommentsState>({});
  const [commentsLoading, setCommentsLoading] = useState<LoadingState>({});
  const [commentDrafts, setCommentDrafts] = useState<DraftState>({});
  const [commentSubmitting, setCommentSubmitting] = useState<LoadingState>({});
  const [editingPost, setEditingPost] = useState<EditingPostState>(null);
  const [updatingPost, setUpdatingPost] = useState(false);
  const [viewingPost, setViewingPost] = useState<ViewingPostState>(null);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [],
  );

  const filterOptions = useMemo<ForumFilterOption[]>(
    () => ['all', ...CLASS_FORUM_TYPES],
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const loadClass = async () => {
      if (!classIdentifier) {
        setLoadingClass(false);
        return;
      }

      setLoadingClass(true);

      try {
        const record = await getClassByIdentifier(classIdentifier);

        if (!record) {
          if (!cancelled) {
            setClassInfo(null);
            setForbidden(false);
          }
          return;
        }

        if (cancelled) {
          return;
        }

        setClassInfo(record);

        if (!userId) {
          setForbidden(true);
          return;
        }

        const isOwner = record.createdBy === userId;
        let hasMembership = false;

        if (!isOwner) {
          hasMembership = await isCurrentUserMemberOfClass(record.id);
        }

        if (cancelled) {
          return;
        }

        setForbidden(!(isOwner || hasMembership || userRole === 'admin'));
      } catch (error) {
        console.error('Erro ao carregar turma para o fórum:', error);
        toast.error('Não foi possível carregar as informações da turma.');
      } finally {
        if (!cancelled) {
          setLoadingClass(false);
        }
      }
    };

    loadClass();

    return () => {
      cancelled = true;
    };
  }, [classIdentifier, userId, userRole]);

  const loadPosts = useCallback(async () => {
    if (!classInfo || forbidden) {
      setPosts([]);
      return;
    }

    setLoadingPosts(true);

    try {
      const forumPosts = await listClassForumPosts(classInfo.id, {
        type: selectedType === 'all' ? undefined : selectedType,
      });
      setPosts(forumPosts);
    } catch (error) {
      console.error('Erro ao carregar posts do fórum:', error);
      toast.error('Não foi possível carregar as mensagens do fórum desta turma.');
    } finally {
      setLoadingPosts(false);
    }
  }, [classInfo, forbidden, selectedType]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const loadComments = useCallback(
    async (postId: string, force = false) => {
      if (!force && commentsMap[postId]) {
        return;
      }

      setCommentsLoading((prev) => ({ ...prev, [postId]: true }));

      try {
        const items = await listClassForumComments(postId);
        setCommentsMap((prev) => ({ ...prev, [postId]: items }));
      } catch (error) {
        console.error('Erro ao listar comentários do fórum:', error);
        toast.error('Não foi possível carregar os comentários deste evento.');
      } finally {
        setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [commentsMap],
  );

  const handleTogglePost = useCallback(
    (postId: string) => {
      const isOpen = expandedPosts.includes(postId);

      setExpandedPosts((prev) => (isOpen ? prev.filter((id) => id !== postId) : [...prev, postId]));

      // Track post expansion
      if (!isOpen) {
        trackForumInteraction('post_expanded', postId);
      }

      if (!isOpen) {
        void loadComments(postId);
      }
    },
    [expandedPosts, loadComments],
  );

  const handleDraftChange = useCallback((postId: string, value: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  }, []);

  const handleSubmitComment = useCallback(
    async (post: ClassForumPostRecord) => {
      const draft = commentDrafts[post.id]?.trim();
      if (!draft) {
        toast.message('Escreva uma mensagem para enviar.');
        return;
      }

      setCommentSubmitting((prev) => ({ ...prev, [post.id]: true }));

      try {
        const record = await createClassForumComment(post.id, draft);
        if (!record) {
          return;
        }

        const commentAuthor = user ?? undefined;

        setCommentsMap((prev) => ({
          ...prev,
          [post.id]: [
            ...((prev[post.id] as ClassForumCommentRecord[] | undefined) ?? []),
            {
              ...record,
              expand: commentAuthor
                ? {
                    author: commentAuthor,
                  }
                : record.expand,
            },
          ],
        }));

        setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));

        // Detectar menções e criar notificações
        const mentions = extractMentions(draft);
        if (mentions.length > 0 && userId && classInfo) {
          await createMentionNotifications(
            mentions,
            userId,
            classInfo.id,
            post.id,
            record.id,
            `Você foi mencionado em: "${draft.length > 50 ? draft.substring(0, 50) + '...' : draft}"`
          );
        }

        // Track comment creation
        trackForumInteraction('comment_created', post.id);

        toast.success('Comentário publicado com sucesso.');
      } catch (error) {
        console.error('Erro ao enviar comentário para o fórum:', error);
        toast.error('Não foi possível publicar seu comentário agora.');
      } finally {
        setCommentSubmitting((prev) => ({ ...prev, [post.id]: false }));
      }
    },
    [commentDrafts, user],
  );

  const handleRefresh = useCallback(() => {
    setCommentsMap({});
    setExpandedPosts([]);
    void loadPosts();
  }, [loadPosts]);

  const handleEditPost = useCallback((post: ClassForumPostRecord) => {
    setEditingPost({
      id: post.id,
      title: post.title,
      content: post.content || '',
      type: post.type,
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingPost(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingPost) return;

    setUpdatingPost(true);

    try {
      await updateClassForumPost(editingPost.id, {
        title: editingPost.title,
        content: editingPost.content,
        type: editingPost.type,
      });

      // Atualizar o post na lista local
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === editingPost.id
            ? { ...post, title: editingPost.title, content: editingPost.content, type: editingPost.type }
            : post
        )
      );

      setEditingPost(null);
      toast.success('Post atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar post:', error);
      toast.error('Não foi possível atualizar o post.');
    } finally {
      setUpdatingPost(false);
    }
  }, [editingPost]);

  const handleViewPost = useCallback((post: ClassForumPostRecord) => {
    setViewingPost({
      post,
      comments: commentsMap[post.id] ?? []
    });
  }, [commentsMap]);

  const handleClosePostView = useCallback(() => {
    setViewingPost(null);
  }, []);

  const trackForumInteraction = useCallback(async (
    interactionType: ForumInteractionType,
    postId?: string,
    metadata?: Record<string, any>
  ) => {
    const user = getCurrentUser();
    if (!user || !classInfo) return;

    try {
      await pb.collection('forum_user_interactions').create({
        user: user.id,
        class: classInfo.id,
        interaction_type: interactionType,
        target_id: postId || '',
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('Erro ao rastrear interação do fórum:', error);
    }
  }, [classInfo]);

  if (loadingClass) {
    return renderLoadingState();
  }

  if (!classInfo) {
    return renderNotFoundState(() => navigate(-1));
  }

  if (forbidden) {
    return renderForbiddenState(() => navigate('/'));
  }

  const classTitle = classInfo.name || classInfo.title || 'Turma';
  const activeType = selectedType === 'all' ? undefined : selectedType;
  const isOwner = user && classInfo.createdBy === user.id;
  const isTeacher = user?.role === 'teacher';
  const canCreatePost = isOwner || isTeacher || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-background pb-16">
      <div className="mx-auto w-full max-w-6xl px-4 pt-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mt-1" aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Fórum da turma</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{classTitle}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Espaço colaborativo para anúncios, materiais e discussões entre o professor e os alunos desta turma.
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-start sm:self-center">
            {canCreatePost && (
              <CreateForumPostDialog classId={classInfo.id} onPostCreated={handleRefresh} />
            )}
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
          </div>
        </div>

        <Card className="mb-8 border-dashed">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-3 text-base font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-2 text-foreground">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Criada em {classInfo.created ? dateFormatter.format(new Date(classInfo.created)) : 'data desconhecida'}
              </span>
              {classInfo.updated && (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  Atualizada em {dateFormatter.format(new Date(classInfo.updated))}
                </span>
              )}
              {classInfo.code && (
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Código da turma: <span className="font-semibold text-foreground">{classInfo.code}</span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-semibold uppercase tracking-wide text-foreground/70">Descrição</p>
                <p>{classInfo.description || 'Nenhuma descrição fornecida pelo professor ainda.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm md:w-64">
                {CLASS_FORUM_TYPES.map((type) => (
                  <div key={type} className="space-y-1 rounded-lg border border-dashed border-border/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {forumTypeMeta[type].label}
                    </p>
                    <p className="text-xs text-muted-foreground/70">{forumTypeMeta[type].description}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {filterOptions.map((option) => {
            const isActive = selectedType === option;
            const meta = option === 'all' ? null : forumTypeMeta[option];

            return (
              <Button
                key={option}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setSelectedType(option)}
                className={cn('rounded-full px-4 text-sm', isActive ? '' : 'bg-background')}
              >
                {option === 'all' ? 'Todas as categorias' : meta?.label}
              </Button>
            );
          })}
        </div>

        {loadingPosts ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-32" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Nenhuma postagem disponível</h2>
                <p className="text-sm text-muted-foreground">
                  {activeType
                    ? 'Ainda não existem publicações nesta categoria. Volte mais tarde.'
                    : 'O professor ainda não compartilhou avisos ou materiais nesta turma.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const meta = forumTypeMeta[post.type];
              const links = normalizeLinks(post.links);
              const attachments = Array.isArray(post.attachments) ? post.attachments : [];
              const isExpanded = expandedPosts.includes(post.id);
              const comments = commentsMap[post.id] ?? [];

              return (
                <Card key={post.id} className="shadow-sm transition hover:shadow-md">
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn('border text-[0.65rem] uppercase tracking-wider', meta.badgeClass)}>
                        {meta.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(post.created))}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-semibold text-foreground">{post.title}</CardTitle>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[hsl(var(--education-primary))] to-[hsl(var(--education-secondary))] ring-2 ring-[hsl(var(--education-primary-light))] ring-offset-1 shadow-sm">
                          {post.expand?.author?.avatar ? (
                            <img
                              src={`${pb.baseUrl}/api/files/${post.expand.author.collectionId}/${post.expand.author.id}/${post.expand.author.avatar}`}
                              alt={post.expand.author.name || 'Usuário'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                              {(post.expand?.author?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Publicado por <span className="font-semibold text-foreground">{post.expand?.author?.name || 'usuário'}</span>
                          {post.expand?.author?.email ? ` · ${post.expand.author.email}` : ''}
                        </p>
                      </div>

                      {canEditPost(post, user) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPost(post)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {post.content ? (
                      <article
                        className="prose prose-base max-w-none prose-p:my-3 prose-headings:my-4 prose-a:text-primary hover:prose-a:underline dark:prose-invert cursor-pointer transition-opacity hover:opacity-90"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                        onClick={() => handleViewPost(post)}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground cursor-pointer" onClick={() => handleViewPost(post)}>
                        Sem conteúdo textual informado. Clique para visualizar detalhes.
                      </p>
                    )}

                    {(attachments.length > 0 || links.length > 0) && <Separator />}

                    {attachments.length > 0 && (
                      <div>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <FileText className="h-4 w-4" /> Materiais anexados
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {attachments.map((fileName) => {
                            const url = pb.files.getUrl(post, fileName);
                            return (
                              <a
                                key={fileName}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-dashed border-border/60 px-3 py-1 text-xs font-medium text-primary transition hover:border-primary hover:bg-primary/10"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                {fileName}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {links.length > 0 && (
                      <div>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <Link2 className="h-4 w-4" /> Links de apoio
                        </h3>
                        <ul className="space-y-1">
                          {links.map((link) => (
                            <li key={link.url}>
                              <a
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackForumInteraction('external_link_clicked', post.id, {
                                  target_url: link.url,
                                  link_title: link.label || link.url
                                })}
                              >
                                <Link2 className="h-3.5 w-3.5" />
                                {link.label || link.url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col gap-4 border-t border-dashed bg-muted/40 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button variant="secondary" onClick={() => handleTogglePost(post.id)}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {isExpanded ? 'Ocultar discussões' : 'Ver discussões'}
                        {comments.length > 0 && !isExpanded && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            {comments.length}
                          </span>
                        )}
                      </Button>
                      {isExpanded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadComments(post.id, true)}
                          disabled={commentsLoading[post.id]}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Atualizar comentários
                        </Button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="w-full space-y-4">
                        <ScrollArea className="max-h-72 rounded-md border border-border/60">
                          <div className="space-y-3 p-4">
                            {commentsLoading[post.id] ? (
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Carregando comentários...
                              </div>
                            ) : comments.length === 0 ? (
                              <p className="text-center text-sm text-muted-foreground">
                                Seja o primeiro a registrar uma mensagem neste evento.
                              </p>
                            ) : (
                              comments.map((comment) => (
                                <div key={comment.id} className="rounded-lg border border-border/40 bg-background/80 p-3">
                                  <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[hsl(var(--education-primary))] to-[hsl(var(--education-secondary))] ring-2 ring-[hsl(var(--education-primary-light))] ring-offset-1 shadow-sm">
                                      {comment.expand?.author?.avatar ? (
                                        <img
                                          src={`${pb.baseUrl}/api/files/${comment.expand.author.collectionId}/${comment.expand.author.id}/${comment.expand.author.avatar}`}
                                          alt={comment.expand.author.name || 'Participante'}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                                          {(comment.expand?.author?.name || 'P').charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <span className="font-semibold text-foreground">
                                          {comment.expand?.author?.name || 'Participante'}
                                        </span>
                                        <span>{dateFormatter.format(new Date(comment.created))}</span>
                                      </div>
                                      <p
                                        className="mt-2 text-sm text-foreground/90"
                                        dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Nova mensagem
                          </label>
                          <MentionTextarea
                            value={commentDrafts[post.id] ?? ''}
                            onChange={(value) => handleDraftChange(post.id, value)}
                            placeholder="Compartilhe suas dúvidas, percepções ou feedback com a turma... (use @nome para mencionar alguém)"
                            disabled={commentSubmitting[post.id]}
                            rows={3}
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleSubmitComment(post)}
                              disabled={commentSubmitting[post.id]}
                            >
                              {commentSubmitting[post.id] ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <MessageCircle className="mr-2 h-4 w-4" />
                              )}
                              Enviar comentário
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Edição de Post */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Post</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias no seu post. Lembre-se que alunos só podem editar nos primeiros 15 minutos após a publicação.
            </DialogDescription>
          </DialogHeader>

          {editingPost && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editingPost.title}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Digite o título do post..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Categoria</Label>
                <Select
                  value={editingPost.type}
                  onValueChange={(value: ClassForumPostType) =>
                    setEditingPost(prev => prev ? { ...prev, type: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_FORUM_TYPES.map((type) => {
                      const meta = forumTypeMeta[type];
                      return (
                        <SelectItem key={type} value={type}>
                          {meta.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Conteúdo</Label>
                <SimpleEditor
                  value={editingPost.content}
                  onChange={(html) => setEditingPost(prev => prev ? { ...prev, content: html } : null)}
                  placeholder="Digite o conteúdo do post usando o editor..."
                  className="min-h-[200px] border rounded-md"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit} disabled={updatingPost}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updatingPost || !editingPost?.title.trim()}>
              {updatingPost ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização Completa do Post */}
      <Dialog open={!!viewingPost} onOpenChange={(open) => !open && handleClosePostView()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={cn('border text-[0.65rem] uppercase tracking-wider', forumTypeMeta[viewingPost?.post.type || 'info'].badgeClass)}>
                  {viewingPost ? forumTypeMeta[viewingPost.post.type].label : 'Post'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {viewingPost ? dateFormatter.format(new Date(viewingPost.post.created)) : ''}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleClosePostView()}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogTitle className="text-2xl font-semibold">
              {viewingPost?.post.title || 'Post sem título'}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[hsl(var(--education-primary))] to-[hsl(var(--education-secondary))] ring-2 ring-[hsl(var(--education-primary-light))] ring-offset-1 shadow-sm">
                  {viewingPost?.post.expand?.author?.avatar ? (
                    <img
                      src={`${pb.baseUrl}/api/files/${viewingPost.post.expand.author.collectionId}/${viewingPost.post.expand.author.id}/${viewingPost.post.expand.author.avatar}`}
                      alt={viewingPost.post.expand.author.name || 'Usuário'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      {(viewingPost?.post.expand?.author?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {viewingPost?.post.expand?.author?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {viewingPost?.post.expand?.author?.email || ''}
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          {viewingPost && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 p-6">
                {/* Conteúdo do post */}
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  {viewingPost.post.content ? (
                    <article dangerouslySetInnerHTML={{ __html: viewingPost.post.content }} />
                  ) : (
                    <p className="text-muted-foreground">Sem conteúdo textual informado.</p>
                  )}
                </div>

                {/* Anexos e Links */}
                {(viewingPost.post.attachments?.length > 0 || normalizeLinks(viewingPost.post.links).length > 0) && (
                  <Separator />
                )}

                {viewingPost.post.attachments && viewingPost.post.attachments.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
                      <FileText className="h-5 w-5" /> Materiais anexados
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {viewingPost.post.attachments.map((fileName) => {
                        const url = pb.files.getUrl(viewingPost.post, fileName);
                        return (
                          <a
                            key={fileName}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-border/60 p-4 text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/10"
                          >
                            <FileText className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{fileName}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {normalizeLinks(viewingPost.post.links).length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
                      <Link2 className="h-5 w-5" /> Links de apoio
                    </h3>
                    <div className="space-y-3">
                      {normalizeLinks(viewingPost.post.links).map((link) => (
                        <a
                          key={link.url}
                          className="flex items-center gap-3 rounded-lg border border-border/60 p-4 text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/10"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackForumInteraction('external_link_clicked', viewingPost.post.id, {
                            target_url: link.url,
                            link_title: link.label || link.url
                          })}
                        >
                          <Link2 className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{link.label || link.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção de comentários */}
                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Comentários ({viewingPost.comments.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadComments(viewingPost.post.id, true)}
                      disabled={commentsLoading[viewingPost.post.id]}
                    >
                      <RefreshCw className={cn("mr-2 h-4 w-4", commentsLoading[viewingPost.post.id] && "animate-spin")} />
                      Atualizar
                    </Button>
                  </div>

                  {commentsLoading[viewingPost.post.id] ? (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando comentários...
                    </div>
                  ) : viewingPost.comments.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Seja o primeiro a comentar neste post.
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {viewingPost.comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border border-border/40 bg-background/80 p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[hsl(var(--education-primary))] to-[hsl(var(--education-secondary))] ring-2 ring-[hsl(var(--education-primary-light))] ring-offset-1 shadow-sm">
                              {comment.expand?.author?.avatar ? (
                                <img
                                  src={`${pb.baseUrl}/api/files/${comment.expand.author.collectionId}/${comment.expand.author.id}/${comment.expand.author.avatar}`}
                                  alt={comment.expand.author.name || 'Participante'}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                                  {(comment.expand?.author?.name || 'P').charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {comment.expand?.author?.name || 'Participante'}
                                </span>
                                <span>{dateFormatter.format(new Date(comment.created))}</span>
                              </div>
                              <div
                                className="mt-2 prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulário de novo comentário */}
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Novo comentário
                      </label>
                      <MentionTextarea
                        value={commentDrafts[viewingPost.post.id] ?? ''}
                        onChange={(value) => handleDraftChange(viewingPost.post.id, value)}
                        placeholder="Compartilhe suas dúvidas, percepções ou feedback..."
                        disabled={commentSubmitting[viewingPost.post.id]}
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleSubmitComment(viewingPost.post)}
                          disabled={commentSubmitting[viewingPost.post.id]}
                        >
                          {commentSubmitting[viewingPost.post.id] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <MessageCircle className="mr-2 h-4 w-4" />
                          )}
                          Enviar comentário
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassForumPage;




