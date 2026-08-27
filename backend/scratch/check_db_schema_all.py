import asyncio
from app.database.session import AsyncSessionLocal
from sqlalchemy import text

async def check_all_tables():
    tables = [
        "assignments",
        "assignment_submissions",
        "coding_problems",
        "hidden_test_cases",
        "coding_submissions",
        "assessments",
        "assessment_questions",
        "assessment_problems",
        "coding_test_cases",
        "assessment_attempts",
        "mcq_questions",
        "mcq_options"
    ]
    async with AsyncSessionLocal() as db:
        for t in tables:
            res = await db.execute(text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t}'"))
            cols = res.fetchall()
            print(f"=== Table: {t} ({len(cols)} cols) ===")
            for c in cols:
                print(f"  {c[0]}: {c[1]}")

if __name__ == "__main__":
    asyncio.run(check_all_tables())
