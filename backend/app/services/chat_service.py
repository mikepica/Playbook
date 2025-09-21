from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ChatMessage, ChatThread
from app.schemas.chat import ChatMessageCreate, ChatThreadCreate
from app.services.llm_provider import llm_client


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
        conversation = [*conversation_context, {"role": data.role, "content": data.content}]
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
