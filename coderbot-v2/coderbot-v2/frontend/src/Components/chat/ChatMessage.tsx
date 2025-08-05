import { cn } from "@/lib/utils";
import { Bot, User, Copy, CheckCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { XMLRenderer } from "./XMLRenderer";

type ChatMessageProps = {
  content: string;
  isAi: boolean;
  timestamp: Date;
};

// Função para detectar se o conteúdo é XML estruturado do AGNO
const isXMLContent = (content: string): boolean => {
  const xmlPatterns = [
    /<WorkedExampleTemplate/,
    /<socratic_response>/,
    /<GeneralData>/,
    /<ExampleContext>/,
    /<WorkedExamples>/
  ];
  
  return xmlPatterns.some(pattern => pattern.test(content));
};

export const ChatMessage = ({ content, isAi, timestamp }: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const shouldRenderXML = isAi && isXMLContent(content);

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
          shouldRenderXML ? (
            <div className="xml-content">
              <XMLRenderer xmlContent={content} />
            </div>
          ) : (
            <div className="markdown-content prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                code({ node, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const code = String(children).replace(/\n$/, "");
                  const isInline = (props as any)?.inline !== false;
                  
                  if (!isInline && match) {
                    return (
                      <div className="relative group my-4 rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
                        <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
                          <span className="text-sm text-gray-300 font-mono">{match[1]}</span>
                          <button 
                            onClick={() => copyToClipboard(code)}
                            className="bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-1"
                            aria-label="Copy code"
                          >
                            {copiedCode === code ? (
                              <>
                                <CheckCheck size={14} className="text-green-400" />
                                <span className="text-green-400">Copiado!</span>
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
                            language={match[1]}
                            style={vscDarkPlus}
                            customStyle={{ 
                              margin: 0,
                              borderRadius: 0,
                              background: 'transparent',
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}
                            showLineNumbers
                            wrapLongLines
                            {...props}
                          >
                            {code}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    );
                  }
                  
                  return isInline ? (
                    <code className="bg-gray-800 text-gray-100 px-2 py-1 rounded text-sm font-mono border border-gray-700" {...props}>
                      {children}
                    </code>
                  ) : (
                    <div className="relative group my-4 rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
                      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
                        <span className="text-sm text-gray-300 font-mono">text</span>
                        <button 
                          onClick={() => copyToClipboard(code)}
                          className="bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-1"
                          aria-label="Copy code"
                        >
                          {copiedCode === code ? (
                            <>
                              <CheckCheck size={14} className="text-green-400" />
                              <span className="text-green-400">Copiado!</span>
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
                          language="text"
                          style={vscDarkPlus}
                          customStyle={{ 
                            margin: 0,
                            borderRadius: 0,
                            background: 'transparent',
                            fontSize: '14px',
                            lineHeight: '1.5'
                          }}
                          wrapLongLines
                          {...props}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    </div>
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
                  <ul {...props} className="list-disc list-inside my-3 space-y-1 text-white" />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="list-decimal list-inside my-3 space-y-1 text-white" />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} className="my-1 text-white" />
                ),
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="text-2xl font-bold my-4 text-white border-b border-gray-600 pb-2" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-xl font-bold my-3 text-white" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="text-lg font-bold my-2 text-white" />
                ),
                h4: ({ node, ...props }) => (
                  <h4 {...props} className="text-base font-bold my-2 text-white" />
                ),
                h5: ({ node, ...props }) => (
                  <h5 {...props} className="text-sm font-bold my-2 text-white" />
                ),
                h6: ({ node, ...props }) => (
                  <h6 {...props} className="text-sm font-bold my-2 text-gray-300" />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote {...props} className="border-l-4 border-purple-400 pl-4 py-2 my-3 bg-gray-800/50 rounded-r italic text-gray-300" />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table {...props} className="min-w-full border-collapse border border-gray-600" />
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
          )
        ) : (
          <div className={cn("text-base whitespace-pre-wrap leading-relaxed", "text-white")}>{content}</div>
        )}
      </div>
    </div>
  );
};
