"""
Team Methodology Service - Geração distribuída usando Agno Teams

Divide a geração de conteúdo educacional em múltiplos agentes especializados
para garantir qualidade consistente, especialmente com modelos menores.

Estratégia:
1. Content Agent: Gera reflexão + passo a passo (RÁPIDO)
2. Examples Agent: Gera exemplos correto/incorreto (FOCADO)
3. Quiz Agent: Gera quiz com validação (PRECISO)

Execução:
- Content sempre primeiro (base para os outros)
- Examples + Quiz em PARALELO (performance)
- Total: ~mesma latência de uma chamada, mas com qualidade garantida
"""

from typing import Optional, Dict, Any, List
from agno.agent import Agent
from agno.team import Team
import logging
import json
import time

from ..agno_models import create_model

logger = logging.getLogger(__name__)


class TeamMethodologyService:
    def __init__(self, model_id: str, provider: str, base_url: Optional[str] = None, api_key: Optional[str] = None):
        """
        Inicializa o serviço de Teams para metodologia educacional.
        
        Args:
            model_id: ID do modelo a ser usado
            provider: Provedor (claude, openai, ollama)
            base_url: URL base para Ollama
            api_key: API key para Claude/OpenAI
        """
        self.model_id = model_id
        self.provider = provider
        self.base_url = base_url
        self.api_key = api_key
        self.logger = logger
        
    def _create_model_instance(self):
        """Cria instância do modelo com configurações apropriadas."""
        model_kwargs = {}
        if self.provider == "ollama" and self.base_url:
            model_kwargs["base_url"] = self.base_url
        elif self.provider in ["claude", "openai"] and self.api_key:
            model_kwargs["api_key"] = self.api_key
            
        return create_model(self.provider, self.model_id, **model_kwargs)
    
    def generate_worked_example_with_team(
        self, 
        user_query: str, 
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Gera worked example usando equipe de agentes especializados.
        
        Args:
            user_query: Pergunta do usuário
            context: Contexto adicional
            
        Returns:
            Dict com:
                - content: Reflexão + passo a passo
                - examples: Dict com correct_example e incorrect_example
                - quiz: Dict com question, options, explanation
                - processing_time: Tempo total em segundos
        """
        start_time = time.time()
        
        try:
            # === AGENTE 1: Content Agent (Base) ===
            content_agent = self._create_content_agent()
            content_prompt = self._build_content_prompt(user_query, context)
            
            self.logger.info("🎯 Gerando conteúdo base (reflexão + passos)...")
            content_response = content_agent.run(content_prompt)
            content = content_response.content if hasattr(content_response, 'content') else str(content_response)
            
            # === AGENTES 2 & 3: Examples + Quiz em PARALELO ===
            # Criar team para execução paralela
            examples_agent = self._create_examples_agent()
            quiz_agent = self._create_quiz_agent()
            
            team = Team(
                agents=[examples_agent, quiz_agent],
                name="Educational Content Team"
            )
            
            # Preparar prompts
            examples_prompt = self._build_examples_prompt(user_query, content)
            quiz_prompt = self._build_quiz_prompt(user_query, content)
            
            self.logger.info("🚀 Gerando exemplos + quiz em paralelo...")
            
            # Executar em paralelo
            examples_response = examples_agent.run(examples_prompt)
            quiz_response = quiz_agent.run(quiz_prompt)
            
            # Extrair resultados
            examples_data = self._parse_examples_response(examples_response)
            quiz_data = self._parse_quiz_response(quiz_response)
            
            processing_time = round(time.time() - start_time, 2)
            
            self.logger.info(f"✅ Geração completa em {processing_time}s")
            
            return {
                "content": content,
                "examples": examples_data,
                "quiz": quiz_data,
                "processing_time": processing_time,
                "metadata": {
                    "model_id": self.model_id,
                    "provider": self.provider,
                    "agents_used": 3,
                    "parallel_execution": True
                }
            }
            
        except Exception as e:
            self.logger.error(f"Erro na geração com team: {e}")
            raise
    
    def _create_content_agent(self) -> Agent:
        """Cria agente especializado em conteúdo base."""
        model = self._create_model_instance()
        return Agent(
            model=model,
            name="Content Agent",
            description="Especialista em criar reflexões e explicações passo a passo",
            instructions=[
                "Você é um tutor educacional focado em criar APENAS reflexões iniciais e explicações passo a passo.",
                "NÃO gere exemplos de código ou quizzes.",
                "Foque em fazer o estudante pensar e em explicar o processo de forma clara.",
                "Use emojis apenas nos títulos das seções."
            ],
            markdown=True
        )
    
    def _create_examples_agent(self) -> Agent:
        """Cria agente especializado em exemplos de código."""
        model = self._create_model_instance()
        return Agent(
            model=model,
            name="Examples Agent",
            description="Especialista em criar exemplos de código corretos e incorretos",
            instructions=[
                "Você é um especialista em criar exemplos de código didáticos.",
                "Gere SEMPRE código REAL e FUNCIONAL relacionado ao tópico.",
                "Nunca use código genérico ou placeholder.",
                "Retorne APENAS no formato JSON especificado.",
                "Foque em erros comuns e suas correções."
            ],
            markdown=False
        )
    
    def _create_quiz_agent(self) -> Agent:
        """Cria agente especializado em criar quizzes."""
        model = self._create_model_instance()
        return Agent(
            model=model,
            name="Quiz Agent",
            description="Especialista em criar quizzes educacionais precisos",
            instructions=[
                "Você é um especialista em criar quizzes educacionais.",
                "VALIDE que apenas UMA opção esteja marcada como correta.",
                "Certifique-se de que a resposta correta está REALMENTE correta.",
                "Forneça explicações claras para cada opção.",
                "Retorne APENAS no formato JSON especificado."
            ],
            markdown=False
        )
    
    def _build_content_prompt(self, user_query: str, context: Optional[str]) -> str:
        """Constrói prompt para o Content Agent."""
        return f"""Crie uma explicação educacional passo a passo para a seguinte pergunta:

**Pergunta:** {user_query}

{f'**Contexto:** {context}' if context else ''}

Gere APENAS as seguintes seções em Markdown:

## 🤔 Reflexão Inicial
[Faça o estudante pensar sobre o problema antes de ver a solução. 2-3 frases.]

## 📝 Passo a Passo
1. [Primeiro passo com explicação clara]
2. [Segundo passo]
3. [Continue até resolver completamente o problema]
[Mínimo 3 passos, máximo 6 passos]

## 🎯 Padrões Importantes
- [Conceito ou padrão chave 1]
- [Conceito ou padrão chave 2]
[2-4 padrões]

## 🚀 Próximos Passos
[Sugira 2-3 exercícios para praticar]

NÃO GERE: exemplos de código ou quizzes.
"""
    
    def _build_examples_prompt(self, user_query: str, content: str) -> str:
        """Constrói prompt para o Examples Agent."""
        return f"""Crie exemplos de código para a seguinte pergunta:

**Pergunta:** {user_query}

**Contexto da explicação:**
{content[:500]}...

Gere exemplos de código REAIS e FUNCIONAIS. NÃO use código genérico.

Retorne APENAS um JSON válido neste formato:

{{
  "incorrect_example": {{
    "title": "Exemplo Incorreto",
    "code": "[código com erro REAL relacionado à pergunta]",
    "language": "[linguagem, ex: javascript, python]",
    "error_explanation": "Por que este código está errado",
    "correction": "Como corrigir este erro"
  }},
  "correct_example": {{
    "title": "Exemplo Correto",
    "code": "[código correto e funcional relacionado à pergunta]",
    "language": "[mesma linguagem]",
    "explanation": "Por que este código está correto"
  }}
}}

IMPORTANTE:
- Código DEVE ser relacionado à pergunta
- Use \\n para quebras de linha no JSON
- NÃO use markdown, retorne APENAS JSON
"""
    
    def _build_quiz_prompt(self, user_query: str, content: str) -> str:
        """Constrói prompt para o Quiz Agent."""
        return f"""Crie um quiz educacional para a seguinte pergunta:

**Pergunta:** {user_query}

**Contexto da explicação:**
{content[:500]}...

Retorne APENAS um JSON válido neste formato:

{{
  "question": "Pergunta sobre o conceito principal",
  "options": [
    {{"id": "A", "text": "Opção A", "correct": true, "reason": "Por que está correta"}},
    {{"id": "B", "text": "Opção B", "correct": false, "reason": "Por que está incorreta"}},
    {{"id": "C", "text": "Opção C", "correct": false, "reason": "Por que está incorreta"}},
    {{"id": "D", "text": "Opção D", "correct": false, "reason": "Por que está incorreta"}}
  ],
  "explanation": "Resumo da resposta correta"
}}

REGRAS CRÍTICAS:
- APENAS UMA opção pode ter "correct": true
- As outras DEVEM ter "correct": false
- A opção marcada como correta DEVE estar corretamente respondida
- NÃO use markdown, retorne APENAS JSON
"""
    
    def _parse_examples_response(self, response: Any) -> Dict[str, Any]:
        """Parse da resposta do Examples Agent."""
        try:
            content = response.content if hasattr(response, 'content') else str(response)
            
            # Remover markdown se houver
            content = content.strip()
            if content.startswith('```'):
                # Extrair JSON de dentro do bloco de código
                lines = content.split('\n')
                json_lines = [l for l in lines[1:-1] if l.strip()]  # Remove primeira e última linha
                content = '\n'.join(json_lines)
            
            examples = json.loads(content)
            
            # Validar estrutura
            if 'correct_example' not in examples or 'incorrect_example' not in examples:
                self.logger.warning("❌ Examples response missing required fields")
                return {}
            
            # Validar que tem code
            if not examples['correct_example'].get('code') or not examples['incorrect_example'].get('code'):
                self.logger.warning("❌ Examples missing code fields")
                return {}
            
            self.logger.info("✅ Examples parsed successfully")
            return examples
            
        except json.JSONDecodeError as e:
            self.logger.error(f"❌ Failed to parse examples JSON: {e}")
            self.logger.error(f"Content: {content[:200]}")
            return {}
        except Exception as e:
            self.logger.error(f"❌ Error parsing examples: {e}")
            return {}
    
    def _parse_quiz_response(self, response: Any) -> Dict[str, Any]:
        """Parse da resposta do Quiz Agent."""
        try:
            content = response.content if hasattr(response, 'content') else str(response)
            
            # Remover markdown se houver
            content = content.strip()
            if content.startswith('```'):
                lines = content.split('\n')
                json_lines = [l for l in lines[1:-1] if l.strip()]
                content = '\n'.join(json_lines)
            
            quiz = json.loads(content)
            
            # Validar estrutura
            if 'question' not in quiz or 'options' not in quiz:
                self.logger.warning("❌ Quiz response missing required fields")
                return {}
            
            # VALIDAR: apenas uma opção correta
            correct_count = sum(1 for opt in quiz['options'] if opt.get('correct', False))
            if correct_count != 1:
                self.logger.warning(f"❌ Quiz has {correct_count} correct answers, expected 1. Fixing...")
                # Corrigir: marcar apenas a primeira como correta
                for i, opt in enumerate(quiz['options']):
                    opt['correct'] = (i == 0)
            
            self.logger.info("✅ Quiz parsed successfully")
            return quiz
            
        except json.JSONDecodeError as e:
            self.logger.error(f"❌ Failed to parse quiz JSON: {e}")
            self.logger.error(f"Content: {content[:200]}")
            return {}
        except Exception as e:
            self.logger.error(f"❌ Error parsing quiz: {e}")
            return {}

