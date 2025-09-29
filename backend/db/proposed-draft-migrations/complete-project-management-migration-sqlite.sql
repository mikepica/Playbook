-- Complete Project Management System Migration (SQLite Compatible)
-- This migration creates all tables needed for comprehensive project management
-- Run this file to set up: Projects, Business Cases, Project Charters, and Supporting Tables

-- ============================================================================
-- 1. MASTER PROJECTS TABLE
-- ============================================================================

-- Master projects table to manage all projects centrally
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_name TEXT NOT NULL UNIQUE,
    project_code TEXT UNIQUE,                -- e.g., "PRJ-2024-001" for easier reference

    -- Basic project metadata
    description TEXT,
    business_area TEXT,                      -- department/function
    sponsor TEXT,                            -- primary sponsor name/title
    project_manager TEXT,                    -- assigned PM

    -- Timeline
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,

    -- Status and phase tracking
    status TEXT CHECK (status IN (
        'pre_initiation', 'initiation', 'planning',
        'execution', 'monitoring', 'closing', 'cancelled',
        'on_hold', 'completed'
    )) DEFAULT 'pre_initiation',

    phase TEXT CHECK (phase IN (
        'concept', 'development', 'implementation',
        'closure', 'benefits_realization'
    )),

    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',

    -- Financial tracking
    approved_budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',

    -- Risk and health indicators
    overall_health TEXT CHECK (overall_health IN ('green', 'amber', 'red')) DEFAULT 'green',
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',

    -- Metadata
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    tags TEXT,                                      -- JSON string for flexible tagging system
    custom_fields TEXT,                             -- JSON string for extensible organization-specific fields

    -- Audit fields
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. BUSINESS CASES TABLE
-- ============================================================================

-- Business cases table with improved structure and relationships
CREATE TABLE IF NOT EXISTS business_cases (
  -- Identity & relationships
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version TEXT DEFAULT '1.0',    -- version control for business cases
  title TEXT,                 -- custom title if different from project name

  -- Business context
  business_area TEXT,                 -- department/function
  strategic_alignment TEXT,                         -- how this aligns with org strategy
  business_driver TEXT,                 -- regulatory, competitive, growth, etc.
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',

  -- Timeline & resources
  proposed_start_date DATE,
  proposed_end_date DATE,
  estimated_duration_months INTEGER,
  sponsor TEXT,
  approvals TEXT,                        -- JSON string: [{approver, role, date, status, comments}]

  -- Core narrative sections
  project_description TEXT,                         -- brief description + strategic alignment
  background TEXT,                        -- JSON string: [{point, detail}] structured bullet points
  objectives TEXT,                        -- JSON string: [{objective, measurable_outcome, timeline}]
  deliverables TEXT,                        -- JSON string: [{deliverable, description, success_criteria}]
  scope_in TEXT,                        -- JSON string: [activity/area descriptions]
  scope_out TEXT,                        -- JSON string: [excluded activity/area descriptions]

  -- Dependencies & planning inputs
  interdependencies TEXT,                        -- JSON string: [{project_name, relationship_type, impact}]
  key_assumptions TEXT,                        -- JSON string: [{assumption, risk_if_wrong, validation_method}]
  constraints TEXT,                        -- JSON string: [{constraint_type, description, mitigation}]

  -- Risk & opportunity analysis
  risks TEXT,                        -- JSON string: [{risk, likelihood, impact, mitigation}]
  opportunities TEXT,                        -- JSON string: [{opportunity, likelihood, value, actions}]

  -- Financial analysis
  costs TEXT,                        -- JSON string: {one_time: {capex, implementation}, operational: {annual_opex}}
  benefits TEXT,                        -- JSON string: {financial: {revenue, cost_savings}, non_financial: [benefits]}
  roi_percentage DECIMAL(5,2),                 -- calculated ROI
  npv_value DECIMAL(15,2),                -- Net Present Value
  payback_period_months INTEGER,                      -- months to break even
  financial_assumptions TEXT,                        -- JSON string: [{assumption, value, source}]

  -- Analysis & recommendation
  options_considered TEXT,                        -- JSON string: [{option, pros, cons, cost_estimate}]
  recommended_option TEXT,                         -- which option is recommended
  recommendation_rationale TEXT,                         -- why this option
  success_criteria TEXT,                        -- JSON string: [{criteria, measure, target}]

  -- Approval workflow
  status TEXT CHECK (status IN (
    'draft', 'review_requested', 'under_review', 'revisions_required',
    'approved', 'rejected', 'archived'
  )) DEFAULT 'draft',

  approval_level TEXT CHECK (approval_level IN ('department', 'divisional', 'executive', 'board')),
  submitted_date DATETIME,
  approved_date DATETIME,
  approved_by TEXT,

  -- Version control
  supersedes_version TEXT REFERENCES business_cases(id),  -- if this replaces another version
  is_current_version BOOLEAN DEFAULT 1,

  -- Audit fields
  created_by TEXT,
  updated_by TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. PROJECT CHARTERS TABLE
-- ============================================================================

-- Project charters table with improved structure and relationships
CREATE TABLE IF NOT EXISTS project_charters (
  -- Identity & relationships
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  business_case_id TEXT REFERENCES business_cases(id),  -- link to approved business case
  version TEXT DEFAULT '1.0',           -- e.g., "1.0", "2.1"
  title TEXT,                        -- charter title if different from project name

  -- Charter metadata
  charter_date DATE DEFAULT (date('now')),
  sign_off_date DATE,
  effective_date DATE,                                -- when charter becomes active
  review_date DATE,                                -- scheduled review date
  expiry_date DATE,                                -- when charter expires

  -- Authority & governance
  sponsor TEXT NOT NULL,              -- single senior leader name/title
  project_manager TEXT,                       -- assigned PM
  steering_committee TEXT,                              -- JSON string: [{name, role, authority}]
  governance_structure TEXT,                               -- description of governance approach

  -- Team structure
  project_team TEXT,                              -- JSON string: [{name, role, skills, allocation_%}]
  key_stakeholders TEXT,                              -- JSON string: [{name/group, interest, influence, communication_req}]
  external_dependencies TEXT,                              -- JSON string: [{dependency, owner, criticality}]

  -- Business justification
  business_case_summary TEXT,                               -- short narrative
  strategic_alignment TEXT,                               -- how project aligns with strategy
  business_benefits TEXT,                              -- JSON string: [{benefit, measure, timeline, owner}]
  success_criteria TEXT,                              -- JSON string: [{criteria, measure, target, measurement_method}]

  -- Project definition
  project_objectives TEXT,                               -- clear SMART objectives
  scope_deliverables TEXT,                              -- JSON string: [{deliverable, description, acceptance_criteria}]
  scope_exclusions TEXT,                              -- JSON string: [exclusion descriptions]
  assumptions TEXT,                              -- JSON string: [{assumption, impact_if_wrong, validation_method}]
  constraints TEXT,                              -- JSON string: [{constraint_type, description, impact}]

  -- Resource requirements
  resource_requirements TEXT,                              -- JSON string: {human: {fte_req, skills}, financial: {budget}, other: [resources]}
  budget_authority DECIMAL(15,2),                      -- approved budget limit
  budget_tolerance DECIMAL(5,2),                       -- % variance allowed (e.g., 10.00 for ±10%)

  -- Schedule & milestones
  key_dates_milestones TEXT,                              -- JSON string: [{milestone, date, description, dependencies}]
  schedule_tolerance INTEGER,                            -- days variance allowed
  critical_deadlines TEXT,                              -- JSON string: [{deadline, reason, consequences_if_missed}]

  -- Risk management
  threats_opportunities TEXT,                              -- JSON string: [{type, description, likelihood, impact, response}]
  risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  escalation_criteria TEXT,                              -- JSON string: [{trigger, escalation_path, timeline}]

  -- Authority & decision rights
  decision_authority TEXT,                              -- JSON string: [{decision_type, authority_level, approver}]
  change_control_process TEXT,                               -- how changes will be managed
  reporting_requirements TEXT,                              -- JSON string: [{report_type, frequency, audience}]

  -- Quality & compliance
  quality_standards TEXT,                              -- JSON string: [standard descriptions]
  compliance_requirements TEXT,                              -- JSON string: [{requirement, source, validation_method}]
  acceptance_criteria TEXT,                               -- overall project acceptance criteria

  -- Approval workflow
  status TEXT CHECK (status IN (
    'draft', 'review_requested', 'under_review', 'revisions_required',
    'approved', 'active', 'superseded', 'cancelled', 'archived'
  )) DEFAULT 'draft',

  approval_level TEXT CHECK (approval_level IN ('pm', 'sponsor', 'steering_committee', 'executive')),
  submitted_date DATETIME,
  approved_date DATETIME,
  approved_by TEXT,
  approval_comments TEXT,

  -- Version control
  supersedes_version TEXT REFERENCES project_charters(id),  -- if this replaces another version
  is_current_version BOOLEAN DEFAULT 1,
  change_log TEXT,                              -- JSON string: [{version, date, changes, reason}]

  -- Audit fields
  created_by TEXT,
  updated_by TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. SUPPORTING TABLES
-- ============================================================================

-- Generic project documents table for extensibility
CREATE TABLE IF NOT EXISTS project_documents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Document metadata
    document_type TEXT NOT NULL,              -- 'business_case', 'charter', 'plan', 'status_report', etc.
    document_subtype TEXT,                    -- 'risk_register', 'communication_plan', etc.
    title TEXT NOT NULL,
    description TEXT,

    -- Document content (JSON string for different document structures)
    content TEXT NOT NULL,

    -- Version control
    version TEXT DEFAULT '1.0',
    supersedes_document_id TEXT REFERENCES project_documents(id),
    is_current_version BOOLEAN DEFAULT 1,

    -- File attachments
    file_attachments TEXT,                          -- JSON string: [{filename, file_path, size, mime_type}]

    -- Approval workflow
    status TEXT CHECK (status IN (
        'draft', 'review_requested', 'under_review', 'revisions_required',
        'approved', 'published', 'superseded', 'archived'
    )) DEFAULT 'draft',

    -- Access control
    visibility TEXT CHECK (visibility IN ('private', 'team', 'stakeholder', 'public')) DEFAULT 'team',
    access_permissions TEXT,                        -- JSON string: [{user/role, permission_level}]

    -- Audit fields
    created_by TEXT,
    updated_by TEXT,
    reviewed_by TEXT,
    approved_by TEXT,
    approved_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Project stakeholders management
CREATE TABLE IF NOT EXISTS project_stakeholders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Stakeholder identity
    stakeholder_type TEXT CHECK (stakeholder_type IN ('individual', 'group', 'organization')) NOT NULL,
    name TEXT NOT NULL,
    title_role TEXT,
    organization TEXT,
    department TEXT,

    -- Contact information
    email TEXT,
    phone TEXT,
    location TEXT,

    -- Stakeholder analysis
    interest_level TEXT CHECK (interest_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    influence_level TEXT CHECK (influence_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    attitude TEXT CHECK (attitude IN ('champion', 'supporter', 'neutral', 'critic', 'blocker')) DEFAULT 'neutral',

    -- Engagement strategy
    engagement_strategy TEXT,
    communication_frequency TEXT CHECK (communication_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'as_needed')),
    preferred_communication_method TEXT,      -- email, phone, meeting, dashboard, etc.

    -- Requirements and expectations
    key_requirements TEXT,                          -- JSON string: [{requirement, priority, status}]
    expectations TEXT,                              -- JSON string: [expectation descriptions]
    concerns TEXT,                                  -- JSON string: [{concern, mitigation_plan, status}]

    -- Relationship management
    relationship_owner TEXT,                 -- who manages this relationship
    last_contact_date DATE,
    next_contact_date DATE,
    relationship_notes TEXT,

    -- Metadata
    is_active BOOLEAN DEFAULT 1,
    tags TEXT,                                      -- JSON string for flexible tagging

    -- Audit fields
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Project status updates/reports
CREATE TABLE IF NOT EXISTS project_status_reports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Report metadata
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    report_date DATE DEFAULT (date('now')),
    report_type TEXT DEFAULT 'status_update',  -- 'status_update', 'milestone', 'exception', 'closure'

    -- Overall status
    overall_status TEXT CHECK (overall_status IN ('green', 'amber', 'red')) NOT NULL,
    schedule_status TEXT CHECK (schedule_status IN ('green', 'amber', 'red')) NOT NULL,
    budget_status TEXT CHECK (budget_status IN ('green', 'amber', 'red')) NOT NULL,
    scope_status TEXT CHECK (scope_status IN ('green', 'amber', 'red')) NOT NULL,
    quality_status TEXT CHECK (quality_status IN ('green', 'amber', 'red')) NOT NULL,

    -- Progress summary
    progress_summary TEXT,
    accomplishments TEXT,                           -- JSON string: [accomplishment descriptions]
    upcoming_activities TEXT,                       -- JSON string: [planned activity descriptions]

    -- Metrics and KPIs
    completion_percentage DECIMAL(5,2),              -- % complete
    budget_spent DECIMAL(15,2),
    budget_committed DECIMAL(15,2),
    schedule_variance_days INTEGER,                   -- positive = ahead, negative = behind

    -- Issues and risks
    current_issues TEXT,                            -- JSON string: [{issue, priority, owner, due_date, status}]
    new_risks TEXT,                                 -- JSON string: [{risk, likelihood, impact, mitigation}]
    decisions_needed TEXT,                          -- JSON string: [{decision, urgency, decision_maker, due_date}]

    -- Change requests
    change_requests TEXT,                           -- JSON string: [{change, impact, status, approval_date}]

    -- Milestones
    milestones_achieved TEXT,                       -- JSON string: [{milestone, planned_date, actual_date}]
    upcoming_milestones TEXT,                       -- JSON string: [{milestone, planned_date, confidence}]

    -- Stakeholder communication
    distributed_to TEXT,                           -- JSON string: [stakeholder names/groups]
    communication_notes TEXT,

    -- Approval
    submitted_by TEXT,
    reviewed_by TEXT,
    approved_by TEXT,
    status TEXT CHECK (status IN ('draft', 'submitted', 'approved', 'published')) DEFAULT 'draft',

    -- Audit fields
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Project risks register
CREATE TABLE IF NOT EXISTS project_risks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Risk identification
    risk_category TEXT,                       -- technical, schedule, budget, resource, external, etc.
    risk_title TEXT NOT NULL,
    risk_description TEXT NOT NULL,
    risk_source TEXT,                        -- where/how risk was identified

    -- Risk assessment
    likelihood TEXT CHECK (likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')) NOT NULL,
    impact TEXT CHECK (impact IN ('very_low', 'low', 'medium', 'high', 'very_high')) NOT NULL,
    risk_score DECIMAL(3,1),                         -- calculated score (1-25)
    impact_areas TEXT,                              -- JSON string: [area descriptions] - schedule, budget, quality, etc.

    -- Risk management
    risk_strategy TEXT CHECK (risk_strategy IN ('avoid', 'mitigate', 'transfer', 'accept')) NOT NULL,
    mitigation_plan TEXT,
    contingency_plan TEXT,
    risk_owner TEXT,                         -- who is responsible for managing this risk

    -- Timeline
    identified_date DATE DEFAULT (date('now')),
    target_closure_date DATE,
    actual_closure_date DATE,

    -- Status tracking
    risk_status TEXT CHECK (risk_status IN ('identified', 'assessed', 'planned', 'monitored', 'occurred', 'closed')) DEFAULT 'identified',

    -- Monitoring
    monitoring_frequency TEXT,                -- how often to review
    last_review_date DATE,
    next_review_date DATE,
    review_notes TEXT,

    -- Escalation
    escalation_criteria TEXT,
    escalated_date DATE,
    escalated_to TEXT,

    -- Metadata
    is_active BOOLEAN DEFAULT 1,
    tags TEXT,

    -- Audit fields
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_sponsor ON projects(sponsor);
CREATE INDEX IF NOT EXISTS idx_projects_business_area ON projects(business_area);
CREATE INDEX IF NOT EXISTS idx_projects_health ON projects(overall_health);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(display_order);

-- Business cases indexes
CREATE INDEX IF NOT EXISTS idx_business_cases_project_id ON business_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_business_cases_status ON business_cases(status);
CREATE INDEX IF NOT EXISTS idx_business_cases_current_version ON business_cases(is_current_version);
CREATE INDEX IF NOT EXISTS idx_business_cases_approval_level ON business_cases(approval_level);
CREATE INDEX IF NOT EXISTS idx_business_cases_sponsor ON business_cases(sponsor);

-- Project charters indexes
CREATE INDEX IF NOT EXISTS idx_project_charters_project_id ON project_charters(project_id);
CREATE INDEX IF NOT EXISTS idx_project_charters_business_case_id ON project_charters(business_case_id);
CREATE INDEX IF NOT EXISTS idx_project_charters_status ON project_charters(status);
CREATE INDEX IF NOT EXISTS idx_project_charters_current_version ON project_charters(is_current_version);
CREATE INDEX IF NOT EXISTS idx_project_charters_sponsor ON project_charters(sponsor);
CREATE INDEX IF NOT EXISTS idx_project_charters_pm ON project_charters(project_manager);

-- Supporting tables indexes
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_type ON project_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_project_documents_status ON project_documents(status);
CREATE INDEX IF NOT EXISTS idx_project_documents_current ON project_documents(is_current_version);

CREATE INDEX IF NOT EXISTS idx_project_stakeholders_project_id ON project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_type ON project_stakeholders(stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_influence ON project_stakeholders(influence_level);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_active ON project_stakeholders(is_active);

CREATE INDEX IF NOT EXISTS idx_project_status_reports_project_id ON project_status_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_status_reports_date ON project_status_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_project_status_reports_status ON project_status_reports(overall_status);

CREATE INDEX IF NOT EXISTS idx_project_risks_project_id ON project_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_risks_category ON project_risks(risk_category);
CREATE INDEX IF NOT EXISTS idx_project_risks_status ON project_risks(risk_status);
CREATE INDEX IF NOT EXISTS idx_project_risks_owner ON project_risks(risk_owner);
CREATE INDEX IF NOT EXISTS idx_project_risks_active ON project_risks(is_active);

-- ============================================================================
-- 6. UPDATE TRIGGERS (SQLite doesn't have PostgreSQL's set_updated_at function)
-- ============================================================================

-- Projects table trigger
CREATE TRIGGER IF NOT EXISTS projects_set_updated_at
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Business cases trigger
CREATE TRIGGER IF NOT EXISTS business_cases_set_updated_at
AFTER UPDATE ON business_cases
FOR EACH ROW
BEGIN
    UPDATE business_cases SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Project charters trigger
CREATE TRIGGER IF NOT EXISTS project_charters_set_updated_at
AFTER UPDATE ON project_charters
FOR EACH ROW
BEGIN
    UPDATE project_charters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Supporting tables triggers
CREATE TRIGGER IF NOT EXISTS project_documents_set_updated_at
AFTER UPDATE ON project_documents
FOR EACH ROW
BEGIN
    UPDATE project_documents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS project_stakeholders_set_updated_at
AFTER UPDATE ON project_stakeholders
FOR EACH ROW
BEGIN
    UPDATE project_stakeholders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS project_status_reports_set_updated_at
AFTER UPDATE ON project_status_reports
FOR EACH ROW
BEGIN
    UPDATE project_status_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS project_risks_set_updated_at
AFTER UPDATE ON project_risks
FOR EACH ROW
BEGIN
    UPDATE project_risks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- MIGRATION COMPLETE (SQLite Compatible)
-- ============================================================================

-- Summary of created tables:
-- 1. projects - Master project registry
-- 2. business_cases - Project business cases with financial analysis
-- 3. project_charters - Formal project authorization documents
-- 4. project_documents - Generic document storage
-- 5. project_stakeholders - Stakeholder management
-- 6. project_status_reports - Regular status reporting
-- 7. project_risks - Risk register and management
--
-- All tables include proper indexing, foreign key relationships,
-- check constraints, and automatic timestamp updates (SQLite compatible)