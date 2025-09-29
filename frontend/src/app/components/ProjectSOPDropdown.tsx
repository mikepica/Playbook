'use client';

import { useState } from 'react';
import { ProjectSOPSummary, ProjectSOPSelection } from '@/types';
import styles from './AppHeader.module.css';

interface Props {
  projectSops: ProjectSOPSummary[];
  selectedProjectSOP?: ProjectSOPSelection | null;
  onSelectSOP: (selection: ProjectSOPSelection | null) => void;
  onAddProjectSOP?: () => void;
}

export function ProjectSOPDropdown({
  projectSops,
  selectedProjectSOP,
  onSelectSOP,
  onAddProjectSOP
}: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedSOP = selectedProjectSOP
    ? projectSops.find(s => s.id === selectedProjectSOP.sopId)
    : null;

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSOPSelect = (sopId: string) => {
    onSelectSOP({ sopId });
    setIsDropdownOpen(false);
  };

  const handleDropdownBlur = () => {
    setTimeout(() => setIsDropdownOpen(false), 150);
  };

  const handleClear = () => {
    onSelectSOP(null);
    setIsDropdownOpen(false);
  };

  // Filter to only active SOPs and sort by display order
  const activeSOPs = projectSops
    .filter(sop => sop.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className={styles.dropdown}>
      <button
        type="button"
        className={`${styles.dropdownButton} ${isDropdownOpen ? styles.dropdownOpen : ''}`}
        onClick={handleDropdownToggle}
        onBlur={handleDropdownBlur}
      >
        <span className={styles.dropdownTitle}>
          Document Types
          {selectedSOP && (
            <span className={styles.selectedIndicator}>
              → {selectedSOP.title}
            </span>
          )}
        </span>
        <span className={styles.dropdownArrow}>▼</span>
      </button>

      {isDropdownOpen && (
        <div className={styles.dropdownMenu}>
          {selectedProjectSOP && (
            <div className={styles.dropdownHeader}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={handleClear}
              >
                Clear Selection
              </button>
            </div>
          )}

          {activeSOPs.length === 0 ? (
            <div className={styles.emptyState}>
              <span>No document types available</span>
              {onAddProjectSOP && (
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={onAddProjectSOP}
                >
                  Add First Document Type
                </button>
              )}
            </div>
          ) : (
            <>
              {activeSOPs.map((sop) => (
                <button
                  key={sop.id}
                  type="button"
                  className={`${styles.dropdownItem} ${
                    selectedProjectSOP?.sopId === sop.id ? styles.active : ''
                  }`}
                  onClick={() => handleSOPSelect(sop.id)}
                >
                  <span className={styles.title}>{sop.title}</span>
                  <span className={styles.meta}>
                    {sop.document_type} • v{sop.version}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}