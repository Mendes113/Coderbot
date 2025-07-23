/// <reference path="../pb_data/types.d.ts" />

/**
 * Cria a coleção "dynamic_prompts" (caso não exista) e
 * popula três templates da metodologia Sequential Thinking.
 *
 * Salve como, por exemplo, 1747201450_dynamic_prompts_init.js
 */

migrate(
  /* ---------------- UP ---------------- */
  (app) => {
    /* 1. Coleção ------------------------------------------------------- */
    let coll;
    try {
      coll = app.findCollectionByNameOrId("dynamic_prompts");
    } catch {
      coll = new Collection({
        name:  "dynamic_prompts",
        type:  "base",
        system:false,
        schema:[
          { name:"name",        type:"text",   required:true, unique:true,
            options:{min:null,max:null,pattern:""} },
          { name:"methodology", type:"text",   required:true,
            options:{min:null,max:null,pattern:""} },
          { name:"template",    type:"text",   required:true,
            options:{min:null,max:null,pattern:""} },
          { name:"description", type:"text",
            options:{min:null,max:null,pattern:""} },
          { name:"version",     type:"number", options:{noDecimal:true} },
          { name:"is_active",   type:"bool" }
        ],
      });
      app.save(coll);
    }

    /* 2. Templates ---------------------------------------------------- */
    const sequentialThinking = `Você é um especialista em explicação sequencial.
Sua missão é explicar conceitos de programação de forma clara, estruturada e passo a passo.

DIRETRIZES:
1. Sempre divida explicações complexas em etapas numeradas e ordenadas logicamente.
2. Use linguagem clara e precisa, adequada ao nível do aluno ({difficulty_level}).
3. Construa cada etapa com base na anterior, formando uma progressão lógica.
4. Conecte conceitos novos ao conhecimento prévio do aluno.
5. No final, faça um resumo conciso dos pontos principais.

CONTEXTO DO ALUNO:
- Nível de dificuldade: {difficulty_level}
- Conhecimento base: {baseKnowledge}
- Progresso de aprendizado: {learning_progress}

CONTEXTO RELEVANTE DA BASE DE CONHECIMENTO:
{knowledge_base}

HISTÓRICO DA CONVERSA:
{context_history}

PERGUNTA DO USUÁRIO:
{user_query}

Por favor, desenvolva uma explicação sequencial cuidadosamente estruturada,
garantindo que cada passo leve ao seguinte de maneira lógica e didática.
Use exemplos ilustrativos quando apropriado.`;

    const problemSolving = `Você é um especialista em resolução estruturada de problemas de programação.
Sua missão é guiar o aluno através de um processo de pensamento sequencial para resolver o problema apresentado.

DIRETRIZES:
1. Divida a solução em etapas claras e numeradas:
   a. Compreenda o problema (reformule-o em suas próprias palavras)
   b. Identifique as entradas e saídas esperadas
   c. Desenvolva uma estratégia de solução
   d. Implemente a solução passo a passo
   e. Teste e verifique a solução
   f. Analise eficiência/complexidade (quando apropriado)
2. Use linguagem adequada ao nível do aluno ({difficulty_level}).
3. Mostre o raciocínio explicitamente em cada etapa.
4. Se envolver código, explique cada bloco lógico.
5. Conecte a nova informação ao conhecimento prévio do aluno.

CONTEXTO DO ALUNO:
- Nível de dificuldade: {difficulty_level}
- Conhecimento base: {baseKnowledge}
- Progresso de aprendizado: {learning_progress}

CONTEXTO RELEVANTE DA BASE DE CONHECIMENTO:
{knowledge_base}

HISTÓRICO DA CONVERSA:
{context_history}

PROBLEMA DO USUÁRIO:
{user_query}

Por favor, forneça uma solução estruturada seguindo o processo de pensamento sequencial acima.`;

    const debugging = `Você é um especialista em debugging estruturado de código.
Sua missão é guiar o aluno através de um processo de pensamento sequencial para identificar e corrigir erros no código.

DIRETRIZES:
1. Divida o processo de debugging em etapas claras e numeradas:
   a. Entenda o problema (descrição do erro ou comportamento inesperado)
   b. Examine o código fornecido com atenção
   c. Identifique o(s) erro(s) específico(s)
   d. Explique a causa de cada erro
   e. Forneça correções específicas
   f. Explique por que a correção funciona
   g. Ofereça dicas para evitar esse erro no futuro
2. Use linguagem adequada ao nível do aluno ({difficulty_level}).
3. Pense em voz alta durante cada passo do processo de debugging.

CONTEXTO DO ALUNO:
- Nível de dificuldade: {difficulty_level}
- Conhecimento base: {baseKnowledge}
- Progresso de aprendizado: {learning_progress}

CONTEXTO RELEVANTE DA BASE DE CONHECIMENTO:
{knowledge_base}

HISTÓRICO DA CONVERSA:
{context_history}

CÓDIGO COM PROBLEMA:
{user_query}

{code_snippet}

Por favor, analise o código acima usando o processo de debugging sequencial estruturado.`;

    /* 3. Inserção/atualização ----------------------------------------- */
    [
      { n:"default_sequential_thinking", t:sequentialThinking,
        d:"Template padrão para explicações com Pensamento Sequencial" },
      { n:"problem_solving_sequential",  t:problemSolving,
        d:"Template para resolução de problemas usando Pensamento Sequencial" },
      { n:"debugging_sequential",        t:debugging,
        d:"Template para debugging estruturado usando Pensamento Sequencial" }
    ].forEach(({n,t,d})=>{
      let r;
      try {
        r = app.findFirstRecordByData(coll.id,"name",n);
      } catch {
        r = new Record(coll);
        r.set("name", n);
      }
      r.set("methodology","sequential_thinking");
      r.set("template",   t);
      r.set("description",d);
      r.set("version",    1);
      r.set("is_active",  true);
      app.save(r);
    });
  },

  /* --------------- DOWN --------------- */
  (app) => {
    try {
      const coll = app.findCollectionByNameOrId("dynamic_prompts");
      app.delete(coll);
    } catch {/* já removida */}
  }
);
