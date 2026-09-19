from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_optional_user
from app.models.user import User
from app.services.mass_enrollment_service import (
    get_csv_template,
    validate_csv_upload,
    process_mass_import,
)

router = APIRouter(
    prefix="/admin/mass-enrollment",
    tags=["Mass Enrollment"],
)


class MassImportRequest(BaseModel):
    enrollment_type: str
    rows: List[dict[str, Any]]
    course_id: int | None = None


@router.get(
    "/template/{enrollment_type}",
    status_code=status.HTTP_200_OK,
)
async def download_template(enrollment_type: str):
    try:
        csv_content = get_csv_template(enrollment_type)
        filename = f"{enrollment_type.lower()}_import_template.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@router.post(
    "/validate",
    status_code=status.HTTP_200_OK,
)
async def validate_csv(
    enrollment_type: str = Form(...),
    file: UploadFile = File(...),
    course_id: int | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user),
):
    if enrollment_type.lower() == "question_bank" and (current_user.role or "").upper() not in {"BATCH_COORDINATOR", "COORDINATOR"}:
        raise HTTPException(status_code=403, detail="Only Batch Coordinators can import MCQs.")
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only CSV files are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    try:
        validation_result = await validate_csv_upload(db, enrollment_type, file_bytes, course_id=course_id)
        return validation_result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(exc)}")


@router.post(
    "/import",
    status_code=status.HTTP_200_OK,
)
async def execute_import(
    payload: MassImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user),
):
    if payload.enrollment_type.lower() == "question_bank" and (current_user.role or "").upper() not in {"BATCH_COORDINATOR", "COORDINATOR"}:
        raise HTTPException(status_code=403, detail="Only Batch Coordinators can import MCQs.")
    if not payload.rows:
        raise HTTPException(status_code=400, detail="No rows provided for import.")

    try:
        result = await process_mass_import(
            db=db,
            enrollment_type=payload.enrollment_type,
            rows=payload.rows,
            course_id=payload.course_id,
            created_by=1,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Mass import failed: {str(exc)}")
