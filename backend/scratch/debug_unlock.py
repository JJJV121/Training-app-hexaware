import asyncio
from app.database.session import AsyncSessionLocal
from app.models.assignment import Assignment
from app.models.course_day import CourseDay
from app.models.user import User
from app.services.assignment_unlock_service import is_assignment_unlocked
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as db:
        user = await db.scalar(select(User).where(User.email == "matrix_trainee1@example.com"))
        assignment = await db.scalar(select(Assignment).order_by(Assignment.id.desc()))
        course_day = await db.scalar(select(CourseDay).where(CourseDay.id == assignment.course_day_id))
        
        print("Assignment ID:", assignment.id)
        print("CourseDay ID:", course_day.id, "Day Number:", course_day.day_number, "Course ID:", course_day.course_id)
        
        from app.services.assignment_unlock_service import are_days_completed
        from app.models.learning_unit import LearningUnit
        from app.models.progress import Progress

        days_res = await db.execute(select(CourseDay).where(CourseDay.course_id == course_day.course_id))
        print("All days for course:", [(d.id, d.day_number) for d in days_res.scalars().all()])

        unlocked = await is_assignment_unlocked(db, assignment, user.id)
        print("Is Unlocked:", unlocked)

if __name__ == "__main__":
    asyncio.run(check())
