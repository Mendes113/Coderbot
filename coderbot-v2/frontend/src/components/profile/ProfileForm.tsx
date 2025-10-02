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
import { Camera, Mail, User, Calendar, CheckCircle, XCircle, Briefcase, CalendarDays, School, Bell, Clock } from "lucide-react";
import { toast } from "sonner";
import { pb, getCurrentUser } from "@/integrations/pocketbase/client";
import { useUserData } from "@/hooks/useUserData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AvatarPresets } from "./AvatarPresets";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

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
  metadata?: {
    classId?: string;
    commentId?: string;
    context?: string;
    mentionedBy?: string;
    postId?: string;
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
  const [updating, setUpdating] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [presetAvatarUrl, setPresetAvatarUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="space-y-6">
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

        <CardContent>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
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

                <div className="space-y-3">
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
      <Card className="bg-gradient-to-br from-background/90 to-background/50 backdrop-blur-sm border-sidebar-border/50 shadow-xl ring-1 ring-black/5 rounded-2xl">
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
          </div>
        </CardHeader>

        <CardContent>
          {/* Componente de notificações rápidas */}
          {userId && (
            <div className="mb-6">
              <NotificationCenter userId={userId} onNotificationClick={() => {}} />
            </div>
          )}

          {loadingNotifications ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          ) : notifications.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
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
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                            </div>

                            {/* Ações */}
                            {!notification.read && (
                              <Button
                                onClick={() => handleMarkAsRead(notification.id)}
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-lg">Nenhuma notificação</h3>
              <p className="text-sm text-muted-foreground">
                Você não tem notificações no momento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
