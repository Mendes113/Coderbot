"""
Agno Methodology Service

Este serviço utiliza a biblioteca Agno para criar agentes de IA adaptados a diferentes metodologias educacionais.
Cada agente pode ser configurado com prompts/instruções específicas para a metodologia desejada.

Melhorias implementadas:
- Templates XML mais robustos para worked examples
- Validação de entrada e formatação de saída
- Tratamento de erros aprimorado
- Templates XML para outras metodologias
- Validação de XML de saída
- Logs detalhados
- Suporte para múltiplos provedores (OpenAI e Claude)
"""

from typing import Optional, Dict, Any, List
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from enum import Enum
import logging
import xml.etree.ElementTree as ET
import re
import json
from pathlib import Path

# Import do nosso modelo customizado
from .agno_models import create_model, get_available_models

class MethodologyType(Enum):
    SEQUENTIAL_THINKING = "sequential_thinking"
    ANALOGY = "analogy"
    SOCRATIC = "socratic"
    SCAFFOLDING = "scaffolding"
    WORKED_EXAMPLES = "worked_examples"
    DEFAULT = "default"

# Configuração de logging
logger = logging.getLogger(__name__)

class AgnoMethodologyService:
    def __init__(self, model_id: str = "claude-3-5-sonnet-20241022", provider: Optional[str] = None):
        """
        Inicializa o serviço AGNO com suporte a múltiplos provedores.
        
        Args:
            model_id: ID do modelo a ser usado (padrão: gpt-4o)
            provider: Provedor do modelo ('openai' ou 'claude'). 
                     Se não especificado, será auto-detectado baseado no model_id
        """
        self.model_id = model_id
        self.provider = provider or self._detect_provider(model_id)
        self.logger = logger
        self.xml_validation_enabled = False  # XML desabilitado; usamos markdown-only
        
        # Carregar configuração de modelos
        self.model_config = self._load_model_config()
        
        self.logger.info(f"AgnoMethodologyService inicializado com modelo: {model_id} (provedor: {self.provider})")
        
        self.agent_configs = {
            MethodologyType.SEQUENTIAL_THINKING: {
                "description": "Você é um tutor que ensina passo a passo (pensamento sequencial).",
                "instructions": [
                    "Explique o raciocínio de forma sequencial, detalhando cada etapa lógica.",
                    "Garanta que o aluno compreenda cada passo antes de avançar.",
                    "Peça ao aluno para explicar o que entendeu após cada etapa.",
                    "Se o aluno errar, volte ao passo anterior e explique de outra forma.",
                    "Utilize listas numeradas para cada etapa do raciocínio."
                ]
            },
            MethodologyType.ANALOGY: {
                "description": "Você é um tutor que usa analogias para facilitar o entendimento.",
                "instructions": [
                    "Sempre que possível, utilize analogias do cotidiano para explicar conceitos complexos.",
                    "Relacione o conteúdo a situações familiares ao aluno.",
                    "Peça ao aluno para criar sua própria analogia após a explicação.",
                    "Explique as limitações da analogia utilizada.",
                    "Ofereça múltiplas analogias se o aluno não entender de primeira."
                ]
            },
            MethodologyType.SOCRATIC: {
                "description": "Você é um tutor que utiliza o método socrático.",
                "instructions": [
                    "Responda com perguntas que estimulem o pensamento crítico do aluno.",
                    "Evite dar respostas diretas, incentive a reflexão.",
                    "Construa uma sequência de perguntas que leve o aluno à resposta.",
                    "Adapte o nível das perguntas conforme o progresso do aluno.",
                    "Peça justificativas para as respostas do aluno."
                ]
            },
            MethodologyType.SCAFFOLDING: {
                "description": "Você é um tutor que utiliza scaffolding (andaime educacional).",
                "instructions": [
                    "Ofereça dicas e pistas graduais, removendo o suporte conforme o aluno avança.",
                    "Adapte o nível de ajuda conforme a resposta do aluno.",
                    "Comece com exemplos guiados e vá reduzindo o suporte.",
                    "Peça ao aluno para tentar sozinho após algumas dicas.",
                    "Reforce positivamente cada avanço do aluno."
                ]
            },
            MethodologyType.WORKED_EXAMPLES: {
                "description": "Você é um tutor que ensina por meio de exemplos resolvidos.",
                "instructions": [
                    "Apresente exemplos resolvidos detalhadamente antes de propor exercícios ao aluno.",
                    "Explique cada etapa do exemplo.",
                    "Peça ao aluno para identificar o próximo passo do exemplo.",
                    "Após o exemplo, proponha um exercício semelhante para o aluno resolver.",
                    "Destaque os pontos-chave e armadilhas comuns em cada exemplo."
                ]
            },
            MethodologyType.DEFAULT: {
                "description": "Você é um tutor educacional padrão.",
                "instructions": [
                    "Responda de forma clara, objetiva e didática.",
                    "Adapte o nível da explicação ao conhecimento prévio do aluno.",
                    "Ofereça exemplos simples para ilustrar conceitos.",
                    "Encoraje o aluno a fazer perguntas sempre que tiver dúvidas."
                ]
            }
        }

    def _detect_provider(self, model_id: str) -> str:
        """
        Detecta automaticamente o provedor baseado no model_id.
        
        Args:
            model_id: ID do modelo
            
        Returns:
            str: Nome do provedor ('openai' ou 'claude')
        """
        if model_id.startswith('claude'):
            return 'claude'
        elif model_id.startswith(('gpt', 'o1', 'o3')):
            return 'openai'
        else:
            # Verificar na configuração de modelos
            model_config = self._load_model_config()
            if model_id in model_config:
                return model_config[model_id].get('provider', 'openai')
            
            # Padrão para OpenAI se não conseguir detectar
            self.logger.warning(f"Não foi possível detectar provedor para {model_id}, usando OpenAI como padrão")
            return 'openai'
    
    def _load_model_config(self) -> Dict[str, Any]:
        """
        Carrega configuração de modelos do arquivo JSON.
        
        Returns:
            Dict com configuração dos modelos
        """
        try:
            config_path = Path(__file__).parent / "configs" / "model_config.json"
            if config_path.exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            self.logger.warning(f"Erro ao carregar configuração de modelos: {e}")
        
        return {}
    
    def _get_model_name(self, model_id: str) -> str:
        """
        Obtém o nome real do modelo baseado na configuração.
        
        Args:
            model_id: ID do modelo
            
        Returns:
            str: Nome real do modelo
        """
        if model_id in self.model_config:
            return self.model_config[model_id].get('model_name', model_id)
        return model_id

    def get_agent(self, methodology: MethodologyType) -> Agent:
        """
        Cria um agente AGNO com o modelo apropriado baseado no provedor.
        
        Args:
            methodology: Metodologia educacional a ser utilizada
            
        Returns:
            Agent: Instância do agente AGNO configurado
        """
        config = self.agent_configs.get(methodology, self.agent_configs[MethodologyType.DEFAULT])
        
        self.logger.info(f"Criando agente para provedor: {self.provider}, modelo: {self.model_id}")
        
        try:
            if self.provider == "claude":
                # Usar modelo oficial do Agno para Claude
                from agno.models.anthropic import Claude
                model = Claude(id=self.model_id)
                self.logger.info(f"Modelo Claude oficial {self.model_id} criado com sucesso")
            else:
                # Usar OpenAI para modelos OpenAI
                from agno.models.openai import OpenAIChat
                model = OpenAIChat(id=self.model_id)
                self.logger.info(f"Modelo OpenAI {self.model_id} criado com sucesso")
            
            return Agent(
                model=model,
                description=config["description"],
                instructions=[self._build_markdown_instructions(config)],
                markdown=True
            )
        except Exception as e:
            self.logger.error(f"Erro ao criar agente {self.provider}: {e}")
            import traceback
            self.logger.error(f"Traceback completo: {traceback.format_exc()}")
            raise RuntimeError(f"Falha ao criar agente {self.provider}: {str(e)}")
    
    def get_available_providers(self) -> List[str]:
        """
        Retorna lista de provedores disponíveis.
        
        Returns:
            List[str]: Lista de provedores suportados
        """
        return ['openai', 'claude']
    
    def get_available_models_for_provider(self, provider: str) -> List[str]:
        """
        Retorna modelos disponíveis para um provedor específico.
        
        Args:
            provider: Nome do provedor
            
        Returns:
            List[str]: Lista de modelos disponíveis
        """
        available_models = get_available_models()
        return list(available_models.get(provider, {}).keys())
    
    def switch_model(self, model_id: str, provider: Optional[str] = None):
        """
        Troca o modelo sendo usado pelo serviço.
        
        Args:
            model_id: Novo ID do modelo
            provider: Novo provedor (opcional, será auto-detectado se não fornecido)
        """
        old_model = self.model_id
        old_provider = self.provider
        
        self.model_id = model_id
        self.provider = provider or self._detect_provider(model_id)
        
        self.logger.info(
            f"Modelo alterado: {old_provider}/{old_model} -> {self.provider}/{model_id}"
        )
        
    def get_current_model_info(self) -> Dict[str, str]:
        """
        Retorna informações sobre o modelo atual.
        
        Returns:
            Dict com informações do modelo atual
        """
        real_model_name = self._get_model_name(self.model_id)
        return {
            'model_id': self.model_id,
            'provider': self.provider,
            'real_model_name': real_model_name,
            'supports_streaming': True,  # Ambos OpenAI e Claude suportam streaming
            'max_tokens': 4096 if self.provider == 'claude' else 4096,  # Pode ser configurado
        }

    def _build_xml_prompt(self, config: Dict[str, Any]) -> str:
        """
        (Deprecado) Antes usava pseudo-tags XML. Mantido por compatibilidade.
        """
        # Exemplo de estrutura baseada em melhores práticas (EduPlanner, AgentInstruct, etc.)
        return f"""
<agent>
  <role>{config['description']}</role>
  <instructions>
    {''.join([f'<step>{instr}</step>' for instr in config['instructions']])}
  </instructions>
  <feedback>Forneça feedback adaptativo e incentive o pensamento crítico.</feedback>
  <personalization>Adapte a resposta ao perfil e progresso do estudante.</personalization>
</agent>
"""

    def _build_markdown_instructions(self, config: Dict[str, Any]) -> str:
        """Instruções puras em Markdown (sem XML) para agentes AGNO."""
        steps = "\n".join([f"- {instr}" for instr in config["instructions"]])
        return (
            "Você é um tutor educacional. Siga as instruções abaixo em linguagem natural/Markdown, "
            "evitando XML/HTML bruto e fences inválidos.\n\n"
            f"Descrição: {config['description']}\n\n"
            "Diretrizes:\n"
            f"{steps}\n"
            "- Responda APENAS em Markdown limpo.\n"
            "- Use fenced blocks apenas quando necessário (ex.: ```python).\n"
        )

    def ask(self, methodology: MethodologyType, user_query: str, context: Optional[str] = None) -> str:
        """
        Processa uma pergunta usando uma metodologia específica.
        
        Args:
            methodology: Metodologia educacional a ser utilizada
            user_query: Pergunta do usuário
            context: Contexto adicional (opcional)
            
        Returns:
            str: Resposta formatada segundo a metodologia escolhida
            
        Raises:
            ValueError: Se a entrada for inválida
            RuntimeError: Se houver erro na geração da resposta
        """
        # Validação de entrada
        if not self._validate_input(user_query, context):
            raise ValueError("Entrada inválida: pergunta não pode estar vazia")
        
        self.logger.info(f"Processando pergunta com metodologia: {methodology.value} usando {self.provider}/{self.model_id}")
        
        try:
            prompt = self._build_methodology_prompt(methodology, user_query, context)
            self.logger.debug(f"Prompt gerado: {prompt[:200]}...")
            
            # Usar implementação AGNO padrão para ambos os provedores
            self.logger.info(f"Usando implementação AGNO com {self.provider}: {self.model_id}")
            agent = self.get_agent(methodology)
            run_response = agent.run(prompt)
            if hasattr(run_response, 'content'):
                response = run_response.content
            elif isinstance(run_response, str):
                response = run_response
            else:
                response = str(run_response)
            self.logger.info(f"{self.provider.upper()} retornou resposta de {len(response)} caracteres")
            
            # Valida e formata resposta
            formatted_response = self._format_response(methodology, response)
            
            self.logger.info(f"Resposta gerada com sucesso para metodologia: {methodology.value}")
            return formatted_response
            
        except Exception as e:
            self.logger.error(f"Erro ao processar pergunta: {str(e)}")
            raise RuntimeError(f"Erro na geração da resposta: {str(e)}")
    
    def _validate_input(self, user_query: str, context: Optional[str] = None) -> bool:
        """
        Valida a entrada do usuário.
        
        Args:
            user_query: Pergunta do usuário
            context: Contexto adicional
            
        Returns:
            bool: True se a entrada é válida, False caso contrário
        """
        if not user_query or not user_query.strip():
            return False
            
        if len(user_query.strip()) < 3:
            return False
            
        if context and len(context) > 2000:  # Limita o contexto
            return False
            
        return True
    
    def _build_methodology_prompt(self, methodology: MethodologyType, user_query: str, context: Optional[str] = None) -> str:
        """
        Constrói o prompt específico para cada metodologia.
        
        Args:
            methodology: Metodologia escolhida
            user_query: Pergunta do usuário
            context: Contexto adicional
            
        Returns:
            str: Prompt formatado para a metodologia
        """
        if methodology == MethodologyType.WORKED_EXAMPLES:
            return self._build_worked_examples_prompt(user_query, context)
        elif methodology == MethodologyType.SOCRATIC:
            return self._build_socratic_prompt(user_query, context)
        elif methodology == MethodologyType.SCAFFOLDING:
            return self._build_scaffolding_prompt(user_query, context)
        else:
            # Prompt padrão para outras metodologias
            if context:
                return f"<context>{context}</context>\n<question>{user_query}</question>"
            else:
                return f"<question>{user_query}</question>"
    
    def _build_worked_examples_prompt(self, user_query: str, context: Optional[str] = None) -> str:
        """
        Constrói prompt para worked examples que gera respostas em markdown limpo,
        usando XML apenas como guia de estrutura (não na saída).
        """
        markdown_instruction = """
Você é um especialista em ensino através de Exemplos Trabalhados (Worked Examples), conforme diretrizes pedagógicas dos artigos SBIE.
Sua missão é reduzir a carga cognitiva, demonstrando a resolução de problemas por meio de exemplos passo a passo, com foco em reflexão e generalização de padrões.

IMPORTANTE: Responda APENAS em Markdown limpo (sem XML/HTML bruto). Evite blocos de código extensos; o código final completo será gerado em uma etapa separada.

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (em markdown limpo):

## Análise do Problema
- Explique claramente o que o problema pede, contexto mínimo necessário e objetivos de aprendizagem.
- Diga "como funciona" o tema central em linguagem acessível.

## Reflexão
- Escreva um breve texto expositivo (1–2 parágrafos) que induza o aluno a pensar sobre o problema antes da solução. Explique como abordar o tema, que aspectos observar e como organizar o raciocínio, sem perguntas diretas.

## Exemplo Trabalhado (Passo a passo)
- Demonstre a solução em passos numerados, com foco no raciocínio e decisões.
- Evite código longo aqui. Se necessário, pequenos trechos podem ser incluídos para consolidar o entendimento.

## Explicação dos Passos (Justificativas)
- Explique o porquê de cada decisão tomada nos passos. Relacione com conceitos.

## Padrões Identificados
- Destaque padrões, heurísticas e técnicas reutilizáveis extraídas do exemplo.

## Exemplo Similar
- Forneça uma variação breve do problema, destacando o que muda e o que se mantém.

## Próximos Passos
- Sugira como o aluno pode praticar (exercícios, variações, metas).

---
Quiz (3 alternativas, exatamente 1 correta)
- Ao final, inclua EXATAMENTE UM bloco fenced denominado quiz contendo JSON no formato abaixo.
- Cada alternativa DEVE conter um campo "reason" (1–2 frases) explicando por que está correta ou incorreta.

```quiz
{
  "question": "[sua pergunta curta e objetiva]",
  "options": [
    { "id": "A", "text": "[opção A]", "correct": true,  "reason": "Correta porque …" },
    { "id": "B", "text": "[opção B]", "correct": false, "reason": "Incorreta porque …" },
    { "id": "C", "text": "[opção C]", "correct": false, "reason": "Incorreta porque …" }
  ],
  "explanation": "[síntese breve reforçando o porquê da resposta correta]"
}
```

Diretrizes gerais:
- Use linguagem acessível e foco educacional, explicando o porquê das escolhas.
- Inclua o campo "reason" em TODAS as alternativas do quiz, mantendo-o conciso.
- Evite código longo fora do bloco "Código final" (gerado em outra etapa).
"""
        
        if context:
            return f"{markdown_instruction}\n\nContexto adicional: {context}\n\nPergunta do usuário: {user_query}"
        else:
            return f"{markdown_instruction}\n\nPergunta do usuário: {user_query}"
    
    def _build_socratic_prompt(self, user_query: str, context: Optional[str] = None) -> str:
        """
        Constrói prompt para metodologia socrática gerando resposta em markdown limpo.
        """
        socratic_instruction = """
Você é um professor experiente usando o método socrático.
Sua missão é estimular o pensamento crítico através de perguntas bem formuladas.

IMPORTANTE: Responda APENAS em texto natural/markdown limpo. NÃO use tags XML na sua resposta.

FORMATO DA SUA RESPOSTA (em markdown limpo):

## 🤔 Vamos pensar juntos sobre isso...

[Faça uma pergunta inicial que estimule o pensamento crítico sobre o problema]

## 📝 Perguntas para reflexão:

**1.** [Pergunta exploratória que ajude o aluno a entender o problema]

**2.** [Pergunta de análise que aprofunde o raciocínio]

**3.** [Pergunta de síntese que conecte conceitos]

**4.** [Pergunta adicional se necessário]

## 💭 Para você refletir:

- O que você acha que aconteceria se [cenário hipotético]?
- Como você justificaria [aspecto do problema]?
- Que evidências apoiam [conclusão ou abordagem]?

## 🎯 Próximo passo:

[Sugira como o aluno pode continuar explorando o tópico]

DIRETRIZES:
1. Use APENAS texto natural e markdown - NUNCA tags XML
2. Faça perguntas que estimulem o pensamento, não que tenham respostas óbvias
3. Guie o aluno a descobrir a resposta por si mesmo
4. Use linguagem encorajadora e curiosa
5. Conecte o problema a conceitos mais amplos quando relevante
"""
        
        if context:
            return f"{socratic_instruction}\n\nContexto adicional: {context}\n\nPergunta do usuário: {user_query}"
        else:
            return f"{socratic_instruction}\n\nPergunta do usuário: {user_query}"
    
    def _build_scaffolding_prompt(self, user_query: str, context: Optional[str] = None) -> str:
        """
        Constrói prompt para metodologia scaffolding gerando resposta em markdown limpo.
        """
        scaffolding_instruction = """
Você é um professor experiente usando scaffolding (suporte graduado).
Sua missão é fornecer suporte inicial máximo e depois reduzir gradualmente para desenvolver autonomia.

IMPORTANTE: Responda APENAS em texto natural/markdown limpo. NÃO use tags XML na sua resposta.

FORMATO DA SUA RESPOSTA (em markdown limpo):

## 📚 Vamos começar com suporte completo

[Explicação completa e detalhada do conceito]

### Exemplo guiado com todas as dicas:

```[linguagem]
[código com comentários detalhados]
```

**Explicação de cada parte:**
- [Explicação da linha 1]
- [Explicação da linha 2]
- [Continue explicando cada parte]

## 🎯 Agora com menos suporte - sua vez!

**Problema similar com dicas:**

[Descrição do problema]

**Dicas para te ajudar:**
- 💡 **Dica 1:** [primeira dica]
- 💡 **Dica 2:** [segunda dica]
- 💡 **Dica 3:** [terceira dica]

**Perguntas para te orientar:**
1. [Pergunta orientadora 1]
2. [Pergunta orientadora 2]

## 🚀 Desafio independente

**Agora sem dicas - você consegue!**

[Descrição do problema para resolver sozinho]

**Como avaliar se está correto:**
- [ ] [Critério 1]
- [ ] [Critério 2]
- [ ] [Critério 3]

## 📈 Próximos passos para continuar aprendendo:

1. [Sugestão de próximo tópico]
2. [Recurso para estudar mais]
3. [Exercício adicional]

DIRETRIZES:
1. Use APENAS texto natural e markdown - NUNCA tags XML
2. Comece com máximo suporte e reduza gradualmente
3. Inclua dicas específicas na seção intermediária
4. No desafio final, não dê dicas - apenas critérios de avaliação
5. Use linguagem encorajadora que desenvolva confiança
"""
        
        if context:
            return f"{scaffolding_instruction}\n\nContexto adicional: {context}\n\nPergunta do usuário: {user_query}"
        else:
            return f"{scaffolding_instruction}\n\nPergunta do usuário: {user_query}"
    
    def _format_response(self, methodology: MethodologyType, response: str) -> str:
        """
        Formata e valida a resposta da IA.
        
        Args:
            methodology: Metodologia utilizada
            response: Resposta bruta da IA
            
        Returns:
            str: Resposta formatada e validada
        """
        # Remove espaços extras
        formatted_response = response.strip()
        
        # XML desabilitado: não validar nem tentar corrigir XML
        
        return formatted_response
    
    def _validate_xml_response(self, response: str) -> tuple[bool, str]:  # mantido por compat
        """
        Valida se a resposta está em formato XML válido.
        
        Args:
            response: Resposta a ser validada
            
        Returns:
            tuple[bool, str]: (is_valid, error_message)
        """
        try:
            # Tenta parsear o XML
            ET.fromstring(response)
            return True, ""
        except ET.ParseError as e:
            return False, str(e)
    
    def _fix_common_xml_issues(self, response: str) -> str:  # mantido por compat
        """
        Corrige problemas comuns de XML na resposta.
        
        Args:
            response: Resposta com possíveis problemas de XML
            
        Returns:
            str: Resposta com correções aplicadas
        """
        # Escapa caracteres especiais comuns
        fixed_response = response.replace("&", "&amp;")
        fixed_response = fixed_response.replace("<", "&lt;").replace(">", "&gt;")
        
        # Restaura tags XML válidas
        xml_tags = [
            # Tags do template estruturado de worked examples
            "WorkedExampleTemplate", "GeneralData", "CourseInfo", "DisciplineTitle", 
            "Topic", "Subtopics", "Subtopic", "Prerequisites", "Prerequisite",
            "SourceInfo", "OriginType", "OriginReference", "ExampleContext", 
            "ProblemDescription", "ExpectedOutcome", "SupplementaryMaterial", "Resource",
            "WorkedExamples", "CorrectExample", "ErroneousExample", "Reflection", 
            "CorrectSteps", "ErroneousSteps", "Step", "Description", "Tests", "TestCase",
            "Input", "ExpectedOutput", "ErrorIdentification", "ErrorLine", "ErrorExplanation",
            "ProposedFix", "PedagogicalMeta", "Methodology", "LearningTheory", "Agent",
            # Tags do template simples (backward compatibility)
            "worked_example", "problem_analysis", "step_by_step_example", 
            "explanation", "patterns", "similar_example", "next_steps",
            # Tags de outras metodologias
            "socratic_response", "initial_question", "guiding_questions", "reflection_prompts",
            "scaffolding_response", "initial_support", "guided_practice", "independent_practice"
        ]
        
        for tag in xml_tags:
            fixed_response = fixed_response.replace(f"&lt;{tag}&gt;", f"<{tag}>")
            fixed_response = fixed_response.replace(f"&lt;/{tag}&gt;", f"</{tag}>")
        
        return fixed_response
    
    def get_methodology_capabilities(self, methodology: MethodologyType) -> Dict[str, Any]:
        """
        Retorna as capacidades e características de uma metodologia.
        
        Args:
            methodology: Metodologia a ser analisada
            
        Returns:
            Dict[str, Any]: Informações sobre as capacidades da metodologia
        """
        capabilities = {
            MethodologyType.WORKED_EXAMPLES: {
                "xml_output": True,
                "structured_response": True,
                "step_by_step": True,
                "examples": True,
                "patterns": True,
                "best_for": ["resolução de problemas", "algoritmos", "matemática"],
                "learning_style": "visual e sequencial"
            },
            MethodologyType.SOCRATIC: {
                "xml_output": True,
                "structured_response": True,
                "step_by_step": False,
                "examples": False,
                "patterns": False,
                "best_for": ["pensamento crítico", "análise", "filosofia"],
                "learning_style": "questionamento e reflexão"
            },
            MethodologyType.SCAFFOLDING: {
                "xml_output": True,
                "structured_response": True,
                "step_by_step": True,
                "examples": True,
                "patterns": False,
                "best_for": ["iniciantes", "conceitos progressivos", "habilidades"],
                "learning_style": "suporte gradual"
            },
            MethodologyType.ANALOGY: {
                "xml_output": False,
                "structured_response": False,
                "step_by_step": False,
                "examples": True,
                "patterns": True,
                "best_for": ["conceitos abstratos", "visualização", "compreensão"],
                "learning_style": "comparação e associação"
            },
            MethodologyType.SEQUENTIAL_THINKING: {
                "xml_output": False,
                "structured_response": True,
                "step_by_step": True,
                "examples": True,
                "patterns": True,
                "best_for": ["lógica", "processos", "algoritmos"],
                "learning_style": "sequencial e estruturado"
            },
            MethodologyType.DEFAULT: {
                "xml_output": False,
                "structured_response": False,
                "step_by_step": False,
                "examples": True,
                "patterns": False,
                "best_for": ["uso geral", "primeira interação"],
                "learning_style": "explicação direta"
            }
        }
        
        return capabilities.get(methodology, {})
    
    def analyze_response_quality(self, methodology: MethodologyType, response: str) -> Dict[str, Any]:
        """
        Analisa a qualidade da resposta gerada.
        
        Args:
            methodology: Metodologia utilizada
            response: Resposta a ser analisada
            
        Returns:
            Dict[str, Any]: Análise da qualidade da resposta
        """
        analysis = {
            "length": len(response),
            "has_xml": self._contains_xml(response),
            "xml_valid": False,
            "completeness": 0.0,
            "sections_present": [],
            "missing_sections": [],
            "quality_score": 0.0
        }
        
        # Verifica se contém XML válido
        if analysis["has_xml"]:
            is_valid, _ = self._validate_xml_response(response)
            analysis["xml_valid"] = is_valid
            
            if is_valid:
                analysis.update(self._analyze_xml_sections(methodology, response))
        
        # Calcula score de qualidade
        analysis["quality_score"] = self._calculate_quality_score(analysis)
        
        return analysis
    
    def _contains_xml(self, response: str) -> bool:
        """Verifica se a resposta contém XML."""
        return bool(re.search(r'<\w+>', response))
    
    def _analyze_xml_sections(self, methodology: MethodologyType, response: str) -> Dict[str, Any]:
        """Analisa as seções XML da resposta."""
        sections_analysis = {
            "sections_present": [],
            "missing_sections": [],
            "completeness": 0.0
        }
        
        try:
            root = ET.fromstring(response)
            
            # Seções esperadas para cada metodologia
            expected_sections = {
                MethodologyType.WORKED_EXAMPLES: [
                    # Template estruturado - seções principais
                    "GeneralData", "ExampleContext", "WorkedExamples", "PedagogicalMeta",
                    # Template simples - backward compatibility  
                    "problem_analysis", "step_by_step_example", "explanation",
                    "patterns", "similar_example", "next_steps"
                ],
                MethodologyType.SOCRATIC: [
                    "initial_question", "guiding_questions", "reflection_prompts"
                ],
                MethodologyType.SCAFFOLDING: [
                    "initial_support", "guided_practice", "independent_practice"
                ]
            }
            
            if methodology in expected_sections:
                expected = expected_sections[methodology]
                present = [elem.tag for elem in root]
                
                sections_analysis["sections_present"] = present
                sections_analysis["missing_sections"] = [
                    section for section in expected if section not in present
                ]
                sections_analysis["completeness"] = len(present) / len(expected)
        
        except ET.ParseError:
            pass
        
        return sections_analysis
    
    def _calculate_quality_score(self, analysis: Dict[str, Any]) -> float:
        """Calcula um score de qualidade baseado na análise."""
        score = 0.0
        
        # Pontuação por completude
        if analysis["completeness"] > 0:
            score += analysis["completeness"] * 0.4
        
        # Pontuação por XML válido
        if analysis["xml_valid"]:
            score += 0.3
        
        # Pontuação por tamanho apropriado
        if 100 <= analysis["length"] <= 2000:
            score += 0.2
        elif analysis["length"] > 50:
            score += 0.1
        
        # Penalização por seções ausentes
        if analysis["missing_sections"]:
            score -= len(analysis["missing_sections"]) * 0.05
        
        # Pontuação por presença de XML quando esperado
        if analysis["has_xml"]:
            score += 0.1
        
        return min(1.0, max(0.0, score))
    
    def configure_xml_validation(self, enabled: bool) -> None:
        """
        Configura se a validação XML está habilitada.
        
        Args:
            enabled: True para habilitar, False para desabilitar
        """
        self.xml_validation_enabled = enabled
        self.logger.info(f"Validação XML {'habilitada' if enabled else 'desabilitada'}")
    
    def get_supported_methodologies(self) -> List[str]:
        """
        Retorna lista de metodologias suportadas.
        
        Returns:
            List[str]: Lista de metodologias suportadas
        """
        return [methodology.value for methodology in MethodologyType]
    
    def get_xml_methodologies(self) -> List[str]:
        """
        Retorna lista de metodologias que usam XML.
        
        Returns:
            List[str]: Lista de metodologias que retornam XML
        """
        xml_methodologies = [
            MethodologyType.WORKED_EXAMPLES,
            MethodologyType.SOCRATIC,
            MethodologyType.SCAFFOLDING
        ]
        return [methodology.value for methodology in xml_methodologies]
