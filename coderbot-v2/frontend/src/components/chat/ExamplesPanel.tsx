import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Info, 
  Copy, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronRight,
  Lightbulb,
  Clock,
  Play,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import CodeEditor from './CodeEditor';
import { useExamples, type CodeExample } from '@/context/ExamplesContext';

interface ExamplesPanelProps {
  className?: string;
  onExampleSelect?: (example: CodeExample) => void;
  theme?: 'light' | 'dark';
  showExecutionInfo?: boolean;
}

// Função para formatar data e hora
const formatDateTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Se foi hoje
  if (diffDays === 0) {
    if (diffMinutes < 60) {
      return diffMinutes < 1 ? 'Agora mesmo' : `Há ${diffMinutes} min`;
    } else {
      return `Há ${diffHours}h`;
    }
  }
  
  // Se foi ontem
  if (diffDays === 1) {
    return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Se foi esta semana
  if (diffDays < 7) {
    return `${diffDays} dias atrás`;
  }
  
  // Data completa
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface ExamplesPanelProps {
  className?: string;
  onExampleSelect?: (example: CodeExample) => void;
  theme?: 'light' | 'dark';
  showExecutionInfo?: boolean;
}

const ExampleCard: React.FC<{
  example: CodeExample;
  onSelect?: (example: CodeExample) => void;
  theme?: 'light' | 'dark';
  showExecutionInfo?: boolean;
}> = ({ example, onSelect, theme = 'dark', showExecutionInfo = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(example.code);
    toast.success('Código copiado!');
  }, [example.code]);

  const handleToggleCode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCode(!showCode);
  }, [showCode]);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-lg cursor-pointer',
      'border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm',
      'hover:border-purple-300/50 dark:hover:border-purple-700/50',
      'hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20',
      'group relative overflow-hidden',
      example.type === 'correct' 
        ? 'border-l-4 border-l-emerald-500 hover:border-l-emerald-400' 
        : 'border-l-4 border-l-rose-500 hover:border-l-rose-400'
    )}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <CardHeader 
        className="pb-3 px-4 py-3 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all duration-200 relative z-10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-all duration-200",
              "group-hover:scale-110 group-hover:shadow-md",
              example.type === 'correct' 
                ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:text-emerald-300 group-hover:shadow-emerald-500/20' 
                : 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-700 dark:from-rose-900/30 dark:to-rose-800/20 dark:text-rose-300 group-hover:shadow-rose-500/20'
            )}>
              {example.type === 'correct' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-semibold leading-tight text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors duration-200">
                {example.title}
              </CardTitle>
              
              {/* Informações de execução */}
              {showExecutionInfo && example.lastExecuted && (
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn(
                    "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                    example.lastExecuted.status === 'success' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                  )}>
                    {example.lastExecuted.status === 'success' ? (
                      <Play className="w-2.5 h-2.5" />
                    ) : (
                      <AlertCircle className="w-2.5 h-2.5" />
                    )}
                    <span>
                      {example.lastExecuted.status === 'success' ? 'Executado' : 'Erro'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatDateTime(example.lastExecuted.timestamp)}</span>
                  </div>
                </div>
              )}
              
              {example.tags && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {example.tags.slice(0, 3).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs px-2 py-0.5 h-5 bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50 hover:bg-purple-200/80 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {example.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 font-medium border-purple-200 dark:border-purple-800">
                      +{example.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {example.difficulty && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs px-2 py-1 font-medium shadow-sm",
                  getDifficultyColor(example.difficulty)
                )}
              >
                {example.difficulty === 'beginner' ? 'Iniciante' : 
                 example.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
              </Badge>
            )}
            
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
              "bg-purple-50 dark:bg-purple-950/30 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 text-purple-600 dark:text-purple-400"
            )}>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-3 pb-3 relative z-10">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {example.explanation}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleCode}
                className="h-8 px-3 text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-200"
              >
                {showCode ? (
                  <>
                    <EyeOff className="w-3 h-3 mr-1.5" />
                    Ocultar Código
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1.5" />
                    Ver Código
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-3 text-xs font-medium hover:bg-secondary hover:text-secondary-foreground transition-all duration-200"
              >
                <Copy className="w-3 h-3 mr-1.5" />
                Copiar
              </Button>
              
              {onSelect && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(example);
                  }}
                  className="h-8 px-4 text-xs font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200"
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Usar Exemplo
                </Button>
              )}
            </div>

            {showCode && (
              <div className="mt-3 border border-purple-200/50 dark:border-purple-800/50 rounded-xl overflow-hidden shadow-sm bg-background">
                <div className="bg-gradient-to-r from-purple-100/80 to-purple-50/50 dark:from-purple-900/30 dark:to-purple-950/20 px-4 py-3 border-b border-purple-200/50 dark:border-purple-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300 ml-2 capitalize">
                        {example.language}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs px-2 py-1 font-mono bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                      {example.type === 'correct' ? '✓ Correto' : '✗ Incorreto'}
                    </Badge>
                  </div>
                </div>
                <ScrollArea className="max-h-64">
                  <div className="p-4 bg-slate-950 dark:bg-slate-900">
                    <pre className="text-sm leading-relaxed text-slate-100 font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      <code className="language-javascript">{example.code}</code>
                    </pre>
                  </div>
                </ScrollArea>
                {example.hints && example.hints.length > 0 && (
                  <div className="px-4 py-3 bg-purple-50/50 dark:bg-purple-950/20 border-t border-purple-200/50 dark:border-purple-800/50">
                    <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">💡 Dicas:</div>
                    <div className="space-y-1">
                      {example.hints.slice(0, 2).map((hint, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                            hint.type === 'error' ? 'bg-red-500' :
                            hint.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                          )}></div>
                          <span className="text-xs text-muted-foreground leading-relaxed">
                            Linha {hint.line}: {hint.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export const ExamplesPanel: React.FC<ExamplesPanelProps> = ({
  className,
  onExampleSelect,
  theme = 'dark',
  showExecutionInfo = false
}) => {
  const { 
    examples, 
    selectedType, 
    setSelectedType,
    searchQuery,
    setSearchQuery 
  } = useExamples();
  
  const [selectedTab, setSelectedTab] = useState(selectedType);

  // Sincronizar com o contexto
  React.useEffect(() => {
    setSelectedType(selectedTab);
  }, [selectedTab, setSelectedType]);

  const filteredExamples = examples.filter(example => {
    if (selectedTab === 'all') return true;
    return example.type === selectedTab;
  });

  const correctExamples = examples.filter(ex => ex.type === 'correct');
  const incorrectExamples = examples.filter(ex => ex.type === 'incorrect');

  const handleTabChange = (value: string) => {
    const tabValue = value as 'all' | 'correct' | 'incorrect';
    setSelectedTab(tabValue);
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <div className="px-4 py-4 border-b bg-gradient-to-r from-purple-50/50 via-purple-100/30 to-background dark:from-purple-950/30 dark:via-purple-900/20 dark:to-background">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base bg-gradient-to-r from-purple-700 to-purple-900 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">
              Exemplos de Código
            </h3>
            <p className="text-xs text-muted-foreground">
              Aprenda com exemplos práticos
              {showExecutionInfo && <span className="ml-1">• Com histórico de execução</span>}
            </p>
          </div>
        </div>
        
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/50">
            <TabsTrigger 
              value="all" 
              className="text-xs px-2 font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-50 data-[state=active]:to-purple-100 dark:data-[state=active]:from-purple-950/50 dark:data-[state=active]:to-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 data-[state=active]:shadow-sm"
            >
              Todos
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 h-5 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                {examples.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="correct" 
              className="text-xs px-2 font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-50 data-[state=active]:to-emerald-100 dark:data-[state=active]:from-emerald-950/50 dark:data-[state=active]:to-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-sm"
            >
              <CheckCircle className="w-3 h-3 mr-1.5 text-emerald-500" />
              Corretos
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                {correctExamples.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="incorrect" 
              className="text-xs px-2 font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-50 data-[state=active]:to-rose-100 dark:data-[state=active]:from-rose-950/50 dark:data-[state=active]:to-rose-900/30 data-[state=active]:text-rose-700 dark:data-[state=active]:text-rose-300 data-[state=active]:shadow-sm"
            >
              <XCircle className="w-3 h-3 mr-1.5 text-rose-500" />
              Incorretos
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 h-5 bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                {incorrectExamples.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {filteredExamples.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-950/20 flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-foreground">Nenhum exemplo encontrado</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Não há exemplos disponíveis para esta categoria no momento.
                </p>
              </div>
            </div>
          ) : (
            filteredExamples.map((example) => (
              <ExampleCard
                key={example.id}
                example={example}
                onSelect={onExampleSelect}
                theme={theme}
                showExecutionInfo={showExecutionInfo}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExamplesPanel;