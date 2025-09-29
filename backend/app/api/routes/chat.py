from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageRead,
    ChatThreadCreate,
    ChatThreadDetail,
    ChatThreadList,
    ChatThreadRead,
)
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/threads", response_model=ChatThreadList)
def list_threads(db: Session = Depends(get_db)) -> ChatThreadList:
    threads = chat_service.list_threads(db)
    return ChatThreadList(
        items=[
            ChatThreadRead(
                id=thread.id,
                title=thread.title,
                sop_id=thread.sop_id,
                chat_type=thread.chat_type,
                created_at=thread.created_at,
                updated_at=thread.updated_at,
            )
            for thread in threads
        ]
    )


@router.post("/threads", response_model=ChatThreadRead, status_code=status.HTTP_201_CREATED)
def create_thread(payload: ChatThreadCreate, db: Session = Depends(get_db)) -> ChatThreadRead:
    thread = chat_service.create_thread(db, payload)
    return ChatThreadRead(
        id=thread.id,
        title=thread.title,
        sop_id=thread.sop_id,
        chat_type=thread.chat_type,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
    )


@router.get("/threads/{thread_id}", response_model=ChatThreadDetail)
def get_thread(thread_id: str, db: Session = Depends(get_db)) -> ChatThreadDetail:
    thread = chat_service.get_thread_with_messages(db, thread_id)
    if thread is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")

    return ChatThreadDetail(
        id=thread.id,
        title=thread.title,
        sop_id=thread.sop_id,
        chat_type=thread.chat_type,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        messages=[
            ChatMessageRead(
                id=message.id,
                thread_id=message.thread_id,
                role=message.role,
                content=message.content,
                created_at=message.created_at,
                updated_at=message.updated_at,
            )
            for message in sorted(thread.messages, key=lambda m: m.created_at)
        ],
    )


@router.post("/threads/{thread_id}/messages", response_model=list[ChatMessageRead], status_code=status.HTTP_201_CREATED)
def post_message(
    thread_id: str,
    payload: ChatMessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> list[ChatMessageRead]:
    try:
        messages = chat_service.append_message(db, thread_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    # If this is a user message and we got an AI response, trigger title generation in background
    if payload.role == "user" and len(messages) >= 2:
        background_tasks.add_task(chat_service.generate_thread_title, db, thread_id)

    return [
        ChatMessageRead(
            id=message.id,
            thread_id=message.thread_id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
            updated_at=message.updated_at,
        )
        for message in messages
    ]


@router.post("/threads/{thread_id}/messages/project", response_model=list[ChatMessageRead], status_code=status.HTTP_201_CREATED)
def post_project_message(
    thread_id: str,
    payload: ChatMessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> list[ChatMessageRead]:
    try:
        messages = chat_service.append_project_message(db, thread_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    # If this is a user message and we got an AI response, trigger title generation in background
    if payload.role == "user" and len(messages) >= 2:
        background_tasks.add_task(chat_service.generate_thread_title, db, thread_id)

    return [
        ChatMessageRead(
            id=message.id,
            thread_id=message.thread_id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
            updated_at=message.updated_at,
        )
        for message in messages
    ]
