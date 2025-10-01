'use client';

import { useState, useCallback } from 'react';
import { AIEditSuggestionResponse, DocumentType } from '@/types';
import { generateAIEditSuggestions, applyAIEditSuggestions } from '@/lib/api';
import { AIEditDiffViewer } from './AIEditDiffViewer';
import styles from './AIEditModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  projectId: string;
  documentId: string;
  onSave?: (updatedDocument: any) => void;
}

export function AIEditModal({
  isOpen,
  onClose,
  documentType,
  projectId,
  documentId,
  onSave
}: Props) {
  const [userInstructions, setUserInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AIEditSuggestionResponse | null>(null);
  const [acceptedFields, setAcceptedFields] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  const handleClose = useCallback(() => {
    if (isGenerating || isApplying) return; // Prevent closing during operations

    // Reset state
    setUserInstructions('');
    setError(null);
    setSuggestions(null);
    setAcceptedFields(new Set());
    setEditedValues({});
    onClose();
  }, [isGenerating, isApplying, onClose]);

  const generateSuggestions = useCallback(async () => {
    if (!userInstructions.trim()) {
      setError('Please enter instructions for what changes you want to make.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateAIEditSuggestions({
        document_type: documentType,
        project_id: projectId,
        document_id: documentId,
        user_instructions: userInstructions.trim()
      });

      setSuggestions(response);
      // Pre-select all fields for user convenience
      setAcceptedFields(new Set(Object.keys(response.suggestions)));
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate AI suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [userInstructions, documentType, projectId, documentId]);

  const handleToggleField = useCallback((fieldName: string) => {
    setAcceptedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  }, []);

  const handleAcceptAll = useCallback(() => {
    if (!suggestions) return;
    setAcceptedFields(new Set(Object.keys(suggestions.suggestions)));
  }, [suggestions]);

  const handleRejectAll = useCallback(() => {
    setAcceptedFields(new Set());
  }, []);

  const handleFieldEdit = useCallback((fieldName: string, newValue: any) => {
    setEditedValues(prev => ({ ...prev, [fieldName]: newValue }));
  }, []);

  const applySuggestions = useCallback(async () => {
    if (!suggestions || acceptedFields.size === 0) {
      setError('Please select at least one change to apply.');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      // Build the accepted changes object
      const acceptedChanges: Record<string, any> = {};

      acceptedFields.forEach(fieldName => {
        const suggestion = suggestions.suggestions[fieldName];
        if (suggestion) {
          // Use edited value if available, otherwise use the original suggestion
          const valueToUse = editedValues[fieldName] !== undefined
            ? editedValues[fieldName]
            : suggestion.suggested_value;
          acceptedChanges[fieldName] = valueToUse;
        }
      });

      const response = await applyAIEditSuggestions({
        document_type: documentType,
        project_id: projectId,
        document_id: documentId,
        accepted_changes: acceptedChanges
      });

      if (response.success) {
        onSave?.(response.updated_document);
        handleClose();
      } else {
        setError(response.message || 'Failed to apply changes.');
      }
    } catch (err) {
      console.error('Failed to apply suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply changes. Please try again.');
    } finally {
      setIsApplying(false);
    }
  }, [suggestions, acceptedFields, editedValues, documentType, projectId, documentId, onSave, handleClose]);

  if (!isOpen) return null;

  const canGenerate = userInstructions.trim().length > 0 && !isGenerating;
  const canApply = acceptedFields.size > 0 && !isApplying && suggestions;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>✨ Edit with AI</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isGenerating || isApplying}
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.content}>
            {/* Instructions Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Describe your changes</div>
              <textarea
                className={styles.instructionInput}
                placeholder="Example: Update the project timeline to reflect a 6-month delivery schedule, add risk mitigation strategies for technical challenges, and ensure all stakeholder roles are clearly defined according to our governance framework..."
                value={userInstructions}
                onChange={(e) => setUserInstructions(e.target.value)}
                disabled={isGenerating || isApplying}
              />

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  The AI will analyze your request against the project SOP and suggest specific field updates.
                </div>
                <button
                  className={styles.generateButton}
                  onClick={generateSuggestions}
                  disabled={!canGenerate || isApplying}
                >
                  {isGenerating ? (
                    <>
                      <span className={styles.loadingSpinner} />
                      Generating...
                    </>
                  ) : (
                    <>
                      🎯 Generate Suggestions
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}
            </div>

            {/* AI Analysis & Suggestions Section */}
            {suggestions && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>AI Suggestions</div>

                {suggestions.overall_reasoning && (
                  <div className={styles.overallReasoning}>
                    <div className={styles.reasoningTitle}>AI Analysis:</div>
                    <p className={styles.reasoningText}>{suggestions.overall_reasoning}</p>
                  </div>
                )}

                <AIEditDiffViewer
                  suggestions={suggestions.suggestions}
                  acceptedFields={acceptedFields}
                  onToggleField={handleToggleField}
                  onAcceptAll={handleAcceptAll}
                  onRejectAll={handleRejectAll}
                  onFieldEdit={handleFieldEdit}
                />
              </div>
            )}

            {/* Applying State */}
            {isApplying && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                padding: '2rem',
                background: '#f9fafb',
                borderRadius: '0.75rem',
                marginTop: '1rem'
              }}>
                <span className={styles.loadingSpinner} style={{ width: '2rem', height: '2rem' }} />
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Applying {acceptedFields.size} changes to your document...
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.selectionCount}>
            {suggestions
              ? `${acceptedFields.size} of ${Object.keys(suggestions.suggestions).length} changes selected`
              : 'Enter instructions above to get started'}
          </div>

          <div className={styles.footerButtons}>
            <button
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={isGenerating || isApplying}
            >
              Cancel
            </button>
            {suggestions && (
              <button
                className={styles.applyButton}
                onClick={applySuggestions}
                disabled={!canApply}
              >
                {isApplying ? (
                  <>
                    <span className={styles.loadingSpinner} />
                    Applying...
                  </>
                ) : (
                  <>
                    ✓ Apply {acceptedFields.size} Changes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}