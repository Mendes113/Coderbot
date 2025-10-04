// src/pages/UserProfile.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Github } from "lucide-react";
import { pb, startGithubOAuth } from "@/integrations/pocketbase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentInvitations } from "@/components/student/StudentInvitations";
import { NotificationsList } from "@/components/profile/NotificationsList";
import { AchievementsGrid } from "@/components/profile/AchievementsGrid";

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const { profile, loading } = useUserData();
  const navigate = useNavigate();
  
  // 🔥 FIX: Usar hook reativo ao invés de pb.authStore.model?.id
  const { currentUser } = useAuthState();
  const userId = currentUser?.id;

  const handleLogout = () => {
    try {
      pb.authStore.clear();
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    } catch (err: any) {
      console.error("Logout error:", err);
      toast.error("Erro ao fazer logout");
    }
  };

  const handleGithubConnect = () => {
    startGithubOAuth();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-14 w-[250px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header com branding moderno (inspirado no AppSidebar) */}
      <div className="relative flex items-center justify-between gap-3 border-b border-sidebar-border/50 p-4 bg-gradient-to-br from-coderbot-purple/20 via-transparent to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img
            src="/coderbot_colorfull.png"
            alt="Logo Coderbot"
            className="w-10 h-10 rounded-xl shadow-sm ring-1 ring-black/5 object-contain"
          />
          <div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard/chat")}
                className="flex-shrink-0 h-8 w-8"
                title="Voltar ao dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Perfil  </h1>
            </div>
            <div className="text-xs text-muted-foreground">Gerencie seu perfil e convites</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGithubConnect}
            className="flex items-center gap-2 h-8"
            size="sm"
          >
            <Github className="h-4 w-4" />
            Conectar GitHub
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 h-8"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 space-y-6 max-w-6xl">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="">
        <TabsList className="">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          {/* <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="invites">Convites</TabsTrigger> */}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileHeader
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
          />
          <ProfileForm
            isEditing={isEditing}
            onSaved={() => setIsEditing(false)}
          />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <AchievementsGrid />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationsList />
        </TabsContent>

        <TabsContent value="invites" className="space-y-6">
          <StudentInvitations />
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
