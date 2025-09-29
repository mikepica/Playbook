'use client';

import { ProjectCharter } from '@/types';
import { TextField, TextAreaField, NumberField, DateField, SelectField, StringArrayEditor, ArrayFieldEditor } from './FieldEditors';
import styles from './BusinessCaseEditForm.module.css'; // Reuse the same styles

interface Props {
  charter: ProjectCharter;
  onChange: (updated: Partial<ProjectCharter>) => void;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

const APPROVAL_LEVEL_OPTIONS = [
  { value: 'board', label: 'Board Level' },
  { value: 'executive', label: 'Executive Level' },
  { value: 'senior_management', label: 'Senior Management' },
  { value: 'department', label: 'Department Level' }
];

export function ProjectCharterEditForm({ charter, onChange }: Props) {
  const updateField = <K extends keyof ProjectCharter>(field: K, value: ProjectCharter[K]) => {
    onChange({ [field]: value });
  };

  return (
    <div className={styles.form}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Charter Information</h3>

        <TextField
          label="Title"
          value={charter.title || ''}
          onChange={(value) => updateField('title', value)}
          placeholder="Enter project charter title"
          required
        />

        <div className={styles.row}>
          <DateField
            label="Charter Date"
            value={charter.charter_date || ''}
            onChange={(value) => updateField('charter_date', value)}
          />

          <DateField
            label="Sign-off Date"
            value={charter.sign_off_date || ''}
            onChange={(value) => updateField('sign_off_date', value)}
          />
        </div>

        <div className={styles.row}>
          <DateField
            label="Effective Date"
            value={charter.effective_date || ''}
            onChange={(value) => updateField('effective_date', value)}
          />

          <DateField
            label="Review Date"
            value={charter.review_date || ''}
            onChange={(value) => updateField('review_date', value)}
          />
        </div>

        <DateField
          label="Expiry Date"
          value={charter.expiry_date || ''}
          onChange={(value) => updateField('expiry_date', value)}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Project Leadership</h3>

        <TextField
          label="Sponsor"
          value={charter.sponsor || ''}
          onChange={(value) => updateField('sponsor', value)}
          placeholder="e.g., Sarah Johnson, CTO"
          required
        />

        <TextField
          label="Project Manager"
          value={charter.project_manager || ''}
          onChange={(value) => updateField('project_manager', value)}
          placeholder="e.g., Mike Chen, Senior PM"
        />

        <TextAreaField
          label="Governance Structure"
          value={charter.governance_structure || ''}
          onChange={(value) => updateField('governance_structure', value)}
          placeholder="Describe the governance and decision-making structure"
          rows={3}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Project Team & Stakeholders</h3>

        <ArrayFieldEditor
          label="Steering Committee"
          values={charter.steering_committee || []}
          onChange={(values) => updateField('steering_committee', values)}
          fields={[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'role', label: 'Role', type: 'text' },
            { key: 'authority', label: 'Authority', type: 'text' }
          ]}
        />

        <ArrayFieldEditor
          label="Project Team"
          values={charter.project_team || []}
          onChange={(values) => updateField('project_team', values)}
          fields={[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'role', label: 'Role', type: 'text' },
            { key: 'responsibilities', label: 'Responsibilities', type: 'text' }
          ]}
        />

        <ArrayFieldEditor
          label="Key Stakeholders"
          values={charter.key_stakeholders || []}
          onChange={(values) => updateField('key_stakeholders', values)}
          fields={[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'organization', label: 'Organization', type: 'text' },
            { key: 'interest', label: 'Interest/Involvement', type: 'text' }
          ]}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Project Objectives & Scope</h3>

        <TextAreaField
          label="Project Objectives"
          value={charter.project_objectives || ''}
          onChange={(value) => updateField('project_objectives', value)}
          placeholder="Describe the main objectives of this project"
          rows={4}
        />

        <TextAreaField
          label="Business Case Summary"
          value={charter.business_case_summary || ''}
          onChange={(value) => updateField('business_case_summary', value)}
          placeholder="Summary of the business case"
          rows={3}
        />

        <ArrayFieldEditor
          label="Scope & Deliverables"
          values={charter.scope_deliverables || []}
          onChange={(values) => updateField('scope_deliverables', values)}
          fields={[
            { key: 'deliverable', label: 'Deliverable', type: 'text' },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'acceptance_criteria', label: 'Acceptance Criteria', type: 'text' }
          ]}
        />

        <StringArrayEditor
          label="Scope Exclusions"
          values={charter.scope_exclusions || []}
          onChange={(values) => updateField('scope_exclusions', values)}
          placeholder="What is explicitly excluded from this project?"
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Budget & Resources</h3>

        <div className={styles.row}>
          <NumberField
            label="Budget Authority"
            value={charter.budget_authority}
            onChange={(value) => updateField('budget_authority', value)}
            min={0}
            step={1000}
          />

          <NumberField
            label="Budget Tolerance"
            value={charter.budget_tolerance}
            onChange={(value) => updateField('budget_tolerance', value)}
            min={0}
            step={1000}
          />
        </div>

        <NumberField
          label="Schedule Tolerance (Days)"
          value={charter.schedule_tolerance}
          onChange={(value) => updateField('schedule_tolerance', value)}
          min={0}
          max={365}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Timeline & Milestones</h3>

        <ArrayFieldEditor
          label="Key Dates & Milestones"
          values={charter.key_dates_milestones || []}
          onChange={(values) => updateField('key_dates_milestones', values)}
          fields={[
            { key: 'milestone', label: 'Milestone', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'description', label: 'Description', type: 'text' }
          ]}
        />

        <ArrayFieldEditor
          label="Critical Deadlines"
          values={charter.critical_deadlines || []}
          onChange={(values) => updateField('critical_deadlines', values)}
          fields={[
            { key: 'deadline', label: 'Deadline', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'impact', label: 'Impact if Missed', type: 'text' }
          ]}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Risks & Assumptions</h3>

        <ArrayFieldEditor
          label="Threats & Opportunities"
          values={charter.threats_opportunities || []}
          onChange={(values) => updateField('threats_opportunities', values)}
          fields={[
            { key: 'item', label: 'Threat/Opportunity', type: 'text' },
            { key: 'type', label: 'Type', type: 'text' },
            { key: 'impact', label: 'Impact', type: 'text' },
            { key: 'response', label: 'Response Strategy', type: 'text' }
          ]}
        />

        <ArrayFieldEditor
          label="Assumptions"
          values={charter.assumptions || []}
          onChange={(values) => updateField('assumptions', values)}
          fields={[
            { key: 'assumption', label: 'Assumption', type: 'text' },
            { key: 'rationale', label: 'Rationale', type: 'text' }
          ]}
        />

        <ArrayFieldEditor
          label="Constraints"
          values={charter.constraints || []}
          onChange={(values) => updateField('constraints', values)}
          fields={[
            { key: 'constraint', label: 'Constraint', type: 'text' },
            { key: 'impact', label: 'Impact', type: 'text' }
          ]}
        />

        <TextField
          label="Risk Tolerance"
          value={charter.risk_tolerance || ''}
          onChange={(value) => updateField('risk_tolerance', value)}
          placeholder="Describe the project's risk tolerance level"
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Quality & Compliance</h3>

        <StringArrayEditor
          label="Quality Standards"
          values={charter.quality_standards || []}
          onChange={(values) => updateField('quality_standards', values)}
          placeholder="Quality standards that must be met"
        />

        <ArrayFieldEditor
          label="Compliance Requirements"
          values={charter.compliance_requirements || []}
          onChange={(values) => updateField('compliance_requirements', values)}
          fields={[
            { key: 'requirement', label: 'Requirement', type: 'text' },
            { key: 'standard', label: 'Standard/Regulation', type: 'text' },
            { key: 'compliance_method', label: 'Compliance Method', type: 'text' }
          ]}
        />

        <TextAreaField
          label="Acceptance Criteria"
          value={charter.acceptance_criteria || ''}
          onChange={(value) => updateField('acceptance_criteria', value)}
          placeholder="Overall project acceptance criteria"
          rows={3}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Reporting & Communication</h3>

        <ArrayFieldEditor
          label="Reporting Requirements"
          values={charter.reporting_requirements || []}
          onChange={(values) => updateField('reporting_requirements', values)}
          fields={[
            { key: 'report', label: 'Report Type', type: 'text' },
            { key: 'frequency', label: 'Frequency', type: 'text' },
            { key: 'audience', label: 'Audience', type: 'text' }
          ]}
        />

        <TextField
          label="Change Control Process"
          value={charter.change_control_process || ''}
          onChange={(value) => updateField('change_control_process', value)}
          placeholder="Describe the change control process"
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Approval Information</h3>

        <div className={styles.row}>
          <SelectField
            label="Status"
            value={charter.status || ''}
            onChange={(value) => updateField('status', value)}
            options={STATUS_OPTIONS}
          />

          <SelectField
            label="Approval Level"
            value={charter.approval_level || ''}
            onChange={(value) => updateField('approval_level', value)}
            options={APPROVAL_LEVEL_OPTIONS}
          />
        </div>

        <div className={styles.row}>
          <DateField
            label="Submitted Date"
            value={charter.submitted_date || ''}
            onChange={(value) => updateField('submitted_date', value)}
          />

          <DateField
            label="Approved Date"
            value={charter.approved_date || ''}
            onChange={(value) => updateField('approved_date', value)}
          />
        </div>

        <TextField
          label="Approved By"
          value={charter.approved_by || ''}
          onChange={(value) => updateField('approved_by', value)}
          placeholder="Who approved this charter?"
        />

        <TextAreaField
          label="Approval Comments"
          value={charter.approval_comments || ''}
          onChange={(value) => updateField('approval_comments', value)}
          placeholder="Any comments from the approval process"
          rows={2}
        />
      </div>
    </div>
  );
}