from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Any, Dict, Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.services.chat_service import ChatService  # pragma: no cover
else:
    ChatService = Any

from app.services.whiteboard_ai_service import WhiteboardAIService
from app.services.rag_service import RAGService
from app.services.orchestration_service import create_orchestration_service, OrchestrationService
from app.services.educational_methodology_service import MethodologyType
from uuid import UUID

router = APIRouter()

class WhiteboardAskRequest(BaseModel):
    message: str
    excalidraw_json: Dict[str, Any]
    chat_id: Optional[str] = None
    prompt_template: Optional[str] = None
    use_rag: Optional[bool] = False
    methodology: Optional[str] = MethodologyType.DEFAULT.value
    user_profile: Optional[Dict[str, Any]] = None

class WhiteboardAskResponse(BaseModel):
    answer: str
    chat_id: Optional[str] = None
    
class MethodologyInfoResponse(BaseModel):
    methodologies: List[Dict[str, Any]]

# Dependência para obter o serviço de chat (ajuste conforme seu DI)
def get_chat_service():
    # Aqui você pode obter a sessão do banco conforme seu setup
    # Exemplo: db_session = next(get_db())
    # return ChatService(db_session)
    # Por enquanto, placeholder:
    return None

# Dependências para os serviços de IA e RAG
def get_whiteboard_ai_service():
    return WhiteboardAIService()

def get_rag_service():
    return RAGService()

def get_orchestration_service():
    return create_orchestration_service()

@router.post("/api/whiteboard/ask", response_model=WhiteboardAskResponse)
async def ask_whiteboard(
    req: WhiteboardAskRequest,
    chat_service: Optional[ChatService] = Depends(get_chat_service),
    ai_service: WhiteboardAIService = Depends(get_whiteboard_ai_service),
    rag_service: RAGService = Depends(get_rag_service),
    orchestration_service: OrchestrationService = Depends(get_orchestration_service)
):
    chat_id = req.chat_id
    # Salvar mensagem do usuário no chat, se chat_id fornecido
    if chat_id and chat_service:
        chat_service.save_chat_message(chat_id, role="user", content=req.message)

    # Verificar se deve usar o fluxo de metodologias educacionais
    if req.methodology and req.methodology != MethodologyType.DEFAULT.value:
        # Criar um objeto ChatCompletionRequest para passar ao serviço de orquestração
        from app.models.deepseek_models import ChatCompletionRequest
        
        # Preparar o contexto do whiteboard para o prompt
        whiteboard_context = f"O usuário está interagindo com um quadro Excalidraw. " \
                            f"Aqui está a representação JSON do quadro: {str(req.excalidraw_json)[:500]}... (truncado)"
        
        # Criar request para o serviço de orquestração
        chat_request = ChatCompletionRequest(
            model="gpt-4",  # Pode ser configurado ou passado pelo frontend
            messages=[
                {"role": "user", "content": f"{req.message}\n\nContexto do quadro: {whiteboard_context}"}
            ],
            temperature=0.7
        )
        
        # Processar usando o serviço de orquestração com a metodologia solicitada
        result = await orchestration_service.process_chat_request(
            request=chat_request,
            sessionId=chat_id or "whiteboard-session", # Re-added as it's a required argument
            methodology=req.methodology,
            user_profile=req.user_profile or {}
        )
        
        # Extrair resposta
        answer = result["response"]["choices"][0]["message"]["content"]
        
        # Salvar resposta da IA no chat, se chat_id fornecido
        if chat_id and chat_service:
            chat_service.save_chat_message(chat_id, role="ai", content=answer)
        
        return WhiteboardAskResponse(answer=answer, chat_id=chat_id)
    else:
        # Usar o fluxo original para compatibilidade
        # Consultar contexto RAG se solicitado
        rag_context = ""
        if req.use_rag:
            rag_context = rag_service.retrieve_context(req.message)
    
        # Montar prompt final
        prompt = req.prompt_template or "Responda à pergunta do usuário com base no conteúdo do quadro Excalidraw."
        if rag_context:
            prompt += f"\nContexto adicional: {rag_context}"
    
        # Chamar IA
        answer = ai_service.ask_whiteboard_ai(req.message, req.excalidraw_json, prompt_template=prompt)
    
        # Salvar resposta da IA no chat, se chat_id fornecido
        if chat_id and chat_service:
            chat_service.save_chat_message(chat_id, role="ai", content=answer)
    
        return WhiteboardAskResponse(answer=answer, chat_id=chat_id)
        

@router.get("/api/whiteboard/methodologies", response_model=MethodologyInfoResponse)
async def get_methodologies(
    orchestration_service: OrchestrationService = Depends(get_orchestration_service)
):
    """
    Lista as metodologias educacionais disponíveis para uso no whiteboard.
    """
    methodologies = orchestration_service.educational_methodology_service.get_available_methodologies()
    return MethodologyInfoResponse(methodologies=methodologies)
