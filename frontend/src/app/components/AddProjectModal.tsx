'use client';

import { useState } from 'react';
import { DocumentType } from '@/types';
import styles from './AddProjectModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    projectName: string;
    documentType: DocumentType;
    projectCode?: string;
    businessArea?: string;
    sponsor?: string;
  }) => Promise<void>;
  isSaving: boolean;
}

export function AddProjectModal({ isOpen, onClose, onSave, isSaving }: Props) {
  const [projectName, setProjectName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('business-case');
  const [projectCode, setProjectCode] = useState('');
  const [businessArea, setBusinessArea] = useState('');
  const [sponsor, setSponsor] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectName.trim()) return;

    await onSave({
      projectName: projectName.trim(),
      documentType,
      projectCode: projectCode.trim() || undefined,
      businessArea: businessArea.trim() || undefined,
      sponsor: sponsor.trim() || undefined,
    });

    // Reset form on successful save
    setProjectName('');
    setDocumentType('business-case');
    setProjectCode('');
    setBusinessArea('');
    setSponsor('');
  };

  const handleCancel = () => {
    setProjectName('');
    setDocumentType('business-case');
    setProjectCode('');
    setBusinessArea('');
    setSponsor('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Create New Project</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleCancel}
            disabled={isSaving}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="project-name" className={styles.label}>
              Project Name <span className={styles.required}>*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={styles.input}
              placeholder="Enter project name"
              required
              disabled={isSaving}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="document-type" className={styles.label}>
              Initial Document Type <span className={styles.required}>*</span>
            </label>
            <select
              id="document-type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className={styles.select}
              disabled={isSaving}
            >
              <option value="business-case">Business Case</option>
              <option value="project-charter">Project Charter</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="project-code" className={styles.label}>
              Project Code
            </label>
            <input
              id="project-code"
              type="text"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              className={styles.input}
              placeholder="e.g., PRJ-2024-001"
              disabled={isSaving}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="business-area" className={styles.label}>
              Business Area
            </label>
            <input
              id="business-area"
              type="text"
              value={businessArea}
              onChange={(e) => setBusinessArea(e.target.value)}
              className={styles.input}
              placeholder="Department or function"
              disabled={isSaving}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="sponsor" className={styles.label}>
              Sponsor
            </label>
            <input
              id="sponsor"
              type="text"
              value={sponsor}
              onChange={(e) => setSponsor(e.target.value)}
              className={styles.input}
              placeholder="Primary sponsor name"
              disabled={isSaving}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!projectName.trim() || isSaving}
            >
              {isSaving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}