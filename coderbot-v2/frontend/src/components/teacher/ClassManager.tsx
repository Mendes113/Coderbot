
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { School, Plus, Users, BookOpen, Calendar, Edit, Trash2, Eye, UserPlus } from "lucide-react";
import { createClass, listTeachingClasses, ClassSummary } from "@/integrations/pocketbase/client";

type Class = {
  id: string;
  name: string;
  description?: string;
  studentCount?: number;
  activitiesCount?: number;
  schedule?: string;
};

export const ClassManager = () => {
  const [classes, setClasses] = useState<Class[]>([]);

  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    schedule: ""
  });

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const loadClasses = async () => {
    try {
      const list = await listTeachingClasses();
      const mapped: Class[] = (list || []).map((item: ClassSummary) => ({
        id: (item as any).id,
        name: (item as any).title || (item as any).name || "Turma",
        description: (item as any).description || "",
        studentCount: 0,
        activitiesCount: 0,
      }));
      setClasses(mapped);
    } catch (err) {
      // silenciar por enquanto
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleAddClass = async () => {
    if (!newClass.name.trim()) return;
    try {
      await createClass(newClass.name.trim(), newClass.description?.trim());
      await loadClasses();
    } catch (err) {
      // opcional: toast de erro
    } finally {
      setNewClass({ name: "", description: "", schedule: "" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <School className="h-5 w-5 text-education-primary" />
          Gerenciamento de Turmas
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
              <DialogDescription>
                Adicione uma nova turma ao sistema. Você poderá adicionar alunos e atividades depois.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Turma</Label>
                <Input 
                  id="name" 
                  value={newClass.name} 
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})} 
                  placeholder="Ex: Desenvolvimento Web"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={newClass.description} 
                  onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                  placeholder="Breve descrição da turma e seus objetivos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Horário</Label>
                <Input 
                  id="schedule" 
                  value={newClass.schedule} 
                  onChange={(e) => setNewClass({...newClass, schedule: e.target.value})}
                  placeholder="Ex: Segunda e Quarta, 19h-21h"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddClass}>Criar Turma</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>{classItem.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="line-clamp-2">{classItem.description || "Sem descrição"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{classItem.studentCount ?? 0} alunos</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{classItem.activitiesCount ?? 0} atividades</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{classItem.schedule || "Sem horário"}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Convidar Alunos
              </Button>
              <Button size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Criar Evento
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="bg-muted/50 rounded-lg p-8 text-center border border-dashed">
          <School className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma Turma Cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Você ainda não tem nenhuma turma. Clique no botão abaixo para começar.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent>
              {/* Conteúdo do diálogo */}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default ClassManager;
