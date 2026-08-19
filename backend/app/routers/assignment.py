from datetime import datetime
from fastapi import status

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
from app.core.dependencies import get_current_user, get_current_trainer
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentType,
    AssignmentUpdate,
    AssignmentQuestionResponse,
    AssignmentAnswersSubmit,
    AssignmentEvaluationResult,
)
from app.schemas.assignment_submission import AssignmentSubmissionResponse
from app.services.assignment_service import (
    create_assignment,
    delete_assignment,
    get_all_assignments,
    get_assignment_by_id,
    update_assignment,
    get_assignment_questions,
    evaluate_assignment_answers,
)
from app.utils.file_upload import save_uploaded_file
from app.services.assignment_submission_service import get_assignment_submissions

router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"],
)


# -------------------- Create Assignment --------------------

@router.post("/", response_model=AssignmentResponse)
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
    current_trainer: User = Depends(get_current_trainer),
):
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
        created_by=current_trainer.id,
        attachment_path=attachment_path,
    )


# -------------------- Get All Assignments --------------------

@router.get("/", response_model=list[AssignmentResponse])
async def get_assignments_api(
    db: AsyncSession = Depends(get_db),
):
    return await get_all_assignments(db)


# -------------------- Update Assignment --------------------

@router.put("/{assignment_id}", response_model=AssignmentResponse)
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

    await delete_assignment(
        db,
        assignment,
    )

    return {
        "message": "Assignment deleted successfully"
    }


@router.get(
    "/{assignment_id}",
    response_model=AssignmentResponse,
)
async def get_assignment_api(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
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

@router.get(
    "/{assignment_id}/submissions",
    response_model=list[AssignmentSubmissionResponse],
)
async def get_assignment_submissions_api(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
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

    return await get_assignment_submissions(
        db,
        assignment_id,
    )


# -------------------- Get 3 Dynamic Questions for Assignment --------------------

@router.get(
    "/{assignment_id}/questions",
    response_model=list[AssignmentQuestionResponse],
)
async def get_assignment_questions_api(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await get_assignment_questions(
        db,
        assignment_id,
    )


# -------------------- Submit Answers & Evaluate Assignment --------------------

@router.post(
    "/{assignment_id}/submit-answers",
    response_model=AssignmentEvaluationResult,
)
async def submit_assignment_answers_api(
    assignment_id: int,
    payload: AssignmentAnswersSubmit,
    db: AsyncSession = Depends(get_db),
):
    return await evaluate_assignment_answers(
        db=db,
        assignment_id=assignment_id,
        user_id=payload.user_id,
        answers=payload.answers,
    )

# -------------------- Get Assignments by Course and Day --------------------
from sqlalchemy import select
from app.models.assignment import Assignment
from app.models.course_day import CourseDay
from app.models.assignment_submission import AssignmentSubmission
from fastapi.responses import FileResponse
import os

@router.get("/course/{course_id}/day/{day_id}", response_model=list[AssignmentResponse])
async def get_course_day_assignments(
    course_id: int,
    day_id: int,
    db: AsyncSession = Depends(get_db),
):
    # Validate Course Day belongs to Course
    day = await db.scalar(
        select(CourseDay).where(
            CourseDay.id == day_id,
            CourseDay.course_id == course_id
        )
    )
    if not day:
        raise HTTPException(
            status_code=404,
            detail="Course day not found under this course."
        )

    if day and day.day_number in [1, 2]:
        return []

    # Auto-process day content checking first
    from app.services.day_processor_service import process_course_day
    await process_course_day(db, course_id, day_id)

    result = await db.execute(
        select(Assignment).where(
            Assignment.course_day_id == day_id
        )
    )
    return result.scalars().all()

# -------------------- Trainee Endpoints --------------------

@router.get("/trainee/assignments", response_model=list[AssignmentResponse])
async def get_trainee_assignments(
    course_day_id: int,
    db: AsyncSession = Depends(get_db)
):
    from app.models.course_day import CourseDay
    day = await db.get(CourseDay, course_day_id)
    if day:
        if day.day_number in [1, 2]:
            return []
        from app.services.day_processor_service import process_course_day
        await process_course_day(db, day.course_id, course_day_id)

    result = await db.execute(
        select(Assignment).where(Assignment.course_day_id == course_day_id)
    )
    return result.scalars().all()

@router.get("/trainee/my-submissions", response_model=list[AssignmentSubmissionResponse])
async def get_trainee_my_submissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AssignmentSubmission).where(AssignmentSubmission.user_id == current_user.id)
    )
    return result.scalars().all()

@router.get("/trainee/assignments/{assignment_id}/download")
async def download_assignment_file(
    assignment_id: int,
    db: AsyncSession = Depends(get_db)
):
    assignment = await db.get(Assignment, assignment_id)
    if not assignment or not assignment.attachment_path:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    file_path = assignment.attachment_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical file not found")
        
    return FileResponse(file_path, filename=os.path.basename(file_path))

@router.post("/trainee/assignments/{assignment_id}/submit", response_model=AssignmentSubmissionResponse)
async def submit_trainee_assignment(
    assignment_id: int,
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    submission_path = await save_uploaded_file(
        file=file,
        folder="submissions"
    )
    
    stmt = select(AssignmentSubmission).where(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.user_id == user_id
    )
    existing = await db.scalar(stmt)
    if existing:
        existing.submission_path = submission_path
        existing.status = "SUBMITTED"
        existing.submitted_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return existing
    
    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        user_id=user_id,
        submission_path=submission_path,
        status="SUBMITTED",
        submitted_at=datetime.utcnow()
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    return submission
