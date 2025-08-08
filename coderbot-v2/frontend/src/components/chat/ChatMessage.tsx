import { cn } from "@/lib/utils";
import { Bot, User, Copy, CheckCheck, Play, TerminalSquare, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useMemo, useState } from "react";
import api from "@/lib/axios";

const JUDGE0_URL = ""; // force proxy path
const API_URL = (import.meta as any)?.env?.VITE_API_URL || "http://localhost:8000";

// Small stable hash for block keys
const simpleHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return `${h}`;
};

type ChatMessageProps = {
  content: string;
  isAi: boolean;
  timestamp: Date;
};

export const ChatMessage = ({ content, isAi, timestamp }: ChatMessageProps) => {
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
        question: string;
        options: { id?: string; text: string; correct?: boolean }[];
        explanation?: string;
      };
      const normalized = (data.options || []).slice(0, 3).map((opt, idx) => ({
        id: opt.id || ["A", "B", "C"][idx],
        text: opt.text,
        correct: Boolean(opt.correct),
      }));
      if (normalized.length === 3 && normalized.some(o => o.correct)) {
        return { question: data.question, options: normalized, explanation: data.explanation };
      }
      return null;
    } catch {
      return null;
    }
  }, [content]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
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

  const runOnJudge0 = async (language: string | undefined, source: string, blockKey: string) => {
    const langName = (language || 'javascript').toLowerCase();
    const langId = languageIdFrom(langName);

    console.log("=== EXECUTION DEBUG START ===");
    console.log("[Runner] Run requested", { language: langName, langId, blockKey, API_URL, sourceCodeLength: source.length });

    setExecStates(prev => ({ ...prev, [blockKey]: { status: 'running' } }));

    // Always backend proxy now
    try {
      const endpoint = `${API_URL}/judge/executar`;
      const payload = { language: langName, code: source } as { language: string; code: string };
      console.log("[Runner] Using backend proxy", { endpoint, payload });
      const res = await api.post(endpoint, payload, { validateStatus: () => true });
      console.log("[Runner] Response status:", res.status);
      if (!(res.status >= 200 && res.status < 300)) {
        const errMsg = `Backend ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`;
        setExecStates(prev => ({ ...prev, [blockKey]: { status: 'error', error: errMsg, meta: { path: 'BACKEND_PROXY', endpoint, status: res.status } } }));
        console.error('[Runner] HTTP Error Response:', res.data);
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
      console.log("[Runner] SUCCESS");
    } catch (e: any) {
      setExecStates(prev => ({ ...prev, [blockKey]: { status: 'error', error: e?.message || 'Falha ao executar código (proxy)', meta: { path: 'BACKEND_PROXY', endpoint: `${API_URL}/judge/executar`, status: 0 } } }));
      console.error('[Runner] CATCH Error:', e);
    }
    console.log("=== EXECUTION DEBUG END ===");
  };

  // Track index of code blocks while rendering (ignore quiz blocks)
  let codeBlockCounter = -1;

  // Remove the raw ```quiz block from markdown before rendering
  const contentWithoutQuiz = useMemo(() => content.replace(/```quiz[\s\S]*?```/gi, '').trim(), [content]);

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

  return (
    <div
      className={cn(
        "py-5 px-5 rounded-2xl mb-3 shadow-sm transition-all duration-200 border",
        isAi
          ? "bg-[hsl(var(--education-bot-bg))] border-white/10 text-white"
          : "bg-[hsl(var(--education-user-bg))] border-black/10 text-gray-900"
      )}
    >
      <div className="flex items-center mb-2">
        <div
          className={cn(
            "icon-container h-8 w-8 rounded-full flex items-center justify-center shadow-sm border transition-all duration-300 hover:scale-105",
            isAi
              ? "bg-[hsl(var(--education-purple))] border-white/10 hover:bg-[hsl(var(--education-purple-dark))]"
              : "bg-[hsl(var(--education-user))] border-black/10 hover:bg-[hsl(var(--education-user-dark))]"
          )}
        >
          {isAi ? (
            <Bot className="icon-bot h-4 w-4 text-white animate-subtle-pulse hover:animate-gentle-float transition-all duration-300" />
          ) : (
            <User className="icon-user h-4 w-4 text-gray-100 hover:text-white transition-all duration-300 hover:scale-110 animate-rotate-gently" />
          )}
        </div>
        <span className={cn("ml-2 font-semibold text-sm", isAi ? "text-white" : "text-gray-100")}>{isAi ? "Assistente IA" : "Você"}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="ml-10">
        {isAi ? (
          <div className="markdown-content prose prose-invert max-w-none">
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

                  if (!isInline) {
                    codeBlockCounter += 1;
                    const currentIndex = codeBlockCounter;
                    const effectiveLang = lang || 'javascript';
                    const judgeSupported = languageIdFrom(effectiveLang) !== null;
                    const blockKey = simpleHash(`${effectiveLang}::${code}`);
                    const running = execStates[blockKey]?.status === 'running';

                    return (
                      <div className="relative group my-4 rounded-lg overflow-hidden bg-[#0d1117] border border-[#30363d]">
                        <div className="flex items-center justify-between bg-[#161b22] px-4 py-2.5 border-b border-[#30363d]">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-[#ff605c]"></div>
                              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                              <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
                            </div>
                            <span className="text-sm text-[#7d8590] font-mono ml-2">
                              {effectiveLang}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {judgeSupported && (
                              <button
                                type="button"
                                onClick={() => runOnJudge0(effectiveLang, code, blockKey)}
                                className={"opacity-90 transition-opacity duration-200 rounded px-3 py-1.5 text-[#7d8590] text-sm flex items-center gap-1.5 " + (running ? " bg-[#30363d] cursor-not-allowed" : " bg-[#21262d] hover:bg-[#30363d] hover:text-[#c9d1d9]")}
                                aria-label="Executar código"
                                disabled={running}
                              >
                                                                                                                                                                                                      <Play size={14} />
                                                                                                                                                                                                      {running ? 'Executando...' : 'Executar'}
                                                                                                                                                                                                    </button>
                            )}
                            {!judgeSupported && (
                              <span className="text-xs text-[#7d8590]">Linguagem não suportada</span>
                            )}
                            <button 
                              onClick={() => copyToClipboard(code)}
                              className="opacity-90 hover:opacity-100 transition-opacity duration-200 bg-[#21262d] hover:bg-[#30363d] rounded px-3 py-1.5 text-[#7d8590] hover:text-[#c9d1d9] text-sm flex items-center gap-1.5"
                              aria-label="Copy code"
                            >
                              {copiedCode === code ? (
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
                        <div className="overflow-x-auto">
                          <SyntaxHighlighter
                            language={lang || 'javascript'}
                            style={oneDark}
                            customStyle={{ 
                              margin: 0,
                              borderRadius: 0,
                              background: '#0d1117',
                              fontSize: '14px',
                              lineHeight: '1.6',
                              padding: '20px'
                            }}
                            showLineNumbers={true}
                            lineNumberStyle={{
                              color: '#7d8590',
                              paddingRight: '1em',
                              userSelect: 'none'
                            }}
                            wrapLongLines={false}
                            {...props}
                          >
                            {code}
                          </SyntaxHighlighter>
                        </div>
                        <div className="border-t border-[#30363d] bg-[#0f1420] px-4 py-3 text-sm text-[#c9d1d9]">
                          <div className="flex items-center gap-2 mb-2">
                            <TerminalSquare size={16} />
                            <span className="text-[#7d8590]">Saída da execução</span>
                          </div>
                          {execStates[blockKey]?.status === 'running' && (
                            <div className="text-[#7d8590]">Executando...</div>
                          )}
                          {execStates[blockKey]?.status === 'done' && (
                            <>
                              {(() => {
                                const summary = buildSummary(effectiveLang, execStates[blockKey]?.data);
                                const open = Boolean(detailsOpen[blockKey]);
                                return (
                                  <div className="space-y-2">
                                    <div className={cn(
                                      "px-3 py-2 rounded-md text-sm flex items-start gap-2",
                                      summary.level === 'success' && 'bg-[#0c1a10] text-[#c9d1d9] border border-[#1f6f3e]',
                                      summary.level === 'info' && 'bg-[#0d1726] text-[#c9d1d9] border border-[#1f3b6f]',
                                      summary.level === 'warn' && 'bg-[#1b150c] text-[#c9d1d9] border border-[#6f531f]',
                                      summary.level === 'error' && 'bg-[#1a0c0c] text-[#c9d1d9] border border-[#6f1f1f]'
                                    )}>
                                      <div className="pt-0.5">
                                        {summary.level === 'success' ? <CheckCheck size={14} className="text-[#3fb950]"/> : summary.level === 'warn' ? <AlertTriangle size={14} className="text-[#f59e0b]"/> : summary.level === 'error' ? <AlertTriangle size={14} className="text-[#ef4444]"/> : <TerminalSquare size={14} className="text-[#60a5fa]"/>}
                                      </div>
                                      <div className="flex-1">
                                        {summary.text}
                                      </div>
                                      <button
                                        type="button"
                                        className="text-xs text-[#7d8590] hover:text-[#c9d1d9] underline ml-2"
                                        onClick={() => toggleDetails(blockKey)}
                                      >
                                        {open ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                                      </button>
                                    </div>

                                    {open && (
                                      <div className="space-y-2">
                                        <pre className="whitespace-pre-wrap text-[#c9d1d9]">{execStates[blockKey]?.output}</pre>
                                        {execStates[blockKey]?.meta && (
                                          <div className="mt-2 text-xs text-[#7d8590]">
                                            <div>Executado via: {execStates[blockKey]?.meta?.path}</div>
                                            <div>HTTP: {execStates[blockKey]?.meta?.status} • endpoint: {execStates[blockKey]?.meta?.endpoint}</div>
                                            {execStates[blockKey]?.meta?.token && (<div>token: {execStates[blockKey]?.meta?.token}</div>)}
                                            {execStates[blockKey]?.meta?.message && (<div>mensagem: {execStates[blockKey]?.meta?.message}</div>)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </>
                          )}
                          {execStates[blockKey]?.status === 'error' && (
                            <div className="text-red-400 flex flex-col gap-1">
                              <div className="flex items-center gap-2"><AlertTriangle size={14} /> {execStates[blockKey]?.error}</div>
                              {execStates[blockKey]?.meta && (
                                <div className="text-xs text-[#fca5a5]">
                                  <div>via: {execStates[blockKey]?.meta?.path} • endpoint: {execStates[blockKey]?.meta?.endpoint}</div>
                                </div>
                              )}
                            </div>
                          )}
                          {!execStates[blockKey] && (
                            <div className="text-[#7d8590]">Clique em Executar para ver a saída.</div>
                          )}
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

            {/* Fallback runner when markdown produced no code blocks */}
            {codeBlockCounter < 0 && fencedBlocks.length > 0 && (
              <div className="mt-4 space-y-4">
                {fencedBlocks.map(({ lang, code, blockKey }) => {
                  const judgeSupported = languageIdFrom(lang) !== null;
                  const running = execStates[blockKey]?.status === 'running';
                  return (
                    <div key={blockKey} className="relative group rounded-lg overflow-hidden bg-[#0d1117] border border-[#30363d]">
                      <div className="flex items-center justify-between bg-[#161b22] px-4 py-2.5 border-b border-[#30363d]">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#ff605c]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
                          </div>
                          <span className="text-sm text-[#7d8590] font-mono ml-2">{lang}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {judgeSupported ? (
                            <button
                              type="button"
                              onClick={() => runOnJudge0(lang, code, blockKey)}
                              className={"opacity-90 transition-opacity duration-200 rounded px-3 py-1.5 text-[#7d8590] text-sm flex items-center gap-1.5 " + (running ? " bg-[#30363d] cursor-not-allowed" : " bg-[#21262d] hover:bg-[#30363d] hover:text-[#c9d1d9]")}
                              aria-label="Executar código"
                              disabled={running}
                            >
                              <Play size={14} />
                              {running ? 'Executando...' : 'Executar'}
                            </button>
                          ) : (
                            <span className="text-xs text-[#7d8590]">Linguagem não suportada</span>
                          )}
                          <button 
                            onClick={() => copyToClipboard(code)}
                            className="opacity-90 hover:opacity-100 transition-opacity duration-200 bg-[#21262d] hover:bg-[#30363d] rounded px-3 py-1.5 text-[#7d8590] hover:text-[#c9d1d9] text-sm flex items-center gap-1.5"
                            aria-label="Copy code"
                          >
                            {copiedCode === code ? (
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
                      <div className="overflow-x-auto">
                        <SyntaxHighlighter
                          language={lang || 'javascript'}
                          style={oneDark}
                          customStyle={{ 
                            margin: 0,
                            borderRadius: 0,
                            background: '#0d1117',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            padding: '20px'
                          }}
                          showLineNumbers={true}
                          lineNumberStyle={{
                            color: '#7d8590',
                            paddingRight: '1em',
                            userSelect: 'none'
                          }}
                          wrapLongLines={false}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                      <div className="border-t border-[#30363d] bg-[#0f1420] px-4 py-3 text-sm text-[#c9d1d9]">
                        <div className="flex items-center gap-2 mb-2">
                          <TerminalSquare size={16} />
                          <span className="text-[#7d8590]">Saída da execução</span>
                        </div>
                        {execStates[blockKey]?.status === 'running' && (
                          <div className="text-[#7d8590]">Executando...</div>
                        )}
                        {execStates[blockKey]?.status === 'done' && (
                          <>
                            {(() => {
                              const summary = buildSummary(lang, execStates[blockKey]?.data);
                              const open = Boolean(detailsOpen[blockKey]);
                              return (
                                <div className="space-y-2">
                                  <div className={cn(
                                    "px-3 py-2 rounded-md text-sm flex items-start gap-2",
                                    summary.level === 'success' && 'bg-[#0c1a10] text-[#c9d1d9] border border-[#1f6f3e]',
                                    summary.level === 'info' && 'bg-[#0d1726] text-[#c9d1d9] border border-[#1f3b6f]',
                                    summary.level === 'warn' && 'bg-[#1b150c] text-[#c9d1d9] border border-[#6f531f]',
                                    summary.level === 'error' && 'bg-[#1a0c0c] text-[#c9d1d9] border border-[#6f1f1f]'
                                  )}>
                                    <div className="pt-0.5">
                                      {summary.level === 'success' ? <CheckCheck size={14} className="text-[#3fb950]"/> : summary.level === 'warn' ? <AlertTriangle size={14} className="text-[#f59e0b]"/> : summary.level === 'error' ? <AlertTriangle size={14} className="text-[#ef4444]"/> : <TerminalSquare size={14} className="text-[#60a5fa]"/>}
                                    </div>
                                    <div className="flex-1">
                                      {summary.text}
                                    </div>
                                    <button
                                      type="button"
                                      className="text-xs text-[#7d8590] hover:text-[#c9d1d9] underline ml-2"
                                      onClick={() => toggleDetails(blockKey)}
                                    >
                                      {open ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                                    </button>
                                  </div>

                                  {open && (
                                    <div className="space-y-2">
                                      <pre className="whitespace-pre-wrap text-[#c9d1d9]">{execStates[blockKey]?.output}</pre>
                                      {execStates[blockKey]?.meta && (
                                        <div className="mt-2 text-xs text-[#7d8590]">
                                          <div>Executado via: {execStates[blockKey]?.meta?.path}</div>
                                          <div>HTTP: {execStates[blockKey]?.meta?.status} • endpoint: {execStates[blockKey]?.meta?.endpoint}</div>
                                          {execStates[blockKey]?.meta?.token && (<div>token: {execStates[blockKey]?.meta?.token}</div>)}
                                          {execStates[blockKey]?.meta?.message && (<div>mensagem: {execStates[blockKey]?.meta?.message}</div>)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        )}
                        {execStates[blockKey]?.status === 'error' && (
                          <div className="text-red-400 flex flex-col gap-1">
                            <div className="flex items-center gap-2"><AlertTriangle size={14} /> {execStates[blockKey]?.error}</div>
                            {execStates[blockKey]?.meta && (
                              <div className="text-xs text-[#fca5a5]">
                                <div>via: {execStates[blockKey]?.meta?.path} • endpoint: {execStates[blockKey]?.meta?.endpoint}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {!execStates[blockKey] && (
                          <div className="text-[#7d8590]">Clique em Executar para ver a saída.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Render quiz options if present */}
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
                          setIsCorrect(Boolean(opt.correct));
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
                {selectedOption !== null && (
                  <div className={cn("mt-2 text-xs", isCorrect ? "text-green-400" : "text-red-400")}
                  >
                    {isCorrect ? "Resposta correta!" : "Resposta incorreta."}
                    {quizData.explanation ? (
                      <span className="block text-[#9ca3af] mt-1">{quizData.explanation}</span>
                    ) : null}
                  </div>
                )}
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