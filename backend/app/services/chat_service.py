from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ChatMessage, ChatThread
from app.schemas.chat import ChatMessageCreate, ChatThreadCreate
from app.services import sop_service
from app.services.llm_provider import llm_client

logger = logging.getLogger(__name__)


def list_threads(db: Session) -> list[ChatThread]:
    stmt = select(ChatThread).order_by(ChatThread.updated_at.desc())
    result = db.execute(stmt)
    return result.scalars().all()


def get_thread(db: Session, thread_id: str) -> ChatThread | None:
    return db.get(ChatThread, thread_id)


def get_thread_with_messages(db: Session, thread_id: str) -> ChatThread | None:
    thread = db.get(ChatThread, thread_id)
    if thread is None:
        return None
    _ = thread.messages
    return thread


def create_thread(db: Session, data: ChatThreadCreate) -> ChatThread:
    thread = ChatThread(title=data.title or "New Thread", sop_id=data.sop_id)
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return thread


def append_message(db: Session, thread_id: str, data: ChatMessageCreate, auto_reply: bool = True) -> list[ChatMessage]:
    thread = db.get(ChatThread, thread_id)
    if thread is None:
        raise ValueError("Chat thread not found")

    conversation_context = [
        {"role": entry.role, "content": entry.content}
        for entry in sorted(thread.messages, key=lambda m: m.created_at)
    ]

    message = ChatMessage(thread_id=thread_id, role=data.role, content=data.content)
    db.add(message)
    db.flush()

    messages_to_return = [message]

    if auto_reply and data.role == "user":
        # Build conversation with ALL SOPs as context
        conversation = []

        # Add ALL SOPs content as system context
        all_sops = sop_service.list_sops(db)
        if all_sops:
            sop_sections = []
            for sop in all_sops:
                if sop.content:
                    # Extract markdown content from SOP
                    sop_content = ""
                    if isinstance(sop.content, dict) and "markdown" in sop.content:
                        sop_content = sop.content["markdown"]
                    elif isinstance(sop.content, str):
                        sop_content = sop.content

                    if sop_content:
                        sop_sections.append(f"## {sop.title}\n\n{sop_content}")

            if sop_sections:
                all_sops_content = "\n\n---\n\n".join(sop_sections)
                system_message = {
                    "role": "system",
                    "content": f"You are an AI assistant helping with questions about Standard Operating Procedures (SOPs). You have access to all SOPs in the system. Please use the following SOPs to inform your responses and help users understand the procedures and information contained within them.\n\nWhen responding, please format your answers using proper markdown for better readability (use headers, lists, code blocks, bold/italic text, etc. as appropriate).\n\n# Available SOPs\n\n{all_sops_content}\n\nUse the information from these SOPs to provide comprehensive and well-formatted answers to user questions."
                }
                conversation.append(system_message)

        # Add conversation history and current message
        conversation.extend([*conversation_context, {"role": data.role, "content": data.content}])

        assistant_content = llm_client.generate_reply(conversation)
        assistant_message = ChatMessage(thread_id=thread_id, role="assistant", content=assistant_content)
        db.add(assistant_message)
        messages_to_return.append(assistant_message)

    # Touch the thread so the updated_at trigger fires
    thread.updated_at = datetime.now(timezone.utc)

    db.commit()
    for entry in messages_to_return:
        db.refresh(entry)
    db.refresh(thread)
    return messages_to_return


def generate_thread_title(db: Session, thread_id: str) -> None:
    """Generate and update thread title based on conversation content.

    This should be called as a background task after the first message exchange.
    """
    try:
        thread = db.get(ChatThread, thread_id)
        if not thread:
            logger.warning(f"Thread {thread_id} not found for title generation")
            return

        # Only generate title for new threads with default titles
        if thread.title not in ("New Thread", "New Conversation", "General SOP Q&A"):
            logger.debug(f"Thread {thread_id} already has custom title: {thread.title}")
            return

        # Get first few messages for context
        messages = sorted(thread.messages, key=lambda m: m.created_at)
        if len(messages) < 2:  # Need at least user message + AI response
            logger.debug(f"Thread {thread_id} needs more messages for title generation")
            return

        # Use first user message and AI response for title generation
        user_message = next((m for m in messages if m.role == "user"), None)
        ai_message = next((m for m in messages if m.role == "assistant"), None)

        if not user_message or not ai_message:
            logger.debug(f"Thread {thread_id} missing user or AI message")
            return

        # Create title generation prompt
        title_prompt = [
            {
                "role": "system",
                "content": "Generate a concise 3-5 word title for this conversation. The title should capture the main topic or question being discussed. Respond with only the title, no additional text."
            },
            {
                "role": "user",
                "content": f"User question: {user_message.content[:200]}..."
            },
            {
                "role": "assistant",
                "content": f"AI response: {ai_message.content[:200]}..."
            },
            {
                "role": "user",
                "content": "Generate a 3-5 word title for this conversation:"
            }
        ]

        # Generate title using LLM
        title = llm_client.generate_reply(title_prompt)

        # Clean up title (remove quotes, limit length)
        title = title.strip().strip('"\'').strip()
        if len(title) > 50:  # Reasonable max length
            title = title[:47] + "..."

        # Update thread title
        thread.title = title
        thread.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(thread)

        logger.info(f"Generated title for thread {thread_id}: {title}")

    except Exception as e:
        logger.error(f"Failed to generate title for thread {thread_id}: {e}")
        # Don't re-raise - this is a background task and shouldn't affect user experience
