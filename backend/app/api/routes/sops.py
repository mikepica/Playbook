from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.sop import (
    SOPCreate,
    SOPHistoryList,
    SOPHistoryRead,
    SOPList,
    SOPRead,
    SOPSummary,
    SOPUpdate,
)
from app.services import sop_service

router = APIRouter(prefix="/sops", tags=["sops"])


@router.get("/", response_model=SOPList)
def list_sops(db: Session = Depends(get_db)) -> SOPList:
    sops = sop_service.list_sops(db)
    return SOPList(
        items=[
            SOPSummary(
                id=sop.id,
                title=sop.title,
                version=sop.version,
                display_order=sop.display_order,
                updated_at=sop.updated_at,
            )
            for sop in sops
        ]
    )


@router.post("/", response_model=SOPRead, status_code=status.HTTP_201_CREATED)
def create_sop(payload: SOPCreate, db: Session = Depends(get_db)) -> SOPRead:
    sop = sop_service.create_sop(db, payload)
    return SOPRead(
        id=sop.id,
        title=sop.title,
        version=sop.version,
        content=sop.content,
        display_order=sop.display_order,
        created_at=sop.created_at,
        updated_at=sop.updated_at,
    )


@router.get("/{sop_id}", response_model=SOPRead)
def get_sop(sop_id: str, db: Session = Depends(get_db)) -> SOPRead:
    sop = sop_service.get_sop(db, sop_id)
    if sop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")

    return SOPRead(
        id=sop.id,
        title=sop.title,
        version=sop.version,
        content=sop.content,
        display_order=sop.display_order,
        created_at=sop.created_at,
        updated_at=sop.updated_at,
    )


@router.put("/{sop_id}", response_model=SOPRead)
def update_sop(sop_id: str, payload: SOPUpdate, db: Session = Depends(get_db)) -> SOPRead:
    try:
        sop = sop_service.update_sop(db, sop_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return SOPRead(
        id=sop.id,
        title=sop.title,
        version=sop.version,
        content=sop.content,
        display_order=sop.display_order,
        created_at=sop.created_at,
        updated_at=sop.updated_at,
    )


@router.get("/{sop_id}/history", response_model=SOPHistoryList)
def list_history(sop_id: str, db: Session = Depends(get_db)) -> SOPHistoryList:
    sop = sop_service.get_sop(db, sop_id)
    if sop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")

    history_entries = sop_service.list_sop_history(db, sop_id)
    return SOPHistoryList(
        items=[
            SOPHistoryRead(
                id=entry.id,
                sop_id=entry.sop_id,
                title=entry.title,
                version=entry.version,
                content=entry.content,
                edited_by=entry.edited_by,
                created_at=entry.created_at,
            )
            for entry in history_entries
        ]
    )
