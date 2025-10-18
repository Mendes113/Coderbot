import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Sparkles, Copy, Maximize2, X, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useExamples, type CodeExample } from '@/context/ExamplesContext';
import posthog from 'posthog-js';

interface ExamplesPanelProps {
  className?: string;
  onExampleSelect?: (example: CodeExample) => void;
  theme?: 'light' | 'dark';
}

// Modal para exibir exemplo em tela cheia
const ExampleModal: React.FC<{
  example: CodeExample;
  isOpen: boolean;
  onClose: () => void;
}> = ({ example, isOpen, onClose }) => {
  const openTimeRef = React.useRef<number>(Date.now());

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(example.code);
    toast.success('Código copiado! 📋');
    
    // Analytics: código copiado no modal
    posthog?.capture?.('edu_example_code_copied', {
      exampleId: example.id,
      exampleTitle: example.title,
      exampleType: example.type,
      language: example.language,
      difficulty: example.difficulty,
      codeLength: example.code.length,
      context: 'modal_focus',
      timestamp: new Date().toISOString()
    });
  }, [example]);

  const handleClose = useCallback(() => {
    // Analytics: tempo de visualização no modal
    const viewDuration = Date.now() - openTimeRef.current;
    posthog?.capture?.('edu_example_modal_closed', {
      exampleId: example.id,
      exampleTitle: example.title,
      exampleType: example.type,
      language: example.language,
      viewDurationMs: viewDuration,
      viewDurationSeconds: Math.round(viewDuration / 1000),
      timestamp: new Date().toISOString()
    });
    
    onClose();
  }, [example, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      openTimeRef.current = Date.now();
      
      // Analytics: modal aberto (modo foco)
      posthog?.capture?.('edu_example_focus_mode_opened', {
        exampleId: example.id,
        exampleTitle: example.title,
        exampleType: example.type,
        language: example.language,
        difficulty: example.difficulty,
        codeLength: example.code.length,
        hasHints: (example.hints?.length ?? 0) > 0,
        timestamp: new Date().toISOString()
      });
    }
  }, [isOpen, example]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <button
        className="absolute inset-0 cursor-default"
        onClick={handleClose}
        aria-label="Fechar modal"
      />
      <div className="relative w-[90vw] max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header do modal */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            {example.type === 'correct' ? (
              <CheckCircle className="w-6 h-6 text-green-400" strokeWidth={2} />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" strokeWidth={2} />
            )}
            <div>
              <h3 className="text-lg font-bold text-white">
                {example.title}
              </h3>
              <p className="text-sm text-slate-400 capitalize">
                {example.language} • {example.type === 'correct' ? '✓ Correto' : '✗ Incorreto'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Código com scroll */}
        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="p-6 bg-slate-950">
            <pre className="text-sm text-slate-100 font-mono">
              <code>{example.code}</code>
            </pre>
          </div>
        </ScrollArea>

        {/* Explicação */}
        <div className="bg-slate-800 px-6 py-4 border-t border-slate-700">
          <p className="text-sm text-slate-300 leading-relaxed">
            {example.explanation}
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente de card de exemplo - grande botão clicável com ícone
const ExampleCard: React.FC<{
  example: CodeExample;
  onSelect?: (example: CodeExample) => void;
  isExpanded?: boolean;
  onOpenModal?: () => void;
  isSiblingExpanded?: boolean;
}> = ({ example, onSelect, isExpanded = false, onOpenModal, isSiblingExpanded = false }) => {
  const expandTimeRef = React.useRef<number>(0);
  const wasExpandedRef = React.useRef<boolean>(false);

  const handleSelect = useCallback(() => {
    if (onSelect) {
      onSelect(example);
    }
    
    // Analytics: exemplo clicado/expandido
    if (isExpanded) {
      // Colapsando: registrar tempo de visualização
      const viewDuration = Date.now() - expandTimeRef.current;
      posthog?.capture?.('edu_example_collapsed', {
        exampleId: example.id,
        exampleType: example.type,
        language: example.language,
        viewDurationMs: viewDuration,
        viewDurationSeconds: Math.round(viewDuration / 1000),
        timestamp: new Date().toISOString()
      });
    } else {
      expandTimeRef.current = Date.now();
      posthog?.capture?.('edu_example_expanded', {
        exampleId: example.id,
        exampleTitle: example.title,
        exampleType: example.type,
        language: example.language,
        difficulty: example.difficulty,
        codeLength: example.code.length,
        hasHints: (example.hints?.length ?? 0) > 0,
        timestamp: new Date().toISOString()
      });
    }
  }, [example, onSelect, isExpanded]);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(example.code);
    
    // Analytics: código copiado
    posthog?.capture?.('edu_example_code_copied', {
      exampleId: example.id,
      exampleTitle: example.title,
      exampleType: example.type,
      language: example.language,
      difficulty: example.difficulty,
      codeLength: example.code.length,
      context: 'inline_card',
      timestamp: new Date().toISOString()
    });
  }, [example]);

  const handleOpenModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenModal) {
      onOpenModal();
    }
  }, [onOpenModal]);

  // Rastrear tempo de visualização quando expandido
  React.useEffect(() => {
    if (isExpanded && !wasExpandedRef.current) {
      expandTimeRef.current = Date.now();
      wasExpandedRef.current = true;
    } else if (!isExpanded && wasExpandedRef.current) {
      wasExpandedRef.current = false;
    }
  }, [isExpanded]);

  const theme = useMemo(() => {
    if (example.type === 'incorrect') {
      return {
        gradient: 'bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600',
        border: 'border border-rose-400/40',
        shadow: 'shadow-[0_18px_0_-6px_rgba(225,29,72,0.35),0_32px_52px_-30px_rgba(225,29,72,0.55)]',
        focusRing: 'focus-visible:ring-rose-200/70',
        overlay: 'bg-rose-500/15',
        chipClass: 'bg-white/25 text-rose-900',
        iconTint: 'text-white',
        accentIcon: 'text-white/70',
        languageChip: 'bg-black/30',
        statusChip: 'bg-black/25 text-white',
      };
    }

    return {
      gradient: 'bg-gradient-to-br from-emerald-400 via-lime-400 to-emerald-500',
      border: 'border border-emerald-400/40',
      shadow: 'shadow-[0_18px_0_-6px_rgba(16,185,129,0.35),0_32px_48px_-28px_rgba(16,185,129,0.55)]',
      focusRing: 'focus-visible:ring-emerald-200/70',
      overlay: '',
      chipClass: 'bg-white/25 text-emerald-950',
      iconTint: 'text-white',
      accentIcon: 'text-white/70',
      languageChip: 'bg-black/20',
      statusChip: 'bg-black/20 text-white',
    };
  }, [example.type]);

  const labelText = example.type === 'correct' ? 'Exemplo Correto' : 'Exemplo com Erro';
  const compactMode = isSiblingExpanded && !isExpanded;

  return (
    <div className="flex flex-col h-full">
      {!isExpanded && (
        <button
          onClick={handleSelect}
          aria-label={labelText}
          className={cn(
            'group relative flex w-full flex-col justify-center items-center rounded-3xl text-left transition-transform duration-300 ease-out',
            compactMode ? 'h-[100px]' : 'h-full min-h-[200px]',
            'cursor-pointer hover:-translate-y-1 active:translate-y-0.5',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-0',
            theme.gradient,
            theme.border,
            theme.shadow,
            theme.focusRing
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-35 rounded-3xl"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 55%), radial-gradient(circle at 80% 15%, rgba(255,255,255,0.12), transparent 55%)',
            }}
          />
          {theme.overlay && (
            <div className={cn('pointer-events-none absolute inset-0 rounded-3xl', theme.overlay)} />
          )}
          <div className="relative flex items-center justify-center">
            <span
              className={cn(
                'inline-flex w-fit items-center gap-3 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-[0.14em]',
                theme.chipClass
              )}
            >
              {example.type === 'correct' ? (
                <CheckCircle className="h-5 w-5 text-emerald-700" strokeWidth={2.5} />
              ) : (
                <XCircle className="h-5 w-5 text-rose-500" strokeWidth={2.5} />
              )}
              {labelText}
            </span>
          </div>
          <div className="pointer-events-none absolute bottom-4 right-6 opacity-40">
            {example.type === 'correct' ? (
              <CheckCircle className={cn('h-24 w-24', theme.accentIcon)} strokeWidth={1.5} />
            ) : (
              <XCircle className={cn('h-24 w-24', theme.accentIcon)} strokeWidth={1.5} />
            )}
          </div>
        </button>
      )}

      {isExpanded && (
        <div className={cn(
          "flex flex-col rounded-2xl overflow-hidden border-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300",
          example.type === 'correct' 
            ? 'border-emerald-400/40 bg-emerald-50/5' 
            : 'border-rose-400/40 bg-rose-50/5'
        )}>
          {/* Header com mesmo design do botão */}
          <div className={cn(
            'relative overflow-hidden px-5 py-4',
            theme.gradient,
            theme.border
          )}>
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 15% 15%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(circle at 90% 10%, rgba(255,255,255,0.12), transparent 50%)',
              }}
            />
            {theme.overlay && (
              <div className={cn('pointer-events-none absolute inset-0', theme.overlay)} />
            )}
            
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
                  {example.type === 'correct' ? (
                    <CheckCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
                  ) : (
                    <XCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.12em]">
                    <span className={cn('rounded-full px-2.5 py-1 font-bold capitalize', theme.chipClass)}>
                      {example.language}
                    </span>
                    <span className={cn('rounded-full px-2.5 py-1 font-bold', theme.statusChip)}>
                      {example.type === 'correct' ? '✓ Correto' : '✗ Com erro'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenModal}
                  className="h-8 px-3 text-xs font-semibold text-white/90 hover:bg-white/20 hover:text-white"
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  Foco
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelect}
                  className="h-8 px-3 text-xs font-semibold text-white/90 hover:bg-white/20 hover:text-white"
                >
                  <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                  Ocultar
                </Button>
              </div>
            </div>
          </div>

          {/* Card de Descrição */}
          <div className="px-5 py-4 border-b border-border/50">
            <div className="flex items-start gap-3">
              <div className={cn(
                "mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                example.type === 'correct' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
              )}>
                {example.type === 'correct' ? (
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground mb-2">
                  {labelText}
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {example.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Card de Código - Estilo Mac */}
          <div className="bg-slate-950 m-4 rounded-xl border border-slate-800/70 shadow-lg overflow-hidden">
            {/* Barra superior estilo Mac */}
            <div className="flex items-center justify-between bg-slate-900/80 px-4 py-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer"></div>
                </div>
                <span className="ml-3 text-xs font-medium text-slate-400">
                  {example.title || `exemplo.${example.language}`}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-3 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copiar
              </Button>
            </div>

            {/* Área de código com scroll */}
            <div className="overflow-x-auto overflow-y-auto max-h-80">
              <pre className="p-4 text-sm font-mono text-slate-100 leading-relaxed">
                <code className="block">{example.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ExamplesPanel: React.FC<ExamplesPanelProps> = ({
  className,
  onExampleSelect,
  theme = 'dark'
}) => {
  const { examples } = useExamples();
  
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState<'correct' | 'incorrect' | null>(null);
  const [modalExample, setModalExample] = useState<CodeExample | null>(null);

  // Pegar um exemplo correto e um incorreto
  const correctExamples = useMemo(() => 
    examples.filter(ex => ex.type === 'correct'),
    [examples]
  );
  const incorrectExamples = useMemo(() => 
    examples.filter(ex => ex.type === 'incorrect'),
    [examples]
  );

  const currentCorrect = correctExamples[currentPairIndex % correctExamples.length];
  const currentIncorrect = incorrectExamples[currentPairIndex % incorrectExamples.length];

  const handleGenerateNew = useCallback(() => {
    const previousPairIndex = currentPairIndex;
    setCurrentPairIndex(prev => prev + 1);
    setExpandedCard(null);
    
    // Analytics: gerar novos exemplos
    posthog?.capture?.('edu_examples_regenerated', {
      previousIndex: previousPairIndex,
      newIndex: previousPairIndex + 1,
      previousCorrectId: currentCorrect?.id,
      previousIncorrectId: currentIncorrect?.id,
      totalCorrectExamples: correctExamples.length,
      totalIncorrectExamples: incorrectExamples.length,
      timestamp: new Date().toISOString()
    });
  }, [currentPairIndex, currentCorrect, currentIncorrect, correctExamples.length, incorrectExamples.length]);

  const handleSelectExample = useCallback((example: CodeExample) => {
    const cardType = example.type === 'correct' ? 'correct' : 'incorrect';
    setExpandedCard(expandedCard === cardType ? null : cardType);
    
    if (onExampleSelect) {
      onExampleSelect(example);
    }
  }, [onExampleSelect, expandedCard]);

  const handleOpenModal = useCallback((example: CodeExample) => {
    setModalExample(example);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalExample(null);
  }, []);

  // Rastrear sessão do painel de exemplos
  React.useEffect(() => {
    const sessionStart = Date.now();
    
    // Analytics: painel aberto
    posthog?.capture?.('edu_examples_panel_opened', {
      totalExamples: examples.length,
      correctExamplesCount: correctExamples.length,
      incorrectExamplesCount: incorrectExamples.length,
      languages: [...new Set(examples.map(e => e.language))],
      difficulties: [...new Set(examples.map(e => e.difficulty).filter(Boolean))],
      timestamp: new Date().toISOString()
    });

    return () => {
      // Analytics: painel fechado com duração da sessão
      const sessionDuration = Date.now() - sessionStart;
      posthog?.capture?.('edu_examples_panel_closed', {
        sessionDurationMs: sessionDuration,
        sessionDurationSeconds: Math.round(sessionDuration / 1000),
        pairIndex: currentPairIndex,
        expandedCard: expandedCard,
        timestamp: new Date().toISOString()
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentCorrect || !currentIncorrect) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-8', className)}>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Nenhum exemplo disponível
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Modal */}
      {modalExample && (
        <ExampleModal
          example={modalExample}
          isOpen={!!modalExample}
          onClose={handleCloseModal}
        />
      )}

      <div className={cn('flex flex-col h-full bg-background', className)}>
        {/* Header com título e botão de gerar novos */}
        <div className="px-6 pt-6 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Exemplos de Código
            </h2>
            <Button
              onClick={handleGenerateNew}
              variant="outline"
              size="sm"
              className="border-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Outros
            </Button>
          </div>
        </div>

        {/* Cards ocupam toda altura restante */}
        <div className="flex-1 flex flex-col gap-4 p-6 min-h-0 overflow-auto">
          {/* Exemplo Correto */}
          <div className={cn(
            "transition-all duration-300 ease-out",
            expandedCard === 'correct' && 'flex-[3]',
            expandedCard === 'incorrect' && 'flex-[0.3] min-h-[100px]',
            !expandedCard && 'flex-1 min-h-[200px]'
          )}>
            <ExampleCard
              example={currentCorrect}
              onSelect={handleSelectExample}
              isExpanded={expandedCard === 'correct'}
              isSiblingExpanded={expandedCard === 'incorrect'}
              onOpenModal={() => handleOpenModal(currentCorrect)}
            />
          </div>

          {/* Exemplo Incorreto */}
          <div className={cn(
            "transition-all duration-300 ease-out",
            expandedCard === 'incorrect' && 'flex-[3]',
            expandedCard === 'correct' && 'flex-[0.3] min-h-[100px]',
            !expandedCard && 'flex-1 min-h-[200px]'
          )}>
            <ExampleCard
              example={currentIncorrect}
              onSelect={handleSelectExample}
              isExpanded={expandedCard === 'incorrect'}
              isSiblingExpanded={expandedCard === 'correct'}
              onOpenModal={() => handleOpenModal(currentIncorrect)}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ExamplesPanel;
