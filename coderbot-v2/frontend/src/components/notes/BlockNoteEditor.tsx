import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Save } from "lucide-react"

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BlockNoteEditorProps {
  initialContent?: string
  onChange?: (content: string) => void
  placeholder?: string
  readOnly?: boolean
  onSave?: () => void | Promise<void>
  autoSave?: boolean
  autoSaveDelayMs?: number
  className?: string
}

const DEFAULT_AUTO_SAVE_DELAY = 2000

const sanitizeHtml = (value: string) =>
  value
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim()

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
  const [value, setValue] = useState(initialContent ?? "")
  const [isFocused, setIsFocused] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canSave = Boolean(onSave) && !readOnly

  const runSave = useCallback(async () => {
    if (!onSave) {
      return
    }

    setIsSaving(true)
    try {
      await onSave()
      setLastSavedAt(new Date())
      setHasInteracted(false)
    } catch (error) {
      console.error("BlockNoteEditor auto-save failed", error)
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  const scheduleSave = useCallback(() => {
    if (!autoSave || !onSave || readOnly) {
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      runSave().catch(() => undefined)
      saveTimeoutRef.current = null
    }, autoSaveDelayMs)
  }, [autoSave, autoSaveDelayMs, onSave, readOnly, runSave])

  const handleEditorChange = useCallback(
    (nextValue: string) => {
      setValue(nextValue)
      onChange?.(nextValue)

      if (readOnly) {
        return
      }

      setLastSavedAt(null)
      setHasInteracted(true)
      scheduleSave()
    },
    [onChange, readOnly, scheduleSave],
  )

  const handleManualSave = useCallback(() => {
    if (!onSave) {
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    runSave().catch(() => undefined)
  }, [onSave, runSave])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const initialContentRef = useRef(initialContent)

  useEffect(() => {
    if (initialContentRef.current === initialContent) {
      return
    }

    initialContentRef.current = initialContent
    setValue(initialContent ?? "")
    setLastSavedAt(null)
    setHasInteracted(false)
  }, [initialContent])

  const isContentEmpty = useMemo(() => sanitizeHtml(value).length === 0, [value])

  const statusMessage = useMemo(() => {
    if (!canSave) {
      return null
    }

    if (isSaving) {
      return "Salvando..."
    }

    if (hasInteracted && lastSavedAt === null) {
      return autoSave
        ? "Alterações pendentes..."
        : "Clique em Salvar para guardar suas alterações."
    }

    if (lastSavedAt) {
      return `Salvo às ${lastSavedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    }

    return autoSave
      ? "Alterações são salvas automaticamente."
      : "Use o botão para salvar suas alterações."
  }, [autoSave, canSave, hasInteracted, isSaving, lastSavedAt])

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {canSave && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
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

      <SimpleEditor
        value={value}
        onChange={handleEditorChange}
        readOnly={readOnly}
        placeholder={placeholder}
        onFocusChange={setIsFocused}
      />

      {!readOnly && !hasInteracted && !isFocused && isContentEmpty ? (
        <p className="text-xs text-muted-foreground">
          Dica: use "/" para inserir listas, títulos e outros blocos rapidamente.
        </p>
      ) : null}
    </div>
  )
}

export default BlockNoteEditor
