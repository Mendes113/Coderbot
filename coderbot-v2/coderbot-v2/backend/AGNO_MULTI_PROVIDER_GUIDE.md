# Guia de Suporte Multi-Provedor AGNO

Este guia demonstra como usar o sistema AGNO com múltiplos provedores de IA, incluindo OpenAI e Claude (Anthropic).

## 🚀 Visão Geral

O sistema AGNO agora suporta múltiplos provedores de modelos de linguagem grandes (LLMs):
- **OpenAI**: GPT-3.5, GPT-4, GPT-4o, O3-mini
- **Claude (Anthropic)**: Claude-3 (Opus, Sonnet, Haiku), Claude-3.5, Claude Sonnet-4

## 📦 Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# OpenAI (obrigatório)
OPEN_AI_API_KEY=sk-your-openai-api-key

# Claude (opcional)
CLAUDE_API_KEY=sk-ant-your-claude-api-key
CLAUDE_API_URL=https://api.anthropic.com
```

### 2. Dependências

As dependências já estão incluídas no `pyproject.toml`:
- `anthropic>=0.51.0` para Claude
- `openai>=1.79.0` para OpenAI
- `agno>=1.5.1` para o framework AGNO

## 🎯 Uso Básico

### Inicializando com Diferentes Provedores

```python
from app.services.agno_service import AgnoService
from app.services.agno_methodology_service import MethodologyType

# Usar OpenAI (padrão)
agno_openai = AgnoService(model_id="gpt-4o")

# Usar Claude especificando o provedor
agno_claude = AgnoService(model_id="claude-3-5-sonnet", provider="claude")

# Auto-detecção baseada no model_id
agno_auto_claude = AgnoService(model_id="claude-sonnet-4")  # Detecta automaticamente como 'claude'
agno_auto_openai = AgnoService(model_id="gpt-4o")  # Detecta automaticamente como 'openai'
```

### Fazendo Perguntas

```python
# Usando diferentes metodologias
response = agno_claude.get_worked_example(
    user_query="Como implementar uma função recursiva para calcular fibonacci?",
    context="Estamos aprendendo recursão em Python"
)

response = agno_openai.get_socratic_response(
    user_query="O que é programação orientada a objetos?",
    context="Aula sobre paradigmas de programação"
)
```

## 🔄 Alternando Entre Provedores

### Trocar Modelo Dinamicamente

```python
agno = AgnoService()

# Ver informações do modelo atual
current_info = agno.get_current_model_info()
print(f"Modelo atual: {current_info['provider']}/{current_info['model_id']}")

# Trocar para Claude
agno.switch_model("claude-3-5-sonnet", "claude")

# Trocar para OpenAI
agno.switch_model("gpt-4o", "openai")

# Auto-detecção de provedor
agno.switch_model("claude-sonnet-4")  # Detecta automaticamente como Claude
```

### Listar Modelos Disponíveis

```python
# Ver todos os provedores
providers = agno.get_available_providers()
print(f"Provedores disponíveis: {providers}")

# Ver modelos por provedor
openai_models = agno.get_available_models_for_provider("openai")
claude_models = agno.get_available_models_for_provider("claude")

print(f"Modelos OpenAI: {openai_models}")
print(f"Modelos Claude: {claude_models}")
```

## 📊 Comparação de Performance

### Testar Múltiplos Provedores

```python
# Comparar performance entre provedores
results = agno.compare_providers_performance(
    methodology=MethodologyType.ANALOGY,
    user_query="Explique como funciona uma API REST",
    providers=["openai", "claude"],
    context="Aula sobre desenvolvimento web"
)

for provider, result in results.items():
    if result["success"]:
        print(f"{provider}: {result['execution_time']:.2f}s - {result['response_length']} caracteres")
    else:
        print(f"{provider}: ERRO - {result['error']}")
```

### Obter Recomendações

```python
# Recomendações por caso de uso
educational_rec = agno.get_provider_recommendations(
    use_case="educational", 
    budget_conscious=False
)
print(f"Recomendado para educação: {educational_rec['recommended']}")

creative_rec = agno.get_provider_recommendations(
    use_case="creative", 
    budget_conscious=True
)
print(f"Recomendado para criatividade (econômico): {creative_rec['recommended']}")
```

## 🎓 Metodologias Educacionais

Todas as metodologias funcionam com ambos os provedores:

```python
agno_claude = AgnoService("claude-3-5-sonnet")

# Exemplos resolvidos (XML formatado)
worked_example = agno_claude.get_worked_example(
    "Como ordenar uma lista usando bubble sort?",
    "Algoritmos de ordenação básicos"
)

# Método socrático
socratic = agno_claude.get_socratic_response(
    "O que são estruturas de dados?",
    "Introdução à ciência da computação"
)

# Analogias
analogy = agno_claude.get_analogy_response(
    "Como funciona uma pilha (stack)?",
    "Estruturas de dados lineares"
)

# Scaffolding
scaffolding = agno_claude.get_scaffolding_response(
    "Implementar busca binária",
    "Algoritmos de busca"
)

# Pensamento sequencial
sequential = agno_claude.get_sequential_thinking_response(
    "Explicar o algoritmo quicksort",
    "Algoritmos de ordenação avançados"
)
```

## ⚙️ Configurações Avançadas

### Modelo Personalizado Claude

```python
from app.services.agno_models import ClaudeModel
from agno.agent import Agent

# Criar modelo Claude com configurações específicas
claude_model = ClaudeModel(
    id="claude-3-opus-20240229",
    max_tokens=8192,
    temperature=0.3
)

# Usar em um agente
agent = Agent(
    model=claude_model,
    description="Tutor especializado em programação funcional",
    instructions=["Use exemplos em Haskell", "Explique conceitos matemáticos"],
    markdown=True
)

response = agent.response("Explique what são mônadas")
```

### Factory Pattern para Modelos

```python
from app.services.agno_models import create_model

# Criar modelos usando factory function
openai_model = create_model("openai", "gpt-4o", temperature=0.5)
claude_model = create_model("claude", "claude-sonnet-4", max_tokens=4096)
```

## 🔍 Detecção Automática de Provedor

O sistema detecta automaticamente o provedor baseado no `model_id`:

```python
# Estes são detectados automaticamente
agno1 = AgnoService("gpt-4o")              # → openai
agno2 = AgnoService("claude-3-5-sonnet")   # → claude
agno3 = AgnoService("o3-mini")             # → openai
agno4 = AgnoService("claude-sonnet-4")     # → claude

# Para modelos com alias, usa a configuração em model_config.json
agno5 = AgnoService("claude-3-opus")       # → claude (via config)
```

## 📋 Configuração de Modelos (model_config.json)

O arquivo `app/services/configs/model_config.json` mapeia aliases para provedores:

```json
{
  "gpt-4o": {
    "provider": "openai",
    "model_name": "gpt-4o"
  },
  "claude-3-5-sonnet": {
    "provider": "claude", 
    "model_name": "claude-3-5-sonnet-20241022"
  },
  "claude-sonnet-4": {
    "provider": "claude",
    "model_name": "claude-sonnet-4-20250514"
  }
}
```

## 🚨 Tratamento de Erros

O sistema inclui fallbacks automáticos:

```python
# Se Claude falhar, faz fallback para OpenAI
agno = AgnoService("claude-3-opus")

try:
    response = agno.ask_question(
        MethodologyType.ANALOGY, 
        "Explique programação orientada a objetos"
    )
except Exception as e:
    print(f"Erro: {e}")
    # O sistema automaticamente tentará OpenAI se configurado
```

## 🔧 Integração com APIs

### Router Updates

Para usar em routers FastAPI:

```python
from app.services.agno_service import AgnoService

@router.post("/agno/ask-claude")
async def ask_with_claude(request: AgnoRequest):
    # Usar Claude especificamente
    agno = AgnoService("claude-3-5-sonnet")
    response = agno.ask_question(
        MethodologyType(request.methodology),
        request.user_query,
        request.context
    )
    return {"response": response, "provider": "claude"}

@router.post("/agno/ask-best")
async def ask_with_best_provider(request: AgnoRequest):
    # Usar recomendação automática
    agno = AgnoService()
    
    recommendations = agno.get_provider_recommendations(
        use_case="educational",
        budget_conscious=False
    )
    
    best_provider = recommendations["recommended"]
    agno.switch_model(best_provider["model"], best_provider["provider"])
    
    response = agno.ask_question(
        MethodologyType(request.methodology),
        request.user_query,
        request.context
    )
    
    return {
        "response": response, 
        "provider_used": best_provider,
        "reason": best_provider["reason"]
    }
```

## 📈 Monitoramento e Logs

O sistema registra automaticamente as trocas de provedor:

```
INFO - AgnoMethodologyService inicializado com modelo: claude-3-5-sonnet (provedor: claude)
INFO - Processando pergunta com metodologia: analogy usando claude/claude-3-5-sonnet
INFO - Modelo alterado: claude/claude-3-5-sonnet -> openai/gpt-4o
```

## 💡 Dicas de Uso

1. **Claude** é geralmente melhor para:
   - Análises complexas e raciocínio
   - Respostas criativas e nuanceadas
   - Explicações detalhadas

2. **OpenAI** é geralmente melhor para:
   - Velocidade de resposta
   - Integração com ferramentas
   - Casos de uso gerais

3. **Alternância dinâmica**:
   - Use comparação de performance para casos específicos
   - Implemente fallback automático
   - Considere custos por token

4. **Configuração**:
   - Sempre configure CLAUDE_API_KEY mesmo se usar principalmente OpenAI
   - Use auto-detecção quando possível
   - Monitore logs para debug

## 🔒 Considerações de Segurança

- Mantenha as chaves de API seguras em variáveis de ambiente
- Use diferentes chaves para desenvolvimento e produção
- Monitore uso de tokens para controle de custos
- Implemente rate limiting se necessário

---

Este guia cobre o uso básico e avançado do sistema AGNO multi-provedor. Para mais detalhes, consulte o código-fonte dos serviços em `app/services/agno_*` e a documentação da API. 