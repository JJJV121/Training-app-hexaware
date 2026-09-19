from fastapi import APIRouter, Depends, HTTPException, Response, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin, require_coordinator_or_admin
from app.database.session import get_db
from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.services.report_service import (
    get_trainee_report_card,
    get_batch_report_cards,
    update_report_override,
)
from app.utils.excel_generator import (
    generate_single_trainee_excel,
    generate_batch_excel,
)
from app.utils.pdf_generator import (
    generate_single_trainee_pdf,
    generate_batch_pdf_zip,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


class UpdateReportOverrideSchema(BaseModel):
    batch_id: int
    comment_reason: str | None = None
    final_status_override: str | None = None


# Helper to check batch coordinator authorization
async def verify_coordinator_batch_access(db: AsyncSession, current_user: User, batch_id: int):
    user_role = (current_user.role or "").upper()
    if user_role == "ADMIN":
        return True
        coord_id = getattr(batch, "spoc_id", None) or getattr(batch, "coordinator_id", None)
        if not batch or (coord_id != current_user.id and batch.created_by != current_user.id):
            raise HTTPException(status_code=403, detail="Access denied: You are not assigned to this batch.")
        return True
    return False


# --------------------------------------------------
# Report Card JSON API Endpoints
# --------------------------------------------------

@router.get("/trainees")
async def get_trainees_report_list(
    batch_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_role = (current_user.role or "").upper()

    if user_role == "TRAINEE":
        card = await get_trainee_report_card(db, current_user.id, batch_id)
        return [card]

    # Admin / Coordinator / Trainer handling
    stmt = (
        select(User.id, User.name, User.email, User.employee_id, BatchTrainee.batch_id, Batch.name.label("batch_name"))
        .join(BatchTrainee, User.id == BatchTrainee.trainee_id)
        .join(Batch, Batch.id == BatchTrainee.batch_id)
    )

    if user_role in ["BATCH_COORDINATOR", "COORDINATOR"]:
        stmt = stmt.where((Batch.spoc_id == current_user.id) | (Batch.created_by == current_user.id))
    elif user_role == "TRAINER":
        stmt = stmt.where(Batch.trainer_id == current_user.id)

    if batch_id:
        stmt = stmt.where(BatchTrainee.batch_id == batch_id)

    stmt = stmt.order_by(User.name)
    rows = (await db.execute(stmt)).all()

    summary_list = []
    for r in rows:
        summary_list.append({
            "trainee_id": r.id,
            "name": r.name or r.employee_id or "Trainee",
            "email": r.email,
            "employee_id": r.employee_id or f"HX{r.id:03d}",
            "batch_id": r.batch_id,
            "batch_name": r.batch_name,
        })

    return summary_list


@router.get("/trainees/{trainee_id}/performance-card")
async def get_trainee_performance_card(
    trainee_id: int,
    batch_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_role = (current_user.role or "").upper()
    if user_role == "TRAINEE" and current_user.id != trainee_id:
        raise HTTPException(status_code=403, detail="Access denied: Trainee can only view own performance report card.")

    if user_role in ["BATCH_COORDINATOR", "COORDINATOR"] and batch_id:
        await verify_coordinator_batch_access(db, current_user, batch_id)

    card = await get_trainee_report_card(db, trainee_id, batch_id)
    return card


@router.get("/batches/{batch_id}/performance-cards")
async def get_batch_performance_cards_endpoint(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_coordinator_batch_access(db, current_user, batch_id)
    cards = await get_batch_report_cards(db, batch_id)
    return cards


# --------------------------------------------------
# Report Card Exports (Excel / PDF / ZIP)
# --------------------------------------------------

@router.get("/trainees/{trainee_id}/export/excel")
async def export_trainee_excel(
    trainee_id: int,
    batch_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = await get_trainee_report_card(db, trainee_id, batch_id)
    superset_id = card["personal_info"].get("superset_id", "HX001")
    excel_bytes = generate_single_trainee_excel(card)

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="Trainee_Performance_Report_{superset_id}.xlsx"'},
    )


@router.get("/trainees/{trainee_id}/export/pdf")
async def export_trainee_pdf(
    trainee_id: int,
    batch_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = await get_trainee_report_card(db, trainee_id, batch_id)
    superset_id = card["personal_info"].get("superset_id", "HX001")
    pdf_bytes = generate_single_trainee_pdf(card)

    return Response(
        content=pdf_bytes,
        media_type="text/html",  # Renders formatted HTML/Printable PDF document
        headers={"Content-Disposition": f'inline; filename="Trainee_Performance_Report_{superset_id}.html"'},
    )


@router.get("/batches/{batch_id}/export/excel")
async def export_batch_excel(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_coordinator_batch_access(db, current_user, batch_id)
    cards = await get_batch_report_cards(db, batch_id)
    batch = await db.get(Batch, batch_id)
    b_name = batch.name.replace(" ", "_") if batch else "BATCH"

    excel_bytes = generate_batch_excel(cards, batch_name=b_name)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{b_name}_Performance_Reports.xlsx"'},
    )


@router.get("/batches/{batch_id}/export/bulk-zip")
async def export_batch_bulk_zip(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_coordinator_batch_access(db, current_user, batch_id)
    cards = await get_batch_report_cards(db, batch_id)
    batch = await db.get(Batch, batch_id)
    b_name = batch.name.replace(" ", "_") if batch else "BATCH"

    excel_bytes = generate_batch_excel(cards, batch_name=b_name)
    zip_bytes = generate_batch_pdf_zip(cards, excel_bytes=excel_bytes)

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{b_name}_Performance_Reports.zip"'},
    )


# --------------------------------------------------
# Report Card Overrides & Custom Comments
# --------------------------------------------------

@router.patch("/trainees/{trainee_id}/comment")
async def patch_report_comment_override(
    trainee_id: int,
    data: UpdateReportOverrideSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin),
):
    await verify_coordinator_batch_access(db, current_user, data.batch_id)
    override = await update_report_override(
        db,
        trainee_id=trainee_id,
        batch_id=data.batch_id,
        comment_reason=data.comment_reason,
        final_status_override=data.final_status_override,
        current_user_id=current_user.id,
    )
    return {"message": "Report comment updated successfully", "override_id": override.id}
