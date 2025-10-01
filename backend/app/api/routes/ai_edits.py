from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.ai_edit import (
    AIEditApplyRequest,
    AIEditApplyResponse,
    AIEditErrorResponse,
    AIEditSuggestionRequest,
    AIEditSuggestionResponse,
    FieldSuggestion,
)
from app.services import ai_edit_service
from app.services.project_service import BusinessCaseService, ProjectCharterService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/suggest", response_model=AIEditSuggestionResponse)
async def generate_ai_suggestions(
    request: AIEditSuggestionRequest,
    db: Session = Depends(get_db)
) -> AIEditSuggestionResponse:
    """Generate AI suggestions for document edits based on ProjectSOP context."""

    try:
        # Get the current document data
        current_document: Dict[str, Any] = {}

        from uuid import UUID

        if request.document_type == 'business-case':
            # Get current business case for the project
            doc = BusinessCaseService.get_current_business_case(db, UUID(request.project_id))
            if not doc:
                raise HTTPException(status_code=404, detail="Business case not found")
            # Convert to dict, handling SQLAlchemy model
            current_document = {c.name: getattr(doc, c.name) for c in doc.__table__.columns}

        elif request.document_type == 'project-charter':
            # Get current project charter for the project
            doc = ProjectCharterService.get_current_project_charter(db, UUID(request.project_id))
            if not doc:
                raise HTTPException(status_code=404, detail="Project charter not found")
            # Convert to dict, handling SQLAlchemy model
            current_document = {c.name: getattr(doc, c.name) for c in doc.__table__.columns}

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported document type: {request.document_type}")

        # Generate AI suggestions
        suggestions_data = ai_edit_service.generate_ai_suggestions(
            db=db,
            document_type=request.document_type,
            current_document=current_document,
            user_instructions=request.user_instructions,
            project_id=request.project_id
        )

        # Validate suggestions_data structure
        if not isinstance(suggestions_data, dict):
            logger.error(f"AI returned non-dict response: {type(suggestions_data)}")
            raise ValueError("AI service returned invalid response structure")

        suggestions_dict = suggestions_data.get("suggestions", {})
        if not isinstance(suggestions_dict, dict):
            logger.error(f"AI suggestions field is not a dict: {type(suggestions_dict)}, value: {suggestions_dict}")
            raise ValueError("AI service returned invalid suggestions structure")

        # Convert suggestions to response format
        field_suggestions = {}
        for field_name, suggestion_data in suggestions_dict.items():
            if not isinstance(suggestion_data, dict):
                logger.warning(f"Skipping field {field_name}: suggestion_data is {type(suggestion_data)}, not dict")
                continue

            try:
                field_suggestions[field_name] = FieldSuggestion(
                    current_value=suggestion_data.get("current_value"),
                    suggested_value=suggestion_data.get("suggested_value"),
                    reason=suggestion_data.get("reason", "No reason provided")
                )
            except Exception as e:
                logger.warning(f"Skipping field {field_name}: failed to create FieldSuggestion: {e}")
                continue

        return AIEditSuggestionResponse(
            suggestions=field_suggestions,
            overall_reasoning=suggestions_data.get("overall_reasoning", ""),
            document_type=request.document_type,
            project_id=request.project_id,
            document_id=request.document_id
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"AI suggestion generation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error generating AI suggestions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/apply", response_model=AIEditApplyResponse)
async def apply_ai_suggestions(
    request: AIEditApplyRequest,
    db: Session = Depends(get_db)
) -> AIEditApplyResponse:
    """Apply the accepted AI suggestions to the document."""

    try:
        updated_document = ai_edit_service.apply_ai_suggestions(
            db=db,
            document_type=request.document_type,
            project_id=request.project_id,
            document_id=request.document_id,
            accepted_changes=request.accepted_changes,
            user_id=request.user_id or "ai_user"
        )

        # Convert updated document to dict for response
        if hasattr(updated_document, '__table__'):
            # SQLAlchemy model
            document_dict = {c.name: getattr(updated_document, c.name) for c in updated_document.__table__.columns}
        else:
            # Already a dict
            document_dict = updated_document

        return AIEditApplyResponse(
            success=True,
            updated_document=document_dict,
            message="Changes applied successfully"
        )

    except ValueError as e:
        logger.error(f"AI suggestion application failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error applying AI suggestions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")