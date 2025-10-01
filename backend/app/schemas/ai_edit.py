from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class AIEditSuggestionRequest(BaseModel):
    """Request model for generating AI edit suggestions."""

    document_type: str = Field(..., description="Type of document (business-case, project-charter)")
    project_id: str = Field(..., description="ID of the project")
    document_id: str = Field(..., description="ID of the document")
    user_instructions: str = Field(..., description="User's instructions for what changes to make")


class FieldSuggestion(BaseModel):
    """Model for a single field suggestion."""

    current_value: Any = Field(..., description="Current value of the field")
    suggested_value: Any = Field(..., description="AI suggested new value")
    reason: str = Field(..., description="Explanation of why this change is suggested")


class AIEditSuggestionResponse(BaseModel):
    """Response model for AI edit suggestions."""

    suggestions: Dict[str, FieldSuggestion] = Field(..., description="Field-level suggestions")
    overall_reasoning: str = Field(..., description="High-level explanation of suggested changes")
    document_type: str = Field(..., description="Type of document the suggestions are for")
    project_id: str = Field(..., description="ID of the project")
    document_id: str = Field(..., description="ID of the document")


class AIEditApplyRequest(BaseModel):
    """Request model for applying AI edit suggestions."""

    document_type: str = Field(..., description="Type of document (business-case, project-charter)")
    project_id: str = Field(..., description="ID of the project")
    document_id: str = Field(..., description="ID of the document")
    accepted_changes: Dict[str, Any] = Field(..., description="Dictionary of field names to new values that user accepted")
    user_id: Optional[str] = Field("ai_user", description="ID of user applying changes")


class AIEditApplyResponse(BaseModel):
    """Response model for applying AI edit suggestions."""

    success: bool = Field(..., description="Whether the changes were applied successfully")
    updated_document: Dict[str, Any] = Field(..., description="The updated document data")
    message: str = Field(..., description="Success or error message")


class AIEditErrorResponse(BaseModel):
    """Error response model for AI edit operations."""

    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Additional error details")