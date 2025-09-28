"""
Educational Methodology Service

Este serviço é responsável por implementar e gerenciar diferentes metodologias
educacionais que podem ser aplicadas às respostas da IA, como:
- Sequential Thinking
- Analogias
- Método Socrático
- Scaffolding (andaime educacional)

Cada metodologia tem sua própria estratégia de construção de prompts
e de processamento de respostas.
"""

import logging
from typing import Dict, Any, List, Optional
from enum import Enum
from app.services.prompt_loader import PromptLoader
from app.services.template_service import TemplateContext, TemplateRenderResult, UnifiedTemplateService

logger = logging.getLogger(__name__)

class MethodologyType(Enum):
    """Tipos de metodologias educacionais suportadas."""
    SEQUENTIAL_THINKING = "sequential_thinking"
    ANALOGY = "analogy"
    SOCRATIC = "socratic"
    SCAFFOLDING = "scaffolding"
    WORKED_EXAMPLES = "worked_examples"
    DEFAULT = "default"

class EducationalMethodologyService:
    """
    Serviço responsável por gerenciar e aplicar diferentes metodologias
    educacionais às interações com a IA.
    """
    
    def __init__(self, prompt_loader: PromptLoader):
        """
        Inicializa o serviço com um PromptLoader para carregar templates específicos.
        
        Args:
            prompt_loader: Instância do PromptLoader para carregar templates do PocketBase
        """
        self.prompt_loader = prompt_loader
        self.template_service = UnifiedTemplateService(prompt_loader)
    
    async def apply_methodology(
        self,
        methodology_type: MethodologyType,
        user_query: str,
        context_history: str = "",
        knowledge_base: str = "",
        user_profile: Dict[str, Any] = None,
        additional_params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Aplica uma metodologia específica ao contexto do usuário.
        
        Args:
            methodology_type: O tipo de metodologia a ser aplicada
            user_query: A pergunta ou entrada do usuário
            context_history: O histórico da conversa
            knowledge_base: Informações de uma base de conhecimento (RAG)
            user_profile: Perfil do usuário com informações relevantes para personalização
            additional_params: Parâmetros adicionais específicos da metodologia
            
        Returns:
            Dicionário com prompt formatado e metadados necessários para a LLM
        """
        user_profile = user_profile or {}
        additional_params = additional_params or {}
        
        template_context = TemplateContext(
            user_query=user_query,
            context_history=context_history,
            knowledge_base=knowledge_base,
            difficulty_level=user_profile.get("difficulty_level", "intermediate"),
            baseKnowledge=user_profile.get("baseKnowledge", ""),
            learning_progress=user_profile.get("learning_progress", ""),
            style_preference=user_profile.get("style_preference", "balanced"),
            subject_area=user_profile.get("subject_area", "programação"),
            extras=additional_params,
        )

        render_result = self.template_service.render(methodology_type.value, template_context)
        metadata = self._build_methodology_metadata(
            methodology_type,
            user_profile,
            additional_params,
            render_result,
        )

        return {
            "formatted_prompt": render_result.prompt,
            "metadata": metadata,
        }
    
    def _build_methodology_metadata(
        self,
        methodology_type: MethodologyType,
        user_profile: Dict[str, Any],
        additional_params: Dict[str, Any],
        render_result: TemplateRenderResult,
    ) -> Dict[str, Any]:
        """Compose metadata describing how the template should be used downstream."""

        metadata: Dict[str, Any] = {
            "methodology": methodology_type.value,
            "required_sections": render_result.required_sections,
            "research_tags": render_result.research_tags,
            "template_version": self.prompt_loader.get_template_version(),
            "placeholders": render_result.context_data,
            "user_profile_snapshot": user_profile,
            "generation_parameters": additional_params,
        }

        if methodology_type == MethodologyType.SEQUENTIAL_THINKING:
            metadata.update(
                {
                    "thinking_steps": additional_params.get("thinking_steps", 3),
                    "show_steps": additional_params.get("show_steps", True),
                }
            )
        elif methodology_type == MethodologyType.ANALOGY:
            metadata.update(
                {
                    "domain": user_profile.get("baseKnowledge", ""),
                    "use_analogies": True,
                }
            )
        elif methodology_type == MethodologyType.SOCRATIC:
            metadata.update(
                {
                    "question_depth": additional_params.get("question_depth", 2),
                    "use_questions_only": True,
                }
            )
        elif methodology_type == MethodologyType.SCAFFOLDING:
            metadata.update(
                {
                    "scaffolding_level": user_profile.get("learning_progress", "intermediate"),
                    "graduated_support": True,
                }
            )
        elif methodology_type == MethodologyType.WORKED_EXAMPLES:
            metadata.update(
                {
                    "example_phases": additional_params.get("example_phases", 6),
                    "cognitive_load_management": True,
                    "step_by_step_demo": additional_params.get("step_by_step_demo", True),
                    "error_examples": additional_params.get("error_examples", True),
                    "quiz_required": True,
                }
            )

        return metadata
    
    def get_available_methodologies(self) -> List[Dict[str, Any]]:
        """
        Retorna a lista de metodologias disponíveis e suas descrições.
        
        Returns:
            Lista de dicionários com informações sobre as metodologias
        """
        return [
            {
                "id": MethodologyType.SEQUENTIAL_THINKING.value,
                "name": "Pensamento Sequencial",
                "description": "Divide o raciocínio em etapas lógicas e ordenadas, apresentando o pensamento passo a passo.",
                "recommended_for": ["resolução de problemas", "explicações complexas", "algoritmos"],
            },
            {
                "id": MethodologyType.ANALOGY.value,
                "name": "Analogias",
                "description": "Usa comparações com conceitos familiares para explicar ideias abstratas ou complexas.",
                "recommended_for": ["conceitos abstratos", "iniciantes", "tópicos técnicos"],
            },
            {
                "id": MethodologyType.SOCRATIC.value,
                "name": "Método Socrático",
                "description": "Usa perguntas para estimular o pensamento crítico e levar o aluno a descobrir respostas.",
                "recommended_for": ["desenvolvimento de pensamento crítico", "aprofundamento de conhecimento"],
            },
            {
                "id": MethodologyType.SCAFFOLDING.value,
                "name": "Scaffolding (Andaime)",
                "description": "Fornece diferentes níveis de suporte conforme a necessidade do aluno, removendo gradualmente a ajuda conforme o aluno progride.",
                "recommended_for": ["aprendizado gradual", "desenvolvimento de habilidades"],
            },
            {
                "id": MethodologyType.WORKED_EXAMPLES.value,
                "name": "Exemplos Trabalhados",
                "description": "Usa exemplos passo-a-passo para demonstrar resolução de problemas, reduzindo carga cognitiva e facilitando aquisição de habilidades.",
                "recommended_for": ["novatos em programação", "aquisição de novas habilidades", "conceitos complexos"],
            },
        ]
