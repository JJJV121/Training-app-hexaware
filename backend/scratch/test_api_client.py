import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import AsyncSessionLocal
from app.services.day_processor_service import process_course_day
from app.services.assignment_service import get_assignment_questions
from app.models.assignment import Assignment
from sqlalchemy import select

async def test_api():
    async with AsyncSessionLocal() as db:
        await process_course_day(db, 1, 3) # Day 3 MySQL
        stmt = select(Assignment).where(Assignment.course_day_id == 3)
        asgs = (await db.execute(stmt)).scalars().all()
        print(f"Day 3 Assignments Count: {len(asgs)}")
        for a in asgs:
            print(f"Assignment ID: {a.id}, Title: {a.title}, Type: {a.assignment_type}")
            q_list = await get_assignment_questions(db, a.id)
            print(f"  Questions Count: {len(q_list)}")
            for q in q_list:
                print(f"   - [{q['id']}] {q['title']}: {len(q.get('test_cases', []))} test cases (Language: {q.get('language')})")

if __name__ == "__main__":
    asyncio.run(test_api())
