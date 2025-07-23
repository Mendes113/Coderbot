"""
Router para interações de chat com metodologias educacionais personalizáveis.

Este router expõe endpoints para:
1. Interagir com o chat usando diferentes metodologias educacionais
2. Listar metodologias disponíveis
3. Gerenciar configurações e preferências de metodologias
"""

from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks, status
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import uuid

from app.models.deepseek_models import ChatCompletionRequest, ChatCompletionResponse
from app.services.orchestration_service import OrchestrationService, create_orchestration_service
from app.services.educational_methodology_service import MethodologyType

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    responses={404: {"description": "Not found"}},
)

# --- Modelos Pydantic para validação e documentação ---

class ChatSessionRequest(BaseModel):
    """Modelo para iniciar uma nova sessão de chat."""
    user_id: Optional[str] = None
    methodology: str = Field(
        default=MethodologyType.DEFAULT.value,
        description="Metodologia de ensino a ser utilizada"
    )
    metadata: Optional[Dict[str, Any]] = None

class ChatSessionResponse(BaseModel):
    """Modelo de resposta para criação de sessão."""
    sessionId: str
    methodology: str
    message: str = "Sessão iniciada com sucesso"

class MethodologyInfo(BaseModel):
    """Informações sobre uma metodologia de ensino."""
    id: str
    name: str
    description: str
    recommended_for: List[str]

class MethodologiesResponse(BaseModel):
    """Lista de metodologias disponíveis."""
    methodologies: List[MethodologyInfo]

class EnhancedChatRequest(ChatCompletionRequest):
    """Extensão do modelo ChatCompletionRequest com informações adicionais."""
    methodology: Optional[str] = Field(
        default=None,
        description="Metodologia de ensino específica para esta mensagem"
    )
    sessionId: Optional[str] = Field(
        default=None,
        description="ID da sessão de chat"
    )
    user_profile: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Perfil do usuário para personalização"
    )

class EnhancedChatResponse(BaseModel):
    """Resposta enriquecida com metadados educacionais."""
    response: Dict[str, Any]
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Metadados sobre a metodologia aplicada"
    )

# --- Dependências ---

def get_orchestration_service():
    """
    Dependency para obter uma instância configurada do OrchestrationService.
    """
    return create_orchestration_service()

# --- Rotas ---

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(
    request: ChatSessionRequest
):
    """
    Cria uma nova sessão de chat com a metodologia especificada.
    """
    sessionId = str(uuid.uuid4())
    
    # Aqui poderia salvar a sessão no PocketBase ou banco de dados
    
    return ChatSessionResponse(
        sessionId=sessionId,
        methodology=request.methodology,
        message="Sessão iniciada com sucesso"
    )

@router.get("/methodologies", response_model=MethodologiesResponse)
async def list_methodologies(
    service: OrchestrationService = Depends(get_orchestration_service)
):
    """
    Lista todas as metodologias educacionais disponíveis.
    """
    methodologies = service.educational_methodology_service.get_available_methodologies()
    return MethodologiesResponse(methodologies=methodologies)

@router.post("/completions", response_model=EnhancedChatResponse)
async def chat_completions(
    request: EnhancedChatRequest,
    background_tasks: BackgroundTasks,
    service: OrchestrationService = Depends(get_orchestration_service)
):
    """
    Endpoint principal para interação com o chat usando metodologias educacionais.
    
    - Se sessionId não for fornecido, cria uma nova sessão.
    - A metodologia pode ser especificada na requisição ou será usada a padrão.
    - O perfil do usuário pode ser fornecido para personalização.
    """
    # Se não houver sessionId, cria um novo
    sessionId = request.sessionId or str(uuid.uuid4())
    
    # Metodologia padrão se não especificada
    methodology = request.methodology or MethodologyType.DEFAULT.value
    
    try:
        # Processa a requisição de chat através do serviço de orquestração
        result = await service.process_chat_request(
            request=request,
            sessionId=sessionId,
            methodology=methodology,
            user_profile=request.user_profile
        )
        
        # Adicionar limpeza de recursos em background (se necessário)
        background_tasks.add_task(service.rag_service.close_sources)
        
        return EnhancedChatResponse(
            response=result["response"],
            metadata=result["metadata"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar requisição: {str(e)}"
        )

@router.get("/completions/{sessionId}/history")
async def get_chat_history(
    sessionId: str,
    limit: int = Query(10, description="Número máximo de mensagens a retornar"),
    service: OrchestrationService = Depends(get_orchestration_service)
):
    """
    Recupera o histórico de mensagens de uma sessão de chat.
    """
    history = await service._get_conversation_history(sessionId)
    return {"sessionId": sessionId, "history": history}
