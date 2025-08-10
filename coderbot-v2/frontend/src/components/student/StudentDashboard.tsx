import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, School, RefreshCw, Info } from "lucide-react";
import { listMyClasses } from "@/integrations/pocketbase/client";

type StudentClass = { id: string; title?: string; name?: string; description?: string };

export const StudentDashboard = () => {
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [filterQuery, setFilterQuery] = useState<string>("");

  const loadMyClasses = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await listMyClasses();
      const mapped = (list || []).map((it: any) => ({
        id: it?.id,
        title: it?.title ?? it?.name ?? "Turma",
        name: it?.name,
        description: it?.description ?? "",
      })) as StudentClass[];
      setClasses(mapped);
    } catch (e) {
      setError("Não foi possível carregar suas turmas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyClasses();
  }, []);

  const filtered = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => (c.title || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q));
  }, [classes, filterQuery]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <School className="h-7 w-7 text-education-primary" />
          Minhas Turmas
        </h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filtrar por nome ou descrição..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-72"
          />
          <Button variant="outline" onClick={loadMyClasses} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando turmas...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma turma encontrada</CardTitle>
            <CardDescription>
              {classes.length === 0
                ? "Você ainda não está em nenhuma turma. Aguarde um convite do professor."
                : "Tente ajustar o filtro para encontrar a turma desejada."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-semibold truncate">{c.title || c.name || "Turma"}</CardTitle>
                {c.description && (
                  <CardDescription className="line-clamp-2">{c.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">ID: {c.id}</div>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  Entre em contato com seu professor para detalhes e atividades.
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 