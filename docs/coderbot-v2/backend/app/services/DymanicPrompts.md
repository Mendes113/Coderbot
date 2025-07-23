# Esquema do PocketBase

Este documento descreve o esquema das coleções utilizadas no PocketBase para este projeto.

## Coleção: `dynamic_prompts`

Armazena templates de prompts customizáveis para a IA.

| Campo         | Tipo    | Obrigatório | Único | Padrão | Descrição                                                                 |
|---------------|---------|-------------|-------|--------|---------------------------------------------------------------------------|
| `id`          | text    | Sim (auto)  | Sim   |        | Identificador único do registro (gerado pelo PocketBase)                  |
| `created`     | datetime| Sim (auto)  |       |        | Data e hora de criação do registro (gerado pelo PocketBase)             |
| `updated`     | datetime| Sim (auto)  |       |        | Data e hora da última atualização (gerado pelo PocketBase)                |
| `name`        | text    | Sim         | Sim   |        | Identificador textual único para o prompt (ex: "explain_code_analogy")    |
| `methodology` | text    | Sim         |       |        | Metodologia de ensino associada (ex: "analogy", "sequential_thinking") |
| `template`    | text    | Sim         |       |        | O template do prompt em si, com placeholders (ex: `{user_query}`)         |
| `description` | text    | Não         |       |        | Descrição da finalidade e uso do prompt                                   |
| `version`     | number  | Não         |       | `1`    | Número da versão do prompt, para controle de alterações                   |
| `is_active`   | boolean | Não         |       | `true` | Indica se o prompt está ativo e pode ser usado                            |

**Exemplo de placeholders no `template`:**
*   `{user_query}`: A pergunta ou entrada do usuário.
*   `{context_history}`: O histórico da conversa atual.
*   `{knowledge_base}`: Informações de uma base de conhecimento RAG.
*   `{code_snippet}`: Um trecho de código fornecido pelo usuário.
*   `{difficulty_level}`: Nível de dificuldade desejado.
*   `{subject_area}`: Área de conhecimento.
*   `{style_preference}`: Preferência de estilo da resposta.
*   `{learning_progress}`: Progresso do aprendizado do aluno.
*   `{baseKnowledge}`: Conhecimento base do aluno.

## Coleção: `conversation_sessions`

Armazena o histórico das conversas entre o usuário e a IA.

| Campo         | Tipo    | Obrigatório | Único | Padrão | Descrição                                                                 |
|---------------|---------|-------------|-------|--------|---------------------------------------------------------------------------|
| `id`          | text    | Sim (auto)  | Sim   |        | Identificador único do registro (gerado pelo PocketBase)                  |
| `created`     | datetime| Sim (auto)  |       |        | Data e hora de criação do registro (gerado pelo PocketBase)             |
| `updated`     | datetime| Sim (auto)  |       |        | Data e hora da última atualização (gerado pelo PocketBase)                |
| `session_id`  | text    | Sim         |       |        | Identificador único para uma sessão de conversa específica                |
| `user_id`     | relation| Não         |       |        | Relacionamento com a coleção `users` (opcional, se houver usuários)       |
| `timestamp`   | datetime| Sim         |       |        | Data e hora em que a mensagem foi enviada/recebida                        |
| `role`        | select  | Sim         |       |        | Quem enviou a mensagem. Opções: "user", "ai"                             |
| `content`     | text    | Sim         |       |        | O conteúdo da mensagem                                                    |
| `order`       | number  | Sim         |       |        | Ordem da mensagem dentro da sessão para reconstruir o histórico           |
| `metadata`    | json    | Não         |       |        | Dados adicionais sobre a mensagem (ex: tokens usados, feedback)           |

**Regras de API (Exemplos - a serem configuradas no PocketBase):**

*   **`dynamic_prompts`**:
    *   Administradores: Acesso total (CRUD).
    *   Usuários autenticados (ou público, se aplicável): Apenas leitura (`list`, `view`).
*   **`conversation_sessions`**:
    *   Administradores: Acesso total.
    *   Usuários autenticados: Criar (`create`), Listar (`list`) e Ver (`view`) apenas os *seus próprios* registros (usando regras de filtro como `@request.auth.id = user_id`).

Lembre-se de criar estas coleções e configurar os campos e permissões diretamente na interface de administração do seu PocketBase.