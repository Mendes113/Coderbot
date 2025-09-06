import { User, MessageSquare, Code, GraduationCap, Presentation, Mail, BookOpen } from "lucide-react";
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
import { getCurrentUser } from "@/integrations/pocketbase/client";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  accessKey: string;
  path: string;
  roles?: string[];
};

type AppSidebarProps = {
  currentNav: string;
  onNavChange: (nav: string) => void;
};

export const AppSidebar = ({ currentNav, onNavChange }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { state } = useSidebar();

  // Memoizar busca do usuário para evitar recálculos
  useEffect(() => {
    const user = getCurrentUser();
    if (user) setUserRole(user.role);
    setIsLoading(false);
  }, []); // Dependência vazia é intencional - só executar uma vez na montagem

  const mainNavItems: NavItem[] = [
    { id: "chat", label: "Chat", icon: MessageSquare, accessKey: "c", path: "/dashboard/chat" },
    // Removed invitations route from sidebar
    {
      id: "teacher",
      label: "Turmas",
      icon: GraduationCap,
      accessKey: "t",
      path: "/dashboard/teacher",
      roles: ["teacher", "admin"],
    },
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
    // New: Profile button (accessible to all roles)
    { id: "profile", label: "Perfil", icon: User, accessKey: "p", path: "/profile" },
  ];

  const filteredNavItems = useMemo(() => {
    return mainNavItems.filter((item) => {
      if (!item.roles) return true;
      const normalizedUserRole = (userRole || "").toLowerCase().trim();
      // Fallback: mostrar itens com controle de role mesmo se a role ainda não estiver carregada
      if (!normalizedUserRole) return true;
      const allowed = item.roles.map(r => r.toLowerCase().trim());
      return allowed.includes(normalizedUserRole);
    });
  }, [userRole]); // Só recalcular quando userRole mudar

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
            "relative flex items-center gap-3 border-b border-sidebar-border/50 " +
            (state === "collapsed"
              ? "p-2 bg-transparent"
              : "p-4 bg-gradient-to-br from-coderbot-purple/20 via-transparent to-transparent backdrop-blur-sm")
          }
        >
          <img
            src="/coderbot_colorfull.png"
            alt="Logo Coderbot"
            className={(state === "collapsed" ? "w-9 h-9" : "w-10 h-10") + " rounded-xl shadow-sm ring-1 ring-black/5 object-contain"}
          />
          {state !== "collapsed" && (
            <div>
              <div className="font-semibold">CoderBot</div>
              <div className="text-xs text-muted-foreground">Ambiente Educacional</div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild isActive={isItemActive(item)}>
                    <Link to={item.path} onClick={() => onNavChange(item.id)}>
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
      <SidebarFooter>
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
};
