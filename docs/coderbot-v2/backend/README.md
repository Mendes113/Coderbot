# Backend do Chatbot Educacional

Este é o backend para o Chatbot Educacional, uma plataforma de IA para ensino de programação que utiliza diferentes metodologias educacionais, incluindo pensamento sequencial (sequential thinking), analogias, método socrático, e outros.

## 🌟 Principais Características

- **Prompts Customizáveis**: Todos os prompts são armazenados no PocketBase e podem ser facilmente personalizados
- **Metodologias Educacionais**: Suporte para diferentes abordagens pedagógicas:
  - **Sequential Thinking**: Explicações passo-a-passo em sequência lógica
  - **Analogias**: Explicações que usam comparações com conceitos familiares
  - **Método Socrático**: Guia de pensamento crítico através de perguntas
  - **Scaffolding**: Suporte adaptativo baseado no nível do aluno
- **RAG (Retrieval Augmented Generation)**: Enriquecimento de respostas com conhecimento contextual
- **Arquitetura SOLID**: Serviços modularizados seguindo princípios de design de software
- **Integração com vários LLMs**: OpenAI, Claude, DeepSeek, e outros

## 🏗️ Arquitetura

A arquitetura do backend segue princípios SOLID de modularidade e responsabilidade única:

```
app/
├── config.py                 # Configurações centralizadas
├── main.py                   # Ponto de entrada da aplicação
├── models/                   # Modelos de dados e validação
├── routers/                  # Endpoints da API
│   ├── educational_chat_router.py   # Rotas para chat educacional
│   └── ...
└── services/                 # Serviços de negócio
    ├── educational_methodology_service.py   # Implementa metodologias educacionais
    ├── orchestration_service.py            # Orquestração do fluxo completo
    ├── prompt_loader.py                    # Carregamento de prompts do PocketBase
    ├── rag_service.py                      # Serviço de Retrieval Augmented Generation
    └── ...
```

### Fluxo de Processamento

1. O usuário envia uma pergunta através da API
2. O `OrchestrationService` coordena o fluxo:
   - Recupera o histórico da conversa
   - Busca conhecimento contextual via `RAGService`
   - Aplica a metodologia educacional selecionada via `EducationalMethodologyService`
   - Formata o prompt final usando `PromptLoader`
   - Envia para o LLM
   - Salva a interação no histórico
3. A resposta é retornada ao usuário

## 💾 Esquema do PocketBase

### Coleção: `dynamic_prompts`

Armazena templates de prompts customizáveis para a IA.

| Campo         | Tipo    | Obrigatório | Único | Padrão | Descrição                                                               |
|---------------|---------|-------------|-------|--------|-------------------------------------------------------------------------|
| `name`        | text    | Sim         | Sim   |        | Identificador textual único para o prompt                               |
| `methodology` | text    | Sim         |       |        | Metodologia de ensino associada                                         |
| `template`    | text    | Sim         |       |        | O template do prompt em si, com placeholders (ex: `{user_query}`)       |
| `description` | text    | Não         |       |        | Descrição da finalidade e uso do prompt                                 |
| `version`     | number  | Não         |       | `1`    | Número da versão do prompt, para controle de alterações                 |
| `is_active`   | boolean | Não         |       | `true` | Indica se o prompt está ativo e pode ser usado                          |

### Coleção: `conversation_sessions`

Armazena o histórico das conversas entre o usuário e a IA.

| Campo        | Tipo     | Descrição                                                  |
|--------------|----------|--------------------------------------------------------------|
| `session_id` | text     | Identificador único para uma sessão de conversa específica   |
| `user_id`    | relation | Relacionamento com a coleção `users` (opcional)              |
| `timestamp`  | datetime | Data e hora em que a mensagem foi enviada/recebida           |
| `role`       | select   | Quem enviou a mensagem. Opções: "user", "ai"                 |
| `content`    | text     | O conteúdo da mensagem                                       |
| `order`      | number   | Ordem da mensagem dentro da sessão                           |

## 🚀 Começando

### Pré-requisitos

- Python 3.8+
- PocketBase 0.18+ 
- Chaves de API para LLMs (OpenAI, Claude, etc.)

### Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure o arquivo `.env` com as variáveis de ambiente:
   ```
   POCKETBASE_URL=http://127.0.0.1:8090
   POCKETBASE_ADMIN_EMAIL=seu_email@example.com
   POCKETBASE_ADMIN_PASSWORD=sua_senha_segura
   OPEN_AI_API_KEY=sua_chave_api_openai
   CLAUDE_API_KEY=sua_chave_api_claude
   ```

4. Inicie o PocketBase:
   ```bash
   cd pocketbase_0.27.2_linux_amd64
   ./pocketbase serve
   ```

5. Execute o backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

## 📚 APIs Principais

### Chat Educacional

- `POST /chat/completions`: Endpoint principal para interação com o chat
- `GET /chat/methodologies`: Lista metodologias educacionais disponíveis
- `POST /chat/sessions`: Cria uma nova sessão de chat
- `GET /chat/completions/{session_id}/history`: Recupera histórico de conversa

### Exemplo de uso:

```python
import requests
import json

# Configurações
url = "http://localhost:8000/chat/completions"
headers = {"Content-Type": "application/json"}

# Dados do request
data = {
    "messages": [
        {"role": "user", "content": "Explique como funcionam closures em JavaScript"}
    ],
    "model": "gpt-4",
    "methodology": "sequential_thinking",  # Usar pensamento sequencial
    "user_profile": {
        "difficulty_level": "intermediate",
        "baseKnowledge": "Tenho conhecimento básico de JavaScript",
        "subject_area": "web development"
    }
}

# Enviar requisição
response = requests.post(url, headers=headers, data=json.dumps(data))
print(response.json())
```

## 🛠️ Customizando Prompts

Para adicionar ou modificar prompts:

1. Acesse o admin do PocketBase (`http://localhost:8090/_/`)
2. Vá para a coleção `dynamic_prompts`
3. Adicione ou edite um prompt, definindo:
   - `name`: Nome único para o prompt
   - `methodology`: Uma das metodologias suportadas
   - `template`: O texto do prompt com placeholders
   - `is_active`: Define se o prompt está ativo

## 🔧 Adicionando Novas Metodologias

Para adicionar uma nova metodologia educacional:

1. Atualize o enum `MethodologyType` no arquivo `educational_methodology_service.py`
2. Adicione lógica específica para a nova metodologia no método `_process_methodology_specific`
3. Crie templates de prompt para a nova metodologia no PocketBase
4. Atualize o método `get_available_methodologies` para incluir a nova metodologia

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Faça um fork do projeto
2. Crie sua feature branch: `git checkout -b minha-nova-feature`
3. Commit suas mudanças: `git commit -m 'Adiciona alguma feature'`
4. Push para a branch: `git push origin minha-nova-feature`
5. Envie um pull request