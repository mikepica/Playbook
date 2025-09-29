'use client';

import { BusinessCase } from '@/types';
import { TextField, TextAreaField, NumberField, DateField, SelectField, StringArrayEditor, ArrayFieldEditor } from './FieldEditors';
import styles from './BusinessCaseEditForm.module.css';

interface Props {
  businessCase: BusinessCase;
  onChange: (updated: Partial<BusinessCase>) => void;
}

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const BUSINESS_DRIVER_OPTIONS = [
  { value: 'strategic', label: 'Strategic' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'operational', label: 'Operational' },
  { value: 'financial', label: 'Financial' }
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

export function BusinessCaseEditForm({ businessCase, onChange }: Props) {
  const updateField = <K extends keyof BusinessCase>(field: K, value: BusinessCase[K]) => {
    onChange({ [field]: value });
  };

  return (
    <div className={styles.form}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Basic Information</h3>

        <TextField
          label="Title"
          value={businessCase.title || ''}
          onChange={(value) => updateField('title', value)}
          placeholder="Enter business case title"
          required
        />

        <div className={styles.row}>
          <TextField
            label="Business Area"
            value={businessCase.business_area || ''}
            onChange={(value) => updateField('business_area', value)}
            placeholder="e.g., Information Technology"
          />

          <TextField
            label="Sponsor"
            value={businessCase.sponsor || ''}
            onChange={(value) => updateField('sponsor', value)}
            placeholder="e.g., Sarah Johnson, CTO"
          />
        </div>

        <TextAreaField
          label="Strategic Alignment"
          value={businessCase.strategic_alignment || ''}
          onChange={(value) => updateField('strategic_alignment', value)}
          placeholder="Describe how this aligns with company strategy"
          rows={3}
        />

        <div className={styles.row}>
          <SelectField
            label="Business Driver"
            value={businessCase.business_driver || ''}
            onChange={(value) => updateField('business_driver', value)}
            options={BUSINESS_DRIVER_OPTIONS}
          />

          <SelectField
            label="Urgency"
            value={businessCase.urgency || ''}
            onChange={(value) => updateField('urgency', value)}
            options={URGENCY_OPTIONS}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Timeline & Duration</h3>

        <div className={styles.row}>
          <DateField
            label="Proposed Start Date"
            value={businessCase.proposed_start_date || ''}
            onChange={(value) => updateField('proposed_start_date', value)}
          />

          <DateField
            label="Proposed End Date"
            value={businessCase.proposed_end_date || ''}
            onChange={(value) => updateField('proposed_end_date', value)}
          />
        </div>

        <NumberField
          label="Estimated Duration (Months)"
          value={businessCase.estimated_duration_months}
          onChange={(value) => updateField('estimated_duration_months', value)}
          min={1}
          max={120}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Project Description</h3>

        <TextAreaField
          label="Project Description"
          value={businessCase.project_description || ''}
          onChange={(value) => updateField('project_description', value)}
          placeholder="Describe what the project will accomplish"
          rows={4}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Scope</h3>

        <StringArrayEditor
          label="Scope Inclusions"
          values={businessCase.scope_in || []}
          onChange={(values) => updateField('scope_in', values)}
          placeholder="What is included in this project?"
        />

        <StringArrayEditor
          label="Scope Exclusions"
          values={businessCase.scope_out || []}
          onChange={(values) => updateField('scope_out', values)}
          placeholder="What is explicitly excluded?"
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Financial Information</h3>

        <div className={styles.row}>
          <NumberField
            label="ROI Percentage"
            value={businessCase.roi_percentage}
            onChange={(value) => updateField('roi_percentage', value)}
            min={0}
            step={0.1}
          />

          <NumberField
            label="NPV Value"
            value={businessCase.npv_value}
            onChange={(value) => updateField('npv_value', value)}
            step={1000}
          />
        </div>

        <NumberField
          label="Payback Period (Months)"
          value={businessCase.payback_period_months}
          onChange={(value) => updateField('payback_period_months', value)}
          min={1}
          max={120}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Objectives</h3>

        <ArrayFieldEditor
          label="Objectives"
          values={businessCase.objectives || []}
          onChange={(values) => updateField('objectives', values)}
          fields={[
            { key: 'objective', label: 'Objective', type: 'text' },
            { key: 'measurable_outcome', label: 'Measurable Outcome', type: 'text' },
            { key: 'timeline', label: 'Timeline', type: 'text' }
          ]}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Deliverables</h3>

        <ArrayFieldEditor
          label="Deliverables"
          values={businessCase.deliverables || []}
          onChange={(values) => updateField('deliverables', values)}
          fields={[
            { key: 'deliverable', label: 'Deliverable', type: 'text' },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'success_criteria', label: 'Success Criteria', type: 'text' }
          ]}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Risks & Opportunities</h3>

        <ArrayFieldEditor
          label="Risks"
          values={businessCase.risks || []}
          onChange={(values) => updateField('risks', values)}
          fields={[
            { key: 'risk', label: 'Risk', type: 'text' },
            { key: 'impact', label: 'Impact', type: 'text' },
            { key: 'mitigation', label: 'Mitigation', type: 'text' }
          ]}
        />

        <ArrayFieldEditor
          label="Opportunities"
          values={businessCase.opportunities || []}
          onChange={(values) => updateField('opportunities', values)}
          fields={[
            { key: 'opportunity', label: 'Opportunity', type: 'text' },
            { key: 'benefit', label: 'Benefit', type: 'text' },
            { key: 'likelihood', label: 'Likelihood', type: 'text' }
          ]}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Background Information</h3>

        <ArrayFieldEditor
          label="Background"
          values={businessCase.background || []}
          onChange={(values) => updateField('background', values)}
          fields={[
            { key: 'point', label: 'Point', type: 'text' },
            { key: 'detail', label: 'Detail', type: 'text' }
          ]}
        />

        <ArrayFieldEditor
          label="Key Assumptions"
          values={businessCase.key_assumptions || []}
          onChange={(values) => updateField('key_assumptions', values)}
          fields={[
            { key: 'assumption', label: 'Assumption', type: 'text' },
            { key: 'rationale', label: 'Rationale', type: 'text' }
          ]}
        />

        <ArrayFieldEditor
          label="Constraints"
          values={businessCase.constraints || []}
          onChange={(values) => updateField('constraints', values)}
          fields={[
            { key: 'constraint', label: 'Constraint', type: 'text' },
            { key: 'impact', label: 'Impact', type: 'text' }
          ]}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Approval Status</h3>

        <SelectField
          label="Status"
          value={businessCase.status || ''}
          onChange={(value) => updateField('status', value)}
          options={STATUS_OPTIONS}
        />
      </div>
    </div>
  );
}