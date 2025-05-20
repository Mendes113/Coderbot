// src/pages/UserProfile.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, ArrowLeft, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pb, startGithubOAuth } from "@/integrations/pocketbase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { profile, loading } = useUserData();
  const navigate = useNavigate();

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

  // Handler real para conectar ao GitHub via PocketBase
  const handleGithubConnect = () => {
    startGithubOAuth();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-14 w-[250px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/chat")}
            className="flex-shrink-0"
            title="Voltar ao dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Perfil</h1>
        </div>
        <div className="flex gap-2">
          {/* Botão de conectar GitHub via PocketBase OAuth */}
          <Button
            variant="outline"
            onClick={handleGithubConnect}
            className="flex items-center gap-2"
            size="sm"
          >
            <Github className="h-4 w-4" />
            Conectar GitHub
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <ProfileHeader
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
        />

        {/* Elementos gamificáveis e de engajamento */}
        {/* Barra de progresso do usuário */}
        <Card>
          <CardContent className="py-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Progresso</span>
              {/* Exemplo: Nível do usuário */}
              <span className="text-sm bg-blue-100 text-blue-700 rounded px-2 py-1">Nível 3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              {/* Exemplo de barra de XP */}
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: '60%' }} />
            </div>
            <div className="flex gap-2 mt-2">
              {/* Badges/conquistas - exemplo visual */}
              <span className="inline-block bg-yellow-200 text-yellow-800 rounded px-2 py-1 text-xs">Iniciante</span>
              <span className="inline-block bg-green-200 text-green-800 rounded px-2 py-1 text-xs">Desafio 1</span>
              {/* Adicione mais badges conforme necessário */}
            </div>
          </CardContent>
        </Card>

        {/* Seção de desafios/missões */}
        <Card>
          <CardContent className="py-4">
            <div className="font-semibold mb-2">Desafios em andamento</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Completar o primeiro módulo <span className="text-green-600">(80%)</span></li>
              <li>Participar de um fórum de discussão <span className="text-yellow-600">(em andamento)</span></li>
              <li>Concluir 3 quizzes seguidos <span className="text-gray-500">(não iniciado)</span></li>
              {/* Adicione mais desafios conforme necessário */}
            </ul>
          </CardContent>
        </Card>

        {/* Mensagem motivacional simples */}
        <div className="text-center text-blue-700 font-medium mt-2">
          Continue assim! Você está avançando no seu aprendizado 🚀
        </div>

        <ProfileForm 
          isEditing={isEditing} 
          onSaved={() => setIsEditing(false)} 
        />
      </div>
    </div>
  );
};

export default UserProfile;
