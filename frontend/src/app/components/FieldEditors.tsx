'use client';

import { useState } from 'react';
import styles from './FieldEditors.module.css';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function TextField({ label, value, onChange, placeholder, required }: TextFieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <input
        type="text"
        className={styles.textInput}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 4 }: TextAreaFieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      <textarea
        className={styles.textArea}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({ label, value, onChange, min, max, step }: NumberFieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      <input
        type="number"
        className={styles.numberInput}
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

interface DateFieldProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      <input
        type="date"
        className={styles.dateInput}
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: { value: string; label: string }[];
}

export function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      <select
        className={styles.select}
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface StringArrayEditorProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function StringArrayEditor({ label, values, onChange, placeholder }: StringArrayEditorProps) {
  const [newValue, setNewValue] = useState('');

  const addValue = () => {
    if (newValue.trim()) {
      onChange([...values, newValue.trim()]);
      setNewValue('');
    }
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateValue = (index: number, newVal: string) => {
    const updated = [...values];
    updated[index] = newVal;
    onChange(updated);
  };

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      <div className={styles.arrayEditor}>
        {values.map((value, index) => (
          <div key={index} className={styles.arrayItem}>
            <input
              type="text"
              className={styles.arrayItemInput}
              value={value}
              onChange={(e) => updateValue(index, e.target.value)}
            />
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeValue(index)}
            >
              ×
            </button>
          </div>
        ))}
        <div className={styles.addItemRow}>
          <input
            type="text"
            className={styles.addItemInput}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={placeholder || 'Add new item'}
            onKeyPress={(e) => e.key === 'Enter' && addValue()}
          />
          <button
            type="button"
            className={styles.addButton}
            onClick={addValue}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

interface ArrayFieldEditorProps {
  label: string;
  values: Array<Record<string, any>>;
  onChange: (values: Array<Record<string, any>>) => void;
  fields: { key: string; label: string; type: 'text' | 'number' | 'date' }[];
}

export function ArrayFieldEditor({ label, values, onChange, fields }: ArrayFieldEditorProps) {
  const addItem = () => {
    const newItem: Record<string, any> = {};
    fields.forEach(field => {
      newItem[field.key] = '';
    });
    onChange([...values, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: string, value: any) => {
    const updated = [...values];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      <div className={styles.arrayEditor}>
        {values.map((item, index) => (
          <div key={index} className={styles.objectItem}>
            <div className={styles.objectFields}>
              {fields.map((field) => (
                <div key={field.key} className={styles.objectField}>
                  <label className={styles.objectFieldLabel}>{field.label}</label>
                  <input
                    type={field.type}
                    className={styles.objectFieldInput}
                    value={item[field.key] || ''}
                    onChange={(e) => updateItem(index, field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeItem(index)}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.addButton}
          onClick={addItem}
        >
          Add {label.slice(0, -1)}
        </button>
      </div>
    </div>
  );
}