import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Eye, 
  Edit3, 
  FileText, 
  Maximize2,
  Minimize2,
  Settings,
  Hash,
  Link2,
  Code2,
  Calculator
} from "lucide-react";
import MDEditor from '@uiw/react-md-editor';
import { MarkdownPreviewProps } from '@uiw/react-markdown-preview';
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkWikiLink from "remark-wiki-link";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useIsMobile();
  const previewRef = useRef<HTMLDivElement>(null);
  const titleForExport = 'nota-coderbot';

  const getResolvedBgColor = () => {
    try {
      if (typeof window === 'undefined') return '#ffffff';

      const rootStyles = getComputedStyle(document.documentElement);
      const cssVar = rootStyles.getPropertyValue('--background');
      const bgVar = cssVar && typeof cssVar === 'string' ? cssVar.trim() : '';

      if (bgVar && (bgVar.startsWith('hsl') || bgVar.startsWith('rgb') || bgVar.startsWith('#'))) {
        return bgVar;
      }

      const bodyStyles = getComputedStyle(document.body);
      const bodyBg = bodyStyles?.backgroundColor;
      return bodyBg && typeof bodyBg === 'string' ? bodyBg : '#ffffff';
    } catch (error) {
      console.warn('Error getting background color:', error);
      return '#ffffff';
    }
  };

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

  const downloadMarkdown = () => {
    const blob = new Blob([value], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titleForExport}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = async () => {
    try {
      const node = previewRef.current;
      if (!node) {
        console.error('PNG export failed: No preview node found');
        return;
      }

      const backgroundColor = getResolvedBgColor();
      if (!backgroundColor || typeof backgroundColor !== 'string') {
        console.error('PNG export failed: Invalid background color');
        return;
      }

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor,
        quality: 1.0,
        width: node.offsetWidth,
        height: node.offsetHeight
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${titleForExport}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('PNG export failed:', e);
      toast?.error?.('Erro ao exportar PNG. Tente novamente.');
    }
  };

  const downloadPdf = async () => {
    try {
      const node = previewRef.current;
      if (!node) {
        console.error('PDF export failed: No preview node found');
        return;
      }

      const backgroundColor = getResolvedBgColor();
      if (!backgroundColor || typeof backgroundColor !== 'string') {
        console.error('PDF export failed: Invalid background color');
        return;
      }

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor,
        quality: 1.0,
        width: node.offsetWidth,
        height: node.offsetHeight
      });

      const img = new Image();
      img.src = dataUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.decode?.().catch(reject);
      });

      const pdf = new jsPDF({ unit: 'px', format: 'a4', compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgAspectRatio = img.width / img.height;
      const pageAspectRatio = pageWidth / pageHeight;

      let imgWidth, imgHeight;
      if (imgAspectRatio > pageAspectRatio) {
        imgWidth = pageWidth - 40; // 20px margin on each side
        imgHeight = imgWidth / imgAspectRatio;
      } else {
        imgHeight = pageHeight - 40; // 20px margin on top/bottom
        imgWidth = imgHeight * imgAspectRatio;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = 20;

      pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`${titleForExport}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
      toast?.error?.('Erro ao exportar PDF. Tente novamente.');
    }
  };

  // Custom markdown preview with Obsidian-like features
  const colorMode: 'light' | 'dark' =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
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
      "data-color-mode": colorMode
    }
  };

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-[100] bg-background p-4 overflow-hidden' : ''}`}>
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
              
              {/* Export & Emoji */}
              {!readOnly && (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={downloadMarkdown}>
                    .md
                  </Button>
                  {/* <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={downloadImage}>
                    img
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={downloadPdf}>
                    pdf
                  </Button> */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">😊</Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[320px]">
                      <Picker data={data} onEmojiSelect={(e: any) => handleChange((value || '') + (e.native || ''))} theme="dark" />
                    </PopoverContent>
                  </Popover>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
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
          <div className={`${isFullscreen ? 'h-[calc(100vh-220px)]' : 'min-h-[500px]'} ${isFullscreen ? 'overflow-auto' : ''}`}>
            <MDEditor
              value={value}
              onChange={handleChange}
              preview={readOnly ? 'preview' : previewMode}
              hideToolbar={false}
              visibleDragbar={true}
              textareaProps={{
                placeholder,
                style: {
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  minHeight: isFullscreen ? 'calc(100vh - 220px)' : '500px'
                }
              }}
              previewOptions={{
                ...markdownPreviewProps,
                remarkPlugins: [
                  remarkGfm,
                  remarkBreaks,
                  remarkMath,
                  remarkEmoji,
                  [remarkWikiLink, {
                    pageResolver: (name: string) => [name.replace(/ /g, '-').toLowerCase()],
                    hrefTemplate: (permalink: string) => `#/note/${permalink}`,
                    aliasDivider: '|'
                  }]
                ],
              }}
              data-color-mode={colorMode}
              height={isFullscreen ? 'calc(100vh - 220px)' as any : 500}
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

      {/* Offscreen preview node for clean exports */}
      <div style={{ position: 'absolute', top: -99999, left: -99999, width: 0, height: 0, overflow: 'hidden' }}>
        <div ref={previewRef} className="p-6 max-w-[900px] bg-background text-foreground" style={{ backgroundColor: getResolvedBgColor(), color: 'hsl(var(--foreground))' }}>
          <MDEditor.Markdown source={value} {...markdownPreviewProps} />
        </div>
      </div>

      {/* Custom CSS for Obsidian-like styling */}
      <style>{`
        .w-md-editor {
          background-color: hsl(var(--background)) !important;
        }
        
        .w-md-editor-text-container .w-md-editor-text {
          font-size: 14px !important;
          line-height: 1.6 !important;
          color: hsl(var(--foreground)) !important;
          background-color: hsl(var(--background)) !important;
        }
        
        /* Garantir que todas as áreas internas não fiquem translúcidas */
        .w-md-editor-content,
        .w-md-editor-text,
        .w-md-editor-preview,
        .w-md-editor-toolbar,
        .w-md-editor-input,
        .w-md-editor-text-pre {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
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