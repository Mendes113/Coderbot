
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { School, Plus, Users, BookOpen, Calendar, Edit, Trash2, Eye, UserPlus, Loader2, RefreshCw } from "lucide-react";
import { createClass, listTeachingClasses, ClassSummary, listClassMembers, addClassMember, removeClassMember, createClassEvent, listClassEvents, deleteClassEvent, createInvite } from "@/integrations/pocketbase/client";
import { updateClass as updateClassApi, deleteClass as deleteClassApi } from "@/integrations/pocketbase/client";
import { getCurrentUser } from "@/integrations/pocketbase/client";
import { pb } from "@/integrations/pocketbase/client";
import { toast } from "@/components/ui/sonner";

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
  const [countsByClass, setCountsByClass] = useState<Record<string, { students: number; events: number }>>({});
  const [filterQuery, setFilterQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    schedule: ""
  });

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [members, setMembers] = useState<{ id: string; userId: string; name?: string; email?: string; role?: string }[]>([]);
  const [manageMembersOpen, setManageMembersOpen] = useState(false);
  const [addStudentId, setAddStudentId] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<{ id: string; name?: string; email?: string }[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", type: "exercise" as "exam"|"exercise"|"lecture"|"assignment", starts_at: "", ends_at: "" });
  const [eventOnline, setEventOnline] = useState(false);
  const [eventUrl, setEventUrl] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const currentUser = getCurrentUser();
  const role = (currentUser?.role || "").toLowerCase();
  const isTeacherLike = role === "teacher" || role === "admin";

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
      // Compute counts first to avoid UI mismatch
      try {
        const countsArr = await Promise.all(
          (mapped || []).map(async (c) => {
            try {
              const [members, events] = await Promise.all([
                listClassMembers(c.id).catch(() => []),
                listClassEvents(c.id).catch(() => []),
              ]);
              return { id: c.id, students: (members as any[]).length || 0, events: (events as any[]).length || 0 };
            } catch {
              return { id: c.id, students: 0, events: 0 };
            }
          })
        );
        const map: Record<string, { students: number; events: number }> = {};
        for (const it of countsArr) map[it.id] = { students: it.students, events: it.events };
        setCountsByClass(map);
      } catch {
        setCountsByClass({});
      }
      setClasses(mapped);
    } catch (err) {
      toast.error("Não foi possível carregar suas turmas.");
      setClasses([]);
      setCountsByClass({});
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
        setVisibleCount((c) => Math.min(c + 12, filteredClasses.length));
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef.current]);

  const filteredClasses = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q));
  }, [classes, filterQuery]);

  const openManageMembers = async (classItem: Class) => {
    try {
      setSelectedClass(classItem);
      const res = await listClassMembers(classItem.id);
      const mapped = (res || []).map((m: any) => ({
        id: m.id,
        userId: typeof m.user === "string" ? m.user : (m.user?.id || ""),
        name: m.expand?.user?.name,
        email: m.expand?.user?.email || '',
        role: m.role,
      }));
      setMembers(mapped);
      setManageMembersOpen(true);
    } catch (e) {
      toast.error("Falha ao carregar membros da turma.");
    }
  };

  // Busca de usuários (nome/email) com debounce leve
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!userQuery.trim()) { setUserResults([]); return; }
      setSearchingUsers(true);
      try {
        const q = userQuery.trim();
        const filter = `name ~ "${q}" || email ~ "${q}"`;
        const res: any = await pb.collection('users').getList(1, 5, { filter });
        const items = (res?.items || []).map((u: any) => ({ id: u.id, name: u.name, email: u.email }));
        setUserResults(items);
      } catch {}
      setSearchingUsers(false);
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery]);

  const handleAddStudent = async () => {
    if (!selectedClass || !addStudentId.trim()) return;
    try {
      await addClassMember(selectedClass.id, addStudentId.trim(), "student");
      toast.success("Aluno adicionado.");
      setAddStudentId("");
      await openManageMembers(selectedClass);
    } catch (e) {
      toast.error("Não foi possível adicionar o aluno. Verifique o ID do usuário.");
    }
  };

  const handleRemoveMember = async (member: { userId: string }) => {
    if (!selectedClass) return;
    try {
      await removeClassMember(selectedClass.id, member.userId);
      toast.success("Membro removido.");
      await openManageMembers(selectedClass);
    } catch (e) {
      toast.error("Não foi possível remover o membro.");
    }
  };

  const handleInviteByEmail = async () => {
    if (!selectedClass || !inviteEmail.trim()) return;
    try {
      await createInvite({ class_id: selectedClass.id, email: inviteEmail.trim(), ttl_hours: 72 });
      toast.success("Convite enviado por e-mail.");
      setInviteEmail("");
    } catch (e) {
      toast.error("Não foi possível criar o convite. Verifique o e-mail.");
    }
  };

  const openCreateEvent = (classItem: Class) => {
    setSelectedClass(classItem);
    setEventForm({ title: "", type: "exercise", starts_at: "", ends_at: "" });
    setEventOnline(false);
    setEventUrl("");
    setEventOpen(true);
    // Carregar eventos existentes
    (async () => {
      setLoadingEvents(true);
      try {
        const list = await listClassEvents(classItem.id);
        setEvents(list || []);
      } catch {
        setEvents([]);
      }
      setLoadingEvents(false);
    })();
  };

  // Helpers para datetime-local (mostra local, salva ISO)
  const toLocalInputValue = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const min = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    } catch {
      return "";
    }
  };
  const fromLocalInputValue = (local: string) => {
    if (!local) return "";
    try {
      // Trata como horário local e converte para ISO com Z
      const d = new Date(local);
      return d.toISOString();
    } catch {
      return local;
    }
  };

  const nowLocal = () => toLocalInputValue(new Date().toISOString());
  const plusHoursLocal = (baseLocal: string, hours: number) => {
    const d = new Date(baseLocal || nowLocal());
    d.setHours(d.getHours() + hours);
    return toLocalInputValue(d.toISOString());
  };

  const handleCreateEvent = async () => {
    if (!selectedClass || !eventForm.title.trim() || !eventForm.starts_at) {
      toast.warning("Preencha título e início.");
      return;
    }
    try {
      await createClassEvent(selectedClass.id, { type: eventForm.type, title: eventForm.title.trim(), description: (eventForm as any).description || "", starts_at: eventForm.starts_at, ends_at: eventForm.ends_at, visibility: "class", is_online: eventOnline, meeting_url: eventUrl });
      toast.success("Evento criado.");
      // Recarregar lista de eventos
      const list = await listClassEvents(selectedClass.id);
      setEvents(list || []);
      setEventForm({ title: "", type: "exercise", starts_at: "", ends_at: "" });
      setEventOnline(false);
      setEventUrl("");
    } catch (e) {
      toast.error("Não foi possível criar o evento.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!selectedClass) return;
    try {
      await deleteClassEvent(selectedClass.id, eventId);
      const list = await listClassEvents(selectedClass.id);
      setEvents(list || []);
      toast.success("Evento excluído.");
    } catch {
      toast.error("Falha ao excluir evento.");
    }
  };

  // Export helpers
  const exportCSV = (rows: string[][], filename: string) => {
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMembers = async () => {
    if (!selectedClass) return;
    try {
      const list = await listClassMembers(selectedClass.id);
      const rows: string[][] = [["user_id", "name", "email", "role"]];
      (list as any[]).forEach((m) => {
        const user = typeof m.user === 'string' ? { id: m.user } : (m.expand?.user || {});
        rows.push([user.id || '', user.name || '', user.email || '', m.role || 'student']);
      });
      exportCSV(rows, `membros_${selectedClass.name || selectedClass.id}.csv`);
      toast.success("CSV de membros exportado.");
    } catch {
      toast.error("Falha ao exportar membros.");
    }
  };

  const handleExportEvents = async () => {
    if (!selectedClass) return;
    try {
      const list = await listClassEvents(selectedClass.id);
      const rows: string[][] = [["id", "title", "type", "starts_at", "ends_at", "visibility"]];
      (list as any[]).forEach((ev) => rows.push([ev.id, ev.title, ev.type, ev.starts_at, ev.ends_at || '', ev.visibility || 'class']));
      exportCSV(rows, `eventos_${selectedClass.name || selectedClass.id}.csv`);
      toast.success("CSV de eventos exportado.");
    } catch {
      toast.error("Falha ao exportar eventos.");
    }
  };

  const openEditClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setEditForm({ title: classItem.name || "", description: classItem.description || "" });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedClass) return;
    try {
      await updateClassApi(selectedClass.id, { title: editForm.title, description: editForm.description });
      toast.success("Turma atualizada.");
      setEditOpen(false);
      await loadClasses();
    } catch (e) {
      toast.error("Falha ao atualizar turma.");
    }
  };

  const openDeleteClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    try {
      await deleteClassApi(selectedClass.id);
      toast.success("Turma excluída.");
      setConfirmDeleteOpen(false);
      await loadClasses();
    } catch (e) {
      toast.error("Falha ao excluir turma.");
    }
  };

  const handleAddClass = async () => {
    if (!newClass.name.trim()) {
      toast.warning("Informe um nome para a turma.");
      return;
    }
    if (!isTeacherLike) {
      toast.error("Você precisa ser Professor ou Admin para criar turmas.");
      return;
    }
    try {
      await createClass(newClass.name.trim(), newClass.description?.trim());
      await loadClasses();
      toast.success("Turma criada com sucesso!");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        toast.error("Permissão negada: apenas Professor/Admin podem criar turmas.")
      } else {
        toast.error("Erro ao criar a turma. Tente novamente.");
      }
    } finally {
      setNewClass({ name: "", description: "", schedule: "" });
    }
  };

  return (
    <div className="space-y-6">
      {!isTeacherLike && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4">
          <div className="font-medium">Acesso restrito</div>
          <div className="text-sm">Para criar e gerenciar turmas, sua conta precisa ter o papel de Professor ou Admin.</div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <School className="h-5 w-5 text-education-primary" />
          Gerenciamento de Turmas
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={loadClasses} title="Atualizar lista">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!isTeacherLike} title={!isTeacherLike ? "Disponível apenas para Professor/Admin" : undefined}>
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
                <Button onClick={handleAddClass} disabled={!isTeacherLike}>Criar Turma</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Filtrar por nome ou descrição"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div ref={scrollRef} className="grid grid-cols-1 gap-6 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
        {filteredClasses.slice(0, visibleCount).map((classItem) => (
          <Card key={classItem.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CardTitle>{classItem.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {countsByClass[classItem.id]?.students ?? "—"} alunos
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {countsByClass[classItem.id]?.events ?? "—"} eventos
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openManageMembers(classItem)} title="Ver membros da turma">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditClass(classItem)} title="Editar turma">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openDeleteClass(classItem)} title="Excluir turma">
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
              <Button size="sm" variant="secondary" className="gap-2" disabled={!isTeacherLike} title={!isTeacherLike ? "Apenas Professor/Admin" : undefined} onClick={() => openManageMembers(classItem)}>
                <UserPlus className="h-4 w-4" />
                Convidar Alunos
              </Button>
              <Button size="sm" className="gap-2" disabled={!isTeacherLike} title={!isTeacherLike ? "Apenas Professor/Admin" : undefined} onClick={() => openCreateEvent(classItem)}>
                <Calendar className="h-4 w-4" />
                Criar/Ver Eventos
              </Button>
            </CardFooter>
          </Card>
        ))}
        {visibleCount < filteredClasses.length && (
          <div className="text-center text-sm text-muted-foreground py-3">Role para carregar mais…</div>
        )}
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
              <Button className="gap-2" disabled={!isTeacherLike} title={!isTeacherLike ? "Apenas Professor/Admin" : undefined}>
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

      {/* Dialogo de Gerenciamento de Membros */}
      <Dialog open={manageMembersOpen} onOpenChange={setManageMembersOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Membros da Turma {selectedClass?.name}</DialogTitle>
            <DialogDescription>Inclua ou remova alunos. Você pode procurar por nome/email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input placeholder="ID do usuário" value={addStudentId} onChange={(e) => setAddStudentId(e.target.value)} />
                <Button onClick={handleAddStudent} disabled={!isTeacherLike}>Adicionar</Button>
              </div>
              <div className="relative">
                <Input placeholder="Buscar por nome ou email" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
                {searchingUsers && <Loader2 className="h-4 w-4 absolute right-2 top-2.5 animate-spin" />}
                {userResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow">
                    {userResults.map(u => (
                      <button key={u.id} className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => { setAddStudentId(u.id); setUserQuery(u.email || u.name || ""); setUserResults([]); }}>
                        <div className="text-sm font-medium">{u.name || u.email}</div>
                        <div className="text-xs text-muted-foreground">{u.email || ''}</div>
                      </button>
                    ))}
                  </div>
                )}
                {userResults.length === 0 && !!userQuery && userQuery.includes("@") && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Não encontrou o usuário? Você pode enviar um convite para <span className="font-medium">{userQuery}</span> abaixo.
                  </div>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <Input placeholder="Convidar por e-mail" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                <Button variant="outline" onClick={handleInviteByEmail} disabled={!isTeacherLike || !inviteEmail.includes("@")}>Enviar convite</Button>
              </div>
            </div>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">
                      <Button size="sm" variant="outline" onClick={handleExportMembers} disabled={!isTeacherLike}>Exportar CSV</Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.name || m.userId}</TableCell>
                      <TableCell>{m.email || "-"}</TableCell>
                      <TableCell>{m.role || "student"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleRemoveMember(m)} disabled={!isTeacherLike}>Remover</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {members.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum membro ainda.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setManageMembersOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Criação/Listagem de Evento */}
      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Eventos de {selectedClass?.name}</DialogTitle>
            <DialogDescription>Crie tarefas e gerencie eventos existentes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <Label>Título</Label>
                <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Ex: Exercício 1" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={(eventForm as any).description || ""} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value } as any)} placeholder="Enunciado/observações" />
              </div>
              <div>
                <Label>Tipo</Label>
                <select className="w-full border rounded-md h-9 px-2 bg-background" value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as any })}>
                  <option value="exercise">Exercício</option>
                  <option value="assignment">Tarefa</option>
                  <option value="exam">Prova</option>
                  <option value="lecture">Aula</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <input
                    type="datetime-local"
                    className="w-full h-9 rounded-md border bg-background px-2"
                    value={toLocalInputValue(eventForm.starts_at)}
                    min={nowLocal()}
                    onChange={(e) => setEventForm({ ...eventForm, starts_at: fromLocalInputValue(e.target.value) })}
                  />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Button size="sm" variant="outline" onClick={() => setEventForm((f) => ({ ...f, starts_at: fromLocalInputValue(nowLocal()) }))}>Agora</Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const base = toLocalInputValue(eventForm.starts_at) || nowLocal();
                      setEventForm((f) => ({ ...f, starts_at: fromLocalInputValue(plusHoursLocal(base, 1)) }));
                    }}>+1h</Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
                      setEventForm((f) => ({ ...f, starts_at: d.toISOString() }));
                    }}>Amanhã 09:00</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <input
                    type="datetime-local"
                    className="w-full h-9 rounded-md border bg-background px-2"
                    value={toLocalInputValue(eventForm.ends_at)}
                    min={toLocalInputValue(eventForm.starts_at) || nowLocal()}
                    onChange={(e) => setEventForm({ ...eventForm, ends_at: fromLocalInputValue(e.target.value) })}
                  />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Button size="sm" variant="outline" onClick={() => {
                      const base = toLocalInputValue(eventForm.starts_at) || nowLocal();
                      setEventForm((f) => ({ ...f, ends_at: fromLocalInputValue(plusHoursLocal(base, 1)) }));
                    }}>+1h após início</Button>
                    <Button size="sm" variant="outline" onClick={() => setEventForm((f) => ({ ...f, ends_at: "" }))}>Sem fim</Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div className="flex items-center gap-2">
                  <input id="ev-online" type="checkbox" className="h-4 w-4" checked={eventOnline} onChange={(e) => setEventOnline(e.target.checked)} />
                  <Label htmlFor="ev-online">Evento online</Label>
                </div>
                <div>
                  <Label>Link da reunião</Label>
                  <Input value={eventUrl} onChange={(e) => setEventUrl(e.target.value)} placeholder="https://meet..." disabled={!eventOnline} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreateEvent} disabled={!isTeacherLike}>Criar</Button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Eventos</Label>
                {loadingEvents && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <div className="border rounded-md max-h-[40vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Online</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead className="text-right">
                        <Button size="sm" variant="outline" onClick={handleExportEvents} disabled={!isTeacherLike}>Exportar CSV</Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(events || []).map((ev: any) => (
                      <TableRow key={ev.id}>
                        <TableCell>{ev.title}</TableCell>
                        <TableCell className="capitalize">{ev.type}</TableCell>
                        <TableCell>{ev.starts_at}</TableCell>
                        <TableCell>{ev.ends_at || "-"}</TableCell>
                        <TableCell>{ev.is_online ? "Sim" : "Não"}</TableCell>
                        <TableCell>{ev.meeting_url ? <a className="text-blue-600 underline" href={ev.meeting_url} target="_blank" rel="noreferrer">Abrir</a> : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleDeleteEvent(ev.id)} disabled={!isTeacherLike}>Excluir</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!events || events.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum evento ainda.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEventOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Edição de Turma */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Título</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={!isTeacherLike}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm-max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Excluir turma</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <div>Tem certeza que deseja excluir a turma "{selectedClass?.name}"?</div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteClass} disabled={!isTeacherLike}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassManager;
