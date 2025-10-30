import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useExamples, type CodeExample } from '@/context/ExamplesContext';
import posthog from 'posthog-js';

interface ExamplesPanelProps {
  className?: string;
  onExampleSelect?: (example: CodeExample) => void;
  theme?: 'light' | 'dark';
  hasUserInteracted?: boolean;
}

const ExampleView: React.FC<{
  example: CodeExample;
  onUseExample?: (example: CodeExample) => void;
}> = ({ example, onUseExample }) => {
  const sectionLabel = example.type === 'correct' ? 'Solução sugerida' : 'Ponto de atenção';

  const tags = useMemo(() => {
    const items: string[] = [];

    if (example.language) {
      items.push(example.language.toUpperCase());
    }

    if (example.difficulty) {
      items.push(`Dificuldade: ${example.difficulty}`);
    }

    items.push(example.type === 'correct' ? 'Referência' : 'Para revisar');

    return items;
  }, [example.language, example.difficulty, example.type]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(example.code);
    toast.success('Código copiado! 📋');

    posthog?.capture?.('edu_example_code_copied', {
      exampleId: example.id,
      exampleTitle: example.title,
      exampleType: example.type,
      language: example.language,
      difficulty: example.difficulty,
      codeLength: example.code.length,
      context: 'inline_display',
      timestamp: new Date().toISOString()
    });
  }, [example]);

  const handleUse = useCallback(() => {
    if (onUseExample) {
      onUseExample(example);
    }
  }, [example, onUseExample]);

  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {sectionLabel}
          </p>
          <h3 className="text-base font-semibold text-foreground">
            {example.title || `Exemplo em ${example.language}`}
          </h3>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {tags.map((item) => (
              <span
                key={item}
                className="rounded-full border border-border/60 bg-background/60 px-3 py-1 font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Copiar
          </Button>
          {onUseExample && (
            <Button variant="secondary" size="sm" onClick={handleUse} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Usar no editor
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 pb-5">
        <ScrollArea className="max-h-[320px] rounded-xl border border-border/60 bg-background/70">
          <pre className="w-full overflow-x-auto whitespace-pre text-sm font-mono leading-relaxed text-foreground/90 p-4">
            <code>{example.code}</code>
          </pre>
        </ScrollArea>
      </div>

      {example.explanation && (
        <div className="border-t border-border/60 px-6 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {example.explanation}
          </p>
        </div>
      )}
    </section>
  );
};

export const ExamplesPanel: React.FC<ExamplesPanelProps> = ({
  className,
  onExampleSelect,
  theme: _theme = 'dark',
  hasUserInteracted = false
}) => {
  const { examples } = useExamples();

  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const lastPairIndexRef = useRef(0);

  useEffect(() => {
    lastPairIndexRef.current = currentPairIndex;
  }, [currentPairIndex]);

  useEffect(() => {
    setCurrentPairIndex(0);
  }, [examples]);

  const correctExamples = useMemo(
    () => examples.filter((ex) => ex.type === 'correct'),
    [examples]
  );

  const incorrectExamples = useMemo(
    () => examples.filter((ex) => ex.type === 'incorrect'),
    [examples]
  );

  const safeCorrectIndex = correctExamples.length ? currentPairIndex % correctExamples.length : 0;
  const safeIncorrectIndex = incorrectExamples.length ? currentPairIndex % incorrectExamples.length : 0;

  const currentCorrect = correctExamples.length ? correctExamples[safeCorrectIndex] : undefined;
  const currentIncorrect = incorrectExamples.length ? incorrectExamples[safeIncorrectIndex] : undefined;
  const hasExamplePairs = Boolean(currentCorrect && currentIncorrect);
  const canShowExamples = hasUserInteracted && hasExamplePairs;

  const handleGenerateNew = useCallback(() => {
    if (!hasUserInteracted) {
      toast.error('Envie uma pergunta no chat para desbloquear novos exemplos.');
      return;
    }

    if (!correctExamples.length || !incorrectExamples.length) {
      return;
    }

    const previousPairIndex = currentPairIndex;
    const nextIndex = previousPairIndex + 1;

    setCurrentPairIndex(nextIndex);

    posthog?.capture?.('edu_examples_regenerated', {
      previousIndex: previousPairIndex,
      newIndex: nextIndex,
      previousCorrectId: currentCorrect?.id,
      previousIncorrectId: currentIncorrect?.id,
      totalCorrectExamples: correctExamples.length,
      totalIncorrectExamples: incorrectExamples.length,
      timestamp: new Date().toISOString()
    });
  }, [
    correctExamples.length,
    currentCorrect?.id,
    currentIncorrect?.id,
    currentPairIndex,
    hasUserInteracted,
    incorrectExamples.length
  ]);

  const handleUseExample = useCallback(
    (example: CodeExample) => {
      if (!hasUserInteracted) {
        toast.error('Envie uma pergunta no chat para explorar os exemplos.');
        return;
      }

      onExampleSelect?.(example);

      posthog?.capture?.('edu_example_applied_to_editor', {
        exampleId: example.id,
        exampleTitle: example.title,
        exampleType: example.type,
        language: example.language,
        difficulty: example.difficulty,
        codeLength: example.code.length,
        timestamp: new Date().toISOString()
      });

      toast.success('Exemplo enviado para o editor!');
    },
    [hasUserInteracted, onExampleSelect]
  );

  useEffect(() => {
    const sessionStart = Date.now();

    posthog?.capture?.('edu_examples_panel_opened', {
      totalExamples: examples.length,
      correctExamplesCount: correctExamples.length,
      incorrectExamplesCount: incorrectExamples.length,
      languages: [...new Set(examples.map((e) => e.language))],
      difficulties: [...new Set(examples.map((e) => e.difficulty).filter(Boolean))],
      timestamp: new Date().toISOString()
    });

    return () => {
      const sessionDuration = Date.now() - sessionStart;
      posthog?.capture?.('edu_examples_panel_closed', {
        sessionDurationMs: sessionDuration,
        sessionDurationSeconds: Math.round(sessionDuration / 1000),
        lastPairIndex: lastPairIndexRef.current,
        timestamp: new Date().toISOString()
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      <div className="px-6 pt-6 pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Exemplos de Código</h2>
          <Button
            onClick={handleGenerateNew}
            variant="outline"
            size="sm"
            disabled={!hasUserInteracted || !hasExamplePairs}
            className="border-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {!hasUserInteracted
              ? 'Envie uma pergunta para desbloquear'
              : hasExamplePairs
                ? 'Gerar outros'
                : 'Aguardando novos exemplos'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {canShowExamples ? (
          <div className="flex flex-col gap-6">
            {currentCorrect && (
              <ExampleView
                example={currentCorrect}
                onUseExample={onExampleSelect ? handleUseExample : undefined}
              />
            )}
            {currentIncorrect && (
              <ExampleView
                example={currentIncorrect}
                onUseExample={onExampleSelect ? handleUseExample : undefined}
              />
            )}
          </div>
        ) : !hasUserInteracted ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-center">
            <Sparkles className="mb-3 h-6 w-6 text-purple-500" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Envie sua primeira pergunta no chat para desbloquear exemplos gerados a partir da sua dúvida.
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-center">
            <Sparkles className="mb-3 h-6 w-6 text-purple-500 animate-spin" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Gerando novos exemplos com base na sua pergunta. Assim que estiverem prontos, eles aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamplesPanel;
