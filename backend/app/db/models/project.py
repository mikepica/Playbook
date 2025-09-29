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
    documents = relationship("ProjectDocument", back_populates="project", cascade="all, delete-orphan")
    stakeholders = relationship("ProjectStakeholder", back_populates="project", cascade="all, delete-orphan")
    status_reports = relationship("ProjectStatusReport", back_populates="project", cascade="all, delete-orphan")
    risks = relationship("ProjectRisk", back_populates="project", cascade="all, delete-orphan")


class BusinessCase(Base, TimestampMixin):
    __tablename__ = "business_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
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
    project_charters = relationship("ProjectCharter", back_populates="business_case")


class ProjectCharter(Base, TimestampMixin):
    __tablename__ = "project_charters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    business_case_id = Column(UUID(as_uuid=True), ForeignKey("business_cases.id"))
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


class ProjectDocument(Base, TimestampMixin):
    __tablename__ = "project_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Document metadata
    document_type = Column(String(50), nullable=False)
    document_subtype = Column(String(50))
    title = Column(String(255), nullable=False)
    description = Column(Text)

    # Document content
    content = Column(JSON, nullable=False)

    # Version control
    version = Column(String(10), default="1.0")
    supersedes_document_id = Column(UUID(as_uuid=True), ForeignKey("project_documents.id"))
    is_current_version = Column(Boolean, default=True)

    # File attachments
    file_attachments = Column(JSON)

    # Approval workflow
    status = Column(String(20), default="draft")

    # Access control
    visibility = Column(String(20), default="team")
    access_permissions = Column(JSON)

    # Audit fields
    created_by = Column(String(255))
    updated_by = Column(String(255))
    reviewed_by = Column(String(255))
    approved_by = Column(String(255))
    approved_date = Column(DateTime(timezone=True))

    # Relationships
    project = relationship("Project", back_populates="documents")


class ProjectStakeholder(Base, TimestampMixin):
    __tablename__ = "project_stakeholders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Stakeholder identity
    stakeholder_type = Column(String(20), nullable=False)
    name = Column(String(255), nullable=False)
    title_role = Column(String(255))
    organization = Column(String(255))
    department = Column(String(255))

    # Contact information
    email = Column(String(255))
    phone = Column(String(50))
    location = Column(String(255))

    # Stakeholder analysis
    interest_level = Column(String(20), default="medium")
    influence_level = Column(String(20), default="medium")
    attitude = Column(String(20), default="neutral")

    # Engagement strategy
    engagement_strategy = Column(Text)
    communication_frequency = Column(String(20))
    preferred_communication_method = Column(String(50))

    # Requirements and expectations
    key_requirements = Column(JSON)
    expectations = Column(JSON)
    concerns = Column(JSON)

    # Relationship management
    relationship_owner = Column(String(255))
    last_contact_date = Column(Date)
    next_contact_date = Column(Date)
    relationship_notes = Column(Text)

    # Metadata
    is_active = Column(Boolean, default=True)
    tags = Column(JSON)

    # Audit fields
    created_by = Column(String(255))
    updated_by = Column(String(255))

    # Relationships
    project = relationship("Project", back_populates="stakeholders")


class ProjectStatusReport(Base, TimestampMixin):
    __tablename__ = "project_status_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Report metadata
    report_period_start = Column(Date, nullable=False)
    report_period_end = Column(Date, nullable=False)
    report_date = Column(Date, server_default=func.current_date())
    report_type = Column(String(50), default="status_update")

    # Overall status
    overall_status = Column(String(20), nullable=False)
    schedule_status = Column(String(20), nullable=False)
    budget_status = Column(String(20), nullable=False)
    scope_status = Column(String(20), nullable=False)
    quality_status = Column(String(20), nullable=False)

    # Progress summary
    progress_summary = Column(Text)
    accomplishments = Column(JSON)
    upcoming_activities = Column(JSON)

    # Metrics and KPIs
    completion_percentage = Column(Numeric(5, 2))
    budget_spent = Column(Numeric(15, 2))
    budget_committed = Column(Numeric(15, 2))
    schedule_variance_days = Column(Integer)

    # Issues and risks
    current_issues = Column(JSON)
    new_risks = Column(JSON)
    decisions_needed = Column(JSON)

    # Change requests
    change_requests = Column(JSON)

    # Milestones
    milestones_achieved = Column(JSON)
    upcoming_milestones = Column(JSON)

    # Stakeholder communication
    distributed_to = Column(JSON)
    communication_notes = Column(Text)

    # Approval
    submitted_by = Column(String(255))
    reviewed_by = Column(String(255))
    approved_by = Column(String(255))
    status = Column(String(20), default="draft")

    # Audit fields
    created_by = Column(String(255))
    updated_by = Column(String(255))

    # Relationships
    project = relationship("Project", back_populates="status_reports")


class ProjectRisk(Base, TimestampMixin):
    __tablename__ = "project_risks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Risk identification
    risk_category = Column(String(50))
    risk_title = Column(String(255), nullable=False)
    risk_description = Column(Text, nullable=False)
    risk_source = Column(String(100))

    # Risk assessment
    likelihood = Column(String(20), nullable=False)
    impact = Column(String(20), nullable=False)
    risk_score = Column(Numeric(3, 1))
    impact_areas = Column(JSON)

    # Risk management
    risk_strategy = Column(String(20), nullable=False)
    mitigation_plan = Column(Text)
    contingency_plan = Column(Text)
    risk_owner = Column(String(255))

    # Timeline
    identified_date = Column(Date, server_default=func.current_date())
    target_closure_date = Column(Date)
    actual_closure_date = Column(Date)

    # Status tracking
    risk_status = Column(String(20), default="identified")

    # Monitoring
    monitoring_frequency = Column(String(20))
    last_review_date = Column(Date)
    next_review_date = Column(Date)
    review_notes = Column(Text)

    # Escalation
    escalation_criteria = Column(Text)
    escalated_date = Column(Date)
    escalated_to = Column(String(255))

    # Metadata
    is_active = Column(Boolean, default=True)
    tags = Column(JSON)

    # Audit fields
    created_by = Column(String(255))
    updated_by = Column(String(255))

    # Relationships
    project = relationship("Project", back_populates="risks")