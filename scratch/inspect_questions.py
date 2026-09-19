import asyncio
import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/../backend")

from app.database.session import AsyncSessionLocal

async def inspect():
    async with AsyncSessionLocal() as session:
        print("=== 1. ALL TABLES ===")
        res = await session.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """))
        tables = [r[0] for r in res.all()]
        print(tables)

        print("\n=== 2. ASSESSMENT_QUESTIONS COUNT BY ASSESSMENT ===")
        res = await session.execute(text("""
            SELECT assessment_id, COUNT(*) 
            FROM assessment_questions 
            GROUP BY assessment_id;
        """))
        for r in res.all():
            print(f"Assessment ID {r[0]}: {r[1]} questions")

        print("\n=== 3. CHECK FOR ANY UNASSIGNED / BANK QUESTIONS ===")
        res = await session.execute(text("""
            SELECT COUNT(*) FROM assessment_questions WHERE assessment_id IS NULL;
        """))
        print("Questions with assessment_id IS NULL:", res.scalar())

        print("\n=== 4. COLUMNS OF ASSESSMENT_QUESTIONS ===")
        res = await session.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'assessment_questions';
        """))
        for r in res.all():
            print(f"  {r[0]}: {r[1]}")

        print("\n=== 5. COLUMNS OF ASSESSMENT_ATTEMPTS ===")
        res = await session.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'assessment_attempts';
        """))
        for r in res.all():
            print(f"  {r[0]}: {r[1]}")

        print("\n=== 6. CHECK FOR ANY ATTEMPT QUESTIONS OR ATTEMPT DETAILS TABLE ===")
        attempt_tables = [t for t in tables if 'attempt' in t or 'answer' in t]
        print("Attempt related tables:", attempt_tables)
        for t in attempt_tables:
            res = await session.execute(text(f"SELECT COUNT(*) FROM {t};"))
            print(f"Table '{t}' has count: {res.scalar()}")

        print("\n=== 7. JAVA COURSE DAYS & LEARNING UNITS ===")
        res = await session.execute(text("""
            SELECT cd.day_number, cd.title as day_title, lu.id as unit_id, lu.title as unit_title, lu.display_order
            FROM course_days cd
            LEFT JOIN learning_units lu ON lu.day_id = cd.id
            WHERE cd.course_id = 1
            ORDER BY cd.day_number, lu.display_order;
        """))
        for r in res.mappings().all():
            print(dict(r))

if __name__ == "__main__":
    asyncio.run(inspect())
