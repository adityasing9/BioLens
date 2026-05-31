import enum
from sqlalchemy import Column, String, Enum, Text, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class SenderEnum(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")

class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(Enum(SenderEnum), nullable=False)
    message_text = Column(Text, nullable=False)
    source_reports = Column(JSONB, nullable=True) # References to list of report IDs used for RAG grounding
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)

    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")
