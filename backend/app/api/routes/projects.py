from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectList,
    ProjectRead,
    ProjectUpdate,
    BusinessCaseCreate,
    BusinessCaseList,
    BusinessCaseRead,
    BusinessCaseUpdate,
    ProjectCharterCreate,
    ProjectCharterList,
    ProjectCharterRead,
    ProjectCharterUpdate,
)
from app.services.project_service import ProjectService, BusinessCaseService, ProjectCharterService

router = APIRouter(prefix="/projects", tags=["projects"])


# Project routes
@router.get("/", response_model=ProjectList)
def list_projects(include_inactive: bool = False, db: Session = Depends(get_db)) -> ProjectList:
    """List all projects."""
    projects = ProjectService.list_projects(db, include_inactive=include_inactive)
    return ProjectList(
        items=[
            {
                'id': project.id,
                'project_name': project.project_name,
                'project_code': project.project_code,
                'business_area': project.business_area,
                'sponsor': project.sponsor,
                'status': project.status,
                'overall_health': project.overall_health,
                'priority': project.priority,
                'display_order': project.display_order,
                'updated_at': project.updated_at,
            }
            for project in projects
        ]
    )


@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> ProjectRead:
    """Create a new project."""
    try:
        project = ProjectService.create_project(db, payload)
        return ProjectRead.model_validate(project)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: UUID, db: Session = Depends(get_db)) -> ProjectRead:
    """Get a project by ID."""
    project = ProjectService.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return ProjectRead.model_validate(project)


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project_id: UUID, payload: ProjectUpdate, db: Session = Depends(get_db)) -> ProjectRead:
    """Update an existing project."""
    try:
        project = ProjectService.update_project(db, project_id, payload)
        return ProjectRead.model_validate(project)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)) -> None:
    """Delete a project (soft delete)."""
    success = ProjectService.delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


# Business Case routes
@router.get("/{project_id}/business-cases", response_model=BusinessCaseList)
def list_business_cases(project_id: UUID, db: Session = Depends(get_db)) -> BusinessCaseList:
    """List business cases for a project."""
    business_cases = BusinessCaseService.list_business_cases(db, project_id=project_id)
    return BusinessCaseList(
        items=[BusinessCaseRead.model_validate(bc) for bc in business_cases]
    )


@router.post("/{project_id}/business-cases", response_model=BusinessCaseRead, status_code=status.HTTP_201_CREATED)
def create_business_case(project_id: UUID, payload: BusinessCaseCreate, db: Session = Depends(get_db)) -> BusinessCaseRead:
    """Create a new business case for a project."""
    # Ensure project_id matches the URL parameter
    payload.project_id = project_id

    try:
        business_case = BusinessCaseService.create_business_case(db, payload)
        return BusinessCaseRead.model_validate(business_case)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{project_id}/business-cases/current", response_model=BusinessCaseRead)
def get_current_business_case(project_id: UUID, db: Session = Depends(get_db)) -> BusinessCaseRead:
    """Get the current version of business case for a project."""
    business_case = BusinessCaseService.get_current_business_case(db, project_id)
    if business_case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No business case found for this project")

    return BusinessCaseRead.model_validate(business_case)


@router.get("/{project_id}/business-cases/{business_case_id}", response_model=BusinessCaseRead)
def get_business_case(project_id: UUID, business_case_id: UUID, db: Session = Depends(get_db)) -> BusinessCaseRead:
    """Get a specific business case."""
    business_case = BusinessCaseService.get_business_case(db, business_case_id)
    if business_case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business case not found")

    if business_case.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business case not found for this project")

    return BusinessCaseRead.model_validate(business_case)


@router.put("/{project_id}/business-cases/{business_case_id}", response_model=BusinessCaseRead)
def update_business_case(
    project_id: UUID,
    business_case_id: UUID,
    payload: BusinessCaseUpdate,
    db: Session = Depends(get_db)
) -> BusinessCaseRead:
    """Update an existing business case."""
    business_case = BusinessCaseService.get_business_case(db, business_case_id)
    if business_case is None or business_case.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business case not found")

    try:
        updated_business_case = BusinessCaseService.update_business_case(db, business_case_id, payload)
        return BusinessCaseRead.model_validate(updated_business_case)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{project_id}/business-cases/{business_case_id}/new-version", response_model=BusinessCaseRead)
def create_business_case_version(
    project_id: UUID,
    business_case_id: UUID,
    payload: BusinessCaseUpdate,
    db: Session = Depends(get_db)
) -> BusinessCaseRead:
    """Create a new version of an existing business case."""
    business_case = BusinessCaseService.get_business_case(db, business_case_id)
    if business_case is None or business_case.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business case not found")

    try:
        new_version = BusinessCaseService.create_new_version(db, business_case_id, payload)
        return BusinessCaseRead.model_validate(new_version)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


# Project Charter routes
@router.get("/{project_id}/charters", response_model=ProjectCharterList)
def list_project_charters(project_id: UUID, db: Session = Depends(get_db)) -> ProjectCharterList:
    """List project charters for a project."""
    charters = ProjectCharterService.list_project_charters(db, project_id=project_id)
    return ProjectCharterList(
        items=[ProjectCharterRead.model_validate(charter) for charter in charters]
    )


@router.post("/{project_id}/charters", response_model=ProjectCharterRead, status_code=status.HTTP_201_CREATED)
def create_project_charter(project_id: UUID, payload: ProjectCharterCreate, db: Session = Depends(get_db)) -> ProjectCharterRead:
    """Create a new project charter for a project."""
    # Ensure project_id matches the URL parameter
    payload.project_id = project_id

    try:
        charter = ProjectCharterService.create_project_charter(db, payload)
        return ProjectCharterRead.model_validate(charter)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{project_id}/charters/current", response_model=ProjectCharterRead)
def get_current_project_charter(project_id: UUID, db: Session = Depends(get_db)) -> ProjectCharterRead:
    """Get the current version of project charter for a project."""
    charter = ProjectCharterService.get_current_project_charter(db, project_id)
    if charter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No project charter found for this project")

    return ProjectCharterRead.model_validate(charter)


@router.get("/{project_id}/charters/{charter_id}", response_model=ProjectCharterRead)
def get_project_charter(project_id: UUID, charter_id: UUID, db: Session = Depends(get_db)) -> ProjectCharterRead:
    """Get a specific project charter."""
    charter = ProjectCharterService.get_project_charter(db, charter_id)
    if charter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project charter not found")

    if charter.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project charter not found for this project")

    return ProjectCharterRead.model_validate(charter)


@router.put("/{project_id}/charters/{charter_id}", response_model=ProjectCharterRead)
def update_project_charter(
    project_id: UUID,
    charter_id: UUID,
    payload: ProjectCharterUpdate,
    db: Session = Depends(get_db)
) -> ProjectCharterRead:
    """Update an existing project charter."""
    charter = ProjectCharterService.get_project_charter(db, charter_id)
    if charter is None or charter.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project charter not found")

    try:
        updated_charter = ProjectCharterService.update_project_charter(db, charter_id, payload)
        return ProjectCharterRead.model_validate(updated_charter)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{project_id}/charters/{charter_id}/new-version", response_model=ProjectCharterRead)
def create_project_charter_version(
    project_id: UUID,
    charter_id: UUID,
    payload: ProjectCharterUpdate,
    db: Session = Depends(get_db)
) -> ProjectCharterRead:
    """Create a new version of an existing project charter."""
    charter = ProjectCharterService.get_project_charter(db, charter_id)
    if charter is None or charter.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project charter not found")

    try:
        new_version = ProjectCharterService.create_new_version(db, charter_id, payload)
        return ProjectCharterRead.model_validate(new_version)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc