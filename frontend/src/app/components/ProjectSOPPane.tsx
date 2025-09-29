'use client';

import { useMemo } from 'react';

import { ProjectSOP } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import styles from './SOPPane.module.css';

interface Props {
  projectSOP: ProjectSOP | null;
  isEditing: boolean;
  onToggleEdit: () => void;
  editorValue: string;
  onEditorChange: (value: string) => void;
  titleValue: string;
  onTitleChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function ProjectSOPPane({
  projectSOP,
  isEditing,
  onToggleEdit,
  editorValue,
  onEditorChange,
  titleValue,
  onTitleChange,
  onSave,
  onCancel,
  isSaving
}: Props) {
  const markdown = useMemo(() => {
    if (!projectSOP) {
      return '';
    }
    if (typeof projectSOP.content?.markdown === 'string') {
      return projectSOP.content.markdown;
    }
    if (typeof projectSOP.content === 'string') {
      return projectSOP.content;
    }
    return '';
  }, [projectSOP]);

  if (!projectSOP) {
    return (
      <section className={styles.emptyState}>
        <h2>Select a Document Type</h2>
        <p>Choose a document type from the dropdown to view and edit its template content.</p>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <header className={styles.sectionHeader}>
        <div>
          {isEditing ? (
            <input
              type="text"
              className={styles.titleInput}
              value={titleValue}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Document Type Title"
            />
          ) : (
            <h2>{projectSOP.title}</h2>
          )}
          <div className={styles.metadata}>
            <p className={styles.subtle}>Version {projectSOP.version}</p>
            <p className={styles.documentType}>Document Type: {projectSOP.document_type}</p>
          </div>
        </div>
        <div className={styles.actions}>
          <label className={styles.toggleLabel}>
            <input type="checkbox" checked={isEditing} onChange={onToggleEdit} />
            <span>Edit mode</span>
          </label>
          {isEditing && (
            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={onSave}
                disabled={isSaving}
              >
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
            placeholder="Enter the document type template content in Markdown format..."
          />
        ) : (
          <article className={styles.markdown}>
            <MarkdownRenderer>{markdown || 'No content yet.'}</MarkdownRenderer>
          </article>
        )}
      </div>
    </section>
  );
}