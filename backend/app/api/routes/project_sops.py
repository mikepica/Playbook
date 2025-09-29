from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.project_sop import (
    ProjectSOPCreate,
    ProjectSOPHistoryList,
    ProjectSOPList,
    ProjectSOPRead,
    ProjectSOPSummary,
    ProjectSOPUpdate,
)
from app.services import project_sop_service

router = APIRouter(prefix="/project-sops", tags=["project-sops"])


@router.get("/", response_model=ProjectSOPList)
def list_project_sops(db: Session = Depends(get_db)) -> ProjectSOPList:
    """List all global document type templates."""
    project_sops = project_sop_service.list_project_sops(db)
    return ProjectSOPList(
        items=[
            ProjectSOPSummary(
                id=sop.id,
                document_type=sop.document_type,
                title=sop.title,
                version=sop.version,
                display_order=sop.display_order,
                is_active=sop.is_active,
                updated_at=sop.updated_at,
            )
            for sop in project_sops
        ]
    )


@router.post("/", response_model=ProjectSOPRead, status_code=status.HTTP_201_CREATED)
def create_project_sop(payload: ProjectSOPCreate, db: Session = Depends(get_db)) -> ProjectSOPRead:
    """Create a new global document type template."""
    try:
        project_sop = project_sop_service.create_project_sop(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ProjectSOPRead(
        id=project_sop.id,
        document_type=project_sop.document_type,
        title=project_sop.title,
        version=project_sop.version,
        content=project_sop.content,
        display_order=project_sop.display_order,
        is_active=project_sop.is_active,
        created_at=project_sop.created_at,
        updated_at=project_sop.updated_at,
    )


@router.get("/{sop_id}", response_model=ProjectSOPRead)
def get_project_sop(sop_id: str, db: Session = Depends(get_db)) -> ProjectSOPRead:
    """Get a specific global document type template."""
    project_sop = project_sop_service.get_project_sop(db, sop_id)
    if project_sop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project SOP not found")

    return ProjectSOPRead(
        id=project_sop.id,
        document_type=project_sop.document_type,
        title=project_sop.title,
        version=project_sop.version,
        content=project_sop.content,
        display_order=project_sop.display_order,
        is_active=project_sop.is_active,
        created_at=project_sop.created_at,
        updated_at=project_sop.updated_at,
    )


@router.put("/{sop_id}", response_model=ProjectSOPRead)
def update_project_sop(sop_id: str, payload: ProjectSOPUpdate, db: Session = Depends(get_db)) -> ProjectSOPRead:
    """Update a global document type template."""
    project_sop = project_sop_service.get_project_sop(db, sop_id)
    if project_sop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project SOP not found")

    try:
        updated_sop = project_sop_service.update_project_sop(db, sop_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ProjectSOPRead(
        id=updated_sop.id,
        document_type=updated_sop.document_type,
        title=updated_sop.title,
        version=updated_sop.version,
        content=updated_sop.content,
        display_order=updated_sop.display_order,
        is_active=updated_sop.is_active,
        created_at=updated_sop.created_at,
        updated_at=updated_sop.updated_at,
    )


@router.delete("/{sop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_sop(sop_id: str, db: Session = Depends(get_db)) -> None:
    """Delete a global document type template."""
    project_sop = project_sop_service.get_project_sop(db, sop_id)
    if project_sop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project SOP not found")

    success = project_sop_service.delete_project_sop(db, sop_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project SOP not found")


@router.get("/{sop_id}/history", response_model=ProjectSOPHistoryList)
def list_project_sop_history(sop_id: str, db: Session = Depends(get_db)) -> ProjectSOPHistoryList:
    """List history for a global document type template."""
    project_sop = project_sop_service.get_project_sop(db, sop_id)
    if project_sop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project SOP not found")

    history_entries = project_sop_service.list_project_sop_history(db, sop_id)
    return ProjectSOPHistoryList(
        items=[
            {
                "id": entry.id,
                "project_sop_id": entry.project_sop_id,
                "document_type": entry.document_type,
                "title": entry.title,
                "version": entry.version,
                "content": entry.content,
                "edited_by": entry.edited_by,
                "created_at": entry.created_at,
            }
            for entry in history_entries
        ]
    )