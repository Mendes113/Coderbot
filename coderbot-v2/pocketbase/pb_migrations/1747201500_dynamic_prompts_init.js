/// <reference path="../pb_data/types.d.ts" />

/**
 * 1747201500_dynamic_prompts_init.js
 * Cria a coleção "dynamic_prompts" (se não existir) e
 * insere 3 templates de Pensamento Sequencial.
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
        fields:[
          { name:"name",        type:"text",   required:true, unique:true },
          { name:"methodology", type:"text",   required:true },
          { name:"template",    type:"text",   required:true },
          { name:"description", type:"text" },
          { name:"version",     type:"number", options:{ noDecimal:true } },
          { name:"is_active",   type:"bool" },
        ],
      });
      app.save(coll);
    }

    /* 2. Templates ---------------------------------------------------- */
    const sequentialThinking = `Você é um especialista em explicação sequencial.
…texto completo…`;

    const problemSolving = `Você é um especialista em resolução estruturada…
…texto completo…`;

    const debugging = `Você é um especialista em debugging estruturado…
…texto completo…`;

    const data = [
      ["default_sequential_thinking", sequentialThinking,
       "Template padrão para explicações com Pensamento Sequencial"],
      ["problem_solving_sequential",  problemSolving,
       "Template para resolução de problemas com Pensamento Sequencial"],
      ["debugging_sequential",        debugging,
       "Template para debugging estruturado com Pensamento Sequencial"],
    ];

    data.forEach(([name, tpl, desc]) => {
      let rec;
      try {
        rec = app.findFirstRecordByData(coll.id, "name", name);
      } catch {
        rec = new Record(coll);
        rec.set("name", name);
      }
      rec.set("methodology", "sequential_thinking");
      rec.set("template",    tpl);
      rec.set("description", desc);
      rec.set("version",     1);
      rec.set("is_active",   true);
      app.save(rec);
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
