from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch import Batch
from app.models.batch_trainee import BatchTrainee
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.course_day import CourseDay


async def get_module_analytics(
    db: AsyncSession,
    batch_id: int
):
    """
    Calculate module-wise average performance
    for trainees belonging to a selected batch.
    """

    query = (
        select(
            CourseDay.id.label("module_id"),
            CourseDay.title.label("module_name"),

            func.avg(
                AssignmentSubmission.marks
                * 100.0
                / Assignment.total_marks
            ).label("avg_score")
        )
        .select_from(Batch)
        .join(
            BatchTrainee,
            BatchTrainee.batch_id == Batch.id
        )
        .join(
            AssignmentSubmission,
            AssignmentSubmission.user_id
            == BatchTrainee.trainee_id
        )
        .join(
            Assignment,
            Assignment.id
            == AssignmentSubmission.assignment_id
        )
        .join(
            CourseDay,
            CourseDay.id
            == Assignment.course_day_id
        )
        .where(
            Batch.id == batch_id,

            # Assignment must belong to the
            # same course as the selected batch
            CourseDay.course_id == Batch.course_id,

            # Only evaluated submissions
            AssignmentSubmission.marks.is_not(None),
            AssignmentSubmission.evaluated_at.is_not(None),

            # Avoid division by zero
            Assignment.total_marks > 0
        )
        .group_by(
            CourseDay.id,
            CourseDay.title
        )
        .order_by(
            CourseDay.day_number
        )
    )

    result = await db.execute(query)

    rows = result.all()

    return [
        {
            "id": str(row.module_id),
            "name": row.module_name,
            "avgScore": round(float(row.avg_score), 2)
        }
        for row in rows
    ]


async def get_analytics_alerts(
    db: AsyncSession,
    batch_id: int
):
    """
    Return modules whose average score
    is below the 65% benchmark.
    """

    module_analytics = await get_module_analytics(
        db=db,
        batch_id=batch_id
    )

    alerts = []

    for module in module_analytics:

        if module["avgScore"] < 65:

            alerts.append(
                {
                    "id": module["id"],
                    "name": module["name"],
                    "avgScore": module["avgScore"],
                    "alertType": "WEAKNESS_IDENTIFIED",
                    "recommendation": (
                        "Review sessions recommended"
                    )
                }
            )

    return alerts