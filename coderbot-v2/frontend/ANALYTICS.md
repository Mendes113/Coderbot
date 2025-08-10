# CoderBot Frontend Analytics

Este documento descreve os eventos de analytics atualmente instrumentados no frontend, seus campos, onde são emitidos e exemplos de uso no PostHog para estudos acadêmicos (aprendizagem) e UX.

## Configuração

- Variáveis de ambiente (Vite):
  - `VITE_PUBLIC_POSTHOG_KEY`
  - `VITE_PUBLIC_POSTHOG_HOST` (ex.: https://us.i.posthog.com)
- Inicialização: feita em `src/App.tsx` (pageview, foco/blur e identify via PocketBase).
- Privacidade: não enviamos conteúdo textual de mensagens/código; apenas metadados (comprimentos, ids, flags, tempos). Para eventos de alta frequência, considere amostragem.

## Catálogo de Eventos

### Engajamento / Rota
- `$pageview`
  - Quando: mudança de rota
  - Propriedades: `path`
  - Origem: `src/App.tsx` (AnalyticsTracker)

- `edu_app_focus` / `edu_app_blur`
  - Quando: visibilidade da aba muda
  - Propriedades: —
  - Origem: `src/App.tsx` (AnalyticsTracker)

### Sessão (Chat)
- `edu_session_start`
  - Quando: entra no chat
  - Propriedades: `route`
  - Origem: `src/components/chat/ChatInterface.tsx`

- `edu_session_end`
  - Quando: sai do chat
  - Propriedades: `route`, `durationMs`
  - Origem: `src/components/chat/ChatInterface.tsx`

- `edu_idle_to_active`
  - Quando: volta da inatividade
  - Propriedades: `idleMs`
  - Origem: `src/components/chat/ChatInterface.tsx`

- `edu_chat_idle_level`
  - Quando: níveis de idle sobem
  - Propriedades: `level`
  - Origem: `src/components/chat/ChatInterface.tsx`

### Chat / IA
- `edu_chat_message_sent`
  - Quando: enviar prompt
  - Propriedades: `length`, `sessionId`, `model`, `methodology`, `diagramsEnabled`, `analogiesEnabled`
  - Origem: `src/components/chat/ChatInterface.tsx`

- `edu_chat_response_received`
  - Quando: resposta chega
  - Propriedades: `sessionId`, `responseLength`, `latencyMs`, `model`, `provider`, `methodology`
  - Origem: `src/components/chat/ChatInterface.tsx`

- `edu_chat_response_failed`
  - Quando: falha (AGNO ou genérica)
  - Propriedades: `kind`, `sessionId`, `model`, `provider`, `methodology`, `latencyMs`
  - Origem: `src/components/chat/ChatInterface.tsx`

- `edu_chat_settings_change`
  - Quando: alterar AI/model/metodologia/diagramas/analogias
  - Propriedades: `setting`, `value`
  - Origem: `src/components/chat/ChatInterface.tsx`

- `edu_remediation_shown`
  - Quando: última questão foi errada e será exibida remediação
  - Propriedades: `questionId`
  - Origem: `src/components/chat/ChatInterface.tsx`

### Quiz / Aprendizagem
- `edu_quiz_start`
  - Quando: quiz aparece
  - Propriedades: `questionId`
  - Origem: `src/components/chat/ChatMessage.tsx`

- `edu_quiz_time_spent`
  - Quando: clique na alternativa
  - Propriedades: `questionId`, `timeMs`
  - Origem: `src/components/chat/ChatMessage.tsx`

- `edu_quiz_answer`
  - Quando: marcar resposta
  - Propriedades: `questionId`, `correct`
  - Origem: `src/components/chat/ChatMessage.tsx`

- `edu_quiz_accuracy`
  - Quando: após cada resposta
  - Propriedades: `correctCount`, `wrongCount`, `accuracy`
  - Origem: `src/components/chat/ChatInterface.tsx`

- `edu_quiz_attempts_to_mastery`
  - Quando: acerto da questão
  - Propriedades: `questionId`, `attempts`
  - Origem: `src/components/chat/ChatInterface.tsx`

### Código / Execução
- `edu_code_copied`
  - Quando: copiar bloco de código
  - Propriedades: `size`
  - Origem: `src/components/chat/ChatMessage.tsx`

- `edu_code_run`
  - Quando: executar código (via backend proxy)
  - Propriedades: `lang`, `path`, `durationMs`, `status`, `success`
  - Origem: `src/components/chat/ChatMessage.tsx`

- `edu_code_downloaded`
  - Quando: baixar código final
  - Propriedades: `lang`, `size`
  - Origem: `src/components/chat/ChatMessage.tsx`

### Plataforma / Performance
- `edu_api_latency`
  - Quando: toda resposta HTTP
  - Propriedades: `method`, `path`, `status`, `durationMs`, `error?`
  - Origem: `src/lib/axios.ts`

## Como usar no PostHog

### Estudos de Aprendizagem
- Acurácia e tempo em tarefa por questão:
  - Trend de `edu_quiz_accuracy` (média de `accuracy`) ao longo do tempo.
  - Trend de `edu_quiz_time_spent` (média de `timeMs`) por `questionId`.
- Domínio por tentativas:
  - Trend de `edu_quiz_attempts_to_mastery` (média de `attempts`) por `questionId`.
- Efeito de remediação:
  - Funil: `edu_quiz_answer (correct=false)` → `edu_remediation_shown` → próxima `edu_quiz_answer (correct=true)` (janela X min).

### UX e Engajamento
- Sessões:
  - Trend de `edu_session_end` (média de `durationMs`).
  - Distribuição de `edu_idle_to_active.idleMs` para detectar fricção.
- Desempenho do chat/LLM:
  - Trend de `edu_chat_response_received.latencyMs` com breakdown por `model`/`methodology`.

### Coortes / Segmentação
- Criar coortes de alta acurácia (ex.: `accuracy >= 0.8` em `edu_quiz_accuracy`).
- Comparar latência de IA e tempo de quiz entre coortes.

### Dashboards sugeridos
- “Aprendizagem”: acurácia média, tempo médio por questão, tentativas até domínio, taxa de acerto pós-remediação.
- “Chat/IA”: latência média por modelo/metodologia, comprimento médio de resposta.
- “Sessão/Engajamento”: duração média de sessão, inatividade média, número de sessões/dia.

### Boas práticas
- Nomeclatura: prefixo `edu_` para eventos educacionais.
- Sem PII/conteúdo: apenas metadados.
- Amostragem: considerar para eventos muito frequentes (ex.: `edu_api_latency`).
- Experimentos: ao habilitar feature flags no PostHog, registrar a variante via `posthog.register`/`identify` e incluir `variant` nos eventos relevantes para comparação.

## Manutenção / Extensões
- Para novos eventos, seguir padrão: Quando, Propriedades, Origem.
- Possíveis extensões:
  - `edu_nav_click` no sidebar; `route_dwell` (tempo por rota).
  - Tags de conceito por questão/exercício para análises por conceito.
  - Exposição/Conversão de experimentos (`edu_experiment_exposure` / `edu_experiment_conversion`).

## Contextos e análises para publicações acadêmicas

Abaixo estão sugestões de questões de pesquisa (RQs), hipóteses e estratégias analíticas que podem ser respondidas com as métricas instrumentadas. São exemplos que podem compor seções de Método/Resultados em artigos científicos.

### 1) Eficácia de remediação orientada por IA
- RQ: Exibir remediação após erro melhora a taxa de acertos subsequentes e reduz tempo por questão?
- Métricas: `edu_quiz_answer` (correct=false → true), `edu_remediation_shown`, `edu_quiz_time_spent`, `edu_quiz_accuracy`.
- Desenho: análise intra-sujeito (pré- vs pós-remediação) e/ou A/B (flag ativando remediação).
- Análises:
  - Regressão logística de efeitos mistos (acerto ~ remediação + (1|aluno) + (1|questão)).
  - Diferença de médias de `timeMs` (pré vs pós) com modelos lineares de efeitos mistos.
- Relatos: Odds ratio com IC95%, redução média de `timeMs`, tamanho de efeito (Cohen’s d) e p-valores.

### 2) Curvas de aprendizagem por conceito
- RQ: Quantas tentativas são necessárias até a maestria? Como evolui o tempo por questão?
- Métricas: `edu_quiz_attempts_to_mastery`, `edu_quiz_time_spent`, (opcional: tags de conceito).
- Desenho: séries temporais por estudante/questão; comparar conceitos.
- Análises:
  - Ajuste de power-law/exponencial para tempo por tentativa.
  - Modelos de sobrevivência até a maestria (evento = acerto; tempo = tentativas).
- Relatos: mediana de tentativas, hazard ratios por conceito, gráficos de Kaplan-Meier.

### 3) Engajamento e autorregulação (SRL)
- RQ: Padrões de engajamento (duração, inatividade) predizem acurácia?
- Métricas: `edu_session_end.durationMs`, `edu_idle_to_active.idleMs`, `edu_chat_idle_level`, `edu_quiz_accuracy`.
- Desenho: coletas longitudinais por sessão; clustering de perfis de engajamento.
- Análises:
  - Regressão (accuracy ~ duration + idleMs + nível de idle) com efeitos mistos.
  - Clusterização (k-means/HDBSCAN) de vetores [duration, idleMs, mensagens] e comparação de acurácia entre clusters.
- Relatos: perfis de estudo, diferenças de acurácia entre perfis, gráficos de densidade/boxplots.

### 4) Impacto de latência de IA na experiência e no desempenho
- RQ: Latências maiores (LLM/API) degradam o desempenho/engajamento?
- Métricas: `edu_chat_response_received.latencyMs`, `edu_api_latency.durationMs`, `edu_session_end.durationMs`, `edu_quiz_accuracy`.
- Desenho: observacional com controle de confundidores (modelo, metodologia, coorte).
- Análises:
  - Modelos lineares/generalizados com efeitos mistos; termos de interação (latência × modelo).
  - Binning de latência e comparação de métricas (acurácia, duração de sessão) por faixas.
- Relatos: coeficientes padronizados, intervalos de confiança, gráficos de resposta parcial.

### 5) Prática de código e resultados
- RQ: Quantas execuções até sucesso e qual o custo temporal?
- Métricas: `edu_code_run` (success, durationMs, status), `edu_code_downloaded`.
- Desenho: sequência de execuções por bloco/linguagem.
- Análises:
  - Regressão de contagem para runs até sucesso; análise de sobrevivência até sucesso.
  - Comparações por linguagem (efeitos fixos/aleatórios).
- Relatos: média de runs até sucesso, distribuição de `durationMs` e taxa de sucesso por linguagem.

### 6) Retenção e continuidade
- RQ: Intervenções aumentam tempo de estudo e retornos?
- Métricas: `edu_session_end.durationMs`, `$pageview`, (opcional: dias ativos por usuário).
- Desenho: séries temporais/segmento experimental (feature flag).
- Análises:
  - DAU/WAU, tempo médio por sessão; diferença-em-diferenças em rollouts graduais.
- Relatos: variação percentual, ICs, gráficos de tendência.

### 7) UX/usabilidade
- RQ: Quais fluxos geram mais fricção e inatividade?
- Métricas: `edu_idle_to_active.idleMs`, `edu_api_latency`, (opcional: `edu_flow_completion`).
- Desenho: mapeamento por fluxo/tela (rota).
- Análises:
  - Heatmaps de inatividade por rota; correlações latência×abandono.
- Relatos: hotspots de UX, recomendações de melhoria.

## Mapeamento de construtos → métricas → modelos
- Engajamento: `durationMs`, `idleMs`, `$pageview` → modelos lineares/mistos; clustering de perfis.
- Desempenho: `accuracy`, `attempts`, `timeMs` → regressão logística/lineares; sobrevivência.
- Eficácia da intervenção: `remediation_shown` → pré-pós e A/B; mixed-effects.
- Desempenho técnico: `latencyMs` (LLM/API) → regressões com controles.

## Desenhos experimentais e validade
- A/B via feature flags do PostHog: registrar `variant` nos eventos relevantes e definir OECs (ex.: `accuracy`, `timeMs`).
- Controle de confundidores: papel (aluno/professor), classe/coorte, modelo, dificuldade.
- Ameaças à validade: viés de seleção, não-independência (efeitos por aluno/questão), missing data; usar efeitos mistos e múltiplas imputações quando aplicável.
- Ética/privacidade: consentimento/TCLE quando necessário, anonimização e retenção mínima.

## Exemplos de consultas/análises no PostHog
- Tendências: média de `edu_quiz_accuracy.accuracy` por semana; breakdown por `methodology`.
- Funis: `edu_quiz_answer(correct=false)` → `edu_remediation_shown` → `edu_quiz_answer(correct=true)` (janela 30 min).
- Coortes: estudantes com `accuracy ≥ 0.8` nas últimas 4 semanas; comparar `latencyMs` entre coortes.

## Boas práticas para artigos
- Pré-registro de hipóteses e OECs; cálculo de poder amostral.
- Reportar tamanhos de efeito e ICs (não apenas p-valores).
- Reprodutibilidade: descrever mapeamento evento→variável e passos de pré-processamento.
- Transparência: discutir limitações (ex.: proxies de carga cognitiva) e validade externa.