from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.models.base import Base


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_name = Column(String(255), nullable=False, unique=True)
    project_code = Column(String(50), unique=True)

    # Basic project metadata
    description = Column(Text)
    business_area = Column(String(255))
    sponsor = Column(String(255))
    project_manager = Column(String(255))

    # Timeline
    planned_start_date = Column(Date)
    planned_end_date = Column(Date)
    actual_start_date = Column(Date)
    actual_end_date = Column(Date)

    # Status and phase tracking
    status = Column(String(50), default="pre_initiation")
    phase = Column(String(50))
    priority = Column(String(20), default="medium")

    # Financial tracking
    approved_budget = Column(Numeric(15, 2))
    actual_cost = Column(Numeric(15, 2))
    currency = Column(String(3), default="USD")

    # Risk and health indicators
    overall_health = Column(String(20), default="green")
    risk_level = Column(String(20), default="low")

    # Metadata
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    tags = Column(JSON)
    custom_fields = Column(JSON)

    # Audit fields
    created_by = Column(String(255))
    updated_by = Column(String(255))

    # Relationships
    business_cases = relationship("BusinessCase", back_populates="project", cascade="all, delete-orphan")
    project_charters = relationship("ProjectCharter", back_populates="project", cascade="all, delete-orphan")


class BusinessCase(Base, TimestampMixin):
    __tablename__ = "business_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    project_sop_id = Column(UUID(as_uuid=True), ForeignKey("project_sops.id"), nullable=True)
    version = Column(String(10), default="1.0")
    title = Column(String(255))

    # Business context
    business_area = Column(String(255))
    strategic_alignment = Column(Text)
    business_driver = Column(String(100))
    urgency = Column(String(20), default="medium")

    # Timeline & resources
    proposed_start_date = Column(Date)
    proposed_end_date = Column(Date)
    estimated_duration_months = Column(Integer)
    sponsor = Column(String(255))
    approvals = Column(JSON)

    # Core narrative sections
    project_description = Column(Text)
    background = Column(JSON)
    objectives = Column(JSON)
    deliverables = Column(JSON)
    scope_in = Column(JSON)
    scope_out = Column(JSON)

    # Dependencies & planning inputs
    interdependencies = Column(JSON)
    key_assumptions = Column(JSON)
    constraints = Column(JSON)

    # Risk & opportunity analysis
    risks = Column(JSON)
    opportunities = Column(JSON)

    # Financial analysis
    costs = Column(JSON)
    benefits = Column(JSON)
    roi_percentage = Column(Numeric(5, 2))
    npv_value = Column(Numeric(15, 2))
    payback_period_months = Column(Integer)
    financial_assumptions = Column(JSON)

    # Analysis & recommendation
    options_considered = Column(JSON)
    recommended_option = Column(Text)
    recommendation_rationale = Column(Text)
    success_criteria = Column(JSON)

    # Approval workflow
    status = Column(String(20), default="draft")
    approval_level = Column(String(20))
    submitted_date = Column(DateTime(timezone=True))
    approved_date = Column(DateTime(timezone=True))
    approved_by = Column(String(255))

    # Version control
    supersedes_version = Column(UUID(as_uuid=True), ForeignKey("business_cases.id"))
    is_current_version = Column(Boolean, default=True)

    # Audit fields
    created_by = Column(String(255))
    updated_by = Column(String(255))

    # Relationships
    project = relationship("Project", back_populates="business_cases")
    project_sop = relationship("ProjectSOP")
    project_charters = relationship("ProjectCharter", back_populates="business_case")


class ProjectCharter(Base, TimestampMixin):
    __tablename__ = "project_charters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    business_case_id = Column(UUID(as_uuid=True), ForeignKey("business_cases.id"))
    project_sop_id = Column(UUID(as_uuid=True), ForeignKey("project_sops.id"), nullable=True)
    version = Column(String(10), default="1.0")
    title = Column(String(255))

    # Charter metadata
    charter_date = Column(Date, server_default=func.current_date())
    sign_off_date = Column(Date)
    effective_date = Column(Date)
    review_date = Column(Date)
    expiry_date = Column(Date)

    # Authority & governance
    sponsor = Column(String(255), nullable=False)
    project_manager = Column(String(255))
    steering_committee = Column(JSON)
    governance_structure = Column(Text)

    # Team structure
    project_team = Column(JSON)
    key_stakeholders = Column(JSON)
    external_dependencies = Column(JSON)

    # Business justification
    business_case_summary = Column(Text)
    strategic_alignment = Column(Text)
    business_benefits = Column(JSON)
    success_criteria = Column(JSON)

    # Project definition
    project_objectives = Column(Text)
    scope_deliverables = Column(JSON)
    scope_exclusions = Column(JSON)
    assumptions = Column(JSON)
    constraints = Column(JSON)

    # Resource requirements
    resource_requirements = Column(JSON)
    budget_authority = Column(Numeric(15, 2))
    budget_tolerance = Column(Numeric(5, 2))

    # Schedule & milestones
    key_dates_milestones = Column(JSON)
    schedule_tolerance = Column(Integer)
    critical_deadlines = Column(JSON)

    # Risk management
    threats_opportunities = Column(JSON)
    risk_tolerance = Column(String(20))
    escalation_criteria = Column(JSON)

    # Authority & decision rights
    decision_authority = Column(JSON)
    change_control_process = Column(Text)
    reporting_requirements = Column(JSON)

    # Quality & compliance
    quality_standards = Column(JSON)
    compliance_requirements = Column(JSON)
    acceptance_criteria = Column(Text)

    # Approval workflow
    status = Column(String(20), default="draft")
    approval_level = Column(String(20))
    submitted_date = Column(DateTime(timezone=True))
    approved_date = Column(DateTime(timezone=True))
    approved_by = Column(String(255))
    approval_comments = Column(Text)

    # Version control
    supersedes_version = Column(UUID(as_uuid=True), ForeignKey("project_charters.id"))
    is_current_version = Column(Boolean, default=True)
    change_log = Column(JSON)

    # Audit fields
    created_by = Column(String(255))
    updated_by = Column(String(255))

    # Relationships
    project = relationship("Project", back_populates="project_charters")
    business_case = relationship("BusinessCase", back_populates="project_charters")
    project_sop = relationship("ProjectSOP")

