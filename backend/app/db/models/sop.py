from __future__ import annotations

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declared_attr, relationship

from app.db.models.base import Base


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class SOP(Base, TimestampMixin):
    __tablename__ = "sops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, unique=True)
    version = Column(Integer, nullable=False, default=1)
    content = Column(JSON, nullable=False)

    histories = relationship("SOPHistory", back_populates="sop", cascade="all, delete-orphan", passive_deletes=True)
    chat_threads = relationship("ChatThread", back_populates="sop")


class SOPHistory(Base, TimestampMixin):
    __tablename__ = "sop_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sop_id = Column(UUID(as_uuid=True), ForeignKey("sops.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    version = Column(Integer, nullable=False)
    content = Column(JSON, nullable=False)
    edited_by = Column(String(255), nullable=True)

    sop = relationship("SOP", back_populates="histories")


class ChatThread(Base, TimestampMixin):
    __tablename__ = "chat_threads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sop_id = Column(UUID(as_uuid=True), ForeignKey("sops.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False, default="New Thread")

    sop = relationship("SOP", back_populates="chat_threads")
    messages = relationship("ChatMessage", back_populates="thread", cascade="all, delete-orphan", passive_deletes=True)


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    thread_id = Column(UUID(as_uuid=True), ForeignKey("chat_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)

    thread = relationship("ChatThread", back_populates="messages")
