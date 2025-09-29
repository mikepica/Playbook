from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.models.base import Base


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ProjectSOP(Base, TimestampMixin):
    """Global document type registry - defines templates for document types like business cases, charters, etc."""
    __tablename__ = "project_sops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_type = Column(String(50), nullable=False, unique=True, index=True)  # e.g., 'business_case', 'project_charter'
    title = Column(String(255), nullable=False)                                   # e.g., 'Business Case', 'Project Charter'
    version = Column(Integer, nullable=False, default=1)
    content = Column(JSON, nullable=False)                                        # Template/instructions for this document type
    display_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)                                     # Can this document type be used

    # Relationships
    histories = relationship("ProjectSOPHistory", back_populates="project_sop", cascade="all, delete-orphan", passive_deletes=True)
    # Note: No direct relationship to projects - this is a global template
    # Relationships to document instances are handled in those specific tables


class ProjectSOPHistory(Base, TimestampMixin):
    __tablename__ = "project_sop_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_sop_id = Column(UUID(as_uuid=True), ForeignKey("project_sops.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    version = Column(Integer, nullable=False)
    content = Column(JSON, nullable=False)
    edited_by = Column(String(255), nullable=True)

    # Relationships
    project_sop = relationship("ProjectSOP", back_populates="histories")