import { FC } from "react";
import { useCodeEditor } from "@/context/CodeEditorContext";
import { Badge } from "@/components/ui/badge";
import { Code2, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CodeEditor - Standalone editor page with purple educational theme
 * 
 * Features:
 * - Simple/Advanced modes based on user preferences
 * - Purple educational theme with gradients
 * - Loading states with modern animations
 * - Responsive and accessible
 */
const CodeEditor: FC = () => {
  const { 
    isLoadingPreferences, 
    isSimpleMode, 
    editorTheme 
  } = useCodeEditor();

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-background to-purple-50/20 dark:to-purple-950/10">
      {/* Header with purple gradient */}
      <div className="relative border-b bg-gradient-to-r from-purple-500/10 via-purple-400/5 to-transparent">
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
        
        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              
              <div>
                <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">
                  Editor de Código CoderBot
                </h1>
                <p className="text-xs text-muted-foreground">
                  Aprenda programação de forma interativa
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={cn(
                  "px-3 py-1.5 font-medium transition-all duration-200",
                  isSimpleMode 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800" 
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                )}
              >
                {isSimpleMode ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Modo Simples
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Modo Avançado
                  </>
                )}
              </Badge>
              
              <Badge variant="outline" className="px-3 py-1.5">
                {editorTheme === 'dark' ? '🌙' : '☀️'} {editorTheme === 'dark' ? 'Escuro' : 'Claro'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading state with modern animation */}
      <div className="flex items-center justify-center h-[calc(100%-5rem)] w-full">
        <div className="text-center space-y-4">
          {/* Animated purple gradient spinner */}
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-purple-500 border-r-purple-400 mx-auto" />
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-500/20 mx-auto" />
          </div>
          
          {/* Loading text */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {isLoadingPreferences ? 'Carregando preferências...' : 'Inicializando editor...'}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Preparando o ambiente de desenvolvimento para você
            </p>
          </div>
          
          {/* Decorative elements */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-500/50 animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
