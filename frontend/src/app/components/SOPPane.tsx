'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { SOP } from '@/types';
import styles from './SOPPane.module.css';

interface Props {
  sop: SOP | null;
  isEditing: boolean;
  onToggleEdit: () => void;
  editorValue: string;
  onEditorChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function SOPPane({ sop, isEditing, onToggleEdit, editorValue, onEditorChange, onSave, onCancel, isSaving }: Props) {
  const markdown = useMemo(() => {
    if (!sop) {
      return '';
    }
    if (typeof sop.content?.markdown === 'string') {
      return sop.content.markdown;
    }
    if (typeof sop.content === 'string') {
      return sop.content;
    }
    return '';
  }, [sop]);

  if (!sop) {
    return (
      <section className={styles.emptyState}>
        <h2>Select a SOP</h2>
        <p>Choose a playbook from the header to view and edit its content.</p>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <header className={styles.sectionHeader}>
        <div>
          <h2>{sop.title}</h2>
          <p className={styles.subtle}>Version {sop.version}</p>
        </div>
        <div className={styles.actions}>
          <label className={styles.toggleLabel}>
            <input type="checkbox" checked={isEditing} onChange={onToggleEdit} />
            <span>Edit mode</span>
          </label>
          {isEditing && (
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
          <textarea
            className={styles.textarea}
            value={editorValue}
            onChange={(event) => onEditorChange(event.target.value)}
            spellCheck
          />
        ) : (
          <article className={styles.markdown}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown || 'No content yet.'}</ReactMarkdown>
          </article>
        )}
      </div>
    </section>
  );
}
