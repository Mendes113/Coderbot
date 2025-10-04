import { User, MessageSquare, GraduationCap, Presentation, BookOpen, X, Bell, Check, CheckCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useMemo, useState, useCallback } from "react";
import { getCurrentUser, pb } from "@/integrations/pocketbase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

// Temporarily disable NextAuth.js for hydration issues
// import { useSession } from 'next-auth/react';

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  accessKey: string;
  path: string;
  roles?: string[];
};

type AppSidebarProps = {
  currentNav?: string;
  onNavChange?: (nav: string) => void;
  onNotificationClick?: () => void;
};

export const AppSidebar = ({ currentNav, onNavChange, onNotificationClick }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacherButtonAnimating, setIsTeacherButtonAnimating] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { state } = useSidebar();
  const { theme } = useTheme();

  // Memoizar busca do usuário para evitar recálculos
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserRole(user.role);
      setUserId(user.id);
      setUserName(user.name || user.email || "Usuário");
      // Construir URL do avatar se existir
      if (user.avatar) {
        const avatarUrl = `${pb.baseUrl}/api/files/${user.collectionId}/${user.id}/${user.avatar}`;
        setUserAvatarUrl(avatarUrl);
      }
      
      // Buscar notificações
      fetchNotifications(user.id);
    }
    setIsLoading(false);
  }, []); // Dependência vazia é intencional - só executar uma vez na montagem

  // Buscar notificações do usuário
  const fetchNotifications = async (uid: string) => {
    try {
      const response = await pb.collection('notifications').getList(1, 5, {
        filter: `recipient = "${uid}" && read = false`,
        sort: '-created',
        expand: 'sender'
      });
      
      setNotifications(response.items || []);
      setUnreadCount(response.totalItems || 0);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  // Marcar notificação individual como lida
  const markAsRead = async (notificationId: string) => {
    try {
      await pb.collection('notifications').update(notificationId, {
        read: true,
        read_at: new Date().toISOString()
      });
      
      // Atualiza o estado local removendo a notificação da lista
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    if (!userId) return;
    
    try {
      // Marca todas as notificações não lidas do usuário
      const unreadNotifications = await pb.collection('notifications').getFullList({
        filter: `recipient = "${userId}" && read = false`
      });

      await Promise.all(
        unreadNotifications.map(notification =>
          pb.collection('notifications').update(notification.id, {
            read: true,
            read_at: new Date().toISOString()
          })
        )
      );

      setNotifications([]);
      setUnreadCount(0);
      setShowNotifications(false);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = pb.collection('notifications').subscribe('*', (e) => {
      if (e.record?.recipient === userId) {
        fetchNotifications(userId);
      }
    });

    return () => {
      unsubscribe.then(unsub => unsub()).catch(err => console.error('Error unsubscribing:', err));
    };
  }, [userId]);

  const normalizedUserRole = useMemo(() => (userRole || "").toLowerCase().trim(), [userRole]);
  const canAccessTeacherPanel = normalizedUserRole === "teacher" || normalizedUserRole === "admin";

  // Temporarily disable NextAuth.js for hydration issues
  // const { data: session } = useSession();

  const mainNavItems: NavItem[] = useMemo(() => [
    { id: "chat", label: "Chat", icon: MessageSquare, accessKey: "c", path: "/dashboard/chat" },

    {
      id: "student",
      label: "Aluno",
      icon: GraduationCap,
      accessKey: "s",
      path: "/dashboard/student",
      roles: ["student", "teacher", "admin"],
    },
    { id: "whiteboard", label: "Quadro", icon: Presentation, accessKey: "w", path: "/dashboard/whiteboard" },
    { id: "notes", label: "Notas", icon: BookOpen, accessKey: "o", path: "/dashboard/notes" },
    { id: "profile", label: "Perfil", icon: User, accessKey: "p", path: "/profile" },
  ], []);

  const filteredNavItems = useMemo(() => {
    return mainNavItems.filter((item) => {
      if (!item.roles) return true;
      // Fallback: mostrar itens com controle de role mesmo se a role ainda não estiver carregada
      if (!normalizedUserRole) return true;
      const allowed = item.roles.map(r => r.toLowerCase().trim());
      return allowed.includes(normalizedUserRole);
    });
  }, [mainNavItems, normalizedUserRole]); // Só recalcular quando role normalizada mudar

  // Mapa de atalhos Alt+<tecla> - memoizado
  const accessKeyMap = useMemo(() => {
    const map = new Map<string, NavItem>();
    for (const item of filteredNavItems) {
      map.set(item.accessKey.toLowerCase(), item);
    }
    return map;
  }, [filteredNavItems]);

  // Handler de atalho memoizado para evitar re-criação
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isEditable = !!target && (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable ||
      (target.getAttribute && target.getAttribute("role") === "textbox")
    );
    if (isEditable) return;
    if (!e.altKey) return;
    const key = e.key.toLowerCase();
    const item = accessKeyMap.get(key);
    if (!item) return;
    e.preventDefault();
    onNavChange(item.id);
    navigate(item.path);
  }, [accessKeyMap, navigate, onNavChange]);

  const handleOpenTeacherPanel = useCallback(() => {
    if (isTeacherButtonAnimating) return;
    setIsTeacherButtonAnimating(true);
  }, [isTeacherButtonAnimating]);

  useEffect(() => {
    if (!isTeacherButtonAnimating) return;
    const timeout = window.setTimeout(() => {
      onNavChange && onNavChange("teacher");
      navigate("/teacher");
      setIsTeacherButtonAnimating(false);
    }, 420);

    return () => window.clearTimeout(timeout);
  }, [isTeacherButtonAnimating, navigate, onNavChange]);

  // Listener global para atalhos (ignora campos de texto)
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Memoizar função de verificação de item ativo
  const isItemActive = useCallback((item: NavItem) => {
    return currentNav === item.id || location.pathname.startsWith(item.path);
  }, [currentNav, location.pathname]);


  if (isLoading) {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Carregando...</SidebarGroupLabel>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Header com branding moderno (adapta para compacto) */}
        <div
          className={
            "relative flex items-center gap-3 border-b border-sidebar-border/50 edu-card " +
            (state === "collapsed"
              ? "p-2 bg-transparent"
              : "p-4 bg-gradient-to-br from-[hsl(var(--education-primary-light))] via-transparent to-transparent backdrop-blur-sm edu-card-hover")
          }
        >
          <img
            src="/coderbot_colorfull.png"
            alt="Logo Coderbot"
            className={(state === "collapsed" ? "w-9 h-9" : "w-10 h-10") + " rounded-xl shadow-sm ring-1 ring-black/5 object-contain"}
          />
          {state !== "collapsed" && (
            <div className="edu-spacing-xs">
              <div className="edu-text-heading text-lg">CoderBot</div>
              <div className="edu-text-muted">Ambiente Educacional</div>
            </div>
          )}
        </div>

        <SidebarGroup className="edu-spacing-4">
          <SidebarGroupLabel className="edu-heading-h4"></SidebarGroupLabel>
          <SidebarGroupContent className="edu-spacing-3">
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.id} className="edu-card-hover">
                  <SidebarMenuButton asChild isActive={isItemActive(item)} className="edu-focus">
                    <Link to={item.path} onClick={() => onNavChange && onNavChange(item.id)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3">
        {state === "collapsed" ? (
          <div className="flex flex-col items-center gap-3 w-full">
            {canAccessTeacherPanel && (
              <motion.div
                initial={false}
                animate={isTeacherButtonAnimating ? { x: -28, rotate: -8, opacity: 0 } : { x: 0, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              >
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 rounded-full"
                  onClick={handleOpenTeacherPanel}
                  aria-label="Ir para o painel do professor"
                  disabled={isTeacherButtonAnimating}
                >
                  <GraduationCap className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--education-primary))] to-[hsl(var(--education-secondary))] ring-2 ring-offset-2 ring-[hsl(var(--education-primary-light))] shadow-md cursor-pointer">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </motion.div>
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex flex-col w-full gap-3">
            {canAccessTeacherPanel && (
              <motion.div
                initial={false}
                className="w-full"
                animate={isTeacherButtonAnimating ? { x: -36, rotate: -6, opacity: 0 } : { x: 0, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              >
                <Button
                  onClick={handleOpenTeacherPanel}
                  variant="outline"
                  className="w-full justify-center gap-2"
                  disabled={isTeacherButtonAnimating}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Painel do Professor</span>
                </Button>
              </motion.div>
            )}
            
            {/* Card integrado estilo Apple: Avatar + Notificação + Tema */}
            <div className="relative w-full">
              <div className="flex items-stretch gap-0 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl shadow-lg overflow-hidden">
                
                {/* Avatar Section */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center p-3 cursor-pointer group"
                  onClick={() => navigate("/profile")}
                >
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-white/20 dark:ring-gray-700/20 shadow-md group-hover:ring-4 transition-all duration-300">
                      {userAvatarUrl ? (
                        <img
                          src={userAvatarUrl}
                          alt={userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Divider */}
                <div className="w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent dark:via-gray-700" />

                {/* Notification Section - Apple style */}
                <motion.div 
                  className="flex-1 min-w-0 cursor-pointer group relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-2.5 px-3 py-2.5 h-full">
                    {/* Bell Icon com Badge */}
                    <div className="relative flex-shrink-0">
                      <motion.div
                        animate={{ 
                          rotate: showNotifications ? [0, -15, 15, -10, 10, 0] : 0 
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <Bell className={`h-4 w-4 transition-colors duration-200 ${
                          notifications.length > 0 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      </motion.div>
                      
                      {/* Badge - estilo iOS */}
                      {unreadCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-sm"
                        >
                          <span className="text-white text-[9px] font-bold leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {notifications.length > 0 ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                            {notifications[0]?.title || 'Nova notificação'}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                            {notifications[0]?.content || ''}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center h-full">
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Chevron Indicator */}
                    <motion.div
                      animate={{ rotate: showNotifications ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="flex-shrink-0"
                    >
                      <svg 
                        className="w-3 h-3 text-gray-400 dark:text-gray-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Divider */}
                <div className="w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent dark:via-gray-700" />

                {/* Theme Toggle Section */}
                <div className="flex items-center justify-center p-2.5">
                  <ThemeToggle />
                </div>
              </div>

              {/* Dropdown - Apple style glassmorphism */}
              <AnimatePresence>
                {showNotifications && notifications.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ 
                      duration: 0.2, 
                      ease: [0.16, 1, 0.3, 1] // Apple's spring curve
                    }}
                    className="absolute bottom-full left-0 right-0 mb-3 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden z-50"
                  >
                    {/* Header - estilo iOS */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Notificações
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                            {unreadCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {unreadCount > 0 && (
                            <motion.button
                              whileHover={{ scale: 1.05, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAllAsRead();
                              }}
                              className="p-1.5 rounded-full transition-colors group"
                              title="Marcar todas como lidas"
                            >
                              <CheckCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowNotifications(false);
                            }}
                            className="p-1.5 rounded-full transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notifications List */}
                    <div className="max-h-[320px] overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {notifications.map((notification, index) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ 
                              delay: index * 0.03,
                              duration: 0.3,
                              ease: [0.16, 1, 0.3, 1]
                            }}
                            className="relative group"
                          >
                            <div 
                              className="p-3 rounded-xl cursor-pointer transition-all duration-150 hover:bg-gray-50/80 dark:hover:bg-gray-800/80"
                              onClick={() => {
                                navigate('/profile');
                                setShowNotifications(false);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                  {notification.expand?.sender?.avatar ? (
                                    <img
                                      src={`${pb.baseUrl}/api/files/${notification.expand.sender.collectionId}/${notification.expand.sender.id}/${notification.expand.sender.avatar}`}
                                      alt={notification.expand.sender.name}
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  ) : (
                                    <span className="text-white text-xs font-semibold">
                                      {(notification.expand?.sender?.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                    {notification.title}
                                  </p>
                                  <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-snug">
                                    {notification.content}
                                  </p>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                    {new Date(notification.created).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>

                                {/* Botão de marcar como lida - aparece no hover */}
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  whileHover={{ scale: 1.1, backgroundColor: "rgba(34, 197, 94, 0.15)" }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 flex-shrink-0"
                                  title="Marcar como lida"
                                >
                                  <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Footer - "Ver todas" */}
                    {unreadCount > notifications.length && (
                      <div className="px-3 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            navigate('/profile');
                            setShowNotifications(false);
                          }}
                          className="w-full text-xs text-center text-blue-600 dark:text-blue-400 font-semibold py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          Ver todas as {unreadCount} notificações
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
};
