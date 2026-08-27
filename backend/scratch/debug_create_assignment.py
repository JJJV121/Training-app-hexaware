import asyncio
from datetime import datetime, timedelta
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.course_day import CourseDay
from app.schemas.assignment import AssignmentCreate, AssignmentType
from app.services.assignment_service import create_assignment
from sqlalchemy import select

async def debug():
    async with AsyncSessionLocal() as db:
        admin = await db.scalar(select(User).where(User.role == "ADMIN"))
        print("Admin user:", admin.id, admin.email)
        
        course_day = await db.scalar(select(CourseDay))
        print("Course day:", course_day.id, course_day.title)

        data = AssignmentCreate(
            course_day_id=course_day.id,
            title="Debug Test Assignment",
            description="Debug test description",
            assignment_type=AssignmentType.NON_CODING,
            instructions="Debug instructions",
            due_date=datetime.utcnow() + timedelta(days=7),
            total_marks=100,
            passing_marks=50,
        )

        try:
            assignment = await create_assignment(
                db=db,
                data=data,
                created_by=admin.id,
                attachment_path=None
            )
            print("Successfully created assignment:", assignment.id)
        except Exception as e:
            print("Error creating assignment:", type(e), e)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug())
