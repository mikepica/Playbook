from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class SOPBase(BaseModel):
    title: str
    content: dict[str, Any] = Field(description="Markdown content and metadata stored as JSON")


class SOPCreate(SOPBase):
    pass


class SOPUpdate(BaseModel):
    title: str | None = None
    content: dict[str, Any] | None = None
    edited_by: str | None = None


class SOPRead(SOPBase):
    id: UUID
    version: int
    created_at: datetime
    updated_at: datetime


class SOPSummary(BaseModel):
    id: UUID
    title: str
    version: int
    updated_at: datetime


class SOPHistoryRead(BaseModel):
    id: UUID
    sop_id: UUID
    title: str
    version: int
    content: dict[str, Any]
    edited_by: str | None
    created_at: datetime


class SOPHistoryList(BaseModel):
    items: list[SOPHistoryRead]


class SOPList(BaseModel):
    items: list[SOPSummary]
