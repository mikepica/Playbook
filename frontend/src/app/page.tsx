'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AddSOPModal } from '@/app/components/AddSOPModal';
import { AppHeader } from '@/app/components/AppHeader';
import { ChatPane } from '@/app/components/ChatPane';
import { SOPPane } from '@/app/components/SOPPane';
import { createSOP, createThread, getSOP, getThread, getSOPSummaries, listThreads, postMessage, updateSOP } from '@/lib/api';
import { ChatMessage, ChatThread, SOP, SOPSummary } from '@/types';

export default function HomePage() {
  const [sopSummaries, setSopSummaries] = useState<SOPSummary[]>([]);
  const [selectedSopId, setSelectedSopId] = useState<string | null>(null);
  const [activeSop, setActiveSop] = useState<SOP | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [titleContent, setTitleContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [chatFeedback, setChatFeedback] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreatingSOP, setIsCreatingSOP] = useState(false);

  const markdown = useMemo(() => {
    if (!activeSop) return '';
    if (typeof activeSop.content?.markdown === 'string') {
      return activeSop.content.markdown;
    }
    if (typeof activeSop.content === 'string') {
      return activeSop.content;
    }
    return '';
  }, [activeSop]);

  const refreshSopSummaries = useCallback(async () => {
    try {
      const response = await getSOPSummaries();
      setSopSummaries(response.items);
      if (!selectedSopId && response.items.length > 0) {
        setSelectedSopId(response.items[0].id);
      }
    } catch (error) {
      console.error(error);
      setFeedback('Failed to load SOP list.');
    }
  }, [selectedSopId]);

  const refreshThreads = useCallback(async () => {
    try {
      const response = await listThreads();
      setThreads(response.items);
      if (!selectedThreadId && response.items.length > 0) {
        setSelectedThreadId(response.items[0].id);
      }
    } catch (error) {
      console.error(error);
      setChatFeedback('Failed to load chat threads.');
    }
  }, [selectedThreadId]);

  useEffect(() => {
    void refreshSopSummaries();
    void refreshThreads();
  }, [refreshSopSummaries, refreshThreads]);

  useEffect(() => {
    if (!selectedSopId) {
      setActiveSop(null);
      setEditorContent('');
      setTitleContent('');
      return;
    }

    async function loadSop() {
      if (!selectedSopId) return;
      try {
        const sop = await getSOP(selectedSopId);
        setActiveSop(sop);
        const content = typeof sop.content?.markdown === 'string' ? sop.content.markdown : '';
        setEditorContent(content);
        setTitleContent(sop.title);
        setIsEditing(false);
      } catch (error) {
        console.error(error);
        setFeedback('Failed to load SOP details.');
      }
    }

    void loadSop();
  }, [selectedSopId]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }

    async function loadThread() {
      if (!selectedThreadId) return;
      try {
        const thread = await getThread(selectedThreadId);
        setMessages(thread.messages);
        setChatFeedback(null);
      } catch (error) {
        console.error(error);
        setChatFeedback('Failed to load chat messages.');
      }
    }

    void loadThread();
  }, [selectedThreadId]);

  const handleToggleEdit = () => {
    if (!activeSop) return;
    setIsEditing((value) => !value);
    setEditorContent(markdown);
    setTitleContent(activeSop.title);
    setFeedback(null);
  };

  const handleSaveSop = async () => {
    if (!activeSop) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const payload = {
        title: titleContent.trim() || activeSop.title,
        content: {
          ...activeSop.content,
          markdown: editorContent
        }
      };
      const updated = await updateSOP(activeSop.id, payload);
      setActiveSop(updated);
      setEditorContent(typeof updated.content?.markdown === 'string' ? updated.content.markdown : '');
      setTitleContent(updated.title);
      setIsEditing(false);
      await refreshSopSummaries();
      setFeedback('SOP saved successfully.');
    } catch (error) {
      console.error(error);
      setFeedback('Failed to save SOP.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditorContent(markdown);
    setTitleContent(activeSop?.title || '');
    setIsEditing(false);
  };

  const handleCreateThread = useCallback(async () => {
    try {
      const thread = await createThread({
        title: "New Conversation",
        sop_id: null  // Set to null to access all SOPs instead of specific one
      });
      await refreshThreads();
      setSelectedThreadId(thread.id);
      setChatFeedback(null);
      return thread.id;
    } catch (error) {
      console.error(error);
      setChatFeedback('Failed to create chat thread.');
      return undefined;
    }
  }, [refreshThreads]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      setIsSending(true);
      setChatFeedback(null);

      try {
        let threadId: string | null = selectedThreadId;
        const isFirstMessage = !threadId || messages.length === 0;

        if (!threadId) {
          const newThreadId = await handleCreateThread();
          if (!newThreadId) {
            return;
          }
          threadId = newThreadId;
        }

        const response = await postMessage(threadId, { role: 'user', content });
        setMessages((prev) => [...prev, ...response]);
        setSelectedThreadId(threadId);

        // If this was the first message, refresh threads after a short delay for title update
        if (isFirstMessage) {
          setTimeout(() => {
            void refreshThreads();
          }, 2000); // 2-second delay to allow background title generation
        }
      } catch (error) {
        console.error(error);
        setChatFeedback('Failed to send message.');
      } finally {
        setIsSending(false);
      }
    },
    [handleCreateThread, selectedThreadId, messages.length, refreshThreads]
  );

  const handleAddSOP = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCreateSOP = async (title: string, content: string) => {
    setIsCreatingSOP(true);
    setFeedback(null);
    try {
      const newSOP = await createSOP({
        title,
        content: { markdown: content }
      });
      await refreshSopSummaries();
      setSelectedSopId(newSOP.id);
      setIsAddModalOpen(false);
      setFeedback('SOP created successfully.');
    } catch (error) {
      console.error(error);
      setFeedback('Failed to create SOP.');
    } finally {
      setIsCreatingSOP(false);
    }
  };

  return (
    <div className="appShell">
      <AppHeader
        items={sopSummaries}
        selectedId={selectedSopId}
        onSelect={setSelectedSopId}
        onRefresh={refreshSopSummaries}
        onAddSOP={handleAddSOP}
      />
      <main className="appMain">
        <div className="appColumn">
          {feedback && <div style={{ marginBottom: '0.75rem', color: '#d23939' }}>{feedback}</div>}
          <SOPPane
            sop={activeSop}
            isEditing={isEditing}
            onToggleEdit={handleToggleEdit}
            editorValue={editorContent}
            onEditorChange={setEditorContent}
            titleValue={titleContent}
            onTitleChange={setTitleContent}
            onSave={handleSaveSop}
            onCancel={handleCancelEdit}
            isSaving={isSaving}
          />
        </div>
        <div className="appColumn">
          {chatFeedback && <div style={{ marginBottom: '0.75rem', color: '#d23939', flexShrink: 0 }}>{chatFeedback}</div>}
          <ChatPane
            threads={threads}
            selectedThreadId={selectedThreadId}
            onSelectThread={setSelectedThreadId}
            onCreateThread={handleCreateThread}
            messages={messages}
            onSendMessage={handleSendMessage}
            isSending={isSending}
          />
        </div>
      </main>

      <AddSOPModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleCreateSOP}
        isSaving={isCreatingSOP}
      />
    </div>
  );
}
