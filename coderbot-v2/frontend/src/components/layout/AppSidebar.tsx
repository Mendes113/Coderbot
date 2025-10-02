import { User, MessageSquare, GraduationCap, Presentation, BookOpen, Bell, X } from "lucide-react";
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
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

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
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [showNotificationsCard, setShowNotificationsCard] = useState(false);
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
    }
    setIsLoading(false);
  }, []); // Dependência vazia é intencional - só executar uma vez na montagem

  // Buscar notificações não lidas e recentes
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        // Buscar contagem de notificações não lidas
        const countResponse = await api.get('/notifications/unread-count', {
          headers: {
            'X-User-Id': userId,
          }
        });

        if (!isMounted) return;
        setUnreadNotificationsCount(countResponse.data.count || 0);

        // Buscar notificações recentes (últimas 3 não lidas)
        if (countResponse.data.count > 0) {
          try {
            const recentResponse = await pb.collection('notifications').getList(1, 3, {
              filter: `recipient = "${userId}" && read = false`,
              sort: '-created',
              expand: 'sender'
            });

            if (!isMounted) return;
            setRecentNotifications(recentResponse.items || []);
          } catch (recentError) {
            console.error('Erro ao buscar notificações recentes:', recentError);
          }
        } else {
          if (!isMounted) return;
          setRecentNotifications([]);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Erro ao buscar notificações:', error);
        setUnreadNotificationsCount(0);
        setRecentNotifications([]);
      }
    };

    fetchNotifications();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
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
    { id: "notes", label: "Notas", icon: BookOpen, accessKey: "n", path: "/dashboard/notes" },
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

  // Função para lidar com clique no ícone de notificações
  const handleNotificationClick = useCallback(() => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      navigate('/profile');
    }
  }, [onNotificationClick, navigate]);

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
              {filteredNavItems.map((item) => {
                if (item.id === "notifications") {
                  return (
                    <SidebarMenuItem key={item.id} className="edu-card-hover">
                      <SidebarMenuButton
                        asChild
                        isActive={isItemActive(item)}
                        className="edu-focus relative"
                      >
                        <button onClick={handleNotificationClick} className="flex items-center w-full">
                          <div className="relative">
                            <item.icon />
                            {unreadNotificationsCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                                </span>
                              </div>
                            )}
                          </div>
                          <span>{item.label}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.id} className="edu-card-hover">
                    <SidebarMenuButton asChild isActive={isItemActive(item)} className="edu-focus">
                      <Link to={item.path} onClick={() => onNavChange && onNavChange(item.id)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
            <div className="flex items-center justify-between gap-3 rounded-xl border border-sidebar-border bg-white/80 px-3 py-2 shadow-sm dark:bg-sidebar/30">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--education-primary))] to-[hsl(var(--education-secondary))] ring-2 ring-offset-1 ring-[hsl(var(--education-primary-light))] shadow-md">
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
          </div>
        )}

        {/* Card de Notificações */}
        <AnimatePresence>
          {recentNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-3 pb-3"
            >
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Notificações
                      </span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        {unreadNotificationsCount}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotificationsCard(!showNotificationsCard)}
                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                    >
                      {showNotificationsCard ? <X className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {showNotificationsCard && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2 mt-2"
                      >
                        {recentNotifications.slice(0, 3).map((notification) => (
                          <div
                            key={notification.id}
                            className="p-2 bg-white dark:bg-gray-800 rounded-md border border-blue-100 dark:border-blue-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            onClick={() => navigate('/profile')}
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {notification.expand?.sender?.avatar ? (
                                  <img
                                    src={`${pb.baseUrl}/api/files/${notification.expand.sender.collectionId}/${notification.expand.sender.id}/${notification.expand.sender.avatar}`}
                                    alt={notification.expand.sender.name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-blue-600">
                                    {(notification.expand?.sender?.name || 'U').charAt(0).toUpperCase()}
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
                        ))}

                        {unreadNotificationsCount > 3 && (
                          <div className="text-center pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/profile')}
                              className="text-xs h-7 border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              Ver todas ({unreadNotificationsCount})
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

        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
};
