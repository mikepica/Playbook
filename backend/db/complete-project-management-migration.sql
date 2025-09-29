-- Complete Project Management System Migration
-- This migration creates all tables needed for comprehensive project management
-- Run this file to set up: Projects, Business Cases, Project Charters, and Supporting Tables

-- ============================================================================
-- 1. MASTER PROJECTS TABLE
-- ============================================================================

-- Master projects table to manage all projects centrally
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL UNIQUE,
    project_code VARCHAR(50) UNIQUE,                -- e.g., "PRJ-2024-001" for easier reference

    -- Basic project metadata
    description TEXT,
    business_area VARCHAR(255),                      -- department/function
    sponsor VARCHAR(255),                            -- primary sponsor name/title
    project_manager VARCHAR(255),                    -- assigned PM

    -- Timeline
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,

    -- Status and phase tracking
    status VARCHAR(50) CHECK (status IN (
        'pre_initiation', 'initiation', 'planning',
        'execution', 'monitoring', 'closing', 'cancelled',
        'on_hold', 'completed'
    )) DEFAULT 'pre_initiation',

    phase VARCHAR(50) CHECK (phase IN (
        'concept', 'development', 'implementation',
        'closure', 'benefits_realization'
    )),

    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',

    -- Financial tracking
    approved_budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Risk and health indicators
    overall_health VARCHAR(20) CHECK (overall_health IN ('green', 'amber', 'red')) DEFAULT 'green',
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    tags JSONB,                                      -- flexible tagging system
    custom_fields JSONB,                             -- extensible for organization-specific fields

    -- Audit fields
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. BUSINESS CASES TABLE
-- ============================================================================

-- Business cases table with improved structure and relationships
CREATE TABLE IF NOT EXISTS business_cases (
  -- Identity & relationships
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version                  VARCHAR(10) DEFAULT '1.0',    -- version control for business cases
  title                    VARCHAR(255),                 -- custom title if different from project name

  -- Business context
  business_area            VARCHAR(255),                 -- department/function
  strategic_alignment      TEXT,                         -- how this aligns with org strategy
  business_driver          VARCHAR(100),                 -- regulatory, competitive, growth, etc.
  urgency                  VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',

  -- Timeline & resources
  proposed_start_date      DATE,
  proposed_end_date        DATE,
  estimated_duration_months INTEGER,
  sponsor                  VARCHAR(255),
  approvals                JSONB,                        -- [{approver, role, date, status, comments}]

  -- Core narrative sections
  project_description      TEXT,                         -- brief description + strategic alignment
  background               JSONB,                        -- [{point, detail}] structured bullet points
  objectives               JSONB,                        -- [{objective, measurable_outcome, timeline}]
  deliverables             JSONB,                        -- [{deliverable, description, success_criteria}]
  scope_in                 JSONB,                        -- [activity/area descriptions]
  scope_out                JSONB,                        -- [excluded activity/area descriptions]

  -- Dependencies & planning inputs
  interdependencies        JSONB,                        -- [{project_name, relationship_type, impact}]
  key_assumptions          JSONB,                        -- [{assumption, risk_if_wrong, validation_method}]
  constraints              JSONB,                        -- [{constraint_type, description, mitigation}]

  -- Risk & opportunity analysis
  risks                    JSONB,                        -- [{risk, likelihood, impact, mitigation}]
  opportunities            JSONB,                        -- [{opportunity, likelihood, value, actions}]

  -- Financial analysis
  costs                    JSONB,                        -- {one_time: {capex, implementation}, operational: {annual_opex}}
  benefits                 JSONB,                        -- {financial: {revenue, cost_savings}, non_financial: [benefits]}
  roi_percentage           DECIMAL(5,2),                 -- calculated ROI
  npv_value                DECIMAL(15,2),                -- Net Present Value
  payback_period_months    INTEGER,                      -- months to break even
  financial_assumptions    JSONB,                        -- [{assumption, value, source}]

  -- Analysis & recommendation
  options_considered       JSONB,                        -- [{option, pros, cons, cost_estimate}]
  recommended_option       TEXT,                         -- which option is recommended
  recommendation_rationale TEXT,                         -- why this option
  success_criteria         JSONB,                        -- [{criteria, measure, target}]

  -- Approval workflow
  status                   VARCHAR(20) CHECK (status IN (
    'draft', 'review_requested', 'under_review', 'revisions_required',
    'approved', 'rejected', 'archived'
  )) DEFAULT 'draft',

  approval_level           VARCHAR(20) CHECK (approval_level IN ('department', 'divisional', 'executive', 'board')),
  submitted_date           TIMESTAMPTZ,
  approved_date            TIMESTAMPTZ,
  approved_by              VARCHAR(255),

  -- Version control
  supersedes_version       UUID REFERENCES business_cases(id),  -- if this replaces another version
  is_current_version       BOOLEAN DEFAULT true,

  -- Audit fields
  created_by               VARCHAR(255),
  updated_by               VARCHAR(255),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. PROJECT CHARTERS TABLE
-- ============================================================================

-- Project charters table with improved structure and relationships
CREATE TABLE IF NOT EXISTS project_charters (
  -- Identity & relationships
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  business_case_id          UUID REFERENCES business_cases(id),  -- link to approved business case
  version                   VARCHAR(10) DEFAULT '1.0',           -- e.g., "1.0", "2.1"
  title                     VARCHAR(255),                        -- charter title if different from project name

  -- Charter metadata
  charter_date              DATE DEFAULT CURRENT_DATE,
  sign_off_date             DATE,
  effective_date            DATE,                                -- when charter becomes active
  review_date               DATE,                                -- scheduled review date
  expiry_date               DATE,                                -- when charter expires

  -- Authority & governance
  sponsor                   VARCHAR(255) NOT NULL,              -- single senior leader name/title
  project_manager           VARCHAR(255),                       -- assigned PM
  steering_committee        JSONB,                              -- [{name, role, authority}]
  governance_structure      TEXT,                               -- description of governance approach

  -- Team structure
  project_team              JSONB,                              -- [{name, role, skills, allocation_%}]
  key_stakeholders          JSONB,                              -- [{name/group, interest, influence, communication_req}]
  external_dependencies     JSONB,                              -- [{dependency, owner, criticality}]

  -- Business justification
  business_case_summary     TEXT,                               -- short narrative
  strategic_alignment       TEXT,                               -- how project aligns with strategy
  business_benefits         JSONB,                              -- [{benefit, measure, timeline, owner}]
  success_criteria          JSONB,                              -- [{criteria, measure, target, measurement_method}]

  -- Project definition
  project_objectives        TEXT,                               -- clear SMART objectives
  scope_deliverables        JSONB,                              -- [{deliverable, description, acceptance_criteria}]
  scope_exclusions          JSONB,                              -- [exclusion descriptions]
  assumptions               JSONB,                              -- [{assumption, impact_if_wrong, validation_method}]
  constraints               JSONB,                              -- [{constraint_type, description, impact}]

  -- Resource requirements
  resource_requirements     JSONB,                              -- {human: {fte_req, skills}, financial: {budget}, other: [resources]}
  budget_authority          DECIMAL(15,2),                      -- approved budget limit
  budget_tolerance          DECIMAL(5,2),                       -- % variance allowed (e.g., 10.00 for ±10%)

  -- Schedule & milestones
  key_dates_milestones      JSONB,                              -- [{milestone, date, description, dependencies}]
  schedule_tolerance        INTEGER,                            -- days variance allowed
  critical_deadlines        JSONB,                              -- [{deadline, reason, consequences_if_missed}]

  -- Risk management
  threats_opportunities     JSONB,                              -- [{type, description, likelihood, impact, response}]
  risk_tolerance            VARCHAR(20) CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  escalation_criteria       JSONB,                              -- [{trigger, escalation_path, timeline}]

  -- Authority & decision rights
  decision_authority        JSONB,                              -- [{decision_type, authority_level, approver}]
  change_control_process    TEXT,                               -- how changes will be managed
  reporting_requirements    JSONB,                              -- [{report_type, frequency, audience}]

  -- Quality & compliance
  quality_standards         JSONB,                              -- [standard descriptions]
  compliance_requirements   JSONB,                              -- [{requirement, source, validation_method}]
  acceptance_criteria       TEXT,                               -- overall project acceptance criteria

  -- Approval workflow
  status                    VARCHAR(20) CHECK (status IN (
    'draft', 'review_requested', 'under_review', 'revisions_required',
    'approved', 'active', 'superseded', 'cancelled', 'archived'
  )) DEFAULT 'draft',

  approval_level            VARCHAR(20) CHECK (approval_level IN ('pm', 'sponsor', 'steering_committee', 'executive')),
  submitted_date            TIMESTAMPTZ,
  approved_date             TIMESTAMPTZ,
  approved_by               VARCHAR(255),
  approval_comments         TEXT,

  -- Version control
  supersedes_version        UUID REFERENCES project_charters(id),  -- if this replaces another version
  is_current_version        BOOLEAN DEFAULT true,
  change_log                JSONB,                              -- [{version, date, changes, reason}]

  -- Audit fields
  created_by                VARCHAR(255),
  updated_by                VARCHAR(255),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. SUPPORTING TABLES
-- ============================================================================

-- Generic project documents table for extensibility
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Document metadata
    document_type VARCHAR(50) NOT NULL,              -- 'business_case', 'charter', 'plan', 'status_report', etc.
    document_subtype VARCHAR(50),                    -- 'risk_register', 'communication_plan', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Document content (flexible JSONB for different document structures)
    content JSONB NOT NULL,

    -- Version control
    version VARCHAR(10) DEFAULT '1.0',
    supersedes_document_id UUID REFERENCES project_documents(id),
    is_current_version BOOLEAN DEFAULT true,

    -- File attachments
    file_attachments JSONB,                          -- [{filename, file_path, size, mime_type}]

    -- Approval workflow
    status VARCHAR(20) CHECK (status IN (
        'draft', 'review_requested', 'under_review', 'revisions_required',
        'approved', 'published', 'superseded', 'archived'
    )) DEFAULT 'draft',

    -- Access control
    visibility VARCHAR(20) CHECK (visibility IN ('private', 'team', 'stakeholder', 'public')) DEFAULT 'team',
    access_permissions JSONB,                        -- [{user/role, permission_level}]

    -- Audit fields
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    approved_by VARCHAR(255),
    approved_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project stakeholders management
CREATE TABLE IF NOT EXISTS project_stakeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Stakeholder identity
    stakeholder_type VARCHAR(20) CHECK (stakeholder_type IN ('individual', 'group', 'organization')) NOT NULL,
    name VARCHAR(255) NOT NULL,
    title_role VARCHAR(255),
    organization VARCHAR(255),
    department VARCHAR(255),

    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),

    -- Stakeholder analysis
    interest_level VARCHAR(20) CHECK (interest_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    influence_level VARCHAR(20) CHECK (influence_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    attitude VARCHAR(20) CHECK (attitude IN ('champion', 'supporter', 'neutral', 'critic', 'blocker')) DEFAULT 'neutral',

    -- Engagement strategy
    engagement_strategy TEXT,
    communication_frequency VARCHAR(20) CHECK (communication_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'as_needed')),
    preferred_communication_method VARCHAR(50),      -- email, phone, meeting, dashboard, etc.

    -- Requirements and expectations
    key_requirements JSONB,                          -- [{requirement, priority, status}]
    expectations JSONB,                              -- [expectation descriptions]
    concerns JSONB,                                  -- [{concern, mitigation_plan, status}]

    -- Relationship management
    relationship_owner VARCHAR(255),                 -- who manages this relationship
    last_contact_date DATE,
    next_contact_date DATE,
    relationship_notes TEXT,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    tags JSONB,                                      -- flexible tagging

    -- Audit fields
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project status updates/reports
CREATE TABLE IF NOT EXISTS project_status_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Report metadata
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    report_date DATE DEFAULT CURRENT_DATE,
    report_type VARCHAR(50) DEFAULT 'status_update',  -- 'status_update', 'milestone', 'exception', 'closure'

    -- Overall status
    overall_status VARCHAR(20) CHECK (overall_status IN ('green', 'amber', 'red')) NOT NULL,
    schedule_status VARCHAR(20) CHECK (schedule_status IN ('green', 'amber', 'red')) NOT NULL,
    budget_status VARCHAR(20) CHECK (budget_status IN ('green', 'amber', 'red')) NOT NULL,
    scope_status VARCHAR(20) CHECK (scope_status IN ('green', 'amber', 'red')) NOT NULL,
    quality_status VARCHAR(20) CHECK (quality_status IN ('green', 'amber', 'red')) NOT NULL,

    -- Progress summary
    progress_summary TEXT,
    accomplishments JSONB,                           -- [accomplishment descriptions]
    upcoming_activities JSONB,                       -- [planned activity descriptions]

    -- Metrics and KPIs
    completion_percentage DECIMAL(5,2),              -- % complete
    budget_spent DECIMAL(15,2),
    budget_committed DECIMAL(15,2),
    schedule_variance_days INTEGER,                   -- positive = ahead, negative = behind

    -- Issues and risks
    current_issues JSONB,                            -- [{issue, priority, owner, due_date, status}]
    new_risks JSONB,                                 -- [{risk, likelihood, impact, mitigation}]
    decisions_needed JSONB,                          -- [{decision, urgency, decision_maker, due_date}]

    -- Change requests
    change_requests JSONB,                           -- [{change, impact, status, approval_date}]

    -- Milestones
    milestones_achieved JSONB,                       -- [{milestone, planned_date, actual_date}]
    upcoming_milestones JSONB,                       -- [{milestone, planned_date, confidence}]

    -- Stakeholder communication
    distributed_to JSONB,                           -- [stakeholder names/groups]
    communication_notes TEXT,

    -- Approval
    submitted_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    approved_by VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('draft', 'submitted', 'approved', 'published')) DEFAULT 'draft',

    -- Audit fields
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project risks register
CREATE TABLE IF NOT EXISTS project_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Risk identification
    risk_category VARCHAR(50),                       -- technical, schedule, budget, resource, external, etc.
    risk_title VARCHAR(255) NOT NULL,
    risk_description TEXT NOT NULL,
    risk_source VARCHAR(100),                        -- where/how risk was identified

    -- Risk assessment
    likelihood VARCHAR(20) CHECK (likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')) NOT NULL,
    impact VARCHAR(20) CHECK (impact IN ('very_low', 'low', 'medium', 'high', 'very_high')) NOT NULL,
    risk_score DECIMAL(3,1),                         -- calculated score (1-25)
    impact_areas JSONB,                              -- [area descriptions] - schedule, budget, quality, etc.

    -- Risk management
    risk_strategy VARCHAR(20) CHECK (risk_strategy IN ('avoid', 'mitigate', 'transfer', 'accept')) NOT NULL,
    mitigation_plan TEXT,
    contingency_plan TEXT,
    risk_owner VARCHAR(255),                         -- who is responsible for managing this risk

    -- Timeline
    identified_date DATE DEFAULT CURRENT_DATE,
    target_closure_date DATE,
    actual_closure_date DATE,

    -- Status tracking
    risk_status VARCHAR(20) CHECK (risk_status IN ('identified', 'assessed', 'planned', 'monitored', 'occurred', 'closed')) DEFAULT 'identified',

    -- Monitoring
    monitoring_frequency VARCHAR(20),                -- how often to review
    last_review_date DATE,
    next_review_date DATE,
    review_notes TEXT,

    -- Escalation
    escalation_criteria TEXT,
    escalated_date DATE,
    escalated_to VARCHAR(255),

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    tags JSONB,

    -- Audit fields
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
-- 6. UPDATE TRIGGERS
-- ============================================================================

-- Projects table trigger
CREATE TRIGGER projects_set_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Business cases trigger
CREATE TRIGGER business_cases_set_updated_at
BEFORE UPDATE ON business_cases
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Project charters trigger
CREATE TRIGGER project_charters_set_updated_at
BEFORE UPDATE ON project_charters
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Supporting tables triggers
CREATE TRIGGER project_documents_set_updated_at
BEFORE UPDATE ON project_documents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER project_stakeholders_set_updated_at
BEFORE UPDATE ON project_stakeholders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER project_status_reports_set_updated_at
BEFORE UPDATE ON project_status_reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER project_risks_set_updated_at
BEFORE UPDATE ON project_risks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
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
-- check constraints, and automatic timestamp updates.