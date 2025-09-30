"""
Router para o sistema AGNO (Adaptive Generation of Worked Examples).

Este router expõe endpoints para:
1. Interagir com o sistema AGNO usando diferentes metodologias educacionais
2. Listar metodologias disponíveis
3. Processar consultas com templates XML para worked examples
4. Gerenciar configurações e preferências de metodologias

Seguindo padrão da indústria: router simplificado que delega lógica de negócio para services.
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
import logging
import time
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from app.config import settings
from app.services.agno_methodology_service import (
    AgnoMethodologyService,
    MethodologyType,
    get_methodology_config,
)

router = APIRouter(
    prefix="/agno",
    tags=["agno"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

# --- Modelos Pydantic para validação e documentação ---

class UserContext(BaseModel):
    """Contexto do usuário para personalização das respostas."""
    user_id: str
    current_topic: Optional[str] = None
    difficulty_level: Optional[str] = None
    learning_progress: Optional[Dict[str, Any]] = None
    previous_interactions: Optional[List[str]] = None

class AgnoRequest(BaseModel):
    """Modelo para requisições ao sistema AGNO."""
    methodology: str = Field(
        description="Metodologia educacional a ser utilizada",
        example="worked_examples"
    )
    user_query: str = Field(
        description="Pergunta ou problema do usuário",
        example="Como resolver uma equação do segundo grau?"
    )
    context: Optional[str] = Field(
        default=None,
        description="Contexto adicional para a pergunta",
        example="Estamos estudando funções quadráticas na disciplina de matemática"
    )
    user_context: Optional[UserContext] = Field(
        default=None,
        description="Contexto do usuário para personalização"
    )
    # Preferências de saída
    include_final_code: Optional[bool] = Field(
        default=True,
        description="Se verdadeiro, instrui o agente a incluir um bloco final com o código completo."
    )
    # Mantido para compatibilidade, mas ignorado
    include_diagram: Optional[bool] = Field(
        default=False,
        description="(Deprecado) Diagrama não é mais gerado pela API."
    )
    diagram_type: Optional[str] = Field(
        default=None,
        description="(Ignorado) Tipo de diagrama preferido"
    )
    max_final_code_lines: Optional[int] = Field(
        default=150,
        description="Limite de linhas para o código final (para usabilidade)."
    )

# Definido antes para evitar problemas de forward-ref em respostas
class ResponseSegment(BaseModel):
    """Um segmento estruturado da resposta para navegação passo a passo no frontend."""
    id: str = Field(description="Identificador estável do segmento")
    title: str = Field(description="Título curto do segmento")
    type: str = Field(description="Tipo do segmento (intro, steps, correct_example, incorrect_example, reflection, final_code)")
    content: str = Field(description="Conteúdo em Markdown do segmento. Para final_code, apenas um bloco de código")
    language: Optional[str] = Field(default=None, description="Linguagem do bloco de código quando type=final_code")

class AgnoResponse(BaseModel):
    """Modelo de resposta do sistema AGNO."""
    response: str = Field(description="Resposta gerada pelo sistema AGNO")
    methodology: str = Field(description="Metodologia utilizada")
    is_xml_formatted: bool = Field(
        description="Indica se a resposta está formatada em XML"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Metadados adicionais da resposta"
    )
    extras: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Dados extras como código final extraído da resposta"
    )
    # Novo: segmentos estruturados para navegação passo a passo no frontend
    segments: Optional[List[ResponseSegment]] = Field(
        default=None,
        description="Lista de segmentos estruturados (intro, steps, exemplos, reflexão, final_code)"
    )

class MethodologyInfo(BaseModel):
    """Informações sobre uma metodologia educacional."""
    id: str
    name: str
    description: str
    recommended_for: List[str]
    is_xml_formatted: bool = Field(
        description="Indica se a metodologia retorna respostas em XML"
    )

class MethodologiesResponse(BaseModel):
    """Lista de metodologias disponíveis."""
    methodologies: List[str]
    methodology_info: List[MethodologyInfo]

class HealthResponse(BaseModel):
    """Resposta de health check."""
    status: str = "healthy"
    service: str = "agno"
    timestamp: float

# (classe ResponseSegment movida acima de AgnoResponse para evitar forward-ref)

# --- Dependências ---

def get_agno_service(
    provider: Optional[str] = Query(default="claude", description="Provedor de IA (claude, openai ou ollama)"),
    model_id: Optional[str] = Query(default=None, description="ID do modelo específico")
) -> AgnoMethodologyService:
    """Cria e retorna uma instância do serviço AGNO."""
    # Mapear modelos padrão por provedor
    default_models = {
        "claude": "claude-3-5-sonnet-20241022",
        "openai": "gpt-4o",
        "ollama": settings.ollama_default_model or "llama3.1",
    }
    provider_key = (provider or "claude").lower()
    provider = provider_key
    
    # Se model_id não foi especificado, usar o padrão do provedor
    if not model_id:
        model_id = default_models.get(provider, "claude-3-5-sonnet-20241022")
    
    return AgnoMethodologyService(model_id=model_id, provider=provider)

# --- Endpoints ---

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Endpoint de health check do serviço AGNO."""
    return HealthResponse(timestamp=time.time())

@router.get("/methodologies", response_model=MethodologiesResponse)
async def get_methodologies(
    agno_service: AgnoMethodologyService = Depends(get_agno_service)
):
    """
    Retorna a lista de metodologias educacionais disponíveis.
    
    Returns:
        MethodologiesResponse: Lista de metodologias com informações detalhadas
    """
    try:
        methodologies = [methodology.value for methodology in MethodologyType]

        methodology_info = []
        for methodology in MethodologyType:
            config = get_methodology_config(methodology)
            info = MethodologyInfo(
                id=methodology.value,
                name=config["display_name"],
                description=config["summary"],
                recommended_for=config["use_cases"],
                is_xml_formatted=config["xml_formatted"],
            )
            methodology_info.append(info)

        return MethodologiesResponse(
            methodologies=methodologies,
            methodology_info=methodology_info
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar metodologias: {str(e)}"
        )

@router.post("/ask", response_model=AgnoResponse)
async def ask_question(
    request: AgnoRequest,
    agno_service: AgnoMethodologyService = Depends(get_agno_service)
):
    """
    Processa uma pergunta usando o sistema AGNO.

    Seguindo padrão da indústria: router simples que delega processamento para o service.
    
    Args:
        request: Requisição contendo a pergunta e metodologia
        agno_service: Instância do serviço AGNO
        
    Returns:
        AgnoResponse: Resposta processada pelo sistema AGNO
    """
    try:
        # Converte contexto do usuário para formato esperado pelo service
        user_context = None
        if request.user_context:
            user_context = {
                'user_id': request.user_context.user_id,
                'current_topic': request.user_context.current_topic,
                'difficulty_level': request.user_context.difficulty_level,
                'learning_progress': request.user_context.learning_progress,
                'previous_interactions': request.user_context.previous_interactions
            }

        # Delega todo o processamento para o service
        result = agno_service.process_ask_request(
            methodology=request.methodology,
            user_query=request.user_query,
            context=request.context,
            user_context=user_context,
            include_final_code=request.include_final_code,
            max_final_code_lines=request.max_final_code_lines or 150
        )

        # Converte resultado do service para formato de resposta esperado
        return AgnoResponse(
            response=result["response"],
            methodology=result["methodology"],
            is_xml_formatted=result["is_xml_formatted"],
            metadata=result["metadata"],
            extras=result["extras"],
            segments=result["segments"]
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de validação: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Erro interno no processamento da pergunta: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )

@router.post("/worked-example", response_model=AgnoResponse)
async def get_worked_example(
    request: AgnoRequest,
    agno_service: AgnoMethodologyService = Depends(get_agno_service)
):
    """
    Endpoint de conveniência para obter um worked example.
    
    Args:
        request: Requisição AGNO com pergunta e contexto
        agno_service: Instância do serviço AGNO
        
    Returns:
        AgnoResponse: Resposta em formato XML com worked example
    """
    # Força a metodologia para worked examples
    request.methodology = MethodologyType.WORKED_EXAMPLES.value
    
    return await ask_question(request, agno_service)
