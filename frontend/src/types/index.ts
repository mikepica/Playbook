export interface SOPSummary {
  id: string;
  title: string;
  version: number;
  display_order: number;
  updated_at: string;
}

export interface SOP extends SOPSummary {
  content: SOPContent;
  created_at: string;
}

export interface SOPContent {
  markdown: string;
  [key: string]: unknown;
}

export interface SOPHistoryItem {
  id: string;
  sop_id: string;
  title: string;
  version: number;
  content: SOPContent;
  edited_by?: string | null;
  created_at: string;
}

export interface ChatThread {
  id: string;
  title: string;
  sop_id?: string | null;
  chat_type?: 'playbook' | 'project';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  id: string;
  project_name: string;
  project_code?: string;
  business_area?: string;
  sponsor?: string;
  status: string;
  overall_health: string;
  priority: string;
  display_order: number;
  updated_at: string;
}

export interface Project extends ProjectSummary {
  description?: string;
  project_manager?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  phase?: string;
  approved_budget?: number;
  actual_cost?: number;
  currency?: string;
  risk_level?: string;
  is_active?: boolean;
  tags?: Record<string, any>;
  custom_fields?: Record<string, any>;
  created_by?: string;
  updated_by?: string;
  created_at: string;
}

export interface BusinessCase {
  id: string;
  project_id: string;
  version: string;
  title?: string;
  business_area?: string;
  strategic_alignment?: string;
  business_driver?: string;
  urgency?: string;
  proposed_start_date?: string;
  proposed_end_date?: string;
  estimated_duration_months?: number;
  sponsor?: string;
  approvals?: Array<Record<string, any>>;
  project_description?: string;
  background?: Array<Record<string, any>>;
  objectives?: Array<Record<string, any>>;
  deliverables?: Array<Record<string, any>>;
  scope_in?: string[];
  scope_out?: string[];
  interdependencies?: Array<Record<string, any>>;
  key_assumptions?: Array<Record<string, any>>;
  constraints?: Array<Record<string, any>>;
  risks?: Array<Record<string, any>>;
  opportunities?: Array<Record<string, any>>;
  costs?: Record<string, any>;
  benefits?: Record<string, any>;
  roi_percentage?: number;
  npv_value?: number;
  payback_period_months?: number;
  financial_assumptions?: Array<Record<string, any>>;
  options_considered?: Array<Record<string, any>>;
  recommended_option?: string;
  recommendation_rationale?: string;
  success_criteria?: Array<Record<string, any>>;
  status?: string;
  approval_level?: string;
  submitted_date?: string;
  approved_date?: string;
  approved_by?: string;
  supersedes_version?: string;
  is_current_version?: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCharter {
  id: string;
  project_id: string;
  business_case_id?: string;
  version: string;
  title?: string;
  charter_date?: string;
  sign_off_date?: string;
  effective_date?: string;
  review_date?: string;
  expiry_date?: string;
  sponsor: string;
  project_manager?: string;
  steering_committee?: Array<Record<string, any>>;
  governance_structure?: string;
  project_team?: Array<Record<string, any>>;
  key_stakeholders?: Array<Record<string, any>>;
  external_dependencies?: Array<Record<string, any>>;
  business_case_summary?: string;
  strategic_alignment?: string;
  business_benefits?: Array<Record<string, any>>;
  success_criteria?: Array<Record<string, any>>;
  project_objectives?: string;
  scope_deliverables?: Array<Record<string, any>>;
  scope_exclusions?: string[];
  assumptions?: Array<Record<string, any>>;
  constraints?: Array<Record<string, any>>;
  resource_requirements?: Record<string, any>;
  budget_authority?: number;
  budget_tolerance?: number;
  key_dates_milestones?: Array<Record<string, any>>;
  schedule_tolerance?: number;
  critical_deadlines?: Array<Record<string, any>>;
  threats_opportunities?: Array<Record<string, any>>;
  risk_tolerance?: string;
  escalation_criteria?: Array<Record<string, any>>;
  decision_authority?: Array<Record<string, any>>;
  change_control_process?: string;
  reporting_requirements?: Array<Record<string, any>>;
  quality_standards?: string[];
  compliance_requirements?: Array<Record<string, any>>;
  acceptance_criteria?: string;
  status?: string;
  approval_level?: string;
  submitted_date?: string;
  approved_date?: string;
  approved_by?: string;
  approval_comments?: string;
  supersedes_version?: string;
  is_current_version?: boolean;
  change_log?: Array<Record<string, any>>;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export type DocumentType = 'business-case' | 'project-charter';
export type DocumentTypeOrNone = DocumentType | 'none';
export type ProjectDocument = BusinessCase | ProjectCharter;

export interface ProjectDocumentSelection {
  projectId: string;
  documentType: DocumentType;
  documentId?: string;
}

export interface ProjectDocumentModalData {
  mode: 'new' | 'existing';
  projectId?: string;
  projectName?: string;
  documentType?: DocumentTypeOrNone;
  projectCode?: string;
  businessArea?: string;
  sponsor?: string;
}

export interface ExistingDocuments {
  businessCase: boolean;
  projectCharter: boolean;
}

export interface ProjectSOPSummary {
  id: string;
  document_type: string;
  title: string;
  version: number;
  display_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface ProjectSOP extends ProjectSOPSummary {
  content: SOPContent;
  created_at: string;
}

export interface ProjectSOPHistoryItem {
  id: string;
  project_sop_id: string;
  document_type: string;
  title: string;
  version: number;
  content: SOPContent;
  edited_by?: string | null;
  created_at: string;
}

export interface ProjectSOPSelection {
  sopId: string;
}
