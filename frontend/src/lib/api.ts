import { ChatMessage, ChatThread, SOP, SOPSummary } from '@/types';

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

export async function createThread(payload: { title?: string; sop_id?: string | null }) {
  return fetchJSON<ChatThread>(`/chat/threads`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {})
  });
}

export async function listThreads() {
  return fetchJSON<{ items: ChatThread[] }>(`/chat/threads`);
}

export async function getThread(threadId: string) {
  return fetchJSON<{ id: string; title: string; sop_id?: string | null; created_at: string; updated_at: string; messages: ChatMessage[] }>(
    `/chat/threads/${threadId}`
  );
}

export async function postMessage(threadId: string, payload: { role: 'user' | 'assistant'; content: string }) {
  return fetchJSON<ChatMessage[]>(`/chat/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
