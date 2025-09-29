'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AddSOPModal } from '@/app/components/AddSOPModal';
import { AddProjectModal } from '@/app/components/AddProjectModal';
import { AddProjectSOPModal } from '@/app/components/AddProjectSOPModal';
import { AppHeader } from '@/app/components/AppHeader';
import { ChatPane } from '@/app/components/ChatPane';
import { SOPPane } from '@/app/components/SOPPane';
import { ProjectDocumentPane } from '@/app/components/ProjectDocumentPane';
import { ProjectSOPPane } from '@/app/components/ProjectSOPPane';
import { createSOP, createThread, getSOP, getThread, getSOPSummaries, listThreads, postMessage, postProjectMessage, updateSOP, getProjectSummaries, getBusinessCases, getProjectCharters, getCurrentBusinessCase, getCurrentProjectCharter, updateBusinessCase, updateProjectCharter, createProject, createBusinessCase, createProjectCharter, getProjectSOPSummaries, getProjectSOP, createProjectSOP, updateProjectSOP } from '@/lib/api';
import { findSOPBySlug, titleToSlug, projectNameToSlug, documentTypeToSlug } from '@/lib/utils';
import { ChatMessage, ChatThread, SOP, SOPSummary, ProjectSummary, ProjectDocumentSelection, ProjectDocument, DocumentType, ProjectSOPSummary, ProjectSOPSelection, ProjectSOP, ProjectDocumentModalData } from '@/types';

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
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isAddProjectSOPModalOpen, setIsAddProjectSOPModalOpen] = useState(false);
  const [isCreatingProjectSOP, setIsCreatingProjectSOP] = useState(false);

  // Project state
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectDocument, setSelectedProjectDocument] = useState<ProjectDocumentSelection | null>(null);
  const [activeDocument, setActiveDocument] = useState<ProjectDocument | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  // Document editing state
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [documentEditorContent, setDocumentEditorContent] = useState<any>(null);
  const [isSavingDocument, setIsSavingDocument] = useState(false);

  // Project SOP state
  const [projectSops, setProjectSops] = useState<ProjectSOPSummary[]>([]);
  const [selectedProjectSOP, setSelectedProjectSOP] = useState<ProjectSOPSelection | null>(null);
  const [activeProjectSOP, setActiveProjectSOP] = useState<ProjectSOP | null>(null);
  const [isLoadingProjectSOP, setIsLoadingProjectSOP] = useState(false);

  // Project SOP editing state
  const [isEditingProjectSOP, setIsEditingProjectSOP] = useState(false);
  const [projectSOPEditorContent, setProjectSOPEditorContent] = useState('');
  const [projectSOPTitleContent, setProjectSOPTitleContent] = useState('');
  const [isSavingProjectSOP, setIsSavingProjectSOP] = useState(false);

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

  const refreshProjectSOPs = useCallback(async () => {
    try {
      const response = await getProjectSOPSummaries();
      setProjectSops(response.items);
    } catch (error) {
      console.error(error);
      setFeedback('Failed to load document types.');
    }
  }, []);

  useEffect(() => {
    void refreshSopSummaries();
    void refreshThreads();
    void refreshProjects();
    void refreshProjectSOPs();

    // Clear project document and project SOP selections when on playbook route
    setSelectedProjectDocument(null);
    setSelectedProjectSOP(null);
  }, [refreshSopSummaries, refreshThreads, refreshProjects, refreshProjectSOPs]);

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

  useEffect(() => {
    if (!selectedProjectSOP) {
      setActiveProjectSOP(null);
      setProjectSOPEditorContent('');
      setProjectSOPTitleContent('');
      return;
    }

    async function loadProjectSOP() {
      if (!selectedProjectSOP) return;
      setIsLoadingProjectSOP(true);
      try {
        const projectSOP = await getProjectSOP(selectedProjectSOP.sopId);
        setActiveProjectSOP(projectSOP);
        const content = typeof projectSOP.content?.markdown === 'string' ? projectSOP.content.markdown : '';
        setProjectSOPEditorContent(content);
        setProjectSOPTitleContent(projectSOP.title);
        setIsEditingProjectSOP(false);
      } catch (error) {
        console.error(error);
        setFeedback('Failed to load document type details.');
      } finally {
        setIsLoadingProjectSOP(false);
      }
    }

    void loadProjectSOP();
  }, [selectedProjectSOP]);

  const handleSOPSelect = (id: string) => {
    const sop = sopSummaries.find(s => s.id === id);
    if (sop) {
      const slug = titleToSlug(sop.title);
      router.push(`/playbook/${slug}`);
    }
  };

  const handleProjectDocumentSelect = async (selection: ProjectDocumentSelection) => {
    const project = projects.find(p => p.id === selection.projectId);
    if (project) {
      const projectSlug = projectNameToSlug(project.project_name);
      const documentTypeSlug = documentTypeToSlug(selection.documentType);
      router.push(`/projects/${projectSlug}/${documentTypeSlug}`);
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
    setIsAddProjectModalOpen(true);
  };

  const handleCloseAddProjectModal = () => {
    setIsAddProjectModalOpen(false);
  };

  const handleCreateProject = async (data: ProjectDocumentModalData) => {
    setIsCreatingProject(true);
    setFeedback(null);

    let createdProject: any = null;
    let targetProjectId: string;
    let targetProjectName: string;

    try {
      if (data.mode === 'new') {
        // Step 1: Create new project
        createdProject = await createProject({
          project_name: data.projectName!,
          project_code: data.projectCode,
          business_area: data.businessArea,
          sponsor: data.sponsor,
          created_by: 'user'
        });
        targetProjectId = createdProject.id;
        targetProjectName = createdProject.project_name;
      } else {
        // Use existing project
        targetProjectId = data.projectId!;
        targetProjectName = data.projectName!;
      }

      // Step 2: Create document if specified
      let newDocument: ProjectDocument | null = null;
      if (data.documentType && data.documentType !== 'none') {
        try {
          if (data.documentType === 'business-case') {
            newDocument = await createBusinessCase(targetProjectId, {
              title: `${targetProjectName} Business Case`,
              business_area: data.businessArea,
              sponsor: data.sponsor,
              status: 'draft',
              created_by: 'user'
            });
          } else if (data.documentType === 'project-charter') {
            newDocument = await createProjectCharter(targetProjectId, {
              title: `${targetProjectName} Project Charter`,
              sponsor: data.sponsor || 'TBD',
              status: 'draft',
              created_by: 'user'
            });
          }
        } catch (docError) {
          console.error('Failed to create document:', docError);
          if (data.mode === 'new' && createdProject) {
            console.warn('Project created but document creation failed. Project ID:', createdProject.id);
          }
          throw new Error(`Failed to create ${data.documentType.replace('-', ' ')}`);
        }
      }

      // Refresh projects list
      await refreshProjects();

      // Set the new project document as selected and enter edit mode
      if (newDocument) {
        setSelectedProjectDocument({
          projectId: targetProjectId,
          documentType: data.documentType as DocumentType,
          documentId: newDocument.id
        });

        // Set the document and enter edit mode
        setActiveDocument(newDocument);
        setIsEditingDocument(true);
        setDocumentEditorContent(newDocument);
      }

      // Close modal and show success
      setIsAddProjectModalOpen(false);
      if (data.mode === 'new') {
        setFeedback(data.documentType === 'none' ? 'Project created successfully.' : 'Project and document created successfully.');
      } else {
        setFeedback('Document added to project successfully.');
      }

    } catch (error) {
      console.error('Project/document creation error:', error);
      if (createdProject) {
        setFeedback(`Project was created but failed to create document. Check the project list.`);
      } else {
        setFeedback(data.mode === 'new' ? 'Failed to create project.' : 'Failed to add document.');
      }
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleProjectSOPSelect = (selection: ProjectSOPSelection | null) => {
    if (selection) {
      const projectSOP = projectSops.find(sop => sop.id === selection.sopId);
      if (projectSOP) {
        const documentTypeSlug = documentTypeToSlug(projectSOP.document_type as DocumentType);
        router.push(`/document-types/${documentTypeSlug}`);
      }
    }
  };

  const handleToggleProjectSOPEdit = () => {
    if (!activeProjectSOP) return;
    setIsEditingProjectSOP((value) => !value);
    if (!isEditingProjectSOP) {
      // Entering edit mode - initialize editor content with current content
      const content = typeof activeProjectSOP.content?.markdown === 'string' ? activeProjectSOP.content.markdown : '';
      setProjectSOPEditorContent(content);
      setProjectSOPTitleContent(activeProjectSOP.title);
    }
    setFeedback(null);
  };

  const handleSaveProjectSOP = async () => {
    if (!activeProjectSOP) return;
    setIsSavingProjectSOP(true);
    setFeedback(null);
    try {
      const payload = {
        title: projectSOPTitleContent.trim() || activeProjectSOP.title,
        content: {
          ...activeProjectSOP.content,
          markdown: projectSOPEditorContent
        },
        edited_by: 'user'
      };
      const updated = await updateProjectSOP(activeProjectSOP.id, payload);
      setActiveProjectSOP(updated);
      setProjectSOPEditorContent(typeof updated.content?.markdown === 'string' ? updated.content.markdown : '');
      setProjectSOPTitleContent(updated.title);
      setIsEditingProjectSOP(false);
      await refreshProjectSOPs();
      setFeedback('Document type updated successfully.');
    } catch (error) {
      console.error(error);
      setFeedback('Failed to update document type.');
    } finally {
      setIsSavingProjectSOP(false);
    }
  };

  const handleCancelProjectSOPEdit = () => {
    if (!activeProjectSOP) return;
    const content = typeof activeProjectSOP.content?.markdown === 'string' ? activeProjectSOP.content.markdown : '';
    setProjectSOPEditorContent(content);
    setProjectSOPTitleContent(activeProjectSOP.title);
    setIsEditingProjectSOP(false);
    setFeedback(null);
  };

  const handleAddProjectSOP = () => {
    setIsAddProjectSOPModalOpen(true);
  };

  const handleCloseAddProjectSOPModal = () => {
    setIsAddProjectSOPModalOpen(false);
  };

  const handleCreateProjectSOP = async (data: {
    documentType: string;
    title: string;
    content: string;
    displayOrder: number;
  }) => {
    setIsCreatingProjectSOP(true);
    setFeedback(null);
    try {
      const newProjectSOP = await createProjectSOP({
        document_type: data.documentType,
        title: data.title,
        content: { markdown: data.content },
        display_order: data.displayOrder,
        is_active: true
      });
      await refreshProjectSOPs();

      // Select the new Project SOP
      setSelectedProjectSOP({ sopId: newProjectSOP.id });

      setIsAddProjectSOPModalOpen(false);
      setFeedback('Document type created successfully.');
    } catch (error) {
      console.error(error);
      setFeedback('Failed to create document type.');
    } finally {
      setIsCreatingProjectSOP(false);
    }
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

  const handleCreateThread = useCallback(async (chatType: 'playbook' | 'project' = 'playbook') => {
    try {
      const thread = await createThread({
        title: "New Conversation",
        sop_id: null,
        chat_type: chatType
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
    async (content: string, chatType: 'playbook' | 'project' = 'playbook') => {
      setIsSending(true);
      setChatFeedback(null);

      try {
        let threadId: string | null = selectedThreadId;
        const isFirstMessage = !threadId || messages.length === 0;

        if (!threadId) {
          const newThreadId = await handleCreateThread(chatType);
          if (!newThreadId) {
            return;
          }
          threadId = newThreadId;
        }

        // Use the appropriate API based on chat type
        const response = chatType === 'project'
          ? await postProjectMessage(threadId, { role: 'user', content })
          : await postMessage(threadId, { role: 'user', content });

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
        projectSops={projectSops}
        selectedProjectSOP={selectedProjectSOP}
        onSelectProjectSOP={handleProjectSOPSelect}
        onRefreshProjectSOPs={refreshProjectSOPs}
        onAddProjectSOP={handleAddProjectSOP}
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
          ) : selectedProjectSOP ? (
            <ProjectSOPPane
              projectSOP={activeProjectSOP}
              isEditing={isEditingProjectSOP}
              onToggleEdit={handleToggleProjectSOPEdit}
              editorValue={projectSOPEditorContent}
              onEditorChange={setProjectSOPEditorContent}
              titleValue={projectSOPTitleContent}
              onTitleChange={setProjectSOPTitleContent}
              onSave={handleSaveProjectSOP}
              onCancel={handleCancelProjectSOPEdit}
              isSaving={isSavingProjectSOP}
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
            defaultChatType="playbook"
          />
        </div>
      </main>

      <AddSOPModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleCreateSOP}
        isSaving={isCreatingSOP}
      />

      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={handleCloseAddProjectModal}
        onSave={handleCreateProject}
        isSaving={isCreatingProject}
        projects={projects}
      />

      <AddProjectSOPModal
        isOpen={isAddProjectSOPModalOpen}
        onClose={handleCloseAddProjectSOPModal}
        onSave={handleCreateProjectSOP}
        isSaving={isCreatingProjectSOP}
      />
    </div>
  );
}