'use client';

import { useState, useCallback } from 'react';
import { FieldSuggestion } from '@/types';
import styles from './AIEditDiffViewer.module.css';

interface Props {
  suggestions: Record<string, FieldSuggestion>;
  acceptedFields: Set<string>;
  onToggleField: (fieldName: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onFieldEdit: (fieldName: string, newValue: any) => void;
}

function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
}

function renderValue(value: any, isEditable: boolean = false, onEdit?: (newValue: any) => void): JSX.Element {
  if (value === null || value === undefined || value === '') {
    return (
      <div className={`${styles.valueContent} ${styles.empty}`}>
        {isEditable ? (
          <textarea
            className={styles.editableValue}
            placeholder="No value"
            onChange={(e) => onEdit?.(e.target.value)}
            rows={2}
          />
        ) : (
          'No value'
        )}
      </div>
    );
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className={`${styles.valueContent} ${styles.empty}`}>
          {isEditable ? (
            <textarea
              className={styles.editableValue}
              placeholder="Empty array"
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(`[${e.target.value}]`);
                  onEdit?.(parsed);
                } catch {
                  // If parsing fails, treat as comma-separated strings
                  const items = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                  onEdit?.(items);
                }
              }}
              rows={3}
            />
          ) : (
            'Empty array'
          )}
        </div>
      );
    }

    return (
      <div className={styles.arrayValue}>
        {isEditable ? (
          <textarea
            className={styles.editableValue}
            defaultValue={value.map(item =>
              typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)
            ).join('\n')}
            onChange={(e) => {
              const lines = e.target.value.split('\n').filter(line => line.trim());
              const items = lines.map(line => {
                try {
                  return JSON.parse(line);
                } catch {
                  return line.trim();
                }
              });
              onEdit?.(items);
            }}
            rows={Math.min(value.length + 1, 8)}
          />
        ) : (
          value.map((item, index) => (
            <div key={index} className={styles.arrayItem}>
              {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
            </div>
          ))
        )}
      </div>
    );
  }

  // Handle objects
  if (typeof value === 'object') {
    const jsonString = JSON.stringify(value, null, 2);
    return (
      <div className={styles.valueContent}>
        {isEditable ? (
          <textarea
            className={styles.editableValue}
            defaultValue={jsonString}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onEdit?.(parsed);
              } catch {
                // Invalid JSON, keep as string for now
                onEdit?.(e.target.value);
              }
            }}
            rows={Math.min(jsonString.split('\n').length, 10)}
          />
        ) : (
          jsonString
        )}
      </div>
    );
  }

  // Handle primitive values
  const stringValue = String(value);
  const isMultiline = stringValue.includes('\n') || stringValue.length > 100;

  return (
    <div className={styles.valueContent}>
      {isEditable ? (
        isMultiline ? (
          <textarea
            className={styles.editableValue}
            defaultValue={stringValue}
            onChange={(e) => onEdit?.(e.target.value)}
            rows={Math.min(stringValue.split('\n').length + 1, 8)}
          />
        ) : (
          <input
            type="text"
            className={styles.editableValue}
            defaultValue={stringValue}
            onChange={(e) => onEdit?.(e.target.value)}
          />
        )
      ) : (
        stringValue
      )}
    </div>
  );
}

export function AIEditDiffViewer({
  suggestions,
  acceptedFields,
  onToggleField,
  onAcceptAll,
  onRejectAll,
  onFieldEdit
}: Props) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  const suggestionEntries = Object.entries(suggestions);
  const acceptedCount = acceptedFields.size;

  const toggleFieldExpanded = useCallback((fieldName: string) => {
    setExpandedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  }, []);

  const handleFieldEdit = useCallback((fieldName: string, newValue: any) => {
    setEditedValues(prev => ({ ...prev, [fieldName]: newValue }));
    onFieldEdit(fieldName, newValue);
  }, [onFieldEdit]);

  if (suggestionEntries.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noChanges}>
          No changes suggested. The document appears to already align with the SOP requirements.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.changesCount}>
          {acceptedCount} of {suggestionEntries.length} changes accepted
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.acceptAllButton}
            onClick={onAcceptAll}
          >
            Accept All
          </button>
          <button
            type="button"
            className={styles.rejectAllButton}
            onClick={onRejectAll}
          >
            Reject All
          </button>
        </div>
      </div>

      <div className={styles.fieldChanges}>
        {suggestionEntries.map(([fieldName, suggestion]) => {
          const isExpanded = expandedFields.has(fieldName);
          const isAccepted = acceptedFields.has(fieldName);
          const editedValue = editedValues[fieldName];
          const currentSuggestedValue = editedValue !== undefined ? editedValue : suggestion.suggested_value;

          return (
            <div key={fieldName} className={styles.fieldChange}>
              <div
                className={styles.fieldHeader}
                onClick={() => toggleFieldExpanded(fieldName)}
              >
                <div className={styles.fieldInfo}>
                  <div className={styles.fieldName}>
                    {formatFieldName(fieldName)}
                  </div>
                  <div className={styles.fieldReason}>
                    {suggestion.reason}
                  </div>
                </div>
                <div className={styles.fieldActions}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isAccepted}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleField(fieldName);
                    }}
                    title={isAccepted ? 'Click to reject this change' : 'Click to accept this change'}
                  />
                  <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                    ▶
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.fieldContent}>
                  <div className={styles.valueComparison}>
                    <div className={styles.currentValue}>
                      <div className={styles.valueLabel}>Current Value</div>
                      {renderValue(suggestion.current_value)}
                    </div>
                    <div className={styles.suggestedValue}>
                      <div className={styles.valueLabel}>
                        {editedValue !== undefined ? 'Edited Value' : 'Suggested Value'}
                      </div>
                      {renderValue(
                        currentSuggestedValue,
                        true,
                        (newValue) => handleFieldEdit(fieldName, newValue)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}