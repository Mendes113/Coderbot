import { cn } from "@/lib/utils";
import { User, Copy, CheckCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
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
};

export const ChatMessage = ({ content, isAi, timestamp, onQuizAnswer }: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Quiz state: parse fenced ```quiz JSON but don't show the raw block
  const quizData = useMemo(() => {
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
  }, [content]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Quiz timing: measure time from render to answer click
  const quizStartRef = useRef<number | null>(null);
  const quizStartedEmittedRef = useRef<boolean>(false);
  useEffect(() => {
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
  }, [quizData, selectedOption]);

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
    const withoutQuiz = content.replace(/```quiz[\s\S]*?```/gi, '').trim();
    const fenceMatch = withoutQuiz.match(/^```(?:markdown|md)\s*([\s\S]*?)```$/i);
    if (fenceMatch) {
      return (fenceMatch[1] || '').trim();
    }
    return withoutQuiz;
  }, [content]);

  const hasExplanationContent = useMemo(() => {
    const withoutCode = normalizedContent.replace(/```[\s\S]*?```/g, '');
    const withoutHeadings = withoutCode.replace(/^\s{0,3}#{1,6}\s+[^\n]+\n?/gm, '');
    return withoutHeadings.trim().length > 0;
  }, [normalizedContent]);

  const fencedBlocks = useMemo(() => {
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
  }, [normalizedContent]);

  const finalBlock = useMemo(() => {
    for (let i = fencedBlocks.length - 1; i >= 0; i -= 1) {
      const block = fencedBlocks[i];
      if (!block || !block.code.trim()) continue;
      return block;
    }
    return null as null | { lang: string; code: string; blockKey: string };
  }, [fencedBlocks]);

  const isFinalCodeSegment = useMemo(() => /###\s+.*c[oó]digo\s+final/i.test(normalizedContent), [normalizedContent]);

  return (
    <div
      className={cn(
        // layout and common bubble styling
        "py-5 px-5 rounded-2xl mb-3 shadow-sm transition-all duration-200 border max-w-[85%]",
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
            "ml-2 font-semibold text-sm text-[hsl(var(--education-text-primary))]",
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
          <div className="markdown-content prose max-w-none text-[hsl(var(--education-text-primary))] dark:prose-invert">
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
                  <p {...props} className="text-base my-3 leading-relaxed text-white" />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-disc ml-6 my-3 space-y-1 text-white" />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="list-decimal ml-6 my-3 space-y-1 text-white" />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} className="my-1 text-white" />
                ),
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="text-2xl font-semibold my-4 text-white border-b border-[#30363d] pb-2" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-xl font-semibold my-3 text-white" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="text-lg font-semibold my-2 text-white" />
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
        ) : (
          <div className={cn("text-base whitespace-pre-wrap leading-relaxed text-[hsl(var(--education-text-primary))]", "dark:text-white")}>{content}</div>
        )}
      </div>
    </div>
  );
};
