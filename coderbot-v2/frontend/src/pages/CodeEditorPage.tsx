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

// Função para executar código via Piston API
const executeCodeViaPiston = async (language: string, code: string, stdin: string = '') => {
  try {
    const response = await fetch('/api/piston/executar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: language,
        code: code,
        stdin: stdin
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao executar código via Piston:', error);
    throw error;
  }
};

// Templates iniciais para diferentes linguagens
const LANGUAGE_TEMPLATES = {
  javascript: `// Bem-vindo ao Editor de Código JavaScript
console.log("🚀 Hello, World!");

// Exemplo de função
function saudacao(nome) {
  return \`Olá, \${nome}! 👋\`;
}

console.log(saudacao("Desenvolvedor"));

// Exemplo com arrays
const numeros = [1, 2, 3, 4, 5];
const pares = numeros.filter(n => n % 2 === 0);
console.log("Números pares:", pares);`,
  
  python: `# Bem-vindo ao Editor de Código Python
print("🚀 Hello, World!")

# Exemplo de função
def saudacao(nome):
    return f"Olá, {nome}! 👋"

print(saudacao("Desenvolvedor"))

# Exemplo com listas
numeros = [1, 2, 3, 4, 5]
pares = [n for n in numeros if n % 2 == 0]
print("Números pares:", pares)`,

  java: `// Bem-vindo ao Editor de Código Java
public class Main {
    public static void main(String[] args) {
        System.out.println("🚀 Hello, World!");
        
        // Exemplo de método
        String mensagem = saudacao("Desenvolvedor");
        System.out.println(mensagem);
        
        // Exemplo com arrays
        int[] numeros = {1, 2, 3, 4, 5};
        System.out.print("Números pares: ");
        for (int num : numeros) {
            if (num % 2 == 0) {
                System.out.print(num + " ");
            }
        }
        System.out.println();
    }
    
    public static String saudacao(String nome) {
        return "Olá, " + nome + "! 👋";
    }
}`,

  cpp: `// Bem-vindo ao Editor de Código C++
#include <iostream>
#include <vector>
#include <string>

using namespace std;

string saudacao(const string& nome) {
    return "Olá, " + nome + "! 👋";
}

int main() {
    cout << "🚀 Hello, World!" << endl;
    
    // Exemplo de função
    cout << saudacao("Desenvolvedor") << endl;
    
    // Exemplo com vetores
    vector<int> numeros = {1, 2, 3, 4, 5};
    cout << "Números pares: ";
    for (int num : numeros) {
        if (num % 2 == 0) {
            cout << num << " ";
        }
    }
    cout << endl;
    
    return 0;
}`,

  c: `// Bem-vindo ao Editor de Código C
#include <stdio.h>
#include <string.h>

void saudacao(const char* nome) {
    printf("Olá, %s! 👋\\n", nome);
}

int main() {
    printf("🚀 Hello, World!\\n");
    
    // Exemplo de função
    saudacao("Desenvolvedor");
    
    // Exemplo com arrays
    int numeros[] = {1, 2, 3, 4, 5};
    int tamanho = sizeof(numeros) / sizeof(numeros[0]);
    
    printf("Números pares: ");
    for (int i = 0; i < tamanho; i++) {
        if (numeros[i] % 2 == 0) {
            printf("%d ", numeros[i]);
        }
    }
    printf("\\n");
    
    return 0;
}`,

  csharp: `// Bem-vindo ao Editor de Código C#
using System;
using System.Linq;

class Program 
{
    static void Main() 
    {
        Console.WriteLine("🚀 Hello, World!");
        
        // Exemplo de método
        Console.WriteLine(Saudacao("Desenvolvedor"));
        
        // Exemplo com arrays e LINQ
        int[] numeros = {1, 2, 3, 4, 5};
        var pares = numeros.Where(n => n % 2 == 0);
        Console.WriteLine("Números pares: " + string.Join(" ", pares));
    }
    
    static string Saudacao(string nome) 
    {
        return $"Olá, {nome}! 👋";
    }
}`,

  go: `// Bem-vindo ao Editor de Código Go
package main

import "fmt"

func saudacao(nome string) string {
    return fmt.Sprintf("Olá, %s! 👋", nome)
}

func main() {
    fmt.Println("🚀 Hello, World!")
    
    // Exemplo de função
    fmt.Println(saudacao("Desenvolvedor"))
    
    // Exemplo com slices
    numeros := []int{1, 2, 3, 4, 5}
    fmt.Print("Números pares: ")
    for _, num := range numeros {
        if num%2 == 0 {
            fmt.Printf("%d ", num)
        }
    }
    fmt.Println()
}`,

  rust: `// Bem-vindo ao Editor de Código Rust
fn saudacao(nome: &str) -> String {
    format!("Olá, {}! 👋", nome)
}

fn main() {
    println!("🚀 Hello, World!");
    
    // Exemplo de função
    println!("{}", saudacao("Desenvolvedor"));
    
    // Exemplo com vetores
    let numeros = vec![1, 2, 3, 4, 5];
    print!("Números pares: ");
    for num in &numeros {
        if num % 2 == 0 {
            print!("{} ", num);
        }
    }
    println!();
}`,

  php: `<?php
// Bem-vindo ao Editor de Código PHP
echo "🚀 Hello, World!\\n";

// Exemplo de função
function saudacao($nome) {
    return "Olá, $nome! 👋";
}

echo saudacao("Desenvolvedor") . "\\n";

// Exemplo com arrays
$numeros = [1, 2, 3, 4, 5];
$pares = array_filter($numeros, function($n) { return $n % 2 === 0; });
echo "Números pares: " . implode(" ", $pares) . "\\n";
?>`,

  ruby: `# Bem-vindo ao Editor de Código Ruby
puts "🚀 Hello, World!"

# Exemplo de método
def saudacao(nome)
  "Olá, #{nome}! 👋"
end

puts saudacao("Desenvolvedor")

# Exemplo com arrays
numeros = [1, 2, 3, 4, 5]
pares = numeros.select { |n| n.even? }
puts "Números pares: #{pares.join(' ')}"`,

  typescript: `// Bem-vindo ao Editor de Código TypeScript
console.log("🚀 Hello, World!");

// Exemplo de função tipada
function saudacao(nome: string): string {
  return \`Olá, \${nome}! 👋\`;
}

console.log(saudacao("Desenvolvedor"));

// Exemplo com arrays tipados
const numeros: number[] = [1, 2, 3, 4, 5];
const pares: number[] = numeros.filter((n: number) => n % 2 === 0);
console.log("Números pares:", pares);`,

  kotlin: `// Bem-vindo ao Editor de Código Kotlin
fun saudacao(nome: String): String {
    return "Olá, \$nome! 👋"
}

fun main() {
    println("🚀 Hello, World!")
    
    // Exemplo de função
    println(saudacao("Desenvolvedor"))
    
    // Exemplo com listas
    val numeros = listOf(1, 2, 3, 4, 5)
    val pares = numeros.filter { it % 2 == 0 }
    println("Números pares: \${pares.joinToString(" ")}")
}`,
  
  html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minha Página</title>
</head>
<body>
    <h1>🚀 Hello, World!</h1>
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
  { id: 'javascript', name: 'JavaScript', extension: 'js', executable: true, monacoLang: 'javascript' },
  { id: 'python', name: 'Python', extension: 'py', executable: true, monacoLang: 'python' },
  { id: 'java', name: 'Java', extension: 'java', executable: true, monacoLang: 'java' },
  { id: 'cpp', name: 'C++', extension: 'cpp', executable: true, monacoLang: 'cpp' },
  { id: 'c', name: 'C', extension: 'c', executable: true, monacoLang: 'c' },
  { id: 'csharp', name: 'C#', extension: 'cs', executable: true, monacoLang: 'csharp' },
  { id: 'go', name: 'Go', extension: 'go', executable: true, monacoLang: 'go' },
  { id: 'rust', name: 'Rust', extension: 'rs', executable: true, monacoLang: 'rust' },
  { id: 'php', name: 'PHP', extension: 'php', executable: true, monacoLang: 'php' },
  { id: 'ruby', name: 'Ruby', extension: 'rb', executable: true, monacoLang: 'ruby' },
  { id: 'typescript', name: 'TypeScript', extension: 'ts', executable: true, monacoLang: 'typescript' },
  { id: 'kotlin', name: 'Kotlin', extension: 'kt', executable: true, monacoLang: 'kotlin' },
  { id: 'html', name: 'HTML', extension: 'html', executable: false, monacoLang: 'html' },
  { id: 'css', name: 'CSS', extension: 'css', executable: false, monacoLang: 'css' }
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
        // Para outras linguagens executáveis, usar Piston
        const currentLangConfig = SUPPORTED_LANGUAGES.find(l => l.id === currentLanguage);
        
        if (currentLangConfig?.executable) {
          try {
            const pistonResult = await executeCodeViaPiston(currentLanguage, code);
            const executionTime = Date.now() - startTime;
            
            let output = '';
            let hasError = false;
            
            // Verificar se houve erro de compilação
            if (pistonResult.compile_output && pistonResult.compile_output.trim()) {
              output += `� === Compile Output ===\n${pistonResult.compile_output}\n\n`;
              if (pistonResult.status?.id !== 3) { // Status 3 = Accepted
                hasError = true;
              }
            }
            
            // Saída padrão
            if (pistonResult.stdout && pistonResult.stdout.trim()) {
              output += `🖥️ === Output ===\n${pistonResult.stdout}\n\n`;
            }
            
            // Erros de runtime
            if (pistonResult.stderr && pistonResult.stderr.trim()) {
              output += `❌ === Runtime Error ===\n${pistonResult.stderr}\n\n`;
              hasError = true;
            }
            
            // Status da execução
            if (pistonResult.status) {
              const statusDescription = pistonResult.status.description || 'Unknown';
              const statusIcon = pistonResult.status.id === 3 ? '✅' : '❌';
              output += `${statusIcon} === Status ===\n${statusDescription}`;
              
              if (pistonResult.time) {
                output += ` (${pistonResult.time}s)`;
              }
              if (pistonResult.memory) {
                output += ` [${pistonResult.memory}KB]`;
              }
            }
            
            if (!output.trim()) {
              output = hasError ? '❌ Execução falhou sem output' : '✅ Código executado com sucesso! (Sem saída)';
            }
            
            setOutput(output);
            
            // Marcar exemplo como executado se estivermos executando um exemplo
            if (currentExampleId) {
              markAsExecuted(
                currentExampleId, 
                hasError ? 'error' : 'success',
                output,
                executionTime
              );
            }
            
            if (hasError) {
              toast.error(`Erro na execução ${currentLanguage.toUpperCase()}`);
            } else {
              toast.success(`${currentLanguage.toUpperCase()} executado com sucesso!`);
            }
            
          } catch (pistonError) {
            const errorMessage = pistonError instanceof Error ? pistonError.message : String(pistonError);
            setOutput(`💥 Erro ao executar ${currentLanguage.toUpperCase()}:\n${errorMessage}\n\n⚠️ Verifique se o serviço Piston está disponível.`);
            toast.error(`Erro ao executar ${currentLanguage.toUpperCase()}`);
          }
        } else {
          // Para linguagens não executáveis (HTML, CSS)
          setOutput(`📝 Código ${currentLanguage.toUpperCase()} validado!\n\n⚠️ Esta linguagem não suporta execução direta.\nUse um navegador web ou ferramenta apropriada para visualizar o resultado.`);
          toast.success('Código validado!');
        }
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
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{lang.name}</span>
                          {lang.executable && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              ▶️
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Badge de status de execução */}
                {currentLanguage === 'javascript' && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Navegador
                  </Badge>
                )}
                
                {currentLanguage !== 'javascript' && SUPPORTED_LANGUAGES.find(l => l.id === currentLanguage)?.executable && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    <Terminal className="w-3 h-3 mr-1" />
                    Piston
                  </Badge>
                )}
                
                {SUPPORTED_LANGUAGES.find(l => l.id === currentLanguage)?.executable === false && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    <FileText className="w-3 h-3 mr-1" />
                    Texto
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
                language={SUPPORTED_LANGUAGES.find(l => l.id === currentLanguage)?.monacoLang || currentLanguage}
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
