from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import SOP, SOPHistory
from app.schemas.sop import SOPCreate, SOPUpdate


def list_sops(db: Session) -> list[SOP]:
    stmt = select(SOP).order_by(SOP.updated_at.desc())
    result = db.execute(stmt)
    return result.scalars().all()


def get_sop(db: Session, sop_id: str) -> SOP | None:
    return db.get(SOP, sop_id)


def create_sop(db: Session, data: SOPCreate) -> SOP:
    sop = SOP(title=data.title, content=data.content)
    db.add(sop)
    db.commit()
    db.refresh(sop)
    return sop


def update_sop(db: Session, sop_id: str, data: SOPUpdate) -> SOP:
    sop = db.get(SOP, sop_id)
    if sop is None:
        raise ValueError("SOP not found")

    updated = False

    new_title = sop.title
    if data.title is not None and data.title != sop.title:
        new_title = data.title
        updated = True

    new_content = sop.content
    if data.content is not None and data.content != sop.content:
        new_content = data.content
        updated = True

    if not updated:
        raise ValueError("No changes detected; update skipped")

    history_entry = SOPHistory(
        sop_id=sop.id,
        title=sop.title,
        version=sop.version,
        content=sop.content,
        edited_by=data.edited_by,
    )
    db.add(history_entry)

    sop.title = new_title
    sop.content = new_content
    sop.version += 1

    db.commit()
    db.refresh(sop)
    return sop


def list_sop_history(db: Session, sop_id: str) -> list[SOPHistory]:
    stmt = select(SOPHistory).where(SOPHistory.sop_id == sop_id).order_by(SOPHistory.created_at.desc())
    result = db.execute(stmt)
    return result.scalars().all()
