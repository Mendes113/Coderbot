// src/components/ProfileForm.tsx
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Mail, User, Calendar, CheckCircle, XCircle, Briefcase, CalendarDays, School, Bell, Clock, Trash2, MessageCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { pb, getCurrentUser } from "@/integrations/pocketbase/client";
import { useUserData } from "@/hooks/useUserData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AvatarPresets } from "./AvatarPresets";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useGamification } from "@/hooks/useGamification";
import { sendAchievementNotification } from "@/services/notifications/achievementNotifications";
import { AchievementConfigService } from "@/services/gamification/AchievementConfigService";

interface ProfileFormProps {
  isEditing: boolean;
  onSaved: () => void;
}

interface ProfileFormData {
  name: string;
  bio: string;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  created: string;
  updated: string;
  recipient: string;
  sender: string;
  // Novos campos de rastreamento de origem
  source_type?: 'chat_message' | 'forum_post' | 'forum_comment' | 'exercise' | 'exercise_comment' | 'class' | 'assignment' | 'whiteboard' | 'note' | 'system';
  source_id?: string;
  source_url?: string;
  read_at?: string;
  // Metadata legado (ainda suportado para compatibilidade)
  metadata?: {
    classId?: string;
    commentId?: string;
    context?: string;
    mentionedBy?: string;
    postId?: string;
    exerciseId?: string;
    messageId?: string;
  };
  expand?: {
    sender?: {
      id: string;
      name: string;
      avatar?: string;
      collectionId: string;
    };
  };
}

export function ProfileForm({ isEditing, onSaved }: ProfileFormProps) {
  const { profile, loading } = useUserData();
  const { trackAction } = useGamification();
  const [updating, setUpdating] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [presetAvatarUrl, setPresetAvatarUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const achievementConfigService = AchievementConfigService.getInstance();

  // Helper para rastrear achievements com notificações
  const trackAchievementWithNotification = async (
    achievementName: string,
    actionData: Record<string, any>
  ) => {
    const currentUser = getCurrentUser();
    const result = await trackAction(achievementName, actionData, { showToast: true });
    
    if (result.completed && result.achievement?.is_new && currentUser) {
      const achievement = achievementConfigService.getAchievementByName(achievementName);
      if (achievement) {
        await sendAchievementNotification({
          userId: currentUser.id,
          achievementName: achievement.name,
          achievementIcon: achievement.icon,
          achievementDescription: achievement.description,
          points: achievement.points
        });
      }
    }
    
    return result;
  };

  // Small mock notifications for local testing (visible when running profile)
  const mockNotifications: Notification[] = [
    {
      id: 'mock-1',
      title: 'Boas-vindas',
      content: 'Bem-vindo ao CoderBot!',
      type: 'info',
      read: false,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      recipient: userId || '',
      sender: 'system',
      expand: { sender: { id: 'system', name: 'Sistema', collectionId: 'users' } }
    }
  ];

  const form = useForm<ProfileFormData>({
    defaultValues: {
      name: profile?.name || "",
      bio: profile?.bio || "",
    },
    mode: "onChange",
  });

  // Atualiza valores quando o profile carrega
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        bio: profile.bio || ""
      });
    }
  }, [profile, form]);

  // Buscar usuário atual e notificações
  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      try {
        const user = getCurrentUser();
        if (!user) return;

        setUserId(user.id);

        // Buscar notificações do usuário
        const response = await pb.collection('notifications').getList(1, 50, {
          filter: `recipient = "${user.id}"`,
          sort: '-created',
          expand: 'sender'
        });

        setNotifications(response.items as unknown as Notification[]);
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchUserAndNotifications();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Track achievement: Avatar personalizado
      trackAchievementWithNotification('avatar_personalizado', {
        timestamp: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePresetSelect = async (url: string) => {
    try {
      // Baixa a imagem do preset
      const response = await fetch(url);
      const blob = await response.blob();

      // Converte para File
      const file = new File([blob], `avatar-preset-${Date.now()}.svg`, { type: 'image/svg+xml' });

      setAvatar(file);
      setPresetAvatarUrl(url);
      setAvatarPreview(url);

      toast.success('Avatar preset selecionado!');

      // Track achievement: Colecionador de Avatares
      await trackAchievementWithNotification('colecionador_avatares', {
        timestamp: new Date().toISOString(),
        presetUrl: url
      });
    } catch (error) {
      console.error('Erro ao baixar preset:', error);
      toast.error('Erro ao selecionar avatar preset');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await pb.collection('notifications').update(notificationId, {
        read: true
      });

      // Atualiza o estado local
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );

      toast.success('Notificação marcada como lida');
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);

      await Promise.all(
        unreadNotifications.map(notif =>
          pb.collection('notifications').update(notif.id, { read: true })
        )
      );

      // Atualiza o estado local
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );

      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await pb.collection('notifications').delete(notificationId);

      // Remove do estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      toast.success('Notificação deletada com sucesso');
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast.error('Erro ao deletar notificação');
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const readNotifications = notifications.filter(n => n.read);

      await Promise.all(
        readNotifications.map(notif =>
          pb.collection('notifications').delete(notif.id)
        )
      );

      // Remove do estado local
      setNotifications(prev => prev.filter(n => !n.read));

      toast.success(`${readNotifications.length} notificações deletadas`);
    } catch (error) {
      console.error('Erro ao deletar notificações:', error);
      toast.error('Erro ao deletar notificações');
    }
  };

  const handleNavigateToMessage = (notification: Notification) => {
    // Prioridade 1: Usar source_url se disponível (novo sistema)
    if (notification.source_url) {
      window.location.href = notification.source_url;
      return;
    }

    // Prioridade 2: Construir URL baseado em source_type e source_id
    if (notification.source_type && notification.source_id) {
      const urlMap: Record<string, string> = {
        'chat_message': `/dashboard/chat?messageId=${notification.source_id}${notification.metadata?.classId ? `&classId=${notification.metadata.classId}` : ''}`,
        'forum_post': `/forum/post/${notification.source_id}`,
        'forum_comment': `/forum/post/${notification.metadata?.postId || ''}#${notification.source_id}`,
        'exercise': `/exercises/${notification.source_id}`,
        'exercise_comment': `/exercises/${notification.metadata?.exerciseId || ''}/comments#${notification.source_id}`,
        'class': `/classes/${notification.source_id}`,
        'assignment': `/assignments/${notification.source_id}`,
        'whiteboard': `/dashboard/whiteboard?id=${notification.source_id}`,
        'note': `/dashboard/notes?id=${notification.source_id}`,
      };
      
      const url = urlMap[notification.source_type];
      if (url) {
        window.location.href = url;
        return;
      }
    }

    // Fallback: Usar metadata (comportamento legado para compatibilidade)
    if (notification.type === 'message' || notification.type === 'mention') {
      if (notification.metadata?.classId) {
        window.location.href = `/dashboard/chat?classId=${notification.metadata.classId}`;
      } else {
        window.location.href = '/dashboard/chat';
      }
    } else if (notification.type === 'comment' && notification.metadata?.postId) {
      window.location.href = `/posts/${notification.metadata.postId}`;
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) return;
    setUpdating(true);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('bio', data.bio);

      if (avatar) {
        formData.append('avatar', avatar);
      }

      // Atualiza o usuário no PocketBase
      await pb.collection("users").update(profile.id, formData);

      // Track bio-related achievements
      const oldBio = profile.bio || '';
      const newBio = data.bio || '';

      // 📝 First Bio Achievement
      if (!oldBio && newBio.trim()) {
        await trackAchievementWithNotification('primeira_bio', {
          timestamp: new Date().toISOString(),
          bioLength: newBio.length
        });
      }

      // 📚 Bio Eloquent (100+ characters)
      if (newBio.length >= 100) {
        await trackAchievementWithNotification('bio_eloquente', {
          timestamp: new Date().toISOString(),
          bioLength: newBio.length
        });
      }

      // ✍️ Bio Master (200+ characters)
      if (newBio.length >= 200) {
        await trackAchievementWithNotification('bio_master', {
          timestamp: new Date().toISOString(),
          bioLength: newBio.length
        });
      }

      // 🎨 Profile Complete (name + bio + avatar)
      const hasName = data.name.trim().length > 0;
      const hasBio = newBio.trim().length > 0;
      const hasAvatar = profile.avatar_url || avatar;
      
      if (hasName && hasBio && hasAvatar) {
        await trackAchievementWithNotification('perfil_completo', {
          timestamp: new Date().toISOString(),
          completeness: 100
        });
      }

      toast.success("Perfil atualizado com sucesso");
      onSaved();
    } catch (err: any) {
      console.error("Erro ao atualizar perfil:", err);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Card de Perfil */}
      <Card className="bg-gradient-to-br from-background/90 to-background/50 backdrop-blur-sm border-sidebar-border/50 shadow-xl ring-1 ring-black/5 rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">
            {isEditing ? "Editar Perfil" : "Detalhes do Perfil"}
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            {isEditing
              ? "Atualize suas informações pessoais"
              : "Suas informações pessoais"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <Avatar className="h-24 w-24 mb-4 border-2 border-coderbot-purple/30 shadow-lg ring-1 ring-black/5">
                    <AvatarImage
                      src={avatarPreview || profile?.avatar_url || undefined}
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-coderbot-purple/10 text-coderbot-purple text-lg">
                      {profile?.name ? profile.name.charAt(0) : <User />}
                    </AvatarFallback>
                  </Avatar>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <AvatarPresets
                      onSelect={handlePresetSelect}
                      currentAvatar={presetAvatarUrl}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={triggerFileInput}
                      className="relative group overflow-hidden shadow-sm ring-1 ring-black/5 hover:shadow-md transition-all duration-200"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Enviar Foto
                      <span className="absolute inset-0 flex items-center justify-center bg-coderbot-purple text-white opacity-0 group-hover:opacity-100 transition-opacity rounded">
                        Escolher arquivo
                      </span>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        value={profile?.email || ""}
                        disabled
                        className="bg-muted/50"
                      />
                    </FormControl>
                    <FormDescription>O email não pode ser alterado</FormDescription>
                  </FormItem>
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobre você</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Conte um pouco sobre você, seus interesses e objetivos..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updating}
                    className="bg-gradient-to-r from-coderbot-purple to-purple-600 hover:from-coderbot-purple/90 hover:to-purple-600/90 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-all duration-200"
                  >
                    {updating ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nome</p>
                      <p className="font-medium">{profile?.name || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="font-medium">{profile?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <School className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo de Conta</p>
                      <p className="font-medium capitalize">
                        {getCurrentUser()?.role === 'teacher' ? 'Professor' : 'Aluno'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Membro desde</p>
                      <p className="font-medium">
                        {new Date(profile?.created_at || "").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Sobre</h3>
                <p className="text-muted-foreground">
                  {profile?.bio || "Nenhuma informação adicional fornecida."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de Notificações */}
      <Card className="bg-gradient-to-br from-background/90 to-background/50 backdrop-blur-sm border-sidebar-border/50 shadow-xl ring-1 ring-black/5 rounded-2xl max-w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">Notificações</CardTitle>
                <p className="text-muted-foreground">
                  {notifications.filter(n => !n.read).length > 0
                    ? `${notifications.filter(n => !n.read).length} não lidas`
                    : 'Todas as notificações foram lidas'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {notifications.filter(n => !n.read).length > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  variant="outline"
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Marcar todas como lidas
                </Button>
              )}
              {notifications.filter(n => n.read).length > 0 && (
                <Button
                  onClick={handleDeleteAllRead}
                  variant="outline"
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar lidas
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loadingNotifications ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-muted rounded-lg"></div>
              <div className="h-20 bg-muted rounded-lg"></div>
              <div className="h-20 bg-muted rounded-lg"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
                      !notification.read
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                        : 'bg-background/80 border-border'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar do remetente */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          {notification.expand?.sender?.avatar ? (
                            <img
                              src={`${pb.baseUrl}/api/files/${notification.expand.sender.collectionId}/${notification.expand.sender.id}/${notification.expand.sender.avatar}`}
                              alt={notification.expand.sender.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-white text-sm font-bold">
                              {(notification.expand?.sender?.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Conteúdo da notificação */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground mb-1">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.content}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.created).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <Badge variant={notification.read ? "secondary" : "default"} className="text-xs">
                                  {notification.read ? 'Lida' : 'Não lida'}
                                </Badge>
                              </div>

                              {/* Botões de ação rápida */}
                              {(notification.type === 'message' || notification.type === 'mention' || notification.type === 'comment') && (
                                <Button
                                  onClick={() => handleNavigateToMessage(notification)}
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  {notification.type === 'message' || notification.type === 'mention' 
                                    ? 'Ver mensagem' 
                                    : 'Ver comentário'}
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              )}
                            </div>

                            {/* Ações */}
                            <div className="flex flex-col gap-1">
                              {!notification.read && (
                                <Button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                                  title="Marcar como lida"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDeleteNotification(notification.id)}
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                title="Deletar notificação"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-lg mb-1">Nenhuma notificação</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Você não tem notificações no momento. Quando houver novidades, elas aparecerão aqui!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
