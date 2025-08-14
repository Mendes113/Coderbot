import { cn } from "@/lib/utils";
import { Bot, User, Copy, CheckCheck, Play, TerminalSquare, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useMemo, useState, useEffect, useRef } from "react";
import api from "@/lib/axios";
import Editor from "@monaco-editor/react";
import posthog from "posthog-js";

const JUDGE0_URL = ""; // force proxy path
const API_URL = (import.meta as any)?.env?.VITE_API_URL || "/api";

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

  // Track execution results per code block (stable key based)
  const [execStates, setExecStates] = useState<Record<string, { status: "idle" | "running" | "done" | "error"; output?: string; error?: string; meta?: { path: 'DIRECT_JUDGE0' | 'BACKEND_PROXY'; endpoint: string; status: number; token?: string; message?: string; }; data?: any }>>({});

  // Toggle details per block
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});

  const toggleDetails = (key: string) => setDetailsOpen(prev => ({ ...prev, [key]: !prev[key] }));

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

  const languageIdFrom = (lang?: string): number | null => {
    if (!lang) return 63; // default to javascript
    const key = lang.toLowerCase();
    const map: Record<string, number> = {
      javascript: 63,
      typescript: 74,
      ts: 74,
      tsx: 74,
      js: 63,
      python: 71,
      py: 71,
      java: 62,
      c: 50,
      cpp: 54,
      cplusplus: 54,
      csharp: 51,
      cs: 51,
      ruby: 72,
      go: 60,
      rust: 73,
      php: 68,
      kotlin: 78,
    };
    return map[key] ?? 63; // default to javascript
  };

  // Friendly summary for learners based on Judge0 json
  const buildSummary = (lang: string, data: any): { level: 'success' | 'info' | 'warn' | 'error'; text: string } => {
    const stdout = (data?.stdout || '').toString();
    const stderr = (data?.stderr || '').toString();
    const message = (data?.message || '').toString();
    const statusDesc = (data?.status?.description || '').toString();
    const langLower = (lang || '').toLowerCase();

    if (stdout && stdout.trim().length > 0) {
      const preview = stdout.trim().split(/\r?\n/)[0]?.slice(0, 120);
      return { level: 'success', text: `Saída: ${preview}${stdout.includes('\n') ? ' …' : ''}` };
    }

    if (/syntax/i.test(stderr)) {
      return { level: 'error', text: 'Erro de sintaxe: confira parênteses, vírgulas e indentação.' };
    }
    if (/name\s*error|is not defined/i.test(stderr)) {
      return { level: 'error', text: 'Variável ou função não definida. Verifique nomes e escopo.' };
    }
    if (/time limit|timed out/i.test(statusDesc) || /time limit/i.test(message)) {
      return { level: 'warn', text: 'Tempo esgotado: verifique laços infinitos ou otimize o algoritmo.' };
    }
    if (/internal error/i.test(statusDesc)) {
      return { level: 'info', text: 'Não foi possível preparar o ambiente agora. Tente novamente mais tarde.' };
    }
    if (!stdout && !stderr && !message) {
      if (langLower.startsWith('py')) return { level: 'info', text: 'Sem saída: em Python, use print(...) para mostrar resultados.' };
      if (langLower.startsWith('js') || langLower.includes('script')) return { level: 'info', text: 'Sem saída: em JS, use console.log(...) para mostrar resultados.' };
      return { level: 'info', text: 'Sem saída produzida. Adicione instruções de exibição de resultado.' };
    }
    if (message) {
      return { level: 'warn', text: message }; // mostra a mensagem do executor
    }
    return { level: 'info', text: statusDesc || 'Execução concluída.' };
  };

  const runOnJudge0 = async (language: string | undefined, source: string, blockKey: string, stdin?: string) => {
    const langName = (language || 'javascript').toLowerCase();
    const langId = languageIdFrom(langName);

    console.log("=== EXECUTION DEBUG START ===");
    console.log("[Runner] Run requested", { language: langName, langId, blockKey, API_URL, sourceCodeLength: source.length, stdinLength: (stdin || '').length });

    setExecStates(prev => ({ ...prev, [blockKey]: { status: 'running' } }));

    const startedAt = Date.now();

    // Always backend proxy now
    try {
      const endpoint = `${API_URL}/judge/executar`;
      const payload = { language: langName, code: source, stdin: stdin || "" } as { language: string; code: string; stdin?: string };
      console.log("[Runner] Using backend proxy", { endpoint, payload });
      const res = await api.post(endpoint, payload, { validateStatus: () => true });
      const durationMs = Date.now() - startedAt;
      console.log("[Runner] Response status:", res.status);
      if (!(res.status >= 200 && res.status < 300)) {
        const errMsg = `Backend ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`;
        setExecStates(prev => ({ ...prev, [blockKey]: { status: 'error', error: errMsg, meta: { path: 'BACKEND_PROXY', endpoint, status: res.status } } }));
        console.error('[Runner] HTTP Error Response:', res.data);
        trackEvent('edu_code_run', { lang: langName, path: 'BACKEND_PROXY', durationMs, status: res.status, success: false });
        console.log("=== EXECUTION DEBUG END ===");
        return;
      }
      const json = res.data;
      const parts: string[] = [];
      if (json.compile_output) parts.push(String(json.compile_output));
      if (json.stdout) parts.push(String(json.stdout));
      if (json.stderr) parts.push(String(json.stderr));
      if (json.message) parts.push(`message: ${String(json.message)}`);
      if (json.status?.description) parts.push(`status: ${String(json.status.description)}`);
      if (json.token) parts.push(`token: ${String(json.token)}`);
      const out = parts.join("\n");
      setExecStates(prev => ({ ...prev, [blockKey]: { status: 'done', output: out || '(sem saída)', meta: { path: 'BACKEND_PROXY', endpoint, status: res.status, token: json?.token, message: json?.message || json?.status?.description }, data: json } }));
      trackEvent('edu_code_run', { lang: langName, path: 'BACKEND_PROXY', durationMs, status: res.status, success: true });
      console.log("[Runner] SUCCESS");
    } catch (e: any) {
      const durationMs = Date.now() - startedAt;
      setExecStates(prev => ({ ...prev, [blockKey]: { status: 'error', error: e?.message || 'Falha ao executar código (proxy)', meta: { path: 'BACKEND_PROXY', endpoint: `${API_URL}/judge/executar`, status: 0 } } }));
      trackEvent('edu_code_run', { lang: langName, path: 'BACKEND_PROXY', durationMs, status: 0, success: false });
      console.error('[Runner] CATCH Error:', e);
    }
    console.log("=== EXECUTION DEBUG END ===");
  };

  // Track index of code blocks while rendering (ignore quiz blocks)
  let codeBlockCounter = -1;

  // Remove the raw ```quiz block from markdown before rendering
  const contentWithoutQuiz = useMemo(() => content.replace(/```quiz[\s\S]*?```/gi, '').trim(), [content]);

  // Determine if there is explanatory content besides headings and fenced code blocks
  const hasExplanationContent = useMemo(() => {
    const withoutCode = contentWithoutQuiz.replace(/```[\s\S]*?```/g, '');
    const withoutHeadings = withoutCode.replace(/^\s{0,3}#{1,6}\s+[^\n]+\n?/gm, '');
    return withoutHeadings.trim().length > 0;
  }, [contentWithoutQuiz]);

  // Fallback: parse fenced code blocks if ReactMarkdown doesn't render any (e.g., formatting quirks)
  const fencedBlocks = useMemo(() => {
    const blocks: { lang: string; code: string; blockKey: string }[] = [];
    const regex = /```(\w+)?\s*([\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(contentWithoutQuiz)) !== null) {
      const rawLang = (m[1] || 'javascript').toLowerCase();
      if (rawLang === 'quiz') continue;
      const code = (m[2] || '').trim();
      const lang = rawLang || 'javascript';
      const blockKey = simpleHash(`${lang}::${code}`);
      blocks.push({ lang, code, blockKey });
    }
    return blocks;
  }, [contentWithoutQuiz]);

  // Identify final code (last non-diagram block) and first diagram (mermaid/excalidraw)
  const finalBlock = useMemo(() => {
    for (let i = fencedBlocks.length - 1; i >= 0; i -= 1) {
      const b = fencedBlocks[i];
      const lang = (b.lang || '').toLowerCase();
      if (lang === 'mermaid' || lang === 'excalidraw' || lang === 'quiz') continue;
      if ((b.code || '').trim().length === 0) continue;
      return b;
    }
    return null as null | { lang: string; code: string; blockKey: string };
  }, [fencedBlocks]);

  const [editedFinalCode, setEditedFinalCode] = useState<string>(finalBlock?.code || '');
  const [finalLang, setFinalLang] = useState<string>(finalBlock?.lang || 'javascript');
  const [finalStdin, setFinalStdin] = useState<string>("");
  const [downloadName, setDownloadName] = useState<string>("solution");
  // keep edited code in sync when content changes
  useMemo(() => {
    if (finalBlock) {
      setEditedFinalCode(finalBlock.code);
      setFinalLang(finalBlock.lang || 'javascript');
    }
  }, [finalBlock?.blockKey]);

  const downloadFinalCode = () => {
    const lang = (finalLang || 'text').toLowerCase();
    const extMap: Record<string, string> = { python: 'py', py: 'py', javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', java: 'java', c: 'c', cpp: 'cpp', cplusplus: 'cpp', ruby: 'rb', go: 'go', rust: 'rs', php: 'php', kotlin: 'kt' };
    const ext = extMap[lang] || 'txt';
    const blob = new Blob([editedFinalCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const base = downloadName && downloadName.trim().length > 0 ? downloadName.trim() : 'solution';
    a.download = `${base}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    trackEvent('edu_code_downloaded', { lang, size: editedFinalCode.length });
  };

  const basicFormat = async () => {
    const lang = (finalLang || '').toLowerCase();
    if (lang.includes('python') || lang === 'py') {
      try {
        const res = await api.post('/format', { language: 'python', code: editedFinalCode });
        const formatted = res?.data?.formatted || editedFinalCode;
        setEditedFinalCode(formatted);
        return;
      } catch (e) {
        // fallback abaixo
      }
    }
    if (lang.includes('javascript') || lang === 'js' || lang.includes('typescript') || lang === 'ts') {
      try {
        // Carrega Prettier via CDN apenas em runtime (evita que o bundler resolva)
        const ensureScript = (id: string, src: string) => new Promise<void>((resolve, reject) => {
          if (document.getElementById(id)) return resolve();
          const s = document.createElement('script');
          s.id = id;
          s.src = src;
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Falha ao carregar ' + src));
          document.head.appendChild(s);
        });
        // @ts-ignore
        if (!(window as any).prettier) {
          await ensureScript('prettier-standalone', 'https://unpkg.com/prettier@3.3.3/standalone.js');
        }
        // Plugins
        const parser = lang.includes('ts') ? 'typescript' : 'babel';
        const pluginUrls = parser === 'typescript'
          ? [
              'https://unpkg.com/prettier@3.3.3/plugins/estree.js',
              'https://unpkg.com/prettier@3.3.3/plugins/typescript.js',
            ]
          : [
              'https://unpkg.com/prettier@3.3.3/plugins/estree.js',
              'https://unpkg.com/prettier@3.3.3/plugins/babel.js',
            ];
        for (let i = 0; i < pluginUrls.length; i++) {
          await ensureScript('prettier-plugin-' + i + '-' + parser, pluginUrls[i]);
        }
        // @ts-ignore
        const prettier = (window as any).prettier;
        // @ts-ignore
        const plugins = (window as any).prettierPlugins || (window as any).prettier?.plugins || [];
        const formatted = prettier.format(editedFinalCode, {
          parser,
          plugins,
          semi: true,
          singleQuote: true,
        });
        setEditedFinalCode(formatted);
        return;
      } catch (e) {
        // fallback abaixo
      }
    }
    // Fallback simples
    const lines = editedFinalCode.replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/g, ''));
    setEditedFinalCode(lines.join('\n').trim() + '\n');
  };

  const monacoLanguage = useMemo(() => {
    const m = (finalLang || '').toLowerCase();
    if (m.includes('python') || m === 'py') return 'python';
    if (m.includes('typescript') || m === 'ts' || m === 'tsx') return 'typescript';
    if (m.includes('javascript') || m === 'js') return 'javascript';
    if (m.includes('java')) return 'java';
    if (m === 'c') return 'c';
    if (m.includes('cpp') || m.includes('cplusplus')) return 'cpp';
    if (m.includes('csharp') || m === 'cs') return 'csharp';
    if (m.includes('go')) return 'go';
    if (m.includes('rust')) return 'rust';
    if (m.includes('php')) return 'php';
    if (m.includes('kotlin')) return 'kotlin';
    return 'plaintext';
  }, [finalLang]);

  return (
    <div
      className={cn(
        // layout and common bubble styling
        "py-5 px-5 rounded-2xl mb-3 shadow-sm transition-all duration-200 border max-w-[85%]",
        // side alignment: AI left, User right
        isAi ? "mr-auto" : "ml-auto",
        // distinct background, border and text colors + asymmetric corners
        isAi
          ? "bg-[#0b1220] border-[#334155] text-[#e5e7eb] rounded-bl-none"
          : "bg-[#1d4ed8] border-[#1e40af] text-white rounded-br-none"
      )}
    >
      <div className="flex items-center mb-2">
        <div
          className={cn(
            "icon-container h-8 w-8 rounded-full flex items-center justify-center shadow-sm border transition-all duration-300 hover:scale-105",
            isAi
              ? "bg-[#1d4ed8] border-white/10 hover:bg-[#1e40af]"
              : "bg-white/15 border-white/20 hover:bg-white/20"
          )}
        >
          {isAi ? (
            <Bot className="icon-bot h-4 w-4 text-white animate-subtle-pulse hover:animate-gentle-float transition-all duration-300" />
          ) : (
            <User className="icon-user h-4 w-4 text-white transition-all duration-300 hover:scale-110" />
          )}
        </div>
        <span className={cn("ml-2 font-semibold text-sm", isAi ? "text-white" : "text-white")}>{isAi ? "Assistente IA" : "Você"}</span>
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
          <div className="markdown-content prose prose-invert max-w-none">
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
                      if (finalBlock && blockKey === finalBlock.blockKey) return null;
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
              {contentWithoutQuiz}
            </ReactMarkdown>
                );
              }
              return null;
            })()}

            {/* Fallback runner when no explanation content exists: show code blocks (non-diagram) */}
            {(!hasExplanationContent) && codeBlockCounter < 0 && fencedBlocks.length > 0 && !finalBlock && (
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

            {/* Final code view: only when no explanation content exists and we detected a final block */}
            {(!hasExplanationContent) && finalBlock && (
              <div className="rounded-lg overflow-hidden bg-[#0d1117] border border-[#30363d]">
                <div className="flex items-center justify-between bg-[#161b22] px-4 py-2.5 border-b border-[#30363d]">
                  <div className="text-sm text-[#7d8590] font-mono">{finalLang || 'javascript'}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={basicFormat}
                      className="opacity-90 transition-opacity duration-200 rounded px-3 py-1.5 text-[#7d8590] text-sm bg-[#21262d] hover:bg-[#30363d] hover:text-[#c9d1d9]"
                    >
                      Formatar
                    </button>
                    <button
                      type="button"
                      onClick={downloadFinalCode}
                      className="opacity-90 transition-opacity duration-200 rounded px-3 py-1.5 text-[#7d8590] text-sm bg-[#21262d] hover:bg-[#30363d] hover:text-[#c9d1d9]"
                    >
                      Baixar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const key = simpleHash(`${(finalLang || 'javascript').toLowerCase()}::${editedFinalCode}`);
                        runOnJudge0(finalLang || 'javascript', editedFinalCode, key, finalStdin);
                      }}
                      className="opacity-90 transition-opacity duration-200 rounded px-3 py-1.5 text-[#7d8590] text-sm flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] hover:text-[#c9d1d9]"
                    >
                      <Play size={14} /> Executar
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(editedFinalCode)}
                      className="opacity-90 hover:opacity-100 transition-opacity duration-200 bg-[#21262d] hover:bg-[#30363d] rounded px-3 py-1.5 text-[#7d8590] hover:text-[#c9d1d9] text-sm flex items-center gap-1.5"
                    >
                      {copiedCode === editedFinalCode ? (
                        <>
                          <CheckCheck size={14} className="text-[#3fb950]" />
                          <span className="text-[#3fb950]">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#30363d]"></div>
                <Editor
                  height="320px"
                  language={monacoLanguage}
                  theme="vs-dark"
                  value={editedFinalCode}
                  onChange={(val) => setEditedFinalCode(val ?? '')}
                  options={{
                    wordWrap: 'on',
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    tabSize: 2,
                  }}
                />
                <div className="px-4 py-2 border-t border-[#30363d] bg-[#0d1117]">
                  {/(input\s*\(|prompt\s*\()/i.test(editedFinalCode) && (
                    <div className="mb-2 text-xs text-[#9ca3af]">Este código solicita entradas. Preencha o campo abaixo com os valores de stdin (um por linha), por exemplo:<br/>18<br/>8.5</div>
                  )}
                  <label className="block text-xs text-[#9ca3af] mb-1">Entrada (stdin opcional)</label>
                  <textarea
                    value={finalStdin}
                    onChange={(e) => setFinalStdin(e.target.value)}
                    className="w-full bg-[#0b0f14] text-[#c9d1d9] p-2 font-mono text-xs outline-none min-h-[80px] border border-[#30363d] rounded"
                    placeholder="Valores para stdin..."
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-[#9ca3af]">Nome do arquivo:</label>
                    <input
                      value={downloadName}
                      onChange={(e) => setDownloadName(e.target.value)}
                      className="bg-[#0b0f14] text-[#c9d1d9] px-2 py-1 text-xs outline-none border border-[#30363d] rounded"
                      placeholder="solution"
                    />
                  </div>
                </div>
              </div>
            )}


          </div>
        ) : (
          <div className={cn("text-base whitespace-pre-wrap leading-relaxed", "text-white")}>{content}</div>
        )}
      </div>
    </div>
  );
};