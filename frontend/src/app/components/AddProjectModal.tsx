'use client';

import { useState } from 'react';
import { ProjectSummary, ProjectDocumentModalData } from '@/types';
import styles from './AddProjectModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectDocumentModalData) => Promise<void>;
  isSaving: boolean;
  projects: ProjectSummary[];
}

export function AddProjectModal({ isOpen, onClose, onSave, isSaving, projects }: Props) {
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [businessArea, setBusinessArea] = useState('');
  const [sponsor, setSponsor] = useState('');


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validation
    if (!projectName.trim()) return;

    await onSave({
      mode: 'new',
      projectName: projectName.trim(),
      documentType: 'none', // New projects don't specify document type
      projectCode: projectCode.trim() || undefined,
      businessArea: businessArea.trim() || undefined,
      sponsor: sponsor.trim() || undefined,
    });

    // Reset form on successful save
    resetForm();
  };

  const resetForm = () => {
    setProjectName('');
    setProjectCode('');
    setBusinessArea('');
    setSponsor('');
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const canSubmit = projectName.trim();

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
              disabled={!canSubmit || isSaving}
            >
              {isSaving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}