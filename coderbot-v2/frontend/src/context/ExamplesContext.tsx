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
  // Analytics metadata
  viewCount?: number;
  copyCount?: number;
  focusModeCount?: number;
  lastViewed?: Date;
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
  // Analytics tracking
  trackExampleView: (exampleId: string) => void;
  trackExampleCopy: (exampleId: string, context: 'inline_card' | 'modal_focus') => void;
  trackFocusMode: (exampleId: string) => void;
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

  // Analytics tracking functions
  const trackExampleView = useCallback((exampleId: string) => {
    const example = examples.find(e => e.id === exampleId);
    if (example) {
      updateExample(exampleId, {
        viewCount: (example.viewCount || 0) + 1,
        lastViewed: new Date()
      });
    }
  }, [examples, updateExample]);

  const trackExampleCopy = useCallback((exampleId: string, context: 'inline_card' | 'modal_focus') => {
    const example = examples.find(e => e.id === exampleId);
    if (example) {
      updateExample(exampleId, {
        copyCount: (example.copyCount || 0) + 1
      });
    }
  }, [examples, updateExample]);

  const trackFocusMode = useCallback((exampleId: string) => {
    const example = examples.find(e => e.id === exampleId);
    if (example) {
      updateExample(exampleId, {
        focusModeCount: (example.focusModeCount || 0) + 1
      });
    }
  }, [examples, updateExample]);

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
    setSelectedType,
    trackExampleView,
    trackExampleCopy,
    trackFocusMode
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
  },
  {
    id: 'python-hello',
    title: 'Python: Hello World',
    code: `print("🐍 Hello from Python!")

# Função em Python
def saudacao(nome):
    return f"Olá, {nome}!"

print(saudacao("Mundo Python"))

# Lista e list comprehension
numeros = [1, 2, 3, 4, 5]
quadrados = [x**2 for x in numeros]
print("Quadrados:", quadrados)`,
    language: 'python',
    type: 'correct',
    explanation: 'Exemplo básico em Python mostrando funções, f-strings e list comprehensions.',
    tags: ['python', 'função', 'lista'],
    difficulty: 'beginner'
  },
  {
    id: 'java-hello',
    title: 'Java: Hello World',
    code: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("☕ Hello from Java!");
        
        // Chamando método
        String mensagem = saudacao("Mundo Java");
        System.out.println(mensagem);
        
        // Array e loop
        int[] numeros = {1, 2, 3, 4, 5};
        System.out.print("Números: ");
        for (int num : numeros) {
            System.out.print(num + " ");
        }
    }
    
    public static String saudacao(String nome) {
        return "Olá, " + nome + "!";
    }
}`,
    language: 'java',
    type: 'correct',
    explanation: 'Exemplo básico em Java com classe, método main, métodos estáticos e enhanced for loop.',
    tags: ['java', 'classe', 'método'],
    difficulty: 'beginner'
  },
  {
    id: 'cpp-hello',
    title: 'C++: Hello World',
    code: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

string saudacao(const string& nome) {
    return "Olá, " + nome + "!";
}

int main() {
    cout << "⚡ Hello from C++!" << endl;
    
    // Função
    cout << saudacao("Mundo C++") << endl;
    
    // Vector e range-based for loop
    vector<int> numeros = {1, 2, 3, 4, 5};
    cout << "Números: ";
    for (const auto& num : numeros) {
        cout << num << " ";
    }
    cout << endl;
    
    return 0;
}`,
    language: 'cpp',
    type: 'correct',
    explanation: 'Exemplo básico em C++ com STL, strings, vectors e range-based loops.',
    tags: ['cpp', 'vector', 'stl'],
    difficulty: 'beginner'
  },
  {
    id: 'array-methods',
    title: 'Array Methods Modernos',
    code: `const frutas = ['maçã', 'banana', 'laranja', 'uva', 'manga'];

// Map - transformar array
const frutasMaiusculas = frutas.map(f => f.toUpperCase());
console.log('Maiúsculas:', frutasMaiusculas);

// Filter - filtrar elementos
const frutasComA = frutas.filter(f => f.includes('a'));
console.log('Com "a":', frutasComA);

// Find - encontrar elemento
const primeiraComM = frutas.find(f => f.startsWith('m'));
console.log('Primeira com "m":', primeiraComM);

// Reduce - agregar valores
const numeros = [1, 2, 3, 4, 5];
const soma = numeros.reduce((acc, n) => acc + n, 0);
console.log('Soma:', soma);

// Some e Every
console.log('Tem fruta com 4 letras?', frutas.some(f => f.length === 4));
console.log('Todas têm mais de 2 letras?', frutas.every(f => f.length > 2));`,
    language: 'javascript',
    type: 'correct',
    explanation: 'Demonstração completa dos métodos modernos de arrays: map, filter, find, reduce, some e every.',
    tags: ['array', 'map', 'filter', 'reduce', 'moderno'],
    difficulty: 'intermediate'
  },
  {
    id: 'async-await',
    title: 'Async/Await Correto',
    code: `// Simula uma chamada de API
async function buscarUsuario(id) {
  try {
    console.log(\`Buscando usuário \${id}...\`);
    
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const usuario = {
      id,
      nome: 'João Silva',
      email: 'joao@example.com',
      idade: 30
    };
    
    console.log('Usuário encontrado:', usuario);
    return usuario;
  } catch (erro) {
    console.error('Erro ao buscar usuário:', erro);
    throw erro;
  }
}

// Executando
buscarUsuario(123)
  .then(usuario => console.log('Processado:', usuario.nome))
  .catch(erro => console.error('Falha:', erro));`,
    language: 'javascript',
    type: 'correct',
    explanation: 'Exemplo de função assíncrona com async/await, tratamento de erros com try-catch e promises.',
    tags: ['async', 'await', 'promise', 'api'],
    difficulty: 'advanced'
  },
  {
    id: 'callback-hell',
    title: 'Callback Hell (Incorreto)',
    code: `// ❌ Pyramid of Doom - código difícil de ler
buscarUsuario(1, function(usuario) {
  buscarPosts(usuario.id, function(posts) {
    buscarComentarios(posts[0].id, function(comentarios) {
      buscarLikes(comentarios[0].id, function(likes) {
        console.log(likes);
        // E continua...
      });
    });
  });
});`,
    language: 'javascript',
    type: 'incorrect',
    explanation: 'Exemplo de "callback hell" ou "pyramid of doom". Deve-se usar Promises ou async/await para evitar esse padrão.',
    tags: ['callback', 'anti-pattern', 'promises'],
    difficulty: 'intermediate',
    hints: [
      { line: 2, message: 'Use Promises ou async/await ao invés de callbacks aninhados', type: 'warning' },
      { line: 8, message: 'Código difícil de manter e debugar', type: 'error' }
    ]
  },
  {
    id: 'object-destructuring',
    title: 'Destructuring de Objetos',
    code: `const pessoa = {
  nome: 'Maria',
  idade: 28,
  cidade: 'São Paulo',
  profissao: 'Desenvolvedora',
  skills: ['JavaScript', 'React', 'Node.js']
};

// Destructuring básico
const { nome, idade } = pessoa;
console.log(\`\${nome} tem \${idade} anos\`);

// Com renomeação
const { profissao: cargo } = pessoa;
console.log('Cargo:', cargo);

// Com valores padrão
const { pais = 'Brasil' } = pessoa;
console.log('País:', pais);

// Nested destructuring
const { skills: [primeiraSkill, ...outrasSkills] } = pessoa;
console.log('Principal:', primeiraSkill);
console.log('Outras:', outrasSkills);

// Em parâmetros de função
function apresentar({ nome, profissao }) {
  return \`Olá, sou \${nome} e sou \${profissao}\`;
}
console.log(apresentar(pessoa));`,
    language: 'javascript',
    type: 'correct',
    explanation: 'Guia completo de destructuring em JavaScript: básico, com renomeação, valores padrão, nested e em funções.',
    tags: ['destructuring', 'es6', 'objeto', 'moderno'],
    difficulty: 'intermediate'
  },
  {
    id: 'class-oop',
    title: 'Classes e POO',
    code: `class Animal {
  constructor(nome, tipo) {
    this.nome = nome;
    this.tipo = tipo;
  }
  
  fazerSom() {
    return 'Som genérico';
  }
  
  apresentar() {
    return \`Eu sou \${this.nome}, um \${this.tipo}\`;
  }
}

class Cachorro extends Animal {
  constructor(nome, raca) {
    super(nome, 'cachorro');
    this.raca = raca;
  }
  
  fazerSom() {
    return 'Au au! 🐕';
  }
  
  buscar() {
    return \`\${this.nome} está buscando a bolinha!\`;
  }
}

class Gato extends Animal {
  constructor(nome, pelagem) {
    super(nome, 'gato');
    this.pelagem = pelagem;
  }
  
  fazerSom() {
    return 'Miau! 🐱';
  }
}

// Criando instâncias
const rex = new Cachorro('Rex', 'Labrador');
const mimi = new Gato('Mimi', 'laranja');

console.log(rex.apresentar());
console.log(rex.fazerSom());
console.log(rex.buscar());

console.log(mimi.apresentar());
console.log(mimi.fazerSom());`,
    language: 'javascript',
    type: 'correct',
    explanation: 'Exemplo completo de POO em JavaScript: classes, herança, construtor, métodos e polimorfismo.',
    tags: ['class', 'oop', 'herança', 'polimorfismo'],
    difficulty: 'advanced'
  },
  {
    id: 'var-issue',
    title: 'Problema com VAR (Incorreto)',
    code: `// ❌ Problema de escopo com var
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log('Loop:', i); // Todos imprimem 3!
  }, 100);
}

// ❌ Hoisting confuso
console.log(x); // undefined, não erro
var x = 5;

// ❌ Vazamento de escopo
if (true) {
  var vazou = 'vazou do if';
}
console.log(vazou); // Funciona, mas não deveria`,
    language: 'javascript',
    type: 'incorrect',
    explanation: 'Problemas comuns com var: escopo de função, hoisting e vazamento de escopo. Use let/const.',
    tags: ['var', 'escopo', 'hoisting', 'let', 'const'],
    difficulty: 'intermediate',
    hints: [
      { line: 2, message: 'Use "let" ao invés de "var" em loops', type: 'error' },
      { line: 9, message: 'var sofre hoisting, causando undefined', type: 'warning' },
      { line: 14, message: 'var não respeita escopo de bloco', type: 'error' }
    ]
  },
  {
    id: 'arrow-functions',
    title: 'Arrow Functions',
    code: `// Arrow function básica
const somar = (a, b) => a + b;
console.log('Soma:', somar(5, 3));

// Com bloco
const calcularArea = (base, altura) => {
  const area = (base * altura) / 2;
  return area;
};
console.log('Área:', calcularArea(10, 5));

// Sem parâmetros
const saudacao = () => 'Olá, mundo!';
console.log(saudacao());

// Um parâmetro (parênteses opcionais)
const dobro = x => x * 2;
console.log('Dobro de 7:', dobro(7));

// Retornando objeto (atenção aos parênteses)
const criarPessoa = (nome, idade) => ({ nome, idade });
console.log(criarPessoa('Ana', 25));

// Em arrays
const numeros = [1, 2, 3, 4, 5];
const quadrados = numeros.map(n => n ** 2);
console.log('Quadrados:', quadrados);

// Diferença de "this"
const obj = {
  valor: 10,
  tradicional: function() {
    return this.valor; // this = obj
  },
  arrow: () => {
    return this.valor; // this = contexto externo
  }
};`,
    language: 'javascript',
    type: 'correct',
    explanation: 'Guia completo de arrow functions: sintaxe, casos de uso e diferença de contexto "this".',
    tags: ['arrow function', 'es6', 'função', 'this'],
    difficulty: 'intermediate'
  },
  {
    id: 'template-literals',
    title: 'Template Literals',
    code: `const nome = 'João';
const idade = 30;
const profissao = 'Desenvolvedor';

// Template literal básico
const mensagem = \`Olá, meu nome é \${nome}\`;
console.log(mensagem);

// Expressões complexas
console.log(\`Ano que vem terei \${idade + 1} anos\`);

// Multilinhas
const carta = \`
  Prezado \${nome},
  
  Temos o prazer de informar que sua candidatura
  para a vaga de \${profissao} foi aprovada!
  
  Atenciosamente,
  RH
\`;
console.log(carta);

// Com condicionais
const status = idade >= 18 ? 'maior' : 'menor';
console.log(\`Você é \${status} de idade\`);

// Cálculos
const preco = 100;
const desconto = 0.15;
console.log(\`Preço final: R$ \${(preco * (1 - desconto)).toFixed(2)}\`);`,
    language: 'javascript',
    type: 'correct',
    explanation: 'Template literals permitem interpolação de variáveis, expressões e strings multilinhas de forma elegante.',
    tags: ['template literal', 'string', 'interpolação', 'es6'],
    difficulty: 'beginner'
  },
  {
    id: 'spread-operator',
    title: 'Spread Operator (...)',
    code: `// Array spread
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combinado = [...arr1, ...arr2];
console.log('Combinado:', combinado);

// Copiar array
const original = [1, 2, 3];
const copia = [...original];
copia.push(4);
console.log('Original:', original); // [1, 2, 3]
console.log('Cópia:', copia); // [1, 2, 3, 4]

// Object spread
const pessoa = { nome: 'Ana', idade: 25 };
const endereco = { cidade: 'SP', estado: 'SP' };
const completo = { ...pessoa, ...endereco };
console.log('Completo:', completo);

// Sobrescrever propriedades
const user = { nome: 'João', idade: 30 };
const atualizado = { ...user, idade: 31 };
console.log('Atualizado:', atualizado);

// Em argumentos de função
const numeros = [1, 5, 3, 9, 2];
console.log('Máximo:', Math.max(...numeros));

// Rest parameters
function somar(...nums) {
  return nums.reduce((acc, n) => acc + n, 0);
}
console.log('Soma:', somar(1, 2, 3, 4, 5));`,
    language: 'javascript',
    type: 'correct',
    explanation: 'O spread operator (...) permite expandir arrays/objetos e também agrupar parâmetros (rest).',
    tags: ['spread', 'rest', 'operator', 'es6', 'array', 'objeto'],
    difficulty: 'intermediate'
  },
  {
    id: 'equality-comparison',
    title: 'Comparação: == vs ===',
    code: `// === (estrito) vs == (frouxo)

// Tipos diferentes
console.log(5 == '5');   // true (converte string para número)
console.log(5 === '5');  // false (tipos diferentes)

// Boolean e número
console.log(true == 1);  // true
console.log(true === 1); // false

// null e undefined
console.log(null == undefined);  // true
console.log(null === undefined); // false

// Array e string
console.log([1] == '1'); // true
console.log([1] === '1'); // false

// Recomendação: sempre use ===
const idade = 18;
if (idade === 18) {
  console.log('✅ Idade exata');
}

// Exceção: verificar null/undefined juntos
const valor = null;
if (valor == null) {
  console.log('É null ou undefined');
}`,
    language: 'javascript',
    type: 'correct',
    explanation: 'Diferença crucial entre == (coerção de tipo) e === (comparação estrita). Sempre prefira ===.',
    tags: ['comparação', 'equality', 'operador', 'tipo'],
    difficulty: 'beginner'
  },
  {
    id: 'mutation-error',
    title: 'Mutação de Const (Incorreto)',
    code: `// ❌ Tentando reatribuir const
const PI = 3.14;
PI = 3.14159; // Erro! Não pode reatribuir

// ⚠️ Cuidado: const não torna objetos imutáveis
const pessoa = { nome: 'João' };
pessoa.nome = 'Maria'; // Funciona! Mudou propriedade
pessoa.idade = 30;     // Funciona! Adicionou propriedade

// ❌ Mas não pode reatribuir o objeto todo
pessoa = { nome: 'Pedro' }; // Erro!

// ⚠️ Arrays também são mutáveis
const numeros = [1, 2, 3];
numeros.push(4);  // Funciona!
numeros[0] = 10;  // Funciona!
numeros = [];     // Erro!`,
    language: 'javascript',
    type: 'incorrect',
    explanation: 'Const não impede mutação de objetos/arrays, apenas reatribuição. Para imutabilidade real, use Object.freeze().',
    tags: ['const', 'mutação', 'imutabilidade', 'erro'],
    difficulty: 'intermediate',
    hints: [
      { line: 3, message: 'Const não pode ser reatribuído', type: 'error' },
      { line: 7, message: 'Propriedades de objetos const podem ser alteradas', type: 'warning' },
      { line: 11, message: 'Não pode reatribuir a referência', type: 'error' }
    ]
  }
];