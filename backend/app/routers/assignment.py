from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentType,
    AssignmentUpdate,
)
from app.schemas.assignment_submission import AssignmentSubmissionResponse
from app.services.assignment_service import (
    create_assignment,
    delete_assignment,
    get_all_assignments,
    get_assignment_by_id,
    update_assignment,
)
from app.services.assignment_submission_service import (
    get_assignment_submissions,
)
from app.utils.file_upload import save_uploaded_file


router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"],
)


# -------------------- Create Assignment --------------------

@router.post(
    "/",
    response_model=AssignmentResponse,
)
async def create_assignment_api(
    course_day_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    assignment_type: AssignmentType = Form(...),
    instructions: str = Form(...),
    total_marks: int = Form(...),
    passing_marks: int = Form(...),
    due_date: datetime = Form(...),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only trainers can create assignments
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=403,
            detail="Only trainers can create assignments.",
        )

    attachment_path = None

    if file:
        attachment_path = await save_uploaded_file(
            file=file,
            folder="assignments",
        )

    assignment_data = AssignmentCreate(
        course_day_id=course_day_id,
        title=title,
        description=description,
        assignment_type=assignment_type,
        instructions=instructions,
        due_date=due_date,
        total_marks=total_marks,
        passing_marks=passing_marks,
    )

    return await create_assignment(
        db=db,
        data=assignment_data,
        created_by=current_user.id,
        attachment_path=attachment_path,
    )


# -------------------- Get All Assignments --------------------

@router.get(
    "/",
    response_model=list[AssignmentResponse],
)
async def get_assignments_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_all_assignments(db)


# -------------------- Update Assignment --------------------

@router.put(
    "/{assignment_id}",
    response_model=AssignmentResponse,
)
async def update_assignment_api(
    assignment_id: int,
    title: str | None = Form(None),
    description: str | None = Form(None),
    assignment_type: AssignmentType | None = Form(None),
    instructions: str | None = Form(None),
    due_date: datetime | None = Form(None),
    total_marks: int | None = Form(None),
    passing_marks: int | None = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only trainers can update assignments
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=403,
            detail="Only trainers can update assignments.",
        )

    assignment = await get_assignment_by_id(
        db,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    attachment_path = assignment.attachment_path

    if file:
        attachment_path = await save_uploaded_file(
            file=file,
            folder="assignments",
        )

    update_fields = {}

    if title is not None:
        update_fields["title"] = title

    if description is not None:
        update_fields["description"] = description

    if assignment_type is not None:
        update_fields["assignment_type"] = assignment_type

    if instructions is not None:
        update_fields["instructions"] = instructions

    if due_date is not None:
        update_fields["due_date"] = due_date

    if total_marks is not None:
        update_fields["total_marks"] = total_marks

    if passing_marks is not None:
        update_fields["passing_marks"] = passing_marks

    update_data = AssignmentUpdate(**update_fields)

    return await update_assignment(
        db=db,
        assignment=assignment,
        data=update_data,
        attachment_path=attachment_path,
    )


# -------------------- Delete Assignment --------------------

@router.delete("/{assignment_id}")
async def delete_assignment_api(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only trainers can delete assignments
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=403,
            detail="Only trainers can delete assignments.",
        )

    assignment = await get_assignment_by_id(
        db,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    await delete_assignment(
        db,
        assignment,
    )

    return {
        "message": "Assignment deleted successfully"
    }


# -------------------- Get Assignment --------------------

@router.get(
    "/{assignment_id}",
    response_model=AssignmentResponse,
)
async def get_assignment_api(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = await get_assignment_by_id(
        db,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    return assignment


# -------------------- Get Assignment Submissions --------------------

@router.get(
    "/{assignment_id}/submissions",
    response_model=list[AssignmentSubmissionResponse],
)
async def get_assignment_submissions_api(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only trainers can view submissions
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=403,
            detail="Only trainers can view assignment submissions.",
        )

    assignment = await get_assignment_by_id(
        db,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    return await get_assignment_submissions(
        db,
        assignment_id,
    )
