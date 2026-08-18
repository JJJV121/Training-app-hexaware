import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User
from app.core.security import create_access_token


async def test_mcqs_endpoint():
    print("==================================================")
    print("   TESTING 25 MCQS QUIZ ENDPOINT END-TO-END")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.id == 4))
        u = res.scalars().first()
        if not u:
            res = await db.execute(select(User).order_by(User.id.asc()))
            u = res.scalars().first()

        token = create_access_token({"sub": str(u.id), "email": u.email, "role": u.role})
        headers = {"Authorization": f"Bearer {token}"}

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            res = await client.get("/qa/course/1/day/1/mcqs", headers=headers)
            print(f"[OK] Response Status: {res.status_code}")
            assert res.status_code == 200, f"Failed: {res.text}"

            data = res.json()
            print(f"[OK] Total MCQs Returned: {data.get('total_mcqs')}")
            print(f"[OK] Low (Easy): {data.get('low_count')}")
            print(f"[OK] Medium: {data.get('medium_count')}")
            print(f"[OK] Hard: {data.get('hard_count')}")

            mcqs = data.get("mcqs", [])
            assert len(mcqs) == 25, f"Expected 25 MCQs, got {len(mcqs)}"
            print(f"\nSample Question 1 (Difficulty: {mcqs[0]['difficulty']}):")
            print(f" Q: {mcqs[0]['question']}")
            print(f" Options: {mcqs[0]['options']}")
            print(f" Rationale: {mcqs[0]['explanation']}")

            print("\nSample Question 18 (Difficulty: {mcqs[17]['difficulty']}):")
            print(f" Q: {mcqs[17]['question']}")
            print(f" Options: {mcqs[17]['options']}")
            print(f" Rationale: {mcqs[17]['explanation']}")

        print("\n==================================================")
        print("   ALL 25 MCQ QUIZ VERIFICATIONS PASSED 100%!")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_mcqs_endpoint())
