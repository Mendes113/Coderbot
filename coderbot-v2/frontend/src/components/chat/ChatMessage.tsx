import { cn } from "@/lib/utils";
import { Bot, User, Copy, CheckCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";

type ChatMessageProps = {
  content: string;
  isAi: boolean;
  timestamp: Date;
};

export const ChatMessage = ({ content, isAi, timestamp }: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
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

  return (
    <div
      className={cn(
        "py-4 px-4 rounded-2xl mb-2 shadow-sm transition-all duration-200 border",
        isAi
          ? "bg-[hsl(var(--education-bot-bg))] border-[hsl(var(--education-purple-dark))] text-white"
          : "bg-[hsl(var(--education-user-bg))] border-[hsl(var(--education-user-dark))] text-gray-900"
      )}
    >
      <div className="flex items-center mb-2">
        <div
          className={cn(
            "icon-container h-8 w-8 rounded-full flex items-center justify-center shadow-md border-2 transition-all duration-300 hover:scale-110 hover:shadow-lg",
            isAi
              ? "bg-[hsl(var(--education-purple))] border-[hsl(var(--education-purple-dark))] hover:bg-[hsl(var(--education-purple-dark))] animate-soft-glow"
              : "bg-[hsl(var(--education-user))] border-[hsl(var(--education-user-dark))] hover:bg-[hsl(var(--education-user-dark))]"
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
                code({ node, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const code = String(children).replace(/\n$/, "");
                  const isInline = !match;
                  
                  if (!isInline) {
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
                              {match ? match[1] : 'code'}
                            </span>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(code)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#21262d] hover:bg-[#30363d] rounded px-3 py-1.5 text-[#7d8590] hover:text-[#c9d1d9] text-sm flex items-center gap-1.5"
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
                        <div className="overflow-x-auto">
                          <SyntaxHighlighter
                            language={match ? match[1] : 'text'}
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
                h4: ({ node, ...props }) => (
                  <h4 {...props} className="text-base font-semibold my-2 text-white" />
                ),
                h5: ({ node, ...props }) => (
                  <h5 {...props} className="text-sm font-semibold my-2 text-white" />
                ),
                h6: ({ node, ...props }) => (
                  <h6 {...props} className="text-sm font-semibold my-2 text-gray-300" />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote {...props} className="border-l-4 border-[#6366f1] pl-4 py-2 my-3 bg-[#1f2937]/30 rounded-r italic text-gray-300" />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table {...props} className="min-w-full border-collapse border border-gray-600 rounded-lg overflow-hidden" />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th {...props} className="border border-gray-600 px-3 py-2 bg-gray-800 text-white font-semibold text-left" />
                ),
                td: ({ node, ...props }) => (
                  <td {...props} className="border border-gray-600 px-3 py-2 text-white" />
                ),
                hr: ({ node, ...props }) => (
                  <hr {...props} className="my-4 border-gray-600" />
                ),
                strong: ({ node, ...props }) => (
                  <strong {...props} className="font-bold text-white" />
                ),
                em: ({ node, ...props }) => (
                  <em {...props} className="italic text-gray-300" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className={cn("text-base whitespace-pre-wrap leading-relaxed", "text-white")}>{content}</div>
        )}
      </div>
    </div>
  );
};