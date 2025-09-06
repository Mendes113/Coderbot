// import { useEditor, EditorContent } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import Placeholder from "@tiptap/extension-placeholder";
// import CharacterCount from "@tiptap/extension-character-count";
// import TextAlign from "@tiptap/extension-text-align";
// import Link from "@tiptap/extension-link";
// import Image from "@tiptap/extension-image";
// import Highlight from "@tiptap/extension-highlight";
// import TaskList from "@tiptap/extension-task-list";
// import TaskItem from "@tiptap/extension-task-item";
// import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
// import { common, createLowlight } from "lowlight";
// import { useEffect, useState } from "react";
// import TurndownService from "turndown";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Bold,
//   Italic,
//   Strikethrough,
//   Code,
//   Heading1,
//   Heading2,
//   List,
//   ListOrdered,
//   Quote,
//   AlignLeft,
//   AlignCenter,
//   AlignRight,
//   Undo,
//   Redo,
//   Palette,
//   CheckSquare,
//   Sparkles,
//   Save,
//   Eye,
//   FileText,
//   Code2,
//   Hash,
// } from "lucide-react";

// interface BlockNoteEditorProps {
//   initialContent?: string;
//   onChange?: (content: string) => void;
//   placeholder?: string;
//   readOnly?: boolean;
//   onSave?: () => void;
//   autoSave?: boolean;
// }

// export function BlockNoteEditor({
//   initialContent,
//   onChange,
//   placeholder = "Comece a escrever suas anotações...",
//   readOnly = false,
//   onSave,
//   autoSave = true,
// }: BlockNoteEditorProps) {
//   const [isSaving, setIsSaving] = useState(false);
//   const [lastSaved, setLastSaved] = useState<Date | null>(null);
//   const [wordCount, setWordCount] = useState(0);
//   const [charCount, setCharCount] = useState(0);
//   const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
//   const [isPreviewMode, setIsPreviewMode] = useState(false);

//   const lowlight = createLowlight(common);

//   const downloadAsMarkdown = () => {
//     if (!editor) return;

//     const html = editor.getHTML();
//     const turndownService = new TurndownService({
//       headingStyle: 'atx',
//       codeBlockStyle: 'fenced',
//       bulletListMarker: '-',
//       strongDelimiter: '**',
//       emDelimiter: '*'
//     });

//     let markdown = turndownService.turndown(html);

//     const blob = new Blob([markdown], { type: 'text/markdown' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'notas.md';
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };



//   const editor = useEditor({
//     extensions: [
//       StarterKit.configure({
//         codeBlock: false, // Disable default code block to use CodeBlockLowlight
//       }),
//       CodeBlockLowlight.configure({
//         lowlight,
//       }),
//       Placeholder.configure({
//         placeholder,
//       }),
//       CharacterCount,
//       TextAlign.configure({
//         types: ["heading", "paragraph"],
//       }),
//       Link.configure({
//         openOnClick: false,
//         HTMLAttributes: {
//           class: "text-blue-600 hover:text-blue-800 underline",
//         },
//       }),
//       Image.configure({
//         inline: true,
//         allowBase64: true,
//         HTMLAttributes: {
//           class: "rounded-lg max-w-full h-auto",
//         },
//       }),
//       Highlight.configure({
//         multicolor: true,
//       }),
//       TaskList.configure({
//         HTMLAttributes: {
//           class: "my-4",
//         },
//       }),
//       TaskItem.configure({
//         nested: true,
//         HTMLAttributes: {
//           class: "flex items-center gap-2",
//         },
//       }),
//     ],
//     content: initialContent || "",
//     editable: !readOnly,
//     onUpdate: ({ editor }) => {
//       const html = editor.getHTML();
//       onChange?.(html);

//       // Update stats
//       setWordCount(editor.storage.characterCount.words());
//       setCharCount(editor.storage.characterCount.characters());

//       // Debounced auto-save
//       if (autoSave && !isSaving) {
//         debouncedAutoSave();
//       }
//     },
//   });

//   // Update content when initialContent changes
//   useEffect(() => {
//     if (initialContent && initialContent.trim() && editor) {
//       editor.commands.setContent(initialContent);
//     }
//   }, [editor, initialContent]);

//   // Update stats on mount
//   useEffect(() => {
//     if (editor) {
//       setWordCount(editor.storage.characterCount.words());
//       setCharCount(editor.storage.characterCount.characters());
//     }
//   }, [editor]);

//   // Cleanup debounce timer on unmount
//   useEffect(() => {
//     return () => {
//       if (debounceTimer) {
//         clearTimeout(debounceTimer);
//       }
//     };
//   }, [debounceTimer]);

//   const handleAutoSave = async () => {
//     if (!autoSave || !onSave) return;

//     setIsSaving(true);
//     try {
//       await onSave();
//       setLastSaved(new Date());
//     } catch (error) {
//       console.error("Auto-save failed:", error);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const debouncedAutoSave = () => {
//     // Clear existing timer
//     if (debounceTimer) {
//       clearTimeout(debounceTimer);
//     }

//     // Set new timer for 5 seconds
//     const timer = setTimeout(() => {
//       handleAutoSave();
//       setDebounceTimer(null); // Clear timer after execution
//     }, 5000);

//     setDebounceTimer(timer);
//   };

//   if (!editor) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="min-h-[400px] p-4 border rounded-lg bg-muted animate-pulse"
//       >
//         <div className="space-y-2">
//           <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
//           <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
//           <div className="h-4 bg-muted-foreground/20 rounded w-5/6"></div>
//         </div>
//       </motion.div>
//     );
//   }

//   const ToolbarButton = ({
//     onClick,
//     isActive = false,
//     children,
//     title,
//     shortcut,
//   }: {
//     onClick: () => void;
//     isActive?: boolean;
//     children: React.ReactNode;
//     title: string;
//     shortcut?: string;
//   }) => (
//     <TooltipProvider>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <Button
//             variant={isActive ? "default" : "ghost"}
//             size="sm"
//             onClick={onClick}
//             className={`transition-all duration-200 hover:scale-105 ${
//               isActive ? "shadow-md" : ""
//             }`}
//             type="button"
//           >
//             {children}
//           </Button>
//         </TooltipTrigger>
//         <TooltipContent>
//           <p>{title}</p>
//           {shortcut && <p className="text-xs opacity-70">{shortcut}</p>}
//         </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   );

//   return (
//     <TooltipProvider>
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//         className="w-full space-y-4"
//       >
//         {/* Header with status */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               <Sparkles className="h-5 w-5 text-primary" />
//               <h3 className="text-lg font-semibold">Editor Inteligente</h3>
//               <Badge variant="outline" className="text-xs">
//                 WYSIWYG
//               </Badge>
//             </div>

//             <AnimatePresence>
//               {isSaving && (
//                 <motion.div
//                   initial={{ opacity: 0, scale: 0.8 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   exit={{ opacity: 0, scale: 0.8 }}
//                   className="flex items-center gap-2"
//                 >
//                   <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
//                   <span className="text-sm text-muted-foreground">Salvando...</span>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {lastSaved && (
//               <Badge variant="secondary" className="text-xs">
//                 <Save className="h-3 w-3 mr-1" />
//                 Salvo {lastSaved.toLocaleTimeString()}
//               </Badge>
//             )}
//           </div>

//           <div className="flex items-center gap-4 text-xs text-muted-foreground">
//             <span>{charCount} caracteres</span>
//             <span>{wordCount} palavras</span>
//             <span>{Math.ceil(wordCount / 200)} min de leitura</span>
//           </div>
//         </div>

//         {/* Enhanced Toolbar */}
//         {!readOnly && (
//           <motion.div
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//             className="flex flex-wrap items-center gap-1 p-3 border rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm"
//           >
//             {/* Preview and Export Controls */}
//             {!isPreviewMode && (
//               <div className="flex items-center gap-1 mr-2">
//                 <ToolbarButton
//                   onClick={() => setIsPreviewMode(true)}
//                   title="Visualizar"
//                   shortcut="Ctrl+Shift+P"
//                 >
//                   <Eye className="h-4 w-4" />
//                 </ToolbarButton>

//                 <ToolbarButton
//                   onClick={downloadAsMarkdown}
//                   title="Exportar como Markdown"
//                   shortcut="Ctrl+Shift+E"
//                 >
//                   <FileText className="h-4 w-4" />
//                 </ToolbarButton>
//               </div>
//             )}

//             {/* Exit Preview Mode */}
//             {isPreviewMode && (
//               <div className="flex items-center gap-1 mr-2">
//                 <ToolbarButton
//                   onClick={() => setIsPreviewMode(false)}
//                   title="Voltar ao editor"
//                   shortcut="Ctrl+Shift+P"
//                 >
//                   <Eye className="h-4 w-4" />
//                 </ToolbarButton>

//                 <ToolbarButton
//                   onClick={downloadAsMarkdown}
//                   title="Exportar como Markdown"
//                   shortcut="Ctrl+Shift+E"
//                 >
//                   <FileText className="h-4 w-4" />
//                 </ToolbarButton>
//               </div>
//             )}

//             {!isPreviewMode && (
//               <>
//                 {/* Text Formatting */}
//                 <div className="flex items-center gap-1">
//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleBold().run()}
//                     isActive={editor.isActive("bold")}
//                     title="Negrito"
//                     shortcut="Ctrl+B"
//                   >
//                     <Bold className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleItalic().run()}
//                     isActive={editor.isActive("italic")}
//                     title="Itálico"
//                     shortcut="Ctrl+I"
//                   >
//                     <Italic className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleStrike().run()}
//                     isActive={editor.isActive("strike")}
//                     title="Riscado"
//                     shortcut="Ctrl+Shift+X"
//                   >
//                     <Strikethrough className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleCode().run()}
//                     isActive={editor.isActive("code")}
//                     title="Código inline"
//                     shortcut="Ctrl+E"
//                   >
//                     <Code className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleHighlight().run()}
//                     isActive={editor.isActive("highlight")}
//                     title="Destacar"
//                     shortcut="Ctrl+Shift+H"
//                   >
//                     <Palette className="h-4 w-4" />
//                   </ToolbarButton>
//                 </div>

//                 <Separator orientation="vertical" className="h-8 mx-2" />

//                 {/* Headings */}
//                 <div className="flex items-center gap-1">
//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
//                     isActive={editor.isActive("heading", { level: 1 })}
//                     title="Título Principal"
//                     shortcut="Ctrl+Alt+1"
//                   >
//                     <Heading1 className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
//                     isActive={editor.isActive("heading", { level: 2 })}
//                     title="Subtítulo"
//                     shortcut="Ctrl+Alt+2"
//                   >
//                     <Heading2 className="h-4 w-4" />
//                   </ToolbarButton>
//                 </div>

//                 <Separator orientation="vertical" className="h-8 mx-2" />

//                 {/* Lists and Tasks */}
//                 <div className="flex items-center gap-1">
//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleBulletList().run()}
//                     isActive={editor.isActive("bulletList")}
//                     title="Lista de marcadores"
//                     shortcut="Ctrl+Shift+8"
//                   >
//                     <List className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleOrderedList().run()}
//                     isActive={editor.isActive("orderedList")}
//                     title="Lista numerada"
//                     shortcut="Ctrl+Shift+7"
//                   >
//                     <ListOrdered className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleTaskList().run()}
//                     isActive={editor.isActive("taskList")}
//                     title="Lista de tarefas"
//                     shortcut="Ctrl+Shift+9"
//                   >
//                     <CheckSquare className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleBlockquote().run()}
//                     isActive={editor.isActive("blockquote")}
//                     title="Citação"
//                     shortcut="Ctrl+Shift+B"
//                   >
//                     <Quote className="h-4 w-4" />
//                   </ToolbarButton>
//                 </div>

//                 <Separator orientation="vertical" className="h-8 mx-2" />

//                 {/* Alignment */}
//                 <div className="flex items-center gap-1">
//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().setTextAlign("left").run()}
//                     isActive={editor.isActive({ textAlign: "left" })}
//                     title="Alinhar à esquerda"
//                   >
//                     <AlignLeft className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().setTextAlign("center").run()}
//                     isActive={editor.isActive({ textAlign: "center" })}
//                     title="Centralizar"
//                   >
//                     <AlignCenter className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().setTextAlign("right").run()}
//                     isActive={editor.isActive({ textAlign: "right" })}
//                     title="Alinhar à direita"
//                   >
//                     <AlignRight className="h-4 w-4" />
//                   </ToolbarButton>
//                 </div>

//                 <Separator orientation="vertical" className="h-8 mx-2" />

//                 {/* Code and Headings */}
//                 <div className="flex items-center gap-1">
//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleCodeBlock().run()}
//                     isActive={editor.isActive("codeBlock")}
//                     title="Bloco de código"
//                     shortcut="Ctrl+Alt+C"
//                   >
//                     <Code2 className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
//                     isActive={editor.isActive("heading", { level: 3 })}
//                     title="Subtítulo (H3)"
//                     shortcut="Ctrl+Alt+3"
//                   >
//                     <Hash className="h-4 w-4" />
//                   </ToolbarButton>
//                 </div>

//                 <Separator orientation="vertical" className="h-8 mx-2" />

//                 {/* Actions */}
//                 <div className="flex items-center gap-1">
//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().undo().run()}
//                     title="Desfazer"
//                     shortcut="Ctrl+Z"
//                   >
//                     <Undo className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={() => editor.chain().focus().redo().run()}
//                     title="Refazer"
//                     shortcut="Ctrl+Y"
//                   >
//                     <Redo className="h-4 w-4" />
//                   </ToolbarButton>

//                   <ToolbarButton
//                     onClick={downloadAsMarkdown}
//                     title="Exportar como Markdown"
//                     shortcut="Ctrl+Shift+M"
//                   >
//                     <FileText className="h-4 w-4" />
//                   </ToolbarButton>
//                 </div>
//               </>
//             )}
//           </motion.div>
//         )}

//         {/* Enhanced Editor */}
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//           className="relative"
//         >
//           {isPreviewMode ? (
//             <div className="min-h-[600px] p-8 border-2 rounded-xl bg-gradient-to-br from-background to-muted/20 shadow-lg">
//               <div
//                 className="min-h-[500px] p-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_strong]:font-semibold [&_em]:italic [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono"
//                 dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }}
//               />
//             </div>
//           ) : (
//             <div
//               className="min-h-[600px] p-8 border-2 border-dashed rounded-xl focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2 focus-within:border-primary/50 focus-within:border-solid hover:border-primary/30 transition-all duration-300 prose prose-sm max-w-none focus:outline-none bg-gradient-to-br from-background to-muted/20 shadow-lg cursor-text"
//               onClick={() => {
//                 if (editor && !readOnly) {
//                   editor.commands.focus();
//                 }
//               }}
//             >
//               <EditorContent
//                 editor={editor}
//                 className="focus:outline-none min-h-[500px] p-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_strong]:font-semibold [&_em]:italic [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono"
//               />
//             </div>
//           )}

//           {/* Floating save indicator */}
//           <AnimatePresence>
//             {lastSaved && (
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.8 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 exit={{ opacity: 0, scale: 0.8 }}
//                 className="absolute top-4 right-4"
//               >
//                 <Badge variant="secondary" className="shadow-md">
//                   <Save className="h-3 w-3 mr-1" />
//                   Auto-salvo
//                 </Badge>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </motion.div>

//         {/* Enhanced Status Bar */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
//         >
//           <div className="flex items-center gap-6">
//             <div className="flex items-center gap-2">
//               <div className="h-2 w-2 rounded-full bg-green-500" />
//               <span>Editor ativo</span>
//             </div>
//             <span>{charCount} caracteres • {wordCount} palavras</span>
//             <span>{Math.ceil(wordCount / 200)} min de leitura</span>
//           </div>

//           <div className="flex items-center gap-2">
//             {lastSaved && (
//               <span className="text-muted-foreground">
//                 Último salvamento: {lastSaved.toLocaleTimeString()}
//               </span>
//             )}
//             {!readOnly && onSave && (
//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={handleAutoSave}
//                 disabled={isSaving}
//                 className="flex items-center gap-2"
//               >
//                 {isSaving ? (
//                   <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
//                 ) : (
//                   <Save className="h-4 w-4" />
//                 )}
//                 {isSaving ? "Salvando..." : "Salvar"}
//               </Button>
//             )}
//           </div>
//         </motion.div>
//       </motion.div>
//     </TooltipProvider>
//   );
// }

export default BlockNoteEditor;
