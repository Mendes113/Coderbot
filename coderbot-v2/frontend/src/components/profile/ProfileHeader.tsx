import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Edit, Save, X, Sparkles } from "lucide-react";
import { useUserData } from "@/hooks/useUserData";

interface ProfileHeaderProps {
  isEditing: boolean;
  onEditToggle: () => void;
}

export function ProfileHeader({ isEditing, onEditToggle }: ProfileHeaderProps) {
  const { profile } = useUserData();
  
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-br from-coderbot-purple/20 via-transparent to-transparent backdrop-blur-sm rounded-2xl p-6 border border-sidebar-border/50 shadow-xl ring-1 ring-black/5">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-coderbot-purple/30 shadow-sm ring-1 ring-black/5">
          <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
          <AvatarFallback className="bg-coderbot-purple/10 text-coderbot-purple">
            {profile?.name?.charAt(0) || <User />}
          </AvatarFallback>
        </Avatar>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{profile?.name || "Usuário"}</h1>
            {profile?.role === "teacher" && (
              <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 text-xs rounded-full px-3 py-1 flex items-center border border-amber-500/20 shadow-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Professor
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{profile?.email}</p>
        </div>
      </div>
      
      <Button
        onClick={onEditToggle}
        variant={isEditing ? "outline" : "default"}
        className="md:w-auto transition-all duration-200 shadow-sm ring-1 ring-black/5 hover:shadow-md"
        size="sm"
      >
        {isEditing ? (
          <>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </>
        ) : (
          <>
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
          </>
        )}
      </Button>
    </div>
  );
}
