import asyncio
from app.database.session import AsyncSessionLocal
from app.models.assignment import Assignment
from app.services.assignment_service import get_assignment_questions
from sqlalchemy import select

async def debug_q():
    async with AsyncSessionLocal() as db:
        assignment = await db.scalar(select(Assignment).where(Assignment.assignment_type == "CODING"))
        print("Testing assignment:", assignment.id, assignment.title, assignment.assignment_type)

        try:
            questions = await get_assignment_questions(db, assignment.id)
            print("Successfully fetched questions count:", len(questions))
            for q in questions:
                print(" - Question:", q.get("title"), "Starter Code:", q.get("starter_code"))
        except Exception as e:
            print("Error fetching assignment questions:", type(e), e)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_q())
