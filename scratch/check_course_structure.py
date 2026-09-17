import asyncio
import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/../backend")

from app.database.session import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT id, title FROM courses;"))
        print("COURSES:", res.all())

        res = await db.execute(text("SELECT id, day_number, title FROM course_days WHERE course_id = 1 ORDER BY day_number;"))
        print("\nJAVA COURSE DAYS:")
        for r in res.all():
            print(f"Day {r[1]} (id={r[0]}): {r[2]}")

        res = await db.execute(text("""
            SELECT lu.id, lu.day_id, cd.day_number, lu.title, lu.display_order 
            FROM learning_units lu
            JOIN course_days cd ON lu.day_id = cd.id
            WHERE cd.course_id = 1
            ORDER BY cd.day_number, lu.display_order;
        """))
        print("\nJAVA LEARNING UNITS:")
        for r in res.all():
            print(f"Unit id={r[0]} (Day {r[2]}): {r[3]}")

        res = await db.execute(text("SELECT id, title, assessment_type, duration_minutes, passing_marks, total_marks FROM assessments;"))
        print("\nASSESSMENTS:")
        for r in res.all():
            print(dict(r._mapping))

if __name__ == "__main__":
    asyncio.run(check())
