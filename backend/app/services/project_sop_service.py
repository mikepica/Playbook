from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import ProjectSOP, ProjectSOPHistory
from app.schemas.project_sop import ProjectSOPCreate, ProjectSOPUpdate


def list_project_sops(db: Session) -> list[ProjectSOP]:
    """List all global document type templates"""
    stmt = (
        select(ProjectSOP)
        .where(ProjectSOP.is_active == True)
        .order_by(ProjectSOP.display_order.asc(), ProjectSOP.updated_at.desc())
    )
    result = db.execute(stmt)
    return result.scalars().all()


def get_project_sop(db: Session, project_sop_id: str) -> ProjectSOP | None:
    return db.get(ProjectSOP, project_sop_id)


def get_project_sop_by_document_type(db: Session, document_type: str) -> ProjectSOP | None:
    """Get document type template by document type"""
    stmt = select(ProjectSOP).where(ProjectSOP.document_type == document_type)
    result = db.execute(stmt)
    return result.scalars().first()


def create_project_sop(db: Session, data: ProjectSOPCreate) -> ProjectSOP:
    # Check if document type already exists
    existing = get_project_sop_by_document_type(db, data.document_type)
    if existing:
        raise ValueError(f"Document type '{data.document_type}' already exists")

    # Get the next display_order by finding the max and adding 1
    max_order_stmt = select(func.coalesce(func.max(ProjectSOP.display_order), 0))
    max_order = db.execute(max_order_stmt).scalar()
    next_order = max_order + 1 if data.display_order == 0 else data.display_order

    project_sop = ProjectSOP(
        document_type=data.document_type,
        title=data.title,
        content=data.content,
        display_order=next_order,
        is_active=data.is_active
    )
    db.add(project_sop)
    db.commit()
    db.refresh(project_sop)
    return project_sop


def update_project_sop(db: Session, project_sop_id: str, data: ProjectSOPUpdate) -> ProjectSOP:
    project_sop = db.get(ProjectSOP, project_sop_id)
    if project_sop is None:
        raise ValueError("Project SOP not found")

    updated = False

    # Check for document_type change (if provided and different)
    new_document_type = project_sop.document_type
    if data.document_type is not None and data.document_type != project_sop.document_type:
        # Check if new document type already exists
        existing = get_project_sop_by_document_type(db, data.document_type)
        if existing and existing.id != project_sop.id:
            raise ValueError(f"Document type '{data.document_type}' already exists")
        new_document_type = data.document_type
        updated = True

    new_title = project_sop.title
    if data.title is not None and data.title != project_sop.title:
        new_title = data.title
        updated = True

    new_content = project_sop.content
    if data.content is not None and data.content != project_sop.content:
        new_content = data.content
        updated = True

    new_display_order = project_sop.display_order
    if data.display_order is not None and data.display_order != project_sop.display_order:
        new_display_order = data.display_order
        updated = True

    new_is_active = project_sop.is_active
    if data.is_active is not None and data.is_active != project_sop.is_active:
        new_is_active = data.is_active
        updated = True

    if not updated:
        raise ValueError("No changes detected; update skipped")

    # Create history entry before updating
    history_entry = ProjectSOPHistory(
        project_sop_id=project_sop.id,
        document_type=project_sop.document_type,
        title=project_sop.title,
        version=project_sop.version,
        content=project_sop.content,
        edited_by=data.edited_by,
    )
    db.add(history_entry)

    # Update the project SOP
    project_sop.document_type = new_document_type
    project_sop.title = new_title
    project_sop.content = new_content
    project_sop.display_order = new_display_order
    project_sop.is_active = new_is_active
    project_sop.version += 1

    db.commit()
    db.refresh(project_sop)
    return project_sop


def list_project_sop_history(db: Session, project_sop_id: str) -> list[ProjectSOPHistory]:
    stmt = (
        select(ProjectSOPHistory)
        .where(ProjectSOPHistory.project_sop_id == project_sop_id)
        .order_by(ProjectSOPHistory.created_at.desc())
    )
    result = db.execute(stmt)
    return result.scalars().all()


def delete_project_sop(db: Session, project_sop_id: str) -> bool:
    project_sop = db.get(ProjectSOP, project_sop_id)
    if project_sop is None:
        return False

    db.delete(project_sop)
    db.commit()
    return True