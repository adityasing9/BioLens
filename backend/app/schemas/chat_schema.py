from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CreateConversationRequest(BaseModel):
    title: str


class SendMessageRequest(BaseModel):
    message: str


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageResponseSchema(BaseModel):
    id: str
    sender: str
    message_text: str
    source_reports: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True
