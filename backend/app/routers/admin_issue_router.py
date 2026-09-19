from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.services.candidate_issue_service import (
    get_admin_issues,
    get_issue_by_identifier,
    update_issue_status,
)
from app.services.attendance_followup_service import handle_admin_candidate_action

router = APIRouter(
    prefix="/api/admin/issues",
    tags=["Admin Issue Management"],
)


class IssueUpdateSchema(BaseModel):
    status: str
    admin_response: Optional[str] = None


class CandidateActionSchema(BaseModel):
    candidate_id: int
    batch_id: int
    action_type: str  # KEEP_ACTIVE, CONTACT, REMOVE_FROM_BATCH, DEACTIVATE
    comments: Optional[str] = None


@router.get("")
async def get_admin_issues_api(
    status: Optional[str] = Query(None),
    issue_type: Optional[str] = Query(None),
    candidate_id: Optional[int] = Query(None),
    batch_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Admin: View all issues with optional filtering by status, issue type, candidate, batch, or keyword search.
    """
    return await get_admin_issues(
        db=db,
        status=status,
        issue_type=issue_type,
        candidate_id=candidate_id,
        batch_id=batch_id,
        search=search,
    )


@router.get("/{issue_id}")
async def get_admin_issue_detail_api(
    issue_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Admin: Get full details of a specific issue.
    """
    issue = await get_issue_by_identifier(db, identifier=issue_id)
    return {
        "id": issue.id,
        "issue_id": issue.issue_id,
        "candidate_id": issue.candidate_id,
        "batch_id": issue.batch_id,
        "issue_type": issue.issue_type,
        "subject": issue.subject,
        "description": issue.description,
        "priority": issue.priority,
        "status": issue.status,
        "admin_response": issue.admin_response,
        "attachment_url": issue.attachment_url,
        "resolved_by": issue.resolved_by,
        "resolved_at": issue.resolved_at.isoformat() if issue.resolved_at else None,
        "created_at": issue.created_at.isoformat() if issue.created_at else None,
        "updated_at": issue.updated_at.isoformat() if issue.updated_at else None,
    }


@router.patch("/{issue_id}")
async def update_admin_issue_api(
    issue_id: str,
    body: IssueUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Admin: Update issue status (OPEN, IN_PROGRESS, RESOLVED, CLOSED) and response.
    Sends notification & email to candidate.
    """
    updated = await update_issue_status(
        db=db,
        identifier=issue_id,
        admin_user=current_admin,
        status=body.status,
        admin_response=body.admin_response,
    )
    return {
        "status": "success",
        "message": f"Issue {updated.issue_id} status updated to {updated.status}.",
        "issue_id": updated.issue_id,
        "issue_status": updated.status,
        "admin_response": updated.admin_response,
    }


@router.post("/candidate-action")
async def execute_admin_candidate_action_api(
    body: CandidateActionSchema,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Admin: Execute post-Day 3 administrative action on an escalated candidate.
    Action options: KEEP_ACTIVE, CONTACT, REMOVE_FROM_BATCH, DEACTIVATE.
    """
    return await handle_admin_candidate_action(
        db=db,
        admin_user=current_admin,
        candidate_id=body.candidate_id,
        batch_id=body.batch_id,
        action_type=body.action_type,
        comments=body.comments,
    )
