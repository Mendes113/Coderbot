import { useState, useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const Index = () => {
  const location = useLocation();
  const [currentNav, setCurrentNav] = useState<string>("chat");
  const isMobile = useIsMobile();

  // Memoizar o cálculo da navegação atual para evitar recálculos desnecessários
  const computedNav = useMemo(() => {
    const path = location.pathname;

    if (path.includes("chat")) return "chat";
    if (path.includes("adaptive")) return "adaptive";
    if (path.includes("analytics")) return "analytics";
    if (path.includes("exercises")) return "exercises";
    if (path.includes("metrics")) return "metrics";
    if (path.includes("teacher")) return "teacher";
    if (path.includes("student")) return "student";
    if (path.includes("whiteboard")) return "whiteboard";
    if (path.includes("mermaid")) return "mermaid";
    if (path.includes("flashcard")) return "flashcard";

    return "chat"; // fallback
  }, [location.pathname]);

  // Atualizar currentNav apenas quando necessário - comparar com valor atual para evitar loops
  useEffect(() => {
    if (currentNav !== computedNav) {
      setCurrentNav(computedNav);
    }
  }, [computedNav, currentNav]);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        <AppSidebar currentNav={currentNav} onNavChange={setCurrentNav} />
        <main className={cn(
          "flex-1 overflow-auto relative",
          isMobile ? "w-full" : ""
        )}>
          {/* Conteúdo atual da rota */}
          <div className="w-full min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
