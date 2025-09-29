-- Complete Project Management System Migration
-- This migration creates all tables needed for comprehensive project management
-- Run this file to set up: Projects, Business Cases, Project Charters, Project SOPs, and Supporting Tables
--
-- IMPORTANT: This file incorporates all latest changes including:
-- - Project SOPs as global document type registry
-- - Proper foreign key relationships
-- - Clean table structures without unwanted columns

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
-- 4. PROJECT SOPS (GLOBAL DOCUMENT TYPE REGISTRY)
-- ============================================================================

-- Global document type registry - one entry per document type
-- This table defines templates/instructions for different document types
CREATE TABLE IF NOT EXISTS project_sops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(50) NOT NULL UNIQUE,        -- e.g., 'business_case', 'project_charter'
    title VARCHAR(255) NOT NULL,                      -- Display name e.g., 'Business Case', 'Project Charter'
    version INTEGER NOT NULL DEFAULT 1,
    content JSONB NOT NULL,                           -- Template/instructions for this document type
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,                   -- Can this document type be used
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project SOP History for tracking changes to document type templates
CREATE TABLE IF NOT EXISTS project_sop_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_sop_id UUID NOT NULL REFERENCES project_sops(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    content JSONB NOT NULL,
    edited_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. ADD PROJECT_SOP_ID TO DOCUMENT TABLES
-- ============================================================================

-- Add foreign key to business_cases table to link to document type
ALTER TABLE business_cases
ADD COLUMN IF NOT EXISTS project_sop_id UUID REFERENCES project_sops(id);

-- Add foreign key to project_charters table to link to document type
ALTER TABLE project_charters
ADD COLUMN IF NOT EXISTS project_sop_id UUID REFERENCES project_sops(id);

-- ============================================================================
-- 6. SUPPORTING TABLES
-- ============================================================================

-- Note: Only essential tables are included
-- Additional supporting tables can be added as needed

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
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

-- Project SOPs indexes
CREATE INDEX IF NOT EXISTS idx_project_sops_document_type ON project_sops(document_type);
CREATE INDEX IF NOT EXISTS idx_project_sops_display_order ON project_sops(display_order);
CREATE INDEX IF NOT EXISTS idx_project_sops_active ON project_sops(is_active);

-- Project SOP History indexes
CREATE INDEX IF NOT EXISTS idx_project_sop_history_project_sop_id ON project_sop_history(project_sop_id);
CREATE INDEX IF NOT EXISTS idx_project_sop_history_document_type ON project_sop_history(document_type);

-- Foreign key indexes for document tables
CREATE INDEX IF NOT EXISTS idx_business_cases_project_sop_id ON business_cases(project_sop_id);
CREATE INDEX IF NOT EXISTS idx_project_charters_project_sop_id ON project_charters(project_sop_id);

-- Additional indexes can be added as needed for supporting tables

-- ============================================================================
-- 8. UPDATE TRIGGERS
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

-- Project SOPs triggers
CREATE TRIGGER project_sops_set_updated_at
BEFORE UPDATE ON project_sops
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER project_sop_history_set_updated_at
BEFORE UPDATE ON project_sop_history
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Additional triggers can be added as needed for supporting tables

-- ============================================================================
-- 9. INSERT INITIAL PROJECT SOP DOCUMENT TYPES
-- ============================================================================

-- Insert Business Case document type
INSERT INTO project_sops (
    document_type,
    title,
    version,
    content,
    display_order,
    is_active
) VALUES (
    'business_case',
    'Business Case',
    1,
    '{"markdown": "# Business Case Template\n\n## Purpose\nThis document type is used to create and manage business cases for projects. It provides the business justification and financial analysis for project approval.\n\n## Key Sections\n- Business justification\n- Financial analysis (ROI, NPV, payback period)\n- Risk assessment\n- Options analysis\n- Recommendation\n\n## Usage\nEach project can have one current business case document that outlines the business rationale for the project investment."}',
    1,
    true
) ON CONFLICT (document_type) DO NOTHING;

-- Insert Project Charter document type
INSERT INTO project_sops (
    document_type,
    title,
    version,
    content,
    display_order,
    is_active
) VALUES (
    'project_charter',
    'Project Charter',
    1,
    '{"markdown": "# Project Charter Template\n\n## Purpose\nThis document type is used to formally authorize projects and define their scope, objectives, and governance structure.\n\n## Key Sections\n- Project objectives and success criteria\n- Scope definition and deliverables\n- Timeline and milestones\n- Resource requirements\n- Risk management approach\n- Governance structure\n\n## Usage\nEach project should have an approved charter that serves as the formal authorization to proceed with project execution."}',
    2,
    true
) ON CONFLICT (document_type) DO NOTHING;

-- ============================================================================
-- 10. LINK EXISTING DOCUMENTS TO DOCUMENT TYPES
-- ============================================================================

-- Link existing business cases to the business_case document type
UPDATE business_cases
SET project_sop_id = (
    SELECT id FROM project_sops WHERE document_type = 'business_case'
)
WHERE project_sop_id IS NULL;

-- Link existing project charters to the project_charter document type
UPDATE project_charters
SET project_sop_id = (
    SELECT id FROM project_sops WHERE document_type = 'project_charter'
)
WHERE project_sop_id IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of created tables:
-- 1. projects - Master project registry
-- 2. business_cases - Project business cases with financial analysis
-- 3. project_charters - Formal project authorization documents
-- 4. project_sops - Global document type registry/templates
-- 5. project_sop_history - Version history for document type templates
--
-- Key relationships:
-- - business_cases.project_id -> projects.id
-- - business_cases.project_sop_id -> project_sops.id
-- - project_charters.project_id -> projects.id
-- - project_charters.project_sop_id -> project_sops.id
-- - project_charters.business_case_id -> business_cases.id
-- - project_sop_history.project_sop_id -> project_sops.id
--
-- All tables include proper indexing, foreign key relationships,
-- check constraints, and automatic timestamp updates.
--
-- Project SOPs structure:
-- - Exactly 2 rows initially (business_case, project_charter)
-- - Can be extended with additional document types as needed
-- - Each row represents a global template/registry for that document type