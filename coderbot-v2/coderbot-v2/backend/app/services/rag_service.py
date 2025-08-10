"""RAG Service para recuperação aumentada de contexto.

Este serviço é responsável por recuperar informações relevantes
de fontes de conhecimento para melhorar a qualidade das respostas
da IA, seguindo princípios SOLID e modularidade.
"""

import httpx
import logging
from pocketbase import PocketBase
from typing import List, Dict, Any, Protocol, Optional
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Abstração para Fontes de Conhecimento (DIP) ---
class KnowledgeSource(Protocol):
    """
    Interface para uma fonte de conhecimento da qual o RAGService pode recuperar informações.
    """
    async def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Busca documentos relevantes para a query.
        Retorna uma lista de dicionários, cada um representando um documento.
        """
        ...

# --- Implementação Concreta para PocketBase (Exemplo) ---
class PocketBaseKnowledgeSource:
    """
    Fonte de conhecimento que busca documentos (ex: 'kata_docs') no PocketBase
    usando embeddings para similaridade vetorial.
    """
    def __init__(self, 
                 pb_client: PocketBase, 
                 collection_name: str = "kata_docs", 
                 embedding_model: str = "text-embedding-ada-002"):
        self.pb_client = pb_client
        self.collection_name = collection_name
        self.embedding_model = embedding_model
        # Idealmente, o cliente HTTP para OpenAI seria injetado ou gerenciado de forma mais centralizada
        self.openai_http_client = httpx.AsyncClient(
            base_url=settings.deep_seek_api_url if settings.deep_seek_api_url else "https://api.openai.com/v1",
            headers={"Authorization": f"Bearer {settings.open_ai_api_key}"},
            timeout=30.0
        )

    async def _get_embedding(self, text: str) -> List[float]:
        """Gera embedding para o texto usando a API da OpenAI."""
        try:
            resp = await self.openai_http_client.post(
                "/embeddings",
                json={"model": self.embedding_model, "input": text}
            )
            resp.raise_for_status()
            data = resp.json()
            return data["data"][0]["embedding"]
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            return []

    async def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        query_embedding = await self._get_embedding(query)
        if not query_embedding:
            return []

        try:
            # Este é um exemplo simplificado. Em produção, você precisaria implementar
            # uma busca vetorial real no PocketBase ou usar outro banco de dados vetorial.
            logger.info(f"[PocketBaseKnowledgeSource] Buscando documentos para '{query}'")
            
            # Fallback simples: busca por texto
            all_records = self.pb_client.collection(self.collection_name).get_full_list()
            
            # Filtragem básica por conteúdo textual (isto deve ser substituído por busca vetorial)
            filtered_docs = [
                record.to_dict() for record in all_records 
                if query.lower() in getattr(record, "title", "").lower() or 
                   query.lower() in getattr(record, "content", "").lower()
            ][:top_k]
            
            if not filtered_docs and all_records:
                return [record.to_dict() for record in all_records[:top_k]]
            return filtered_docs

        except Exception as e:
            logger.error(f"Error searching in PocketBase: {e}")
            return []

    async def close_http_client(self):
        await self.openai_http_client.aclose()


class RAGService:
    """
    Serviço de Retrieval Augmented Generation.
    Recupera contexto de uma ou mais fontes de conhecimento.
    """
    def __init__(self, knowledge_sources: Optional[List[KnowledgeSource]] = None):
        """
        Inicializa o serviço RAG com fontes de conhecimento.
        
        Args:
            knowledge_sources: Lista de fontes de conhecimento. Se None, usa uma fonte vazia.
        """
        self.knowledge_sources = knowledge_sources or []

    def _format_document_for_prompt(self, doc: Dict[str, Any], source_name: str) -> str:
        """
        Formata um documento recuperado para ser incluído no prompt da LLM.
        Adapte conforme a estrutura dos seus documentos.
        """
        title = doc.get("title", "Documento sem título")
        content = doc.get("content", "")
        # Limitar tamanho para não exceder limites de token
        max_content_length = 1000
        if len(content) > max_content_length:
            content = content[:max_content_length] + "..."
        
        return f"Fonte ({source_name}): {title}\nConteúdo Relevante:\n{content}"

    async def retrieve_context(self, query: str, top_k_per_source: int = 1) -> str:
        """
        Recupera e formata contexto de todas as fontes de conhecimento.
        Este contexto pode ser injetado no placeholder `{knowledge_base}` do seu prompt.
        
        Args:
            query: A consulta do usuário
            top_k_per_source: Número de documentos a recuperar por fonte
            
        Returns:
            String formatada com o contexto relevante
        """
        if not self.knowledge_sources:
            logger.info("Nenhuma fonte de conhecimento configurada no RAGService")
            return "Nenhuma fonte de conhecimento disponível para esta consulta."
        
        all_contexts: List[str] = []
        
        for i, source in enumerate(self.knowledge_sources):
            try:
                retrieved_docs = await source.search(query, top_k=top_k_per_source)
                source_name = source.__class__.__name__
                
                for doc in retrieved_docs:
                    all_contexts.append(self._format_document_for_prompt(doc, f"{source_name}_{i}"))
            except Exception as e:
                logger.error(f"Error retrieving from source {i}: {e}")

        if not all_contexts:
            return "Nenhum contexto adicional relevante foi encontrado para esta consulta."
        
        # Concatena os contextos de todas as fontes
        return "\n\n---\n\n".join(all_contexts)

    async def close_sources(self):
        """Fecha conexões abertas pelas fontes, como clientes HTTP."""
        for source in self.knowledge_sources:
            if hasattr(source, 'close_http_client') and callable(getattr(source, 'close_http_client')):
                await source.close_http_client() 