// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { pb } from '@/integrations/pocketbase/client';
import { useAuthState } from '@/hooks/useAuthState';

export interface Notification {
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
  read_at?: string;
  source_type?: 'chat_message' | 'forum_post' | 'forum_comment' | 'exercise' | 'exercise_comment' | 'class' | 'assignment' | 'whiteboard' | 'note' | 'system';
  source_id?: string;
  source_url?: string;
  expand?: {
    sender?: {
      id: string;
      name: string;
      avatar?: string;
      collectionId: string;
    };
  };
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/**
 * Provider que gerencia o estado global de notificações com suporte a realtime.
 * 
 * Features:
 * - Estado centralizado e reativo
 * - Realtime updates via PocketBase subscriptions
 * - Auto-refresh quando usuário muda
 * - Otimistic updates para melhor UX
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuthState();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch inicial de notificações
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await pb.collection('notifications').getList(1, 50, {
        filter: `recipient = "${currentUser.id}"`,
        sort: '-created',
        expand: 'sender',
      });

      setNotifications(response.items as unknown as Notification[]);
    } catch (error) {
      console.error('[NotificationContext] Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Configurar realtime subscription
  useEffect(() => {
    if (!currentUser?.id) {
      // Limpar subscription se usuário deslogar
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Fetch inicial
    fetchNotifications();

    // Subscribe para updates em tempo real
    const setupRealtimeSubscription = async () => {
      try {
        // Desinscrever de subscription anterior se existir
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }

        // Subscribe para notificações do usuário atual
        await pb.collection('notifications').subscribe('*', (e) => {
          const notification = e.record as unknown as Notification;

          // Apenas processar notificações do usuário atual
          if (notification.recipient !== currentUser.id) {
            return;
          }

          if (e.action === 'create') {
            // Nova notificação - adicionar ao topo
            setNotifications((prev) => [notification, ...prev]);
          } else if (e.action === 'update') {
            // Atualizar notificação existente
            setNotifications((prev) =>
              prev.map((n) => (n.id === notification.id ? notification : n))
            );
          } else if (e.action === 'delete') {
            // Remover notificação
            setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
          }
        }, {
          filter: `recipient = "${currentUser.id}"`
        });

        // Salvar função de unsubscribe
        unsubscribeRef.current = () => {
          pb.collection('notifications').unsubscribe('*');
        };
      } catch (error) {
        console.error('[NotificationContext] Error setting up realtime subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Cleanup ao desmontar ou quando usuário mudar
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUser?.id, fetchNotifications]);

  // Marcar notificação como lida (optimistic update)
  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, read: true, read_at: new Date().toISOString() }
          : n
      )
    );

    try {
      await pb.collection('notifications').update(notificationId, {
        read: true,
        read_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[NotificationContext] Error marking notification as read:', error);
      // Reverter optimistic update em caso de erro
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.id) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() }))
    );

    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      
      // Atualizar todas em paralelo
      await Promise.all(
        unreadNotifications.map((n) =>
          pb.collection('notifications').update(n.id, {
            read: true,
            read_at: new Date().toISOString(),
          })
        )
      );
    } catch (error) {
      console.error('[NotificationContext] Error marking all as read:', error);
      // Reverter optimistic update em caso de erro
      await fetchNotifications();
    }
  }, [currentUser?.id, notifications, fetchNotifications]);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    try {
      await pb.collection('notifications').delete(notificationId);
    } catch (error) {
      console.error('[NotificationContext] Error deleting notification:', error);
      // Reverter optimistic update em caso de erro
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  // Calcular unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook para acessar o contexto de notificações.
 * 
 * @example
 * const { notifications, unreadCount, markAsRead } = useNotifications();
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
