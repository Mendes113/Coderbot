import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const TeacherStudentFallback = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 px-6 py-12 text-center dark:bg-slate-950">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-education-primary">Área exclusiva para professores</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Você está logado como aluno</h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Entre em contato com seu professor para obter acesso ou continue acompanhando suas atividades no painel do aluno.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={() => navigate("/dashboard/student", { replace: true })}>
            Ir para painel do aluno
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/dashboard", { replace: true })}>
            Voltar para o CoderBot
          </Button>
        </div>
      </div>
    </div>
  );
};

export const TeacherUnknownFallback = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 px-6 py-12 text-center dark:bg-slate-950">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-education-primary">Redirecionando</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Área restrita</h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Essa seção está disponível apenas para professores e administradores. Vamos te levar de volta para o painel principal.
          </p>
        </div>
        <Button size="lg" onClick={() => navigate("/dashboard", { replace: true })}>
          Ir para o dashboard
        </Button>
      </div>
    </div>
  );
};
