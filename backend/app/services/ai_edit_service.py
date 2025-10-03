from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional
from datetime import date

from sqlalchemy.orm import Session

from app.services.llm_provider import llm_client
from app.services.project_sop_service import get_project_sop_by_document_type
from app.services.project_service import BusinessCaseService, ProjectCharterService

logger = logging.getLogger(__name__)


# ============================================================================
# ENUM VALUE CONSTRAINTS (from database CHECK constraints)
# ============================================================================

VALID_URGENCY_VALUES = {'low', 'medium', 'high', 'critical'}

VALID_BUSINESS_CASE_STATUS_VALUES = {
    'draft', 'review_requested', 'under_review', 'revisions_required',
    'approved', 'rejected', 'archived'
}

VALID_PROJECT_CHARTER_STATUS_VALUES = {
    'draft', 'review_requested', 'under_review', 'revisions_required',
    'approved', 'active', 'superseded', 'cancelled', 'archived'
}

VALID_BUSINESS_CASE_APPROVAL_LEVEL_VALUES = {
    'department', 'divisional', 'executive', 'board'
}

VALID_PROJECT_CHARTER_APPROVAL_LEVEL_VALUES = {
    'pm', 'sponsor', 'steering_committee', 'executive'
}

VALID_RISK_TOLERANCE_VALUES = {'low', 'medium', 'high'}

# ============================================================================
# REQUIRED FIELDS (from database NOT NULL constraints)
# ============================================================================

BUSINESS_CASE_REQUIRED_FIELDS = set()  # No NOT NULL fields besides system fields

PROJECT_CHARTER_REQUIRED_FIELDS = {'sponsor'}  # sponsor is NOT NULL in database

# ============================================================================
# FIELD TYPE SCHEMAS
# ============================================================================

# Field type schema for BusinessCase
BUSINESS_CASE_FIELD_TYPES = {
    # Simple string fields
    'title': str,
    'business_area': str,
    'strategic_alignment': str,
    'business_driver': str,
    'urgency': str,
    'sponsor': str,
    'project_description': str,
    'recommended_option': str,
    'recommendation_rationale': str,
    'status': str,
    'approval_level': str,
    'approved_by': str,
    'version': str,

    # Date fields
    'proposed_start_date': date,
    'proposed_end_date': date,
    'submitted_date': date,
    'approved_date': date,

    # Integer fields
    'estimated_duration_months': int,
    'payback_period_months': int,

    # Decimal fields (represented as float in Python before conversion)
    'roi_percentage': float,
    'npv_value': float,

    # List of dict fields
    'approvals': list,
    'background': list,
    'objectives': list,
    'deliverables': list,
    'interdependencies': list,
    'key_assumptions': list,
    'constraints': list,
    'risks': list,
    'opportunities': list,
    'financial_assumptions': list,
    'options_considered': list,
    'success_criteria': list,

    # List of string fields
    'scope_in': list,
    'scope_out': list,

    # Dict fields
    'costs': dict,
    'benefits': dict,
}

# Field type schema for ProjectCharter
PROJECT_CHARTER_FIELD_TYPES = {
    # Simple string fields
    'title': str,
    'sponsor': str,  # REQUIRED - NOT NULL in database
    'project_manager': str,
    'governance_structure': str,
    'business_case_summary': str,
    'strategic_alignment': str,
    'project_objectives': str,
    'acceptance_criteria': str,
    'change_control_process': str,
    'status': str,
    'approval_level': str,
    'approved_by': str,
    'approval_comments': str,
    'risk_tolerance': str,
    'version': str,

    # Date fields
    'charter_date': date,
    'sign_off_date': date,
    'effective_date': date,
    'review_date': date,
    'expiry_date': date,
    'submitted_date': date,
    'approved_date': date,

    # Integer fields
    'schedule_tolerance': int,

    # Decimal fields
    'budget_authority': float,
    'budget_tolerance': float,

    # List of dict fields
    'steering_committee': list,
    'project_team': list,
    'key_stakeholders': list,
    'external_dependencies': list,
    'business_benefits': list,
    'success_criteria': list,
    'scope_deliverables': list,
    'assumptions': list,
    'constraints': list,
    'key_dates_milestones': list,
    'critical_deadlines': list,
    'threats_opportunities': list,
    'escalation_criteria': list,
    'decision_authority': list,
    'reporting_requirements': list,
    'compliance_requirements': list,
    'change_log': list,

    # List of string fields
    'scope_exclusions': list,
    'quality_standards': list,

    # Dict fields
    'resource_requirements': dict,
}


def _coerce_field_value(field_name: str, value: Any, expected_type: type) -> Any:
    """
    Coerce a field value to match the expected type.

    Args:
        field_name: Name of the field
        value: The value to coerce
        expected_type: The expected Python type

    Returns:
        Coerced value matching expected type, or None if coercion fails
    """
    # If value is None, return None
    if value is None:
        return None

    # Handle string type
    if expected_type == str:
        # Don't accept strings that look like error messages or placeholders
        if isinstance(value, str) and value.lower() in ('no reason provided', 'n/a', 'none', 'null', ''):
            logger.warning(f"Skipping placeholder string for {field_name}: '{value}'")
            return None
        return str(value) if value else None

    # Handle integer type
    if expected_type == int:
        try:
            if isinstance(value, str):
                # Remove any non-numeric characters except minus sign
                cleaned = ''.join(c for c in value if c.isdigit() or c == '-')
                return int(cleaned) if cleaned and cleaned != '-' else None
            return int(value)
        except (ValueError, TypeError):
            logger.warning(f"Could not convert {field_name}={value} to int, skipping")
            return None

    # Handle float/Decimal type (for roi_percentage, npv_value, budget_authority, etc.)
    if expected_type == float:
        try:
            if isinstance(value, str):
                # Remove any non-numeric characters except minus sign and decimal point
                cleaned = ''.join(c for c in value if c.isdigit() or c in '.-')
                return float(cleaned) if cleaned and cleaned not in ('-', '.', '-.') else None
            return float(value)
        except (ValueError, TypeError):
            logger.warning(f"Could not convert {field_name}={value} to float, skipping")
            return None

    # Handle date type
    if expected_type == date:
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                from datetime import datetime
                # Handle various date formats
                for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%m-%d-%Y']:
                    try:
                        return datetime.strptime(value, fmt).date()
                    except ValueError:
                        continue
                # Try ISO format
                return datetime.fromisoformat(value.replace('Z', '+00:00')).date()
            except (ValueError, AttributeError):
                logger.warning(f"Could not convert {field_name}={value} to date, skipping")
                return None
        return None

    # Handle list type
    if expected_type == list:
        # If it's already a list, return it
        if isinstance(value, list):
            return value if len(value) > 0 else None

        # If it's a string, try to parse as JSON array
        if isinstance(value, str):
            # Skip placeholder strings
            if value.lower() in ('no reason provided', 'n/a', 'none', 'null', '', '[]'):
                logger.warning(f"Skipping placeholder list for {field_name}: '{value}'")
                return None

            # Try parsing as JSON
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed if len(parsed) > 0 else None
                # If parsed to something else, wrap it in a list
                return [parsed]
            except json.JSONDecodeError:
                pass

            # Try parsing as comma-separated values
            if ',' in value:
                items = [item.strip() for item in value.split(',') if item.strip()]
                return items if items else None

            # Single non-empty string becomes a single-item list
            if value.strip():
                return [value.strip()]

            return None

        # For other types, wrap in list if not empty
        return [value] if value else None

    # Handle dict type
    if expected_type == dict:
        # If it's already a dict, return it
        if isinstance(value, dict):
            return value if len(value) > 0 else None

        # If it's a string, try to parse as JSON object
        if isinstance(value, str):
            # Skip placeholder strings
            if value.lower() in ('no reason provided', 'n/a', 'none', 'null', '', '{}'):
                logger.warning(f"Skipping placeholder dict for {field_name}: '{value}'")
                return None

            # Try parsing as JSON
            try:
                parsed = json.loads(value)
                if isinstance(parsed, dict):
                    return parsed if len(parsed) > 0 else None
            except json.JSONDecodeError:
                pass

            # If not JSON and not a placeholder, skip rather than wrapping
            logger.warning(f"Could not parse {field_name}='{value}' as dict, skipping")
            return None

        # For other types, skip
        return None

    # Default: return as-is if not None
    return value if value is not None else None


def validate_and_coerce_changes(
    changes: Dict[str, Any],
    document_type: str
) -> Dict[str, Any]:
    """
    Validate and coerce field values to match expected schema types and database constraints.

    Args:
        changes: Dictionary of field names to new values
        document_type: Type of document ('business-case' or 'project-charter')

    Returns:
        Dictionary with validated and coerced values

    Raises:
        ValueError: If validation fails (constraint violation, required field is null, etc.)
    """
    if document_type == 'business-case':
        field_types = BUSINESS_CASE_FIELD_TYPES
        required_fields = BUSINESS_CASE_REQUIRED_FIELDS
        valid_status_values = VALID_BUSINESS_CASE_STATUS_VALUES
        valid_approval_level_values = VALID_BUSINESS_CASE_APPROVAL_LEVEL_VALUES
    elif document_type == 'project-charter':
        field_types = PROJECT_CHARTER_FIELD_TYPES
        required_fields = PROJECT_CHARTER_REQUIRED_FIELDS
        valid_status_values = VALID_PROJECT_CHARTER_STATUS_VALUES
        valid_approval_level_values = VALID_PROJECT_CHARTER_APPROVAL_LEVEL_VALUES
    else:
        raise ValueError(f"Unknown document type: {document_type}")

    validated_changes = {}
    validation_errors = []

    for field_name, value in changes.items():
        # Skip system fields
        if field_name in ('id', 'created_at', 'updated_at', 'created_by', 'version', 'project_id'):
            logger.warning(f"Skipping system field: {field_name}")
            continue

        # Get expected type
        expected_type = field_types.get(field_name)

        if expected_type is None:
            # Unknown field, include as-is with warning
            logger.warning(f"Unknown field {field_name}, including as-is")
            validated_changes[field_name] = value
            continue

        # Coerce value to expected type
        try:
            coerced_value = _coerce_field_value(field_name, value, expected_type)

            # Check if required field is being set to None
            if field_name in required_fields and coerced_value is None:
                validation_errors.append(
                    f"Field '{field_name}' is required and cannot be null or empty"
                )
                continue

            if coerced_value is not None:
                # Validate enum constraints for specific fields
                if field_name == 'urgency' and isinstance(coerced_value, str):
                    if coerced_value not in VALID_URGENCY_VALUES:
                        validation_errors.append(
                            f"Field 'urgency' has invalid value '{coerced_value}'. "
                            f"Must be one of: {', '.join(sorted(VALID_URGENCY_VALUES))}"
                        )
                        continue

                elif field_name == 'status' and isinstance(coerced_value, str):
                    if coerced_value not in valid_status_values:
                        validation_errors.append(
                            f"Field 'status' has invalid value '{coerced_value}'. "
                            f"Must be one of: {', '.join(sorted(valid_status_values))}"
                        )
                        continue

                elif field_name == 'approval_level' and isinstance(coerced_value, str):
                    if coerced_value not in valid_approval_level_values:
                        validation_errors.append(
                            f"Field 'approval_level' has invalid value '{coerced_value}'. "
                            f"Must be one of: {', '.join(sorted(valid_approval_level_values))}"
                        )
                        continue

                elif field_name == 'risk_tolerance' and isinstance(coerced_value, str):
                    if coerced_value not in VALID_RISK_TOLERANCE_VALUES:
                        validation_errors.append(
                            f"Field 'risk_tolerance' has invalid value '{coerced_value}'. "
                            f"Must be one of: {', '.join(sorted(VALID_RISK_TOLERANCE_VALUES))}"
                        )
                        continue

                validated_changes[field_name] = coerced_value
            else:
                logger.warning(f"Skipping field {field_name} due to coercion failure")
        except Exception as e:
            logger.error(f"Error coercing field {field_name}: {e}")
            validation_errors.append(f"Field '{field_name}': {str(e)}")
            continue

    # If there are validation errors, raise them all at once
    if validation_errors:
        error_message = "Database constraint validation failed:\n- " + "\n- ".join(validation_errors)
        raise ValueError(error_message)

    return validated_changes


def generate_ai_suggestions(
    db: Session,
    document_type: str,
    current_document: Dict[str, Any],
    user_instructions: str,
    project_id: str | None = None
) -> Dict[str, Any]:
    """
    Generate AI suggestions for document edits based on ProjectSOP context and user instructions.

    Args:
        db: Database session
        document_type: Type of document ('business-case' or 'project-charter')
        current_document: Current document data
        user_instructions: User's instructions for what changes to make
        project_id: Optional project ID for additional context

    Returns:
        Dictionary containing suggested changes for each field
    """

    # Get the relevant ProjectSOP for this document type
    project_sop = get_project_sop_by_document_type(db, document_type.replace('-', '_'))

    if not project_sop:
        raise ValueError(f"No ProjectSOP found for document type: {document_type}")

    # Extract SOP content
    sop_content = ""
    if isinstance(project_sop.content, dict) and "markdown" in project_sop.content:
        sop_content = project_sop.content["markdown"]
    elif isinstance(project_sop.content, str):
        sop_content = project_sop.content

    # Build constraint information for the prompt
    if document_type == 'business-case':
        required_fields_str = "None (all fields are optional)"
        status_values = ', '.join(sorted(VALID_BUSINESS_CASE_STATUS_VALUES))
        approval_level_values = ', '.join(sorted(VALID_BUSINESS_CASE_APPROVAL_LEVEL_VALUES))
    else:  # project-charter
        required_fields_str = "sponsor (REQUIRED - cannot be null or empty)"
        status_values = ', '.join(sorted(VALID_PROJECT_CHARTER_STATUS_VALUES))
        approval_level_values = ', '.join(sorted(VALID_PROJECT_CHARTER_APPROVAL_LEVEL_VALUES))

    urgency_values = ', '.join(sorted(VALID_URGENCY_VALUES))
    risk_tolerance_values = ', '.join(sorted(VALID_RISK_TOLERANCE_VALUES))

    # Build the system prompt with explicit type requirements and constraints
    system_prompt = f"""You are an AI assistant helping to update project documents based on Standard Operating Procedures and user instructions.

DOCUMENT TYPE: {document_type}
PROJECT SOP TITLE: {project_sop.title}

STANDARD OPERATING PROCEDURE:
{sop_content}

CURRENT DOCUMENT DATA:
{json.dumps(current_document, indent=2, default=str)}

USER INSTRUCTIONS:
{user_instructions}

TASK:
Analyze the current document and user instructions against the SOP requirements. Generate suggested updates for relevant fields based on:
1. The SOP guidelines and requirements
2. The user's specific instructions
3. Best practices for {document_type} documents

RESPONSE FORMAT:
Return a JSON object with the following structure:
{{
    "suggestions": {{
        "field_name": {{
            "current_value": <existing value>,
            "suggested_value": <new suggested value>,
            "reason": "explanation of why this change is suggested based on SOP and user instructions"
        }},
        ...
    }},
    "overall_reasoning": "High-level explanation of the suggested changes and how they align with the SOP"
}}

CRITICAL TYPE REQUIREMENTS:
You MUST maintain correct data types for each field:

STRING FIELDS (use plain strings):
- title, business_area, strategic_alignment, business_driver, urgency, sponsor
- project_description, recommended_option, recommendation_rationale, status, approval_level
- governance_structure, project_objectives, acceptance_criteria, etc.

DATE FIELDS (use ISO date format YYYY-MM-DD):
- proposed_start_date, proposed_end_date, charter_date, sign_off_date, effective_date, etc.
Example: "2024-03-15"

INTEGER FIELDS (use numbers without quotes):
- estimated_duration_months, payback_period_months, schedule_tolerance
Example: 6

DECIMAL/FLOAT FIELDS (use numbers with decimals):
- roi_percentage, npv_value, budget_authority, budget_tolerance
Example: 12.5 or 100000.00

ARRAY OF OBJECTS (use JSON arrays with objects):
- objectives: [{{"timeline": "...", "objective": "...", "measurable_outcome": "..."}}]
- background: [{{"point": "...", "detail": "..."}}]
- risks: [{{"risk": "...", "impact": "...", "mitigation": "..."}}]
- deliverables, opportunities, key_assumptions, constraints, etc.

ARRAY OF STRINGS (use JSON arrays with strings):
- scope_in: ["item1", "item2", "item3"]
- scope_out: ["item1", "item2"]
- quality_standards: ["ISO 9001", "GDPR compliance"]

OBJECT FIELDS (use JSON objects):
- costs: {{"development": 50000, "maintenance": 10000}}
- benefits: {{"cost_savings": 100000, "revenue_increase": 50000}}
- resource_requirements: {{"fte": 5, "budget": 100000}}

DATABASE CONSTRAINTS - CRITICAL:
You MUST respect these database constraints or the update will fail:

REQUIRED FIELDS (cannot be null):
{required_fields_str}

VALID VALUES FOR ENUM FIELDS (must use exact values):
- urgency: {urgency_values}
- status: {status_values}
- approval_level: {approval_level_values}
- risk_tolerance: {risk_tolerance_values}

IMPORTANT GUIDELINES:
- Only suggest changes for fields that actually need updating based on the instructions
- Keep existing values that are appropriate and don't conflict with the SOP
- Ensure suggestions align with the SOP requirements
- NEVER suggest null/empty values for required fields
- ALWAYS use exact enum values from the valid values list above
- Provide clear reasoning for each suggested change
- For array fields (like objectives, risks), suggest the COMPLETE updated array, not just new items
- Maintain proper JSON formatting and data types as specified above
- Do not suggest changes to system fields (id, created_at, updated_at, version, project_id)
- If a field should remain unchanged, do not include it in suggestions
"""

    # Generate AI response
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Please analyze the document and provide suggestions based on my instructions: {user_instructions}"}
    ]

    try:
        ai_response = llm_client.generate_reply(messages)
        logger.info(f"Raw AI response (first 500 chars): {ai_response[:500]}")

        # Parse the JSON response
        try:
            suggestions_data = json.loads(ai_response)
            logger.info(f"Parsed suggestions structure - keys: {list(suggestions_data.keys()) if isinstance(suggestions_data, dict) else 'NOT A DICT'}")

            # Validate structure
            if not isinstance(suggestions_data, dict):
                logger.error(f"AI response is not a dict: {type(suggestions_data)}")
                raise ValueError(f"AI returned invalid structure: expected dict, got {type(suggestions_data).__name__}")

            if "suggestions" not in suggestions_data:
                logger.error(f"AI response missing 'suggestions' key. Keys present: {list(suggestions_data.keys())}")
                raise ValueError("AI response missing 'suggestions' field")

            if not isinstance(suggestions_data["suggestions"], dict):
                logger.error(f"AI 'suggestions' field is not a dict: {type(suggestions_data['suggestions'])}")
                raise ValueError(f"AI 'suggestions' field has wrong type: {type(suggestions_data['suggestions']).__name__}")

            # Validate and clean each suggestion
            cleaned_suggestions = {}
            for field_name, suggestion in suggestions_data["suggestions"].items():
                if not isinstance(suggestion, dict):
                    logger.warning(f"Skipping malformed suggestion for {field_name}: not a dict")
                    continue

                # Ensure required keys exist
                if "suggested_value" not in suggestion:
                    logger.warning(f"Skipping suggestion for {field_name}: missing 'suggested_value'")
                    continue

                # Include the suggestion (with current_value and reason defaults)
                cleaned_suggestions[field_name] = {
                    "current_value": suggestion.get("current_value"),
                    "suggested_value": suggestion["suggested_value"],
                    "reason": suggestion.get("reason", "No reason provided")
                }

            # Replace with cleaned suggestions
            suggestions_data["suggestions"] = cleaned_suggestions
            logger.info(f"Cleaned suggestions: {len(cleaned_suggestions)} fields")

            return suggestions_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {ai_response[:1000]}")
            logger.error(f"JSON decode error: {e}")
            raise ValueError("AI service returned invalid JSON response")

    except Exception as e:
        logger.error(f"Error generating AI suggestions: {e}", exc_info=True)
        raise ValueError(f"Failed to generate AI suggestions: {str(e)}")


def apply_ai_suggestions(
    db: Session,
    document_type: str,
    project_id: str,
    document_id: str,
    accepted_changes: Dict[str, Any],
    user_id: str = "ai_user"
) -> Dict[str, Any]:
    """
    Apply the accepted AI suggestions to the document.

    Args:
        db: Database session
        document_type: Type of document ('business-case' or 'project-charter')
        project_id: Project ID
        document_id: Document ID (can be ignored as we use current document)
        accepted_changes: Dictionary of field names to new values that user accepted
        user_id: ID of user applying changes

    Returns:
        Updated document data
    """

    try:
        from uuid import UUID
        from app.schemas.project import BusinessCaseUpdate, ProjectCharterUpdate

        # Validate and coerce field types before applying
        logger.info(f"Original accepted_changes: {accepted_changes}")
        validated_changes = validate_and_coerce_changes(accepted_changes, document_type)
        logger.info(f"Validated changes: {validated_changes}")

        if document_type == 'business-case':
            # Get current business case
            current_doc = BusinessCaseService.get_current_business_case(db, UUID(project_id))
            if not current_doc:
                raise ValueError("Business case not found")

            # Create update object with validated changes
            try:
                update_data = BusinessCaseUpdate(**{**validated_changes, "updated_by": user_id})
            except Exception as validation_error:
                logger.error(f"Pydantic validation failed: {validation_error}")
                logger.error(f"Attempted to create BusinessCaseUpdate with: {validated_changes}")
                raise ValueError(f"Field validation failed: {str(validation_error)}")

            # Apply changes using the document's actual ID
            updated_doc = BusinessCaseService.update_business_case(
                db, current_doc.id, update_data
            )
            return updated_doc

        elif document_type == 'project-charter':
            # Get current project charter
            current_doc = ProjectCharterService.get_current_project_charter(db, UUID(project_id))
            if not current_doc:
                raise ValueError("Project charter not found")

            # Create update object with validated changes
            try:
                update_data = ProjectCharterUpdate(**{**validated_changes, "updated_by": user_id})
            except Exception as validation_error:
                logger.error(f"Pydantic validation failed: {validation_error}")
                logger.error(f"Attempted to create ProjectCharterUpdate with: {validated_changes}")
                raise ValueError(f"Field validation failed: {str(validation_error)}")

            # Apply changes using the document's actual ID
            updated_doc = ProjectCharterService.update_project_charter(
                db, current_doc.id, update_data
            )
            return updated_doc

        else:
            raise ValueError(f"Unsupported document type: {document_type}")

    except ValueError:
        # Re-raise ValueError as-is (already has good message)
        raise
    except Exception as e:
        logger.error(f"Error applying AI suggestions: {e}", exc_info=True)
        raise ValueError(f"Failed to apply suggestions: {str(e)}")