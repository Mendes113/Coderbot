import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { pb } from '@/integrations/pocketbase/client';
import { useAuthState } from '@/hooks/useAuthState';

export interface Notification {
  id: string;
  user: string;
  title: string;
  message: string;
  content?: string; // Compatibilidade com código antigo
  type: 'achievement' | 'system' | 'social' | 'easter_egg';
  read: boolean;
  achievement_id?: string;
  created: string;
  updated: string;
  recipient?: string; // Pode ser usado no lugar de user
  expand?: {
    sender?: {
      id: string;
      name: string;
      avatar?: string;
      collectionId?: string;
    };
  };
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuthState();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar notificações do servidor
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const records = await pb.collection('notifications').getFullList<Notification>({
        filter: `user = "${currentUser.id}"`,
        sort: '-created',
        requestKey: `notifications-${currentUser.id}`,
      });
      setNotifications(records);
    } catch (error) {
      console.error('[NotificationContext] Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Buscar notificações na montagem e quando o usuário mudar
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [isAuthenticated, currentUser?.id, fetchNotifications]);

  // 🔥 Realtime subscription para atualizações automáticas
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = pb.collection('notifications').subscribe<Notification>('*', (e) => {
      // Verificar se a notificação pertence ao usuário atual
      if (e.record.user !== currentUser.id) return;

      if (e.action === 'create') {
        // Nova notificação: adicionar no topo
        setNotifications((prev) => [e.record, ...prev]);
      } else if (e.action === 'update') {
        // Atualização: substituir notificação existente
        setNotifications((prev) =>
          prev.map((n) => (n.id === e.record.id ? e.record : n))
        );
      } else if (e.action === 'delete') {
        // Remoção: filtrar notificação deletada
        setNotifications((prev) => prev.filter((n) => n.id !== e.record.id));
      }
    });

    return () => {
      unsubscribe.catch((err) => {
        console.warn('[NotificationContext] Failed to unsubscribe:', err);
      });
    };
  }, [currentUser?.id]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (id: string) => {
    try {
      await pb.collection('notifications').update(id, { read: true });
      // O realtime subscription atualizará o estado automaticamente
    } catch (error) {
      console.error('[NotificationContext] Failed to mark as read:', error);
      throw error;
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      
      // Atualizar todas as notificações não lidas em paralelo
      await Promise.all(
        unreadNotifications.map((n) =>
          pb.collection('notifications').update(n.id, { read: true })
        )
      );
      
      // O realtime subscription atualizará o estado automaticamente
    } catch (error) {
      console.error('[NotificationContext] Failed to mark all as read:', error);
      throw error;
    }
  }, [currentUser?.id, notifications]);

  // Deletar notificação
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await pb.collection('notifications').delete(id);
      // O realtime subscription atualizará o estado automaticamente
    } catch (error) {
      console.error('[NotificationContext] Failed to delete notification:', error);
      throw error;
    }
  }, []);

  // Refresh manual (útil para force refresh)
  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Calcular contador de não lidas
  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook para consumir o contexto
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
