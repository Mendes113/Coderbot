import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Settings, 
  Terminal,
  FileText,
  Folder,
  Plus,
  Code,
  MessageSquare,
  Sparkles,
  X,
  Search,
  Clock,
  Shield,
  Trash2Icon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import CodeEditor from '@/components/chat/CodeEditor';
import ExamplesPanel from '@/components/chat/ExamplesPanel';
import { useExamples, type CodeExample } from '@/context/ExamplesContext';

// Função utilitária para execução segura de JavaScript
const executeJavaScriptSafely = (code: string, timeoutMs: number = 5000) => {
  return new Promise((resolve, reject) => {
    const logs: string[] = [];
    const errors: string[] = [];
    let result: any;
    let executionError: any = null;
    
    // Backup do console original
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    
    // Mock console para capturar outputs
    const mockConsole = {
      log: (...args: any[]) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      },
      error: (...args: any[]) => {
        errors.push('ERROR: ' + args.map(arg => String(arg)).join(' '));
      },
      warn: (...args: any[]) => {
        logs.push('WARN: ' + args.map(arg => String(arg)).join(' '));
      },
      info: (...args: any[]) => {
        logs.push('INFO: ' + args.map(arg => String(arg)).join(' '));
      }
    };
    
    // Timeout para evitar loops infinitos
    const timeout = setTimeout(() => {
      // Restaurar console
      Object.assign(console, originalConsole);
      reject(new Error(`Execução cancelada: timeout de ${timeoutMs}ms excedido (possível loop infinito)`));
    }, timeoutMs);
    
    try {
      // Substituir console
      Object.assign(console, mockConsole);
      
      // Criar contexto seguro
      const safeGlobals = {
        console: mockConsole,
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        setTimeout: () => { throw new Error('setTimeout não é permitido neste ambiente'); },
        setInterval: () => { throw new Error('setInterval não é permitido neste ambiente'); },
        fetch: () => { throw new Error('fetch não é permitido neste ambiente'); },
        XMLHttpRequest: () => { throw new Error('XMLHttpRequest não é permitido neste ambiente'); }
      };
      
      // Wrapper para execução isolada
      const wrappedCode = `
        (function(${Object.keys(safeGlobals).join(', ')}) {
          "use strict";
          ${code}
        })(${Object.keys(safeGlobals).map(key => `safeGlobals.${key}`).join(', ')});
      `;
      
      result = eval(wrappedCode);
      
    } catch (error) {
      executionError = error;
    } finally {
      clearTimeout(timeout);
      // Restaurar console original
      Object.assign(console, originalConsole);
    }
    
    resolve({
      result,
      logs,
      errors,
      executionError
    });
  });
};

// Templates iniciais para diferentes linguagens
const LANGUAGE_TEMPLATES = {
  javascript: `// Bem-vindo ao Editor de Código JavaScript
// Execute diretamente no navegador com sandbox de segurança!

console.log("🚀 Hello, World!");

// Exemplo de função
function saudacao(nome) {
  return \`Olá, \${nome}! 👋\`;
}

console.log(saudacao("Desenvolvedor"));

// Exemplo com arrays e objetos
const numeros = [1, 2, 3, 4, 5];
const pares = numeros.filter(n => n % 2 === 0);
console.log("Números pares:", pares);

// Exemplo com objetos
const pessoa = {
  nome: "João",
  idade: 25,
  cidade: "São Paulo"
};

console.log("Pessoa:", pessoa);
console.log(\`\${pessoa.nome} tem \${pessoa.idade} anos\`);`,
  
  python: `# Bem-vindo ao Editor de Código Python
print("Hello, World!")

# Exemplo de função
def saudacao(nome):
    return f"Olá, {nome}!"

print(saudacao("Desenvolvedor"))`,
  
  html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minha Página</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Bem-vindo ao editor de código!</p>
</body>
</html>`,
  
  css: `/* Bem-vindo ao Editor de CSS */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}`
};

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extension: 'js' },
  { id: 'python', name: 'Python', extension: 'py' },
  { id: 'html', name: 'HTML', extension: 'html' },
  { id: 'css', name: 'CSS', extension: 'css' },
  { id: 'typescript', name: 'TypeScript', extension: 'ts' },
  { id: 'json', name: 'JSON', extension: 'json' }
];

interface CodeEditorPageProps {
  className?: string;
}

export const CodeEditorPage: React.FC<CodeEditorPageProps> = ({ className }) => {
  const { 
    markAsExecuted, 
    examples,
    searchQuery, 
    setSearchQuery, 
    selectedLanguage, 
    setSelectedLanguage
  } = useExamples();

  // Computed properties para filtragem
  const availableLanguages = useMemo(() => {
    const uniqueLanguages = new Set(examples.map(example => example.language));
    return Array.from(uniqueLanguages);
  }, [examples]);

  const filteredExamples = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return examples.filter(example => {
      const matchesLanguage = selectedLanguage === 'all' || example.language === selectedLanguage;
      if (!matchesLanguage) return false;

      if (!query) return true;

      const matchesTitle = example.title.toLowerCase().includes(query);
      const matchesLanguageName = example.language.toLowerCase().includes(query);
      const matchesTags = example.tags?.some(tag => tag.toLowerCase().includes(query));

      return matchesTitle || matchesLanguageName || matchesTags;
    });
  }, [examples, selectedLanguage, searchQuery]);
  const [currentCode, setCurrentCode] = useState(LANGUAGE_TEMPLATES.javascript);
  const [currentLanguage, setCurrentLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [showOutput, setShowOutput] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [fileName, setFileName] = useState('untitled');
  const [currentExampleId, setCurrentExampleId] = useState<string | null>(null);

  const handleLanguageChange = useCallback((language: string) => {
    setCurrentLanguage(language);
    const template = LANGUAGE_TEMPLATES[language as keyof typeof LANGUAGE_TEMPLATES];
    if (template) {
      setCurrentCode(template);
      setCurrentExampleId(null); // Reset example tracking
    }
    
    // Atualizar nome do arquivo
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.id === language);
    if (langConfig) {
      setFileName(`untitled.${langConfig.extension}`);
    }
  }, []);

  const handleCodeChange = useCallback((code: string) => {
    setCurrentCode(code);
  }, []);

  const handleRunCode = useCallback(async (code: string) => {
    setIsRunning(true);
    setShowOutput(true);
    
    const startTime = Date.now();
    
    try {
      if (currentLanguage === 'javascript') {
        const executionResult = await executeJavaScriptSafely(code, 5000) as any;
        const executionTime = Date.now() - startTime;
        
        // Montar saída formatada
        let output = '';
        
        if (executionResult.logs.length > 0) {
          output += '🖥️ === Console Output ===\n' + executionResult.logs.join('\n') + '\n\n';
        }
        
        if (executionResult.errors.length > 0) {
          output += '❌ === Console Errors ===\n' + executionResult.errors.join('\n') + '\n\n';
        }
        
        if (executionResult.executionError) {
          output += `🚨 === Execution Error ===\n${executionResult.executionError.name}: ${executionResult.executionError.message}`;
          if (executionResult.executionError.stack) {
            // Limpar stack trace para mostrar apenas linhas relevantes
            const stack = executionResult.executionError.stack
              .split('\n')
              .filter(line => !line.includes('eval') && !line.includes('executeJavaScriptSafely'))
              .slice(0, 3)
              .join('\n');
            if (stack.trim()) {
              output += `\n\n📍 Stack Trace:\n${stack}`;
            }
          }
        } else {
          if (executionResult.result !== undefined) {
            const resultStr = typeof executionResult.result === 'object' 
              ? JSON.stringify(executionResult.result, null, 2) 
              : String(executionResult.result);
            output += `✅ === Return Value ===\n${resultStr}`;
          }
          
          if (executionResult.logs.length === 0 && executionResult.result === undefined) {
            output += '✅ === Execution Completed ===\nCódigo executado com sucesso! (Sem saída)';
          }
        }
        
        setOutput(output || '✅ Código executado com sucesso!');
        
        // Marcar exemplo como executado se estivermos executando um exemplo
        if (currentExampleId) {
          markAsExecuted(
            currentExampleId, 
            executionResult.executionError ? 'error' : 'success',
            output,
            executionTime
          );
        }
        
        if (executionResult.executionError) {
          toast.error('Erro durante execução');
        } else {
          toast.success('JavaScript executado no navegador!');
        }
      } else {
        // Para outras linguagens, manter simulação
        setOutput(`📝 Código ${currentLanguage} processado!\n\n⚠️ Nota: Execução real disponível apenas para JavaScript.\nPara outras linguagens, use um ambiente de desenvolvimento apropriado.`);
        toast.success('Código processado!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setOutput(`💥 Erro crítico na execução:\n${errorMessage}`);
      toast.error('Erro crítico ao executar código');
    } finally {
      setIsRunning(false);
    }
  }, [currentLanguage, currentExampleId, markAsExecuted]);

  const handleSaveFile = useCallback(() => {
    const element = document.createElement('a');
    const file = new Blob([currentCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Arquivo salvo!');
  }, [currentCode, fileName]);

  const handleLoadExample = useCallback((example: CodeExample) => {
    setCurrentCode(example.code);
    setCurrentLanguage(example.language);
    setCurrentExampleId(example.id);
    setFileName(`${example.title.toLowerCase().replace(/\s+/g, '_')}.${example.language === 'javascript' ? 'js' : example.language}`);
    toast.success(`Exemplo "${example.title}" carregado!`);
  }, []);

  const handleReset = useCallback(() => {
    const template = LANGUAGE_TEMPLATES[currentLanguage as keyof typeof LANGUAGE_TEMPLATES];
    if (template) {
      setCurrentCode(template);
      setCurrentExampleId(null);
      toast.success('Código resetado!');
    }
  }, [currentLanguage]);

  return (
    <div className={cn('flex h-screen w-full bg-background overflow-hidden', className)}>
      {/* Painel Principal - Editor */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header do Editor */}
        <div className="border-b px-4 py-3 bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                <h1 className="font-semibold text-lg">Editor de Código</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={currentLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Badge de execução JavaScript */}
                {currentLanguage === 'javascript' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Execução Direta
                  </Badge>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? '🌞' : '🌙'}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleSaveFile}>
                <Download className="w-4 h-4 mr-1" />
                Salvar
              </Button>
              
              <Button 
                size="sm" 
                onClick={() => handleRunCode(currentCode)}
                disabled={isRunning}
                className={currentLanguage === 'javascript' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Play className="w-4 h-4 mr-1" />
                {isRunning ? 'Executando...' : 
                 currentLanguage === 'javascript' ? 'Executar no Navegador' : 'Executar'
                }
                {currentLanguage === 'javascript' && (
                  <Shield className="w-3 h-3 ml-1 text-green-200" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Área de trabalho */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Editor */}
          <div className={`flex-1 flex flex-col min-h-0 ${showOutput ? 'w-2/3' : 'w-full'}`}>
            <div className="flex-1 min-h-0 overflow-hidden">
              <CodeEditor
                initialCode={currentCode}
                language={currentLanguage}
                theme={theme}
                onCodeChange={handleCodeChange}
                onRun={handleRunCode}
                height="100%"
                showActions={false}
                enableLinting={true}
                enableLSP={true}
                className="h-full w-full"
              />
            </div>
          </div>

          {/* Output Terminal */}
          {showOutput && (
            <div className="w-1/3 border-l flex flex-col min-h-0">
              <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span className="font-medium text-sm">Saída</span>
                  {currentLanguage === 'javascript' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 text-xs">
                      <Shield className="w-2.5 h-2.5 mr-1" />
                      Navegador
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOutput('')}
                    className="h-6 px-2 text-xs"
                    title="Limpar saída"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOutput(false)}
                    className="h-6 w-6 p-0"
                  >
                    ✕
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-3 min-h-0">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {output || 'Nenhuma saída ainda...'}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Painel de Exemplos */}
      {showExamples && (
        <aside className="relative flex h-full w-[22rem] flex-col border-l bg-background/95 supports-[backdrop-filter]:backdrop-blur-xl min-h-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-muted/40" aria-hidden="true" />

          <div className="relative border-b border-border/60 px-4 py-4 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" aria-hidden="true" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner shadow-primary/10">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground/80">
                    Biblioteca
                  </p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold leading-tight text-foreground">
                      Exemplos de Código
                    </h3>
                    <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px] font-medium">
                      {filteredExamples.length} ativos
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inspirações prontas para usar no editor
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExamples(false)}
                className="h-8 w-8 rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
              >
                <span className="sr-only">Fechar painel de exemplos</span>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por título, linguagem ou tag..."
                className="h-9 rounded-lg border border-border/70 bg-background/80 pl-9 text-sm placeholder:text-muted-foreground/70"
              />
            </div> */}

            {availableLanguages.length > 1 && (
              <div className="relative mt-3 flex flex-wrap gap-2">
                {['all', ...availableLanguages].map((language) => {
                  const isActive = selectedLanguage === language;
                  return (
                    <Button
                      key={language}
                      type="button"
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="edu-xs"
                      className={cn(
                        'rounded-full border border-transparent px-3 text-xs font-medium transition',
                        isActive
                          ? 'border-primary/40 bg-primary/15 text-primary shadow-sm'
                          : 'border-border/50 bg-background/60 text-muted-foreground hover:border-primary/20 hover:bg-primary/10 hover:text-primary'
                      )}
                      onClick={() => setSelectedLanguage(language)}
                    >
                      {language === 'all' ? 'Todas' : language.toUpperCase()}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="relative flex-1 overflow-hidden min-h-0">
            <ExamplesPanel
              className="h-full bg-transparent"
              onExampleSelect={handleLoadExample}
              theme={theme}
            />
          </div>
        </aside>
      )}

      {/* Botão para mostrar exemplos quando oculto */}
      {!showExamples && (
        <div className="fixed bottom-4 right-4">
          <Button onClick={() => setShowExamples(true)}>
            📚 Mostrar Exemplos
          </Button>
        </div>
      )}
    </div>
  );
};

export default CodeEditorPage;
