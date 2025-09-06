import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Eye, 
  Edit3, 
  FileText, 
  Settings,
  Hash,
  Link2,
  Code2,
  Calculator
} from "lucide-react";
import MDEditor from '@uiw/react-md-editor';
import { MarkdownPreviewProps } from '@uiw/react-markdown-preview';
import remarkGfm from "remark-gfm";
import remarkWikiLink from "remark-wiki-link";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { useIsMobile } from "@/hooks/use-mobile";
import "katex/dist/katex.min.css";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

interface BlockNoteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  onSave?: () => void;
}

export default function BlockNoteEditor({
  initialContent,
  onChange,
  placeholder = `# Suas Anotações

Bem-vindo ao editor estilo **Obsidian**! 

## Recursos Disponíveis

### Links e Referências
- [[Link interno]] - Wikilinks como no Obsidian
- [Link externo](https://example.com)
- #tag #markdown #obsidian

### Formatação
- **Negrito** e *itálico*
- ==Destacado==
- ~~Riscado~~
- \`código inline\`

### Blocos de Código
\`\`\`javascript
function exemplo() {
  console.log("Syntax highlighting!");
}
\`\`\`

### Matemática (LaTeX)
- Inline: $E = mc^2$
- Bloco: $$\\sum_{i=1}^n x_i = x_1 + x_2 + \\cdots + x_n$$

### Listas e Tarefas
- [x] Tarefa concluída
- [ ] Tarefa pendente
- Lista normal
  - Sublista

### Tabelas
| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Dados    | Mais     | Dados    |

> Citação em bloco
> 
> Múltiplas linhas

---

Comece a escrever suas anotações aqui...`,
  readOnly = false,
  onSave,
}: BlockNoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [value, setValue] = useState<string>(initialContent || "");
  const [previewMode, setPreviewMode] = useState<'edit' | 'live' | 'preview'>('live');
  const isMobile = useIsMobile();

  useEffect(() => {
    setValue(initialContent || "");
  }, [initialContent]);

  const stats = useMemo(() => {
    const lines = value.split('\n').length;
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const chars = value.length;
    const wikiLinks = (value.match(/\[\[.*?\]\]/g) || []).length;
    const tags = (value.match(/#\w+/g) || []).length;
    return { lines, words, chars, wikiLinks, tags };
  }, [value]);

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (val?: string) => {
    const newValue = val || "";
    setValue(newValue);
    onChange?.(newValue);
  };

  // Custom markdown preview with Obsidian-like features
  const markdownPreviewProps: MarkdownPreviewProps = {
    remarkPlugins: [
      remarkGfm,
      remarkBreaks,
      remarkMath,
      [remarkWikiLink, {
        pageResolver: (name: string) => [name.replace(/ /g, '-').toLowerCase()],
        hrefTemplate: (permalink: string) => `#/note/${permalink}`,
        aliasDivider: '|'
      }]
    ],
    rehypePlugins: [
      rehypeHighlight,
      rehypeKatex
    ],
    wrapperElement: {
      "data-color-mode": "auto"
    }
  };

  return (
    <div className={`w-full`}>
      <Card className={`shadow-sm border-border/50`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Editor </CardTitle>
              <Badge variant="secondary" className="text-xs">
                Markdown
              </Badge>
              {stats.wikiLinks > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  {stats.wikiLinks}
                </Badge>
              )}
              {stats.tags > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {stats.tags}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Preview Mode Controls */}
              {!readOnly && (
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={previewMode === 'edit' ? 'default' : 'ghost'}
                    onClick={() => setPreviewMode('edit')}
                    className="h-7 px-2 text-xs"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'live' ? 'default' : 'ghost'}
                    onClick={() => setPreviewMode('live')}
                    className="h-7 px-2 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Split
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'preview' ? 'default' : 'ghost'}
                    onClick={() => setPreviewMode('preview')}
                    className="h-7 px-2 text-xs"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                </div>
              )}
              
              {!readOnly && onSave && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats Bar */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border text-sm">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {stats.lines} linhas
              </span>
              <span>{stats.words} palavras</span>
              <span>{stats.chars} caracteres</span>
              {stats.wikiLinks > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Link2 className="h-4 w-4" />
                  {stats.wikiLinks} links
                </span>
              )}
              {stats.tags > 0 && (
                <span className="flex items-center gap-1 text-purple-600">
                  <Hash className="h-4 w-4" />
                  {stats.tags} tags
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Code2 className="h-4 w-4" />
              <Calculator className="h-4 w-4" />
              <Settings className="h-4 w-4" />
            </div>
          </div>

          {/* Obsidian-style Editor */}
          <div className={`min-h-[500px]`}>
            <MDEditor
              value={value}
              onChange={handleChange}
              preview={readOnly ? 'preview' : previewMode}
              hideToolbar={false}
              visibleDragBar={true}
              textareaProps={{
                placeholder,
                style: {
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  minHeight: '500px'
                }
              }}
              previewOptions={markdownPreviewProps}
              data-color-mode="auto"
              height={500}
            />
          </div>

          {/* Quick Actions */}
          {!readOnly && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-lg border">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleChange(value + "\n\n[[Nova Nota]]")}
                className="text-xs"
              >
                <Link2 className="h-3 w-3 mr-1" />
                Adicionar Link
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleChange(value + " #nova-tag")}
                className="text-xs"
              >
                <Hash className="h-3 w-3 mr-1" />
                Adicionar Tag
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleChange(value + "\n\n```javascript\n// Seu código aqui\n```")}
                className="text-xs"
              >
                <Code2 className="h-3 w-3 mr-1" />
                Bloco de Código
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleChange(value + "\n\n$$\n\\sum_{i=1}^n x_i\n$$")}
                className="text-xs"
              >
                <Calculator className="h-3 w-3 mr-1" />
                Fórmula Matemática
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom CSS for Obsidian-like styling */}
      <style jsx global>{`
        .w-md-editor {
          background-color: transparent !important;
        }
        
        .w-md-editor-text-container .w-md-editor-text {
          font-size: 14px !important;
          line-height: 1.6 !important;
          color: hsl(var(--foreground)) !important;
          background-color: hsl(var(--background)) !important;
        }
        
        .w-md-editor-preview {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
        }
        
        /* Obsidian-like wikilink styling */
        .w-md-editor-preview a[href^="#/note/"] {
          color: hsl(var(--primary)) !important;
          text-decoration: none !important;
          background-color: hsl(var(--primary) / 0.1) !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          font-weight: 500 !important;
        }
        
        .w-md-editor-preview a[href^="#/note/"]:hover {
          background-color: hsl(var(--primary) / 0.2) !important;
        }
        
        /* Tag styling */
        .w-md-editor-preview p:has(> code:first-child) code[class*="language-"]:first-child {
          background-color: hsl(var(--secondary)) !important;
          color: hsl(var(--secondary-foreground)) !important;
          padding: 2px 6px !important;
          border-radius: 12px !important;
          font-size: 12px !important;
        }
        
        /* Math styling */
        .katex {
          font-size: 1.1em !important;
        }
        
        /* Code block styling */
        .w-md-editor-preview pre {
          background-color: hsl(var(--muted)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
        }
        
        /* Highlight styling */
        .w-md-editor-preview mark {
          background-color: hsl(var(--primary) / 0.3) !important;
          color: hsl(var(--foreground)) !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  );
}