import React, { useEffect, useState, useCallback } from 'react';
import { Bell, BellOff, Check, CheckCheck, Trash2, MessageSquare, Users, Trophy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { pb } from '@/integrations/pocketbase/client';
import { getCurrentUser } from '@/integrations/pocketbase/client';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  recipient: string;
  sender: string;
  title: string;
  content: string;
  type: 'mention' | 'forum_reply' | 'class_invite' | 'system' | 'achievement';
  read: boolean;
  metadata?: Record<string, any>;
  created: string;
  updated: string;
  expand?: {
    sender?: {
      id: string;
      name: string;
      avatar?: string;
      email: string;
    };
  };
}

interface NotificationsListProps {
  className?: string;
}

const notificationTypeConfig = {
  mention: {
    icon: MessageSquare,
    label: 'Menção',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-950/40',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200',
  },
  forum_reply: {
    icon: MessageSquare,
    label: 'Resposta no Fórum',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-950/40',
    badgeClass: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-200',
  },
  class_invite: {
    icon: Users,
    label: 'Convite de Turma',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-950/40',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200',
  },
  system: {
    icon: AlertCircle,
    label: 'Sistema',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-950/40',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-200',
  },
  achievement: {
    icon: Trophy,
    label: 'Conquista',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950/40',
    badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200',
  },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return `${diffInMinutes}min atrás`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h atrás`;
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)}d atrás`;
  } else {
    return date.toLocaleDateString('pt-BR');
  }
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ notification, onMarkAsRead, onDelete }) => {
  const config = notificationTypeConfig[notification.type];
  const Icon = config.icon;

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
  };

  const handleDelete = () => {
    onDelete(notification.id);
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-sm",
      !notification.read && "ring-1 ring-primary/20 bg-primary/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            config.bgColor
          )}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={cn("text-xs", config.badgeClass)}>
                    {config.label}
                  </Badge>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>

                <h4 className={cn(
                  "font-semibold text-sm mb-1",
                  !notification.read && "text-foreground"
                )}>
                  {notification.title}
                </h4>

                <p className={cn(
                  "text-sm text-muted-foreground mb-2",
                  !notification.read && "text-foreground/80"
                )}>
                  {notification.content}
                </p>

                {notification.expand?.sender && (
                  <p className="text-xs text-muted-foreground">
                    De: {notification.expand.sender.name}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-8 w-8 p-0"
                  title={notification.read ? "Marcar como não lida" : "Marcar como lida"}
                >
                  {notification.read ? (
                    <BellOff className="w-3 h-3" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Excluir notificação"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {formatDate(notification.created)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const NotificationsList: React.FC<NotificationsListProps> = ({ className }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const currentUser = getCurrentUser();
  const userId = currentUser?.id;

  const loadNotifications = useCallback(async (reset = false) => {
    if (!userId) return;

    try {
      if (reset) {
        setLoading(true);
        setPage(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const offset = currentPage * 50;

      const response = await pb.collection('notifications').getList(currentPage + 1, 50, {
        filter: `recipient = "${userId}"`,
        sort: '-created',
        expand: 'sender'
      });

      if (reset) {
        setNotifications(response.items as Notification[]);
      } else {
        setNotifications(prev => [...prev, ...(response.items as Notification[])]);
      }

      setHasMore(response.items.length === 50 && (currentPage + 1) * 50 < response.totalItems);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, page]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      await pb.collection('notifications').update(notificationId, {
        read: !notification.read
      });

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read: !n.read }
            : n
        )
      );

      toast.success(
        notification.read
          ? 'Notificação marcada como não lida'
          : 'Notificação marcada como lida'
      );
    } catch (error) {
      console.error('Erro ao marcar notificação:', error);
      toast.error('Erro ao atualizar notificação');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await pb.collection('notifications').delete(notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificação excluída');
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      toast.error('Erro ao excluir notificação');
    }
  };

  const markAllAsRead = async () => {
    try {
      await pb.send('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'X-User-Id': userId || '',
        }
      });

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-16 h-5" />
                    <Skeleton className="w-2 h-2 rounded-full" />
                  </div>
                  <Skeleton className="w-3/4 h-4" />
                  <Skeleton className="w-full h-3" />
                  <Skeleton className="w-20 h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Notificações</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="w-3 h-3 mr-1" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Você será notificado aqui sobre menções, respostas no fórum e outras atividades importantes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          </ScrollArea>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => loadNotifications(false)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    Carregando...
                  </>
                ) : (
                  'Carregar mais'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
