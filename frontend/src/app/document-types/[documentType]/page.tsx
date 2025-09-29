'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AddSOPModal } from '@/app/components/AddSOPModal';
import { AddProjectModal } from '@/app/components/AddProjectModal';
import { AddProjectSOPModal } from '@/app/components/AddProjectSOPModal';
import { AppHeader } from '@/app/components/AppHeader';
import { ChatPane } from '@/app/components/ChatPane';
import { SOPPane } from '@/app/components/SOPPane';
import { ProjectDocumentPane } from '@/app/components/ProjectDocumentPane';
import { ProjectSOPPane } from '@/app/components/ProjectSOPPane';
import { createSOP, createThread, getSOP, getThread, getSOPSummaries, listThreads, postMessage, updateSOP, getProjectSummaries, getBusinessCases, getProjectCharters, getCurrentBusinessCase, getCurrentProjectCharter, updateBusinessCase, updateProjectCharter, createProject, createBusinessCase, createProjectCharter, getProjectSOPSummaries, getProjectSOP, createProjectSOP, updateProjectSOP } from '@/lib/api';
import { findSOPBySlug, titleToSlug, projectNameToSlug, documentTypeToSlug, findProjectSOPBySlug } from '@/lib/utils';
import { ChatMessage, ChatThread, SOP, SOPSummary, ProjectSummary, ProjectDocumentSelection, ProjectDocument, DocumentType, ProjectSOPSummary, ProjectSOPSelection, ProjectSOP } from '@/types';

interface DocumentTypePageProps {
  params: {
    documentType: string;
  };
}

export default function DocumentTypePage({ params }: DocumentTypePageProps) {
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

  const refreshSopSummaries = useCallback(async () => {
    try {
      const response = await getSOPSummaries();
      setSopSummaries(response.items);
    } catch (error) {
      console.error(error);
      setFeedback('Failed to load SOP list.');
    }
  }, []);

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

      // Find the project SOP based on document type slug and set it as selected
      const projectSOP = findProjectSOPBySlug(response.items, params.documentType);
      if (projectSOP) {
        setSelectedProjectSOP({ sopId: projectSOP.id });
      }
    } catch (error) {
      console.error(error);
      setFeedback('Failed to load document types.');
    }
  }, [params.documentType]);

  useEffect(() => {
    void refreshSopSummaries();
    void refreshThreads();
    void refreshProjects();
    void refreshProjectSOPs();
  }, [refreshSopSummaries, refreshThreads, refreshProjects, refreshProjectSOPs]);

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
    const project = projects.find(p => p.id === selection.projectId);
    if (project) {
      const projectSlug = projectNameToSlug(project.project_name);
      const documentTypeSlug = documentTypeToSlug(selection.documentType);
      router.push(`/projects/${projectSlug}/${documentTypeSlug}`);
    }
  };

  const handleAddProject = () => {
    setIsAddProjectModalOpen(true);
  };

  const handleCloseAddProjectModal = () => {
    setIsAddProjectModalOpen(false);
  };

  const handleCreateProject = async (data: {
    projectName: string;
    documentType: DocumentType;
    projectCode?: string;
    businessArea?: string;
    sponsor?: string;
  }) => {
    setIsCreatingProject(true);
    setFeedback(null);

    try {
      const newProject = await createProject({
        project_name: data.projectName,
        project_code: data.projectCode,
        business_area: data.businessArea,
        sponsor: data.sponsor,
        created_by: 'user'
      });

      let newDocument: ProjectDocument;
      if (data.documentType === 'business-case') {
        newDocument = await createBusinessCase(newProject.id, {
          title: `${data.projectName} Business Case`,
          business_area: data.businessArea,
          sponsor: data.sponsor,
          status: 'draft',
          created_by: 'user'
        });
      } else {
        newDocument = await createProjectCharter(newProject.id, {
          title: `${data.projectName} Project Charter`,
          sponsor: data.sponsor || 'TBD',
          status: 'draft',
          created_by: 'user'
        });
      }

      await refreshProjects();

      const projectSlug = projectNameToSlug(newProject.project_name);
      const documentTypeSlug = documentTypeToSlug(data.documentType);
      router.push(`/projects/${projectSlug}/${documentTypeSlug}`);

      setIsAddProjectModalOpen(false);
      setFeedback('Project created successfully.');

    } catch (error) {
      console.error(error);
      setFeedback('Failed to create project.');
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

      // Check if document type changed and update URL if needed
      const newDocumentTypeSlug = documentTypeToSlug(updated.document_type as DocumentType);
      if (newDocumentTypeSlug !== params.documentType) {
        router.replace(`/document-types/${newDocumentTypeSlug}`);
      }
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

      const documentTypeSlug = documentTypeToSlug(data.documentType as DocumentType);
      router.push(`/document-types/${documentTypeSlug}`);

      setIsAddProjectSOPModalOpen(false);
      setFeedback('Document type created successfully.');
    } catch (error) {
      console.error(error);
      setFeedback('Failed to create document type.');
    } finally {
      setIsCreatingProjectSOP(false);
    }
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
        projectSops={projectSops}
        selectedProjectSOP={selectedProjectSOP}
        onSelectProjectSOP={handleProjectSOPSelect}
        onRefreshProjectSOPs={refreshProjectSOPs}
        onAddProjectSOP={handleAddProjectSOP}
      />
      <main className="appMain">
        <div className="appColumn">
          {feedback && <div style={{ marginBottom: '0.75rem', color: '#d23939' }}>{feedback}</div>}
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

      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={handleCloseAddProjectModal}
        onSave={handleCreateProject}
        isSaving={isCreatingProject}
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