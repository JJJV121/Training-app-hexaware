import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.course import Course, Enrollment, LearningUnit, CourseDay
from app.models.batch_models import BatchTrainee, Batch


async def check_enrollments():
    print("==================================================")
    print("   CHECKING ALL USER ENROLLMENTS & COURSES")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        # Fetch all courses
        res_c = await db.execute(select(Course))
        courses = res_c.scalars().all()
        print(f"[OK] Total Courses in DB: {len(courses)}")
        for c in courses:
            res_days = await db.execute(select(CourseDay).where(CourseDay.course_id == c.id))
            days = res_days.scalars().all()
            print(f" - Course ID {c.id}: '{c.name}' | Days count: {len(days)}")

        print("\n=== USER ENROLLMENTS ===")
        res_u = await db.execute(select(User).order_by(User.id.asc()))
        users = res_u.scalars().all()

        for u in users:
            res_e = await db.execute(select(Enrollment).where(Enrollment.user_id == u.id))
            enrollments = res_e.scalars().all()
            e_course_ids = [e.course_id for e in enrollments]
            print(f"User ID {u.id:<3} | {u.email:<30} | Role: {u.role:<8} | Enrolled Course IDs: {e_course_ids}")

if __name__ == "__main__":
    asyncio.run(check_enrollments())
