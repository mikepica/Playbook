import { ChatMessage, ChatThread, SOP, SOPSummary, ProjectSummary, Project, BusinessCase, ProjectCharter, ProjectSOP, ProjectSOPSummary } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getSOPSummaries() {
  return fetchJSON<{ items: SOPSummary[] }>(`/sops/`);
}

export async function getSOP(id: string) {
  return fetchJSON<SOP>(`/sops/${id}`);
}

export async function createSOP(payload: { title: string; content: SOP['content'] }) {
  return fetchJSON<SOP>(`/sops/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateSOP(id: string, payload: { title?: string; content?: SOP['content']; edited_by?: string | null }) {
  return fetchJSON<SOP>(`/sops/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function createThread(payload: { title?: string; sop_id?: string | null; chat_type?: 'playbook' | 'project' }) {
  return fetchJSON<ChatThread>(`/chat/threads`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {})
  });
}

export async function listThreads() {
  return fetchJSON<{ items: ChatThread[] }>(`/chat/threads`);
}

export async function getThread(threadId: string) {
  return fetchJSON<{ id: string; title: string; sop_id?: string | null; chat_type?: 'playbook' | 'project'; created_at: string; updated_at: string; messages: ChatMessage[] }>(
    `/chat/threads/${threadId}`
  );
}

export async function postMessage(threadId: string, payload: { role: 'user' | 'assistant'; content: string }) {
  return fetchJSON<ChatMessage[]>(`/chat/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function postProjectMessage(threadId: string, payload: { role: 'user' | 'assistant'; content: string }) {
  return fetchJSON<ChatMessage[]>(`/chat/threads/${threadId}/messages/project`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Project APIs
export async function getProjectSummaries() {
  return fetchJSON<{ items: ProjectSummary[] }>(`/projects/`);
}

export async function getProject(id: string) {
  return fetchJSON<Project>(`/projects/${id}`);
}

export async function createProject(payload: { project_name: string; project_code?: string; description?: string; business_area?: string; sponsor?: string; created_by?: string }) {
  return fetchJSON<Project>(`/projects/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateProject(id: string, payload: Partial<Project> & { updated_by?: string }) {
  return fetchJSON<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

// Business Case APIs
export async function getBusinessCases(projectId: string) {
  return fetchJSON<{ items: BusinessCase[] }>(`/projects/${projectId}/business-cases`);
}

export async function getBusinessCase(projectId: string, businessCaseId: string) {
  return fetchJSON<BusinessCase>(`/projects/${projectId}/business-cases/${businessCaseId}`);
}

export async function getCurrentBusinessCase(projectId: string) {
  return fetchJSON<BusinessCase>(`/projects/${projectId}/business-cases/current`);
}

export async function createBusinessCase(projectId: string, payload: Partial<BusinessCase> & { created_by?: string }) {
  return fetchJSON<BusinessCase>(`/projects/${projectId}/business-cases`, {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      project_id: projectId
    })
  });
}

export async function updateBusinessCase(projectId: string, businessCaseId: string, payload: Partial<BusinessCase> & { updated_by?: string }) {
  return fetchJSON<BusinessCase>(`/projects/${projectId}/business-cases/${businessCaseId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

// Project Charter APIs
export async function getProjectCharters(projectId: string) {
  return fetchJSON<{ items: ProjectCharter[] }>(`/projects/${projectId}/charters`);
}

export async function getProjectCharter(projectId: string, charterId: string) {
  return fetchJSON<ProjectCharter>(`/projects/${projectId}/charters/${charterId}`);
}

export async function getCurrentProjectCharter(projectId: string) {
  return fetchJSON<ProjectCharter>(`/projects/${projectId}/charters/current`);
}

export async function createProjectCharter(projectId: string, payload: Partial<ProjectCharter> & { sponsor: string; created_by?: string }) {
  return fetchJSON<ProjectCharter>(`/projects/${projectId}/charters`, {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      project_id: projectId
    })
  });
}

export async function updateProjectCharter(projectId: string, charterId: string, payload: Partial<ProjectCharter> & { updated_by?: string }) {
  return fetchJSON<ProjectCharter>(`/projects/${projectId}/charters/${charterId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

// Project SOP APIs (Global Document Type Templates)
export async function getProjectSOPSummaries() {
  return fetchJSON<{ items: ProjectSOPSummary[] }>(`/project-sops/`);
}

export async function getProjectSOP(id: string) {
  return fetchJSON<ProjectSOP>(`/project-sops/${id}`);
}

export async function createProjectSOP(payload: { document_type: string; title: string; content: ProjectSOP['content']; display_order?: number; is_active?: boolean }) {
  return fetchJSON<ProjectSOP>(`/project-sops/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateProjectSOP(id: string, payload: { document_type?: string; title?: string; content?: ProjectSOP['content']; display_order?: number; is_active?: boolean; edited_by?: string | null }) {
  return fetchJSON<ProjectSOP>(`/project-sops/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteProjectSOP(id: string) {
  return fetchJSON<void>(`/project-sops/${id}`, {
    method: 'DELETE'
  });
}

// Helper function to check which document types exist for a project
export async function checkProjectDocuments(projectId: string): Promise<{ businessCase: boolean; projectCharter: boolean }> {
  try {
    const [businessCaseResponse, charterResponse] = await Promise.allSettled([
      getCurrentBusinessCase(projectId),
      getCurrentProjectCharter(projectId)
    ]);

    return {
      businessCase: businessCaseResponse.status === 'fulfilled',
      projectCharter: charterResponse.status === 'fulfilled'
    };
  } catch (error) {
    // If there's an error, assume no documents exist
    return {
      businessCase: false,
      projectCharter: false
    };
  }
}
