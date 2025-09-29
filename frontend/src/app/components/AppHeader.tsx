'use client';

import { useState } from 'react';
import { SOPSummary, ProjectSummary, ProjectDocumentSelection, ProjectSOPSummary, ProjectSOPSelection } from '@/types';
import { HierarchicalProjectDropdown } from './HierarchicalProjectDropdown';
import { ProjectSOPDropdown } from './ProjectSOPDropdown';
import styles from './AppHeader.module.css';

interface Props {
  items: SOPSummary[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onAddSOP: () => void;
  projects?: ProjectSummary[];
  selectedProjectDocument?: ProjectDocumentSelection | null;
  onSelectProjectDocument?: (selection: ProjectDocumentSelection) => void;
  onRefreshProjects?: () => void;
  onAddProject?: () => void;
  // Project SOPs props
  projectSops?: ProjectSOPSummary[];
  selectedProjectSOP?: ProjectSOPSelection | null;
  onSelectProjectSOP?: (selection: ProjectSOPSelection | null) => void;
  onRefreshProjectSOPs?: () => void;
  onAddProjectSOP?: () => void;
}

export function AppHeader({
  items,
  selectedId,
  onSelect,
  onRefresh,
  onAddSOP,
  projects = [],
  selectedProjectDocument,
  onSelectProjectDocument,
  onRefreshProjects,
  onAddProject,
  projectSops = [],
  selectedProjectSOP,
  onSelectProjectSOP,
  onRefreshProjectSOPs,
  onAddProjectSOP
}: Props) {
  const [isSOPDropdownOpen, setIsSOPDropdownOpen] = useState(false);

  const selectedSOP = items.find(item => item.id === selectedId);

  const handleSOPDropdownToggle = () => {
    setIsSOPDropdownOpen(!isSOPDropdownOpen);
  };

  const handleSOPSelect = (id: string) => {
    onSelect(id);
    setIsSOPDropdownOpen(false);
  };

  const handleSOPDropdownBlur = () => {
    setTimeout(() => setIsSOPDropdownOpen(false), 150);
  };

  return (
    <header className={styles.header}>
      <div className={styles.brand}>PMO Playbook</div>
      <nav className={styles.nav}>
        {/* Playbook Docs Dropdown */}
        <div className={styles.dropdown}>
          <button
            type="button"
            className={`${styles.dropdownButton} ${isSOPDropdownOpen ? styles.dropdownOpen : ''}`}
            onClick={handleSOPDropdownToggle}
            onBlur={handleSOPDropdownBlur}
          >
            <span className={styles.dropdownTitle}>
              Playbook Docs
              {selectedSOP && (
                <span className={styles.selectedIndicator}>
                  → {selectedSOP.title}
                </span>
              )}
            </span>
            <span className={styles.dropdownArrow}>▼</span>
          </button>
          {isSOPDropdownOpen && (
            <div className={styles.dropdownMenu}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.dropdownItem} ${selectedId === item.id ? styles.active : ''}`}
                  onClick={() => handleSOPSelect(item.id)}
                >
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.meta}>v{item.version}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hierarchical Projects Dropdown */}
        {onSelectProjectDocument && onRefreshProjects && onAddProject && (
          <HierarchicalProjectDropdown
            projects={projects}
            selectedProjectDocument={selectedProjectDocument}
            onSelectDocument={onSelectProjectDocument}
            onRefreshProjects={onRefreshProjects}
            onAddProject={onAddProject}
          />
        )}

        {/* Project SOPs Dropdown */}
        {onSelectProjectSOP && onRefreshProjectSOPs && (
          <ProjectSOPDropdown
            projectSops={projectSops}
            selectedProjectSOP={selectedProjectSOP}
            onSelectSOP={onSelectProjectSOP}
            onRefreshProjectSOPs={onRefreshProjectSOPs}
            onAddProjectSOP={onAddProjectSOP}
          />
        )}
      </nav>
      <div className={styles.actions}>
        <button className={styles.addButton} type="button" onClick={onAddSOP}>
          New SOP
        </button>
        {onAddProject && (
          <button className={styles.addButton} type="button" onClick={onAddProject}>
            New Project
          </button>
        )}
        <button className={styles.refreshButton} type="button" onClick={onRefresh}>
          Refresh SOPs
        </button>
        {onRefreshProjects && (
          <button className={styles.refreshButton} type="button" onClick={onRefreshProjects}>
            Refresh Projects
          </button>
        )}
        {onAddProjectSOP && (
          <button className={styles.addButton} type="button" onClick={onAddProjectSOP}>
            New Document Type
          </button>
        )}
        {onRefreshProjectSOPs && (
          <button className={styles.refreshButton} type="button" onClick={onRefreshProjectSOPs}>
            Refresh Document Types
          </button>
        )}
      </div>
    </header>
  );
}
