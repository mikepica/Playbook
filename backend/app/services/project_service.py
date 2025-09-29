from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.db.models.project import Project, BusinessCase, ProjectCharter
from app.db.models.project_sop import ProjectSOP
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    BusinessCaseCreate,
    BusinessCaseUpdate,
    ProjectCharterCreate,
    ProjectCharterUpdate,
)


class ProjectService:
    """Service class for project-related operations."""

    @staticmethod
    def list_projects(db: Session, include_inactive: bool = False) -> List[Project]:
        """Get all projects, optionally including inactive ones."""
        query = db.query(Project)
        if not include_inactive:
            query = query.filter(Project.is_active == True)
        return query.order_by(Project.display_order, Project.project_name).all()

    @staticmethod
    def get_project(db: Session, project_id: UUID) -> Optional[Project]:
        """Get a project by ID."""
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def get_project_by_name(db: Session, project_name: str) -> Optional[Project]:
        """Get a project by name."""
        return db.query(Project).filter(Project.project_name == project_name).first()

    @staticmethod
    def create_project(db: Session, project_data: ProjectCreate) -> Project:
        """Create a new project."""
        # Check if project name already exists
        existing_project = ProjectService.get_project_by_name(db, project_data.project_name)
        if existing_project:
            raise ValueError(f"Project with name '{project_data.project_name}' already exists")

        # Generate project code if not provided
        if not project_data.project_code:
            project_data.project_code = ProjectService._generate_project_code(db, project_data.project_name)

        project = Project(**project_data.model_dump())
        db.add(project)
        db.commit()
        db.refresh(project)

        # Auto-create documents for all active document types
        ProjectService._create_initial_documents(db, project, project_data)

        return project

    @staticmethod
    def update_project(db: Session, project_id: UUID, project_data: ProjectUpdate) -> Project:
        """Update an existing project."""
        project = ProjectService.get_project(db, project_id)
        if not project:
            raise ValueError(f"Project with ID {project_id} not found")

        # Check for duplicate project name if name is being changed
        if project_data.project_name and project_data.project_name != project.project_name:
            existing_project = ProjectService.get_project_by_name(db, project_data.project_name)
            if existing_project:
                raise ValueError(f"Project with name '{project_data.project_name}' already exists")

        # Update fields
        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete_project(db: Session, project_id: UUID) -> bool:
        """Delete a project (soft delete by setting is_active to False)."""
        project = ProjectService.get_project(db, project_id)
        if not project:
            return False

        project.is_active = False
        db.commit()
        return True

    @staticmethod
    def _generate_project_code(db: Session, project_name: str) -> str:
        """Generate a unique project code based on project name."""
        # Extract initials from project name
        words = project_name.upper().split()
        if len(words) >= 2:
            initials = "".join(word[0] for word in words[:3])  # Max 3 initials
        else:
            initials = words[0][:3] if words else "PRJ"

        # Get current year
        from datetime import datetime
        year = datetime.now().year

        # Find the next available number
        base_code = f"{initials}-{year}"
        existing_codes = db.query(Project.project_code).filter(
            Project.project_code.like(f"{base_code}-%")
        ).all()

        if not existing_codes:
            return f"{base_code}-001"

        # Extract numbers and find the next one
        numbers = []
        for (code,) in existing_codes:
            if code:
                parts = code.split("-")
                if len(parts) == 3 and parts[2].isdigit():
                    numbers.append(int(parts[2]))

        next_number = max(numbers, default=0) + 1
        return f"{base_code}-{next_number:03d}"

    @staticmethod
    def _create_initial_documents(db: Session, project: Project, project_data: ProjectCreate) -> None:
        """Create initial documents for all active document types."""
        # Get all active document types from ProjectSOPs
        active_sops = db.query(ProjectSOP).filter(ProjectSOP.is_active == True).all()

        for sop in active_sops:
            try:
                if sop.document_type == 'business_case':
                    # Create business case
                    business_case = BusinessCase(
                        project_id=project.id,
                        title=f"{project.project_name} Business Case",
                        business_area=project_data.business_area,
                        sponsor=project_data.sponsor,
                        status='draft',
                        is_current_version=True,
                        created_by=getattr(project_data, 'created_by', None)
                    )
                    db.add(business_case)

                elif sop.document_type == 'project_charter':
                    # Create project charter
                    charter = ProjectCharter(
                        project_id=project.id,
                        title=f"{project.project_name} Project Charter",
                        sponsor=project_data.sponsor or 'TBD',
                        status='draft',
                        is_current_version=True,
                        created_by=getattr(project_data, 'created_by', None)
                    )
                    db.add(charter)

                # For future document types, add more elif conditions here

            except Exception as e:
                # Log the error but don't fail the project creation
                print(f"Warning: Failed to create {sop.document_type} for project {project.project_name}: {e}")

        try:
            db.commit()
        except Exception as e:
            # If document creation fails, rollback document changes but keep the project
            db.rollback()
            print(f"Warning: Failed to create some documents for project {project.project_name}: {e}")


class BusinessCaseService:
    """Service class for business case operations."""

    @staticmethod
    def list_business_cases(db: Session, project_id: Optional[UUID] = None) -> List[BusinessCase]:
        """Get all business cases, optionally filtered by project."""
        query = db.query(BusinessCase)
        if project_id:
            query = query.filter(BusinessCase.project_id == project_id)
        return query.order_by(desc(BusinessCase.created_at)).all()

    @staticmethod
    def get_business_case(db: Session, business_case_id: UUID) -> Optional[BusinessCase]:
        """Get a business case by ID."""
        return db.query(BusinessCase).filter(BusinessCase.id == business_case_id).first()

    @staticmethod
    def get_current_business_case(db: Session, project_id: UUID) -> Optional[BusinessCase]:
        """Get the current version of business case for a project."""
        return db.query(BusinessCase).filter(
            and_(
                BusinessCase.project_id == project_id,
                BusinessCase.is_current_version == True
            )
        ).first()

    @staticmethod
    def create_business_case(db: Session, business_case_data: BusinessCaseCreate) -> BusinessCase:
        """Create a new business case."""
        # Verify project exists
        project = db.query(Project).filter(Project.id == business_case_data.project_id).first()
        if not project:
            raise ValueError(f"Project with ID {business_case_data.project_id} not found")

        business_case = BusinessCase(**business_case_data.model_dump())
        db.add(business_case)
        db.commit()
        db.refresh(business_case)
        return business_case

    @staticmethod
    def update_business_case(db: Session, business_case_id: UUID, business_case_data: BusinessCaseUpdate) -> BusinessCase:
        """Update an existing business case."""
        business_case = BusinessCaseService.get_business_case(db, business_case_id)
        if not business_case:
            raise ValueError(f"Business case with ID {business_case_id} not found")

        update_data = business_case_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(business_case, field, value)

        db.commit()
        db.refresh(business_case)
        return business_case

    @staticmethod
    def create_new_version(db: Session, business_case_id: UUID, business_case_data: BusinessCaseUpdate) -> BusinessCase:
        """Create a new version of an existing business case."""
        original = BusinessCaseService.get_business_case(db, business_case_id)
        if not original:
            raise ValueError(f"Business case with ID {business_case_id} not found")

        # Mark original as not current
        original.is_current_version = False

        # Create new version
        new_version_data = original.__dict__.copy()
        new_version_data.pop('id', None)
        new_version_data.pop('_sa_instance_state', None)
        new_version_data.pop('created_at', None)
        new_version_data.pop('updated_at', None)

        # Apply updates
        update_data = business_case_data.model_dump(exclude_unset=True)
        new_version_data.update(update_data)

        # Set version control fields
        new_version_data['supersedes_version'] = business_case_id
        new_version_data['is_current_version'] = True

        # Increment version number
        current_version = new_version_data.get('version', '1.0')
        try:
            major, minor = map(int, current_version.split('.'))
            new_version_data['version'] = f"{major}.{minor + 1}"
        except ValueError:
            new_version_data['version'] = '2.0'

        new_business_case = BusinessCase(**new_version_data)
        db.add(new_business_case)
        db.commit()
        db.refresh(new_business_case)
        return new_business_case


class ProjectCharterService:
    """Service class for project charter operations."""

    @staticmethod
    def list_project_charters(db: Session, project_id: Optional[UUID] = None) -> List[ProjectCharter]:
        """Get all project charters, optionally filtered by project."""
        query = db.query(ProjectCharter)
        if project_id:
            query = query.filter(ProjectCharter.project_id == project_id)
        return query.order_by(desc(ProjectCharter.created_at)).all()

    @staticmethod
    def get_project_charter(db: Session, charter_id: UUID) -> Optional[ProjectCharter]:
        """Get a project charter by ID."""
        return db.query(ProjectCharter).filter(ProjectCharter.id == charter_id).first()

    @staticmethod
    def get_current_project_charter(db: Session, project_id: UUID) -> Optional[ProjectCharter]:
        """Get the current version of project charter for a project."""
        return db.query(ProjectCharter).filter(
            and_(
                ProjectCharter.project_id == project_id,
                ProjectCharter.is_current_version == True
            )
        ).first()

    @staticmethod
    def create_project_charter(db: Session, charter_data: ProjectCharterCreate) -> ProjectCharter:
        """Create a new project charter."""
        # Verify project exists
        project = db.query(Project).filter(Project.id == charter_data.project_id).first()
        if not project:
            raise ValueError(f"Project with ID {charter_data.project_id} not found")

        # Verify business case exists if specified
        if charter_data.business_case_id:
            business_case = db.query(BusinessCase).filter(BusinessCase.id == charter_data.business_case_id).first()
            if not business_case:
                raise ValueError(f"Business case with ID {charter_data.business_case_id} not found")

        charter = ProjectCharter(**charter_data.model_dump())
        db.add(charter)
        db.commit()
        db.refresh(charter)
        return charter

    @staticmethod
    def update_project_charter(db: Session, charter_id: UUID, charter_data: ProjectCharterUpdate) -> ProjectCharter:
        """Update an existing project charter."""
        charter = ProjectCharterService.get_project_charter(db, charter_id)
        if not charter:
            raise ValueError(f"Project charter with ID {charter_id} not found")

        update_data = charter_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(charter, field, value)

        db.commit()
        db.refresh(charter)
        return charter

    @staticmethod
    def create_new_version(db: Session, charter_id: UUID, charter_data: ProjectCharterUpdate) -> ProjectCharter:
        """Create a new version of an existing project charter."""
        original = ProjectCharterService.get_project_charter(db, charter_id)
        if not original:
            raise ValueError(f"Project charter with ID {charter_id} not found")

        # Mark original as not current
        original.is_current_version = False

        # Create new version
        new_version_data = original.__dict__.copy()
        new_version_data.pop('id', None)
        new_version_data.pop('_sa_instance_state', None)
        new_version_data.pop('created_at', None)
        new_version_data.pop('updated_at', None)

        # Apply updates
        update_data = charter_data.model_dump(exclude_unset=True)
        new_version_data.update(update_data)

        # Set version control fields
        new_version_data['supersedes_version'] = charter_id
        new_version_data['is_current_version'] = True

        # Update change log
        change_log = new_version_data.get('change_log', [])
        change_entry = {
            'version': new_version_data.get('version', '2.0'),
            'date': str(db.execute('SELECT NOW()').scalar()),
            'changes': 'Updated project charter',
            'reason': 'Version update'
        }
        change_log.append(change_entry)
        new_version_data['change_log'] = change_log

        # Increment version number
        current_version = new_version_data.get('version', '1.0')
        try:
            major, minor = map(int, current_version.split('.'))
            new_version_data['version'] = f"{major}.{minor + 1}"
        except ValueError:
            new_version_data['version'] = '2.0'

        new_charter = ProjectCharter(**new_version_data)
        db.add(new_charter)
        db.commit()
        db.refresh(new_charter)
        return new_charter