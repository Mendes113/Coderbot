import * as React from "react";
import { Calendar, Bot, Brain, Sparkles, BookOpen, CheckCircle2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plasma } from "@/Backgrounds/Plasma/Plasma";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import ScrambledText from "@/TextAnimations/ScrambledText/ScrambledText";

function Background() {
  const [renderPlasma, setRenderPlasma] = React.useState(true);
  React.useEffect(() => {
    try {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const reducedData = (window.matchMedia && window.matchMedia("(prefers-reduced-data: reduce)").matches) || (navigator as any)?.connection?.saveData === true;
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      setRenderPlasma(!(reducedMotion || reducedData || isMobile));
    } catch {
      // keep default
    }
  }, []);

  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0e0a1f]" />
      {renderPlasma && (
        <div className="absolute inset-0 hidden md:block plasma">
          <Plasma color="#b372ff" speed={0.5} direction="forward" scale={0.9} opacity={0.5} mouseInteractive={false} fps={24} dpr={1} pauseWhenHidden />
        </div>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className="container mx-auto flex flex-col items-center px-4 pt-[clamp(1rem,6vh,3rem)] pb-[clamp(1.25rem,8vh,5rem)] text-center">
      <h1 className="max-w-[22ch] text-[clamp(2.2rem,6.8vw,3.4rem)] font-extrabold leading-[1.1] tracking-tight text-white">
        Entenda a nossa <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent drop-shadow">pesquisa em Educação + IA</span>
      </h1>
      <p className="mt-4 max-w-[80ch] text-[clamp(1rem,2.2vw,1.15rem)] leading-relaxed text-white/80">
        O CoderBot nasce de estudos contínuos sobre exemplos trabalhados (worked examples), scaffolding, método socrático e
        adaptação pedagógica. Aqui está uma linha do tempo com marcos que guiaram a evolução do projeto.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild size="lg" className="gap-2">
          <a href="/auth" aria-label="Criar conta e começar a usar">
            Começar agora
          </a>
        </Button>
        <Button asChild variant="secondary" size="lg" className="gap-2">
          <a href="/" aria-label="Voltar à página inicial">
            Página inicial
          </a>
        </Button>
      </div>
    </section>
  );
}

function ThematicArt() {
  const chips = [
    { label: "Worked Examples", icon: <BookOpen className="h-4 w-4" /> },
    { label: "Scaffolding & Fading", icon: <Brain className="h-4 w-4" /> },
    { label: "Método Socrático", icon: <Sparkles className="h-4 w-4" /> },
    { label: "Tutor de IA", icon: <Bot className="h-4 w-4" /> },
    { label: "Avaliação formativa", icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  return (
    <section className="container mx-auto px-4 pb-[clamp(1rem,6vh,2.5rem)]">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
        <div aria-hidden className="pointer-events-none absolute -inset-20 opacity-30 bg-[radial-gradient(60rem_30rem_at_20%_20%,rgba(139,92,246,0.25),transparent),radial-gradient(50rem_25rem_at_80%_60%,rgba(236,72,153,0.2),transparent)]" />
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3">
          {chips.map((c, i) => (
            <div
              key={i}
              className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white/90 shadow-sm transition-colors hover:bg-white/15"
            >
              <span className="text-violet-300">{c.icon}</span>
              <span className="text-sm font-medium">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type Item = {
  year: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  explainTitle: string;
  explainBody: string;
  citationBib?: string;
  links?: { label: string; href: string }[];
};

function Timeline() {
  const items: Item[] = [
    {
      year: "2023",
      title: "Worked Examples em foco (SBIE)",
      desc: "Passo Fundo - RS, 2023",
      icon: <BookOpen className="h-4 w-4" />,
      explainTitle: "Worked Examples",
      explainBody:
        "O uso de Worked Examples (WE) tem ganhado destaque no ensino de diferentes áreas de conhecimento. Contudo, no ensino de programação, existem poucos trabalhos explorando o assunto. A falta de uma ferramenta educacional projetada para orientar os docentes na aplicação eficaz dos WE pode ser um dos fatores que contribuem para essa limitação. Contudo, para implementar os WE em uma ferramenta é necessário primeiro desenvolver um template. Este trabalho apresenta um template projetado com o objetivo de auxiliar os docentes a padronizar o uso de WE no ensino de programação. O trabalho também descreve os resultados de um estudo exploratório, realizado com docentes que usaram o template, que forneceram insights valiosos sobre a viabilidade e a eficácia do uso do template.",
      citationBib: `@inproceedings{coderbot_sbie_2023,
  title={Worked Examples em foco (SBIE)},
  author={Equipe CoderBot},
  booktitle={SBIE},
  year={2023},
  address={Passo Fundo, RS},
}`,
      links: [
        { label: "PDF", href: "/docs/SBIE_2023___Worked_Examples___Andre.pdf" },
      ],
    },
    {
      year: "2024",
      title: "Avaliando a Autoeficácia e a Aceitação do CoderBot em Cursos Introdutórios de Programação: um estudo exploratório",
      desc: "Rio de Janeiro - RJ, 2024",
      icon: <Brain className="h-4 w-4" />,
      explainTitle: "Scaffolding & Fading",
      explainBody:
        "Os conteúdos de programação são considerados complexos de ser aprendidos do ponto de vista dos estudantes. Um agente pedagógico que tem se destacado no ensino de programação são os chatbots. Neste sentido, desenvolvemos o CoderBot, um agente pedagógico educacional fundamentado na Aprendizagem Baseada em Exemplos, projetado para auxiliar estudantes iniciantes na compreensão de conteúdos de programação. Para avaliar a autoeficácia e aceitação do CoderBot, conduziu-se um estudo com 103 estudantes de graduação de disciplinas introdutórias de programação. Os resultados evidenciam a facilidade de uso do CoderBot, bem como melhorias na compreensão dos conceitos e melhora na motivação e autoconfiança dos estudantes.",
      citationBib: `@article{coderbot_autoeficacia_2024,
  title={Avaliando a Autoeficácia e a Aceitação do CoderBot em Cursos Introdutórios de Programação},
  author={Equipe CoderBot},
  journal={Relato técnico},
  year={2024},
  address={Rio de Janeiro, RJ},
}`,
      links: [
        { label: "PDF", href: "/docs/SBIE_2024___Andre.pdf" },
      ],
    },
    
    {
      year: "2025.2",
      title: "Theory Inspires, but Examples Engage: A Mixed-Methods Analysis of Worked Examples from CoderBot in Programming Education",
      desc: "São Paulo - SP, 2025",
      icon: <Sparkles className="h-4 w-4" />,
      explainTitle: "Engajamento + avaliação",
      explainBody:
        `Programming has become increasingly important in our society. However, the learning process presents significant challenges, particularly for novice students of introductory courses. From the students’ perspective, programming concepts are often perceived as complex and challenging to understand. Chatbots have emerged as promising and effective pedagogical agents, offering continuous support and personalized feedback throughout the programming learning process. In this paper, we present CoderBot, a pedagogical agent grounded in Example-Based Learning designed to assist novice students in comprehending programming concepts using correct and erroneous practical examples. To evaluate the self-efficacy and acceptance of CoderBot in the classroom, we conducted an exploratory study involving 103 undergraduate students from several regions of our country, all of whom were enrolled in introductory programming courses. The quantitative findings highlight the ease of use associated with CoderBot, along with noticeable improvements in students’ understanding of programming concepts and increased levels of motivation and self-confidence. Moreover, the qualitative results indicate that CoderBot holds the potential to be an effective pedagogical agent for supporting programming instruction, particularly in terms of clarity, accessibility, and ongoing assistance. However, the findings also suggest the need for further expansion of the available examples and improvements in the clarity of responses to fully realize the tool’s educational potential. These results offer valuable insights into integrating chatbots within academic environments, underscoring the role such tools can play in enhancing the learning experience for programming students.`,
      citationBib: `@article{coderbot_examples_2025,
  title={Theory Inspires, but Examples Engage: A Mixed-Methods Analysis of Worked Examples from CoderBot in Programming Education},
  author={Equipe CoderBot},
  journal={Draft manuscript},
  year={2025},
  address={São Paulo, SP},
}`,
      links: [
        { label: "Resumo", href: "#" },
        { label: "Prévia PDF", href: "#" },
      ],
    },
  ];

  const sectionRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  React.useEffect(() => {
    try {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {}
  }, []);

  const handleCopyCitation = (it: Item, idx: number) => {
    const url = `${window.location.origin}${window.location.pathname}#timeline-${idx}`;
    const citation = it.citationBib || `${it.title}. ${it.desc}. ${it.year}. CoderBot Research. Disponível em: ${url}`;
    navigator.clipboard.writeText(citation).then(() => toast.success("Citação copiada"));
  };

  const handleShare = (it: Item, idx: number) => {
    const url = `${window.location.origin}${window.location.pathname}#timeline-${idx}`;
    const text = `Leia este estudo: ${it.title}`;
    if ((navigator as any).share) {
      (navigator as any).share({ title: it.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copiado"));
    }
  };

  React.useEffect(() => {
    if (!listRef.current) return;
    const elements = Array.from(listRef.current.querySelectorAll<HTMLLIElement>('li[data-index]'));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = activeIndex;
        let bestRatio = 0;
        entries.forEach((e) => {
          const idxAttr = (e.target as HTMLElement).getAttribute('data-index');
          const idx = idxAttr ? parseInt(idxAttr, 10) : 0;
          if (e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            bestIdx = idx;
          }
        });
        if (bestIdx !== activeIndex) setActiveIndex(bestIdx);
      },
      { threshold: [0.2, 0.33, 0.5, 0.66, 0.85, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [activeIndex]);

  return (
    <section className="container mx-auto px-4 pb-[clamp(1rem,8vh,5rem)]">
      <div ref={sectionRef} className="relative mx-auto max-w-6xl">
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-white/10 md:block" />

        {/* Sticky section-wide title (static) */}
        <div className="mb-2">
          <h2 className="text-center md:text-left font-extrabold text-white/90 tracking-tight drop-shadow text-[clamp(2.2rem,7vw,4.2rem)]">
            Linha do tempo da pesquisa
          </h2>
        </div>

        {/* Sticky TOC (years/titles) */}
        <div className="sticky top-[128px] z-10 mb-6">
          <div className="overflow-x-auto">
            <div className="inline-flex gap-2 rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
              {items.map((it, idx) => (
                <button
                  key={idx}
                  onClick={() => document.getElementById(`timeline-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${activeIndex === idx ? 'bg-violet-500/25 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  aria-label={`Ir para ${it.title}`}
                >
                  {it.year}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ul ref={listRef} className="space-y-10">
          {items.map((it, idx) => {
            const isActive = activeIndex === idx;
            const expanded = expandedIdx === idx;
            return (
              <li id={`timeline-${idx}`} key={idx} data-index={idx} className={`min-h-[60vh] md:min-h-[70vh] transition-colors duration-200 ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                <div className={`grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10 ${idx % 2 === 0 ? '' : 'md:[&>div:first-child]:order-2'}`}>
                  {/* Title side (large heading, static) */}
                  <div className={`${isActive ? 'opacity-100' : 'opacity-90'} transition-opacity duration-200`}>
                    <h3 className="my-0 text-[clamp(1.8rem,5vw,3.2rem)] font-extrabold leading-tight text-white [text-wrap:balance]">
                      {it.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-white/70">
                      <div className="rounded-full bg-white/10 p-2 ring-2 ring-fuchsia-300/40">{it.icon}</div>
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium tracking-wide">{it.year}</span>
                    </div>
                    <p className="mt-2 max-w-prose text-sm leading-relaxed text-white/80">{it.desc}</p>
                  </div>
                  {/* Card side */}
                  <div className={`relative ${expanded ? '' : 'max-h-[240px] md:max-h-[300px] overflow-hidden'} rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm ${isActive ? 'opacity-100' : 'opacity-90'} transition-opacity duration-200 group`}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/60">{it.explainTitle}</div>
                    {reducedMotion ? (
                      <p className="m-0 mx-auto max-w-[60ch] text-center text-[clamp(12px,1.05vw,14px)] leading-7 text-white/85">
                        {it.explainBody}
                      </p>
                    ) : (
                      <ScrambledText className="m-0 mx-auto max-w-[60ch] text-center text-[clamp(12px,1.05vw,14px)] leading-7 text-white/85">
                        {it.explainBody}
                      </ScrambledText>
                    )}
                    {!expanded && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                    )}
                    {/* Vignette overlay on hover */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_58%,rgba(0,0,0,0.35))]" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-3 right-3 z-20 text-white border-white/30"
                      onClick={() => { setExpandedIdx(idx); setDialogOpen(true); }}
                    >
                      Ver mais
                    </Button>
                  </div>
                  <Dialog open={dialogOpen && expanded} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setExpandedIdx(null); } }}>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-white">{it.explainTitle}</DialogTitle>
                      </DialogHeader>
                      {/* Resumo sempre visível */}
                      <div className="mt-2 max-h-[55vh] overflow-auto pr-1 text-white/90 leading-relaxed">
                        {it.explainBody}
                      </div>
                      <Tabs defaultValue="citar" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="citar">Citar</TabsTrigger>
                          <TabsTrigger value="compartilhar">Compartilhar</TabsTrigger>
                        </TabsList>
                        <TabsContent value="citar" className="mt-3">
                          <div className="rounded-lg border border-white/15 bg-black/30 p-3">
                            <pre className="whitespace-pre-wrap break-words text-xs text-white/90">
{it.citationBib || `@article{coderbot_placeholder,
  title={${it.title}},
  year={${it.year}},
}`}
                            </pre>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button size="sm" onClick={() => handleCopyCitation(it, idx)}>Copiar citação</Button>
                          </div>
                        </TabsContent>
                        <TabsContent value="compartilhar" className="mt-3">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm text-white/80">Compartilhar este estudo</div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => handleShare(it, idx)}>Compartilhar</Button>
                                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#timeline-${idx}`).then(() => toast.success('Link copiado'))}>Copiar link</Button>
                              </div>
                            </div>
                            {it.links && it.links.length > 0 && (
                              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70">Links</div>
                                <ul className="space-y-1 text-sm">
                                  {it.links.map((l, i2) => (
                                    <li key={i2}>
                                      <a href={l.href} target="_blank" rel="noreferrer" className="text-violet-300 hover:underline">{l.label}</a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Highlights() {
  const points = [
    { label: "Worked examples estruturados" },
    { label: "Reflexão guiada antes da solução" },
    { label: "Exemplos correto/incorreto" },
    { label: "Código final conciso" },
    { label: "Quiz com justificativas" },
    { label: "Flashcards em 1 clique" },
  ];
  return (
    <section className="container mx-auto px-4 pb-[clamp(1rem,8vh,4rem)]">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-5 text-white/90 backdrop-blur-md">
        <h2 className="mb-3 text-lg font-semibold">Princípios pedagógicos</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {points.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <span>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResearchTerms() {
  const terms = [
    { k: "Worked-example effect", d: "Aprendizagem melhora ao estudar exemplos resolvidos antes de resolver problemas, reduzindo carga cognitiva extrínseca.", src: "SBIE 2023; Kalyuga 2023; Wikipedia" },
    { k: "Cognitive Load Theory", d: "Projetar instrução reduzindo carga extrínseca e fomentando carga germinal para formação de esquemas.", src: "Sweller, sínteses diversas" },
    { k: "Self-Explanation", d: "Prompts que levam o aluno a explicar os passos elevam retenção e transferência.", src: "Hausmann & VanLehn (AIED)" },
    { k: "Scaffolding & Fading", d: "Apoio temporário com retirada gradual; ajustar à ZDP do aluno.", src: "Wood, Bruner & Ross; Vygotsky; guias de scaffolding" },
    { k: "Método Socrático", d: "Perguntas abertas para promover pensamento crítico e metacognição.", src: "Sínteses educacionais" },
    { k: "Metacognitive Prompts", d: "Efeito depende de diferenças individuais e do material; usar com parcimônia e personalização.", src: "AJET 2025; estudos 2023" },
  ];

  return (
    <section className="container mx-auto px-4 pb-[clamp(1rem,8vh,4rem)]">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-3 text-lg font-semibold text-white">Termos-chave</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {terms.map((t, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/90 backdrop-blur-md">
              <div className="text-sm font-semibold">{t.k}</div>
              <div className="mt-1 text-sm text-white/80">{t.d}</div>
              <div className="mt-2 text-xs text-white/60">Fontes: {t.src}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function References() {
  const refs = [
    { label: "SBIE 2023 — Worked Examples — André", href: "https://example.com/sbie-2023", note: "Base para exemplos trabalhados" },
    { label: "SBIE 2024 — André", href: "https://example.com/sbie-2024", note: "Scaffolding e método socrático" },
    { label: "IEEE Access — CoderBot (em avaliação)", href: "https://example.com/ieee-access-coderbot", note: "Arquitetura AGNO e personalização" },
    { label: "Dissertação de Mestrado — Renato", href: "https://example.com/mestrado-renato", note: "Fundamentos instrucionais" },
    { label: "Worked-example effect (Wikipedia)", href: "https://en.wikipedia.org/wiki/Worked-example_effect", note: "Síntese CLT" },
  ];
  return (
    <section className="container mx-auto px-4 pb-[clamp(1rem,8vh,4rem)]">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
        <h2 className="mb-3 text-lg font-semibold text-white">Referências</h2>
        <ul className="space-y-2">
          {refs.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/85">
              <LinkIcon className="mt-0.5 h-4 w-4 text-indigo-300" />
              <div>
                <a href={r.href} target="_blank" rel="noreferrer" className="hover:underline">
                  {r.label}
                </a>
                <div className="text-xs text-white/60">{r.note}</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-white/60">Fontes internas no Archon: SBIE_2023___Worked_Examples___Andre.pdf; SBIE_2024___Andre.pdf; CoderBot_IEEE_Access_Em_Avaliação.pdf; Dissertação_Mestrado_Renato.pdf.</p>
      </div>
    </section>
  );
}

// Poster-style minimal section
function PosterShowcase() {
  type Poster = {
    tag: string;
    title: string;
    body: string;
    icon: React.ReactNode;
    circleClass: string;
  };

  const posters: Poster[] = [
    {
      tag: "Worked Examples",
      title: "Exemplos resolvidos, antes da prática",
      body:
        "Reduz a carga extrínseca e acelera a formação de esquemas. Incentivamos autoexplicações curtas para retenção e transferência.",
      icon: <BookOpen className="h-6 w-6" />,
      circleClass: "from-amber-300 via-amber-200 to-transparent",
    },
    {
      tag: "Teoria da Carga Cognitiva",
      title: "Projetar para focar no que importa",
      body:
        "Minimizamos ruído (extrínseca), equilibramos complexidade (intrínseca) e estimulamos aprendizado significativo (germinal).",
      icon: <Brain className="h-6 w-6" />,
      circleClass: "from-indigo-300 via-indigo-200 to-transparent",
    },
    {
      tag: "Chatbots educacionais",
      title: "Tutor sempre disponível, com método",
      body:
        "Combina segmentos pedagógicos, perguntas socráticas e avaliação formativa (quiz) com feedback imediato e flashcards.",
      icon: <Bot className="h-6 w-6" />,
      circleClass: "from-fuchsia-300 via-fuchsia-200 to-transparent",
    },
  ];

  return (
    <section className="container mx-auto px-4 pb-[clamp(1rem,8vh,5rem)]">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
        {posters.map((p, i) => (
          <article
            key={i}
            className="relative overflow-hidden rounded-[1.75rem] bg-white p-6 text-slate-900 shadow-2xl ring-1 ring-black/5 md:p-7"
            aria-label={`Poster: ${p.tag}`}
          >
            <div className={`pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br ${p.circleClass} blur-2xl`} />
            <header className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{p.tag}</span>
              <span className="text-slate-700">{p.icon}</span>
            </header>
            <h3 className="mt-2 text-[clamp(1.25rem,2.4vw,1.5rem)] font-extrabold tracking-tight">{p.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AboutProject() {
  const [readProgress, setReadProgress] = React.useState(0);
  React.useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = Math.max(1, doc.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / total));
      setReadProgress(p);
    };
    const handler = () => requestAnimationFrame(onScroll);
    window.addEventListener("scroll", handler, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", handler as any);
  }, []);

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-x-clip">
      {/* Reading progress bar */}
      <div className="fixed left-0 right-0 top-0 z-[60] h-1 bg-black/20">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-600 transition-[width] duration-200"
          style={{ width: `${readProgress * 100}%` }}
        />
      </div>
      <Background />

      {/* Top bar (optional) */}
      <div className="container mx-auto flex items-center justify-between px-4 py-4 sm:py-5">
        <a href="/" className="flex items-center gap-2">
          <img src="/coderbot_colorfull.png" alt="CoderBot" className="h-7 w-7" />
          <span className="text-sm font-semibold tracking-tight text-white">CoderBot</span>
        </a>
        <div className="hidden gap-2 sm:flex">
          <a href="/about" className="text-sm text-white/80 hover:text-white">Sobre</a>
          <a href="/auth" className="text-sm text-white/80 hover:text-white">Entrar</a>
          <a href="/dashboard" className="text-sm text-white/80 hover:text-white">Dashboard</a>
        </div>
      </div>

      <Hero />
      <ThematicArt />
      <Timeline />
      {/* Removed extra card-heavy sections to keep only two blocks visible per viewport */}
      <References />

      <section className="w-full border-t border-white/10 bg-white/[0.03] py-[clamp(0.75rem,3vh,2.25rem)]">
        <div className="container mx-auto grid grid-cols-1 items-center gap-4 px-4 md:grid-cols-[1fr_auto]">
          <p className="justify-self-center text-center text-sm text-white/80 md:justify-self-start md:text-left">
            Quer participar do estudo? Fale com a equipe e receba atualizações.
          </p>
          <div className="flex justify-center gap-2 md:justify-end">
            <Button asChild size="sm" className="gap-1">
              <a href="/auth">Criar conta</a>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-white border-white/30">
              <a href="/analytics">Ver métricas</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
