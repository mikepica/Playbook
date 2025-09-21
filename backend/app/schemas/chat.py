from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class ChatThreadBase(BaseModel):
    title: str = "New Thread"
    sop_id: UUID | None = None


class ChatThreadCreate(ChatThreadBase):
    pass


class ChatThreadRead(ChatThreadBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


class ChatMessageBase(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatMessageCreate(ChatMessageBase):
    pass


class ChatMessageRead(ChatMessageBase):
    id: UUID
    thread_id: UUID
    created_at: datetime
    updated_at: datetime


class ChatThreadDetail(ChatThreadRead):
    messages: list[ChatMessageRead]


class ChatThreadList(BaseModel):
    items: list[ChatThreadRead]
