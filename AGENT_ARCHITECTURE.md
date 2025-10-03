# Agent Architecture - High-Level Design

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER INTERFACE                                │
│  (Next.js Frontend - Chat, Document Editing, SOP Viewing)               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   FastAPI Backend       │
                    │   API Routes Layer      │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────▼────────┐    ┌─────────▼─────────┐    ┌────────▼────────┐
│  Chat Routes   │    │  AI Edit Routes   │    │  Project Routes │
│  /api/chat     │    │  /api/ai-edits    │    │  /api/projects  │
└───────┬────────┘    └─────────┬─────────┘    └────────┬────────┘
        │                       │                        │
        └───────────────┬───────┴────────────────────────┘
                        │
        ┌───────────────▼────────────────┐
        │   AGENT ORCHESTRATION LAYER    │
        │  (Claude Agent SDK)            │
        └───────────────┬────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
┌───────▼──────────┐          ┌─────────▼──────────┐
│ SOP Query Agent  │          │ Document Editor    │
│                  │          │ Agent              │
│ - Retrieves SOPs │          │ - Suggests edits   │
│ - Filters by tags│          │ - Applies changes  │
│ - Packs context  │          │ - Validates data   │
└───────┬──────────┘          └─────────┬──────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼────────────────────────────┐
        │         DATABASE LAYER                     │
        │         (PostgreSQL)                       │
        │                                            │
        │  ┌──────────┐  ┌──────────────┐          │
        │  │   SOPs   │  │ SOP Sections │          │
        │  └─────┬────┘  └──────┬───────┘          │
        │        │               │                   │
        │  ┌─────▼───────────────▼────────┐         │
        │  │   Audit Logs / Agent Notes   │         │
        │  └──────────────────────────────┘         │
        │                                            │
        │  ┌──────────┐  ┌─────────────────┐        │
        │  │ Projects │  │ Business Cases  │        │
        │  └──────────┘  │ Project Charters│        │
        │                └─────────────────┘        │
        └────────────────────────────────────────────┘
```

---

## Database Schema - Initial Implementation

### Core SOP Tables

```
┌──────────────────────────────────────────────────────┐
│                    sops                              │
├──────────────────────────────────────────────────────┤
│ id                 UUID PRIMARY KEY                  │
│ title              VARCHAR(255) UNIQUE               │
│ description        TEXT                              │
│ category           VARCHAR(100)                      │
│ tags               TEXT[]  ← Tag-based filtering     │
│ applies_to         TEXT[]  ← Document types          │
│ full_content       JSONB   ← Complete doc cache      │
│ version            INTEGER                           │
│ display_order      INTEGER                           │
│ view_count         INTEGER                           │
│ reference_count    INTEGER ← Agent usage tracking    │
│ created_at         TIMESTAMPTZ                       │
│ updated_at         TIMESTAMPTZ                       │
└──────────────────────────────────────────────────────┘
                    │
                    │ 1:N
                    ▼
┌──────────────────────────────────────────────────────┐
│               sop_sections                           │
├──────────────────────────────────────────────────────┤
│ id                 UUID PRIMARY KEY                  │
│ sop_id             UUID → sops(id)                   │
│ parent_section_id  UUID → sop_sections(id)           │
│ section_number     VARCHAR(20)  "1.2.3"              │
│ title              VARCHAR(255)                      │
│ content            TEXT  ← Markdown content          │
│ tags               TEXT[] ← Section-level tags       │
│ token_count        INTEGER ← Pre-calculated          │
│ importance_level   INTEGER (1-5)                     │
│ usage_count        INTEGER ← How often loaded        │
│ last_used_at       TIMESTAMPTZ                       │
│ references_sections UUID[]                           │
│ references_concepts TEXT[]                           │
│ metadata           JSONB ← Flexible extras           │
│ display_order      INTEGER                           │
│ depth_level        INTEGER (0=root, 1=nested)        │
│ created_at         TIMESTAMPTZ                       │
│ updated_at         TIMESTAMPTZ                       │
└──────────────────────────────────────────────────────┘

Indexes:
- idx_sop_sections_tags (GIN on tags)
- idx_sop_sections_token_count
- idx_sop_sections_importance
```

### Audit & Agent Tracking Tables

```
┌──────────────────────────────────────────────────────────────┐
│              ai_interaction_logs                             │
├──────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ interaction_type      VARCHAR(50)  'chat', 'edit', 'create'  │
│ user_id               VARCHAR(255)                           │
│                                                              │
│ ── Context References ──                                     │
│ thread_id             UUID → chat_threads(id)               │
│ project_id            UUID → projects(id)                    │
│ sop_id                UUID → sops(id)                        │
│ document_type         VARCHAR(50)                            │
│                                                              │
│ ── Request Data ──                                           │
│ user_prompt           TEXT                                   │
│ system_prompt         TEXT                                   │
│ context_data          JSONB  ← SOPs/sections loaded         │
│                                                              │
│ ── Response Data ──                                          │
│ ai_response           TEXT                                   │
│ response_metadata     JSONB  ← Tokens, latency, model       │
│                                                              │
│ ── Outcome Tracking ──                                       │
│ user_feedback         VARCHAR(20)  'accepted', 'rejected'    │
│ changes_applied       JSONB  ← What was saved                │
│                                                              │
│ ── Agent Details ──                                          │
│ agent_name            VARCHAR(100)                           │
│ agent_session_id      UUID                                   │
│ agent_tools_used      JSONB  ← Tools/subagents invoked      │
│                                                              │
│ created_at            TIMESTAMPTZ                            │
│ processed_at          TIMESTAMPTZ  ← Meta-analysis timestamp │
│ improvement_suggestions JSONB  ← AI-generated insights      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   agent_notes                                │
├──────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ agent_name            VARCHAR(100)                           │
│ agent_session_id      UUID  ← Groups notes from one run     │
│                                                              │
│ ── Context Links ──                                          │
│ related_thread_id     UUID → chat_threads(id)               │
│ related_project_id    UUID → projects(id)                    │
│ related_sop_id        UUID → sops(id)                        │
│                                                              │
│ ── Note Content ──                                           │
│ note_type             VARCHAR(50)  'observation', 'plan'     │
│ note_content          TEXT                                   │
│ note_metadata         JSONB  ← Tags, confidence, etc        │
│                                                              │
│ is_active             BOOLEAN                                │
│ invalidated_at        TIMESTAMPTZ                            │
│ created_at            TIMESTAMPTZ                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                agent_decisions                               │
├──────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ agent_name            VARCHAR(100)                           │
│ agent_session_id      UUID                                   │
│ decision_point        TEXT  ← What was being decided         │
│ options_considered    JSONB  ← [{option, pros, cons}]       │
│ decision_made         TEXT                                   │
│ reasoning             TEXT                                   │
│ related_notes         UUID[]  ← Links to agent_notes        │
│ sops_consulted        UUID[]  ← Which SOPs influenced this  │
│ outcome_success       BOOLEAN                                │
│ created_at            TIMESTAMPTZ                            │
└──────────────────────────────────────────────────────────────┘
```

---

## Agent Flow Diagrams

### Flow 1: Chat Q&A with SOP Context

```
USER ASKS QUESTION
      │
      ▼
┌─────────────────────────────────────────────┐
│ POST /api/chat/threads/{id}/messages        │
│ - User message: "What's required for        │
│   business case approval?"                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ chat_service.append_message()               │
│ 1. Save user message to DB                  │
│ 2. Invoke SOP Query Agent                   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ SOP QUERY AGENT (Claude Agent SDK)                      │
│                                                          │
│ Tools Available:                                         │
│ ├─ get_sop_sections(tags, max_tokens)                   │
│ ├─ search_sops(query)                                    │
│ └─ get_table_of_contents()                              │
│                                                          │
│ Process:                                                 │
│ 1. Analyze user question                                │
│ 2. Identify relevant tags: ["business_case",            │
│    "approval", "financial"]                             │
│ 3. Call get_sop_sections(tags=..., max_tokens=6000)     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ SOPRetrievalService.get_sections_for_agent()            │
│                                                          │
│ SQL Query:                                               │
│   SELECT * FROM sop_sections                            │
│   WHERE tags && ARRAY['business_case', 'approval']      │
│   ORDER BY importance_level DESC, usage_count DESC      │
│                                                          │
│ Token Packing:                                           │
│   sections = []                                          │
│   used_tokens = 0                                        │
│   for section in results:                               │
│     if used_tokens + section.token_count <= 6000:       │
│       sections.append(section)                          │
│       used_tokens += section.token_count                │
│                                                          │
│ Returns: [Section1, Section2, Section3]                 │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ SOP QUERY AGENT receives sections                       │
│ Formats context:                                         │
│                                                          │
│ ## Business Case Template                               │
│ Content of section...                                   │
│                                                          │
│ ## Approval Requirements                                │
│ Content of section...                                   │
│                                                          │
│ Generates response using Claude with context            │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ LOG INTERACTION                                          │
│                                                          │
│ INSERT INTO ai_interaction_logs:                         │
│ - interaction_type: 'chat'                              │
│ - user_prompt: "What's required..."                     │
│ - context_data: {                                        │
│     "sections_loaded": ["uuid1", "uuid2", "uuid3"],     │
│     "total_tokens": 4500,                               │
│     "tags_used": ["business_case", "approval"]          │
│   }                                                      │
│ - agent_name: 'sop_query_agent'                         │
│ - agent_session_id: session_uuid                         │
│ - ai_response: "To get approval..."                     │
│                                                          │
│ UPDATE sop_sections:                                     │
│   usage_count = usage_count + 1                         │
│   WHERE id IN (uuid1, uuid2, uuid3)                     │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ RETURN RESPONSE TO USER                                  │
│ "To get approval for a business case, you need:         │
│  1. Executive sponsor sign-off [SOP: Business Case]     │
│  2. Financial analysis with ROI [SOP: Financial]..."    │
└──────────────────────────────────────────────────────────┘
```

### Flow 2: AI Document Edit Suggestions

```
USER REQUESTS EDIT
      │
      ▼
┌─────────────────────────────────────────────┐
│ POST /api/ai-edits/suggest                  │
│ - document_type: "business_case"            │
│ - project_id: "uuid"                        │
│ - instructions: "Add risk analysis section" │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ ai_edit_service.generate_ai_suggestions()   │
│ 1. Get current document from DB             │
│ 2. Get relevant ProjectSOP                  │
│ 3. Invoke Document Editor Agent             │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ DOCUMENT EDITOR AGENT (Claude Agent SDK)                │
│                                                          │
│ Tools Available:                                         │
│ ├─ get_document(project_id, doc_type)                   │
│ ├─ get_sop_sections(tags=["business_case", "risk"])     │
│ ├─ validate_field_schema(field, value)                  │
│ └─ record_decision(what, why)                           │
│                                                          │
│ Process:                                                 │
│ 1. Load current document                                │
│ 2. Load relevant SOP sections (tagged "risk")           │
│ 3. Analyze gap between document and SOP requirements    │
│ 4. Generate structured suggestions                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ Agent calls: get_sop_sections(tags=["risk", "business_case"])│
│                                                          │
│ SOPRetrievalService returns:                             │
│ - Section: "Risk Assessment Framework"                  │
│ - Section: "Business Case Risk Analysis"                │
│ - Section: "Mitigation Strategy Template"               │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ Agent generates suggestions:                             │
│ {                                                        │
│   "suggestions": {                                       │
│     "risks": {                                           │
│       "current_value": [],                              │
│       "suggested_value": [                              │
│         {"risk": "Budget overrun",                      │
│          "impact": "High",                              │
│          "mitigation": "Monthly reviews"}               │
│       ],                                                 │
│       "reason": "SOP requires risk analysis [Section    │
│                  3.2: Risk Assessment]"                 │
│     }                                                    │
│   }                                                      │
│ }                                                        │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ Agent records decision:                                  │
│                                                          │
│ INSERT INTO agent_decisions:                             │
│ - decision_point: "Which risk fields to populate"       │
│ - options_considered: [                                  │
│     {"option": "Minimal (just list risks)",             │
│      "pros": ["Quick"], "cons": ["Incomplete"]},        │
│     {"option": "Full (risk+impact+mitigation)",         │
│      "pros": ["SOP compliant"], "cons": []}             │
│   ]                                                      │
│ - decision_made: "Full format per SOP Section 3.2"      │
│ - sops_consulted: [section_uuid_1, section_uuid_2]      │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ LOG INTERACTION                                          │
│                                                          │
│ INSERT INTO ai_interaction_logs:                         │
│ - interaction_type: 'edit_suggestion'                   │
│ - project_id: project_uuid                              │
│ - user_prompt: "Add risk analysis section"              │
│ - context_data: {                                        │
│     "document_type": "business_case",                   │
│     "sections_loaded": ["uuid4", "uuid5"],              │
│     "current_document_state": {...}                     │
│   }                                                      │
│ - agent_name: 'document_editor_agent'                   │
│ - agent_session_id: session_uuid                         │
│ - ai_response: JSON suggestions                         │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ RETURN SUGGESTIONS TO USER                               │
│ User reviews in UI:                                      │
│ ✓ Accept risk field suggestions                         │
│ ✗ Reject opportunities suggestions                      │
└─────────────────┬────────────────────────────────────────┘
                  │
      USER ACCEPTS SOME SUGGESTIONS
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ POST /api/ai-edits/apply                                 │
│ - accepted_changes: {risks: [...]}                      │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ ai_edit_service.apply_ai_suggestions()                   │
│ 1. Validate changes                                      │
│ 2. Update document in DB                                 │
│ 3. Log outcome                                           │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ UPDATE LOG with outcome:                                 │
│                                                          │
│ UPDATE ai_interaction_logs                               │
│ SET user_feedback = 'accepted',                         │
│     changes_applied = {"risks": [...]}                  │
│ WHERE id = log_uuid                                      │
└──────────────────────────────────────────────────────────┘
```

### Flow 3: Meta-Analysis (Weekly Batch Job)

```
SCHEDULED TASK (Weekly)
      │
      ▼
┌─────────────────────────────────────────────┐
│ meta_analysis_service.analyze_logs()        │
│ - Get logs from past 7 days                 │
│ - Group by interaction_type                 │
│ - Invoke Meta-Analysis Agent                │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ Query logs:                                              │
│                                                          │
│ SELECT * FROM ai_interaction_logs                        │
│ WHERE created_at > NOW() - INTERVAL '7 days'            │
│   AND user_feedback IS NOT NULL                         │
│                                                          │
│ GROUP BY interaction_type, user_feedback                │
│                                                          │
│ Results:                                                 │
│ - 45 chat interactions (38 accepted, 7 rejected)        │
│ - 23 edit suggestions (18 accepted, 5 rejected)         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ META-ANALYSIS AGENT (Claude Agent SDK)                   │
│                                                          │
│ Tools Available:                                         │
│ ├─ get_logs(days_back, filters)                         │
│ ├─ get_sop(sop_id)                                       │
│ ├─ analyze_patterns(logs)                               │
│ └─ suggest_improvements(analysis)                       │
│                                                          │
│ Analyzes patterns:                                       │
│ 1. Rejected suggestions - why?                          │
│ 2. Repeated questions - missing SOP clarity?            │
│ 3. Agent decisions - suboptimal reasoning?              │
│ 4. Context selection - wrong sections loaded?           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ Agent identifies patterns:                               │
│                                                          │
│ Pattern 1: "5 users asked about budget approval          │
│            thresholds, SOP Section 2.3 doesn't           │
│            clearly specify amounts"                      │
│                                                          │
│ Pattern 2: "Risk suggestions often rejected because      │
│            AI suggests too generic mitigations"          │
│                                                          │
│ Pattern 3: "Users asking same question about             │
│            'escalation process' repeatedly"              │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ INSERT INTO sop_improvement_suggestions:                 │
│                                                          │
│ Suggestion 1:                                            │
│ - sop_id: business_case_sop_uuid                        │
│ - based_on_log_ids: [log1, log2, log3, log4, log5]     │
│ - analysis_summary: "Budget threshold clarity needed"   │
│ - suggested_changes: {                                   │
│     "section": "2.3 Approval Requirements",             │
│     "current": "Executive approval required for large...",│
│     "suggested": "Executive approval required for:      │
│                   - Budgets > $500K                     │
│                   - Cross-divisional projects...",      │
│     "reason": "5 users asked for specific thresholds"   │
│   }                                                      │
│ - improvement_type: "clarity"                           │
│ - priority: "high"                                       │
│ - status: "pending_review"                              │
│                                                          │
│ Suggestion 2:                                            │
│ - suggested_changes: {                                   │
│     "system_prompt": "edit_suggestion_agent",           │
│     "change": "Add instruction: 'For risk mitigations,  │
│                provide specific, actionable steps       │
│                rather than generic statements'"         │
│   }                                                      │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│ HUMAN REVIEW WORKFLOW                                    │
│                                                          │
│ Admin UI shows pending suggestions:                      │
│ ┌────────────────────────────────────────────┐          │
│ │ SOP Improvement: Budget Threshold Clarity  │          │
│ │ Priority: HIGH                             │          │
│ │ Based on 5 user interactions               │          │
│ │                                            │          │
│ │ [View Details] [Approve] [Reject] [Edit]  │          │
│ └────────────────────────────────────────────┘          │
│                                                          │
│ Human approves → Suggestion applied to SOP               │
│ Human rejects → Marked as rejected with notes            │
└──────────────────────────────────────────────────────────┘
```

---

## Agent Architecture Components

### 1. Agent Orchestrator (Main Entry Point)

```python
# backend/app/services/agent_orchestrator.py

from claude_agent_sdk import Agent, Tool

class AgentOrchestrator:
    """Main orchestrator for all agent operations"""

    def __init__(self, db: Session):
        self.db = db
        self.session_id = uuid.uuid4()

        # Initialize agents
        self.sop_query_agent = self._build_sop_query_agent()
        self.document_editor_agent = self._build_document_editor_agent()
        self.meta_analysis_agent = self._build_meta_analysis_agent()

    def _build_sop_query_agent(self) -> Agent:
        """Agent for answering questions using SOPs"""

        tools = [
            Tool(
                name="get_sop_sections",
                description="Retrieve SOP sections by tags with token budget",
                function=self._tool_get_sop_sections
            ),
            Tool(
                name="get_table_of_contents",
                description="Get hierarchical TOC of all SOPs",
                function=self._tool_get_toc
            )
        ]

        system_prompt = """You are an SOP expert assistant.
        Use the provided tools to find relevant SOP sections and answer
        user questions. Always cite which SOP sections you're referencing."""

        return Agent(
            name="sop_query_agent",
            model="claude-3-5-sonnet-20241022",
            system_prompt=system_prompt,
            tools=tools
        )

    def handle_chat_query(self, query: str, thread_id: UUID) -> str:
        """Route chat query to SOP query agent"""

        # Log interaction start
        log_id = self._start_interaction_log(
            interaction_type='chat',
            user_prompt=query,
            thread_id=thread_id
        )

        # Invoke agent
        response = self.sop_query_agent.run(query)

        # Log interaction complete
        self._complete_interaction_log(
            log_id=log_id,
            ai_response=response,
            agent_name='sop_query_agent'
        )

        return response
```

### 2. SOP Retrieval Service (Tool Implementation)

```python
# backend/app/services/sop_retrieval_service.py

class SOPRetrievalService:
    """Handles SOP section retrieval with tag-based filtering and token packing"""

    def get_sections_for_agent(
        self,
        db: Session,
        tags: list[str] = None,
        max_tokens: int = 8000,
        importance_threshold: int = 2
    ) -> list[SOPSection]:
        """
        Retrieve SOP sections optimized for agent context window.

        Strategy:
        1. Filter by tags (if provided)
        2. Rank by importance + usage
        3. Pack into token budget
        4. Track usage for analytics
        """

        query = db.query(SOPSection)

        # Filter by tags
        if tags:
            query = query.filter(SOPSection.tags.overlap(tags))

        # Filter by importance
        query = query.filter(SOPSection.importance_level >= importance_threshold)

        # Order by importance and usage
        query = query.order_by(
            SOPSection.importance_level.desc(),
            SOPSection.usage_count.desc()
        )

        # Token packing (knapsack algorithm)
        sections = []
        used_tokens = 0

        for section in query.all():
            if used_tokens + section.token_count <= max_tokens:
                sections.append(section)
                used_tokens += section.token_count

                # Track usage
                section.usage_count += 1
                section.last_used_at = datetime.utcnow()
            else:
                break

        db.commit()

        return sections

    def get_table_of_contents(self, db: Session) -> dict:
        """Get hierarchical structure of all SOPs"""

        # Query materialized view
        toc = db.execute(
            text("SELECT * FROM sop_table_of_contents ORDER BY path")
        ).fetchall()

        # Build nested structure
        return self._build_toc_tree(toc)
```

### 3. Audit Logging Service

```python
# backend/app/services/audit_service.py

class AuditService:
    """Centralized audit logging for all agent interactions"""

    def log_interaction(
        self,
        db: Session,
        interaction_type: str,
        agent_name: str,
        agent_session_id: UUID,
        user_prompt: str,
        ai_response: str,
        context_data: dict,
        **kwargs
    ) -> UUID:
        """Log an AI interaction for audit and meta-analysis"""

        log = AIInteractionLog(
            interaction_type=interaction_type,
            agent_name=agent_name,
            agent_session_id=agent_session_id,
            user_prompt=user_prompt,
            ai_response=ai_response,
            context_data=context_data,
            **kwargs
        )

        db.add(log)
        db.commit()
        db.refresh(log)

        return log.id

    def update_interaction_outcome(
        self,
        db: Session,
        log_id: UUID,
        user_feedback: str,
        changes_applied: dict = None
    ):
        """Update log with user's response to AI suggestion"""

        log = db.get(AIInteractionLog, log_id)
        log.user_feedback = user_feedback
        log.changes_applied = changes_applied

        db.commit()
```

---

## Integration Points with Existing Code

### Update: [chat_service.py](backend/app/services/chat_service.py)

```python
# Replace direct llm_client calls with agent orchestrator

def append_message(...):
    # OLD:
    # assistant_content = llm_client.generate_reply(conversation)

    # NEW:
    orchestrator = AgentOrchestrator(db)
    assistant_content = orchestrator.handle_chat_query(
        query=data.content,
        thread_id=thread_id
    )
```

### Update: [ai_edit_service.py](backend/app/services/ai_edit_service.py)

```python
# Replace direct LLM calls with document editor agent

def generate_ai_suggestions(...):
    # OLD:
    # ai_response = llm_client.generate_reply(messages)

    # NEW:
    orchestrator = AgentOrchestrator(db)
    suggestions = orchestrator.handle_edit_request(
        document_type=document_type,
        current_document=current_document,
        user_instructions=user_instructions,
        project_id=project_id
    )
```

---

## Summary: Key Benefits

1. **Tag-Based Retrieval** → Deterministic, explainable SOP loading
2. **Token Packing** → Efficient context window usage
3. **Audit Trail** → Every interaction logged for compliance
4. **Usage Tracking** → Know which sections agents use most
5. **Meta-Analysis** → AI learns from patterns, suggests improvements
6. **Human Oversight** → All improvements require approval
7. **Agent Memory** → Notes and decisions tracked for complex reasoning
8. **Modular Design** → Easy to add new agents (e.g., risk_analyzer_agent)

This architecture gives you a production-ready foundation that scales from 10 SOPs to 1000+.
