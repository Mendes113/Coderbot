"""
Orchestration Service

Este serviço orquestra o fluxo completo de uma requisição de chat,
coordenando a interação entre os diversos serviços (RAG, metodologias educacionais, LLM)
de forma a garantir uma resposta de alta qualidade seguindo os princípios SOLID.
"""

import logging
from typing import Dict, Any, Optional, List
from pocketbase import PocketBase
import json

from app.config import settings
from app.models.deepseek_models import ChatCompletionRequest
from app.services.prompt_loader import PromptLoader
from app.services.rag_service import RAGService
from app.services.educational_methodology_service import EducationalMethodologyService, MethodologyType
try:
    from app.services.deepseek_service import get_chat_completion_with_retrieval  # type: ignore
except ImportError:  # pragma: no cover - fallback when DeepSeek is not installed
    async def get_chat_completion_with_retrieval(*args, **kwargs):  # type: ignore
        raise RuntimeError(
            "DeepSeek service is not available. Provide a custom `get_chat_completion_with_retrieval` "
            "implementation or disable the orchestration flow."
        )

logger = logging.getLogger(__name__)

class OrchestrationService:
    """
    Serviço que gerencia o fluxo completo de uma solicitação de chat,
    coordenando todos os serviços necessários para gerar uma resposta.
    """
    
    def __init__(self,
                 prompt_loader: PromptLoader,
                 rag_service: RAGService,
                 educational_methodology_service: EducationalMethodologyService):
        """
        Inicializa o serviço com as dependências necessárias.
        
        Args:
            prompt_loader: Serviço para carregar templates de prompt
            rag_service: Serviço para recuperar contexto relevante
            educational_methodology_service: Serviço para aplicar metodologias educacionais
        """
        self.prompt_loader = prompt_loader
        self.rag_service = rag_service
        self.educational_methodology_service = educational_methodology_service
        
    async def process_chat_request(
        self,
        request: ChatCompletionRequest,
        sessionId: str,
        methodology: str = MethodologyType.DEFAULT.value,
        user_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Processa uma requisição de chat completa.
        
        Args:
            request: Dados da requisição do chat
            sessionId: ID da sessão de conversação
            methodology: Metodologia de ensino a ser aplicada
            user_profile: Perfil do usuário para personalização
            
        Returns:
            Resposta da LLM processada e formatada
        """
        user_profile = user_profile or {}
        user_query = request.messages[-1].content if request.messages else ""
        
        # 1. Recuperar o histórico da conversa
        context_history = await self._get_conversation_history(sessionId)
        
        # 2. Recuperar contexto relevante da base de conhecimento (RAG)
        knowledge_base = await self.rag_service.retrieve_context(user_query)
        
        # 3. Aplicar metodologia educacional selecionada
        try:
            methodology_type = MethodologyType(methodology)
        except ValueError:
            logger.warning(f"Metodologia desconhecida: {methodology}, usando padrão.")
            methodology_type = MethodologyType.DEFAULT
        
        additional_params = {
            "model": request.model,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens
        }
        
        methodology_result = await self.educational_methodology_service.apply_methodology(
            methodology_type=methodology_type,
            user_query=user_query,
            context_history=context_history,
            knowledge_base=knowledge_base,
            user_profile=user_profile,
            additional_params=additional_params
        )
        
        # 4. Ajustar a requisição com o prompt formatado
        messages = request.messages
        
        # Inserir um sistema prompt com instruções da metodologia
        # Create the system message as a dict to avoid serialization issues
        system_message_dict = {
            "role": "system",
            "content": methodology_result["formatted_prompt"]
        }
        
        # Adiciona sistema prompt no início dos messages
        request_copy = request.model_copy(deep=True)
        # Convert all messages to dict format to avoid Pydantic serialization warnings
        request_copy.messages = [system_message_dict] + [msg.model_dump() for msg in request_copy.messages]
        
        # 5. Obter resposta da LLM com o contexto enriquecido
        use_analogies = methodology_result.get("metadata", {}).get("use_analogies", False)
        
        llm_response = await get_chat_completion_with_retrieval(
            request_copy,
            query=user_query,
            use_analogies=use_analogies
        )
        
        # 6. Salvar a conversa no histórico
        await self._save_conversation(sessionId, user_query, llm_response)
        
        # 7. Processar e retornar a resposta
        return {
            "response": llm_response,
            "metadata": {
                "methodology": methodology_type.value,
                "methodology_metadata": methodology_result.get("metadata", {}),
                "rag_used": bool(knowledge_base and knowledge_base != "Nenhum contexto adicional relevante foi encontrado para esta consulta.")
            }
        }
    
    async def _get_conversation_history(self, sessionId: str) -> str:
        """
        Recupera o histórico da conversa do PocketBase.
        
        Args:
            sessionId: ID da sessão de conversação
            
        Returns:
            String formatada com o histórico da conversa
        """
        try:
            pb_client = PocketBase(settings.pocketbase_url)
            # Autenticar se necessário
            # pb_client.admins.auth_with_password(...)
            
            # Buscar as mensagens da sessão
            messages = pb_client.collection("chat_messages").get_list(
                page=1,
                per_page=20,  # Ajuste conforme necessário
                query_params={
                    "filter": f"sessionId='{sessionId}'",
                    "sort": "+created"  # Ordem cronológica pelo campo existente
                }
            ).items
            
            if not messages:
                return ""
            
            # Formatar histórico
            formatted_history = []
            for msg in messages:
                role = "Usuário" if getattr(msg, "role", "user") == "user" else "Assistente"
                formatted_history.append(f"{role}: {msg.content}")
            
            return "\n\n".join(formatted_history)
        
        except Exception as e:
            logger.error(f"Erro ao recuperar histórico da conversa: {e}")
            return ""

    async def _save_conversation(self, sessionId: str, user_query: str, llm_response: Dict[str, Any]) -> None:
        """
        Salva a pergunta do usuário e a resposta da LLM no PocketBase.
        
        Args:
            sessionId: ID da sessão de conversação
            user_query: Pergunta do usuário
            llm_response: Resposta da LLM
        """
        try:
            pb_client = PocketBase(settings.pocketbase_url)
            # Autenticar se necessário
            # pb_client.admins.auth_with_password(...)
            
            # Salvar mensagem do usuário
            pb_client.collection("chat_messages").create({
                "sessionId": sessionId,
                "role": "user",
                "content": user_query
            })
            
            # Salvar resposta da IA
            assistant_content = llm_response.get("choices", [{}])[0].get("message", {}).get("content", "")
            if assistant_content:
                pb_client.collection("chat_messages").create({
                    "sessionId": sessionId,
                    "role": "ai",
                    "content": assistant_content,
                    "metadata": json.dumps({
                        "model": llm_response.get("model", ""),
                        "tokens": llm_response.get("usage", {}).get("total_tokens", 0)
                    })
                })
        
        except Exception as e:
            logger.error(f"Erro ao salvar conversa: {e}")

# Função auxiliar para criar uma instância do OrchestrationService
def create_orchestration_service():
    """
    Factory function para criar e configurar uma instância do OrchestrationService
    com todas as suas dependências.
    
    Returns:
        Instância configurada do OrchestrationService
    """
    # Criar PocketBase client
    pb_client = PocketBase(settings.pocketbase_url)
    
    # Inicializar PromptLoader
    prompt_loader = PromptLoader()
    
    # Inicializar RAGService sem fontes de conhecimento (desabilita busca em kata_docs)
    rag_service = RAGService(knowledge_sources=[])
    
    # Inicializar EducationalMethodologyService
    educational_methodology_service = EducationalMethodologyService(prompt_loader=prompt_loader)
    
    # Criar e retornar OrchestrationService
    return OrchestrationService(
        prompt_loader=prompt_loader,
        rag_service=rag_service,
        educational_methodology_service=educational_methodology_service
    )
