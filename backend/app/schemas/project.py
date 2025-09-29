from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# Base schemas
class ProjectBase(BaseModel):
    project_name: str = Field(..., max_length=255)
    project_code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    business_area: Optional[str] = Field(None, max_length=255)
    sponsor: Optional[str] = Field(None, max_length=255)
    project_manager: Optional[str] = Field(None, max_length=255)
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    status: Optional[str] = "pre_initiation"
    phase: Optional[str] = None
    priority: Optional[str] = "medium"
    approved_budget: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    currency: Optional[str] = "USD"
    overall_health: Optional[str] = "green"
    risk_level: Optional[str] = "low"
    is_active: Optional[bool] = True
    display_order: Optional[int] = 0
    tags: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None


class ProjectCreate(ProjectBase):
    created_by: Optional[str] = None


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = Field(None, max_length=255)
    project_code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    business_area: Optional[str] = Field(None, max_length=255)
    sponsor: Optional[str] = Field(None, max_length=255)
    project_manager: Optional[str] = Field(None, max_length=255)
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    status: Optional[str] = None
    phase: Optional[str] = None
    priority: Optional[str] = None
    approved_budget: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    currency: Optional[str] = None
    overall_health: Optional[str] = None
    risk_level: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    tags: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    updated_by: Optional[str] = None


class ProjectSummary(BaseModel):
    id: UUID
    project_name: str
    project_code: Optional[str]
    business_area: Optional[str]
    sponsor: Optional[str]
    status: str
    overall_health: str
    priority: str
    display_order: int
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectRead(ProjectBase):
    id: UUID
    created_by: Optional[str]
    updated_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectList(BaseModel):
    items: List[ProjectSummary]


# Business Case schemas
class BusinessCaseBase(BaseModel):
    version: Optional[str] = "1.0"
    title: Optional[str] = None
    business_area: Optional[str] = None
    strategic_alignment: Optional[str] = None
    business_driver: Optional[str] = None
    urgency: Optional[str] = "medium"
    proposed_start_date: Optional[date] = None
    proposed_end_date: Optional[date] = None
    estimated_duration_months: Optional[int] = None
    sponsor: Optional[str] = None
    approvals: Optional[List[Dict[str, Any]]] = None
    project_description: Optional[str] = None
    background: Optional[List[Dict[str, Any]]] = None
    objectives: Optional[List[Dict[str, Any]]] = None
    deliverables: Optional[List[Dict[str, Any]]] = None
    scope_in: Optional[List[str]] = None
    scope_out: Optional[List[str]] = None
    interdependencies: Optional[List[Dict[str, Any]]] = None
    key_assumptions: Optional[List[Dict[str, Any]]] = None
    constraints: Optional[List[Dict[str, Any]]] = None
    risks: Optional[List[Dict[str, Any]]] = None
    opportunities: Optional[List[Dict[str, Any]]] = None
    costs: Optional[Dict[str, Any]] = None
    benefits: Optional[Dict[str, Any]] = None
    roi_percentage: Optional[Decimal] = None
    npv_value: Optional[Decimal] = None
    payback_period_months: Optional[int] = None
    financial_assumptions: Optional[List[Dict[str, Any]]] = None
    options_considered: Optional[List[Dict[str, Any]]] = None
    recommended_option: Optional[str] = None
    recommendation_rationale: Optional[str] = None
    success_criteria: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = "draft"
    approval_level: Optional[str] = None
    is_current_version: Optional[bool] = True


class BusinessCaseCreate(BusinessCaseBase):
    project_id: UUID
    created_by: Optional[str] = None


class BusinessCaseUpdate(BaseModel):
    title: Optional[str] = None
    business_area: Optional[str] = None
    strategic_alignment: Optional[str] = None
    business_driver: Optional[str] = None
    urgency: Optional[str] = None
    proposed_start_date: Optional[date] = None
    proposed_end_date: Optional[date] = None
    estimated_duration_months: Optional[int] = None
    sponsor: Optional[str] = None
    approvals: Optional[List[Dict[str, Any]]] = None
    project_description: Optional[str] = None
    background: Optional[List[Dict[str, Any]]] = None
    objectives: Optional[List[Dict[str, Any]]] = None
    deliverables: Optional[List[Dict[str, Any]]] = None
    scope_in: Optional[List[str]] = None
    scope_out: Optional[List[str]] = None
    interdependencies: Optional[List[Dict[str, Any]]] = None
    key_assumptions: Optional[List[Dict[str, Any]]] = None
    constraints: Optional[List[Dict[str, Any]]] = None
    risks: Optional[List[Dict[str, Any]]] = None
    opportunities: Optional[List[Dict[str, Any]]] = None
    costs: Optional[Dict[str, Any]] = None
    benefits: Optional[Dict[str, Any]] = None
    roi_percentage: Optional[Decimal] = None
    npv_value: Optional[Decimal] = None
    payback_period_months: Optional[int] = None
    financial_assumptions: Optional[List[Dict[str, Any]]] = None
    options_considered: Optional[List[Dict[str, Any]]] = None
    recommended_option: Optional[str] = None
    recommendation_rationale: Optional[str] = None
    success_criteria: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    approval_level: Optional[str] = None
    updated_by: Optional[str] = None


class BusinessCaseRead(BusinessCaseBase):
    id: UUID
    project_id: UUID
    supersedes_version: Optional[UUID]
    submitted_date: Optional[datetime]
    approved_date: Optional[datetime]
    approved_by: Optional[str]
    created_by: Optional[str]
    updated_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Project Charter schemas
class ProjectCharterBase(BaseModel):
    version: Optional[str] = "1.0"
    title: Optional[str] = None
    charter_date: Optional[date] = None
    sign_off_date: Optional[date] = None
    effective_date: Optional[date] = None
    review_date: Optional[date] = None
    expiry_date: Optional[date] = None
    sponsor: str = Field(..., max_length=255)
    project_manager: Optional[str] = None
    steering_committee: Optional[List[Dict[str, Any]]] = None
    governance_structure: Optional[str] = None
    project_team: Optional[List[Dict[str, Any]]] = None
    key_stakeholders: Optional[List[Dict[str, Any]]] = None
    external_dependencies: Optional[List[Dict[str, Any]]] = None
    business_case_summary: Optional[str] = None
    strategic_alignment: Optional[str] = None
    business_benefits: Optional[List[Dict[str, Any]]] = None
    success_criteria: Optional[List[Dict[str, Any]]] = None
    project_objectives: Optional[str] = None
    scope_deliverables: Optional[List[Dict[str, Any]]] = None
    scope_exclusions: Optional[List[str]] = None
    assumptions: Optional[List[Dict[str, Any]]] = None
    constraints: Optional[List[Dict[str, Any]]] = None
    resource_requirements: Optional[Dict[str, Any]] = None
    budget_authority: Optional[Decimal] = None
    budget_tolerance: Optional[Decimal] = None
    key_dates_milestones: Optional[List[Dict[str, Any]]] = None
    schedule_tolerance: Optional[int] = None
    critical_deadlines: Optional[List[Dict[str, Any]]] = None
    threats_opportunities: Optional[List[Dict[str, Any]]] = None
    risk_tolerance: Optional[str] = None
    escalation_criteria: Optional[List[Dict[str, Any]]] = None
    decision_authority: Optional[List[Dict[str, Any]]] = None
    change_control_process: Optional[str] = None
    reporting_requirements: Optional[List[Dict[str, Any]]] = None
    quality_standards: Optional[List[str]] = None
    compliance_requirements: Optional[List[Dict[str, Any]]] = None
    acceptance_criteria: Optional[str] = None
    status: Optional[str] = "draft"
    approval_level: Optional[str] = None
    is_current_version: Optional[bool] = True


class ProjectCharterCreate(ProjectCharterBase):
    project_id: UUID
    business_case_id: Optional[UUID] = None
    created_by: Optional[str] = None


class ProjectCharterUpdate(BaseModel):
    title: Optional[str] = None
    charter_date: Optional[date] = None
    sign_off_date: Optional[date] = None
    effective_date: Optional[date] = None
    review_date: Optional[date] = None
    expiry_date: Optional[date] = None
    sponsor: Optional[str] = None
    project_manager: Optional[str] = None
    steering_committee: Optional[List[Dict[str, Any]]] = None
    governance_structure: Optional[str] = None
    project_team: Optional[List[Dict[str, Any]]] = None
    key_stakeholders: Optional[List[Dict[str, Any]]] = None
    external_dependencies: Optional[List[Dict[str, Any]]] = None
    business_case_summary: Optional[str] = None
    strategic_alignment: Optional[str] = None
    business_benefits: Optional[List[Dict[str, Any]]] = None
    success_criteria: Optional[List[Dict[str, Any]]] = None
    project_objectives: Optional[str] = None
    scope_deliverables: Optional[List[Dict[str, Any]]] = None
    scope_exclusions: Optional[List[str]] = None
    assumptions: Optional[List[Dict[str, Any]]] = None
    constraints: Optional[List[Dict[str, Any]]] = None
    resource_requirements: Optional[Dict[str, Any]] = None
    budget_authority: Optional[Decimal] = None
    budget_tolerance: Optional[Decimal] = None
    key_dates_milestones: Optional[List[Dict[str, Any]]] = None
    schedule_tolerance: Optional[int] = None
    critical_deadlines: Optional[List[Dict[str, Any]]] = None
    threats_opportunities: Optional[List[Dict[str, Any]]] = None
    risk_tolerance: Optional[str] = None
    escalation_criteria: Optional[List[Dict[str, Any]]] = None
    decision_authority: Optional[List[Dict[str, Any]]] = None
    change_control_process: Optional[str] = None
    reporting_requirements: Optional[List[Dict[str, Any]]] = None
    quality_standards: Optional[List[str]] = None
    compliance_requirements: Optional[List[Dict[str, Any]]] = None
    acceptance_criteria: Optional[str] = None
    status: Optional[str] = None
    approval_level: Optional[str] = None
    updated_by: Optional[str] = None


class ProjectCharterRead(ProjectCharterBase):
    id: UUID
    project_id: UUID
    business_case_id: Optional[UUID]
    supersedes_version: Optional[UUID]
    change_log: Optional[List[Dict[str, Any]]]
    submitted_date: Optional[datetime]
    approved_date: Optional[datetime]
    approved_by: Optional[str]
    approval_comments: Optional[str]
    created_by: Optional[str]
    updated_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# List schemas
class BusinessCaseList(BaseModel):
    items: List[BusinessCaseRead]


class ProjectCharterList(BaseModel):
    items: List[ProjectCharterRead]