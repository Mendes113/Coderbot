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
        
        # Obter o template específico para a metodologia
        template = self.prompt_loader.get_prompt(
            methodology=methodology_type.value,
            name=additional_params.get("prompt_name")
        )
        
        if not template:
            logger.warning(f"Template não encontrado para metodologia: {methodology_type.value}")
            # Fallback para template padrão
            template = self.prompt_loader.get_prompt(methodology=MethodologyType.DEFAULT.value)
            if not template:
                # Se ainda não encontrar, use um template básico
                template = "Responda à seguinte pergunta: {user_query}"
        
        # Preparação de dados para formatar o prompt
        prompt_data = {
            "user_query": user_query,
            "context_history": context_history,
            "knowledge_base": knowledge_base,
            # Dados do perfil do usuário
            "difficulty_level": user_profile.get("difficulty_level", "intermediate"),
            "baseKnowledge": user_profile.get("baseKnowledge", ""),
            "learning_progress": user_profile.get("learning_progress", ""),
            "style_preference": user_profile.get("style_preference", "balanced"),
            "subject_area": user_profile.get("subject_area", "programming"),
        }
        
        # Adiciona quaisquer parâmetros adicionais como dados do prompt
        prompt_data.update(additional_params)
        
        # Formata o template com os dados
        final_prompt = self.prompt_loader.format_prompt(template, prompt_data)
        
        # Processamento específico para cada metodologia
        return await self._process_methodology_specific(
            methodology_type, 
            final_prompt, 
            user_profile, 
            additional_params
        )
    
    async def _process_methodology_specific(
        self,
        methodology_type: MethodologyType,
        formatted_prompt: str,
        user_profile: Dict[str, Any],
        additional_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Aplica processamento específico para cada metodologia.
        
        Args:
            methodology_type: O tipo de metodologia
            formatted_prompt: O prompt já formatado
            user_profile: Perfil do usuário
            additional_params: Parâmetros adicionais
            
        Returns:
            Dicionário com prompt e metadados para a LLM
        """
        result = {
            "formatted_prompt": formatted_prompt,
            "metadata": {
                "methodology": methodology_type.value,
            }
        }
        
        # Ajustes específicos por metodologia
        if methodology_type == MethodologyType.SEQUENTIAL_THINKING:
            result["metadata"]["thinking_steps"] = additional_params.get("thinking_steps", 3)
            result["metadata"]["show_steps"] = additional_params.get("show_steps", True)
            
        elif methodology_type == MethodologyType.ANALOGY:
            result["metadata"]["domain"] = user_profile.get("baseKnowledge", "")
            result["metadata"]["use_analogies"] = True
            
        elif methodology_type == MethodologyType.SOCRATIC:
            result["metadata"]["question_depth"] = additional_params.get("question_depth", 2)
            
        elif methodology_type == MethodologyType.SCAFFOLDING:
            result["metadata"]["scaffolding_level"] = user_profile.get("learning_progress", "intermediate")
            
        elif methodology_type == MethodologyType.WORKED_EXAMPLES:
            result["metadata"]["example_phases"] = additional_params.get("example_phases", 6)
            result["metadata"]["cognitive_load_management"] = True
            result["metadata"]["step_by_step_demo"] = additional_params.get("step_by_step_demo", True)
            result["metadata"]["error_examples"] = additional_params.get("error_examples", True)
        
        return result
    
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
