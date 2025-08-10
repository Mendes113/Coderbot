import { User, MessageSquare, Code, GraduationCap, Presentation, Mail } from "lucide-react";
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
import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    const user = getCurrentUser();
    if (user) setUserRole(user.role);
    setIsLoading(false);
  }, []);

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
    // New: Profile button (accessible to all roles)
    { id: "profile", label: "Perfil", icon: User, accessKey: "p", path: "/profile" },
  ];

  const filteredNavItems = mainNavItems.filter((item) => {
    if (!item.roles) return true;
    const normalizedUserRole = (userRole || "").toLowerCase().trim();
    // Fallback: mostrar itens com controle de role mesmo se a role ainda não estiver carregada
    if (!normalizedUserRole) return true;
    const allowed = item.roles.map(r => r.toLowerCase().trim());
    return allowed.includes(normalizedUserRole);
  });

  // Mapa de atalhos Alt+<tecla>
  const accessKeyMap = useMemo(() => {
    const map = new Map<string, NavItem>();
    for (const item of filteredNavItems) {
      map.set(item.accessKey.toLowerCase(), item);
    }
    return map;
  }, [filteredNavItems]);

  // Listener global para atalhos (ignora campos de texto)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [accessKeyMap, navigate, onNavChange]);

  const isItemActive = (item: NavItem) => {
    return currentNav === item.id || location.pathname.startsWith(item.path);
  };

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
