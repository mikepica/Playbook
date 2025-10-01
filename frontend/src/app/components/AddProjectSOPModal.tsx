'use client';

import { useState } from 'react';
import styles from './AddProjectSOPModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    documentType: string;
    title: string;
    content: string;
    displayOrder: number;
  }) => void;
  isSaving: boolean;
}

export function AddProjectSOPModal({ isOpen, onClose, onSave, isSaving }: Props) {
  const [documentType, setDocumentType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentType.trim() || !title.trim()) return;

    onSave({
      documentType: documentType.trim().toLowerCase().replace(/\s+/g, '_'),
      title: title.trim(),
      content: content.trim(),
      displayOrder
    });
  };

  const handleClose = () => {
    if (isSaving) return;
    setDocumentType('');
    setTitle('');
    setContent('');
    setDisplayOrder(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>Add New Document Type</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isSaving}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="documentType">Document Type Identifier</label>
            <input
              id="documentType"
              type="text"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="e.g., risk_register, status_report"
              required
              disabled={isSaving}
            />
            <small>Will be converted to lowercase with underscores (e.g., &ldquo;Risk Register&rdquo; → &ldquo;risk_register&rdquo;)</small>
          </div>

          <div className={styles.field}>
            <label htmlFor="title">Display Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Risk Register, Status Report"
              required
              disabled={isSaving}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="displayOrder">Display Order</label>
            <input
              id="displayOrder"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              min="0"
              disabled={isSaving}
            />
            <small>Lower numbers appear first in the dropdown</small>
          </div>

          <div className={styles.field}>
            <label htmlFor="content">Template Content (Markdown)</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"# Document Type Template\n\n## Purpose\nThis document type is used for...\n\n## Key Sections\n- Section 1\n- Section 2\n\n## Usage\nInstructions for using this document type..."}
              rows={8}
              disabled={isSaving}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSaving || !documentType.trim() || !title.trim()}
            >
              {isSaving ? 'Creating...' : 'Create Document Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}