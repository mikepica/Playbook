'use client';

import { useState, useEffect, useRef } from 'react';
import { ProjectSummary, DocumentType, ProjectDocumentSelection } from '@/types';
import styles from './HierarchicalProjectDropdown.module.css';

interface Props {
  projects: ProjectSummary[];
  selectedProjectDocument?: ProjectDocumentSelection | null;
  onSelectDocument: (selection: ProjectDocumentSelection) => void;
  onRefreshProjects: () => void;
  onAddProject: () => void;
}

interface DocumentTypeInfo {
  type: DocumentType;
  label: string;
  icon: string;
}

const DOCUMENT_TYPES: DocumentTypeInfo[] = [
  { type: 'business-case', label: 'Business Case', icon: '📊' },
  { type: 'project-charter', label: 'Project Charter', icon: '📋' }
];

export function HierarchicalProjectDropdown({
  projects,
  selectedProjectDocument,
  onSelectDocument,
  onRefreshProjects,
  onAddProject
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProject = selectedProjectDocument
    ? projects.find(p => p.id === selectedProjectDocument.projectId)
    : null;

  const selectedDocType = selectedProjectDocument
    ? DOCUMENT_TYPES.find(d => d.type === selectedProjectDocument.documentType)
    : null;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleProjectToggle = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleDocumentSelect = (projectId: string, documentType: DocumentType) => {
    onSelectDocument({ projectId, documentType });
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.dropdownButton} ${isOpen ? styles.dropdownOpen : ''}`}
        onClick={handleDropdownToggle}
      >
        <span className={styles.dropdownTitle}>
          Projects
          {selectedProject && selectedDocType && (
            <span className={styles.selectedIndicator}>
              → {selectedProject.project_name} - {selectedDocType.label}
            </span>
          )}
        </span>
        <span className={styles.dropdownArrow}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {projects.length === 0 ? (
            <div className={styles.emptyState}>No projects available</div>
          ) : (
            projects.map((project) => {
              const isExpanded = expandedProjects.has(project.id);
              return (
                <div key={project.id} className={styles.projectGroup}>
                  <button
                    type="button"
                    className={`${styles.projectItem} ${isExpanded ? styles.expanded : ''}`}
                    onClick={(e) => handleProjectToggle(project.id, e)}
                  >
                    <span className={styles.projectToggle}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <div className={styles.projectInfo}>
                      <span className={styles.projectName}>{project.project_name}</span>
                      <span className={styles.projectMeta}>
                        {project.project_code && `[${project.project_code}] `}
                        <span className={`${styles.statusBadge} ${styles[project.overall_health]}`}>
                          {project.status}
                        </span>
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className={styles.documentList}>
                      {DOCUMENT_TYPES.map((docType) => (
                        <button
                          key={docType.type}
                          type="button"
                          className={`${styles.documentItem} ${
                            selectedProjectDocument?.projectId === project.id &&
                            selectedProjectDocument?.documentType === docType.type
                              ? styles.active : ''
                          }`}
                          onClick={() => handleDocumentSelect(project.id, docType.type)}
                        >
                          <span className={styles.documentIcon}>{docType.icon}</span>
                          <span className={styles.documentLabel}>{docType.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}