"""
Serviço de Worked Examples Educacionais

Responsável por gerar exemplos trabalhados estruturados seguindo princípios científicos
de aprendizagem baseada em exemplos. Implementa técnicas de prompt engineering
otimizadas para criar conteúdo educativo interativo e segmentado.
"""

import json
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from ..types.agno_types import MethodologyType


@dataclass
class WorkedExampleReflexivo:
    """Seção reflexiva baseada nos artigos científicos."""
    content: str
    learning_objective: str
    cognitive_load_reduction: str


@dataclass
class WorkedExampleStep:
    """Uma etapa do passo a passo."""
    step_number: int
    title: str
    description: str
    code_snippet: Optional[str] = None
    explanation: Optional[str] = None


@dataclass
class WorkedExampleCorrect:
    """Exemplo correto baseado nos estudos."""
    title: str
    description: str
    code: str
    language: str
    explanation: str
    why_correct: str


@dataclass
class WorkedExampleIncorrect:
    """Exemplo incorreto baseado nos estudos."""
    title: str
    description: str
    code: str
    language: str
    error_location: str
    error_explanation: str
    correct_solution: str


@dataclass
class QuizOption:
    """Opção de resposta do quiz."""
    id: str
    text: str
    is_correct: bool
    explanation: str


@dataclass
class WorkedExampleQuiz:
    """Quiz baseado nos estudos científicos."""
    question: str
    options: list[QuizOption]
    explanation: str
    learning_outcome: str


@dataclass
class WorkedExampleSegments:
    """Estrutura completa dos segmentos do worked example."""
    reflexivo: WorkedExampleReflexivo
    etapas: list[WorkedExampleStep]
    exemplo_correto: WorkedExampleCorrect
    exemplo_incorreto: WorkedExampleIncorrect
    quiz: WorkedExampleQuiz


class WorkedExamplesService:
    """
    Serviço especializado em geração de worked examples educativos.

    Implementa técnicas avançadas de prompt engineering baseadas em:
    - Princípios científicos de Example-Based Learning
    - Técnicas de redução de carga cognitiva
    - Melhores práticas de prompt engineering
    - Estruturação interativa para frontend
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def generate_worked_example_prompt(self, user_query: str, topic: str,
                                     difficulty: str = "beginner") -> str:
        """
        Gera prompt otimizado para criação de worked examples educativos.

        Baseado em técnicas científicas e melhores práticas de prompt engineering:
        - Role assignment claro
        - Chain of thought estruturado
        - Few-shot examples quando necessário
        - Output format estruturado em JSON

        Args:
            user_query: Consulta do usuário sobre programação
            topic: Tópico específico (ex: "funções", "arrays")
            difficulty: Nível de dificuldade

        Returns:
            Prompt estruturado para geração de worked examples
        """

        # Base científica do prompt baseado nos artigos
        system_prompt = """
Você é um tutor especializado em programação para iniciantes, seguindo princípios científicos de Example-Based Learning (EBL).

SEU OBJETIVO: Criar worked examples educativos que ajudem estudantes a compreender conceitos de programação através de exemplos estruturados e interativos.

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (formato JSON):
{
  "reflexivo": {
    "content": "Texto reflexivo que faz o estudante pensar sobre o problema antes da solução",
    "learning_objective": "Objetivo de aprendizagem claro",
    "cognitive_load_reduction": "Como este exemplo reduz a carga cognitiva"
  },
  "etapas": [
    {
      "step_number": 1,
      "title": "Título da etapa",
      "description": "Descrição detalhada do passo",
      "code_snippet": "Código relevante (se aplicável)",
      "explanation": "Explicação do porquê deste passo"
    }
  ],
  "exemplo_correto": {
    "title": "Título do exemplo correto",
    "description": "Descrição do que o exemplo demonstra",
    "code": "Código correto completo",
    "language": "python",
    "explanation": "Explicação linha a linha do código",
    "why_correct": "Por que esta solução está correta"
  },
  "exemplo_incorreto": {
    "title": "Título do exemplo incorreto",
    "description": "Descrição do erro comum",
    "code": "Código com erro intencional",
    "language": "python",
    "error_location": "Onde está o erro no código",
    "error_explanation": "Por que este erro acontece",
    "correct_solution": "Como corrigir o erro"
  },
  "quiz": {
    "question": "Pergunta que testa compreensão do conceito",
    "options": [
      {
        "id": "A",
        "text": "Texto da opção A",
        "is_correct": false,
        "explanation": "Explicação da opção A"
      }
    ],
    "explanation": "Explicação da resposta correta",
    "learning_outcome": "O que o estudante aprendeu"
  }
}

PRINCÍPIOS CIENTÍFICOS A SEGUIR:
1. REDUÇÃO DE CARGA COGNITIVA: Apresente informações gradualmente, evitando sobrecarga
2. SELF-EXPLANATION: Incentive o estudante a explicar conceitos para si mesmo
3. ERROR ANALYSIS: Use exemplos incorretos para desenvolver raciocínio crítico
4. STEP-BY-STEP GUIDANCE: Divida soluções complexas em etapas claras
5. REFLECTIVE PRACTICE: Inclua reflexão antes e depois da solução

TÉCNICAS DE PROMPT ENGINEERING:
- Role assignment: Você é um tutor especializado
- Chain of thought: Pense passo a passo antes de responder
- Structured output: Sempre retorne JSON válido
- Context awareness: Considere o nível do estudante
- Few-shot examples: Use exemplos quando necessário

IMPORTANTE:
- Responda APENAS com JSON válido
- Não inclua texto explicativo fora do JSON
- Mantenha código funcional e executável
- Limite quiz a no máximo 5 opções
- Adapte complexidade ao nível do estudante
"""

        # Prompt específico baseado na consulta do usuário
        user_prompt = f"""
CRIE UM WORKED EXAMPLE EDUCATIVO PARA:
Consulta do estudante: "{user_query}"
Tópico: {topic}
Nível de dificuldade: {difficulty}

REQUISITOS ESPECÍFICOS:
1. REFLEXIVO: Faça o estudante pensar sobre o problema antes de ver a solução
2. ETAPAS: Descreva o processo de resolução em passos claros e lógicos
3. EXEMPLO CORRETO: Mostre código funcional com explicação detalhada
4. EXEMPLO INCORRETO: Apresente erro comum e ensine a identificá-lo
5. QUIZ: Crie pergunta que teste compreensão profunda do conceito

Certifique-se de que:
- O exemplo seja relevante para a consulta específica
- O código seja executável e funcional
- As explicações sejam claras para iniciantes
- O quiz ajude no aprendizado ativo
- Toda resposta esteja em português brasileiro
"""

        return f"{system_prompt}\n\n{user_prompt}"

    def parse_worked_example_response(self, ai_response: str) -> Optional[WorkedExampleSegments]:
        """
        Parseia resposta da IA e converte para estrutura de dados.

        Args:
            ai_response: Resposta JSON da IA

        Returns:
            WorkedExampleSegments estruturado ou None se inválido
        """
        try:
            # Limpar resposta (remover markdown se presente)
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]

            ai_response = ai_response.strip()

            # Parsear JSON
            data = json.loads(ai_response)

            # Converter para objetos estruturados
            reflexivo = WorkedExampleReflexivo(**data['reflexivo'])

            etapas = [
                WorkedExampleStep(**etapa) for etapa in data['etapas']
            ]

            exemplo_correto = WorkedExampleCorrect(**data['exemplo_correto'])
            exemplo_incorreto = WorkedExampleIncorrect(**data['exemplo_incorreto'])

            # Converter opções do quiz
            quiz_options = [
                QuizOption(**option) for option in data['quiz']['options']
            ]

            quiz = WorkedExampleQuiz(
                question=data['quiz']['question'],
                options=quiz_options,
                explanation=data['quiz']['explanation'],
                learning_outcome=data['quiz']['learning_outcome']
            )

            return WorkedExampleSegments(
                reflexivo=reflexivo,
                etapas=etapas,
                exemplo_correto=exemplo_correto,
                exemplo_incorreto=exemplo_incorreto,
                quiz=quiz
            )

        except (json.JSONDecodeError, KeyError, TypeError) as e:
            self.logger.error(f"Erro ao parsear resposta do worked example: {str(e)}")
            return None

    def validate_worked_example_structure(self, segments: WorkedExampleSegments) -> Dict[str, Any]:
        """
        Valida estrutura completa do worked example.

        Args:
            segments: Estrutura de segmentos a validar

        Returns:
            Resultado da validação com possíveis problemas
        """
        validation = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "score": 0.0
        }

        # Validar reflexivo
        if not segments.reflexivo.content or len(segments.reflexivo.content) < 50:
            validation["errors"].append("Reflexivo muito curto ou vazio")
            validation["valid"] = False

        # Validar etapas
        if not segments.etapas or len(segments.etapas) < 2:
            validation["errors"].append("Poucas etapas definidas (mínimo 2)")
            validation["valid"] = False

        # Validar exemplo correto
        if not segments.exemplo_correto.code or len(segments.exemplo_correto.code) < 10:
            validation["errors"].append("Código correto muito curto ou vazio")
            validation["valid"] = False

        # Validar exemplo incorreto
        if not segments.exemplo_incorreto.code or len(segments.exemplo_incorreto.code) < 10:
            validation["errors"].append("Código incorreto muito curto ou vazio")
            validation["valid"] = False

        # Validar quiz
        if not segments.quiz.options or len(segments.quiz.options) < 2:
            validation["errors"].append("Quiz deve ter pelo menos 2 opções")
            validation["valid"] = False

        if len(segments.quiz.options) > 5:
            validation["warnings"].append("Quiz tem mais de 5 opções (recomendado máximo)")

        # Verificar se há pelo menos uma opção correta no quiz
        correct_options = [opt for opt in segments.quiz.options if opt.is_correct]
        if not correct_options:
            validation["errors"].append("Quiz deve ter pelo menos uma opção correta")
            validation["valid"] = False

        # Calcular score baseado na completude
        total_checks = 5
        valid_checks = sum([
            bool(segments.reflexivo.content),
            len(segments.etapas) >= 2,
            bool(segments.exemplo_correto.code),
            bool(segments.exemplo_incorreto.code),
            len(segments.quiz.options) >= 2
        ])

        validation["score"] = valid_checks / total_checks

        return validation

    def generate_fallback_worked_example(self, user_query: str, topic: str) -> WorkedExampleSegments:
        """
        Gera worked example básico quando a IA falha.

        Args:
            user_query: Consulta do usuário
            topic: Tópico do exemplo

        Returns:
            Worked example básico estruturado
        """
        return WorkedExampleSegments(
            reflexivo=WorkedExampleReflexivo(
                content=f"Antes de ver a solução, pense sobre: {user_query}. Qual seria sua abordagem inicial?",
                learning_objective="Compreender conceitos básicos de programação",
                cognitive_load_reduction="Exemplo estruturado reduz sobrecarga cognitiva"
            ),
            etapas=[
                WorkedExampleStep(
                    step_number=1,
                    title="Analisar o problema",
                    description="Entender o que é solicitado na questão",
                    explanation="Primeiro passo é compreender o objetivo"
                ),
                WorkedExampleStep(
                    step_number=2,
                    title="Planejar a solução",
                    description="Pensar na lógica antes de codificar",
                    explanation="Planejamento evita erros comuns"
                ),
                WorkedExampleStep(
                    step_number=3,
                    title="Implementar o código",
                    description="Escrever o código seguindo a lógica definida",
                    explanation="Implementação seguindo passos anteriores"
                )
            ],
            exemplo_correto=WorkedExampleCorrect(
                title="Solução correta",
                description="Exemplo funcional que resolve o problema",
                code="def exemplo():\n    return 'código correto'",
                language="python",
                explanation="Código executável que demonstra a solução",
                why_correct="Segue a lógica definida e produz resultado esperado"
            ),
            exemplo_incorreto=WorkedExampleIncorrect(
                title="Erro comum",
                description="Erro típico que estudantes cometem",
                code="def exemplo():\n    return # esqueci o valor",
                language="python",
                error_location="Falta valor de retorno",
                error_explanation="Função retorna None ao invés do valor esperado",
                correct_solution="Adicionar o valor correto no return"
            ),
            quiz=WorkedExampleQuiz(
                question="O que aprendemos com este exemplo?",
                options=[
                    QuizOption("A", "Importância do planejamento", True, "Planejamento é fundamental"),
                    QuizOption("B", "Código pode ter erros", False, "Todos os códigos têm erros"),
                    QuizOption("C", "Não preciso testar", False, "Testes são importantes")
                ],
                explanation="O exemplo demonstra a importância do planejamento antes de codificar",
                learning_outcome="Melhor compreensão de lógica de programação"
            )
        )

    def convert_to_frontend_segments(self, segments: WorkedExampleSegments) -> list[Dict[str, Any]]:
        """
        Converte estrutura interna para formato do frontend.

        Args:
            segments: Estrutura interna dos segmentos

        Returns:
            Lista de segmentos no formato do frontend
        """
        frontend_segments = []

        # Reflexivo
        frontend_segments.append({
            "id": "reflexivo_1",
            "title": "Reflexão Inicial",
            "type": "reflection",
            "content": segments.reflexivo.content,
            "language": None
        })

        # Etapas (passo a passo)
        for i, etapa in enumerate(segments.etapas):
            content = f"**{etapa.title}**\n\n{etapa.description}"
            if etapa.code_snippet:
                content += f"\n\n```python\n{etapa.code_snippet}\n```"
            if etapa.explanation:
                content += f"\n\n*Explicação:* {etapa.explanation}"

            frontend_segments.append({
                "id": f"step_{i+1}",
                "title": f"Passo {etapa.step_number}: {etapa.title}",
                "type": "steps",
                "content": content,
                "language": "python" if etapa.code_snippet else None
            })

        # Exemplo correto
        frontend_segments.append({
            "id": "correct_example_1",
            "title": segments.exemplo_correto.title,
            "type": "correct_example",
            "content": f"{segments.exemplo_correto.description}\n\n```python\n{segments.exemplo_correto.code}\n```\n\n{segments.exemplo_correto.explanation}",
            "language": segments.exemplo_correto.language
        })

        # Exemplo incorreto
        frontend_segments.append({
            "id": "incorrect_example_1",
            "title": segments.exemplo_incorreto.title,
            "type": "incorrect_example",
            "content": f"{segments.exemplo_incorreto.description}\n\n```python\n{segments.exemplo_incorreto.code}\n```\n\n**Erro em:** {segments.exemplo_incorreto.error_location}\n\n{segments.exemplo_incorreto.error_explanation}",
            "language": segments.exemplo_incorreto.language
        })

        # Quiz
        quiz_options = []
        for option in segments.quiz.options:
            quiz_options.append({
                "id": option.id,
                "text": option.text,
                "explanation": option.explanation
            })

        quiz_json = {
            "question": segments.quiz.question,
            "options": quiz_options,
            "correct_option": next(opt.id for opt in segments.quiz.options if opt.is_correct),
            "explanation": segments.quiz.explanation,
            "learning_outcome": segments.quiz.learning_outcome
        }

        frontend_segments.append({
            "id": "quiz_1",
            "title": "Quiz de Verificação",
            "type": "quiz",
            "content": f"```quiz\n{json.dumps(quiz_json, ensure_ascii=False, indent=2)}\n```",
            "language": None
        })

        return frontend_segments

    def get_educational_guidance(self, topic: str, methodology: MethodologyType) -> str:
        """
        Fornece orientação educacional baseada em metodologia específica.

        Args:
            topic: Tópico do exemplo
            methodology: Metodologia utilizada

        Returns:
            Orientação educativa específica
        """
        guidance = {
            MethodologyType.WORKED_EXAMPLES: """
            Worked Examples são especialmente eficazes para:
            - Estudantes iniciantes em programação
            - Conceitos que envolvem múltiplas etapas
            - Desenvolvimento de raciocínio lógico
            - Aprendizado de algoritmos e estruturas de dados

            Princípios científicos aplicados:
            1. Redução de carga cognitiva através de demonstração
            2. Desenvolvimento de esquemas mentais generalizáveis
            3. Aprendizado através de análise de erros
            """,

            MethodologyType.SEQUENTIAL_THINKING: """
            Pensamento Sequencial é ideal para:
            - Problemas que requerem análise passo a passo
            - Desenvolvimento de algoritmos complexos
            - Estudantes que precisam de estrutura clara

            Foco em: decomposição sistemática do problema
            """,

            MethodologyType.ANALOGY: """
            Analogias funcionam bem para:
            - Conceitos abstratos de programação
            - Estudantes visuais e associativos
            - Explicação de conceitos complexos

            Princípio: aproximar conceitos desconhecidos a experiências familiares
            """,

            MethodologyType.SOCRATIC: """
            Método Socrático desenvolve:
            - Pensamento crítico e análise profunda
            - Capacidade de questionamento autônomo
            - Reflexão sobre o próprio aprendizado

            Técnica: perguntas encadeadas que guiam o estudante à descoberta
            """,

            MethodologyType.SCAFFOLDING: """
            Scaffolding oferece:
            - Suporte gradual conforme o estudante avança
            - Retirada progressiva de ajuda
            - Desenvolvimento de autonomia

            Ideal para: estudantes iniciantes e conceitos progressivos
            """
        }

        return guidance.get(methodology, "Abordagem educacional geral aplicada")
