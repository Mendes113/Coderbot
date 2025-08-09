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
    { id: "playground", label: "Playground", icon: Code, accessKey: "p", path: "/dashboard/playground" },
    { id: "invitations", label: "Convites", icon: Mail, accessKey: "i", path: "/dashboard/invitations", roles: ["student", "teacher", "admin"] },
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
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight leading-5">Learn Code Bot</div>
              <div className="text-[11px] text-muted-foreground">Plataforma Educacional • v1.0</div>
            </div>
          )}
          <div className="ml-auto">
            <SidebarTrigger aria-label="Alternar sidebar" className="rounded-md hover:bg-coderbot-purple/15 transition-colors" />
          </div>
          {state !== "collapsed" && (
            <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-sidebar-border/80 to-transparent" />
          )}
        </div>

        {/* Botão extra para expandir quando colapsado (logo abaixo do header) */}
        {state === "collapsed" && (
          <div className="p-2 border-b border-sidebar-border/50">
            <SidebarTrigger
              aria-label="Expandir sidebar"
              className="w-full justify-center rounded-md border border-sidebar-border/50 bg-sidebar hover:bg-coderbot-purple/12 transition-colors"
            />
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const ActiveIcon = item.icon;
                const active = isItemActive(item);
                return (
                  <SidebarMenuItem key={item.id}>
                    <div className="relative">
                      {/* Indicador lateral de item ativo (sempre visível) */}
                      <div
                        className={
                          "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full transition-all " +
                          (active ? "bg-coderbot-purple opacity-100" : "opacity-0")
                        }
                      />
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={(state === "collapsed" ? "pl-2 pr-2" : "pl-3 pr-2") + " py-2 rounded-lg transition-colors duration-200 group hover:bg-coderbot-purple/12 data-[active=true]:bg-coderbot-purple/20 focus-visible:ring-2 focus-visible:ring-coderbot-purple"}
                      >
                        <Link
                          to={item.path}
                          onClick={() => onNavChange(item.id)}
                          aria-current={active ? "page" : undefined}
                          aria-keyshortcuts={`Alt+${item.accessKey.toUpperCase()}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <ActiveIcon className={"h-5 w-5 transition-all duration-200 " + (active ? "text-coderbot-purple" : "text-muted-foreground group-hover:text-coderbot-purple group-hover:scale-110")} />
                          <span className={state === "collapsed" ? "sr-only" : "truncate"}>{item.label}</span>
                          {state !== "collapsed" && (
                            <span className="ml-auto text-[10px] font-medium text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded border border-border/50">
                              <kbd className="uppercase">Alt+{item.accessKey}</kbd>
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  </SidebarMenuItem>
                );
              })}
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
                  className="flex items-center gap-2 rounded-lg transition-colors duration-200 group hover:bg-coderbot-purple/12 data-[active=true]:bg-coderbot-purple/20"
                >
                  <Link to="/profile" className="flex items-center gap-2 w-full">
                    <User className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:text-coderbot-purple group-hover:scale-110" />
                    <span className={state === "collapsed" ? "sr-only" : ""}>Meu Perfil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Botão extra no rodapé para expandir quando colapsado */}
              {state === "collapsed" && (
                <SidebarMenuItem>
                  <SidebarTrigger
                    aria-label="Expandir sidebar"
                    className="w-full justify-center rounded-md hover:bg-coderbot-purple/12"
                  />
                </SidebarMenuItem>
              )}
            </SidebarMenu>
            {state === "expanded" && (
              <div className="mt-3 text-[11px] text-muted-foreground/80">
                <p>©2025 Educational Platform</p>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};
