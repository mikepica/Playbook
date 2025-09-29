import { SOPSummary, ProjectSummary, ProjectSOPSummary, DocumentType } from '@/types';

/**
 * Convert a title to a URL-friendly slug
 * Spaces become hyphens, lowercase, remove special characters
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Convert a slug back to a searchable format for matching against titles
 */
export function slugToSearchPattern(slug: string): string {
  return slug.replace(/-/g, ' ');
}

/**
 * Find a SOP by its slug from a list of SOPs
 */
export function findSOPBySlug(sops: SOPSummary[], slug: string): SOPSummary | undefined {
  const searchPattern = slugToSearchPattern(slug).toLowerCase();

  return sops.find(sop => {
    const sopTitleSlug = titleToSlug(sop.title);
    return sopTitleSlug === slug;
  });
}

/**
 * Get the default SOP slug (for "Pre-Initiate Phase")
 */
export function getDefaultSOPSlug(): string {
  return 'pre-initiate-phase';
}

/**
 * Check if a slug matches the default SOP
 */
export function isDefaultSOP(slug: string): boolean {
  return slug === getDefaultSOPSlug();
}

/**
 * Convert a project name to a URL-friendly slug
 */
export function projectNameToSlug(projectName: string): string {
  return titleToSlug(projectName);
}

/**
 * Convert a document type to a URL-friendly slug
 */
export function documentTypeToSlug(documentType: DocumentType | string): string {
  return titleToSlug(documentType);
}

/**
 * Find a project by its slug from a list of projects
 */
export function findProjectBySlug(projects: ProjectSummary[], slug: string): ProjectSummary | undefined {
  return projects.find(project => {
    const projectSlug = projectNameToSlug(project.project_name);
    return projectSlug === slug;
  });
}

/**
 * Find a project SOP by its document type slug from a list of project SOPs
 */
export function findProjectSOPBySlug(projectSops: ProjectSOPSummary[], slug: string): ProjectSOPSummary | undefined {
  return projectSops.find(sop => {
    const sopSlug = documentTypeToSlug(sop.document_type);
    return sopSlug === slug;
  });
}