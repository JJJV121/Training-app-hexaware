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
from app.core.dependencies import require_trainer, require_trainee
from app.models.user import User
from app.schemas.assignment_submission import (
    AssignmentSubmissionResponse,
    AssignmentEvaluation,
)
from app.services.assignment_submission_service import (
    submit_assignment,
    evaluate_submission,
    get_submission_by_id,
    get_user_submissions,
    get_assignment_submissions,
)
from app.utils.file_upload import save_uploaded_file

router = APIRouter(
    prefix="/assignment-submissions",
    tags=["Assignment Submissions"],
)


@router.post("/", response_model=AssignmentSubmissionResponse)
async def submit_assignment_api(
    assignment_id: int = Form(...),
    submission_text: str | None = Form(None),
    github_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_trainee),
):
    submission_path = None

    if file:
        submission_path = await save_uploaded_file(
            file=file,
            folder="submissions",
        )

    return await submit_assignment(
        db=db,
        assignment_id=assignment_id,
        user_id=current_user.id,
        submission_text=submission_text,
        github_url=github_url,
        submission_path=submission_path,
    )


@router.put("/{submission_id}/evaluate",
            response_model=AssignmentSubmissionResponse)
async def evaluate_submission_api(
    submission_id: int,
    data: AssignmentEvaluation,
    db: AsyncSession = Depends(get_db),
    current_trainer: User = Depends(require_trainer),
):
    submission = await get_submission_by_id(
        db,
        submission_id,
    )

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Submission not found",
        )

    return await evaluate_submission(
        db,
        submission,
        current_trainer.id,
        data,
    )


@router.get("/my",
            response_model=list[AssignmentSubmissionResponse])
async def my_submissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_trainee),
):
    return await get_user_submissions(
        db,
        current_user.id,
    )