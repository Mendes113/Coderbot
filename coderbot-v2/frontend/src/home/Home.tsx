// Home.tsx – Modern, impactful landing focused on conversion
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowRight,
  PlayCircle,
  Copy,
  Check,
  Brain,
  Bot,
  Code2,
  SquareTerminal,
  LineChart,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Star,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Hero variant toggle: "split" (texto + código lado a lado) ou "centered" (tudo centralizado)
const HERO_VARIANT = "centered";

function Background() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      {/* Gradient backdrop (more purple, like the reference) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-white dark:from-[#0e0a1f] dark:via-[#161132] dark:to-[#1f0e3a]" />
      {/* Radial spotlights */}
      <div className="absolute left-[60%] top-[-10%] h-[60rem] w-[60rem] -translate-x-1/2 rounded-full bg-fuchsia-200/40 blur-3xl dark:bg-fuchsia-500/20" />
      <div className="absolute left-[-10%] top-[-20%] h-[40rem] w-[40rem] rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-600/20" />
      {/* Subtle grid overlay (reactbits-style) */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]
                    [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]
                    bg-[linear-gradient(0deg,transparent_24%,rgba(0,0,0,.35)_25%,rgba(0,0,0,.35)_26%,transparent_27%,transparent_74%,rgba(0,0,0,.35)_75%,rgba(0,0,0,.35)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,rgba(0,0,0,.35)_25%,rgba(0,0,0,.35)_26%,transparent_27%,transparent_74%,rgba(0,0,0,.35)_75%,rgba(0,0,0,.35)_76%,transparent_77%)]
                    bg-[length:38px_38px] dark:opacity-[0.12]" />
    </div>
  );
}

function CodePreview() {
  const [copied, setCopied] = React.useState(false);
  const code = `// Aprender programando, do zero ao avançado
async function aprender() {
  const objetivos = ["lógica", "algoritmos", "projetos reais"];
  const praticaDiaria = true;

  for (const objetivo of objetivos) {
    await estudar(objetivo);
    if (praticaDiaria) progresso += 1;
  }

  return "pronto(a) para o próximo nível";
}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    } catch (err) {
      // ignore
    }
  }

  return (
    <div
      className="relative mx-auto w-full max-w-xl rounded-2xl border border-slate-300/60 bg-white/95 p-5 shadow-2xl ring-1 ring-black/5 md:p-6 dark:border-white/10 dark:bg-white/5 dark:ring-white/10 dark:backdrop-blur-md"
      aria-label="Pré-visualização de código demonstrativo"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-xs font-medium text-slate-500 dark:text-white/60">aprender.ts</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 dark:border-white/10 dark:bg-white/10 dark:text-white/80"
          aria-label={copied ? "Código copiado" : "Copiar código"}
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {copied ? "Código copiado para a área de transferência" : ""}
        </span>
      </div>
      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words font-mono [font-variant-numeric:tabular-nums] text-[0.95rem] md:text-base leading-7 text-slate-800 dark:text-slate-100">
{code}
      </pre>
    </div>
  );
}

function CodeCarousel() {
  const slides = [
    {
      title: "aprender.ts",
      code: `// Aprender programando, do zero ao avançado
async function aprender() {
  const objetivos = ["lógica", "algoritmos", "projetos reais"];
  const praticaDiaria = true;

  for (const objetivo of objetivos) {
    await estudar(objetivo);
  }

  return "pronto(a) para o próximo nível";
}`,
      accent: "indigo",
      glow: "from-indigo-300/40 via-fuchsia-300/20 to-rose-300/30",
    },
    {
      title: "aprenderIA.js",
      code: `// Sistema de aprendizado personalizado
const aprenderIA = {
  nivel: 'iniciante',
  trilhas: ['JavaScript', 'Python', 'React'],
  exercicios: 'adaptativos',
  
  async evoluir() {
    while (this.nivel !== 'avançado') {
      await this.praticar();
      this.nivel = await this.avaliarProgresso();
    }
    return 'Parabéns! Você é agora um dev!';
  }
};`,
      accent: "indigo",
      glow: "from-indigo-300/40 via-fuchsia-300/20 to-rose-300/30",
    },
  ] as const;

  const accentStyles: Record<string, { dot: string; ring: string; border: string; text: string }>
    = {
      indigo: { dot: "bg-indigo-400", ring: "focus-visible:ring-indigo-500/70", border: "border-indigo-300/60", text: "text-indigo-300" },
      emerald: { dot: "bg-emerald-400", ring: "focus-visible:ring-emerald-500/70", border: "border-emerald-300/60", text: "text-emerald-300" },
      amber: { dot: "bg-amber-400", ring: "focus-visible:ring-amber-500/70", border: "border-amber-300/60", text: "text-amber-300" },
    };

  const [active, setActive] = React.useState(0);
  const [typedCode, setTypedCode] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const typingIntervalRef = React.useRef<number | null>(null);
  const nextSlideTimeoutRef = React.useRef<number | null>(null);

  // Typing animation per slide with auto-advance
  React.useEffect(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (nextSlideTimeoutRef.current) {
      clearTimeout(nextSlideTimeoutRef.current);
      nextSlideTimeoutRef.current = null;
    }

    setTypedCode("");
    setIsTyping(true);

    let index = 0;
    const code = slides[active].code;
    const speedMs = 20;
    typingIntervalRef.current = window.setInterval(() => {
      index += 1;
      setTypedCode(code.slice(0, index));
      if (index >= code.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTyping(false);
        nextSlideTimeoutRef.current = window.setTimeout(() => {
          setActive((i) => (i + 1) % slides.length);
        }, 1500);
      }
    }, speedMs);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (nextSlideTimeoutRef.current) {
        clearTimeout(nextSlideTimeoutRef.current);
        nextSlideTimeoutRef.current = null;
      }
    };
  }, [active]);

  const current = slides[active];
  const accent = accentStyles[current.accent];

  function onPrev() {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (nextSlideTimeoutRef.current) {
      clearTimeout(nextSlideTimeoutRef.current);
      nextSlideTimeoutRef.current = null;
    }
    setActive((i) => (i - 1 + slides.length) % slides.length);
  }
  function onNext() {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (nextSlideTimeoutRef.current) {
      clearTimeout(nextSlideTimeoutRef.current);
      nextSlideTimeoutRef.current = null;
    }
    setActive((i) => (i + 1) % slides.length);
  }

  return (
    <div className="relative w-full">
      <div className={`absolute -inset-6 -z-10 hidden rounded-[2.5rem] bg-gradient-to-br ${current.glow} blur-2xl md:block`} />
      <div
        className={`relative mx-auto w-full max-w-xl rounded-2xl border ${accent.border} bg-white/95 p-5 shadow-2xl ring-1 ring-black/5 md:p-6 dark:border-white/10 dark:bg-white/5 dark:ring-white/10 dark:backdrop-blur-md`}
        aria-label={`Pré-visualização de código: ${current.title}`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className={`ml-2 text-xs font-medium ${accent.text}`}>{current.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              aria-label="Anterior"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-slate-700 shadow-sm backdrop-blur hover:bg-white/80 dark:bg-white/10 dark:text-white/80 ${accent.ring}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Próximo"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-slate-700 shadow-sm backdrop-blur hover:bg-white/80 dark:bg-white/10 dark:text-white/80 ${accent.ring}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words font-mono [font-variant-numeric:tabular-nums] text-[0.95rem] md:text-base leading-7 text-slate-800 dark:text-slate-100">
{typedCode}{isTyping ? "▍" : ""}
        </pre>

        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-2.5 w-2.5 rounded-full transition-opacity ${i === active ? accent.dot + " opacity-100" : "bg-white/40 dark:bg-white/20 opacity-60"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroShowcase() {
  const highlights = [
    { label: "Sem anúncios" },
    { label: "Gratuito" },
    { label: "Para todos os níveis" },
  ];

  const stats = [
    { value: "100+", label: "alunos ativos" },
    { value: "450+", label: "exercícios práticos" },
    { value: "4.8/5", label: "satisfação média" },
  ];

  return (
    <section className="container mx-auto px-4 pt-[clamp(1rem,6vh,3rem)] pb-[clamp(1.25rem,8vh,5rem)]">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md md:p-10 dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30">
            ✓ Open source
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-400/30">
            Comunidade ativa
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-medium text-fuchsia-300 ring-1 ring-fuchsia-400/30">
            Atualizado sempre
          </span>
        </div>

        <h1 className="text-center text-[clamp(2rem,7vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-white">
          Construa <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent drop-shadow">projetos reais</span> com IA
        </h1>
        <p className="mx-auto mt-4 max-w-[72ch] text-center text-[clamp(1rem,2.2vw,1.125rem)] leading-relaxed text-white/80">
          Desafios práticos, correção automática e trilhas personalizadas. Evolua de forma consistente e divertida.
        </p>

        <div className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Button asChild size="lg" className="group w-full gap-2 sm:w-auto focus-visible:ring-4 focus-visible:ring-indigo-500/70">
            <a href="/auth" className="inline-flex items-center" aria-label="Criar conta e começar agora">
              Começar agora <ArrowRight className="h-4 w-4 -translate-y-px transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </Button>
          <Button asChild size="lg" variant="secondary" className="group gap-2">
            <a href="/dashboard" className="inline-flex items-center" aria-label="Ver demonstração do dashboard">
              <PlayCircle className="h-4 w-4" aria-hidden="true" /> Ver demo
            </a>
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-white/70">
          {highlights.map((h, i) => (
            <span key={i} className="rounded-md bg-white/10 px-2 py-1">
              {h.label}
            </span>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-lg font-bold tracking-tight text-white">{s.value}</div>
              <div className="text-xs text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroSplit() {
  return (
    <section
      className="container mx-auto grid flex-1 grid-cols-1 items-center gap-8 px-4 pt-[clamp(0.75rem,4vh,2rem)] pb-[clamp(1.25rem,8vh,5rem)] sm:gap-12 lg:grid-cols-2 lg:[grid-template-columns:1.05fr_1fr]"
    >
      <div className="group flex flex-col items-start">
        <h1 className="mt-5 max-w-[16ch] text-[clamp(2rem,7vw,3.75rem)] font-extrabold leading-[1.15] tracking-tight text-slate-900 [text-wrap:balance] sm:leading-[1.1] dark:text-white">
          Aprenda programação com IA —
          <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent drop-shadow-sm transition-colors duration-300 group-hover:from-indigo-500 group-hover:via-fuchsia-500 group-hover:to-rose-500"> rápido e divertido</span>.
        </h1>

        <p className="mt-5 max-w-[62ch] text-[clamp(1rem,2.3vw,1.125rem)] leading-relaxed text-slate-700 [text-wrap:pretty] dark:text-white/80">
          Trilhas personalizadas, exercícios práticos e insights de aprendizagem. Tudo o que você precisa para evoluir com consistência.
        </p>

        <div className="mt-7 flex w-full flex-col items-start gap-3 sm:flex-row sm:gap-4">
          <Button
            asChild
            size="lg"
            className="group gap-2 w-full sm:w-auto focus-visible:ring-4 focus-visible:ring-indigo-500/70 motion-reduce:transition-none"
          >
            <a href="/auth" aria-label="Começar de graça, criar conta e iniciar" className="inline-flex items-center">
              Começar de graça <ArrowRight className="h-4 w-4 -translate-y-px transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="group gap-2 focus-visible:ring-4 focus-visible:ring-indigo-500/70 motion-reduce:transition-none"
          >
            <a href="/dashboard" aria-label="Ver demonstração do dashboard" className="inline-flex items-center">
              <PlayCircle className="h-4 w-4" aria-hidden="true" /> Ver demo
            </a>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-white/60">
          <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Sem anúncios</span>
          <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Gratuito</span>
          <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Para todos os níveis</span>
        </div>
      </div>

      <div className="relative w-full max-w-[680px] justify-self-center sm:justify-self-start">
        <div className="absolute -inset-6 -z-10 hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-300/40 via-fuchsia-300/20 to-rose-300/30 blur-2xl dark:from-indigo-500/10 dark:via-fuchsia-500/10 dark:to-rose-500/10 md:block" />
        <CodePreview />
      </div>
    </section>
  );
}

function HeroCentered() {
  return (
    <section className="container mx-auto flex flex-1 flex-col items-center px-4 pt-[clamp(1rem,6vh,3rem)] pb-[clamp(1.25rem,8vh,5rem)] text-center">
      <h1 className="max-w-[18ch] text-[clamp(2.2rem,8vw,4rem)] font-extrabold leading-[1.1] tracking-tight text-white">
        Aprenda <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent drop-shadow">programação com IA</span>
      </h1>
      <p className="mt-4 max-w-[70ch] text-[clamp(1rem,2.2vw,1.15rem)] leading-relaxed text-white/80">
        Estude no seu ritmo com trilhas guiadas, prática constante e feedback inteligente.
        Do básico ao avançado, com projetos reais e correção automática.
      </p>
      <div className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <Button
          asChild
          size="lg"
          className="group w-full sm:w-auto gap-2 focus-visible:ring-4 focus-visible:ring-indigo-500/70"
        >
          <a href="/auth" aria-label="Começar de graça, criar conta e iniciar" className="inline-flex items-center">
            Começar de graça <ArrowRight className="h-4 w-4 -translate-y-px transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </Button>
        <Button asChild variant="secondary" size="lg" className="group gap-2">
          <a href="/dashboard" aria-label="Ver demonstração do dashboard" className="inline-flex items-center">
            <PlayCircle className="h-4 w-4" aria-hidden="true" /> Ver demo
          </a>
        </Button>
      </div>

      <div className="relative mx-auto mt-8 w-full max-w-[720px]">
        <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-300/30 via-fuchsia-300/20 to-rose-300/25 blur-2xl dark:from-indigo-500/10 dark:via-fuchsia-500/10 dark:to-rose-500/10" />
        <CodePreview />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
        <span className="rounded-md bg-white/10 px-2 py-1">Sem anúncios</span>
        <span className="rounded-md bg-white/10 px-2 py-1">Gratuito</span>
        <span className="rounded-md bg-white/10 px-2 py-1">Para todos os níveis</span>
      </div>
    </section>
  );
}
 

function FeaturesSection() {
  const features = [
    {
      icon: <Brain className="h-5 w-5" />,
      title: "Tutor de IA sempre disponível",
      desc: "Explana conceitos, gera exemplos e adapta a explicação ao seu nível em tempo real.",
    },
    {
      icon: <SquareTerminal className="h-5 w-5" />,
      title: "Correção instantânea de código",
      desc: "Rode snippets, receba feedback linha a linha e sugestões de melhoria.",
    },
    {
      icon: <LineChart className="h-5 w-5" />,
      title: "Trilhas personalizadas",
      desc: "Planos de estudo guiados, metas semanais e analytics de progresso.",
    },
  ];

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={i}
            className="group rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-2 text-slate-700 dark:text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 group-hover:bg-indigo-600/20 dark:text-indigo-300">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/70">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <Sparkles className="h-4 w-4" />, label: "Escolha seus objetivos", desc: "Defina linguagem, nível e metas semanais."
    },
    {
      icon: <Bot className="h-4 w-4" />, label: "Aprenda com o tutor de IA", desc: "Converse, peça dicas, gere exemplos e esclareça dúvidas."
    },
    {
      icon: <Code2 className="h-4 w-4" />, label: "Pratique e receba feedback", desc: "Desafios curtos com correção automática e sugestões."
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />, label: "Acompanhe seu progresso", desc: "Relatórios de evolução e recomendações do que estudar a seguir."
    }
  ];

  return (
    <section className="container mx-auto px-4 py-10 sm:py-12">
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Como funciona</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{s.label}</p>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-white/70">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { label: "alunos ativos", value: "100+" },
    { label: "exercícios práticos", value: "450+" },
    { label: "snippets executados/mês", value: "1000+" },
    { label: "satisfação média", value: "4.8/5" },
  ];
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-center sm:grid-cols-4 dark:border-white/10 dark:bg-white/5">
        {stats.map((s, i) => (
          <div key={i} className="">
            <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-slate-600 dark:text-white/70">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TracksSection() {
  const tracks = [
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Python do zero",
      meta: ["4 semanas", "projetos guiados"],
      desc: "Aprenda fundamentos, estruturas de dados e automação com exercícios rápidos.",
    },
    {
      icon: <Code2 className="h-5 w-5" />,
      title: "JavaScript para Web",
      meta: ["6 semanas", "DOM & APIs"],
      desc: "Construa componentes, manipule o DOM e integre APIs reais.",
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Lógica de Programação",
      meta: ["3 semanas", "desafios com IA"],
      desc: "Pensamento computacional, algoritmos e resolução de problemas.",
    },
  ];

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Trilhas de aprendizado</h2>
        <a href="/dashboard" className="text-sm text-indigo-600 hover:underline dark:text-indigo-300">Ver todas</a>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {tracks.map((t, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2 text-slate-800 dark:text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-300">{t.icon}</div>
              <h3 className="text-base font-semibold">{t.title}</h3>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.meta.map((m, j) => (
                <span key={j} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-white/10 dark:text-white/70">{m}</span>
              ))}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/70">{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Ana S.",
      role: "Estudante de Engenharia",
      quote:
        "Passei a entender algoritmos de verdade. A correção da IA me poupou horas descobrindo onde eu errava.",
    },
    {
      name: "Marcos T.",
      role: "Professor de Lógica",
      quote:
        "Usei em laboratório com a turma. O feedback imediato ajudou quem tinha mais dificuldade a acompanhar.",
    },
  ];

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Quem usa, recomenda</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {testimonials.map((t, i) => (
          <figure key={i} className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 flex items-center gap-1 text-yellow-500">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />
              ))}
            </div>
            <blockquote className="text-sm leading-relaxed text-slate-700 dark:text-white/80">“{t.quote}”</blockquote>
            <figcaption className="mt-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-bold text-white">
                {t.name.split(" ")[0][0]}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{t.name}</p>
                <p className="text-xs text-slate-600 dark:text-white/70">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-x-clip">
      <Background />

      {/* Top bar (optional) */}
      <div className="container mx-auto flex items-center justify-between px-4 py-4 sm:py-5">
        <a href="/" className="flex items-center gap-2">
          <img src="/coderbot_colorfull.png" alt="CoderBot" className="h-7 w-7" />
          <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">CoderBot</span>
        </a>
        <div className="flex items-center gap-2">
          <nav className="hidden gap-2 sm:flex">
            <a href="/about" className="text-sm text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">Sobre</a>
            <a href="/auth" className="text-sm text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">Entrar</a>
            <a href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white">Dashboard</a>
          </nav>
          <ThemeToggle />
        </div>
      </div>

      {/* Hero */}
      <section
        className="container mx-auto grid flex-1 grid-cols-1 items-center gap-8 px-4 pt-[clamp(0.75rem,4vh,2rem)] pb-[clamp(1.25rem,8vh,5rem)] sm:gap-12 lg:grid-cols-2 lg:[grid-template-columns:1.05fr_1fr]"
      >
        <div className="group flex flex-col items-start">
          

          <h1 className="mt-5 max-w-[16ch] text-[clamp(2rem,7vw,3.75rem)] font-extrabold leading-[1.15] tracking-tight text-slate-900 [text-wrap:balance] sm:leading-[1.1] dark:text-white">
            Aprenda programação com IA —
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-sm transition-colors duration-300"> rápido</span>
            <span> e </span>
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-sm transition-colors duration-300">divertido.</span>
          </h1>

          <p className="mt-5 max-w-[62ch] text-[clamp(1rem,2.3vw,1.125rem)] leading-relaxed text-slate-700 [text-wrap:pretty] dark:text-white/80">
            Trilhas personalizadas, exercícios práticos e insights de aprendizagem. Tudo o que você precisa para evoluir com consistência.
          </p>

          <div className="mt-7 flex w-full flex-col items-start gap-3 sm:flex-row sm:gap-4">
            <Button
              asChild
              size="lg"
              className="group w-full gap-2 border-0 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg hover:from-violet-500/90 hover:to-fuchsia-600/90 focus-visible:ring-4 focus-visible:ring-violet-500/50 motion-reduce:transition-none sm:w-auto"
            >
              <a href="/auth" aria-label="Começar de graça, criar conta e iniciar" className="inline-flex items-center">
                Começar de graça <ArrowRight className="h-4 w-4 -translate-y-px transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="group gap-2 border border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-indigo-200/60 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:focus-visible:ring-white/30"
            >
              <a href="/dashboard" aria-label="Ver demonstração do dashboard" className="inline-flex items-center">
                <PlayCircle className="h-4 w-4" aria-hidden="true" /> Ver demo
              </a>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-white/60">
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Sem anúncios</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Gratuito</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Para todos os níveis</span>
          </div>
        </div>

        <div className="relative w-full max-w-[680px] justify-self-center sm:justify-self-start">
          <CodeCarousel />
        </div>
      </section>

      
      <FeaturesSection />
      <HowItWorks />
      {/* <TracksSection /> */}
      <StatsBar />
      <TestimonialsSection />

      {/* Slim CTA footer */}
      <section className="w-full border-t border-slate-200/60 bg-white/60 py-[clamp(0.75rem,3vh,2.25rem)] pb-[max(env(safe-area-inset-bottom),0.5rem)] dark:border-white/10 dark:bg-white/[0.03]">
        <div className="container mx-auto grid grid-cols-1 items-center gap-4 px-4 md:grid-cols-[1fr_auto]">
          <p className="justify-self-center text-center -translate-y-[2px] text-sm text-slate-600 md:justify-self-start md:text-left dark:text-white/70">
            Junte-se a estudantes e professores que já estão aprendendo com o CoderBot.
          </p>
          <div className="flex gap-2 justify-self-center md:justify-self-end">
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
