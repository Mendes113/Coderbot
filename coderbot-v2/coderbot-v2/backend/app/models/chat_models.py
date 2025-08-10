from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    id: Optional[str] = None
    chat_id: Optional[str] = None
    sender: str
    content: str
    timestamp: Optional[str] = None

class Chat(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    messages: List[ChatMessage] = [] 