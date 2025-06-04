import { User, MessageSquare, Code, BarChart3, GraduationCap, FileText, Presentation, GitBranch, ClipboardEdit, Brain, TrendingUp, Star, Sparkles, Heart, Target, Trophy } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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
import { useEffect, useState, useRef } from "react";
import { getCurrentUser } from "@/integrations/pocketbase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  accessKey: string;
  path: string;
  roles?: string[];
  badge?: string;
  isNew?: boolean;
  isPopular?: boolean;
};

type AppSidebarProps = {
  currentNav: string;
  onNavChange: (nav: string) => void;
};

// Componente de badge emocional
const EmotionalBadge = ({ type, text }: { type: 'new' | 'popular' | 'streak' | 'achievement', text: string }) => {
  const getBadgeStyles = () => {
    switch (type) {
      case 'new':
        return "bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-pulse";
      case 'popular':
        return "bg-gradient-to-r from-orange-400 to-red-500 text-white animate-bounce";
      case 'streak':
        return "bg-gradient-to-r from-purple-400 to-pink-500 text-white";
      case 'achievement':
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <span className={cn(
      "absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold rounded-full z-10",
      getBadgeStyles()
    )}>
      {text}
    </span>
  );
};

// Componente de partículas flutuantes
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float opacity-20"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 1.5}s`,
            animationDuration: `${4 + Math.random() * 2}s`
          }}
        >
          <Sparkles className="w-3 h-3 text-coderbot-purple" />
        </div>
      ))}
    </div>
  );

export const AppSidebar = ({ currentNav, onNavChange }: AppSidebarProps) => {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { state, isMobile } = useSidebar();
  
  // Estados emocionais e de experiência
  const [visitCount, setVisitCount] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showWelcomeGlow, setShowWelcomeGlow] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [clickAnimations, setClickAnimations] = useState<Record<string, boolean>>({});
  const [userProgress, setUserProgress] = useState({
    totalSessions: 0,
    favoriteSections: ['chat'],
    unlockedFeatures: ['chat', 'playground']
  });

  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Get current user role
    const user = getCurrentUser();
    if (user) {
      setUserRole(user.role);
    }
    setIsLoading(false);
    
    // Carregar progresso do usuário
    const savedProgress = localStorage.getItem('userSidebarProgress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setUserProgress(progress);
        setVisitCount(progress.totalSessions || 0);
        setIsFirstVisit(progress.totalSessions === 0);
      } catch (error) {
        console.error('Error loading user progress:', error);
      }
    }
    
    // Efeito de boas-vindas para novos usuários
    if (isFirstVisit) {
      setShowWelcomeGlow(true);
      setTimeout(() => setShowWelcomeGlow(false), 3000);
    }
    
    // Incrementar contador de visitas
    const newProgress = {
      ...userProgress,
      totalSessions: visitCount + 1
    };
    setUserProgress(newProgress);
    localStorage.setItem('userSidebarProgress', JSON.stringify(newProgress));
  }, []);

  // Função para animar clique
  const handleItemClick = (itemId: string) => {
    setClickAnimations(prev => ({ ...prev, [itemId]: true }));
    setTimeout(() => {
      setClickAnimations(prev => ({ ...prev, [itemId]: false }));
    }, 300);
    
    onNavChange(itemId);
  };

  // Função para detectar seções favoritas
  const isFavorite = (itemId: string) => {
    return userProgress.favoriteSections.includes(itemId);
  };

  // Função para verificar se feature está desbloqueada
  const isUnlocked = (itemId: string) => {
    return userProgress.unlockedFeatures.includes(itemId);
  };

  // Map navigation items to their corresponding routes
  const mainNavItems: NavItem[] = [
    { 
      id: "chat", 
      label: "Chat", 
      icon: MessageSquare, 
      accessKey: "c", 
      path: "/dashboard/chat",
      isPopular: true
    },
    { 
      id: "playground", 
      label: "Playground", 
      icon: Code, 
      accessKey: "p", 
      path: "/dashboard/playground",
      badge: "✨"
    },
    { 
      id: "adaptive", 
      label: "Adaptive Learning", 
      icon: Brain, 
      accessKey: "a", 
      path: "/dashboard/adaptive",
      isNew: true
    },
    { 
      id: "analytics", 
      label: "Learning Analytics", 
      icon: TrendingUp, 
      accessKey: "l", 
      path: "/dashboard/analytics",
      badge: "📊"
    },
    { 
      id: "exercises", 
      label: "Exercícios", 
      icon: FileText, 
      accessKey: "e", 
      path: "/dashboard/exercises"
    },
    { 
      id: "metrics", 
      label: "Métricas", 
      icon: BarChart3, 
      accessKey: "m", 
      path: "/dashboard/metrics"
    },
    // Only show teacher dashboard for teachers and admins
    {
      id: "teacher",
      label: "Professor",
      icon: GraduationCap,
      accessKey: "t",
      path: "/dashboard/teacher",
      roles: ["teacher", "admin"],
      badge: "👨‍🏫"
    },
    // Show student dashboard for students (can also be visible to teachers/admins)
    {
      id: "student",
      label: "Aluno",
      icon: GraduationCap,
      accessKey: "s",
      path: "/dashboard/student",
      roles: ["student", "teacher", "admin"],
      badge: "🎓"
    },
    { 
      id: "whiteboard", 
      label: "Quadro", 
      icon: Presentation, 
      accessKey: "w", 
      path: "/dashboard/whiteboard",
      badge: "🎨"
    },
    { 
      id: "mermaid", 
      label: "Diagramas", 
      icon: GitBranch, 
      accessKey: "d", 
      path: "/dashboard/mermaid"
    },
    { 
      id: "flashcard", 
      label: "Flashcards", 
      icon: ClipboardEdit, 
      accessKey: "f", 
      path: "/dashboard/flashcard",
      badge: "🃏"
    },
  ];

  // Filter items based on user role
  const filteredNavItems = mainNavItems.filter(item => {
    // If the item doesn't specify roles, show it to everyone
    if (!item.roles) return true;
    // If we don't know the user role yet or there's an error, hide role-specific items
    if (!userRole) return false;
    // Show the item if the user's role is in the item's roles array
    return item.roles.includes(userRole);
  });

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
        {/* Header com logo animado */}
        <div className={cn(
          "flex flex-col items-center gap-2 p-2 border-b border-sidebar-border min-h-[72px] relative",
          showWelcomeGlow && "bg-gradient-to-br from-purple-50 to-pink-50"
        )}>
          <FloatingParticles />
          <img
            ref={logoRef}
            src="/coderbot_colorfull.png"
            alt="Logo Coderbot"
            className={cn(
              "w-12 aspect-square mb-1 rounded-full shadow-lg transition-all duration-500 opacity-90 hover:opacity-100 hover:scale-105 object-contain mx-auto cursor-pointer",
              showWelcomeGlow && "animate-pulse shadow-purple-300"
            )}
            style={{ animation: 'fadeInScale 0.7s' }}
            onClick={() => {
              // Animação especial ao clicar no logo
              if (logoRef.current) {
                logoRef.current.style.transform = 'rotate(360deg) scale(1.2)';
                setTimeout(() => {
                  if (logoRef.current) {
                    logoRef.current.style.transform = 'rotate(0deg) scale(1)';
                  }
                }, 600);
              }
            }}
          />
          <SidebarTrigger />
          
          {/* Mensagem de boas-vindas para novos usuários */}
          {isFirstVisit && state === "expanded" && (
            <div className="text-xs text-center text-purple-600 animate-fade-in bg-purple-50 rounded-lg px-2 py-1 mt-1">
              Bem-vindo! 🎉
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Menu Principal
            {visitCount > 10 && (
              <Trophy className="w-4 h-4 text-yellow-500" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.id} className="relative">
                  {/* Badges e indicadores especiais */}
                  {item.isNew && <EmotionalBadge type="new" text="NEW" />}
                  {item.isPopular && <EmotionalBadge type="popular" text="🔥" />}
                  {isFavorite(item.id) && (
                    <Heart className="absolute -top-1 -right-1 w-4 h-4 text-red-500 animate-pulse" />
                  )}
                  
                  <SidebarMenuButton
                    asChild
                    isActive={currentNav === item.id}
                    tooltip={item.label}
                    className={cn(
                      "transition-all duration-200 group hover:scale-105 hover:bg-coderbot-purple/20 focus:scale-105 relative overflow-hidden",
                      clickAnimations[item.id] && "animate-bounce",
                      hoveredItem === item.id && "bg-gradient-to-r from-purple-50 to-pink-50",
                      currentNav === item.id && "bg-gradient-to-r from-purple-100 to-pink-100 shadow-lg"
                    )}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link
                      to={item.path}
                      onClick={() => handleItemClick(item.id)}
                      className="flex items-center gap-2 w-full"
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-all duration-200 group-hover:text-coderbot-purple group-hover:scale-110",
                        currentNav === item.id && "text-coderbot-purple"
                      )} />
                      <span className="flex-1">{item.label}</span>
                      
                      {/* Badge emoji */}
                      {item.badge && (
                        <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                          {item.badge}
                        </span>
                      )}
                      
                      {/* Indicador de item ativo */}
                      {currentNav === item.id && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-coderbot-purple rounded-l-full"></div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/profile"}
                  tooltip="Meu Perfil"
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200 group hover:scale-105 hover:bg-coderbot-purple/20 focus:scale-105 relative",
                    hoveredItem === "profile" && "bg-gradient-to-r from-purple-50 to-pink-50"
                  )}
                  onMouseEnter={() => setHoveredItem("profile")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link to="/profile" className="flex items-center gap-2 w-full">
                    <User className="h-5 w-5 transition-all duration-200 group-hover:text-coderbot-purple group-hover:scale-110" />
                    <span className={state === "collapsed" ? "sr-only" : ""}>Meu Perfil</span>
                    
                    {/* Indicador de progresso pessoal */}
                    {visitCount > 5 && state === "expanded" && (
                      <div className="ml-auto flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600 font-bold">
                          {Math.min(visitCount, 99)}
                        </span>
                      </div>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            
            {state === "expanded" && (
              <div className="mt-4 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center justify-between">
                  <span>Learn Code Bot v1.0</span>
                  {visitCount > 0 && (
                    <span className="text-purple-500 font-medium">
                      Sessão #{visitCount}
                    </span>
                  )}
                </div>
                <p>©2025 Educational Platform</p>
                
                {/* Mensagem motivacional baseada no uso */}
                {visitCount > 0 && (
                  <div className="mt-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <p className="text-purple-600 font-medium text-center">
                      {visitCount < 3 && "🌟 Continue explorando!"}
                      {visitCount >= 3 && visitCount < 10 && "🚀 Você está indo bem!"}
                      {visitCount >= 10 && visitCount < 25 && "🔥 Usuário dedicado!"}
                      {visitCount >= 25 && "🏆 Master Coder!"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};
