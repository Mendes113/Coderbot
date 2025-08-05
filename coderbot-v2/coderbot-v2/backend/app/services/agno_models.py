"""
Modelos customizados para AGNO que suportam múltiplos provedores de IA.

Este módulo implementa modelos compatíveis com a biblioteca AGNO para
diferentes provedores como OpenAI e Claude (Anthropic).
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass

# Imports necessários
from agno.models.base import Model
from agno.models.response import ModelResponse, Usage, Delta
from anthropic import Anthropic, AsyncAnthropic, MessageParam
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

class ClaudeModel(Model):
    """
    Implementação de modelo Claude compatível com AGNO.
    
    Esta classe adapta a API do Claude/Anthropic para funcionar
    com a interface esperada pela biblioteca AGNO.
    """
    
    def __init__(
        self,
        id: str = "claude-3-5-sonnet-20241022",
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
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
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
        # Extrair conteúdo da resposta
        if hasattr(claude_response, 'content') and claude_response.content:
            content = claude_response.content[0].text if claude_response.content else ""
        else:
            content = str(claude_response)
        
        # Criar usage info se disponível
        usage = None
        if hasattr(claude_response, 'usage'):
            usage = Usage(
                prompt_tokens=getattr(claude_response.usage, 'input_tokens', 0),
                completion_tokens=getattr(claude_response.usage, 'output_tokens', 0),
                total_tokens=getattr(claude_response.usage, 'input_tokens', 0) + 
                           getattr(claude_response.usage, 'output_tokens', 0)
            )
        
        return ModelResponse(
            content=content,
            model=self.model_name,
            usage=usage,
            response=claude_response
        )
    
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
            response = self.client.messages.create(
                model=self.model_name,
                max_tokens=kwargs.get("max_tokens", self.max_tokens),
                temperature=kwargs.get("temperature", self.temperature),
                system=system_prompt if system_prompt else None,
                messages=claude_messages
            )
            
            return self._create_model_response(response)
            
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
            response = await self.async_client.messages.create(
                model=self.model_name,
                max_tokens=kwargs.get("max_tokens", self.max_tokens),
                temperature=kwargs.get("temperature", self.temperature),
                system=system_prompt if system_prompt else None,
                messages=claude_messages
            )
            
            return self._create_model_response(response)
            
        except Exception as e:
            logger.error(f"Erro ao invocar modelo Claude (async): {str(e)}")
            raise
    
    def response(self, messages: Union[str, List[Dict[str, Any]]], **kwargs) -> str:
        """
        Método de conveniência para obter apenas o texto da resposta.
        
        Args:
            messages: Mensagens (string ou lista)
            **kwargs: Argumentos adicionais
            
        Returns:
            String com o conteúdo da resposta
        """
        # Converter string para formato de mensagens se necessário
        if isinstance(messages, str):
            messages = [{"role": "user", "content": messages}]
        
        model_response = self.invoke(messages, **kwargs)
        return model_response.content
    
    async def aresponse(self, messages: Union[str, List[Dict[str, Any]]], **kwargs) -> str:
        """
        Método de conveniência assíncrono para obter apenas o texto da resposta.
        
        Args:
            messages: Mensagens (string ou lista)
            **kwargs: Argumentos adicionais
            
        Returns:
            String com o conteúdo da resposta
        """
        # Converter string para formato de mensagens se necessário
        if isinstance(messages, str):
            messages = [{"role": "user", "content": messages}]
        
        model_response = await self.ainvoke(messages, **kwargs)
        return model_response.content


def create_model(provider: str, model_name: str, **kwargs) -> Model:
    """
    Factory function para criar modelos baseado no provedor.
    
    Args:
        provider: Nome do provedor ('openai' ou 'claude')
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
    else:
        raise ValueError(f"Provedor não suportado: {provider}. Use 'openai' ou 'claude'.")


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

def get_available_models() -> Dict[str, Dict[str, str]]:
    """
    Retorna todos os modelos disponíveis organizados por provedor.
    
    Returns:
        Dictionary com modelos por provedor
    """
    return {
        "claude": CLAUDE_MODELS,
        "openai": OPENAI_MODELS,
    } 