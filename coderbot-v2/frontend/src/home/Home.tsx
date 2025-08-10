// Home.tsx – Modern, impactful landing focused on conversion
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";

function Background() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950" />
      {/* Radial spotlight */}
      <div className="absolute left-1/2 top-[-20%] h-[60rem] w-[60rem] -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/15" />
      {/* Subtle grid overlay (reactbits-style) */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]
                    [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]
                    bg-[linear-gradient(0deg,transparent_24%,rgba(0,0,0,.35)_25%,rgba(0,0,0,.35)_26%,transparent_27%,transparent_74%,rgba(0,0,0,.35)_75%,rgba(0,0,0,.35)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,rgba(0,0,0,.35)_25%,rgba(0,0,0,.35)_26%,transparent_27%,transparent_74%,rgba(0,0,0,.35)_75%,rgba(0,0,0,.35)_76%,transparent_77%)]
                    bg-[length:38px_38px] dark:opacity-[0.12]" />
    </div>
  );
}

function CodePreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-6 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
      <div className="mb-3 flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
      </div>
      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-6 text-slate-800 dark:text-slate-200">
{`// Aprender programando, do zero ao avançado
async function aprender() {
  const objetivos = ["lógica", "algoritmos", "projetos reais"];
  const praticaDiaria = true;

  for (const objetivo of objetivos) {
    await estudar(objetivo);
    if (praticaDiaria) progresso += 1;
  }

  return "pronto(a) para o próximo nível";
}`}
      </pre>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-[92vh] overflow-hidden">
      <Background />

      {/* Top bar (optional) */}
      <div className="container mx-auto flex items-center justify-between px-4 py-5">
        <a href="/" className="flex items-center gap-2">
          <img src="/coderbot_colorfull.png" alt="CoderBot" className="h-7 w-7" />
          <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">CoderBot</span>
        </a>
        <div className="hidden gap-2 sm:flex">
          <a href="/auth" className="text-sm text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">Entrar</a>
          <a href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">Dashboard</a>
        </div>
      </div>

      {/* Hero */}
      <section className="container mx-auto grid min-h-[72vh] grid-cols-1 items-center gap-10 px-4 pb-16 pt-6 lg:grid-cols-2">
        <div className="flex flex-col items-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium shadow-sm dark:border-white/10 dark:bg-white/5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">✓</span>
            Plataforma educacional open source
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
            Aprenda programação com IA —
            <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent"> rápido e divertido</span>.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg dark:text-white/70">
            Trilhas personalizadas, exercícios práticos e insights de aprendizagem. Tudo o que você precisa para evoluir com consistência.
          </p>

          <div className="mt-6 flex w-full flex-col items-start gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <a href="/auth">Começar de graça <ArrowRight className="h-4 w-4" /></a>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <a href="/dashboard"><PlayCircle className="h-4 w-4" /> Ver demo</a>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-white/60">
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Sem anúncios</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Gratuito</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Para todos os níveis</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-300/40 via-fuchsia-300/20 to-rose-300/30 blur-2xl dark:from-indigo-500/10 dark:via-fuchsia-500/10 dark:to-rose-500/10" />
          <CodePreview />
        </div>
      </section>

      {/* Slim CTA footer */}
      <section className="border-t border-slate-200/60 bg-white/60 py-10 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <p className="text-center text-sm text-slate-600 md:text-left dark:text-white/70">
            Junte-se a estudantes e professores que já estão aprendendo com o CoderBot.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" className="gap-1">
              <a href="/auth">Criar conta <ArrowRight className="h-3 w-3" /></a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href="/analytics">Ver métricas</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
