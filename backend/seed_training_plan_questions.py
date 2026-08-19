import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import AsyncSessionLocal
from app.models.coding_problem import CodingProblem
from app.models.hidden_test_case import HiddenTestCase
from app.database.seed_data.training_plan_questions import TRAINING_PLAN_QUESTIONS
from sqlalchemy import select

async def seed_questions():
    print("=" * 70)
    print("SEEDING ACTUAL TRAINING-PLAN QUESTIONS AND TEST CASES")
    print("=" * 70)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import text
        try:
            await db.execute(text("ALTER TABLE coding_problems ALTER COLUMN language_id DROP NOT NULL;"))
            await db.execute(text("ALTER TABLE coding_problems ALTER COLUMN marks DROP NOT NULL;"))
            await db.execute(text("ALTER TABLE coding_problems ALTER COLUMN updated_at DROP NOT NULL;"))
            await db.execute(text("ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium';"))
            await db.execute(text("ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'java';"))
            await db.execute(text("ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS starter_code TEXT;"))
            await db.execute(text("ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS sample_input TEXT;"))
            await db.execute(text("ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS sample_output TEXT;"))
            await db.execute(text("ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS constraints TEXT;"))
            await db.commit()
        except Exception as e:
            print(f"Schema migration info: {e}")
        total_problems_seeded = 0
        total_test_cases_seeded = 0

        for day_id, questions in TRAINING_PLAN_QUESTIONS.items():
            print(f"\nProcessing Day {day_id} ({len(questions)} Questions)...")
            for q_data in questions:
                # Check if coding problem already exists by title
                stmt = select(CodingProblem).where(CodingProblem.title == q_data["title"])
                existing_prob = (await db.execute(stmt)).scalar_one_or_none()

                if not existing_prob:
                    new_prob = CodingProblem(
                        title=q_data["title"],
                        description=q_data["problem_statement"],
                        difficulty=q_data.get("difficulty", "medium"),
                        language=q_data["language"],
                        starter_code=q_data["starter_code"],
                        sample_input=q_data["sample_input"],
                        sample_output=q_data["sample_output"],
                        constraints=q_data["constraints"],
                        created_by=1
                    )
                    db.add(new_prob)
                    await db.flush()
                    prob_id = new_prob.id
                    total_problems_seeded += 1
                else:
                    prob_id = existing_prob.id

                # Check existing test cases for this problem
                stmt_tc = select(HiddenTestCase).where(HiddenTestCase.problem_id == prob_id)
                existing_tcs = (await db.execute(stmt_tc)).scalars().all()

                if len(existing_tcs) < 10:
                    # Remove existing incomplete test cases to re-seed cleanly
                    for tc in existing_tcs:
                        await db.delete(tc)
                    await db.flush()

                    for tc_data in q_data["test_cases"]:
                        new_tc = HiddenTestCase(
                            problem_id=prob_id,
                            input_data=tc_data["input"],
                            expected_output=tc_data["expected_output"],
                            is_hidden=tc_data["is_hidden"]
                        )
                        db.add(new_tc)
                        total_test_cases_seeded += 1

        await db.commit()

        print("\n" + "=" * 70)
        print(f"DATABASE SEED COMPLETE!")
        print(f"  --> Problems Seeded: {total_problems_seeded}")
        print(f"  --> Test Cases Seeded: {total_test_cases_seeded}")
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(seed_questions())
