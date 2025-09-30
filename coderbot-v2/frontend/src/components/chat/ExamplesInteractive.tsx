import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ResponseSegment } from "@/services/agnoService";
import posthog from "posthog-js";

type ExampleChoice = "correct" | "incorrect" | "both" | null;

interface ExamplesInteractiveProps {
  correctExample?: ResponseSegment;
  incorrectExample?: ResponseSegment;
}

const trackEvent = (name: string, payload?: Record<string, unknown>) => {
  try {
    posthog?.capture?.(name, payload);
  } catch {
    /* no-op */
  }
};

export const ExamplesInteractive = ({ correctExample, incorrectExample }: ExamplesInteractiveProps) => {
  const [activeChoice, setActiveChoice] = useState<ExampleChoice>(null);
  const [viewedExamples, setViewedExamples] = useState<Record<"correct" | "incorrect", boolean>>({
    correct: false,
    incorrect: false,
  });

  const hasCorrect = Boolean(correctExample);
  const hasIncorrect = Boolean(incorrectExample);

  const handleExampleSelection = (choice: "correct" | "incorrect" | "both") => {
    setActiveChoice(choice);
    
    if (choice === "correct") {
      setViewedExamples(prev => ({ ...prev, correct: true }));
      trackEvent("edu_example_interactive_choice", { choice: "correct", first_view: !viewedExamples.correct });
    } else if (choice === "incorrect") {
      setViewedExamples(prev => ({ ...prev, incorrect: true }));
      trackEvent("edu_example_interactive_choice", { choice: "incorrect", first_view: !viewedExamples.incorrect });
    } else if (choice === "both") {
      setViewedExamples({ correct: true, incorrect: true });
      trackEvent("edu_example_interactive_choice", { choice: "both", first_view: !viewedExamples.correct || !viewedExamples.incorrect });
    }
  };

  const renderExample = (example: ResponseSegment, type: "correct" | "incorrect") => {
    const isCorrect = type === "correct";
    
    return (
      <div
        className={cn(
          "rounded-xl border p-5 shadow-sm transition-all",
          isCorrect
            ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30"
            : "border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/30"
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className={cn("text-2xl", isCorrect ? "text-emerald-600" : "text-rose-600")}>
            {isCorrect ? "✅" : "❌"}
          </span>
          <h4 className={cn("text-base font-semibold", isCorrect ? "text-emerald-900 dark:text-emerald-100" : "text-rose-900 dark:text-rose-100")}>
            {example.title || (isCorrect ? "Exemplo Correto" : "Exemplo Incorreto")}
          </h4>
        </div>

        {example.code && (
          <div className="my-3 rounded-md overflow-hidden bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
              <span className="text-xs text-[#9ca3af] font-mono">{example.language || "code"}</span>
            </div>
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                language={example.language || "javascript"}
                style={oneDark}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  background: "#0d1117",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  padding: "16px",
                }}
                showLineNumbers={false}
                wrapLongLines
              >
                {example.code}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {isCorrect && example.explanation && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50">
            <p className="text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed">
              <strong className="font-semibold">💡 Por que está correto:</strong> {example.explanation}
            </p>
          </div>
        )}

        {!isCorrect && (
          <div className="mt-3 space-y-2">
            {example.error_explanation && (
              <div className="p-3 rounded-lg bg-rose-100/50 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-800/50">
                <p className="text-sm text-rose-900 dark:text-rose-100 leading-relaxed">
                  <strong className="font-semibold">❌ Erro:</strong> {example.error_explanation}
                </p>
              </div>
            )}
            {example.correction && (
              <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                  <strong className="font-semibold">✅ Correção:</strong> {example.correction}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!hasCorrect && !hasIncorrect) {
    return null;
  }

  return (
    <section className="rounded-xl border border-[#d1d5db] dark:border-[#1f2937] bg-white dark:bg-[#0f172a] p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0f172a] dark:text-[#bfdbfe]">
            Exemplos Trabalhados
          </h3>
          <span className="text-xs text-[#6b7280] dark:text-[#cbd5f5]">
            Escolha qual exemplo deseja ver
          </span>
        </div>

        {/* Botões de Seleção */}
        <div className="flex flex-wrap gap-2">
          {hasIncorrect && (
            <Button
              type="button"
              size="sm"
              variant={activeChoice === "incorrect" ? "default" : "outline"}
              onClick={() => handleExampleSelection("incorrect")}
              className={cn(
                "transition-all",
                activeChoice === "incorrect"
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
                  : viewedExamples.incorrect
                    ? "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {activeChoice === "incorrect" ? "Vendo exemplo incorreto" : viewedExamples.incorrect ? "Rever incorreto" : "Ver exemplo incorreto"}
            </Button>
          )}

          {hasCorrect && (
            <Button
              type="button"
              size="sm"
              variant={activeChoice === "correct" ? "default" : "outline"}
              onClick={() => handleExampleSelection("correct")}
              className={cn(
                "transition-all",
                activeChoice === "correct"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                  : viewedExamples.correct
                    ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {activeChoice === "correct" ? "Vendo exemplo correto" : viewedExamples.correct ? "Rever correto" : "Ver exemplo correto"}
            </Button>
          )}

          {hasCorrect && hasIncorrect && (
            <Button
              type="button"
              size="sm"
              variant={activeChoice === "both" ? "default" : "outline"}
              onClick={() => handleExampleSelection("both")}
              className={cn(
                "transition-all",
                activeChoice === "both"
                  ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                  : viewedExamples.correct && viewedExamples.incorrect
                    ? "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {activeChoice === "both" ? "Vendo ambos" : "Ver os dois exemplos"}
            </Button>
          )}
        </div>

        {/* Área de Exibição */}
        {!activeChoice && (
          <div className="rounded-lg border border-dashed border-[#cbd5e1] dark:border-[#475569] text-[#475569] dark:text-[#cbd5e1] text-sm px-4 py-6 text-center">
            <p className="mb-2">👆 Clique em um dos botões acima para ver o exemplo</p>
            <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
              Você pode alternar entre os exemplos a qualquer momento
            </p>
          </div>
        )}

        {activeChoice === "correct" && correctExample && renderExample(correctExample, "correct")}

        {activeChoice === "incorrect" && incorrectExample && renderExample(incorrectExample, "incorrect")}

        {activeChoice === "both" && (
          <div className="space-y-4">
            {correctExample && renderExample(correctExample, "correct")}
            {incorrectExample && renderExample(incorrectExample, "incorrect")}
          </div>
        )}

        {/* Feedback de Progresso */}
        {viewedExamples.correct && viewedExamples.incorrect && (
          <div className="rounded-lg bg-[#ecfdf5] dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-100 flex items-start gap-2">
            <span className="text-lg">🎉</span>
            <div>
              <strong className="font-semibold">Excelente!</strong> Você já analisou os dois exemplos. 
              Use os botões para revisar sempre que precisar.
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

