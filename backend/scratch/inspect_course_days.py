import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit


async def inspect_days():
    async with AsyncSessionLocal() as db:
        res_c = await db.execute(select(Course))
        courses = res_c.scalars().all()

        for c in courses:
            print(f"\n==================== COURSE ID {c.id}: {c.title} ====================")
            res_d = await db.execute(select(CourseDay).where(CourseDay.course_id == c.id).order_by(CourseDay.day_number))
            days = res_d.scalars().all()
            for d in days:
                res_u = await db.execute(select(LearningUnit).where(LearningUnit.day_id == d.id))
                units = res_u.scalars().all()
                unit_titles = [u.title for u in units]
                print(f" Day {d.day_number:<2} (ID {d.id}): {d.title:<35} | Units: {unit_titles[:3]}")

if __name__ == "__main__":
    asyncio.run(inspect_days())
