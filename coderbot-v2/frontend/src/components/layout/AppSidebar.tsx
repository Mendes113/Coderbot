import { User, MessageSquare, GraduationCap, Presentation, BookOpen, X, Bell, Check, CheckCheck, LogOut } from "lucide-react";
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
import { useGamification } from "@/hooks/useGamification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const [isShaking, setIsShaking] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [isAvatarShaking, setIsAvatarShaking] = useState(false);
  const [avatarClickCount, setAvatarClickCount] = useState(0);
  const [avatarClickTimer, setAvatarClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [isThemeShaking, setIsThemeShaking] = useState(false);
  const [themeClickCount, setThemeClickCount] = useState(0);
  const [themeClickTimer, setThemeClickTimer] = useState<NodeJS.Timeout | null>(null);
  const { state } = useSidebar();
  const { theme } = useTheme();
  
  // Hook de gamificação para rastrear easter eggs
  const { trackAction, getTotalPoints, stats } = useGamification();
  
  // Calcular nível do usuário baseado nos pontos
  const getUserLevel = useCallback(() => {
    const points = stats.totalPoints;
    if (points < 50) return 1;
    if (points < 150) return 2;
    if (points < 300) return 3;
    if (points < 500) return 4;
    if (points < 750) return 5;
    return Math.floor(points / 200) + 3; // Níveis avançados
  }, [stats.totalPoints]);

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

  // Função de logout
  const handleLogout = useCallback(() => {
    pb.authStore.clear();
    window.location.href = '/login';
  }, []);

  // Detectar cliques rápidos para animação de shake
  const handleNotificationClick = useCallback(() => {
    setShowNotifications(!showNotifications);
    
    // Incrementar contador de cliques
    setClickCount(prev => prev + 1);
    
    // Limpar timer anterior se existir
    if (clickTimer) {
      clearTimeout(clickTimer);
    }
    
    // Verificar se chegou a 3 cliques
    if (clickCount + 1 >= 3) {
      setIsShaking(true);
      setClickCount(0);
      
      // 🎮 Rastrear easter egg de cliques no sino
      trackAction('notification_clicks', {
        totalClicks: 3,
        timestamp: new Date().toISOString()
      });
      
      // Parar a animação após 500ms
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    }
    
    // Resetar contador após 1 segundo sem cliques
    const timer = setTimeout(() => {
      setClickCount(0);
    }, 1000);
    
    setClickTimer(timer);
  }, [showNotifications, clickCount, clickTimer, trackAction]);

  // Detectar cliques rápidos no avatar para animação de shake
  const handleAvatarClick = useCallback((callback?: () => void) => {
    // Executar callback se fornecido (para navegação)
    if (callback) callback();
    
    // Incrementar contador de cliques
    setAvatarClickCount(prev => prev + 1);
    
    // Limpar timer anterior se existir
    if (avatarClickTimer) {
      clearTimeout(avatarClickTimer);
    }
    
    // Verificar se chegou a 3 cliques
    if (avatarClickCount + 1 >= 3) {
      setIsAvatarShaking(true);
      setAvatarClickCount(0);
      
      // 🎮 Rastrear easter egg de cliques no avatar
      trackAction('avatar_explorer', {
        totalClicks: 3,
        timestamp: new Date().toISOString()
      });
      
      // Parar a animação após 500ms
      setTimeout(() => {
        setIsAvatarShaking(false);
      }, 500);
    }
    
    // Resetar contador após 1 segundo sem cliques
    const timer = setTimeout(() => {
      setAvatarClickCount(0);
    }, 1000);
    
    setAvatarClickTimer(timer);
  }, [avatarClickCount, avatarClickTimer, trackAction]);

  // Detectar cliques rápidos no theme toggle para animação de shake
  const handleThemeClick = useCallback(() => {
    // Incrementar contador de cliques
    setThemeClickCount(prev => prev + 1);
    
    // Limpar timer anterior se existir
    if (themeClickTimer) {
      clearTimeout(themeClickTimer);
    }
    
    // Verificar se chegou a 3 cliques
    if (themeClickCount + 1 >= 3) {
      setIsThemeShaking(true);
      setThemeClickCount(0);
      
      // 🎮 Rastrear easter egg de cliques no theme toggle
      trackAction('theme_master', {
        totalClicks: 3,
        currentTheme: theme,
        timestamp: new Date().toISOString()
      });
      
      // Parar a animação após 800ms (mais tempo para apreciar o glow)
      setTimeout(() => {
        setIsThemeShaking(false);
      }, 800);
    }
    
    // Resetar contador após 1 segundo sem cliques
    const timer = setTimeout(() => {
      setThemeClickCount(0);
    }, 1000);
    
    setThemeClickTimer(timer);
  }, [themeClickCount, themeClickTimer, theme, trackAction]);

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
    
    const timeout = window.setTimeout(() => {
      onNavChange && onNavChange("teacher");
      // Forçar refresh da página ao navegar para /teacher
      window.location.href = "/teacher";
    }, 420);
  }, [isTeacherButtonAnimating, onNavChange]);

  // Listener global para atalhos (ignora campos de texto)
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
    };
  }, [clickTimer]);

  // Limpar timer do avatar ao desmontar
  useEffect(() => {
    return () => {
      if (avatarClickTimer) {
        clearTimeout(avatarClickTimer);
      }
    };
  }, [avatarClickTimer]);

  // Limpar timer do theme ao desmontar
  useEffect(() => {
    return () => {
      if (themeClickTimer) {
        clearTimeout(themeClickTimer);
      }
    };
  }, [themeClickTimer]);

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

            {/* PAINEL DO PROFESSOR */}
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
            
            {/* Avatar com Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isAvatarShaking ? {
                    x: [0, -8, 8, -8, 8, -4, 4, 0],
                    rotate: [0, -3, 3, -3, 3, -1.5, 1.5, 0]
                  } : {}}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="relative cursor-pointer"
                  onClick={() => handleAvatarClick()}
                >
                  <motion.div
                    animate={isAvatarShaking ? {
                      scale: [1, 1.15, 1, 1.15, 1]
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <div className={`w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--education-primary))] to-[hsl(var(--education-secondary))] ring-2 ring-offset-2 ring-[hsl(var(--education-primary-light))] shadow-md ${isAvatarShaking ? 'ring-4 ring-blue-400 dark:ring-blue-500' : ''}`}>
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
                    {/* Badge de nível - canto inferior direito */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-white dark:border-gray-900 shadow-lg flex items-center justify-center"
                    >
                      <span className="text-[9px] font-bold text-white">
                        {getUserLevel()}
                      </span>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {userName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1.5"
                >
                  <User className="h-3.5 w-3.5 mr-2" />
                  Ver perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-xs cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded px-2 py-1.5"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Theme Toggle com animação - Giro suave */}
            <motion.div
              animate={isThemeShaking ? {
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              } : {}}
              transition={{ 
                duration: 0.6, 
                ease: [0.34, 1.56, 0.64, 1] // Bounce easing
              }}
              onClick={handleThemeClick}
            >
              <ThemeToggle />
            </motion.div>
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
            <motion.div 
              className="relative w-full"
              animate={isShaking ? {
                x: [0, -5, 35, -5, 10, -15, 5, 0],
                rotate: [0, -2, 2, -2, 2, -1, 1, 0]
              } : {}}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* Glow effect quando theme está shaking */}
              <AnimatePresence>
                {isThemeShaking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                  >
                    {/* Outer glow - camada mais intensa */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl blur-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9))',
                      }}
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    {/* Segunda camada de glow para mais intensidade */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl blur-xl"
                      style={{
                        background: 'radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8))',
                      }}
                      animate={{
                        scale: [1.05, 1.2, 1.05],
                        opacity: [0.6, 0.9, 0.6],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    {/* Animated border */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #9333ea, #3b82f6, #9333ea, #3b82f6)',
                        backgroundSize: '300% 300%',
                        padding: '2px',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                      }}
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-stretch gap-0 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl shadow-lg overflow-hidden relative z-10">
                
                {/* Avatar Section */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      animate={isAvatarShaking ? {
                        x: [0, -8, 8, -8, 8, -4, 4, 0],
                        rotate: [0, -3, 3, -3, 3, -1.5, 1.5, 0]
                      } : {}}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="flex items-center justify-center p-3 cursor-pointer group"
                      onClick={() => handleAvatarClick()}
                    >
                      <motion.div 
                        className="relative"
                        animate={isAvatarShaking ? {
                          scale: [1, 1.1, 1, 1.1, 1]
                        } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <div className={`w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-white/20 dark:ring-gray-700/20 shadow-md group-hover:ring-4 transition-all duration-300 ${isAvatarShaking ? 'ring-4 ring-blue-400 dark:ring-blue-500' : ''}`}>
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
                        {/* Badge de nível - canto inferior direito */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-white dark:border-gray-800 shadow-lg flex items-center justify-center"
                        >
                          <span className="text-[9px] font-bold text-white">
                            {getUserLevel()}
                          </span>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
                    <DropdownMenuLabel className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {userName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1.5"
                    >
                      <User className="h-3.5 w-3.5 mr-2" />
                      Ver perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-xs cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded px-2 py-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Divider */}
                <div className="w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent dark:via-gray-700" />

                {/* Notification Section - Apple style */}
                <motion.div 
                  className="flex-1 min-w-0 cursor-pointer group relative"
                  onClick={handleNotificationClick}
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
                          animate={{ 
                            scale: isShaking ? [1, 1.3, 1, 1.3, 1] : 1 
                          }}
                          transition={{ duration: 0.5 }}
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

                {/* Theme Toggle Section - Animação sutil */}
                <motion.div 
                  className="flex items-center justify-center p-2.5"
                  animate={isThemeShaking ? {
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  } : {}}
                  transition={{ 
                    duration: 0.6, 
                    ease: [0.34, 1.56, 0.64, 1] // Bounce easing
                  }}
                  onClick={handleThemeClick}
                >
                  <ThemeToggle />
                </motion.div>
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
                                {/* Avatar with Dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button 
                                      className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
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
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
                                    <DropdownMenuLabel className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                      {notification.expand?.sender?.name || 'Usuário'}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (notification.expand?.sender?.id) {
                                          navigate(`/profile/${notification.expand.sender.id}`);
                                          setShowNotifications(false);
                                        }
                                      }}
                                      className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1.5"
                                    >
                                      Ver perfil
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                      className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1.5"
                                    >
                                      Marcar como lida
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                
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
            </motion.div>
            
            {/* Badge de Pontos de Gamificação */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="w-full px-2"
            >
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-purple-500/20 border border-purple-300/30 dark:border-purple-500/30 p-3">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-400/5 via-transparent to-blue-400/5" />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="text-xl"
                    >
                      🎮
                    </motion.div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        Pontos de Descoberta
                      </p>
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                        {stats.totalPoints} pts
                      </p>
                    </div>
                  </div>
                  
                  {/* Sparkle animation */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-lg opacity-60"
                  >
                    ✨
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
};
