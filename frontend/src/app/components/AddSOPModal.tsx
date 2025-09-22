'use client';

import { useState } from 'react';
import styles from './AddSOPModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<void>;
  isSaving: boolean;
}

export function AddSOPModal({ isOpen, onClose, onSave, isSaving }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    await onSave(title.trim(), content);
    setTitle('');
    setContent('');
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Create New SOP</h2>
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
            <label htmlFor="sop-title" className={styles.label}>
              Title
            </label>
            <input
              id="sop-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              placeholder="Enter SOP title"
              required
              disabled={isSaving}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="sop-content" className={styles.label}>
              Initial Content (Markdown)
            </label>
            <textarea
              id="sop-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.textarea}
              placeholder="Enter initial markdown content (optional)"
              rows={8}
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
              disabled={!title.trim() || isSaving}
            >
              {isSaving ? 'Creating...' : 'Create SOP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}