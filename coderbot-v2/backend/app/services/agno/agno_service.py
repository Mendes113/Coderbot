"""
Serviço Principal AGNO - Refatorado

Versão refatorada seguindo padrões da indústria com:
- Separação clara de responsabilidades
- Injeção de dependências
- Serviços especializados
- Melhor testabilidade
- Código mais limpo e organizado
"""

import time
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from .types.agno_types import (
    MethodologyType,
    AgnoRequest,
    AgnoResponse,
    UserContext,
    ProcessingMetadata,
)
from .constants.agno_constants import (
    METHODOLOGY_CONFIGS,
    DEFAULT_MODELS,
    ERROR_CONFIG,
    PERFORMANCE_CONFIG,
)

# Importar serviços especializados
from .core.validation_service import ValidationService
from .core.response_service import ResponseService
from .core.context_service import ContextService
from .core.worked_examples_service import WorkedExamplesService

# Importar serviços externos necessários
from ..template_service import UnifiedTemplateService
from ..agno_models import create_model
from ..agno_team_service import AgnoTeamService


class AgnoService:
    """
    Serviço principal AGNO refatorado.

    Coordena todos os serviços especializados e fornece
    uma interface limpa para processamento de requisições.
    """

    def __init__(self, model_id: str = None, provider: str = None):
        """
        Inicializa o serviço AGNO com configuração modular.

        Args:
            model_id: ID do modelo a ser usado
            provider: Provedor do modelo ('claude', 'openai', 'ollama')
        """
        self.logger = logging.getLogger(__name__)

        # Configurar modelo padrão se não especificado
        if not model_id:
            model_id = DEFAULT_MODELS.get(provider or "claude", "claude-3-5-sonnet-20241022")

        self.model_id = model_id
        self.provider = provider or self._detect_provider(model_id)

        # Inicializar serviços especializados
        self.validation_service = ValidationService()
        self.response_service = ResponseService()
        self.context_service = ContextService()
        self.worked_examples_service = WorkedExamplesService()

        # Inicializar serviços externos
        self.template_service = UnifiedTemplateService()

        # Configurações de modelo
        self.model_config = self._load_model_config()

        self.logger.info(
            "AgnoService inicializado com modelo: %s (provedor: %s)",
            model_id,
            self.provider
        )

    def process_request(self, request: AgnoRequest) -> AgnoResponse:
        """
        Processa uma requisição completa seguindo padrão da indústria.

        Esta é a função principal que coordena todos os serviços especializados.

        Args:
            request: Requisição AGNO com todos os dados necessários

        Returns:
            AgnoResponse: Resposta processada e estruturada

        Raises:
            ValueError: Se a requisição for inválida
            RuntimeError: Se houver erro na geração da resposta
        """
        start_time = time.time()
        start_dt = datetime.utcnow()

        try:
            # 1. Validar requisição
            self._validate_request(request)

            # 2. Converter metodologia
            methodology_enum = MethodologyType(request.methodology)

            # 3. Construir contexto augmentado
            augmented_context = self._build_augmented_context(request)

            # 4. Gerar resposta
            response = self._generate_response(methodology_enum, request, augmented_context)

            # 5. Pós-processar resposta
            processed_response = self._post_process_response(response, request)

            # 6. Construir segmentos
            segments = self._build_segments(processed_response, request.user_query)

            # 7. Criar metadados
            metadata = self._create_metadata(start_time, request)

            # 8. Construir resposta final
            result = AgnoResponse(
                response=processed_response,
                methodology=request.methodology,
                is_xml_formatted=False,
                metadata=metadata,
                segments=segments
            )

            # 9. Persistir sessão (melhor esforço)
            self._persist_session_if_needed(request, result, start_time)

            return result

        except Exception as e:
            self.logger.error(f"Erro no processamento da requisição: {str(e)}")
            raise RuntimeError(f"Erro na geração da resposta: {str(e)}")

    def _validate_request(self, request: AgnoRequest) -> None:
        """Valida todos os aspectos de uma requisição."""
        validations = []

        # Validar metodologia
        validations.append(self.validation_service.validate_methodology(request.methodology))

        # Validar consulta do usuário
        validations.append(self.validation_service.validate_user_query(request.user_query))

        # Validar contexto adicional
        validations.append(self.validation_service.validate_context(request.context))

        # Validar contexto do usuário
        user_context = self.context_service.build_user_context_from_request(
            request.user_context.__dict__ if request.user_context else None
        )
        validations.append(self.validation_service.validate_user_context(user_context))

        # Validar se é consulta educacional
        validations.append(
            self.validation_service.validate_educational_query(request.user_query, user_context)
        )

        # Verificar se alguma validação falhou
        for validation in validations:
            if not validation.get("valid", False):
                raise ValueError(validation.get("message", "Requisição inválida"))

    def _build_augmented_context(self, request: AgnoRequest) -> str:
        """Constrói contexto augmentado com instruções e memória."""
        # Contexto base
        base_context = request.context or ""

        # Augmentar com instruções de formatação
        augmented_context = self.context_service.augment_context_for_outputs(
            base_context,
            request.include_final_code,
            request.max_final_code_lines
        )

        # Adicionar memória do usuário se disponível
        if request.user_context and request.user_context.user_id:
            # Nota: Em produção, buscar sessões reais do banco
            # Por ora, retorna contexto sem memória específica
            pass

        return augmented_context

    def _generate_response(self, methodology: MethodologyType, request: AgnoRequest,
                          context: str) -> str:
        """Gera resposta usando o modelo apropriado."""
        try:
            # Criar contexto do template
            template_context = {
                "user_query": request.user_query,
                "knowledge_base": context,
            }

            # Renderizar template
            render_result = self.template_service.render(methodology.value, template_context)
            prompt = render_result.prompt

            # Criar agente AGNO
            agent = self._create_agent(methodology)

            # Executar agente
            run_response = agent.run(prompt)

            # Extrair resposta
            if hasattr(run_response, 'content'):
                response = run_response.content
            elif isinstance(run_response, str):
                response = run_response
            else:
                response = str(run_response)

            return response

        except Exception as e:
            self.logger.error(f"Erro na geração da resposta: {str(e)}")
            raise RuntimeError(f"Falha na geração da resposta: {str(e)}")

    def _post_process_response(self, response: str, request: AgnoRequest) -> str:
        """Aplica pós-processamentos na resposta."""
        # Sanitizar resposta
        response = self.response_service.sanitize_response(response)

        # Embaralhar quiz se presente
        response = self.response_service.shuffle_quiz_in_markdown(response)

        return response

    def _build_segments(self, response: str, user_query: str) -> List[Dict[str, Any]]:
        """Constrói segmentos estruturados da resposta."""
        try:
            # Extrair blocos de código
            blocks = self.response_service.extract_fenced_blocks(response)

            # Selecionar código final
            final_code = None
            if request.include_final_code:
                final_code = self.response_service.pick_final_code(
                    blocks,
                    request.max_final_code_lines
                )

            # Construir segmentos
            segments = self.response_service.build_segments(response, final_code, user_query)

            return segments

        except Exception as e:
            self.logger.error(f"Erro na construção de segmentos: {str(e)}")
            return []

    def _create_metadata(self, start_time: float, request: AgnoRequest) -> ProcessingMetadata:
        """Cria metadados de processamento."""
        # Extrair blocos de código para metadados
        blocks = self.response_service.extract_fenced_blocks(request.user_query)
        final_code = None

        if request.include_final_code:
            final_code = self.response_service.pick_final_code(blocks, request.max_final_code_lines)

        # Criar metadados
        return self.response_service.create_metadata(
            start_time,
            request.methodology,
            request.context is not None,
            request.user_context is not None,
            final_code
        )

    def _persist_session_if_needed(self, request: AgnoRequest, response: AgnoResponse,
                                 start_time: float) -> None:
        """Persiste sessão de aprendizagem se necessário."""
        try:
            if request.user_context and request.user_context.user_id:
                duration_minutes = int((time.time() - start_time) / 60) or 0

                # Criar sessão
                session = self.response_service.create_learning_session(
                    user_id=request.user_context.user_id,
                    methodology=request.methodology,
                    start_time=datetime.utcnow(),
                    user_query=request.user_query,
                    response=self.response_service.truncate_response_for_logging(response.response),
                    duration_minutes=duration_minutes
                )

                # Nota: Em produção, salvar no banco de dados
                # await self.session_service.save_session(session)

        except Exception as e:
            # Falhas de persistência não devem impedir resposta
            self.logger.warning(f"Falha ao persistir sessão: {str(e)}")

    def _create_agent(self, methodology: MethodologyType):
        """Cria agente AGNO para metodologia específica."""
        try:
            config = METHODOLOGY_CONFIGS.get(methodology, METHODOLOGY_CONFIGS[MethodologyType.DEFAULT])

            # Criar modelo
            model_kwargs = {}
            if self.provider == "claude":
                # Configurar API key se necessário
                pass
            elif self.provider == "ollama":
                model_kwargs.setdefault("base_url", "http://localhost:11434")

            model = create_model(self.provider, self.model_id, **model_kwargs)

            # Criar agente
            return Agent(
                model=model,
                description=config.description,
                instructions=[self._build_methodology_instructions(config)],
                markdown=True
            )

        except Exception as e:
            self.logger.error(f"Erro ao criar agente {self.provider}: {e}")
            raise RuntimeError(f"Falha ao criar agente {self.provider}: {str(e)}")

    def _build_methodology_instructions(self, config) -> str:
        """Constrói instruções específicas para metodologia."""
        return f"""
        Você é um tutor especializado em {config.display_name}.
        {config.description}

        Use cases recomendados:
        {', '.join(config.use_cases)}

        Mantenha respostas claras, estruturadas e educacionais.
        """

    def _detect_provider(self, model_id: str) -> str:
        """Detecta provedor baseado no model_id."""
        if model_id.startswith('claude'):
            return 'claude'
        elif model_id.startswith(('gpt', 'o1', 'o3')):
            return 'openai'
        elif model_id.startswith('ollama/') or model_id.startswith('ollama:'):
            return 'ollama'
        else:
            return 'openai'  # padrão

    def generate_worked_example_segments(self, user_query: str, topic: str = "programming",
                                       methodology: MethodologyType = MethodologyType.WORKED_EXAMPLES,
                                       difficulty: str = "beginner") -> Dict[str, Any]:
        """
        Gera segmentos de worked examples estruturados usando técnicas científicas.

        Este método implementa as melhores práticas de prompt engineering baseadas
        em pesquisa científica para criar exemplos educativos interativos.

        Args:
            user_query: Consulta específica do estudante
            topic: Tópico do exemplo (ex: "funções", "arrays")
            methodology: Metodologia a ser utilizada
            difficulty: Nível de dificuldade

        Returns:
            Dicionário com segmentos estruturados e metadados científicos
        """
        try:
            # Gerar prompt otimizado baseado em técnicas científicas
            prompt = self.worked_examples_service.generate_worked_example_prompt(
                user_query, topic, difficulty
            )

            # Criar agente especializado para worked examples
            agent = self._create_specialized_agent(methodology, "worked_examples")

            # Executar geração com chain of thought
            run_response = agent.run(prompt)

            # Extrair resposta
            if hasattr(run_response, 'content'):
                response = run_response.content
            elif isinstance(run_response, str):
                response = run_response
            else:
                response = str(run_response)

            # Parsear resposta estruturada
            worked_example_segments = self.worked_examples_service.parse_worked_example_response(response)

            if not worked_example_segments:
                # Fallback para exemplo básico se parsing falhar
                worked_example_segments = self.worked_examples_service.generate_fallback_worked_example(
                    user_query, topic
                )

            # Validar estrutura
            validation = self.worked_examples_service.validate_worked_example_structure(worked_example_segments)

            if not validation["valid"]:
                self.logger.warning(f"Estrutura de worked example inválida: {validation['errors']}")

            # Converter para formato do frontend
            frontend_segments = self.worked_examples_service.convert_to_frontend_segments(worked_example_segments)

            # Adicionar orientação educacional baseada na metodologia
            educational_guidance = self.worked_examples_service.get_educational_guidance(topic, methodology)

            return {
                "worked_example_segments": worked_example_segments,
                "frontend_segments": frontend_segments,
                "validation": validation,
                "educational_guidance": educational_guidance,
                "methodology": methodology.value,
                "topic": topic,
                "difficulty": difficulty,
                "generated_at": self._get_current_time(),
                "scientific_basis": [
                    "Example-Based Learning (EBL)",
                    "Cognitive Load Theory",
                    "Self-Explanation Effect",
                    "Error Analysis in Learning"
                ]
            }

        except Exception as e:
            self.logger.error(f"Erro na geração de worked example: {str(e)}")

            # Retornar exemplo básico como fallback
            fallback_segments = self.worked_examples_service.generate_fallback_worked_example(user_query, topic)
            frontend_segments = self.worked_examples_service.convert_to_frontend_segments(fallback_segments)

            return {
                "worked_example_segments": fallback_segments,
                "frontend_segments": frontend_segments,
                "validation": {"valid": True, "score": 0.5, "errors": [f"Fallback usado devido a erro: {str(e)}"]},
                "educational_guidance": "Abordagem básica aplicada devido a erro na geração especializada",
                "methodology": methodology.value,
                "topic": topic,
                "difficulty": difficulty,
                "generated_at": self._get_current_time(),
                "fallback_used": True,
                "error": str(e)
            }

    def _create_specialized_agent(self, methodology: MethodologyType, specialization: str):
        """Cria agente especializado para geração de worked examples."""
        try:
            config = METHODOLOGY_CONFIGS.get(methodology, METHODOLOGY_CONFIGS[MethodologyType.DEFAULT])

            # Configurações específicas para worked examples
            we_config = {
                "temperature": 0.7,  # Criatividade controlada
                "max_tokens": 4000,   # Espaço para JSON estruturado
                "top_p": 0.9         # Foco em respostas relevantes
            }

            model = create_model(self.provider, self.model_id, **we_config)

            return Agent(
                model=model,
                description=f"Especialista em {specialization} baseado em princípios científicos",
                instructions=[
                    "Você é um especialista em criação de exemplos educativos estruturados.",
                    "Siga rigorosamente o formato JSON especificado.",
                    "Baseie-se em princípios científicos de aprendizagem.",
                    "Adapte complexidade ao nível do estudante.",
                    "Responda APENAS com JSON válido, sem texto adicional."
                ],
                markdown=False  # Forçar saída pura
            )

        except Exception as e:
            self.logger.error(f"Erro ao criar agente especializado: {e}")
            # Fallback para agente padrão
            return self._create_agent(methodology)

    def _get_current_time(self) -> datetime:
        """Obtém timestamp atual."""
        return datetime.utcnow()

    def _load_model_config(self) -> Dict[str, Any]:
        """Carrega configuração de modelos."""
        try:
            from pathlib import Path
            config_path = Path(__file__).parent / "configs" / "model_config.json"
            if config_path.exists():
                import json
                with open(config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            self.logger.warning(f"Erro ao carregar configuração de modelos: {e}")

        return {}


# Classe Agent precisa ser definida ou importada
from agno.agent import Agent


# Funções auxiliares para compatibilidade
def get_methodology_config(methodology: MethodologyType) -> Dict[str, Any]:
    """Retorna configuração de metodologia."""
    return METHODOLOGY_CONFIGS.get(methodology, METHODOLOGY_CONFIGS[MethodologyType.DEFAULT])


def get_all_methodology_configs() -> Dict[MethodologyType, Dict[str, Any]]:
    """Retorna todas as configurações de metodologia."""
    return {k: v.__dict__ if hasattr(v, '__dict__') else v for k, v in METHODOLOGY_CONFIGS.items()}
