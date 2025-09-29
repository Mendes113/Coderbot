import { cn } from "@/lib/utils";
import { User, Copy, CheckCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { StructuredResponse } from "@/services/agnoService";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useMemo, useState, useEffect, useRef } from "react";
import posthog from "posthog-js";
// Remove duplicate API_URL definition - axios already handles this

// Small stable hash for block keys
const simpleHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return `${h}`;
};

const trackEvent = (name: string, props?: Record<string, any>) => {
  try {
    posthog?.capture?.(name, props);
  } catch { /* no-op */ }
};

export type QuizAnswerEvent = {
  question: string;
  selectedId: string;
  selectedText: string;
  correct: boolean;
  explanation?: string;
};

const MermaidView = ({ code, id }: { code: string; id: string }) => {
  return null;
};

type ChatMessageProps = {
  content: string;
  isAi: boolean;
  timestamp: Date;
  onQuizAnswer?: (evt: QuizAnswerEvent) => void;
  structuredResponse?: StructuredResponse;
};

export const ChatMessage = ({ content, isAi, timestamp, onQuizAnswer, structuredResponse }: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const isStructured = isAi && Boolean(structuredResponse);
  const [exampleSelection, setExampleSelection] = useState<'correct' | 'incorrect' | null>(null);
  const [exampleRevealState, setExampleRevealState] = useState<Record<'correct' | 'incorrect', boolean>>({ correct: false, incorrect: false });
  const [structuredQuizSelections, setStructuredQuizSelections] = useState<Record<string, { selectedId: string; correct: boolean }>>({});
  const structuredQuizTimersRef = useRef<Record<string, number>>({});
  const structuredQuizStartedRef = useRef<Set<string>>(new Set());

  const hasCorrectExample = Boolean(structuredResponse?.correct_example?.markdown && structuredResponse.correct_example.markdown.trim().length);
  const hasIncorrectExample = Boolean(structuredResponse?.incorrect_example?.markdown && structuredResponse.incorrect_example.markdown.trim().length);

  // Quiz state: parse fenced ```quiz JSON but don't show the raw block
  useEffect(() => {
    if (!isStructured) {
      setExampleSelection(null);
      setExampleRevealState({ correct: false, incorrect: false });
      return;
    }

    if (hasCorrectExample && !hasIncorrectExample) {
      setExampleSelection('correct');
      setExampleRevealState({ correct: true, incorrect: false });
    } else if (!hasCorrectExample && hasIncorrectExample) {
      setExampleSelection('incorrect');
      setExampleRevealState({ correct: false, incorrect: true });
    } else {
      setExampleSelection(null);
      setExampleRevealState({ correct: false, incorrect: false });
    }

    setStructuredQuizSelections({});
    structuredQuizTimersRef.current = {};
    structuredQuizStartedRef.current = new Set();
  }, [isStructured, structuredResponse, hasCorrectExample, hasIncorrectExample]);

  useEffect(() => {
    if (!isStructured || !structuredResponse?.quizzes?.length) return;
    structuredResponse.quizzes.forEach((quiz) => {
      if (structuredQuizSelections[quiz.id]) return;
      if (!structuredQuizTimersRef.current[quiz.id]) {
        structuredQuizTimersRef.current[quiz.id] = Date.now();
      }
      if (!structuredQuizStartedRef.current.has(quiz.id)) {
        const questionId = simpleHash(quiz.question || quiz.id);
        posthog?.capture?.('edu_quiz_start', { questionId });
        structuredQuizStartedRef.current.add(quiz.id);
      }
    });
  }, [isStructured, structuredResponse, structuredQuizSelections]);

  const handleStructuredQuizOptionClick = (
    quiz: StructuredResponse["quizzes"][number],
    option: StructuredResponse["quizzes"][number]["options"][number]
  ) => {
    if (!isStructured) return;
    if (structuredQuizSelections[quiz.id]) return;
    const start = structuredQuizTimersRef.current[quiz.id] ?? Date.now();
    const timeMs = Math.max(0, Date.now() - start);
    const questionId = simpleHash(quiz.question || quiz.id);
    trackEvent('edu_quiz_time_spent', { questionId, timeMs });
    trackEvent('edu_quiz_answer', { questionId, correct: Boolean(option.correct) });
    structuredQuizTimersRef.current[quiz.id] = Date.now();
    setStructuredQuizSelections((prev) => {
      if (prev[quiz.id]) return prev;
      return {
        ...prev,
        [quiz.id]: { selectedId: option.id, correct: Boolean(option.correct) },
      };
    });
    const optionText = option.text ?? '';
    if (onQuizAnswer) {
      onQuizAnswer({
        question: quiz.question,
        selectedId: option.id,
        selectedText: optionText,
        correct: Boolean(option.correct),
        explanation: option.reason || quiz.explanation,
      });
    }
  };

  const handleExampleSelect = (choice: 'correct' | 'incorrect') => {
    if (choice === 'correct' && !hasCorrectExample) return;
    if (choice === 'incorrect' && !hasIncorrectExample) return;

    setExampleRevealState((prev) => {
      const alreadySeenAny = prev.correct || prev.incorrect;
      const alreadyViewedThis = prev[choice];
      if (!alreadyViewedThis) {
        trackEvent('edu_example_choice', { choice, first_view: !alreadySeenAny });
      } else {
        trackEvent('edu_example_revisit', { choice });
      }
      return { ...prev, [choice]: true };
    });

    setExampleSelection(choice);
  };

  const quizData = useMemo(() => {
    if (isStructured) return null;
    try {
      const match = content.match(/```quiz\s*([\s\S]*?)```/i);
      if (!match) return null;
      const jsonStr = match[1].trim();
      const data = JSON.parse(jsonStr) as {
        question?: string;
        options?: { id?: string; text?: string; correct?: boolean; reason?: string; explanation?: string }[];
        explanation?: string;
      };
      const opts = Array.isArray(data.options) ? data.options : [];
      const normalized = opts
        .map((opt, idx) => ({
          id: opt?.id || String.fromCharCode(65 + idx),
          text: (opt?.text ?? "").toString(),
          correct: Boolean((opt as any)?.correct),
          reason: (opt as any)?.reason || (opt as any)?.explanation || undefined,
        }))
        .filter(o => o.text.trim().length > 0)
        .slice(0, 3);
      if (normalized.length >= 2) {
        return {
          question: (data.question || '').toString(),
          options: normalized as { id: string; text: string; correct: boolean; reason?: string }[],
          explanation: data.explanation,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, [content, isStructured]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Quiz timing: measure time from render to answer click
  const quizStartRef = useRef<number | null>(null);
  const quizStartedEmittedRef = useRef<boolean>(false);
  useEffect(() => {
    if (isStructured) return;
    if (quizData && selectedOption === null) {
      if (!quizStartedEmittedRef.current) {
        const questionId = simpleHash(quizData.question || '');
        posthog?.capture?.('edu_quiz_start', { questionId });
        quizStartedEmittedRef.current = true;
      }
      quizStartRef.current = Date.now();
    } else if (!quizData) {
      quizStartRef.current = null;
      quizStartedEmittedRef.current = false;
    }
  }, [isStructured, quizData, selectedOption]);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      trackEvent('edu_code_copied', { size: code.length });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
        trackEvent('edu_code_copied', { size: code.length });
      } catch (err) {
        console.error('Fallback copy failed: ', err);
      }
      textArea.remove();
    }
  };

  // Remove the raw ```quiz block and unwrap entire ```markdown fences before rendering
  const normalizedContent = useMemo(() => {
    if (isStructured) return '';
    const withoutQuiz = content.replace(/```quiz[\s\S]*?```/gi, '').trim();
    const fenceMatch = withoutQuiz.match(/^```(?:markdown|md)\s*([\s\S]*?)```$/i);
    if (fenceMatch) {
      return (fenceMatch[1] || '').trim();
    }
    return withoutQuiz;
  }, [content, isStructured]);

  const hasExplanationContent = useMemo(() => {
    if (isStructured) return false;
    const withoutCode = normalizedContent.replace(/```[\s\S]*?```/g, '');
    const withoutHeadings = withoutCode.replace(/^\s{0,3}#{1,6}\s+[^\n]+\n?/gm, '');
    return withoutHeadings.trim().length > 0;
  }, [normalizedContent, isStructured]);

  const fencedBlocks = useMemo(() => {
    if (isStructured) return [] as { lang: string; code: string; blockKey: string }[];
    const blocks: { lang: string; code: string; blockKey: string }[] = [];
    const regex = /```(\w+)?\s*([\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(normalizedContent)) !== null) {
      const rawLang = (m[1] || '').toLowerCase();
      if (!rawLang || ['quiz', 'mermaid', 'excalidraw', 'markdown', 'md'].includes(rawLang)) continue;
      const code = (m[2] || '').trim();
      if (!code) continue;
      const lang = rawLang;
      const blockKey = simpleHash(`${lang}::${code}`);
      blocks.push({ lang, code, blockKey });
    }
    return blocks;
  }, [normalizedContent, isStructured]);

  const finalBlock = useMemo(() => {
    if (isStructured) return null as null | { lang: string; code: string; blockKey: string };
    for (let i = fencedBlocks.length - 1; i >= 0; i -= 1) {
      const block = fencedBlocks[i];
      if (!block || !block.code.trim()) continue;
      return block;
    }
    return null as null | { lang: string; code: string; blockKey: string };
  }, [fencedBlocks, isStructured]);

  const isFinalCodeSegment = useMemo(() => !isStructured && /###\s+.*c[oó]digo\s+final/i.test(normalizedContent), [isStructured, normalizedContent]);

  const renderStructuredMarkdown = (markdown: string) => {
    if (!markdown || !markdown.trim()) return null;
    return (
      <ReactMarkdown
        components={{
          code({ node, className, children, inline, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const code = String(children).replace(/\n$/, "");
            if (!inline && match) {
              const lang = match[1] || 'text';
              const blockKey = simpleHash(`${lang}::${code}`);
              return (
                <div key={blockKey} className="my-3 rounded-md overflow-hidden bg-[#0d1117] border border-[#30363d]">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
                    <span className="text-xs text-[#9ca3af] font-mono">{lang}</span>
                    <button
                      onClick={() => copyToClipboard(code)}
                      className="opacity-90 hover:opacity-100 transition-opacity duration-200 bg-[#21262d] hover:bg-[#30363d] rounded px-2 py-1 text-[#7d8590] hover:text-[#c9d1d9] text-xs flex items-center gap-1"
                      aria-label="Copy code"
                    >
                      {copiedCode === code ? (
                        <>
                          <CheckCheck size={12} className="text-[#3fb950]" />
                          <span className="text-[#3fb950]">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      language={lang}
                      style={oneDark}
                      customStyle={{ margin: 0, borderRadius: 0, background: '#0d1117', fontSize: '14px', lineHeight: '1.6', padding: '16px' }}
                      showLineNumbers={false}
                      wrapLongLines={false}
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
          p: ({ node, ...props }: any) => (
            <p {...props} className="text-base my-3 leading-relaxed text-[#1f2937] dark:text-white" />
          ),
          ul: ({ node, ...props }: any) => (
            <ul {...props} className="list-disc ml-6 my-3 space-y-1 text-[#1f2937] dark:text-white" />
          ),
          ol: ({ node, ...props }: any) => (
            <ol {...props} className="list-decimal ml-6 my-3 space-y-1 text-[#1f2937] dark:text-white" />
          ),
          li: ({ node, ...props }: any) => (
            <li {...props} className="my-1 text-[#1f2937] dark:text-white" />
          ),
          h3: ({ node, ...props }: any) => (
            <h3 {...props} className="text-lg font-semibold my-2 text-[#1f2937] dark:text-white font-chat-heading" />
          ),
          h4: ({ node, ...props }: any) => (
            <h4 {...props} className="text-base font-semibold my-2 text-[#1f2937] dark:text-white font-chat-heading" />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    );
  };

  const renderStructuredContent = () => {
    if (!structuredResponse) return null;

    const correctExample = structuredResponse.correct_example;
    const incorrectExample = structuredResponse.incorrect_example;
    const hasBothExamples = hasCorrectExample && hasIncorrectExample;
    const hasAnyExample = hasCorrectExample || hasIncorrectExample;
    const hasSeenAnyExample = exampleRevealState.correct || exampleRevealState.incorrect;
    const hasSeenBoth = exampleRevealState.correct && exampleRevealState.incorrect;

    const currentExampleMarkdown = (() => {
      if (exampleSelection === 'correct' && hasCorrectExample) {
        return correctExample?.markdown || '';
      }
      if (exampleSelection === 'incorrect' && hasIncorrectExample) {
        return incorrectExample?.markdown || '';
      }
      if (!exampleSelection && !hasBothExamples) {
        if (hasCorrectExample) return correctExample?.markdown || '';
        if (hasIncorrectExample) return incorrectExample?.markdown || '';
      }
      return '';
    })();

    const currentExampleTitle = exampleSelection === 'correct'
      ? (correctExample?.title || 'Exemplo correto')
      : exampleSelection === 'incorrect'
        ? (incorrectExample?.title || 'Exemplo incorreto')
        : hasCorrectExample && !hasIncorrectExample
          ? (correctExample?.title || 'Exemplo correto')
          : hasIncorrectExample && !hasCorrectExample
            ? (incorrectExample?.title || 'Exemplo incorreto')
            : undefined;

    return (
      <div className="space-y-6">
        {structuredResponse.reflection && (
          <section className="rounded-xl border border-[#c7d2fe] bg-white dark:bg-[#1e1b4b] dark:border-[#312e81] p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#3730a3] dark:text-[#c4b5fd] mb-2">💭 Reflexão do aluno</h3>
            {renderStructuredMarkdown(structuredResponse.reflection)}
          </section>
        )}

        {(structuredResponse.steps_list.length > 0 || (structuredResponse.steps_markdown && structuredResponse.steps_markdown.trim().length)) && (
          <section className="rounded-xl border border-[#d1d5db] dark:border-[#1f2937] bg-white dark:bg-[#0f172a] p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0f172a] dark:text-[#bfdbfe] mb-3">🧭 Plano de estudo em etapas</h3>
            {structuredResponse.steps_list.length > 0 ? (
              <ol className="list-decimal ml-5 space-y-2 text-[#1f2937] dark:text-[#e2e8f0]">
                {structuredResponse.steps_list.map((step, idx) => (
                  <li key={`${idx}-${step.slice(0, 24)}`} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            ) : (
              renderStructuredMarkdown(structuredResponse.steps_markdown || '')
            )}
          </section>
        )}

        {hasAnyExample && (
          <section className="rounded-xl border border-[#d1d5db] dark:border-[#1f2937] bg-white dark:bg-[#0f172a] p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0f172a] dark:text-[#bfdbfe]">📚 Exemplos trabalhados</h3>
                <span className="text-xs text-[#6b7280] dark:text-[#cbd5f5]">
                  Escolha por qual exemplo deseja começar e compare depois.
                </span>
              </div>

              <p className="text-sm text-[#1f2937] dark:text-[#e2e8f0]">
                Você quer ver o exemplo {hasBothExamples ? 'correto ou incorreto primeiro' : hasCorrectExample ? 'correto' : 'incorreto'}?
              </p>

              <div className="flex flex-wrap gap-2">
                {hasCorrectExample && (
                  <button
                    type="button"
                    onClick={() => handleExampleSelect('correct')}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-xs font-semibold transition",
                      exampleSelection === 'correct'
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : exampleRevealState.correct
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                    )}
                  >
                    {exampleRevealState.correct ? (exampleSelection === 'correct' ? 'Revendo exemplo correto' : 'Ver novamente o correto') : 'Ver exemplo correto'}
                  </button>
                )}
                {hasIncorrectExample && (
                  <button
                    type="button"
                    onClick={() => handleExampleSelect('incorrect')}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-xs font-semibold transition",
                      exampleSelection === 'incorrect'
                        ? "bg-rose-600 text-white border-rose-500"
                        : exampleRevealState.incorrect
                          ? "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-800"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                    )}
                  >
                    {exampleRevealState.incorrect ? (exampleSelection === 'incorrect' ? 'Revendo exemplo incorreto' : 'Ver novamente o incorreto') : 'Ver exemplo incorreto'}
                  </button>
                )}
              </div>

              {hasBothExamples && hasSeenAnyExample && !hasSeenBoth && (
                <div className="rounded-lg bg-[#fef3c7] dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                  Depois de analisar este primeiro exemplo, clique no outro botão para comparar abordagens e evitar armadilhas.
                </div>
              )}

              {currentExampleMarkdown && (
                <div className="space-y-3">
                  {currentExampleTitle && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#cbd5f5]">
                      {currentExampleTitle}
                    </p>
                  )}
                  {renderStructuredMarkdown(currentExampleMarkdown)}
                </div>
              )}

              {!currentExampleMarkdown && hasAnyExample && !hasSeenAnyExample && (
                <div className="rounded-lg border border-dashed border-[#cbd5f5] text-[#475569] dark:text-[#cbd5f5] text-sm px-4 py-3">
                  Escolha uma das opções acima para liberar o exemplo trabalhado.
                </div>
              )}

              {hasSeenBoth && hasBothExamples && (
                <div className="rounded-lg bg-[#ecfdf5] dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-100">
                  Excelente! Você já analisou os dois exemplos. Use os botões para revisitar rapidamente o que achar necessário.
                </div>
              )}
            </div>
          </section>
        )}

        {(structuredResponse.checklist_questions && structuredResponse.checklist_questions.length > 0) && (
          <section className="rounded-xl border border-[#d1d5db] dark:border-[#1f2937] bg-white dark:bg-[#0f172a] p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0f172a] dark:text-[#bfdbfe] mb-3">✅ Perguntas de checagem</h3>
            <ul className="list-disc ml-5 space-y-2 text-sm text-[#1f2937] dark:text-[#e2e8f0]">
              {structuredResponse.checklist_questions.map((question, idx) => (
                <li key={`${idx}-${question.slice(0, 24)}`} className="leading-relaxed">
                  {question}
                </li>
              ))}
            </ul>
          </section>
        )}

        {structuredResponse.quizzes.length > 0 && (
          <section className="rounded-xl border border-[#d1d5db] dark:border-[#1f2937] bg-gradient-to-r from-slate-50 to-blue-50 dark:from-[#0f172a] dark:to-[#1e3a8a] p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1e3a8a] dark:text-[#93c5fd] mb-3">🧠 Quiz rápido</h3>
            <div className="space-y-4">
              {structuredResponse.quizzes.map((quiz) => {
                const selection = structuredQuizSelections[quiz.id];
                const answered = Boolean(selection);
                const selectedOption = answered ? quiz.options.find((opt) => opt.id === selection?.selectedId) : undefined;
                const feedbackText = selectedOption?.reason || quiz.explanation;
                return (
                  <div key={quiz.id} className="rounded-lg border border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4 shadow-sm">
                    <div className="text-sm font-semibold text-[#1e293b] dark:text-white mb-3">
                      {quiz.question}
                    </div>
                    <div className="flex flex-col gap-2">
                      {quiz.options.map((option) => {
                        const isSelected = selection?.selectedId === option.id;
                        const isCorrectOption = Boolean(option.correct);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleStructuredQuizOptionClick(quiz, option)}
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
                            <span className="font-medium">{option.id}. {option.text ?? ''}</span>
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <div className={cn("mt-3 text-sm", selection?.correct ? "text-emerald-400" : "text-rose-300")}> 
                        {selection?.correct ? "Excelente! Você acertou." : "Quase lá! Reveja o raciocínio."}
                        {feedbackText && (
                          <span className="block text-xs text-white/80 mt-2">
                            {feedbackText}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {structuredResponse.final_code?.code && (
          <section className="rounded-xl border border-[#1f2937] bg-[#0d1117] text-white p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#93c5fd]">💻 Código final comentado</h3>
              <button
                type="button"
                onClick={() => copyToClipboard(structuredResponse.final_code?.code || '')}
                className="px-3 py-1.5 rounded-md border border-[#30363d] bg-[#161b22] text-xs text-[#9ca3af] hover:bg-[#1f2533] transition"
              >
                {copiedCode === structuredResponse.final_code?.code ? "Copiado" : "Copiar"}
              </button>
            </div>
            <div className="rounded-md overflow-hidden border border-[#30363d]">
              <SyntaxHighlighter
                language={structuredResponse.final_code?.language || 'text'}
                style={oneDark}
                customStyle={{ margin: 0, borderRadius: 0, background: '#0d1117', fontSize: '14px', lineHeight: '1.6', padding: '16px' }}
                showLineNumbers={false}
                wrapLongLines={false}
              >
                {structuredResponse.final_code?.code || ''}
              </SyntaxHighlighter>
            </div>
            <div className="mt-2 text-xs text-[#9ca3af]">
              Execute o código no seu ambiente e comente cada linha para reforçar o aprendizado.
              {structuredResponse.final_code?.truncated && (
                <span className="block text-amber-400 mt-1">Trecho truncado para manter o foco nas partes essenciais.</span>
              )}
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        // layout and common bubble styling
  "py-5 px-5 rounded-2xl mb-3 shadow-sm transition-all duration-200 border max-w-[85%] font-chat",
        // side alignment: AI left, User right
        isAi ? "mr-auto" : "ml-auto",
        // distinct background, border and text colors + asymmetric corners
        isAi
          ? "bg-[hsl(var(--education-primary-50))] border-[hsl(var(--education-primary-200))] text-[hsl(var(--education-text-primary))] rounded-bl-none dark:bg-[#0b1220] dark:border-[#334155] dark:text-[#e5e7eb]"
          : "bg-[hsl(var(--education-primary-100))] border-[hsl(var(--education-primary-200))] text-[hsl(var(--education-text-primary))] rounded-br-none dark:bg-[#1d4ed8] dark:border-[#1e40af] dark:text-white"
      )}
    >
      <div className="flex items-center mb-2">
        <div
          className={cn(
            "icon-container h-8 w-8 rounded-full flex items-center justify-center shadow-sm border transition-all duration-300 hover:scale-105",
            isAi
              ? "bg-[hsl(var(--education-primary-200))] border-[hsl(var(--education-primary-300))] text-[hsl(var(--education-primary-800))] hover:bg-[hsl(var(--education-primary-300))] dark:bg-[#1d4ed8] dark:border-white/10 dark:text-white dark:hover:bg-[#1e40af]"
              : "bg-[hsl(var(--education-primary-100))] border-[hsl(var(--education-primary-200))] text-[hsl(var(--education-primary-800))] hover:bg-[hsl(var(--education-primary-200))] dark:bg-white/15 dark:border-white/20 dark:text-white dark:hover:bg-white/20"
          )}
        >
          {isAi ? (
            <img
              src="/coderbot_colorfull.png"
              alt="Coderbot"
              className="icon-bot h-6 w-6 object-contain  hover:animate-gentle-float transition-all duration-300"
            />
          ) : (
            <User className="icon-user h-4 w-4 text-[hsl(var(--education-primary-700))] dark:text-white transition-all duration-300 hover:scale-110" />
          )}
        </div>
        <span
          className={cn(
            "ml-2 font-semibold text-sm text-[hsl(var(--education-text-primary))] font-chat-heading",
            "dark:text-white"
          )}
        >
          {isAi ? "Coderbot" : "Você"}
        </span>
        {/* Segment chip (detect from markdown heading) */}
        {(() => {
          // Captura primeira linha do tipo ### Título
          const m = (content || '').match(/^\s{0,3}#{3}\s+([^\n]+)/);
          if (!m) return null;
          const title = (m[1] || '').trim();
          const lower = title.toLowerCase();
          let cls = 'bg-[#21262d] text-[#9ca3af] border-[#30363d]';
          if (/introdu\u00e7\u00e3o|introducao/.test(lower)) cls = 'bg-[#1f1533] text-[#c4b5fd] border-[#7c3aed]';
          else if (/passo a passo|passo/.test(lower)) cls = 'bg-[#0d1b2a] text-[#93c5fd] border-[#3b82f6]';
          else if (/exemplo\s+correr|exemplo correto|correto|\u2705/.test(lower)) cls = 'bg-[#0c1a10] text-[#86efac] border-[#16a34a]';
          else if (/exemplo\s+incorreto|incorreto|erro|\u26a0/.test(lower)) cls = 'bg-[#1a0c0c] text-[#fca5a5] border-[#ef4444]';
          else if (/reflex/.test(lower)) cls = 'bg-[#1a1033] text-[#c084fc] border-[#a855f7]';
          else if (/c\u00f3digo final|codigo final|c\u00f3digo|codigo|final/.test(lower)) cls = 'bg-[#0b1020] text-[#93c5fd] border-[#3b82f6]';
          return (
            <span className={cn("ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium border", cls)}>
              {title}
            </span>
          );
        })()}
        <span className="ml-auto text-xs text-muted-foreground">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="ml-10">
        {isAi ? (
          isStructured ? (
            <div className="markdown-content prose max-w-none text-[hsl(var(--education-text-primary))] dark:prose-invert font-chat">
              {renderStructuredContent()}
            </div>
          ) : (
            <div className="markdown-content prose max-w-none text-[hsl(var(--education-text-primary))] dark:prose-invert font-chat">
              {/* Auto: render explanation (non-empty after removing headings and code); otherwise show final code editor */}
              {(() => {
                if (hasExplanationContent) {
                  return (
            <ReactMarkdown
              components={{
                code({ node, className, children, inline, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const code = String(children).replace(/\n$/, "");
                  const isInline = Boolean(inline);

                  // Hide fenced ```quiz blocks from rendering as code
                  const lang = match ? match[1] : undefined;
                  if (!isInline && lang && lang.toLowerCase() === 'quiz') {
                    return null;
                  }
                    // Hide final code and diagram blocks in explanation view
                    if (!isInline && lang) {
                      const effectiveLang = (lang || 'javascript').toLowerCase();
                      const blockKey = simpleHash(`${effectiveLang}::${code}`);
                      if (isFinalCodeSegment && finalBlock && blockKey === finalBlock.blockKey) return null;
                      if (effectiveLang === 'mermaid' || effectiveLang === 'excalidraw') return null; // sempre ocultar diagramas
                    }

                  if (!isInline) {
                    const effectiveLang = lang || 'text';
                    return (
                      <div className="my-3 rounded-md overflow-hidden bg-[#0d1117] border border-[#30363d]">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
                          <span className="text-xs text-[#9ca3af] font-mono">{effectiveLang}</span>
                          <button
                            onClick={() => copyToClipboard(code)}
                            className="opacity-90 hover:opacity-100 transition-opacity duration-200 bg-[#21262d] hover:bg-[#30363d] rounded px-2 py-1 text-[#7d8590] hover:text-[#c9d1d9] text-xs flex items-center gap-1"
                            aria-label="Copy code"
                          >
                            {copiedCode === code ? (
                              <>
                                <CheckCheck size={12} className="text-[#3fb950]" />
                                <span className="text-[#3fb950]">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <SyntaxHighlighter
                            language={lang || 'text'}
                            style={oneDark}
                            customStyle={{ margin: 0, borderRadius: 0, background: '#0d1117', fontSize: '14px', lineHeight: '1.6', padding: '16px' }}
                            showLineNumbers={false}
                            wrapLongLines={false}
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
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                p: ({ node, ...props }) => (
                  <p {...props} className="text-base my-3 leading-relaxed text-[#1f2937] dark:text-white" />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-disc ml-6 my-3 space-y-1 text-[#1f2937] dark:text-white" />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="list-decimal ml-6 my-3 space-y-1 text-[#1f2937] dark:text-white" />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} className="my-1 text-[#1f2937] dark:text-white" />
                ),
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="text-2xl font-semibold my-4 text-[#111827] dark:text-white border-b border-[#30363d] pb-2 font-chat-heading" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-xl font-semibold my-3 text-[#1f2937] dark:text-white font-chat-heading" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="text-lg font-semibold my-2 text-[#1f2937] dark:text-white font-chat-heading" />
                ),
              }}
            >
              {normalizedContent}
            </ReactMarkdown>
                  );
                }
                return null;
              })()}

              {/* Fallback runner when no explanation content exists: show code blocks (non-diagram) */}
              {(!hasExplanationContent) && !isFinalCodeSegment && fencedBlocks.length > 0 && !finalBlock && (
                <div className="mt-4 space-y-4">
                  {fencedBlocks.map(({ lang, code, blockKey }) => {
                    // hide in explanation if this is final or diagram
                    if (lang === 'mermaid' || lang === 'excalidraw') return null; // sempre ocultar diagramas
                    return (
                      <div key={blockKey} className="rounded-md overflow-hidden bg-[#0d1117] border border-[#30363d]">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
                          <span className="text-xs text-[#9ca3af] font-mono">{lang || 'text'}</span>
                          <button
                            onClick={() => copyToClipboard(code)}
                            className="opacity-90 hover:opacity-100 transition-opacity duration-200 bg-[#21262d] hover:bg-[#30363d] rounded px-2 py-1 text-[#7d8590] hover:text-[#c9d1d9] text-xs flex items-center gap-1"
                            aria-label="Copy code"
                          >
                            {copiedCode === code ? (
                              <>
                                <CheckCheck size={12} className="text-[#3fb950]" />
                                <span className="text-[#3fb950]">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <SyntaxHighlighter
                            language={lang || 'text'}
                            style={oneDark}
                            customStyle={{ margin: 0, borderRadius: 0, background: '#0d1117', fontSize: '14px', lineHeight: '1.6', padding: '16px' }}
                            showLineNumbers={false}
                            wrapLongLines={false}
                          >
                            {code}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quiz options render when present */}
              {quizData && (
                <div className="mt-4 p-3 rounded-xl border border-[#30363d] bg-[#0f1420]">
                  <div className="text-sm text-white font-medium mb-2">{quizData.question || 'Quiz'}</div>
                  <div className="flex gap-2 flex-wrap">
                    {quizData.options.map((opt) => {
                      const selected = selectedOption === opt.id;
                      const correct = isCorrect && opt.correct;
                      const incorrect = selected && isCorrect === false;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (selectedOption) return;
                            setSelectedOption(opt.id!);
                            const correctNow = Boolean(opt.correct);
                            setIsCorrect(correctNow);
                            const questionId = simpleHash(quizData.question || '');
                            // time spent until answer
                            const start = quizStartRef.current || Date.now();
                            const timeMs = Math.max(0, Date.now() - start);
                            trackEvent('edu_quiz_time_spent', { questionId, timeMs });
                            trackEvent('edu_quiz_answer', { questionId, correct: correctNow });
                            if (onQuizAnswer) {
                              onQuizAnswer({
                                question: quizData.question,
                                selectedId: opt.id!,
                                selectedText: opt.text,
                                correct: correctNow,
                                explanation: quizData.explanation,
                              });
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs border transition-colors",
                            !selectedOption && "bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d]",
                            selected && correct && "bg-green-600 border-green-500 text-white",
                            selected && incorrect && "bg-red-600 border-red-500 text-white"
                          )}
                        >
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                  {selectedOption !== null && (() => {
                    const selected = quizData.options.find(o => o.id === selectedOption);
                    const reason = selected?.reason || quizData.explanation;
                    return (
                      <div className={cn("mt-2 text-xs", isCorrect ? "text-green-400" : "text-red-400")}
                      >
                        {isCorrect ? "Resposta correta!" : "Resposta incorreta."}
                        {reason ? (
                          <span className="block text-[#9ca3af] mt-1">{reason}</span>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Final code view: mostra apenas o bloco final para cópia, sem execução direta */}
              {isFinalCodeSegment && finalBlock && (
                <div className="mt-4 rounded-md overflow-hidden bg-[#0d1117] border border-[#30363d]">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
                    <span className="text-xs text-[#9ca3af] font-mono">{finalBlock.lang || 'text'}</span>
                    <button
                      onClick={() => copyToClipboard(finalBlock.code)}
                      className="opacity-90 hover:opacity-100 transition-opacity duration-200 bg-[#21262d] hover:bg-[#30363d] rounded px-2 py-1 text-[#7d8590] hover:text-[#c9d1d9] text-xs flex items-center gap-1"
                      aria-label="Copiar código final"
                    >
                      {copiedCode === finalBlock.code ? (
                        <>
                          <CheckCheck size={12} className="text-[#3fb950]" />
                          <span className="text-[#3fb950]">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      language={finalBlock.lang || 'text'}
                      style={oneDark}
                      customStyle={{ margin: 0, borderRadius: 0, background: '#0d1117', fontSize: '14px', lineHeight: '1.6', padding: '16px' }}
                      showLineNumbers={false}
                      wrapLongLines={false}
                    >
                      {finalBlock.code}
                    </SyntaxHighlighter>
                  </div>
                  <div className="px-4 py-2 border-t border-[#30363d] bg-[#0d1117] text-xs text-[#9ca3af]">
                    A execução direta foi desativada. Copie o código e execute no seu ambiente para praticar.
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div className={cn("text-base whitespace-pre-wrap leading-relaxed text-[hsl(var(--education-text-primary))]", "dark:text-white")}>{content}</div>
        )}
      </div>
    </div>
  );
};
