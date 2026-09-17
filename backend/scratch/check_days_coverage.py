import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.assignment import Assignment
from app.models.assessment import Assessment
from app.models.mcq_bank import MCQQuestionBank
from app.models.course_day_qa import CourseDayQA

async def check_coverage():
    async with AsyncSessionLocal() as db:
        courses = (await db.execute(select(Course).order_by(Course.id))).scalars().all()
        
        for course in courses:
            print(f"\n==================================================")
            print(f"Course {course.id}: {course.title}")
            print(f"==================================================")
            
            days = (await db.execute(
                select(CourseDay).where(CourseDay.course_id == course.id).order_by(CourseDay.day_number)
            )).scalars().all()
            
            for day in days:
                # 1. Units
                units = (await db.execute(
                    select(LearningUnit).where(LearningUnit.day_id == day.id)
                )).scalars().all()
                unit_ids = [u.id for u in units]
                unit_titles = [u.title for u in units]

                # 2. Practice MCQs matching unit_ids or topic
                mcqs_count = 0
                for u in units:
                    mcq_res = await db.execute(
                        select(MCQQuestionBank).where(
                            (MCQQuestionBank.learning_unit_id == u.id) |
                            (MCQQuestionBank.topic.ilike(f"%{u.title}%"))
                        )
                    )
                    mcqs_count += len(mcq_res.scalars().all())

                # 3. Daily Assignments
                assign_res = await db.execute(
                    select(Assignment).where(Assignment.course_day_id == day.id)
                )
                assignments = assign_res.scalars().all()

                # 4. Assessments (Daily / Graded)
                assess_res = await db.execute(
                    select(Assessment).where(
                        (Assessment.course_day_id == day.id) |
                        (Assessment.learning_unit_id.in_(unit_ids) if unit_ids else False)
                    )
                )
                assessments = assess_res.scalars().all()

                # 5. CourseDay QAs
                qa_res = await db.execute(
                    select(CourseDayQA).where(CourseDayQA.course_day_id == day.id)
                )
                qas = qa_res.scalars().all()

                print(f"Day {day.day_number:2d} (id={day.id:2d}, title='{day.title}'):")
                print(f"   - Units ({len(units)}): {unit_titles}")
                print(f"   - Practice MCQs matched: {mcqs_count}")
                print(f"   - Assignments ({len(assignments)}): {[a.title for a in assignments]}")
                print(f"   - Assessments ({len(assessments)}): {[s.title for s in assessments]}")
                print(f"   - Day Q&A ({len(qas)}): {[q.question[:30] + '...' for q in qas]}")

if __name__ == "__main__":
    asyncio.run(check_coverage())
