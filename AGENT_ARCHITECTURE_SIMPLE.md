# Agent Architecture - Simple Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│              (Next.js Frontend - React)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   FASTAPI BACKEND                           │
│                     (API Layer)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────┐
│              AGENT ORCHESTRATION LAYER                      │
│              (Claude Agent SDK)                             │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  SOP Query Agent │  │ Document Editor  │               │
│  │                  │  │     Agent        │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐                                      │
│  │ Meta-Analysis    │                                      │
│  │     Agent        │                                      │
│  └──────────────────┘                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   DATABASE LAYER                            │
│                   (PostgreSQL)                              │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │    SOPs     ├────┤SOP Sections │    │   Projects  │    │
│  └─────────────┘    └──────┬──────┘    └─────────────┘    │
│                             │                               │
│  ┌──────────────────────────▼──────────────────────┐       │
│  │         AI Interaction Logs                     │       │
│  │         (Audit Trail)                           │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐                        │
│  │Agent Notes  │    │Agent        │                        │
│  │             │    │Decisions    │                        │
│  └─────────────┘    └─────────────┘                        │
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │  SOP Improvement Suggestions         │                  │
│  │  (Human Review Queue)                │                  │
│  └──────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Agents

### 1. SOP Query Agent
- Answers user questions using SOPs
- Retrieves relevant sections by tags
- Cites sources in responses

### 2. Document Editor Agent
- Suggests edits to business cases and project charters
- Uses SOPs as guidelines
- Validates changes against schema

### 3. Meta-Analysis Agent
- Analyzes interaction logs weekly
- Identifies patterns and issues
- Suggests SOP improvements and prompt refinements

---

## Core Database Tables

### SOP Management
- **sops** → Main SOP documents
- **sop_sections** → Hierarchical sections with tags and token counts

### Project Management
- **projects** → Project metadata
- **business_cases** → Business case documents
- **project_charters** → Charter documents
- **project_sops** → SOP templates for documents

### Audit & Learning
- **ai_interaction_logs** → All agent interactions and outcomes
- **agent_notes** → Agent working memory during tasks
- **agent_decisions** → Decision points with reasoning
- **sop_improvement_suggestions** → AI-generated improvements pending human review

### Chat
- **chat_threads** → Conversation threads
- **chat_messages** → User and AI messages

---

## Data Flow

### User Question → Answer
```
User Question
    ↓
SOP Query Agent
    ↓
SOP Retrieval (tags + token packing)
    ↓
Response with citations
    ↓
Log to ai_interaction_logs
```

### Edit Request → Suggestions
```
User Edit Request
    ↓
Document Editor Agent
    ↓
Load document + relevant SOP sections
    ↓
Generate suggestions
    ↓
Log to ai_interaction_logs
    ↓
User accepts/rejects
    ↓
Update log with outcome
```

### Weekly Meta-Analysis
```
Scheduled Job
    ↓
Meta-Analysis Agent
    ↓
Query ai_interaction_logs (past 7 days)
    ↓
Identify patterns
    ↓
Generate improvement suggestions
    ↓
Save to sop_improvement_suggestions
    ↓
Human reviews and approves/rejects
```

---

## Key Relationships

```
sops (1) ──────── (N) sop_sections
                        │
                        │ used by
                        ↓
                  SOP Query Agent
                        │
                        │ logs to
                        ↓
              ai_interaction_logs
                        │
                        │ analyzed by
                        ↓
              Meta-Analysis Agent
                        │
                        │ creates
                        ↓
        sop_improvement_suggestions
```

```
projects (1) ──────── (N) business_cases
                            │
                            │ edited by
                            ↓
                  Document Editor Agent
                            │
                            │ uses
                            ↓
                      sop_sections
                            │
                            │ logs to
                            ↓
                  ai_interaction_logs
```

---

## Implementation Phases

**Phase 1: Foundation**
- Create sop_sections table
- Build SOP Query Agent
- Implement audit logging

**Phase 2: Document Editing**
- Create Document Editor Agent
- Tag-based section retrieval
- Edit suggestion workflow

**Phase 3: Meta-Analysis**
- Create Meta-Analysis Agent
- Human review workflow
- Self-improvement loop

**Phase 4: Enhancements**
- Add vector embeddings (RAG)
- Knowledge graph relationships
- Advanced analytics
