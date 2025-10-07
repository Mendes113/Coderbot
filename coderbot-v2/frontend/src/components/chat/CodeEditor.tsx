import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Button } from '@/components/ui/button';
import { Play, Copy, Download, RotateCcw, Settings, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Configurar workers do Monaco
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  height?: string;
  onCodeChange?: (code: string) => void;
  onRun?: (code: string) => void;
  className?: string;
  showActions?: boolean;
  enableLinting?: boolean;
  enableLSP?: boolean;
  hints?: Array<{
    line: number;
    message: string;
    type: 'info' | 'warning' | 'error';
  }>;
}

// Configurações de linting para diferentes linguagens
const LINTING_RULES = {
  python: {
    // Regras básicas do Python
    rules: [
      {
        pattern: /^[ \t]*import\s+\*$/gm,
        message: 'Evite usar "import *", seja específico nos imports',
        severity: 'warning' as const
      },
      {
        pattern: /^[ \t]*print\s*\(/gm,
        message: 'Considere usar logging ao invés de print em código de produção',
        severity: 'info' as const
      },
      {
        pattern: /^[ \t]*def\s+\w+\s*\(\s*\)\s*:[ \t]*$/gm,
        message: 'Função sem docstring - considere adicionar documentação',
        severity: 'info' as const
      },
      {
        pattern: /^\s*except\s*:\s*$/gm,
        message: 'Evite except sem especificar o tipo de exceção',
        severity: 'warning' as const
      }
    ]
  },
  javascript: {
    rules: [
      {
        pattern: /var\s+\w+/g,
        message: 'Use "let" ou "const" ao invés de "var"',
        severity: 'warning' as const
      },
      {
        pattern: /==\s*(?!=)/g,
        message: 'Use "===" para comparação estrita',
        severity: 'warning' as const
      },
      {
        pattern: /!=\s*(?!=)/g,
        message: 'Use "!==" para comparação estrita',
        severity: 'warning' as const
      },
      {
        pattern: /console\.log\s*\(/g,
        message: 'Remova console.log antes de colocar em produção',
        severity: 'info' as const
      }
    ]
  }
};

// Função para análise de linting
const analyzeCode = (code: string, language: string) => {
  const issues: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }> = [];

  const rules = LINTING_RULES[language as keyof typeof LINTING_RULES];
  if (!rules) return issues;

  const lines = code.split('\n');
  
  rules.rules.forEach(rule => {
    let match;
    let lineNumber = 0;
    
    for (const line of lines) {
      lineNumber++;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      match = regex.exec(line);
      
      if (match) {
        issues.push({
          line: lineNumber,
          column: match.index + 1,
          message: rule.message,
          severity: rule.severity
        });
      }
    }
  });

  return issues;
};

// Configurações LSP simuladas para autocompletar
const getLanguageCompletions = (language: string, model: monaco.editor.ITextModel, position: monaco.Position) => {
  const suggestions: monaco.languages.CompletionItem[] = [];
  const word = model.getWordUntilPosition(position);
  const range = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn
  };

  if (language === 'python') {
    const pythonSuggestions = [
      {
        label: 'print',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'print(${1:message})',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Imprime uma mensagem no console'
      },
      {
        label: 'def',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'def ${1:function_name}(${2:parameters}):\n    ${3:pass}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define uma nova função'
      },
      {
        label: 'if',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'if ${1:condition}:\n    ${2:pass}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Condicional if'
      },
      {
        label: 'for',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Loop for'
      },
      {
        label: 'try',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Bloco try-except'
      }
    ];
    
    suggestions.push(...pythonSuggestions.map(s => ({ ...s, range })));
  }

  if (language === 'javascript') {
    const jsSuggestions = [
      {
        label: 'console.log',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'console.log(${1:message});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Imprime uma mensagem no console'
      },
      {
        label: 'function',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'function ${1:functionName}(${2:parameters}) {\n    ${3:// código}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define uma nova função'
      },
      {
        label: 'const',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'const ${1:name} = ${2:value};',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Declara uma constante'
      },
      {
        label: 'arrow function',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: '(${1:parameters}) => {\n    ${2:// código}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Arrow function ES6'
      },
      {
        label: 'if',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'if (${1:condition}) {\n    ${2:// código}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Condicional if'
      }
    ];
    
    suggestions.push(...jsSuggestions.map(s => ({ ...s, range })));
  }

  return { suggestions };
};

// Tema customizado para o editor
const customTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
    { token: 'string', foreground: 'ce9178' },
    { token: 'number', foreground: 'b5cea8' },
    { token: 'function', foreground: 'dcdcaa' },
    { token: 'variable', foreground: '9cdcfe' },
    { token: 'type', foreground: '4ec9b0' },
    { token: 'operator', foreground: 'd4d4d4' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editor.lineHighlightBackground': '#2d2d2d',
    'editor.selectionBackground': '#264f78',
    'editorCursor.foreground': '#ffffff',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#c6c6c6',
  }
};

const lightTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '008000', fontStyle: 'italic' },
    { token: 'keyword', foreground: '0000ff', fontStyle: 'bold' },
    { token: 'string', foreground: 'a31515' },
    { token: 'number', foreground: '098658' },
    { token: 'function', foreground: '795e26' },
    { token: 'variable', foreground: '001080' },
    { token: 'type', foreground: '267f99' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#000000',
    'editor.lineHighlightBackground': '#f7f7f7',
    'editor.selectionBackground': '#add6ff',
  }
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = '// Digite seu código aqui...\nconsole.log("Hello, World!");',
  language = 'javascript',
  theme = 'dark',
  readOnly = false,
  height = '400px',
  onCodeChange,
  onRun,
  className,
  showActions = true,
  enableLinting = true,
  enableLSP = true,
  hints = []
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [lintingIssues, setLintingIssues] = useState<Array<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>>([]);
  const [decorationIds, setDecorationIds] = useState<string[]>([]);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    
    // Registrar temas customizados
    monaco.editor.defineTheme('custom-dark', customTheme);
    monaco.editor.defineTheme('custom-light', lightTheme);
    
    // Aplicar tema baseado na prop
    monaco.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'custom-light');
    
    // Configurações do editor
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'line',
      quickSuggestions: enableLSP,
      suggestOnTriggerCharacters: enableLSP,
      acceptSuggestionOnEnter: enableLSP ? 'on' : 'off',
    });

    // Configurar LSP se habilitado
    if (enableLSP) {
      // Registrar provedor de completion
      const completionProvider = monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: (model, position) => getLanguageCompletions(language, model, position),
        triggerCharacters: ['.', '(', '[', ' ']
      });

      // Configurar diagnósticos de validação
      const validationProvider = monaco.languages.registerCodeActionProvider(language, {
        provideCodeActions: (model, range, context) => {
          const actions: monaco.languages.CodeAction[] = [];
          
          context.markers.forEach(marker => {
            if (marker.severity === monaco.MarkerSeverity.Warning) {
              actions.push({
                title: `Corrigir: ${marker.message}`,
                kind: 'quickfix',
                edit: {
                  edits: [{
                    resource: model.uri,
                    versionId: model.getVersionId(),
                    textEdit: {
                      range: {
                        startLineNumber: marker.startLineNumber,
                        startColumn: marker.startColumn,
                        endLineNumber: marker.endLineNumber,
                        endColumn: marker.endColumn
                      },
                      text: ''
                    }
                  }]
                }
              });
            }
          });
          
          return { actions, dispose: () => {} };
        }
      });

      // Limpeza ao desmontar
      editor.onDidDispose(() => {
        completionProvider.dispose();
        validationProvider.dispose();
      });
    }

    // Configurar linting se habilitado
    if (enableLinting) {
      const runLinting = () => {
        const currentCode = editor.getValue();
        const issues = analyzeCode(currentCode, language);
        setLintingIssues(issues);
        
        // Criar markers para o Monaco
        const markers: monaco.editor.IMarkerData[] = issues.map(issue => ({
          startLineNumber: issue.line,
          startColumn: issue.column,
          endLineNumber: issue.line,
          endColumn: issue.column + 10,
          message: issue.message,
          severity: issue.severity === 'error' ? monaco.MarkerSeverity.Error :
                   issue.severity === 'warning' ? monaco.MarkerSeverity.Warning :
                   monaco.MarkerSeverity.Info
        }));
        
        monaco.editor.setModelMarkers(editor.getModel()!, 'linting', markers);
      };

      // Executar linting no código inicial
      runLinting();
      
      // Executar linting quando o código mudar
      const disposable = editor.onDidChangeModelContent(() => {
        setTimeout(runLinting, 500); // Debounce de 500ms
      });

      editor.onDidDispose(() => disposable.dispose());
    }

    // Adicionar decorações de dicas se fornecidas
    if (hints.length > 0) {
      const decorations = hints.map(hint => ({
        range: new monaco.Range(hint.line, 1, hint.line, 1),
        options: {
          isWholeLine: true,
          className: `hint-${hint.type}`,
          glyphMarginClassName: `hint-glyph-${hint.type}`,
          hoverMessage: { value: hint.message },
          glyphMarginHoverMessage: { value: hint.message }
        }
      }));
      
      const ids = editor.deltaDecorations([], decorations);
      setDecorationIds(ids);
    }
  }, [theme, hints, enableLSP, enableLinting, language]);

  const handleCodeChange = useCallback((value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);
  }, [onCodeChange]);

  const handleRun = useCallback(async () => {
    if (!code.trim()) {
      toast.error('Não há código para executar');
      return;
    }

    setIsRunning(true);
    try {
      await onRun?.(code);
      toast.success('Código executado com sucesso!');
    } catch (error) {
      toast.error('Erro ao executar o código');
    } finally {
      setIsRunning(false);
    }
  }, [code, onRun]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  }, [code]);

  const handleDownload = useCallback(() => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `code.${language === 'javascript' ? 'js' : language}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Código baixado!');
  }, [code, language]);

  const handleReset = useCallback(() => {
    setCode(initialCode);
    editorRef.current?.setValue(initialCode);
    toast.success('Código resetado!');
  }, [initialCode]);

  // Atualizar tema quando prop muda
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'custom-light');
    }
  }, [theme]);

  return (
    <div className={cn('flex flex-col border rounded-lg overflow-hidden', className)}>
      {showActions && (
        <div className="flex items-center justify-between px-3 py-2 bg-muted border-b">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-sm font-medium text-muted-foreground ml-2">
              {language}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2"
              title="Copiar código"
            >
              <Copy className="w-3 h-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-7 px-2"
              title="Baixar código"
            >
              <Download className="w-3 h-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2"
              title="Resetar código"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            
            {onRun && (
              <Button
                variant="default"
                size="sm"
                onClick={handleRun}
                disabled={isRunning}
                className="h-7 px-3 ml-1"
                title="Executar código"
              >
                <Play className="w-3 h-3 mr-1" />
                {isRunning ? 'Executando...' : 'Executar'}
              </Button>
            )}

            {/* Indicadores de LSP/Linting */}
            {(enableLSP || enableLinting) && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l">
                {enableLSP && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" title="LSP Ativo"></div>
                    <span className="text-xs text-muted-foreground">LSP</span>
                  </div>
                )}
                {enableLinting && (
                  <div className="flex items-center gap-1 ml-1">
                    <div className={`w-2 h-2 rounded-full ${
                      lintingIssues.some(i => i.severity === 'error') ? 'bg-red-500' :
                      lintingIssues.some(i => i.severity === 'warning') ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} title="Status do Linting"></div>
                    <span className="text-xs text-muted-foreground">
                      {lintingIssues.length > 0 ? `${lintingIssues.length} problema${lintingIssues.length > 1 ? 's' : ''}` : 'OK'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1" style={{ height }}>
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            automaticLayout: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
            },
          }}
        />
      </div>

      {/* Painel de Issues do Linting */}
      {enableLinting && lintingIssues.length > 0 && (
        <div className="border-t bg-muted/30">
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium">Problemas encontrados ({lintingIssues.length})</span>
          </div>
          <div className="max-h-32 overflow-y-auto p-2 space-y-1">
            {lintingIssues.map((issue, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded text-xs cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  if (editorRef.current) {
                    editorRef.current.setPosition({ lineNumber: issue.line, column: issue.column });
                    editorRef.current.focus();
                  }
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {issue.severity === 'error' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  {issue.severity === 'warning' && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
                  {issue.severity === 'info' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">Linha {issue.line}:</span>
                    <span className="text-foreground">{issue.message}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;