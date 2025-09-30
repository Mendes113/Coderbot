"""
Modelos customizados para AGNO que suportam múltiplos provedores de IA.

Este módulo implementa modelos compatíveis com a biblioteca AGNO para
diferentes provedores como OpenAI e Claude (Anthropic).
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass

import requests
from requests import RequestException
from requests.exceptions import ConnectionError as RequestsConnectionError, Timeout as RequestsTimeout

# Imports necessários
from agno.models.base import Model
from agno.models.response import ModelResponse
from anthropic import Anthropic, AsyncAnthropic
from anthropic.types import MessageParam
from openai import OpenAI, AsyncOpenAI

from ..config import settings

logger = logging.getLogger(__name__)

@dataclass
class ClaudeConfig:
    """Configuração para modelos Claude/Anthropic."""
    api_key: str
    model_name: str
    max_tokens: int = 4096
    temperature: float = 0.7
    base_url: str = "https://api.anthropic.com"


@dataclass
class OllamaConfig:
    """Configuração básica para modelos servidos pelo Ollama."""
    base_url: str
    timeout: float = 120.0
    temperature: float = 0.7


class ClaudeModel(Model):
    """
    Implementação de modelo Claude compatível com AGNO.
    
    Esta classe adapta a API do Claude/Anthropic para funcionar
    com a interface esperada pela biblioteca AGNO.
    """
    
    def __init__(
        self,
        id: str = "claude-sonnet-4-20250514",
        api_key: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        **kwargs
    ):
        """
        Inicializa o modelo Claude.
        
        Args:
            id: ID do modelo Claude
            api_key: Chave da API Anthropic (usa variável de ambiente se não fornecida)
            max_tokens: Número máximo de tokens na resposta
            temperature: Temperatura para geração
            **kwargs: Argumentos adicionais
        """
        super().__init__(id=id, **kwargs)
        
        self.api_key = api_key or settings.claude_api_key
        self.model_name = id
        self.max_tokens = max_tokens
        self.temperature = temperature
        
        if not self.api_key:
            raise ValueError("Claude API key is required but not provided")
        
        # Log para debug
        logger.info(f"Inicializando ClaudeModel com chave: {self.api_key[:20]}...{self.api_key[-10:] if self.api_key else None}")
        logger.info(f"Modelo: {self.model_name}")
        
        # Inicializar clientes síncronos e assíncronos
        self.client = Anthropic(api_key=self.api_key)
        self.async_client = AsyncAnthropic(api_key=self.api_key)
    
    def _format_messages_for_claude(self, messages: List[Dict[str, Any]]) -> tuple[str, List[MessageParam]]:
        """
        Converte mensagens do formato AGNO para o formato Claude.
        
        Args:
            messages: Lista de mensagens no formato AGNO
            
        Returns:
            Tuple com (system_prompt, claude_messages)
        """
        system_prompt = ""
        claude_messages: List[MessageParam] = []
        
        # Se messages é uma string simples, converter para formato adequado
        if isinstance(messages, str):
            claude_messages.append(MessageParam(role="user", content=messages))
            return system_prompt, claude_messages
        
        for message in messages:
            # Converter Message object para dict se necessário
            if hasattr(message, 'model_dump'):
                message_dict = message.model_dump()
            elif hasattr(message, '__dict__'):
                message_dict = message.__dict__
            elif isinstance(message, dict):
                message_dict = message
            elif isinstance(message, str):
                # Se for string simples, tratar como mensagem de usuário
                claude_messages.append(MessageParam(role="user", content=message))
                continue
            else:
                logger.warning(f"Tipo de mensagem desconhecido: {type(message)}")
                continue
                
            role = message_dict.get("role", "user")
            content = message_dict.get("content", "")
            
            # Garantir que content seja string
            if not isinstance(content, str):
                content = str(content)
            
            if role == "system":
                system_prompt = content
            elif role in ["user", "assistant"]:
                claude_messages.append(MessageParam(role=role, content=content))
        
        return system_prompt, claude_messages
    
    def _create_model_response(self, claude_response: Any) -> ModelResponse:
        """
        Converte resposta do Claude para formato ModelResponse do AGNO.

        Args:
            claude_response: Resposta da API Claude

        Returns:
            ModelResponse compatível com AGNO
        """
        # DEBUG: Log the raw response from Claude to understand its structure
        try:
            raw_response_str = "N/A"
            if hasattr(claude_response, 'model_dump_json'):
                raw_response_str = claude_response.model_dump_json(indent=2)
            else:
                raw_response_str = str(claude_response)
            logger.info(f"🔍 RAW CLAUDE RESPONSE:\n{raw_response_str}")
        except Exception as e:
            logger.warning(f"Could not serialize raw claude response for logging: {e}")

        # Extrair conteúdo da resposta - tratamento robusto para diferentes formatos
        content = ""

        logger.debug(f"Processando resposta Claude - tipo: {type(claude_response)}")
        logger.debug(f"Resposta tem atributo 'content': {hasattr(claude_response, 'content')}")

        if hasattr(claude_response, 'content') and claude_response.content:
            logger.debug(f"Content type: {type(claude_response.content)}, length: {len(claude_response.content) if hasattr(claude_response.content, '__len__') else 'unknown'}")
            first_block = claude_response.content[0]
            logger.debug(f"First block type: {type(first_block)}")

            # Verificar se é um objeto com atributo 'text' (formato oficial da API)
            if hasattr(first_block, 'text'):
                content = first_block.text
                logger.debug(f"Extraído conteúdo via atributo 'text': {len(content)} chars")
            # Se for string diretamente (formato alternativo)
            elif isinstance(first_block, str):
                content = first_block
                logger.debug(f"First block é string direta: {len(content)} chars")
            # Se for dict (formato JSON-like)
            elif isinstance(first_block, dict):
                content = first_block.get('text', str(first_block))
                logger.debug(f"First block é dict, extraído 'text': {len(content)} chars")
            else:
                content = str(first_block)
                logger.debug(f"First block convertido para string: {len(content)} chars")
        else:
            # Fallback para diferentes formatos de resposta
            if hasattr(claude_response, 'text'):
                content = claude_response.text
                logger.debug(f"Usando atributo 'text' direto da resposta: {len(content)} chars")
            elif hasattr(claude_response, 'content'):
                # Se content não for lista mas tiver conteúdo direto
                if isinstance(claude_response.content, str):
                    content = claude_response.content
                    logger.debug(f"Content é string direta: {len(content)} chars")
                else:
                    content = str(claude_response.content)
                    logger.debug(f"Content convertido para string: {len(content)} chars")
            else:
                content = str(claude_response)
                logger.debug(f"Resposta completa convertida para string: {len(content)} chars")

        # Garantir que content seja sempre string
        if not isinstance(content, str):
            content = str(content)

        # Criar usage info se disponível (simplificado)
        usage = None
        if hasattr(claude_response, 'usage'):
            usage = {
                'input_tokens': getattr(claude_response.usage, 'input_tokens', 0),
                'output_tokens': getattr(claude_response.usage, 'output_tokens', 0),
                'total_tokens': getattr(claude_response.usage, 'input_tokens', 0) +
                              getattr(claude_response.usage, 'output_tokens', 0)
            }

        return ModelResponse(
            content=content
        )

    def parse_provider_response(self, response: Any, **kwargs) -> ModelResponse:
        """Implementa contrato obrigatório da classe base."""
        return self._create_model_response(response)

    def _parse_provider_response(self, response: Any, **kwargs) -> ModelResponse:
        """Implementa método abstrato requerido pela biblioteca AGNO."""
        return self._create_model_response(response)

    def parse_provider_response_delta(self, response: Any) -> ModelResponse:
        """Processa respostas parciais do Claude (streaming)."""
        logger.debug(f"Processando delta Claude - tipo: {type(response)}")
        try:
            if hasattr(response, "content") and response.content:
                # Quando response é um TextDelta da API official
                first_block = response.content[0]
                logger.debug(f"Delta first block type: {type(first_block)}")
                if hasattr(first_block, "text"):
                    content = first_block.text
                    logger.debug(f"Delta extraído via atributo 'text': {len(content)} chars")
                    return ModelResponse(content=content)
            if hasattr(response, "delta") and hasattr(response.delta, "text"):
                content = response.delta.text
                logger.debug(f"Delta extraído via response.delta.text: {len(content)} chars")
                return ModelResponse(content=content, extra={"delta": True})
        except Exception as exc:
            logger.warning(f"Falha ao interpretar delta do Claude: {exc}")
        content = str(response)
        logger.debug(f"Delta convertido para string: {len(content)} chars")
        return ModelResponse(content=content, extra={"delta": True})
    
    def _parse_provider_response_delta(self, response: Any) -> ModelResponse:
        """Implementa método abstrato requerido pela biblioteca AGNO (streaming)."""
        return self.parse_provider_response_delta(response)
    
    def invoke(self, messages: List[Dict[str, Any]], **kwargs) -> ModelResponse:
        """
        Invoca o modelo Claude de forma síncrona.
        
        Args:
            messages: Lista de mensagens
            **kwargs: Argumentos adicionais
            
        Returns:
            ModelResponse com a resposta do modelo
        """
        try:
            system_prompt, claude_messages = self._format_messages_for_claude(messages)
            
            # Fazer chamada para Claude
            call_kwargs = {
                "model": self.model_name,
                "max_tokens": kwargs.get("max_tokens", self.max_tokens),
                "temperature": kwargs.get("temperature", self.temperature),
                "messages": claude_messages
            }
            
            # Só adicionar system se não estiver vazio
            if system_prompt and system_prompt.strip():
                call_kwargs["system"] = system_prompt
            
            response = self.client.messages.create(**call_kwargs)
            
            return self.parse_provider_response(response, **call_kwargs)
            
        except Exception as e:
            logger.error(f"Erro ao invocar modelo Claude: {str(e)}")
            raise
    
    async def ainvoke(self, messages: List[Dict[str, Any]], **kwargs) -> ModelResponse:
        """
        Invoca o modelo Claude de forma assíncrona.
        
        Args:
            messages: Lista de mensagens
            **kwargs: Argumentos adicionais
            
        Returns:
            ModelResponse com a resposta do modelo
        """
        try:
            system_prompt, claude_messages = self._format_messages_for_claude(messages)
            
            # Fazer chamada assíncrona para Claude
            call_kwargs = {
                "model": self.model_name,
                "max_tokens": kwargs.get("max_tokens", self.max_tokens),
                "temperature": kwargs.get("temperature", self.temperature),
                "messages": claude_messages
            }
            
            # Só adicionar system se não estiver vazio
            if system_prompt and system_prompt.strip():
                call_kwargs["system"] = system_prompt
            
            response = await self.async_client.messages.create(**call_kwargs)
            
            return self.parse_provider_response(response, **call_kwargs)
            
        except Exception as e:
            logger.error(f"Erro ao invocar modelo Claude (async): {str(e)}")
            raise
    
    # Implementar métodos abstratos necessários
    def invoke_stream(self, messages: List[Dict[str, Any]], **kwargs):
        """Streaming síncrono - implementação básica que retorna resposta completa."""
        try:
            # Por enquanto, retorna a resposta completa como se fosse streaming
            response = self.invoke(messages, **kwargs)
            yield response
        except Exception as e:
            logger.error(f"Erro no streaming síncrono: {e}")
            raise
    
    async def ainvoke_stream(self, messages: List[Dict[str, Any]], **kwargs):
        """Streaming assíncrono - implementação básica que retorna resposta completa."""
        try:
            # Por enquanto, retorna a resposta completa como se fosse streaming
            response = await self.ainvoke(messages, **kwargs)
            yield response
        except Exception as e:
            logger.error(f"Erro no streaming assíncrono: {e}")
            raise
    
class OllamaModel(Model):
    """Implementação de modelo Ollama compatível com AGNO."""

    def __init__(
        self,
        id: str = "llama3.1",
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
        temperature: float = 0.7,
        **kwargs,
    ):
        super().__init__(id=id, **kwargs)
        self.model_name = id
        config = OllamaConfig(
            base_url=(base_url or settings.ollama_base_url or "http://localhost:11434").rstrip("/"),
            timeout=timeout or settings.ollama_timeout_seconds,
            temperature=temperature,
        )
        self.config = config
        self.logger = logger
        self.logger.info(
            "Inicializando OllamaModel %s | base_url=%s | timeout=%ss",
            self.model_name,
            self.config.base_url,
            self.config.timeout,
        )

    def _normalize_messages(
        self, messages: Union[str, List[Dict[str, Any]]]
    ) -> List[Dict[str, str]]:
        if isinstance(messages, str):
            return [{"role": "user", "content": messages}]

        normalized: List[Dict[str, str]] = []
        for message in messages:
            if message is None:
                continue
            if hasattr(message, "model_dump"):
                message_dict = message.model_dump()
            elif hasattr(message, "__dict__"):
                message_dict = message.__dict__
            elif isinstance(message, dict):
                message_dict = message
            else:
                message_dict = {"role": "user", "content": str(message)}

            role = str(message_dict.get("role", "user"))
            content = message_dict.get("content", "")
            if not isinstance(content, str):
                content = str(content)

            normalized.append({"role": role, "content": content})

        if not normalized:
            normalized.append({"role": "user", "content": ""})
        return normalized

    def _build_payload(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        options = kwargs.get("options") or {}
        if "temperature" not in options:
            options["temperature"] = kwargs.get("temperature", self.config.temperature)

        return {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": options,
        }

    def invoke(self, messages: Union[str, List[Dict[str, Any]]], **kwargs) -> ModelResponse:
        normalized = self._normalize_messages(messages)
        payload = self._build_payload(normalized, **kwargs)

        try:
            response = requests.post(
                f"{self.config.base_url}/api/chat",
                json=payload,
                timeout=self.config.timeout,
            )
            response.raise_for_status()
            data = response.json()
            return self.parse_provider_response(data)
        except RequestException as exc:
            self.logger.error("Erro ao chamar Ollama: %s", exc)
            if isinstance(exc, RequestsConnectionError):
                raise RuntimeError(
                    "Não foi possível conectar ao Ollama em "
                    f"{self.config.base_url}. Certifique-se de que o serviço 'ollama serve' está em execução "
                    f"e que o modelo '{self.model_name}' foi baixado com `ollama run {self.model_name}`."
                ) from exc
            if isinstance(exc, RequestsTimeout):
                raise RuntimeError(
                    f"Ollama não respondeu dentro de {self.config.timeout}s. Considere aumentar o tempo limite "
                    "ou verificar a carga do servidor."
                ) from exc
            raise

    async def ainvoke(self, messages: Union[str, List[Dict[str, Any]]], **kwargs) -> ModelResponse:
        return await asyncio.to_thread(self.invoke, messages, **kwargs)

    def invoke_stream(self, messages: List[Dict[str, Any]], **kwargs):
        yield self.invoke(messages, **kwargs)

    async def ainvoke_stream(self, messages: List[Dict[str, Any]], **kwargs):
        yield await self.ainvoke(messages, **kwargs)

    def parse_provider_response(self, response: Any, **kwargs) -> ModelResponse:
        try:
            if isinstance(response, ModelResponse):
                return response
            if isinstance(response, dict):
                if "message" in response:
                    content = (response["message"] or {}).get("content", "")
                else:
                    content = response.get("response", "")
                return ModelResponse(
                    content=content,
                    provider_data={"model": response.get("model", self.model_name)},
                )
        except Exception as exc:
            self.logger.error("Erro ao interpretar resposta do Ollama: %s", exc)
        return ModelResponse(content=str(response), provider_data={"model": self.model_name})

    def _parse_provider_response(self, response: Any, **kwargs) -> ModelResponse:
        """Implementa método abstrato requerido pela biblioteca AGNO."""
        return self.parse_provider_response(response, **kwargs)

    def parse_provider_response_delta(self, delta: Any) -> ModelResponse:
        content: str
        if isinstance(delta, dict):
            content = delta.get("message", {}).get("content") or delta.get("response", "") or ""
        else:
            content = str(delta)
        return ModelResponse(content=content, extra={"delta": True})

    def _parse_provider_response_delta(self, delta: Any) -> ModelResponse:
        """Implementa método abstrato requerido pela biblioteca AGNO (streaming)."""
        return self.parse_provider_response_delta(delta)


def create_model(provider: str, model_name: str, **kwargs) -> Model:
    """
    Factory function para criar modelos baseado no provedor.
    
    Args:
        provider: Nome do provedor ('openai', 'claude' ou 'ollama')
        model_name: Nome do modelo
        **kwargs: Argumentos adicionais para o modelo
        
    Returns:
        Instância do modelo apropriado
        
    Raises:
        ValueError: Se o provedor não for suportado
    """
    if provider.lower() == 'claude':
        return ClaudeModel(id=model_name, **kwargs)
    elif provider.lower() == 'openai':
        # Usar o modelo OpenAI padrão da AGNO
        from agno.models.openai import OpenAIChat
        return OpenAIChat(id=model_name, **kwargs)
    elif provider.lower() == 'ollama':
        return OllamaModel(id=model_name, **kwargs)
    else:
        raise ValueError(f"Provedor não suportado: {provider}. Use 'openai', 'claude' ou 'ollama'.")


# Modelos pré-configurados para conveniência
CLAUDE_MODELS = {
    "claude-3-opus": "claude-3-opus-20240229",
    "claude-3-sonnet": "claude-3-sonnet-20240229", 
    "claude-3-haiku": "claude-3-haiku-20240307",
    "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
    "claude-sonnet-4": "claude-sonnet-4-20250514",
}

OPENAI_MODELS = {
    "gpt-3.5-turbo": "gpt-3.5-turbo",
    "gpt-4": "gpt-4",
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "o3-mini": "o3-mini",
}


def _fetch_ollama_models() -> Dict[str, str]:
    base_url = (settings.ollama_base_url or "http://localhost:11434").rstrip("/")
    try:
        response = requests.get(f"{base_url}/api/tags", timeout=5)
        response.raise_for_status()
        data = response.json() or {}
        models = {}
        for model in data.get("models", []):
            name = model.get("name")
            if name:
                models[name] = name
        return models
    except Exception as exc:
        logger.debug("Não foi possível listar modelos do Ollama em %s: %s", base_url, exc)
        default = settings.ollama_default_model
        if default:
            return {default: default}
        return {}

def get_available_models() -> Dict[str, Dict[str, str]]:
    """
    Retorna todos os modelos disponíveis organizados por provedor.
    
    Returns:
        Dictionary com modelos por provedor
    """
    return {
        "claude": CLAUDE_MODELS,
        "openai": OPENAI_MODELS,
        "ollama": _fetch_ollama_models(),
    } 
