import asyncio
import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/../backend")

from app.database.session import AsyncSessionLocal

async def inspect():
    async with AsyncSessionLocal() as session:
        print("=== COLUMNS IN TABLES ===")
        res = await session.execute(text("""
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        """))
        cols = res.all()
        by_table = {}
        for t, c, d in cols:
            by_table.setdefault(t, []).append((c, d))
        
        for t, clist in by_table.items():
            print(f"\nTable: {t}")
            for c, d in clist:
                print(f"  - {c} ({d})")

        print("\n=== COURSES Data ===")
        res = await session.execute(text("SELECT * FROM courses;"))
        for r in res.mappings().all():
            print("Course:", dict(r))

        print("\n=== COURSE DAYS Data ===")
        res = await session.execute(text("SELECT * FROM course_days WHERE course_id = 1;"))
        for r in res.mappings().all():
            print("CourseDay:", dict(r))

        print("\n=== LEARNING UNITS Data ===")
        res = await session.execute(text("SELECT lu.* FROM learning_units lu JOIN course_days cd ON lu.day_id = cd.id WHERE cd.course_id = 1;"))
        for r in res.mappings().all():
            print("LearningUnit:", dict(r))

        print("\n=== ASSESSMENTS Data ===")
        res = await session.execute(text("SELECT * FROM assessments;"))
        for r in res.mappings().all():
            print("Assessment:", dict(r))

if __name__ == "__main__":
    asyncio.run(inspect())
