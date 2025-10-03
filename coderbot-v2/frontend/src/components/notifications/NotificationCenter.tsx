import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { pb } from "@/integrations/pocketbase/client";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

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

interface NotificationCenterProps {
  userId?: string;
  onNotificationClick?: () => void;
  // When true, use mockNotifications instead of calling PocketBase (useful for dev testing)
  mockMode?: boolean;
  mockNotifications?: Notification[];
}

export const NotificationCenter = ({ userId, onNotificationClick, mockMode = false, mockNotifications }: NotificationCenterProps) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotificationCard, setShowNotificationCard] = useState(false);
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    // If in mock mode, use provided mock notifications
    if (mockMode) {
      const items = mockNotifications || [];
      setUnreadCount(items.filter(n => !n.read).length);
      setRecentNotifications(items.slice(0, 3));
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setIsLoading(false);
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    setIsLoading(true);
    let isMounted = true;

    try {
      // Buscar notificações não lidas diretamente do PocketBase
      const response = await pb.collection('notifications').getList(1, 50, {
        filter: `recipient = "${userId}" && read = false`,
        sort: '-created',
        expand: 'sender'
      });

      if (!isMounted) return;

      const notifications = response.items || [];
      setUnreadCount(notifications.length);
      setRecentNotifications(notifications.slice(0, 3) as unknown as Notification[]); // Apenas as 3 mais recentes

    } catch (error) {
      if (!isMounted) return;
      console.error('Erro ao buscar notificações:', error);
      setUnreadCount(0);
      setRecentNotifications([]);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [userId, mockMode, mockNotifications]);

  useEffect(() => {
    fetchNotifications();

    // Skip real-time subscriptions in mock mode
    if (mockMode || !userId) {
      return;
    }

    // Subscribe to real-time notifications updates
    const unsubscribe = pb.collection('notifications').subscribe('*', (e) => {
      // Check if the notification is for this user
      if (e.record?.recipient === userId) {
        console.log('Real-time notification received:', e.action, e.record);
        
        // Re-fetch notifications to get the latest data
        fetchNotifications();
      }
    });

    // Atualizar notificações a cada 30 segundos como fallback
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(interval);
      unsubscribe.then(unsub => unsub()).catch(err => console.error('Error unsubscribing:', err));
    };
  }, [fetchNotifications, userId, mockMode]);

  const handleNotificationClick = useCallback(() => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      navigate('/profile');
    }
    setShowNotificationCard(false);
  }, [onNotificationClick, navigate]);

  const toggleNotificationCard = useCallback(() => {
    setShowNotificationCard(prev => !prev);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!rootRef.current) return;
      if (e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setShowNotificationCard(false);
      }
    }

    if (showNotificationCard) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotificationCard]);

  if (isLoading) {
    return (
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  const bellButton = (
    <button
      onClick={toggleNotificationCard}
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Notificações"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </div>
      )}
    </button>
  );

  const dropdown = (
    <AnimatePresence>
      {showNotificationCard && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute right-0 mt-2 w-80 z-50"
          style={{ right: 12 }}
        >
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Notificações
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotificationCard(false)}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-2 mt-2">
                {recentNotifications.length > 0 ? (
                  <>
                    {recentNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleNotificationClick()}
                      />
                    ))}

                    {unreadCount > 3 && (
                      <div className="text-center pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotificationClick()}
                          className="text-xs h-7 border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          Ver todas ({unreadCount})
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nenhuma notificação
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative" ref={rootRef}>
      {bellButton}
      {typeof document !== 'undefined' ? createPortal(dropdown, document.body) : dropdown}
    </div>
  );
};

// Componente para cada item de notificação
interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const NotificationItem = ({ notification, onClick }: NotificationItemProps) => {
  const sender = notification.expand?.sender;

  return (
    <div
      className="p-2 bg-white dark:bg-gray-800 rounded-md border border-blue-100 dark:border-blue-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
          {sender?.avatar ? (
            <img
              src={`${pb.baseUrl}/api/files/${sender.collectionId}/${sender.id}/${sender.avatar}`}
              alt={sender.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-xs font-bold text-blue-600">
              {(sender?.name || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
            {notification.title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {notification.content}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {new Date(notification.created).toLocaleDateString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
