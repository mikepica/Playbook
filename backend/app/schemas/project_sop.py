from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectSOPBase(BaseModel):
    document_type: str = Field(description="Document type identifier (e.g., 'business_case', 'project_charter')")
    title: str = Field(description="Display name for the document type")
    content: dict[str, Any] = Field(description="Template/instructions for this document type")
    display_order: int = Field(default=0, description="Display order for UI positioning")
    is_active: bool = Field(default=True, description="Whether this document type can be used")


class ProjectSOPCreate(ProjectSOPBase):
    pass


class ProjectSOPUpdate(BaseModel):
    document_type: str | None = None
    title: str | None = None
    content: dict[str, Any] | None = None
    display_order: int | None = None
    is_active: bool | None = None
    edited_by: str | None = None


class ProjectSOPRead(ProjectSOPBase):
    id: UUID
    version: int
    created_at: datetime
    updated_at: datetime


class ProjectSOPSummary(BaseModel):
    id: UUID
    document_type: str
    title: str
    version: int
    display_order: int
    is_active: bool
    updated_at: datetime


class ProjectSOPHistoryRead(BaseModel):
    id: UUID
    project_sop_id: UUID
    document_type: str
    title: str
    version: int
    content: dict[str, Any]
    edited_by: str | None
    created_at: datetime


class ProjectSOPHistoryList(BaseModel):
    items: list[ProjectSOPHistoryRead]


class ProjectSOPList(BaseModel):
    items: list[ProjectSOPSummary]