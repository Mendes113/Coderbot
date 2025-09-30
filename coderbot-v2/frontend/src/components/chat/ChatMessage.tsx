import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { User } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import posthog from "posthog-js";

import { cn } from "@/lib/utils";
import type { StructuredResponse, ResponseSegment } from "@/services/agnoService";
import { ExamplesInteractive } from "@/components/chat/ExamplesInteractive";
import { QuizInteraction } from "@/components/chat/QuizInteraction";

// Tipos para Worked Examples estruturados
interface WorkedExampleData {
  worked_example_segments: any;
  frontend_segments: Array<{
    id: string;
    title: string;
    type: string;
    content: string;
    language?: string;
  }>;
  validation: any;
  educational_guidance: string;
  methodology: string;
  topic: string;
  difficulty: string;
  scientific_basis: string[];
}

const simpleHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return `${hash}`;
};

const trackEvent = (name: string, payload?: Record<string, unknown>) => {
  try {
    posthog?.capture?.(name, payload);
  } catch {
    /* no-op */
  }
};

async function copyToClipboard(code: string, onSuccess: (snippet: string) => void) {
  try {
    await navigator.clipboard.writeText(code);
    onSuccess(code);
    trackEvent("edu_code_copied", { size: code.length });
  } catch (error) {
    console.error("Failed to copy text", error);
  }
}

export type QuizAnswerEvent = {
  question: string;
  selectedId: string;
  selectedText: string;
  correct: boolean;
  explanation?: string;
};

export type ChatMessageProps = {
  content: string;
  isAi: boolean;
  timestamp: Date;
  onQuizAnswer?: (event: QuizAnswerEvent) => void;
  structuredResponse?: StructuredResponse;
  workedExampleData?: WorkedExampleData;
  onWorkedExampleNext?: () => void;
  onWorkedExamplePrev?: () => void;
  onWorkedExampleComplete?: () => void;
  currentSegmentIndex?: number;
  // Novo: segmentos da resposta AGNO
  segments?: ResponseSegment[];
};

const MarkdownRenderer = ({ markdown }: { markdown: string }) => {
  // Remove blocos quiz e examples do markdown (eles serão renderizados separadamente)
  const cleanMarkdown = markdown
    .replace(/```quiz\s*\n[\s\S]*?\n```/g, '')
    .replace(/```examples\s*\n[\s\S]*?\n```/g, '')
    .trim();
  
  return (
    <ReactMarkdown
      components={{
        code({ node, className, children, inline, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const code = String(children).replace(/\n$/, "");
          
          // Não renderizar blocos quiz ou examples (serão componentes)
          if (!inline && match) {
            const language = match[1] || "text";
            if (language === 'quiz' || language === 'examples') {
              return null;
            }
            
            return (
              <div className="my-3 rounded-md overflow-hidden bg-[#0d1117] border border-[#30363d]">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
                  <span className="text-xs text-[#9ca3af] font-mono">{language}</span>
                </div>
                <div className="overflow-x-auto">
                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    customStyle={{ margin: 0, borderRadius: 0, background: "#0d1117", fontSize: "14px", lineHeight: "1.6", padding: "16px" }}
                    showLineNumbers={false}
                    wrapLongLines
                    {...props}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              </div>
            );
          }
          return (
            <code className="bg-[#262626] text-[#e6edf3] px-1.5 py-0.5 rounded text-sm font-mono border border-[#30363d]" {...props}>
              {children}
            </code>
          );
        },
        p: ({ node, ...props }) => <p {...props} className="text-base my-3 leading-relaxed text-[#1f2937] dark:text-white" />,
        ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-6 my-3 space-y-1 text-[#1f2937] dark:text-white" />,
        ol: ({ node, ...props }) => <ol {...props} className="list-decimal ml-6 my-3 space-y-1 text-[#1f2937] dark:text-white" />,
        li: ({ node, ...props }) => <li {...props} className="my-1 text-[#1f2937] dark:text-white" />,
        h3: ({ node, ...props }) => <h3 {...props} className="text-lg font-semibold my-2 text-[#1f2937] dark:text-white font-chat-heading" />,
        h4: ({ node, ...props }) => <h4 {...props} className="text-base font-semibold my-2 text-[#1f2937] dark:text-white font-chat-heading" />,
      }}
    >
      {cleanMarkdown}
    </ReactMarkdown>
  );
};

type ExampleChoice = "correct" | "incorrect";

const StructuredMessage = ({
  data,
  onQuizAnswer,
  copiedCode,
  setCopiedCode,
}: {
  data: StructuredResponse;
  onQuizAnswer?: (event: QuizAnswerEvent) => void;
  copiedCode: string | null;
  setCopiedCode: (snippet: string | null) => void;
}) => {
  const { reflection, steps_markdown, steps_list, correct_example, incorrect_example, checklist_questions, quizzes, final_code } = data;
  const hasCorrect = Boolean(correct_example?.markdown?.trim().length);
  const hasIncorrect = Boolean(incorrect_example?.markdown?.trim().length);

  const [activeExample, setActiveExample] = useState<ExampleChoice | null>(hasCorrect && !hasIncorrect ? "correct" : hasIncorrect && !hasCorrect ? "incorrect" : null);
  const [viewedExamples, setViewedExamples] = useState<Record<ExampleChoice, boolean>>({ correct: !hasCorrect ? false : activeExample === "correct", incorrect: !hasIncorrect ? false : activeExample === "incorrect" });

  useEffect(() => {
    if (hasCorrect && !hasIncorrect) {
      setActiveExample("correct");
      setViewedExamples({ correct: true, incorrect: false });
    } else if (!hasCorrect && hasIncorrect) {
      setActiveExample("incorrect");
      setViewedExamples({ correct: false, incorrect: true });
    } else if (!hasCorrect && !hasIncorrect) {
      setActiveExample(null);
      setViewedExamples({ correct: false, incorrect: false });
    }
  }, [hasCorrect, hasIncorrect]);

  const handleExampleSelection = (choice: ExampleChoice) => {
    if ((choice === "correct" && !hasCorrect) || (choice === "incorrect" && !hasIncorrect)) return;
    setActiveExample(choice);
    setViewedExamples(prev => ({ ...prev, [choice]: true }));
    trackEvent("edu_example_choice", { choice, first_view: !prevSeen(choice, viewedExamples) });
  };

  const prevSeen = (choice: ExampleChoice, state: Record<ExampleChoice, boolean>) => state[choice];

  const [quizSelections, setQuizSelections] = useState<Record<string, { selectedId: string; correct: boolean }>>({});
  const quizTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    quizzes.forEach(quiz => {
      if (!quizTimers.current[quiz.id]) {
        quizTimers.current[quiz.id] = Date.now();
        trackEvent("edu_quiz_start", { questionId: simpleHash(quiz.question || quiz.id) });
      }
    });
  }, [quizzes]);

  const handleQuizSelection = (quiz: StructuredResponse["quizzes"][number], option: StructuredResponse["quizzes"][number]["options"][number]) => {
    if (quizSelections[quiz.id]) return;
    const started = quizTimers.current[quiz.id] ?? Date.now();
    const duration = Math.max(0, Date.now() - started);
    const questionId = simpleHash(quiz.question || quiz.id);
    const correct = Boolean(option.correct);

    setQuizSelections(prev => ({ ...prev, [quiz.id]: { selectedId: option.id, correct } }));
    trackEvent("edu_quiz_time_spent", { questionId, timeMs: duration });
    trackEvent("edu_quiz_answer", { questionId, correct });

    if (onQuizAnswer) {
      onQuizAnswer({
        question: quiz.question,
        selectedId: option.id,
        selectedText: option.text,
        correct,
        explanation: option.reason || quiz.explanation,
      });
    }
  };

  const renderExampleMarkdown = (choice: ExampleChoice) => {
    if (choice === "correct") {
      return correct_example ? <MarkdownRenderer markdown={correct_example.markdown} /> : null;
    }
    return incorrect_example ? <MarkdownRenderer markdown={incorrect_example.markdown} /> : null;
  };

  return (
    <div className="space-y-6">
      {reflection && (
        <section className="rounded-xl border border-[#c7d2fe] bg-white dark:bg-[#1e1b4b] dark:border-[#312e81] p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#3730a3] dark:text-[#c4b5fd] mb-2">💭 Reflexão guiada</h3>
          <MarkdownRenderer markdown={reflection} />
        </section>
      )}

      {(steps_list.length > 0 || (steps_markdown && steps_markdown.trim().length)) && (
        <section className="rounded-xl border border-[#d1d5db] dark:border-[#1f2937] bg-white dark:bg-[#0f172a] p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0f172a] dark:text-[#bfdbfe] mb-3">🧭 Plano de estudo em etapas</h3>
          {steps_list.length > 0 ? (
            <ol className="list-decimal ml-5 space-y-2 text-[#1f2937] dark:text-[#e2e8f0]">
              {steps_list.map((step, index) => (
                <li key={`${index}-${step.slice(0, 24)}`} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          ) : (
            <MarkdownRenderer markdown={steps_markdown || ""} />
          )}
        </section>
      )}

      {(hasCorrect || hasIncorrect) && (
        <section className="rounded-xl border border-[#d1d5db] dark:border-[#1f2937] bg-white dark:bg-[#0f172a] p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0f172a] dark:text-[#bfdbfe]">📚 Exemplos trabalhados</h3>
              <span className="text-xs text-[#6b7280] dark:text-[#cbd5f5]">
                Escolha por qual exemplo deseja começar e compare depois.
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {hasCorrect && (
                <button
                  type="button"
                  onClick={() => handleExampleSelection("correct")}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-xs font-semibold transition",
                    activeExample === "correct"
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : viewedExamples.correct
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                  )}
                >
                  {viewedExamples.correct ? (activeExample === "correct" ? "Revendo exemplo correto" : "Ver novamente o correto") : "Ver exemplo correto"}
                </button>
              )}
              {hasIncorrect && (
                <button
                  type="button"
                  onClick={() => handleExampleSelection("incorrect")}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-xs font-semibold transition",
                    activeExample === "incorrect"
                      ? "bg-rose-600 text-white border-rose-500"
                      : viewedExamples.incorrect
                        ? "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-800"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                  )}
                >
                  {viewedExamples.incorrect ? (activeExample === "incorrect" ? "Revendo exemplo incorreto" : "Ver novamente o incorreto") : "Ver exemplo incorreto"}
                </button>
              )}
            </div>

            {activeExample && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#cbd5f5]">
                  {activeExample === "correct" ? correct_example?.title || "Exemplo correto" : incorrect_example?.title || "Exemplo incorreto"}
                </p>
                {renderExampleMarkdown(activeExample)}
              </div>
            )}

            {!activeExample && (
              <div className="rounded-lg border border-dashed border-[#cbd5f5] text-[#475569] dark:text-[#cbd5f5] text-sm px-4 py-3">
                Escolha uma das opções acima para liberar o exemplo trabalhado.
              </div>
            )}

            {viewedExamples.correct && viewedExamples.incorrect && (
              <div className="rounded-lg bg-[#ecfdf5] dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-100">
                Excelente! Você já analisou os dois exemplos. Use os botões para revisitar rapidamente o que achar necessário.
              </div>
            )}
          </div>
        </section>
      )}

      {checklist_questions.length > 0 && (
        <section className="rounded-xl border border-[#d1d5db] dark:border-[#1f2937] bg-white dark:bg-[#0f172a] p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0f172a] dark:text-[#bfdbfe] mb-3">✅ Perguntas de checagem</h3>
          <ul className="list-disc ml-5 space-y-2 text-sm text-[#1f2937] dark:text-[#e2e8f0]">
            {checklist_questions.map((question, index) => (
              <li key={`${index}-${question.slice(0, 24)}`} className="leading-relaxed">
                {question}
              </li>
            ))}
          </ul>
        </section>
      )}

      {quizzes.length > 0 && (
        <section className="rounded-xl border border-[#d1d5db] dark:border-[#1f2937] bg-gradient-to-r from-slate-50 to-blue-50 dark:from-[#0f172a] dark:to-[#1e3a8a] p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1e3a8a] dark:text-[#93c5fd] mb-3">🧠 Quiz rápido</h3>
          <div className="space-y-4">
            {quizzes.map(quiz => {
              const selection = quizSelections[quiz.id];
              const answered = Boolean(selection);
              const selectedOption = answered ? quiz.options.find(option => option.id === selection?.selectedId) : undefined;
              const feedback = selectedOption?.reason || quiz.explanation;

              return (
                <div key={quiz.id} className="rounded-lg border border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-[#1e293b] dark:text-white mb-3">{quiz.question}</div>
                  <div className="flex flex-col gap-2">
                    {quiz.options.map(option => {
                      const isSelected = selection?.selectedId === option.id;
                      const isCorrectOption = Boolean(option.correct);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleQuizSelection(quiz, option)}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-lg border transition duration-200 shadow-sm",
                            !answered && "bg-[#0f172a] text-white border-[#1e293b] hover:bg-[#1e293b]",
                            answered && isSelected && selection?.correct && "bg-emerald-600 text-white border-emerald-500",
                            answered && isSelected && !selection?.correct && "bg-rose-600 text-white border-rose-500",
                            answered && !isSelected && isCorrectOption && "border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-200",
                            answered && !isSelected && !isCorrectOption && "opacity-60"
                          )}
                          disabled={answered}
                        >
                          <span className="font-medium">{option.id}. {option.text}</span>
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <div className={cn("mt-3 text-sm", selection?.correct ? "text-emerald-400" : "text-rose-300")}
                    >
                      {selection?.correct ? "Excelente! Você acertou." : "Quase lá! Reveja o raciocínio."}
                      {feedback && <span className="block text-xs text-white/80 mt-2">{feedback}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {final_code?.code && (
        <section className="rounded-xl border border-[#1f2937] bg-[#0d1117] text-white p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#93c5fd]">💻 Código final comentado</h3>
            <button
              type="button"
              onClick={() => copyToClipboard(final_code.code, snippet => setCopiedCode(snippet))}
              className="px-3 py-1.5 rounded-md border border-[#30363d] bg-[#161b22] text-xs text-[#9ca3af] hover:bg-[#1f2533] transition"
            >
              {copiedCode === final_code.code ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="rounded-md overflow-hidden border border-[#30363d]">
            <SyntaxHighlighter
              language={final_code.language || "text"}
              style={oneDark}
              customStyle={{ margin: 0, borderRadius: 0, background: "#0d1117", fontSize: "14px", lineHeight: "1.6", padding: "16px" }}
              showLineNumbers={false}
              wrapLongLines
            >
              {final_code.code}
            </SyntaxHighlighter>
          </div>
          <div className="mt-2 text-xs text-[#9ca3af]">
            A execução direta foi desativada. Copie o código e execute no seu ambiente para praticar.
          </div>
        </section>
      )}
    </div>
  );
};

export const ChatMessage = ({ content, isAi, timestamp, onQuizAnswer, structuredResponse, segments }: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const isStructured = Boolean(isAi && structuredResponse)
  
  // Processar segmentos para encontrar exemplos interativos e quiz
  const correctExample = segments?.find(seg => seg.type === 'correct_example');
  const incorrectExample = segments?.find(seg => seg.type === 'incorrect_example');
  const hasInteractiveExamples = Boolean(correctExample || incorrectExample);
  
  const quizSegment = segments?.find(seg => seg.type === 'quiz');
  const hasQuiz = Boolean(quizSegment);

  const avatar = isAi ? (
    <img
      src="/coderbot_colorfull.png"
      alt="CodeBot avatar"
      className="h-10 w-10 rounded-full border border-indigo-200 bg-white object-cover shadow-sm"
    />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <User className="h-5 w-5" />
    </div>
  )

  const bubbleClasses = cn(
    "max-w-[min(92%,60rem)] rounded-2xl shadow-sm transition-all",
    isStructured
      ? "bg-transparent p-0 shadow-none"
      : isAi
        ? "bg-purple-100 px-5 py-3 text-slate-700 dark:bg-purple-900/30 dark:text-purple-50"
        : "bg-purple-100 px-5 py-3 text-slate-700 dark:bg-purple-900/30 dark:text-purple-50"
  )

  const nameClass = cn(
    "text-sm font-semibold",
    isAi ? " dark:text-purple-300" : "text-purple-700 dark:text-purple-300"
  )

  const timeLabel = timestamp instanceof Date && !isNaN(timestamp.valueOf())
    ? timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : ""

  const messageContent = isStructured && structuredResponse ? (
    <>
      <StructuredMessage data={structuredResponse} onQuizAnswer={onQuizAnswer} copiedCode={copiedCode} setCopiedCode={setCopiedCode} />
      {hasInteractiveExamples && (
        <div className="mt-6">
          <ExamplesInteractive 
            correctExample={correctExample} 
            incorrectExample={incorrectExample} 
          />
        </div>
      )}
      {hasQuiz && quizSegment && (
        <div className="mt-6">
          <QuizInteraction 
            content={quizSegment.content} 
            onAnswer={(evt) => onQuizAnswer?.({
              question: evt.question,
              selectedId: evt.selectedOption,
              selectedText: '',
              correct: evt.correct,
              explanation: evt.explanation
            })} 
          />
        </div>
      )}
    </>
  ) : (
    <>
      <MarkdownRenderer markdown={content} />
      {hasInteractiveExamples && (
        <div className="mt-6">
          <ExamplesInteractive 
            correctExample={correctExample} 
            incorrectExample={incorrectExample} 
          />
        </div>
      )}
      {hasQuiz && quizSegment && (
        <div className="mt-6">
          <QuizInteraction 
            content={quizSegment.content} 
            onAnswer={(evt) => onQuizAnswer?.({
              question: evt.question,
              selectedId: evt.selectedOption,
              selectedText: '',
              correct: evt.correct,
              explanation: evt.explanation
            })} 
          />
        </div>
      )}
    </>
  )

  return (
    <div
      id={`msg-${simpleHash(content)}`}
      className={cn("mb-8 flex w-full", isAi ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "flex max-w-[min(90%,52rem)] gap-3",
          isAi ? "flex-row text-left" : "flex-row-reverse text-right"
        )}
      >
        {avatar}
        <div className={cn("flex flex-col gap-2", isAi ? "items-start" : "items-end")}
        >
          <div className={cn("flex items-center gap-2", isAi ? "flex-row" : "flex-row-reverse")}
          >
            <span className={nameClass}>{isAi ? "Coderbot" : "Você"}</span>
            {timeLabel && (
              <span className="text-xs text-slate dark:text-slate-500">{timeLabel}</span>
            )}
          </div>
          <div className={bubbleClasses}>
            {messageContent}
          </div>
        </div>
      </div>
    </div>
  )
}
