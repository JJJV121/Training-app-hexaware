from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import require_coordinator_or_admin
from app.models.user import User
from app.services.coordinator_service import (
    get_coordinator_dashboard_metrics,
    get_coordinator_assigned_batches,
    get_coordinator_batch_detail,
)
from app.services.candidate_issue_service import (
    get_coordinator_issues,
    update_coordinator_issue,
)

router = APIRouter(
    prefix="/api/coordinator",
    tags=["Batch Coordinator Management"],
)


class CoordinatorIssueUpdateSchema(BaseModel):
    status: str
    response_notes: Optional[str] = None
    escalate_to_admin: Optional[bool] = False


@router.get("/dashboard")
async def get_coordinator_dashboard_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin),
):
    """
    Get dashboard metrics for authenticated Batch Coordinator.
    Enforces strict DB-level data isolation.
    """
    return await get_coordinator_dashboard_metrics(db, current_user.id)


@router.get("/batches")
async def get_coordinator_batches_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin),
):
    """
    Fetch all active batches assigned to the authenticated Batch Coordinator.
    """
    batches = await get_coordinator_assigned_batches(db, current_user.id)
    return [
        {
            "id": b.id,
            "name": b.name,
            "course_id": b.course_id,
            "start_date": b.start_date.isoformat() if b.start_date else None,
            "end_date": b.end_date.isoformat() if b.end_date else None,
            "max_strength": b.max_strength,
            "status": b.status,
        }
        for b in batches
    ]


@router.get("/batches/{batch_id}")
async def get_coordinator_batch_detail_api(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin),
):
    """
    Get detail of a specific batch managed by the authenticated Batch Coordinator.
    """
    return await get_coordinator_batch_detail(db, current_user.id, batch_id)


@router.get("/issues")
async def get_coordinator_issues_api(
    status: Optional[str] = Query(None),
    issue_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin),
):
    """
    Get issues raised by trainees in batches managed by the authenticated Batch Coordinator.
    """
    return await get_coordinator_issues(
        db=db,
        coordinator_id=current_user.id,
        status=status,
        issue_type=issue_type,
    )


@router.patch("/issues/{issue_id}")
async def update_coordinator_issue_api(
    issue_id: str,
    body: CoordinatorIssueUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin),
):
    """
    Batch Coordinator responds to, resolves, or escalates an issue to Admin.
    """
    updated = await update_coordinator_issue(
        db=db,
        identifier=issue_id,
        coordinator_user=current_user,
        status=body.status,
        response_notes=body.response_notes,
        escalate_to_admin=body.escalate_to_admin or False,
    )
    return {
        "status": "success",
        "message": f"Issue {updated.issue_id} updated to {updated.status}.",
        "issue_id": updated.issue_id,
        "issue_status": updated.status,
        "admin_response": updated.admin_response,
        "escalated_to_admin": updated.escalated_to_admin,
    }
