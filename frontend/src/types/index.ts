export interface SOPSummary {
  id: string;
  title: string;
  version: number;
  updated_at: string;
}

export interface SOP extends SOPSummary {
  content: SOPContent;
  created_at: string;
}

export interface SOPContent {
  markdown: string;
  [key: string]: unknown;
}

export interface SOPHistoryItem {
  id: string;
  sop_id: string;
  title: string;
  version: number;
  content: SOPContent;
  edited_by?: string | null;
  created_at: string;
}

export interface ChatThread {
  id: string;
  title: string;
  sop_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  updated_at: string;
}
