// src/pages/PublicClasses.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  School,
  Users,
  BookOpen,
  Calendar,
  Search,
  Eye,
  ArrowLeft,
  UserPlus,
  AlertCircle,
  Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listPublicClasses, getCurrentUser } from "@/integrations/pocketbase/client";
import { toast } from "sonner";

interface PublicClass {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  studentCount?: number;
  activitiesCount?: number;
  schedule?: string;
  createdBy?: string;
  created?: string;
}

const PublicClasses = () => {
  const [classes, setClasses] = useState<PublicClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<PublicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    const filtered = classes.filter((classItem) =>
      (classItem.name || classItem.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (classItem.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    setFilteredClasses(filtered);
  }, [classes, searchQuery]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await listPublicClasses();
      setClasses(data || []);
    } catch (error) {
      console.error("Erro ao carregar turmas públicas:", error);
      toast.error("Erro ao carregar turmas públicas");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClass = (classId: string) => {
    if (!user) {
      toast.info("Faça login para visualizar detalhes da turma");
      navigate("/auth");
      return;
    }
    navigate(`/classes/${classId}`);
  };

  const handleJoinClass = (classId: string) => {
    if (!user) {
      toast.info("Faça login para participar de uma turma");
      navigate("/auth");
      return;
    }
    // TODO: Implementar lógica de participação na turma
    toast.info("Funcionalidade de participação será implementada em breve");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto py-8 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Turmas Disponíveis</h1>
              <p className="text-muted-foreground">
                Explore as turmas públicas e encontre a que melhor se adapta aos seus objetivos de aprendizado
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar turmas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Authentication Banner */}
        {!user && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Acesso Limitado
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Você está visualizando as turmas públicas. Para participar de uma turma, visualizar detalhes completos e acessar materiais exclusivos,
                  <Button
                    variant="link"
                    className="h-auto p-0 ml-1 text-blue-600 dark:text-blue-400"
                    onClick={() => navigate("/auth")}
                  >
                    faça login
                  </Button>
                  ou
                  <Button
                    variant="link"
                    className="h-auto p-0 ml-1 text-blue-600 dark:text-blue-400"
                    onClick={() => navigate("/auth")}
                  >
                    cadastre-se
                  </Button>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Classes Grid */}
        {filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classItem) => (
              <Card key={classItem.id} className="group hover:shadow-lg transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">
                        {classItem.name || classItem.title || "Turma sem nome"}
                      </CardTitle>
                      {classItem.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {classItem.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      Pública
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{classItem.studentCount || 0} alunos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{classItem.activitiesCount || 0} atividades</span>
                    </div>
                  </div>

                  {classItem.schedule && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{classItem.schedule}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewClass(classItem.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!user}
                      onClick={() => handleJoinClass(classItem.id)}
                    >
                      {user ? (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Participar
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Login para participar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? "Nenhuma turma encontrada" : "Nenhuma turma disponível"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Tente ajustar os termos de busca ou filtros"
                : "Ainda não há turmas públicas disponíveis no momento"}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                Limpar busca
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicClasses;
