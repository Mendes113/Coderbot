// Home.tsx – Modern, impactful landing focused on conversion
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  ArrowRight,
  PlayCircle,
  Copy,
  Check,
  Bot,
  Code2,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Presentation,
  Users,
  MessageCircle,
  PenTool,
  BookOpen,
} from "lucide-react";

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


function FeaturesSection() {
  const features = [
    {
      icon: <Bot className="h-5 w-5" />,
      title: "Chat com IA em português",
      desc: "Converse com o tutor para revisar conceitos, gerar exemplos e destravar exercícios quando precisar.",
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Painel do professor",
      desc: "Crie turmas, acompanhe sessões de chat e distribua materiais em um único ambiente de gestão.",
    },
    {
      icon: <Presentation className="h-5 w-5" />,
      title: "Espaços colaborativos",
      desc: "Use quadros visuais e anotações compartilhadas para planejar aulas e registrar aprendizados.",
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

function ScreensCarouselSection() {
  const slides = [
    {
      title: "Painel do professor",
      description: "Acompanhe turmas, sessões de chat e tarefas em um só lugar com dados em tempo real.",
      image: "https://raw.githubusercontent.com/Chatbot-educacional/Chatbot-educacional/main/gallery/home.png",
      badges: ["Resumo das turmas", "Alertas de atividades", "Metodologias personalizadas"],
    },
    {
      title: "Gestão de turmas",
      description: "Crie turmas, envie convites e organize conteúdos para cada metodologia de ensino.",
      image: "https://raw.githubusercontent.com/Chatbot-educacional/Chatbot-educacional/main/gallery/class-selection.png",
      badges: ["Convite por código", "Controle de permissões", "Organização por série"],
    },
    {
      title: "Chat educacional com IA",
      description: "Tutor em português que gera exemplos, corrige código e mantém o histórico da turma.",
      image: "https://raw.githubusercontent.com/Chatbot-educacional/Chatbot-educacional/main/gallery/chat.png",
      badges: ["Feedback imediato", "Sugestões de exercícios", "Histórico por estudante"],
    },
    {
      title: "Quadro colaborativo",
      description: "Planeje aulas e resolva problemas em um canvas compartilhado com suporte ao Excalidraw.",
      image: "https://raw.githubusercontent.com/Chatbot-educacional/Chatbot-educacional/main/gallery/board-selection.png",
      badges: ["Desenho em tempo real", "Templates prontos", "Anotações persistentes"],
    },
    {
      title: "Caderno de anotações",
      description: "Registre aprendizados e compartilhe materiais com editor rico e busca rápida.",
      image: "https://raw.githubusercontent.com/Chatbot-educacional/Chatbot-educacional/main/gallery/notes.png",
      badges: ["Editor rich text", "Links com o chat", "Organização por tópicos"],
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Veja os ambientes em ação
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/70 sm:text-base">
            Navegue pelo carrossel para conferir como professores e estudantes trabalham com o CoderBot dentro e fora da sala de aula.
          </p>
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-white/40">
          arraste para o lado
        </span>
      </div>

      <Carousel opts={{ align: "start", loop: true }} className="mt-6">
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.title} className="pl-4 basis-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_65%)]" />
                </div>
                <div className="flex flex-1 flex-col gap-3 px-5 py-4 text-left">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{slide.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-white/70">{slide.description}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {slide.badges.map((badge) => (
                      <Badge
                        key={badge}
                        variant="outline"
                        className="border-slate-200/60 bg-slate-100/80 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-10 hidden md:flex" />
        <CarouselNext className="-right-10 hidden md:flex" />
      </Carousel>
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

function ModulesSection() {
  const modules = [
    {
      title: "Painel do professor",
      description: "Resumo das turmas com acesso rápido ao chat, quadros e atividades que precisam de atenção.",
      icon: <GraduationCap className="h-8 w-8" />,
      features: [
        "Visão consolidada de turmas",
        "Alertas de exercícios pendentes",
        "Atalhos para chat e quadros",
        "Suporte a múltiplas metodologias",
      ],
    },
    {
      title: "Gestão de turmas",
      description: "Crie turmas, convide estudantes e organize materiais com poucos cliques.",
      icon: <Users className="h-8 w-8" />,
      features: [
        "Convite por link ou código",
        "Controle de papéis e permissões",
        "Acompanhamento de participação",
        "Planejamento por metodologia",
      ],
    },
    {
      title: "Chat educacional com IA",
      description: "Tutor em português que explica, revisa código e registra o histórico de cada estudante.",
      icon: <MessageCircle className="h-8 w-8" />,
      features: [
        "Geração de exemplos comentados",
        "Correção de exercícios",
        "Contexto persistente por turma",
        "Modo professor para intervenções",
      ],
    },
    {
      title: "Quadro colaborativo",
      description: "Canvas compartilhado com Excalidraw para planejar aulas e explicar algoritmos.",
      icon: <PenTool className="h-8 w-8" />,
      features: [
        "Desenho em tempo real",
        "Templates pedagógicos",
        "Exportação em imagem",
        "Histórico automático",
      ],
    },
    {
      title: "Caderno de anotações",
      description: "Notas ricas com busca rápida para compartilhar materiais e registrar insights da aula.",
      icon: <BookOpen className="h-8 w-8" />,
      features: [
        "Editor rich text",
        "Organização por tópicos",
        "Compartilhamento com turmas",
        "Integração com exercícios",
      ],
    }
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Nossos Módulos</h2>
        <p className="text-slate-600 dark:text-white/70 max-w-2xl mx-auto">
          Explore os recursos completos da plataforma CoderBot v2, projetados para uma experiência de aprendizado completa e envolvente.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modules.map((module, i) => (
          <div key={i} className="group rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 dark:border-white/10 dark:bg-white/5">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200/50 bg-gradient-to-br from-violet-50 to-indigo-50 dark:border-white/10 dark:from-violet-500/10 dark:to-indigo-500/10">
              <div className="text-violet-600 dark:text-violet-400">
                {module.icon}
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {module.title}
            </h3>
            
            <p className="text-slate-600 dark:text-white/70 mb-4 text-sm leading-relaxed">
              {module.description}
            </p>
            
            <div className="space-y-2">
              {module.features.map((feature, j) => (
                <div key={j} className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
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
        className="container mx-auto grid flex-1 grid-cols-1 items-center gap-8 px-4 pt-[clamp(0.75rem,4vh,2rem)] pb-[clamp(1.25rem,8vh,5rem)] sm:gap-12 lg:[grid-template-columns:1.05fr_1fr]"
      >
        <div className="group flex flex-col items-start">

          <h1 className="mt-5 max-w-[18ch] text-[clamp(2rem,7vw,3.75rem)] font-extrabold leading-[1.1] tracking-tight text-slate-900 [text-wrap:balance] dark:text-white">
            CoderBot v2
            <span className="block bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent drop-shadow-sm">
              ensino de programação guiado por IA
            </span>
          </h1>

          <p className="mt-5 max-w-[62ch] text-[clamp(1rem,2.2vw,1.2rem)] leading-relaxed text-slate-700 [text-wrap:pretty] dark:text-white/80">
            Combine chat com IA, quadro colaborativo, gestão de turmas e trilhas guiadas em uma única experiência.
            Professores acompanham turmas em tempo real enquanto estudantes praticam com feedback imediato.
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
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Chat educacional com IA</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Painel do professor</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">Quadro colaborativo</span>
          </div>
        </div>

        <div className="relative w-full max-w-[680px] justify-self-center sm:justify-self-start">
          <CodeCarousel />
        </div>
      </section>

      
  <ScreensCarouselSection />
  <FeaturesSection />
      <HowItWorks />
      <ModulesSection />

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
