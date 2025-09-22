import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
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

const sanitizeText = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .trim();

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
  const editorRef = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [html, setHtml] = useState<string>(initialContent ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isContentEmpty = useMemo(() => sanitizeText(html).length === 0, [html]);
  const showPlaceholder = !readOnly && !isFocused && isContentEmpty;
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

  const handleInput = useCallback(() => {
    if (!editorRef.current) {
      return;
    }

    const nextValue = editorRef.current.innerHTML;
    setHtml(nextValue);
    onChange?.(nextValue);
    setLastSavedAt(null);
    setHasInteracted(true);
    scheduleSave();
  }, [onChange, scheduleSave]);

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
    (event: KeyboardEvent<HTMLDivElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleManualSave();
      }
    },
    [handleManualSave],
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const normalized = initialContent ?? "";

    if (editorRef.current && editorRef.current.innerHTML !== normalized) {
      editorRef.current.innerHTML = normalized;
    }

    if (normalized !== html) {
      setHtml(normalized);
      setLastSavedAt(null);
      setHasInteracted(false);
    }
  }, [initialContent, html]);

  const statusMessage = useMemo(() => {
    if (!canSave) {
      return null;
    }

    if (isSaving) {
      return "Salvando...";
    }

    if (hasInteracted && lastSavedAt === null) {
      return autoSave
        ? "Alterações pendentes..."
        : "Clique em Salvar para guardar suas alterações.";
    }

    if (lastSavedAt) {
      return `Salvo às ${lastSavedAt.toLocaleTimeString()}`;
    }

    return autoSave ? "Alterações são salvas automaticamente." : "Use o botão para salvar suas alterações.";
  }, [autoSave, canSave, hasInteracted, isSaving, lastSavedAt]);

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

      <div className="relative">
        <div
          ref={editorRef}
          role="textbox"
          aria-label="Editor de anotações"
          aria-multiline="true"
          tabIndex={readOnly ? -1 : 0}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          className={cn(
            "min-h-[400px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
            readOnly ? "cursor-default bg-muted/50" : "cursor-text hover:border-primary/40",
          )}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
        />
        {showPlaceholder && (
          <span className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground/70">
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
};

export default BlockNoteEditor;
