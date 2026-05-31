from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.models.report import Report, ReportParameter
from app.models.chat import AIConversation, AIMessage, SenderEnum
from app.schemas.chat_schema import (
    CreateConversationRequest, SendMessageRequest,
    ConversationResponse, MessageResponseSchema
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/chat", tags=["AI Health Assistant"])


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    body: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new AI chat conversation session."""
    conv = AIConversation(
        id=str(uuid4()),
        user_id=current_user.id,
        title=body.title
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all chat conversations for the current user."""
    convs = db.query(AIConversation).filter(
        AIConversation.user_id == current_user.id
    ).order_by(AIConversation.updated_at.desc()).all()
    return convs


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponseSchema])
async def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages in a conversation."""
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = db.query(AIMessage).filter(
        AIMessage.conversation_id == conversation_id
    ).order_by(AIMessage.created_at.asc()).all()
    return messages


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponseSchema)
async def send_message(
    conversation_id: str,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get an AI response grounded in user's health data."""
    # Verify conversation ownership
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save user message
    user_msg = AIMessage(
        id=str(uuid4()),
        conversation_id=conversation_id,
        sender=SenderEnum.USER,
        message_text=body.message
    )
    db.add(user_msg)

    # Build RAG context from user's reports
    recent_reports = db.query(Report).filter(
        Report.user_id == current_user.id,
        Report.upload_status == "COMPLETED"
    ).order_by(Report.uploaded_at.desc()).limit(5).all()

    report_ids = [r.id for r in recent_reports]
    context_parts = []
    context_parts.append(f"Patient: {current_user.first_name} {current_user.last_name}")
    context_parts.append(f"Gender: {current_user.gender}, DOB: {current_user.date_of_birth}")

    for report in recent_reports:
        params = db.query(ReportParameter).filter(
            ReportParameter.report_id == report.id
        ).all()
        param_strings = []
        for p in params:
            name = p.parameter_name.value if hasattr(p.parameter_name, 'value') else p.parameter_name
            status = p.status.value if hasattr(p.status, 'value') else p.status
            param_strings.append(f"{name}: {float(p.parameter_value)} {p.unit} [{status}]")

        context_parts.append(f"\nReport ({report.uploaded_at.strftime('%Y-%m-%d')}): Health Score = {report.health_score or 'N/A'}")
        context_parts.append(", ".join(param_strings))

    patient_context = "\n".join(context_parts)

    # Get conversation history (last 10 messages)
    history = db.query(AIMessage).filter(
        AIMessage.conversation_id == conversation_id
    ).order_by(AIMessage.created_at.desc()).limit(10).all()
    history.reverse()
    conversation_history = [
        {"sender": m.sender.value if hasattr(m.sender, 'value') else m.sender, "text": m.message_text}
        for m in history
    ]

    # Call Gemini AI
    try:
        from app.services.gemini_client import chat_with_context
        ai_response = chat_with_context(body.message, patient_context, conversation_history)
    except Exception as e:
        ai_response = (
            "I apologize, but I'm unable to process your request right now. "
            "Please try again later. If the issue persists, contact support.\n\n"
            "⚕️ *Disclaimer: BioLens AI provides informational analysis only. "
            "Always consult a licensed healthcare professional for medical advice.*"
        )

    # Save assistant message
    assistant_msg = AIMessage(
        id=str(uuid4()),
        conversation_id=conversation_id,
        sender=SenderEnum.ASSISTANT,
        message_text=ai_response,
        source_reports=report_ids
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg
