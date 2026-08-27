from sqlalchemy import and_, or_, select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.activation_token import ActivationToken
from app.models.enrollment import Enrollment
from app.models.password_reset_token import PasswordResetToken
from app.models.login_history import LoginHistory
from app.models.progress import Progress
from app.models.video_progress import VideoProgress
from app.models.batch_models import BatchTrainee
from app.models.assignment_submission import AssignmentSubmission
from app.models.attendance_record import AttendanceRecord
from app.schemas.user import UserCreate
from app.schemas.admin_user import (
    TrainerCreate,
    TraineeCreate,
    AdminUserUpdate,
)
from app.services.auth_service import create_user, generate_activation_token, build_activation_link
from app.services.email_service import send_activation_email


async def _serialize_user_with_courses(db: AsyncSession, user: User | None):
    if user is None:
        return None

    course_rows = await db.execute(
        select(Enrollment.course_id)
        .where(Enrollment.user_id == user.id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    course_ids = [int(course_id) for course_id, in course_rows.all() if course_id is not None]
    primary_course_id = course_ids[0] if course_ids else None

    return {
        "id": user.id,
        "employee_id": user.employee_id,
        "name": user.name,
        "email": user.email,
        "course_id": primary_course_id,
        "course_ids": course_ids,
        "college_name": user.college_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }


async def get_users_by_role(
    db: AsyncSession,
    role: str,
):
    result = await db.execute(
        select(User)
        .where(func.lower(User.role) == role.lower())
        .order_by(User.name)
    )

    users = result.scalars().all()
    return [await _serialize_user_with_courses(db, user) for user in users]


async def get_user_by_id_and_role(
    db: AsyncSession,
    user_id: int,
    role: str,
):
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            func.lower(User.role) == role.lower(),
        )
    )

    user = result.scalar_one_or_none()
    return await _serialize_user_with_courses(db, user)


async def create_trainer(
    db: AsyncSession,
    trainer_data: TrainerCreate,
):
    user = UserCreate(
        employee_id=trainer_data.employee_id,
        name=trainer_data.name,
        email=trainer_data.email,
        course_id=trainer_data.course_id,
        role="trainer",
        password=trainer_data.password,
    )

    return await create_user(db, user)


async def create_trainee(
    db: AsyncSession,
    trainee_data: TraineeCreate,
):
    from app.core.security import hash_password
    from app.models.enrollment import Enrollment
    from app.models.course import Course
    from app.services.email_service import send_student_welcome_email

    existing_user = await db.scalar(
        select(User).where(User.email == trainee_data.email)
    )
    if existing_user:
        raise ValueError("User with this email already exists")

    from app.core.password_validation import validate_password_syntax

    if trainee_data.password:
        validate_password_syntax(trainee_data.password)

    # Initial state is False (Inactive) per requirement
    user = User(
        employee_id=trainee_data.employee_id,
        name=trainee_data.name,
        email=trainee_data.email,
        college_name=trainee_data.college_name,
        role="trainee",
        is_active=False,
        password_hash=hash_password(trainee_data.password) if trainee_data.password else None,
        password_changed_at=datetime.utcnow() if trainee_data.password else None,
    )

    db.add(user)
    await db.flush()

    # Handle multi-course or single course enrollment
    course_ids = []
    if trainee_data.course_ids:
        course_ids = trainee_data.course_ids
    elif trainee_data.course_id:
        course_ids = [trainee_data.course_id]

    course_names = []
    for cid in course_ids:
        enrollment = Enrollment(
            user_id=user.id,
            course_id=cid,
        )
        db.add(enrollment)
        
        c = await db.get(Course, cid)
        if c:
            course_names.append(c.title)

    await db.commit()
    await db.refresh(user)

    # Trigger welcome email upon successful creation
    try:
        await send_student_welcome_email(user.email, user.name or "Student", course_names)
    except Exception as e:
        print("Notice: email trigger log:", e)

    return user


async def update_user(
    db: AsyncSession,
    user_id: int,
    role: str,
    data: AdminUserUpdate,
):
    user = await db.execute(
        select(User).where(
            User.id == user_id,
            func.lower(User.role) == role.lower(),
        )
    )
    user = user.scalar_one_or_none()

    if not user:
        return None

    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return await _serialize_user_with_courses(db, user)


async def delete_user(
    db: AsyncSession,
    user_id: int,
    role: str,
):
    user = await db.execute(
        select(User).where(
            User.id == user_id,
            func.lower(User.role) == role.lower(),
        )
    )
    user = user.scalar_one_or_none()

    if not user:
        return False

    await db.execute(delete(ActivationToken).where(ActivationToken.user_id == user_id))
    await db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user_id))
    await db.execute(delete(LoginHistory).where(LoginHistory.user_id == user_id))
    await db.execute(delete(Progress).where(Progress.user_id == user_id))
    await db.execute(delete(VideoProgress).where(VideoProgress.user_id == user_id))
    await db.execute(delete(Enrollment).where(Enrollment.user_id == user_id))
    await db.execute(delete(BatchTrainee).where(BatchTrainee.trainee_id == user_id))
    await db.execute(delete(AssignmentSubmission).where(AssignmentSubmission.user_id == user_id))
    await db.execute(delete(AttendanceRecord).where(AttendanceRecord.trainee_id == user_id))

    await db.delete(user)
    await db.commit()

    return True


async def search_users(
    db: AsyncSession,
    role: str,
    keyword: str,
):
    result = await db.execute(
        select(User).where(
            func.lower(User.role) == role.lower(),
            or_(
                User.name.ilike(f"%{keyword}%"),
                User.email.ilike(f"%{keyword}%"),
                User.employee_id.ilike(f"%{keyword}%"),
            ),
        )
    )

    users = result.scalars().all()
    return [await _serialize_user_with_courses(db, user) for user in users]


async def filter_users(
    db: AsyncSession,
    role: str,
    course_id: int | None = None,
    is_active: bool | None = None,
):
    filters = [func.lower(User.role) == role.lower()]
    user_query = select(User)

    if course_id is not None:
        user_query = user_query.join(Enrollment, Enrollment.user_id == User.id)
        filters.append(Enrollment.course_id == course_id)

    if is_active is not None:
        filters.append(User.is_active == is_active)

    result = await db.execute(
        user_query
        .where(and_(*filters))
        .distinct()
        .order_by(User.name)
    )

    users = result.scalars().all()
    return [await _serialize_user_with_courses(db, user) for user in users]


async def update_user_status(
    db: AsyncSession,
    user_id: int,
    role: str,
    is_active: bool,
):
    user = await db.execute(
        select(User).where(
            User.id == user_id,
            func.lower(User.role) == role.lower(),
        )
    )
    user = user.scalar_one_or_none()

    if not user:
        return None

    was_inactive = not user.is_active and is_active
    user.is_active = is_active

    if was_inactive:
        token_obj = await generate_activation_token(db, user.id)
        activation_link = build_activation_link(token_obj.token, user.email)
        await send_activation_email(user.email, activation_link, user.name)

    await db.commit()
    await db.refresh(user)

    return await _serialize_user_with_courses(db, user)