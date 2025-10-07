import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CodeExample {
  id: string;
  title: string;
  code: string;
  language: string;
  type: 'correct' | 'incorrect';
  explanation: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  hints?: Array<{
    line: number;
    message: string;
    type: 'info' | 'warning' | 'error';
  }>;
  lastExecuted?: {
    timestamp: Date;
    status: 'success' | 'error';
    output?: string;
    executionTime?: number;
  };
}

interface ExamplesContextType {
  examples: CodeExample[];
  setExamples: (examples: CodeExample[]) => void;
  addExample: (example: CodeExample) => void;
  updateExample: (id: string, updates: Partial<CodeExample>) => void;
  removeExample: (id: string) => void;
  markAsExecuted: (id: string, status: 'success' | 'error', output?: string, executionTime?: number) => void;
  getExample: (id: string) => CodeExample | undefined;
  selectedExample: CodeExample | null;
  setSelectedExample: (example: CodeExample | null) => void;
  // Filtros e busca
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedLanguage: string | 'all';
  setSelectedLanguage: (language: string | 'all') => void;
  selectedType: 'all' | 'correct' | 'incorrect';
  setSelectedType: (type: 'all' | 'correct' | 'incorrect') => void;
}

const ExamplesContext = createContext<ExamplesContextType | undefined>(undefined);

export const useExamples = () => {
  const context = useContext(ExamplesContext);
  if (!context) {
    throw new Error('useExamples must be used within an ExamplesProvider');
  }
  return context;
};

interface ExamplesProviderProps {
  children: ReactNode;
  initialExamples?: CodeExample[];
}

export const ExamplesProvider: React.FC<ExamplesProviderProps> = ({ 
  children, 
  initialExamples = [] 
}) => {
  const [examples, setExamples] = useState<CodeExample[]>(initialExamples);
  const [selectedExample, setSelectedExample] = useState<CodeExample | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'correct' | 'incorrect'>('all');

  const addExample = useCallback((example: CodeExample) => {
    setExamples(prev => [...prev, example]);
  }, []);

  const updateExample = useCallback((id: string, updates: Partial<CodeExample>) => {
    setExamples(prev => 
      prev.map(example => 
        example.id === id 
          ? { ...example, ...updates }
          : example
      )
    );
  }, []);

  const removeExample = useCallback((id: string) => {
    setExamples(prev => prev.filter(example => example.id !== id));
  }, []);

  const markAsExecuted = useCallback((
    id: string, 
    status: 'success' | 'error', 
    output?: string, 
    executionTime?: number
  ) => {
    updateExample(id, {
      lastExecuted: {
        timestamp: new Date(),
        status,
        output,
        executionTime
      }
    });
  }, [updateExample]);

  const getExample = useCallback((id: string) => {
    return examples.find(example => example.id === id);
  }, [examples]);

  const value: ExamplesContextType = {
    examples,
    setExamples,
    addExample,
    updateExample,
    removeExample,
    markAsExecuted,
    getExample,
    selectedExample,
    setSelectedExample,
    searchQuery,
    setSearchQuery,
    selectedLanguage,
    setSelectedLanguage,
    selectedType,
    setSelectedType
  };

  return (
    <ExamplesContext.Provider value={value}>
      {children}
    </ExamplesContext.Provider>
  );
};

// Exemplos padrão
export const defaultExamples: CodeExample[] = [
  {
    id: 'js-browser-demo',
    title: 'Demo: Execução no Navegador',
    code: `// 🚀 Este código roda diretamente no navegador!
console.log("=== Demo de Execução JavaScript ===");

// 1. Variáveis e tipos
const nome = "JavaScript";
const versao = 2023;
const ativo = true;

console.log(\`Linguagem: \${nome}, Versão: \${versao}, Ativo: \${ativo}\`);

// 2. Arrays e métodos
const numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const pares = numeros.filter(n => n % 2 === 0);
const soma = numeros.reduce((acc, n) => acc + n, 0);

console.log("Números:", numeros);
console.log("Pares:", pares);
console.log("Soma total:", soma);

// 3. Objetos e destructuring
const usuario = {
  nome: "Ana",
  idade: 28,
  skills: ["JavaScript", "React", "Node.js"],
  ativo: true
};

const { nome: nomeUsuario, skills } = usuario;
console.log(\`Usuário: \${nomeUsuario}\`);
console.log("Skills:", skills.join(", "));

// 4. Funções modernas
const calcularIdade = (anoNascimento) => {
  const anoAtual = new Date().getFullYear();
  return anoAtual - anoNascimento;
};

console.log("Idade calculada:", calcularIdade(1995));

console.log("✅ Demo concluído! Verifique toda a saída acima.");`,
    language: 'javascript',
    type: 'correct',
    explanation: 'Demonstração completa das funcionalidades JavaScript executando diretamente no navegador com sandbox de segurança.',
    tags: ['demo', 'navegador', 'moderno', 'completo'],
    difficulty: 'intermediate'
  },
  {
    id: 'calc-1',
    title: 'Calculadora Simples',
    code: `function calculadora(a, b, operacao) {
  switch(operacao) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b !== 0 ? a / b : 'Erro: Divisão por zero';
    default:
      return 'Operação inválida';
  }
}

// Testes
console.log(calculadora(10, 5, '+')); // 15
console.log(calculadora(10, 5, '-')); // 5
console.log(calculadora(10, 5, '*')); // 50
console.log(calculadora(10, 5, '/')); // 2`,
    language: 'javascript',
    type: 'correct',
    explanation: 'Calculadora que utiliza switch case para diferentes operações matemáticas, com tratamento de erro para divisão por zero.',
    tags: ['calculadora', 'switch', 'função', 'matemática'],
    difficulty: 'intermediate'
  },
  {
    id: 'func-incorrect',
    title: 'Função Incorreta',
    code: `function somar(a, b) {
  a + b; // ❌ Faltando return
}

console.log(somar(2, 3)); // Output: undefined`,
    language: 'javascript',
    type: 'incorrect',
    explanation: 'Este exemplo mostra um erro comum: esquecer de usar return. Sem return, a função retorna undefined.',
    tags: ['função', 'erro', 'return'],
    difficulty: 'beginner',
    hints: [
      { line: 2, message: 'Faltando palavra-chave return', type: 'error' },
      { line: 5, message: 'Resultado será undefined', type: 'warning' }
    ]
  },
  {
    id: 'loop-for',
    title: 'Loop For Correto',
    code: `for (let i = 0; i < 5; i++) {
  console.log('Número:', i);
}`,
    language: 'javascript',
    type: 'correct',
    explanation: 'Loop for básico que imprime números de 0 a 4. Note a estrutura: inicialização, condição, incremento.',
    tags: ['loop', 'for', 'iteração'],
    difficulty: 'beginner'
  }
];