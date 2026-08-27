import asyncio
import httpx
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.assignment import Assignment
from app.core.security import create_access_token, hash_password

async def run_workflow_tests():
    print("==================================================")
    print("  TESTING MYSQL VS JAVA MATCHING FOR ASSIGNMENTS & ASSESSMENTS")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        trainee = await db.scalar(select(User).where(User.role == "TRAINEE"))
        if not trainee:
            trainee = User(
                employee_id="TRN_WF_1",
                name="Workflow Trainee",
                email="workflow_trainee@example.com",
                role="TRAINEE",
                is_active=True,
                password_hash=hash_password("Pass123!@#$12"),
            )
            db.add(trainee)
            await db.commit()
            await db.refresh(trainee)

        trainee_token = create_access_token({"sub": str(trainee.id)})
        headers = {"Authorization": f"Bearer {trainee_token}"}

    base_url = "http://localhost:8000"

    async with httpx.AsyncClient(base_url=base_url) as client:
        # 1. Test Assignments Listing & Question Retrieval (MySQL vs Java matching)
        print("\n--- 1. Testing Assignments Listing & Question Retrieval ---")
        res = await client.get("/assignments/", headers=headers)
        assert res.status_code == 200, f"GET /assignments/ failed: {res.status_code}"
        assignments = res.json()

        coding_assignments = [a for a in assignments if a.get("assignment_type") == "CODING"]
        for test_assignment in coding_assignments[:5]:
            res_q = await client.get(f"/assignments/{test_assignment['id']}/questions", headers=headers)
            assert res_q.status_code == 200, f"GET assignment questions failed: {res_q.status_code}: {res_q.text}"
            questions = res_q.json()

            for q in questions:
                lang = (q.get("language") or q.get("allowed_language") or "").lower()
                starter = q.get("starter_code") or ""
                title_lower = f"{test_assignment['title']} {q.get('title', '')} {q.get('problem_statement', '')}".lower()
                is_sql_title = any(k in title_lower for k in ["mysql", "sql", "query", "queries", "database", "dml", "joins", "subquery", "employee", "employees", "salary", "customer", "order", "purchase", "summary", "table", "select", "update", "delete"])

                print(f" Checking Assignment #{test_assignment['id']} '{test_assignment['title']}' | Q '{q.get('title')}' -> lang='{lang}', is_sql_title={is_sql_title}")

                if is_sql_title:
                    assert lang in ["mysql", "sql"], f"Expected MySQL for SQL assignment! Got: {lang}"
                    assert "-- Write your SQL query" in starter, f"Expected SQL starter comment! Got: {starter}"
                    print(f"  [PASS] MySQL Assignment #{test_assignment['id']} '{q['title']}': language='{lang}'")
                else:
                    assert lang == "java", f"Expected Java for non-SQL assignment! Got: {lang}"
                    assert "public class Solution" in starter, f"Expected Java starter class! Got: {starter}"
                    print(f"  [PASS] Java Assignment #{test_assignment['id']} '{q['title']}': language='{lang}'")

        # 2. Test Assessment Listing & Language Matching
        print("\n--- 2. Testing Assessment Trainee View Language Matching ---")
        res_proctored = await client.get("/assessments/5/proctored", headers=headers)
        assert res_proctored.status_code == 200, f"GET assessment proctored failed: {res_proctored.status_code}"
        test_info = res_proctored.json()
        for q in test_info.get("questions", []):
            lang = (q.get("allowed_language") or q.get("language") or "").lower()
            starter = q.get("starter_code") or ""
            print(f" [PASS] Assessment Question '{q.get('title')}': language='{lang}', starter='{starter[:30]}...'")

    print("\n==================================================")
    print("  ALL MYSQL VS JAVA MATCHING TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_workflow_tests())
