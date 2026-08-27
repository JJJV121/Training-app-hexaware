import asyncio
from app.database.session import AsyncSessionLocal
from sqlalchemy import text

async def check_data():
    async with AsyncSessionLocal() as db:
        print("\n--- ASSIGNMENTS ---")
        res = await db.execute(text("SELECT id, course_day_id, title, assignment_type FROM assignments LIMIT 20"))
        for row in res.fetchall():
            print(dict(row._mapping))

        print("\n--- CODING PROBLEMS ---")
        res = await db.execute(text("SELECT id, assignment_id, assessment_id, title, starter_code FROM coding_problems LIMIT 20"))
        for row in res.fetchall():
            print(dict(row._mapping))

        print("\n--- HIDDEN TEST CASES ---")
        res = await db.execute(text("SELECT id, problem_id, input_data, expected_output, is_hidden FROM hidden_test_cases LIMIT 10"))
        for row in res.fetchall():
            print(dict(row._mapping))

        print("\n--- ASSESSMENTS ---")
        res = await db.execute(text("SELECT id, course_day_id, title, assessment_type, duration_minutes FROM assessments LIMIT 20"))
        for row in res.fetchall():
            print(dict(row._mapping))

        print("\n--- ASSESSMENT QUESTIONS ---")
        res = await db.execute(text("SELECT id, assessment_id, question_text, question_type, starter_code FROM assessment_questions LIMIT 10"))
        for row in res.fetchall():
            print(dict(row._mapping))

if __name__ == "__main__":
    asyncio.run(check_data())
