# CoderBot Frontend Analytics (Guia de Engenharia)

Este documento descreve a arquitetura, convenções, catálogo de eventos, mapeamento de origem, práticas de privacidade, monitoramento e diretrizes de contribuição para o sistema de analytics do frontend.

## Visão Geral

O sistema de analytics coleta métricas de:
- Fluxos de aprendizagem (quiz, acurácia, remediação)
- Interações com IA (latência, configuração pedagógica)
- Sessões e engajamento (tempo de sessão, inatividade)
- Execução de código (runs, sucesso/erro, duração)
- Performance de plataforma (latência HTTP)

Os eventos são enviados ao PostHog via SDK do frontend (posthog-js). Não capturamos conteúdo sensível (texto de mensagens/código); somente metadados.

## Objetivos e Não-Objetivos
- Objetivos
  - Suportar estudos acadêmicos (aprendizagem, SRL, remediação) e UX (usabilidade, desempenho percebido)
  - Fornecer eventos consistentes e estáveis para análises de coortes, funis e A/B testing
  - Minimizar acoplamento com UI e garantir renderização robusta no frontend
- Não-Objetivos
  - Telemetria de conteúdo textual do usuário (PII/PHI)
  - Instrumentação de baixo nível de componentes visuais sem valor analítico

## Arquitetura de Telemetria
- Fontes
  - React Router (pageviews, dwell) e listeners (visibility)
  - Componentes de chat/quiz/código
  - Interceptadores HTTP (axios)
- Camada de coleta
  - SDK posthog-js inicializado em `src/App.tsx`
  - Hook utilitário opcional em `src/hooks/useAnalytics.ts`
- Transporte e armazenamento
  - Host PostHog configurável por env (Vite)
- Observabilidade
  - Dashboards e queries no PostHog (trends, funis, coortes)

## Configuração de Ambientes
- Variáveis (Vite):
  - `VITE_PUBLIC_POSTHOG_KEY`
  - `VITE_PUBLIC_POSTHOG_HOST` (ex.: https://us.i.posthog.com)
- Inicialização: `src/App.tsx` (pageview, foco/blur, identify por PocketBase)
- Docker Compose: variáveis mapeadas em `docker-compose.optimized.yml`

## Convenções e Padrões
- Nome de evento: prefixo `edu_` para eventos educacionais; `$pageview` do PostHog permanece
- Propriedades: snake_case/`camelCase` conforme código; evitar PII
- Semântica estável: não renomear propriedades sem versionar
- Versionamento (quando necessário): sufixos `_v2` para quebras de contrato
- Sampling: considerar para eventos de alta frequência (ex.: `edu_api_latency`)

## Esquema de Evento (contrato mínimo)
- Campos comuns recomendados
  - `questionId` (para quiz), `sessionId` (chat), `model`/`provider` (LLM), `methodology`
  - Medidas: `timeMs`, `durationMs`, `latencyMs`, `attempts`, `accuracy`
  - Flags: `success`, `error`, `diagramsEnabled`, `analogiesEnabled`
- Campos reservados do PostHog: `$pageview`, `distinct_id`, timestamp

## Mapa de Origem (event → arquivo)
- App/Router: `src/App.tsx` → `$pageview`, `edu_app_focus`, `edu_app_blur`
- Sessão/Chat: `src/components/chat/ChatInterface.tsx` → `edu_session_start`, `edu_session_end`, `edu_idle_to_active`, `edu_chat_*`, `edu_quiz_accuracy`, `edu_quiz_attempts_to_mastery`, `edu_remediation_shown`
- Quiz: `src/components/chat/ChatMessage.tsx` → `edu_quiz_start`, `edu_quiz_time_spent`, `edu_quiz_answer`, `edu_code_*`
- Plataforma: `src/lib/axios.ts` → `edu_api_latency`

## Catálogo de Eventos

### Engajamento / Rota
- `$pageview`: mudança de rota — props: `path` — origem: `App.tsx`
- `edu_app_focus` / `edu_app_blur`: visibilidade de aba — origem: `App.tsx`

### Sessão (Chat)
- `edu_session_start`: entra no chat — props: `route` — origem: `ChatInterface.tsx`
- `edu_session_end`: sai do chat — props: `route`, `durationMs` — origem: `ChatInterface.tsx`
- `edu_idle_to_active`: volta da inatividade — props: `idleMs` — origem: `ChatInterface.tsx`
- `edu_chat_idle_level`: nível de idle — props: `level` — origem: `ChatInterface.tsx`

### Chat / IA
- `edu_chat_message_sent`: prompt enviado — props: `length`, `sessionId`, `model`, `methodology`, `diagramsEnabled`, `analogiesEnabled`
- `edu_chat_response_received`: resposta do LLM — props: `sessionId`, `responseLength`, `latencyMs`, `model`, `provider`, `methodology`
- `edu_chat_response_failed`: falha — props: `kind`, `sessionId`, `model`, `provider`, `methodology`, `latencyMs`
- `edu_chat_settings_change`: troca de configuração — props: `setting`, `value`
- `edu_remediation_shown`: remediação após erro — props: `questionId`

### Quiz / Aprendizagem
- `edu_quiz_start`: exibição do quiz — props: `questionId`
- `edu_quiz_time_spent`: tempo até resposta — props: `questionId`, `timeMs`
- `edu_quiz_answer`: resposta marcada — props: `questionId`, `correct`
- `edu_quiz_accuracy`: agregação por sessão — props: `correctCount`, `wrongCount`, `accuracy`
- `edu_quiz_attempts_to_mastery`: tentativas até acerto — props: `questionId`, `attempts`

### Código / Execução
- `edu_code_copied`: cópia de bloco — props: `size`
- `edu_code_run`: execução (backend proxy) — props: `lang`, `path`, `durationMs`, `status`, `success`
- `edu_code_downloaded`: download do código final — props: `lang`, `size`

### Plataforma / Performance
- `edu_api_latency`: resposta HTTP — props: `method`, `path`, `status`, `durationMs`, `error?`

## Lifecycles Principais
- Quiz
  1) `edu_quiz_start` → 2) `edu_quiz_time_spent` + `edu_quiz_answer` → 3) `edu_quiz_accuracy` (agregado) → 4) `edu_quiz_attempts_to_mastery` (no acerto)
- Remediação
  - `edu_quiz_answer(correct=false)` → `edu_remediation_shown` → próxima `edu_quiz_answer`
- Chat/LLM
  - `edu_chat_message_sent` → `edu_chat_response_received`/`edu_chat_response_failed`
- Sessões
  - `edu_session_start` → atividades → `edu_session_end`

## Como Usar no PostHog
- Estudos de aprendizagem
  - Trends de acurácia (`edu_quiz_accuracy.accuracy`) e tempo por questão (`edu_quiz_time_spent.timeMs`)
  - Funil de remediação: `answer(false)` → `edu_remediation_shown` → `answer(true)`
- UX/Engajamento
  - Duração de sessão (`edu_session_end.durationMs`) e inatividade (`edu_idle_to_active.idleMs`)
  - Latência LLM/API vs métricas de estudo
- Coortes
  - Alta acurácia (>= 0.8) vs baixa — comparar `latencyMs`, `timeMs`
- Dashboards
  - Aprendizagem, Chat/IA, Sessão/Engajamento

## Privacidade e Compliance
- Sem PII/conteúdo textual de mensagens/código; apenas metadados
- Amostragem para eventos muito frequentes
- Considere consentimento/TCLE quando necessário; retenção mínima

## Testes e Validação
- Local
  - DevTools Network: checar requests a `.../e/` com eventos `edu_*`
  - Console: `posthog.debug(true)`; `posthog.capture('edu_smoke')`
- QA
  - Verificação cruzada de trends vs logs de aplicação
  - Ensaios de fluxo (quiz, remediação, execução de código)

## Diretrizes de Contribuição (Como adicionar um evento)
1. Defina objetivo e propriedades (sem PII)
2. Emita o evento no componente/serviço correto
3. Atualize este documento (evento, propriedades, origem)
4. Crie queries/dashboards de validação no PostHog
5. Faça roll-out controlado (se necessário, via flag) e monitore

## Extensões Futuras
- `edu_nav_click` e `route_dwell` (tempo por rota)
- Tags de conceito em eventos de quiz
- Exposição/Conversão de experimentos (`edu_experiment_exposure`/`edu_experiment_conversion`)

---

## Apêndice: Exemplos de Análises para Publicação

### RQs e desenhos sugeridos
- Remediação orientada por IA: pré–pós/A-B com `remediation_shown`
- Curvas de aprendizagem: `attempts_to_mastery` e `timeMs` por tentativa
- SRL/Engajamento: duração/inatividade predizendo `accuracy`
- Latência: impacto de `latencyMs` em `accuracy` e engajamento

### Modelagem
- Efeitos mistos (aluno/questão), sobrevivência, regressões, clustering

### Boas práticas
- Pré-registro, OECs, ICs/tamanhos de efeito, reprodutibilidade e limitações

## Tabela de Métricas (ID x Utilidade)

| ID                           | Utilidade                                                                                   |
|------------------------------|----------------------------------------------------------------------------------------------|
| $pageview                    | Medir navegação entre rotas para análise de fluxo e engajamento por página                   |
| edu_app_focus                | Detectar retomada de atenção à aba para estimar engajamento ativo                            |
| edu_app_blur                 | Detectar perda de foco/atenção para entender interrupções                                    |
| edu_session_start            | Delimitar início da sessão no chat para métricas de sessão                                   |
| edu_session_end              | Calcular duração da sessão e encerrar janelas de análise                                     |
| edu_idle_to_active           | Medir tempo de inatividade e retomada (fricção/pausas)                                       |
| edu_chat_idle_level          | Classificar intensidade de inatividade (mild/moderate/high)                                  |
| edu_chat_session_created     | Rastrear criação de sessão de chat (nova conversa)                                           |
| edu_chat_session_loaded      | Rastrear carregamento/retomada de sessão existente                                           |
| edu_chat_message_sent        | Contabilizar prompts enviados e suas configurações pedagógicas                               |
| edu_chat_response_received   | Medir latência/resposta do LLM e relacionar com metodologia/modelo                           |
| edu_chat_response_failed     | Diagnosticar falhas (AGNO/genérica) e seus tempos                                            |
| edu_chat_settings_change     | Auditar mudanças de configuração pedagógica (modelo, metodologia, diagramas, analogias)      |
| edu_remediation_shown        | Marcar exibição de remediação após erro para avaliar impacto                                 |
| edu_quiz_start               | Início do ciclo de uma questão (delimitar tempo em tarefa)                                   |
| edu_quiz_time_spent          | Tempo até resposta por questão (carga/fluência)                                              |
| edu_quiz_answer              | Resultado por questão (acerto/erro) para análises pontuais                                   |
| edu_quiz_accuracy            | Acurácia agregada da sessão (correto/errado/accuracy)                                        |
| edu_quiz_attempts_to_mastery | Tentativas até acerto (curva de aprendizagem/maestria)                                       |
| edu_code_copied              | Medir interesse/uso de trechos de código                                                     |
| edu_code_run                 | Desempenho de execução (duração, status, sucesso) por linguagem                              |
| edu_code_downloaded          | Exportação de solução final (adoção/prontidão)                                               |
| edu_api_latency              | Latência e status de chamadas HTTP para diagnóstico de performance                           |