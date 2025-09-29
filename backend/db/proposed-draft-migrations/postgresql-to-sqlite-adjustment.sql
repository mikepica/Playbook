-- PostgreSQL to SQLite Adjustment Migration
-- This file converts existing PostgreSQL project management tables to SQLite-compatible format
-- Run this ONLY if you already have the PostgreSQL tables created and need to convert them

-- ============================================================================
-- STEP 1: Create backup tables with SQLite-compatible structure
-- ============================================================================

-- Backup and recreate projects table
CREATE TABLE IF NOT EXISTS projects_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_name TEXT NOT NULL UNIQUE,
    project_code TEXT UNIQUE,

    -- Basic project metadata
    description TEXT,
    business_area TEXT,
    sponsor TEXT,
    project_manager TEXT,

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
    is_active INTEGER DEFAULT 1,  -- SQLite uses INTEGER for BOOLEAN
    display_order INTEGER DEFAULT 0,
    tags TEXT,  -- JSON stored as TEXT
    custom_fields TEXT,  -- JSON stored as TEXT

    -- Audit fields
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Backup and recreate business_cases table
CREATE TABLE IF NOT EXISTS business_cases_new (
    -- Identity & relationships
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_id TEXT NOT NULL REFERENCES projects_new(id) ON DELETE CASCADE,
    version TEXT DEFAULT '1.0',
    title TEXT,

    -- Business context
    business_area TEXT,
    strategic_alignment TEXT,
    business_driver TEXT,
    urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',

    -- Timeline & resources
    proposed_start_date DATE,
    proposed_end_date DATE,
    estimated_duration_months INTEGER,
    sponsor TEXT,
    approvals TEXT,  -- JSON stored as TEXT

    -- Core narrative sections
    project_description TEXT,
    background TEXT,  -- JSON stored as TEXT
    objectives TEXT,  -- JSON stored as TEXT
    deliverables TEXT,  -- JSON stored as TEXT
    scope_in TEXT,  -- JSON stored as TEXT
    scope_out TEXT,  -- JSON stored as TEXT

    -- Dependencies & planning inputs
    interdependencies TEXT,  -- JSON stored as TEXT
    key_assumptions TEXT,  -- JSON stored as TEXT
    constraints TEXT,  -- JSON stored as TEXT

    -- Financial analysis
    investment_summary TEXT,  -- JSON stored as TEXT
    cost_breakdown TEXT,  -- JSON stored as TEXT
    benefit_analysis TEXT,  -- JSON stored as TEXT
    roi_analysis TEXT,  -- JSON stored as TEXT

    -- Risk assessment
    risks TEXT,  -- JSON stored as TEXT
    success_factors TEXT,  -- JSON stored as TEXT

    -- Options analysis
    options_considered TEXT,  -- JSON stored as TEXT
    recommendation TEXT,
    recommendation_rationale TEXT,

    -- Implementation approach
    implementation_approach TEXT,
    resource_requirements TEXT,  -- JSON stored as TEXT
    governance_structure TEXT,  -- JSON stored as TEXT

    -- Status tracking
    status TEXT CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'superseded')) DEFAULT 'draft',
    approval_date DATE,
    approval_authority TEXT,

    -- Document management
    is_current_version INTEGER DEFAULT 1,  -- SQLite uses INTEGER for BOOLEAN
    superseded_by TEXT,  -- Reference to newer version

    -- Audit fields
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Continue with other tables...
CREATE TABLE IF NOT EXISTS project_charters_new (
    -- Identity & relationships
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_id TEXT NOT NULL REFERENCES projects_new(id) ON DELETE CASCADE,
    version TEXT DEFAULT '1.0',

    -- Charter metadata
    charter_title TEXT,
    charter_date DATE,
    effective_date DATE,

    -- Project definition
    project_purpose TEXT,
    project_justification TEXT,
    success_criteria TEXT,  -- JSON stored as TEXT
    high_level_requirements TEXT,  -- JSON stored as TEXT
    high_level_risks TEXT,  -- JSON stored as TEXT

    -- Scope and deliverables
    project_scope_description TEXT,
    major_deliverables TEXT,  -- JSON stored as TEXT
    project_boundaries TEXT,  -- JSON stored as TEXT

    -- Timeline and milestones
    overall_project_timeline TEXT,
    major_milestones TEXT,  -- JSON stored as TEXT

    -- Resources and organization
    assigned_project_manager TEXT,
    project_manager_authority TEXT,  -- JSON stored as TEXT
    project_team_structure TEXT,  -- JSON stored as TEXT
    estimated_resources TEXT,  -- JSON stored as TEXT

    -- Stakeholders and approval
    project_sponsor TEXT,
    key_stakeholders TEXT,  -- JSON stored as TEXT
    approval_requirements TEXT,  -- JSON stored as TEXT

    -- Financial summary
    preliminary_budget_estimate DECIMAL(15,2),
    budget_authority TEXT,
    funding_source TEXT,

    -- Status and approvals
    status TEXT CHECK (status IN ('draft', 'review', 'approved', 'active', 'closed')) DEFAULT 'draft',
    approved_date DATE,
    approved_by TEXT,

    -- Document management
    is_current_version INTEGER DEFAULT 1,  -- SQLite uses INTEGER for BOOLEAN
    superseded_by TEXT,

    -- Audit fields
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Supporting tables
CREATE TABLE IF NOT EXISTS project_documents_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_id TEXT NOT NULL REFERENCES projects_new(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    version TEXT DEFAULT '1.0',
    description TEXT,
    tags TEXT,  -- JSON stored as TEXT
    is_current INTEGER DEFAULT 1,  -- SQLite uses INTEGER for BOOLEAN
    uploaded_by TEXT,
    uploaded_at DATETIME NOT NULL DEFAULT (datetime('now')),
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_stakeholders_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_id TEXT NOT NULL REFERENCES projects_new(id) ON DELETE CASCADE,
    stakeholder_name TEXT NOT NULL,
    stakeholder_role TEXT,
    organization TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    influence_level TEXT CHECK (influence_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
    interest_level TEXT CHECK (interest_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
    engagement_strategy TEXT,
    notes TEXT,
    is_active INTEGER DEFAULT 1,  -- SQLite uses INTEGER for BOOLEAN
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_status_reports_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_id TEXT NOT NULL REFERENCES projects_new(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    reporting_period_start DATE,
    reporting_period_end DATE,
    overall_status TEXT CHECK (overall_status IN ('green', 'amber', 'red')) DEFAULT 'green',
    schedule_status TEXT CHECK (schedule_status IN ('on_track', 'at_risk', 'delayed')) DEFAULT 'on_track',
    budget_status TEXT CHECK (budget_status IN ('on_track', 'at_risk', 'over_budget')) DEFAULT 'on_track',
    scope_status TEXT CHECK (scope_status IN ('stable', 'minor_changes', 'major_changes')) DEFAULT 'stable',
    accomplishments TEXT,  -- JSON stored as TEXT
    upcoming_activities TEXT,  -- JSON stored as TEXT
    issues_and_risks TEXT,  -- JSON stored as TEXT
    budget_summary TEXT,  -- JSON stored as TEXT
    milestone_progress TEXT,  -- JSON stored as TEXT
    key_metrics TEXT,  -- JSON stored as TEXT
    executive_summary TEXT,
    next_report_date DATE,
    reported_by TEXT,
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_risks_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    project_id TEXT NOT NULL REFERENCES projects_new(id) ON DELETE CASCADE,
    risk_title TEXT NOT NULL,
    risk_description TEXT,
    risk_category TEXT,
    probability TEXT CHECK (probability IN ('very_low', 'low', 'medium', 'high', 'very_high')) DEFAULT 'medium',
    impact TEXT CHECK (impact IN ('very_low', 'low', 'medium', 'high', 'very_high')) DEFAULT 'medium',
    risk_score INTEGER,  -- calculated field: probability * impact
    risk_status TEXT CHECK (risk_status IN ('identified', 'assessed', 'mitigated', 'closed', 'occurred')) DEFAULT 'identified',
    owner TEXT,
    mitigation_strategy TEXT,
    contingency_plan TEXT,
    target_date DATE,
    actual_closure_date DATE,
    is_active INTEGER DEFAULT 1,  -- SQLite uses INTEGER for BOOLEAN
    created_by TEXT,
    updated_by TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- STEP 2: Copy data from old tables to new tables (if data exists)
-- ============================================================================

-- Copy projects data
INSERT INTO projects_new (
    id, project_name, project_code, description, business_area, sponsor, project_manager,
    planned_start_date, planned_end_date, actual_start_date, actual_end_date,
    status, phase, priority, approved_budget, actual_cost, currency,
    overall_health, risk_level, is_active, display_order, tags, custom_fields,
    created_by, updated_by, created_at, updated_at
)
SELECT
    CAST(id AS TEXT), project_name, project_code, description, business_area, sponsor, project_manager,
    planned_start_date, planned_end_date, actual_start_date, actual_end_date,
    status, phase, priority, approved_budget, actual_cost, currency,
    overall_health, risk_level,
    CASE WHEN is_active THEN 1 ELSE 0 END,
    display_order,
    CASE WHEN tags IS NOT NULL THEN CAST(tags AS TEXT) ELSE NULL END,
    CASE WHEN custom_fields IS NOT NULL THEN CAST(custom_fields AS TEXT) ELSE NULL END,
    created_by, updated_by, created_at, updated_at
FROM projects
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='projects');

-- Copy business_cases data (similar pattern for other tables)
INSERT INTO business_cases_new SELECT * FROM business_cases WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='business_cases');
INSERT INTO project_charters_new SELECT * FROM project_charters WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='project_charters');
INSERT INTO project_documents_new SELECT * FROM project_documents WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='project_documents');
INSERT INTO project_stakeholders_new SELECT * FROM project_stakeholders WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='project_stakeholders');
INSERT INTO project_status_reports_new SELECT * FROM project_status_reports WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='project_status_reports');
INSERT INTO project_risks_new SELECT * FROM project_risks WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='project_risks');

-- ============================================================================
-- STEP 3: Drop old tables and rename new tables
-- ============================================================================

-- Drop old tables if they exist
DROP TABLE IF EXISTS project_risks;
DROP TABLE IF EXISTS project_status_reports;
DROP TABLE IF EXISTS project_stakeholders;
DROP TABLE IF EXISTS project_documents;
DROP TABLE IF EXISTS project_charters;
DROP TABLE IF EXISTS business_cases;
DROP TABLE IF EXISTS projects;

-- Rename new tables to original names
ALTER TABLE projects_new RENAME TO projects;
ALTER TABLE business_cases_new RENAME TO business_cases;
ALTER TABLE project_charters_new RENAME TO project_charters;
ALTER TABLE project_documents_new RENAME TO project_documents;
ALTER TABLE project_stakeholders_new RENAME TO project_stakeholders;
ALTER TABLE project_status_reports_new RENAME TO project_status_reports;
ALTER TABLE project_risks_new RENAME TO project_risks;

-- ============================================================================
-- STEP 4: Create indexes for performance
-- ============================================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(project_name);
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active);

-- Business cases indexes
CREATE INDEX IF NOT EXISTS idx_business_cases_project ON business_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_business_cases_status ON business_cases(status);
CREATE INDEX IF NOT EXISTS idx_business_cases_current ON business_cases(is_current_version);

-- Project charters indexes
CREATE INDEX IF NOT EXISTS idx_project_charters_project ON project_charters(project_id);
CREATE INDEX IF NOT EXISTS idx_project_charters_status ON project_charters(status);
CREATE INDEX IF NOT EXISTS idx_project_charters_current ON project_charters(is_current_version);

-- Supporting tables indexes
CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_type ON project_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_project ON project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_status_reports_project ON project_status_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_status_reports_date ON project_status_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_project_risks_project ON project_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_risks_status ON project_risks(risk_status);

-- ============================================================================
-- STEP 5: Create triggers for updated_at timestamps (SQLite equivalent)
-- ============================================================================

-- Projects trigger
CREATE TRIGGER IF NOT EXISTS trigger_projects_updated_at
    AFTER UPDATE ON projects
    FOR EACH ROW
BEGIN
    UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Business cases trigger
CREATE TRIGGER IF NOT EXISTS trigger_business_cases_updated_at
    AFTER UPDATE ON business_cases
    FOR EACH ROW
BEGIN
    UPDATE business_cases SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Project charters trigger
CREATE TRIGGER IF NOT EXISTS trigger_project_charters_updated_at
    AFTER UPDATE ON project_charters
    FOR EACH ROW
BEGIN
    UPDATE project_charters SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Project documents trigger
CREATE TRIGGER IF NOT EXISTS trigger_project_documents_updated_at
    AFTER UPDATE ON project_documents
    FOR EACH ROW
BEGIN
    UPDATE project_documents SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Project stakeholders trigger
CREATE TRIGGER IF NOT EXISTS trigger_project_stakeholders_updated_at
    AFTER UPDATE ON project_stakeholders
    FOR EACH ROW
BEGIN
    UPDATE project_stakeholders SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Project status reports trigger
CREATE TRIGGER IF NOT EXISTS trigger_project_status_reports_updated_at
    AFTER UPDATE ON project_status_reports
    FOR EACH ROW
BEGIN
    UPDATE project_status_reports SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Project risks trigger
CREATE TRIGGER IF NOT EXISTS trigger_project_risks_updated_at
    AFTER UPDATE ON project_risks
    FOR EACH ROW
BEGIN
    UPDATE project_risks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Migration complete
SELECT 'PostgreSQL to SQLite conversion completed successfully!' AS status;