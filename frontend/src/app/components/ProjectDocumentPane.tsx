'use client';

import { useMemo } from 'react';
import { BusinessCase, ProjectCharter, DocumentType, ProjectDocument } from '@/types';
import { BusinessCaseEditForm } from './BusinessCaseEditForm';
import { ProjectCharterEditForm } from './ProjectCharterEditForm';
import styles from './ProjectDocumentPane.module.css';

interface Props {
  document: ProjectDocument | null;
  documentType: DocumentType | null;
  projectName?: string;
  isLoading?: boolean;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
  editorValue?: any;
  onEditorChange?: (value: any) => void;
  onAIEdit?: () => void;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Not specified';
  return new Date(dateString).toLocaleDateString();
}

function formatCurrency(amount?: number, currency?: string): string {
  if (amount === undefined) return 'Not specified';
  const currencyCode = currency || 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode
  }).format(amount);
}

function renderArrayField(title: string, items: Array<Record<string, any>> | undefined): JSX.Element | null {
  if (!items || items.length === 0) return null;

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.arrayContent}>
        {items.map((item, index) => (
          <div key={index} className={styles.arrayItem}>
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className={styles.fieldRow}>
                <span className={styles.fieldLabel}>{key.replace(/_/g, ' ')}</span>
                <span className={styles.fieldValue}>{String(value)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderSimpleField(label: string, value: any): JSX.Element | null {
  if (value === undefined || value === null || value === '') return null;

  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{String(value)}</span>
    </div>
  );
}

function BusinessCaseContent({ businessCase }: { businessCase: BusinessCase }) {
  return (
    <div className={styles.documentContent}>
      <div className={styles.basicInfo}>
        <h2 className={styles.documentTitle}>{businessCase.title || 'Business Case'}</h2>
        <div className={styles.metadata}>
          <span className={styles.version}>Version {businessCase.version}</span>
          <span className={`${styles.statusBadge} ${styles[businessCase.status || 'draft']}`}>
            {businessCase.status || 'Draft'}
          </span>
        </div>
      </div>

      <div className={styles.contentSections}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Overview</h3>
          {renderSimpleField('Business Area', businessCase.business_area)}
          {renderSimpleField('Strategic Alignment', businessCase.strategic_alignment)}
          {renderSimpleField('Business Driver', businessCase.business_driver)}
          {renderSimpleField('Urgency', businessCase.urgency)}
          {renderSimpleField('Sponsor', businessCase.sponsor)}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Timeline & Duration</h3>
          {renderSimpleField('Proposed Start Date', formatDate(businessCase.proposed_start_date))}
          {renderSimpleField('Proposed End Date', formatDate(businessCase.proposed_end_date))}
          {renderSimpleField('Estimated Duration', businessCase.estimated_duration_months ? `${businessCase.estimated_duration_months} months` : undefined)}
        </div>

        {businessCase.project_description && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Project Description</h3>
            <p className={styles.description}>{businessCase.project_description}</p>
          </div>
        )}

        {renderArrayField('Background', businessCase.background)}
        {renderArrayField('Objectives', businessCase.objectives)}
        {renderArrayField('Deliverables', businessCase.deliverables)}

        {(businessCase.scope_in && businessCase.scope_in.length > 0) && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Scope Inclusions</h3>
            <ul className={styles.scopeList}>
              {businessCase.scope_in.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {(businessCase.scope_out && businessCase.scope_out.length > 0) && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Scope Exclusions</h3>
            <ul className={styles.scopeList}>
              {businessCase.scope_out.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Financial Summary</h3>
          {renderSimpleField('ROI Percentage', businessCase.roi_percentage ? `${businessCase.roi_percentage}%` : undefined)}
          {renderSimpleField('NPV Value', businessCase.npv_value ? formatCurrency(businessCase.npv_value) : undefined)}
          {renderSimpleField('Payback Period', businessCase.payback_period_months ? `${businessCase.payback_period_months} months` : undefined)}
        </div>

        {renderArrayField('Risks', businessCase.risks)}
        {renderArrayField('Opportunities', businessCase.opportunities)}
        {renderArrayField('Key Assumptions', businessCase.key_assumptions)}
        {renderArrayField('Constraints', businessCase.constraints)}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Approval Information</h3>
          {renderSimpleField('Approval Level', businessCase.approval_level)}
          {renderSimpleField('Submitted Date', formatDate(businessCase.submitted_date))}
          {renderSimpleField('Approved Date', formatDate(businessCase.approved_date))}
          {renderSimpleField('Approved By', businessCase.approved_by)}
        </div>
      </div>
    </div>
  );
}

function ProjectCharterContent({ charter }: { charter: ProjectCharter }) {
  return (
    <div className={styles.documentContent}>
      <div className={styles.basicInfo}>
        <h2 className={styles.documentTitle}>{charter.title || 'Project Charter'}</h2>
        <div className={styles.metadata}>
          <span className={styles.version}>Version {charter.version}</span>
          <span className={`${styles.statusBadge} ${styles[charter.status || 'draft']}`}>
            {charter.status || 'Draft'}
          </span>
        </div>
      </div>

      <div className={styles.contentSections}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Charter Information</h3>
          {renderSimpleField('Charter Date', formatDate(charter.charter_date))}
          {renderSimpleField('Sign-off Date', formatDate(charter.sign_off_date))}
          {renderSimpleField('Effective Date', formatDate(charter.effective_date))}
          {renderSimpleField('Review Date', formatDate(charter.review_date))}
          {renderSimpleField('Expiry Date', formatDate(charter.expiry_date))}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Project Leadership</h3>
          {renderSimpleField('Sponsor', charter.sponsor)}
          {renderSimpleField('Project Manager', charter.project_manager)}
          {renderSimpleField('Governance Structure', charter.governance_structure)}
        </div>

        {renderArrayField('Steering Committee', charter.steering_committee)}
        {renderArrayField('Project Team', charter.project_team)}
        {renderArrayField('Key Stakeholders', charter.key_stakeholders)}

        {charter.project_objectives && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Project Objectives</h3>
            <p className={styles.description}>{charter.project_objectives}</p>
          </div>
        )}

        {charter.business_case_summary && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Business Case Summary</h3>
            <p className={styles.description}>{charter.business_case_summary}</p>
          </div>
        )}

        {renderArrayField('Scope & Deliverables', charter.scope_deliverables)}

        {(charter.scope_exclusions && charter.scope_exclusions.length > 0) && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Scope Exclusions</h3>
            <ul className={styles.scopeList}>
              {charter.scope_exclusions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Budget & Resources</h3>
          {renderSimpleField('Budget Authority', charter.budget_authority ? formatCurrency(charter.budget_authority) : undefined)}
          {renderSimpleField('Budget Tolerance', charter.budget_tolerance ? formatCurrency(charter.budget_tolerance) : undefined)}
          {renderSimpleField('Schedule Tolerance', charter.schedule_tolerance ? `${charter.schedule_tolerance} days` : undefined)}
        </div>

        {renderArrayField('Key Dates & Milestones', charter.key_dates_milestones)}
        {renderArrayField('Critical Deadlines', charter.critical_deadlines)}
        {renderArrayField('Threats & Opportunities', charter.threats_opportunities)}
        {renderArrayField('Assumptions', charter.assumptions)}
        {renderArrayField('Constraints', charter.constraints)}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Quality & Compliance</h3>
          {(charter.quality_standards && charter.quality_standards.length > 0) && (
            <div>
              <h4>Quality Standards</h4>
              <ul className={styles.scopeList}>
                {charter.quality_standards.map((standard, index) => (
                  <li key={index}>{standard}</li>
                ))}
              </ul>
            </div>
          )}
          {renderSimpleField('Acceptance Criteria', charter.acceptance_criteria)}
        </div>

        {renderArrayField('Compliance Requirements', charter.compliance_requirements)}
        {renderArrayField('Reporting Requirements', charter.reporting_requirements)}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Approval Information</h3>
          {renderSimpleField('Approval Level', charter.approval_level)}
          {renderSimpleField('Submitted Date', formatDate(charter.submitted_date))}
          {renderSimpleField('Approved Date', formatDate(charter.approved_date))}
          {renderSimpleField('Approved By', charter.approved_by)}
          {renderSimpleField('Approval Comments', charter.approval_comments)}
        </div>
      </div>
    </div>
  );
}

export function ProjectDocumentPane({
  document,
  documentType,
  projectName,
  isLoading,
  isEditing = false,
  onToggleEdit,
  onSave,
  onCancel,
  isSaving = false,
  editorValue,
  onEditorChange,
  onAIEdit
}: Props) {

  if (isLoading) {
    return (
      <section className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading document...</p>
        </div>
      </section>
    );
  }

  if (!document || !documentType) {
    return (
      <section className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Select a Project Document</h2>
          <p>Choose a project and document type from the header to view its content.</p>
        </div>
      </section>
    );
  }

  const getDocumentTitle = () => {
    if (documentType === 'business-case') {
      return (document as BusinessCase).title || 'Business Case';
    }
    if (documentType === 'project-charter') {
      return (document as ProjectCharter).title || 'Project Charter';
    }
    return 'Project Document';
  };

  const getDocumentVersion = () => {
    return document.version || '1.0';
  };

  return (
    <section className={styles.container}>
      <header className={styles.sectionHeader}>
        <div>
          <h2>{getDocumentTitle()}</h2>
          <p className={styles.subtle}>Version {getDocumentVersion()}</p>
          {projectName && <p className={styles.projectName}>{projectName}</p>}
        </div>
        <div className={styles.actions}>
          {onAIEdit && !isEditing && (
            <button
              type="button"
              className={styles.aiEditButton}
              onClick={onAIEdit}
              title="Edit with AI - Get suggestions based on your project SOP"
            >
              ✨ Edit with AI
            </button>
          )}
          {onToggleEdit && (
            <label className={styles.toggleLabel}>
              <input type="checkbox" checked={isEditing} onChange={onToggleEdit} />
              <span>Edit mode</span>
            </label>
          )}
          {isEditing && onSave && onCancel && (
            <div className={styles.editActions}>
              <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className={styles.primaryButton} onClick={onSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className={styles.contentArea}>
        {isEditing ? (
          <div className={styles.editMode}>
            {documentType === 'business-case' && onEditorChange ? (
              <BusinessCaseEditForm
                businessCase={editorValue || document as BusinessCase}
                onChange={onEditorChange}
              />
            ) : documentType === 'project-charter' && onEditorChange ? (
              <ProjectCharterEditForm
                charter={editorValue || document as ProjectCharter}
                onChange={onEditorChange}
              />
            ) : null}
          </div>
        ) : (
          <div className={styles.viewMode}>
            {documentType === 'business-case' ? (
              <BusinessCaseContent businessCase={document as BusinessCase} />
            ) : documentType === 'project-charter' ? (
              <ProjectCharterContent charter={document as ProjectCharter} />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}