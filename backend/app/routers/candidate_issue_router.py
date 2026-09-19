from typing import Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.candidate_issue_service import (
    create_candidate_issue,
    get_candidate_issues,
    get_issue_by_identifier,
)

router = APIRouter(
    prefix="/api/candidate/issues",
    tags=["Candidate Issues"],
)


@router.post("")
async def raise_candidate_issue_api(
    issue_type: str = Form(...),
    subject: str = Form(...),
    description: str = Form(...),
    priority: Optional[str] = Form("MEDIUM"),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Candidate raises an issue.
    Generates unique Issue ID, sets status to OPEN, alerts Admin via email and in-app notification.
    """
    issue = await create_candidate_issue(
        db=db,
        candidate=current_user,
        issue_type=issue_type,
        subject=subject,
        description=description,
        priority=priority or "MEDIUM",
        attachment_file=file,
    )

    return {
        "status": "success",
        "message": "Issue raised successfully.",
        "issue_id": issue.issue_id,
        "id": issue.id,
        "issue_type": issue.issue_type,
        "subject": issue.subject,
        "priority": issue.priority,
        "issue_status": issue.status,
        "created_at": issue.created_at.isoformat(),
    }


@router.get("")
async def get_candidate_issues_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all issues submitted by the logged-in candidate.
    """
    issues = await get_candidate_issues(db, candidate_id=current_user.id)
    return [
        {
            "id": i.id,
            "issue_id": i.issue_id,
            "issue_type": i.issue_type,
            "subject": i.subject,
            "description": i.description,
            "priority": i.priority,
            "status": i.status,
            "admin_response": i.admin_response,
            "attachment_url": i.attachment_url,
            "created_at": i.created_at.isoformat() if i.created_at else None,
            "updated_at": i.updated_at.isoformat() if i.updated_at else None,
        }
        for i in issues
    ]


@router.get("/{issue_id}")
async def get_candidate_issue_detail_api(
    issue_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get detail of a specific issue owned by the logged-in candidate.
    """
    issue = await get_issue_by_identifier(db, identifier=issue_id, candidate_id=current_user.id)
    return {
        "id": issue.id,
        "issue_id": issue.issue_id,
        "issue_type": issue.issue_type,
        "subject": issue.subject,
        "description": issue.description,
        "priority": issue.priority,
        "status": issue.status,
        "admin_response": issue.admin_response,
        "attachment_url": issue.attachment_url,
        "resolved_at": issue.resolved_at.isoformat() if issue.resolved_at else None,
        "created_at": issue.created_at.isoformat() if issue.created_at else None,
        "updated_at": issue.updated_at.isoformat() if issue.updated_at else None,
    }
