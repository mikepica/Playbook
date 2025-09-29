'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AddSOPModal } from '@/app/components/AddSOPModal';
import { AppHeader } from '@/app/components/AppHeader';
import { ChatPane } from '@/app/components/ChatPane';
import { SOPPane } from '@/app/components/SOPPane';
import { ProjectDocumentPane } from '@/app/components/ProjectDocumentPane';
import { createSOP, createThread, getSOP, getThread, getSOPSummaries, listThreads, postMessage, updateSOP, getProjectSummaries, getBusinessCases, getProjectCharters, getCurrentBusinessCase, getCurrentProjectCharter, updateBusinessCase, updateProjectCharter } from '@/lib/api';
import { findSOPBySlug, titleToSlug } from '@/lib/utils';
import { ChatMessage, ChatThread, SOP, SOPSummary, ProjectSummary, ProjectDocumentSelection, ProjectDocument, DocumentType } from '@/types';

interface PlaybookPageProps {
  params: {
    slug: string;
  };
}

export default function PlaybookPage({ params }: PlaybookPageProps) {
  const router = useRouter();
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

  // Project state
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectDocument, setSelectedProjectDocument] = useState<ProjectDocumentSelection | null>(null);
  const [activeDocument, setActiveDocument] = useState<ProjectDocument | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  // Document editing state
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [documentEditorContent, setDocumentEditorContent] = useState<any>(null);
  const [isSavingDocument, setIsSavingDocument] = useState(false);

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

      // Find SOP by slug and set as selected
      const sopFromSlug = findSOPBySlug(response.items, params.slug);
      if (sopFromSlug) {
        setSelectedSopId(sopFromSlug.id);
      } else if (response.items.length > 0) {
        // If no matching SOP found, redirect to the first available SOP
        const firstSop = response.items[0];
        const firstSopSlug = titleToSlug(firstSop.title);
        router.replace(`/playbook/${firstSopSlug}`);
      }
    } catch (error) {
      console.error(error);
      setFeedback('Failed to load SOP list.');
    }
  }, [params.slug, router]);

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

  const refreshProjects = useCallback(async () => {
    try {
      const response = await getProjectSummaries();
      setProjects(response.items);
    } catch (error) {
      console.error(error);
      setFeedback('Failed to load projects.');
    }
  }, []);

  useEffect(() => {
    void refreshSopSummaries();
    void refreshThreads();
    void refreshProjects();
  }, [refreshSopSummaries, refreshThreads, refreshProjects]);

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

  const handleSOPSelect = (id: string) => {
    const sop = sopSummaries.find(s => s.id === id);
    if (sop) {
      const slug = titleToSlug(sop.title);
      router.push(`/playbook/${slug}`);
    }
  };

  const handleProjectDocumentSelect = async (selection: ProjectDocumentSelection) => {
    setSelectedProjectDocument(selection);
    setIsLoadingDocument(true);
    setFeedback(null);

    try {
      let document: ProjectDocument;

      if (selection.documentType === 'business-case') {
        document = await getCurrentBusinessCase(selection.projectId);
      } else if (selection.documentType === 'project-charter') {
        document = await getCurrentProjectCharter(selection.projectId);
      } else {
        throw new Error('Unknown document type');
      }

      setActiveDocument(document);
    } catch (error) {
      console.error(error);
      setFeedback('Failed to load project document.');
      setActiveDocument(null);
    } finally {
      setIsLoadingDocument(false);
    }
  };

  const handleToggleDocumentEdit = () => {
    if (!activeDocument) return;
    setIsEditingDocument((value) => !value);
    if (!isEditingDocument) {
      // Entering edit mode - initialize editor content with current document
      setDocumentEditorContent({ ...activeDocument });
    }
    setFeedback(null);
  };

  const handleSaveDocument = async () => {
    if (!activeDocument || !selectedProjectDocument || !documentEditorContent) return;
    setIsSavingDocument(true);
    setFeedback(null);

    try {
      let updatedDocument: ProjectDocument;

      if (selectedProjectDocument.documentType === 'business-case') {
        updatedDocument = await updateBusinessCase(
          selectedProjectDocument.projectId,
          activeDocument.id,
          { ...documentEditorContent, updated_by: 'user' }
        );
      } else if (selectedProjectDocument.documentType === 'project-charter') {
        updatedDocument = await updateProjectCharter(
          selectedProjectDocument.projectId,
          activeDocument.id,
          { ...documentEditorContent, updated_by: 'user' }
        );
      } else {
        throw new Error('Unknown document type');
      }

      setActiveDocument(updatedDocument);
      setDocumentEditorContent(null);
      setIsEditingDocument(false);
      setFeedback('Document saved successfully.');
    } catch (error) {
      console.error(error);
      setFeedback('Failed to save document.');
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleCancelDocumentEdit = () => {
    setDocumentEditorContent(null);
    setIsEditingDocument(false);
    setFeedback(null);
  };

  const handleDocumentEditorChange = (updates: any) => {
    setDocumentEditorContent((prev: any) => ({
      ...prev,
      ...updates
    }));
  };

  const handleAddProject = () => {
    // TODO: Implement project creation modal/functionality
    console.log('Add project functionality not yet implemented');
  };

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

      // If title changed, update URL
      const newSlug = titleToSlug(updated.title);
      if (newSlug !== params.slug) {
        router.replace(`/playbook/${newSlug}`);
      }
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
        sop_id: null
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

        if (isFirstMessage) {
          setTimeout(() => {
            void refreshThreads();
          }, 2000);
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
      const newSlug = titleToSlug(newSOP.title);
      router.push(`/playbook/${newSlug}`);
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
        onSelect={handleSOPSelect}
        onRefresh={refreshSopSummaries}
        onAddSOP={handleAddSOP}
        projects={projects}
        selectedProjectDocument={selectedProjectDocument}
        onSelectProjectDocument={handleProjectDocumentSelect}
        onRefreshProjects={refreshProjects}
        onAddProject={handleAddProject}
      />
      <main className="appMain">
        <div className="appColumn">
          {feedback && <div style={{ marginBottom: '0.75rem', color: '#d23939' }}>{feedback}</div>}
          {selectedProjectDocument ? (
            <ProjectDocumentPane
              document={activeDocument}
              documentType={selectedProjectDocument.documentType}
              projectName={projects.find(p => p.id === selectedProjectDocument.projectId)?.project_name}
              isLoading={isLoadingDocument}
              isEditing={isEditingDocument}
              onToggleEdit={handleToggleDocumentEdit}
              onSave={handleSaveDocument}
              onCancel={handleCancelDocumentEdit}
              isSaving={isSavingDocument}
              editorValue={documentEditorContent}
              onEditorChange={handleDocumentEditorChange}
            />
          ) : (
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
          )}
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