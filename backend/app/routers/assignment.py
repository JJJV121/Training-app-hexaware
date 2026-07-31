from datetime import datetime
import os

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.assignment import Assignment, AssignmentType

router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_assignment(
    course_day_id: int = Form(...),
    due_date: datetime = Form(...),
    created_by: int = Form(...),
    assignment_type: AssignmentType = Form(...),
    total_marks: int = Form(...),
    passing_marks: int = Form(...),
    title: str = Form(...),
    description: str | None = Form(None),
    instructions: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
):
    file_path = None

    if file:
        filename = (
            f"{int(datetime.now().timestamp())}_{file.filename}"
        )
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

    if due_date.tzinfo is not None:
        due_date = due_date.replace(tzinfo=None)
        
    assignment = Assignment(
        course_day_id=course_day_id,
        due_date=due_date,
        created_by=created_by,
        assignment_type=assignment_type,
        total_marks=total_marks,
        passing_marks=passing_marks,
        title=title,
        description=description,
        instructions=instructions,
        attachment_path=file_path,
    )

    db.add(assignment)

    try:
        await db.commit()
        await db.refresh(assignment)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    return assignment