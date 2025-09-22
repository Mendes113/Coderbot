import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bold,
  Code,
  Heading,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Save,
  Strikethrough,
  Table,
  TextQuote,
} from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import TurndownService from "turndown";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface BlockNoteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  onSave?: () => void | Promise<void>;
  autoSave?: boolean;
  autoSaveDelayMs?: number;
  className?: string;
}

const DEFAULT_AUTO_SAVE_DELAY = 2000;
const looksLikeHtml = (value: string) => /<[a-z][\s\S]*>/i.test(value);

type MarkdownAction =
  | "bold"
  | "italic"
  | "strike"
  | "heading"
  | "code"
  | "quote"
  | "link"
  | "image"
  | "unordered-list"
  | "ordered-list"
  | "task-list"
  | "table"
  | "hr";

const convertHtmlToMarkdown = (value: string, service: TurndownService | null) => {
  if (!value) {
    return "";
  }

  if (!looksLikeHtml(value) || !service) {
    return value;
  }

  try {
    return service.turndown(value);
  } catch (error) {
    console.warn("BlockNoteEditor: failed to convert HTML to Markdown", error);
    return value;
  }
};

const BlockNoteEditor = ({
  initialContent = "",
  onChange,
  placeholder = "Comece a escrever suas anotações...",
  readOnly = false,
  onSave,
  autoSave = true,
  autoSaveDelayMs = DEFAULT_AUTO_SAVE_DELAY,
  className,
}: BlockNoteEditorProps) => {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const turndownRef = useRef<TurndownService | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!turndownRef.current) {
    turndownRef.current = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
  }

  const [value, setValue] = useState<string>(() => convertHtmlToMarkdown(initialContent ?? "", turndownRef.current));
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">(() => (readOnly ? "preview" : "write"));

  const isContentEmpty = useMemo(() => (value ?? "").trim().length === 0, [value]);
  const canSave = Boolean(onSave) && !readOnly;

  const runSave = useCallback(async () => {
    if (!onSave) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave();
      setLastSavedAt(new Date());
      setHasInteracted(false);
    } catch (error) {
      console.error("BlockNoteEditor auto-save failed", error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const scheduleSave = useCallback(() => {
    if (!autoSave || !onSave) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      runSave().catch(() => undefined);
      saveTimeoutRef.current = null;
    }, autoSaveDelayMs);
  }, [autoSave, autoSaveDelayMs, onSave, runSave]);

  const commitValue = useCallback(
    (nextValue: string) => {
      setValue(nextValue);
      onChange?.(nextValue);
      setLastSavedAt(null);
      setHasInteracted(true);
      scheduleSave();
    },
    [onChange, scheduleSave],
  );

  const applyFormatting = useCallback(
    (action: MarkdownAction) => {
      const textarea = editorRef.current;
      if (!textarea || readOnly) {
        return;
      }

      const { selectionStart, selectionEnd, value: currentValue } = textarea;
      const selectedText = currentValue.slice(selectionStart, selectionEnd);
      const before = currentValue.slice(0, selectionStart);
      const after = currentValue.slice(selectionEnd);

      const ensureSelection = (start: number, end: number) => {
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start, end);
        });
      };

      const pushValue = (updated: string, selectionStartIndex: number, selectionEndIndex: number) => {
        setValue(updated);
        onChange?.(updated);
        setLastSavedAt(null);
        setHasInteracted(true);
        scheduleSave();
        ensureSelection(selectionStartIndex, selectionEndIndex);
      };

      const defaultPlaceholder = {
        bold: "texto em negrito",
        italic: "texto em itálico",
        strike: "texto riscado",
        heading: "Título",
        code: "seu código",
        link: "texto do link",
        image: "descrição da imagem",
      } as const;

      switch (action) {
        case "bold": {
          const insertion = selectedText || defaultPlaceholder.bold;
          const updated = `${before}**${insertion}**${after}`;
          const start = selectionStart + 2;
          const end = start + insertion.length;
          pushValue(updated, start, end);
          break;
        }
        case "italic": {
          const insertion = selectedText || defaultPlaceholder.italic;
          const updated = `${before}*${insertion}*${after}`;
          const start = selectionStart + 1;
          const end = start + insertion.length;
          pushValue(updated, start, end);
          break;
        }
        case "strike": {
          const insertion = selectedText || defaultPlaceholder.strike;
          const updated = `${before}~~${insertion}~~${after}`;
          const start = selectionStart + 2;
          const end = start + insertion.length;
          pushValue(updated, start, end);
          break;
        }
        case "heading": {
          const insertion = (selectedText || defaultPlaceholder.heading)
            .split("\n")
            .map(line => line.replace(/^#{1,6}\s*/, ""))
            .map(line => `# ${line || defaultPlaceholder.heading}`)
            .join("\n");
          const updated = `${before}${insertion}${after}`;
          const start = before.length;
          const end = start + insertion.length;
          pushValue(updated, start, end);
          break;
        }
        case "code": {
          if (selectedText.includes("\n")) {
            const insertion = selectedText || defaultPlaceholder.code;
            const block = `\n\n\`\`\`\n${insertion}\n\`\`\`\n`;
            const updated = `${before}${block}${after}`;
            const start = before.length + 4;
            const end = start + insertion.length;
            pushValue(updated, start, end);
          } else {
            const insertion = selectedText || defaultPlaceholder.code;
            const updated = `${before}\`${insertion}\`${after}`;
            const start = selectionStart + 1;
            const end = start + insertion.length;
            pushValue(updated, start, end);
          }
          break;
        }
        case "quote": {
          const insertion = (selectedText || "Texto destacado")
            .split("\n")
            .map(line => line.replace(/^>\s?/, ""))
            .map(line => `> ${line || "Texto destacado"}`)
            .join("\n");
          const updated = `${before}${insertion}${after}`;
          const start = before.length;
          const end = start + insertion.length;
          pushValue(updated, start, end);
          break;
        }
        case "link": {
          const label = selectedText || defaultPlaceholder.link;
          const urlPlaceholder = "https://";
          const insertion = `[${label}](${urlPlaceholder})`;
          const updated = `${before}${insertion}${after}`;
          const urlStart = before.length + label.length + 3;
          const urlEnd = urlStart + urlPlaceholder.length;
          pushValue(updated, urlStart, urlEnd);
          break;
        }
        case "image": {
          const altText = selectedText || defaultPlaceholder.image;
          const urlPlaceholder = "https://";
          const insertion = `![${altText}](${urlPlaceholder})`;
          const updated = `${before}${insertion}${after}`;
          const urlStart = before.length + altText.length + 4;
          const urlEnd = urlStart + urlPlaceholder.length;
          pushValue(updated, urlStart, urlEnd);
          break;
        }
        case "unordered-list": {
          const insertion = (selectedText || "Item da lista")
            .split("\n")
            .map(line => line.replace(/^[-*+]\s+/, ""))
            .map(line => `- ${line || "Item da lista"}`)
            .join("\n");
          const updated = `${before}${insertion}${after}`;
          const start = before.length;
          const end = start + insertion.length;
          pushValue(updated, start, end);
          break;
        }
        case "ordered-list": {
          const insertion = (selectedText || "Item numerado")
            .split("\n")
            .map(line => line.replace(/^\d+[.)]\s+/, ""))
            .map((line, index) => `${index + 1}. ${line || "Item numerado"}`)
            .join("\n");
          const updated = `${before}${insertion}${after}`;
          const start = before.length;
          const end = start + insertion.length;
          pushValue(updated, start, end);
          break;
        }
        case "task-list": {
          const insertion = (selectedText || "Tarefa pendente")
            .split("\n")
            .map(line => line.replace(/^[-*+]\s+\[[xX\s]\]\s+/, ""))
            .map(line => `- [ ] ${line || "Tarefa pendente"}`)
            .join("\n");
          const updated = `${before}${insertion}${after}`;
          const start = before.length;
          const end = start + insertion.length;
          pushValue(updated, start, end);
          break;
        }
        case "table": {
          const tableTemplate = "| Coluna A | Coluna B |\n| -------- | -------- |\n| Valor 1  | Valor 2  |\n";
          const updated = `${before}${tableTemplate}${after}`;
          const start = before.length;
          const end = start + tableTemplate.length;
          pushValue(updated, start, end);
          break;
        }
        case "hr": {
          const hrTemplate = `${before}\n\n---\n\n${after}`;
          const start = before.length + 2;
          const end = start + 3;
          pushValue(hrTemplate, start, end);
          break;
        }
        default:
          break;
      }
    },
    [onChange, readOnly, scheduleSave],
  );

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      if (readOnly) {
        return;
      }
      commitValue(event.target.value);
    },
    [commitValue, readOnly],
  );

  const handleManualSave = useCallback(() => {
    if (!onSave) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    runSave().catch(() => undefined);
  }, [onSave, runSave]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleManualSave();
        return;
      }

      if (readOnly) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        applyFormatting("bold");
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
        event.preventDefault();
        applyFormatting("italic");
      } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "x") {
        event.preventDefault();
        applyFormatting("strike");
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        applyFormatting("link");
      } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "7") {
        event.preventDefault();
        applyFormatting("ordered-list");
      } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "8") {
        event.preventDefault();
        applyFormatting("unordered-list");
      } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "9") {
        event.preventDefault();
        applyFormatting("task-list");
      }
    },
    [applyFormatting, handleManualSave, readOnly],
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const normalized = convertHtmlToMarkdown(initialContent ?? "", turndownRef.current);

    if (editorRef.current && editorRef.current.value !== normalized) {
      editorRef.current.value = normalized;
    }

    if (normalized !== value) {
      setValue(normalized);
      setLastSavedAt(null);
      setHasInteracted(false);
    }
  }, [initialContent, value]);

  useEffect(() => {
    setActiveTab(readOnly ? "preview" : "write");
  }, [readOnly]);

  const markdownComponents = useMemo<Components>(
    () => ({
      code({ inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const content = String(children).replace(/\n$/, "");

        if (!inline && match) {
          return (
            <SyntaxHighlighter
              {...props}
              language={match[1]}
              style={oneDark}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: "8px",
                fontSize: "14px",
                lineHeight: "1.6",
                padding: "16px",
              }}
              wrapLines
            >
              {content}
            </SyntaxHighlighter>
          );
        }

        return (
          <code
            className={cn(
              "rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground",
              className,
            )}
            {...props}
          >
            {children}
          </code>
        );
      },
      table({ className, ...props }) {
        return (
          <div className="overflow-x-auto">
            <table
              className={cn("w-full border border-border text-sm", className)}
              {...props}
            />
          </div>
        );
      },
      th({ className, ...props }) {
        return (
          <th
            className={cn("border border-border bg-muted px-3 py-2 text-left font-semibold", className)}
            {...props}
          />
        );
      },
      td({ className, ...props }) {
        return <td className={cn("border border-border px-3 py-2 align-top", className)} {...props} />;
      },
      a({ className, ...props }) {
        return (
          <a
            className={cn(
              "text-primary underline decoration-transparent underline-offset-4 transition hover:decoration-primary",
              className,
            )}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        );
      },
    }),
    [],
  );

  const statusMessage = useMemo(() => {
    if (!canSave) {
      return null;
    }

    if (isSaving) {
      return "Salvando...";
    }

    if (hasInteracted && lastSavedAt === null) {
      return autoSave ? "Alterações pendentes..." : "Clique em Salvar para guardar suas alterações.";
    }

    if (lastSavedAt) {
      return `Salvo às ${lastSavedAt.toLocaleTimeString()}`;
    }

    return autoSave ? "Alterações são salvas automaticamente." : "Use o botão para salvar suas alterações.";
  }, [autoSave, canSave, hasInteracted, isSaving, lastSavedAt]);

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
      <ToolbarButton
        icon={<Bold className="h-4 w-4" />}
        label="Negrito (Ctrl+B)"
        onClick={() => applyFormatting("bold")}
        disabled={readOnly}
      />
      <ToolbarButton
        icon={<Italic className="h-4 w-4" />}
        label="Itálico (Ctrl+I)"
        onClick={() => applyFormatting("italic")}
        disabled={readOnly}
      />
      <ToolbarButton
        icon={<Strikethrough className="h-4 w-4" />}
        label="Tachado (Ctrl+Shift+X)"
        onClick={() => applyFormatting("strike")}
        disabled={readOnly}
      />
      <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
      <ToolbarButton
        icon={<Heading className="h-4 w-4" />}
        label="Título"
        onClick={() => applyFormatting("heading")}
        disabled={readOnly}
      />
      <ToolbarButton
        icon={<TextQuote className="h-4 w-4" />}
        label="Bloco de citação"
        onClick={() => applyFormatting("quote")}
        disabled={readOnly}
      />
      <ToolbarButton
        icon={<Code className="h-4 w-4" />}
        label="Código"
        onClick={() => applyFormatting("code")}
        disabled={readOnly}
      />
      <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
      <ToolbarButton
        icon={<LinkIcon className="h-4 w-4" />}
        label="Link (Ctrl+K)"
        onClick={() => applyFormatting("link")}
        disabled={readOnly}
      />
      <ToolbarButton
        icon={<ImageIcon className="h-4 w-4" />}
        label="Imagem"
        onClick={() => applyFormatting("image")}
        disabled={readOnly}
      />
      <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
      <ToolbarButton
        icon={<List className="h-4 w-4" />}
        label="Lista não ordenada (Ctrl+Shift+8)"
        onClick={() => applyFormatting("unordered-list")}
        disabled={readOnly}
      />
      <ToolbarButton
        icon={<ListOrdered className="h-4 w-4" />}
        label="Lista ordenada (Ctrl+Shift+7)"
        onClick={() => applyFormatting("ordered-list")}
        disabled={readOnly}
      />
      <ToolbarButton
        icon={<ListTodo className="h-4 w-4" />}
        label="Lista de tarefas (Ctrl+Shift+9)"
        onClick={() => applyFormatting("task-list")}
        disabled={readOnly}
      />
      <ToolbarButton
        icon={<Table className="h-4 w-4" />}
        label="Tabela"
        onClick={() => applyFormatting("table")}
        disabled={readOnly}
      />
      <ToolbarButton
        icon={<Minus className="h-4 w-4" />}
        label="Linha horizontal"
        onClick={() => applyFormatting("hr")}
        disabled={readOnly}
      />
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {canSave && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{statusMessage}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSave}
            disabled={isSaving}
            type="button"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      )}

      {readOnly ? (
        <div className="rounded-lg border border-input bg-background px-4 py-3 text-sm">
          {isContentEmpty ? (
            <p className="text-muted-foreground">Nenhum conteúdo disponível.</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm dark:prose-invert max-w-none"
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {value}
            </ReactMarkdown>
          )}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={tab => setActiveTab(tab as "write" | "preview")}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-9">
              <TabsTrigger value="write">Escrever</TabsTrigger>
              <TabsTrigger value="preview">Pré-visualizar</TabsTrigger>
            </TabsList>
            {activeTab === "write" && toolbar}
          </div>
          <TabsContent value="write">
            <textarea
              ref={editorRef}
              value={value}
              onChange={handleInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              spellCheck
              className={cn(
                "min-h-[400px] w-full resize-y rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm leading-relaxed text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                isFocused ? "ring-2 ring-primary/40" : "",
              )}
            />
          </TabsContent>
          <TabsContent value="preview">
            <div className="min-h-[400px] rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm">
              {isContentEmpty ? (
                <p className="text-muted-foreground">
                  Nada para pré-visualizar ainda. Escreva no editor para ver o resultado em Markdown.
                </p>
              ) : (
                <ReactMarkdown
                  className="prose prose-sm dark:prose-invert max-w-none"
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={markdownComponents}
                >
                  {value}
                </ReactMarkdown>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

interface ToolbarButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const ToolbarButton = ({ icon, label, onClick, disabled }: ToolbarButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    className="h-8 w-8"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
  >
    {icon}
  </Button>
);

export default BlockNoteEditor;
