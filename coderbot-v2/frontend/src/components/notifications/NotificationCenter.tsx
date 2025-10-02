import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { pb } from "@/integrations/pocketbase/client";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";

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
  userId: string;
  onNotificationClick?: () => void;
}

export const NotificationCenter = ({ userId, onNotificationClick }: NotificationCenterProps) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotificationCard, setShowNotificationCard] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

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
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    // Atualizar notificações a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotificationClick = useCallback(() => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      navigate('/profile');
    }
  }, [onNotificationClick, navigate]);

  const toggleNotificationCard = useCallback(() => {
    setShowNotificationCard(!showNotificationCard);
  }, [showNotificationCard]);

  if (isLoading) {
    return (
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Ícone de notificação com badge */}
      <button
        onClick={handleNotificationClick}
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

      {/* Card de notificações recentes */}
      <AnimatePresence>
        {recentNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute right-0 mt-2 w-80 z-50"
          >
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Notificações
                    </span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleNotificationCard}
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                  >
                    {showNotificationCard ? <X className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                  </Button>
                </div>

                <AnimatePresence>
                  {showNotificationCard && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 mt-2"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
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
