from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Any, Dict, Optional
from app.services.chat_service import ChatService
from app.services.whiteboard_ai_service import WhiteboardAIService
from app.services.rag_service import RAGService
from uuid import UUID

router = APIRouter()

class WhiteboardAskRequest(BaseModel):
    message: str
    excalidraw_json: Dict[str, Any]
    chat_id: Optional[str] = None
    prompt_template: Optional[str] = None
    use_rag: Optional[bool] = False

class WhiteboardAskResponse(BaseModel):
    answer: str
    chat_id: Optional[str] = None

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

@router.post("/api/whiteboard/ask", response_model=WhiteboardAskResponse)
async def ask_whiteboard(
    req: WhiteboardAskRequest,
    chat_service: Optional[ChatService] = Depends(get_chat_service),
    ai_service: WhiteboardAIService = Depends(get_whiteboard_ai_service),
    rag_service: RAGService = Depends(get_rag_service)
):
    chat_id = req.chat_id
    # Salvar mensagem do usuário no chat, se chat_id fornecido
    if chat_id and chat_service:
        chat_service.save_chat_message(chat_id, role="user", content=req.message)

    # Consultar contexto RAG se solicitado
    rag_context = ""
    if req.use_rag:
        rag_context = rag_service.retrieve_context(req.message)

    # Montar prompt final
    prompt = req.prompt_template or "Responda à pergunta do usuário com base no conteúdo do quadro Excalidraw."
    if rag_context:
        prompt += f"\nContexto adicional: {rag_context}"

    # Chamar IA (Agno)
    answer = ai_service.ask_whiteboard_ai(req.message, req.excalidraw_json, prompt_template=prompt)

    # Salvar resposta da IA no chat, se chat_id fornecido
    if chat_id and chat_service:
        chat_service.save_chat_message(chat_id, role="ai", content=answer)

    return WhiteboardAskResponse(answer=answer, chat_id=chat_id) 