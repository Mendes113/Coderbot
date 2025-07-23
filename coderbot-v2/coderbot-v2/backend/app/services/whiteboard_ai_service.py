from typing import Optional, Dict, Any
from agno.agent import Agent
from agno.models.openai import OpenAIChat
import os

class WhiteboardAIService:
    def __init__(self):
        # Inicializa o agente Agno com o modelo desejado
        self.agent = Agent(
            model=OpenAIChat(id="gpt-4o"),  # ou outro modelo suportado/configurado
            description="Você é um assistente que responde dúvidas sobre quadros Excalidraw.",
            instructions=[
                "Analise o JSON do quadro Excalidraw e responda à pergunta do usuário de forma clara e objetiva.",
                "Seja didático e, se possível, cite elementos do quadro relevantes para a resposta."
            ],
            markdown=True,
        )

    def ask_whiteboard_ai(
        self,
        message: str,
        excalidraw_json: Dict[str, Any],
        prompt_template: Optional[str] = None
    ) -> str:
        # Monta o prompt final
        prompt = prompt_template or "Responda à pergunta do usuário com base no conteúdo do quadro Excalidraw."
        # Inclui o contexto do quadro no prompt
        full_prompt = (
            f"{prompt}\n"
            f"Pergunta do usuário: {message}\n"
            f"Conteúdo do quadro (JSON):\n{excalidraw_json}"
        )
        # Chama o agente Agno e retorna a resposta
        response = self.agent.response(full_prompt)
        return response 