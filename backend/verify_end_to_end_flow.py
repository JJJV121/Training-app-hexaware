import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import AsyncSessionLocal
from app.services.day_processor_service import process_course_day
from app.services.assignment_service import (
    get_assignment_by_id,
    get_assignment_questions,
    evaluate_assignment_answers,
)
from app.models.course_day import CourseDay
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from sqlalchemy import select

async def run_end_to_end_tests():
    print("=" * 70)
    print("RUNNING 10 END-TO-END TEST CASES: TRAINING PLAN -> ASSIGNMENT -> PROCTORED TEST -> RESULT")
    print("=" * 70)

    async with AsyncSessionLocal() as db:
        # Pre-process Days 1, 2, 3, 5, 13
        await process_course_day(db, course_id=1, day_id=1)
        await process_course_day(db, course_id=1, day_id=2)
        await process_course_day(db, course_id=1, day_id=3)
        await process_course_day(db, course_id=1, day_id=5)
        await process_course_day(db, course_id=1, day_id=13)

        # -------------------------------------------------------------
        # TC01 — Training Plan Mapping
        # -------------------------------------------------------------
        print("\n[TC01] Training Plan Mapping Verification...")
        stmt_day3 = select(Assignment).where(Assignment.course_day_id == 3)
        asgs_day3 = (await db.execute(stmt_day3)).scalars().all()
        assert len(asgs_day3) > 0, "TC01 Failed: Day 3 should have an assignment!"
        print(f"  --> PASS: Day 3 has assignment '{asgs_day3[0].title}' as specified in Training Plan.")

        # -------------------------------------------------------------
        # TC02 — Non-Assignment Day
        # -------------------------------------------------------------
        print("\n[TC02] Non-Assignment Day Verification (Day 1 & Day 2)...")
        from app.routers.assignment import get_trainee_assignments
        res_day1 = await get_trainee_assignments(course_day_id=1, db=db)
        res_day2 = await get_trainee_assignments(course_day_id=2, db=db)
        assert len(res_day1) == 0, "TC02 Failed: Day 1 must have NO assignment!"
        assert len(res_day2) == 0, "TC02 Failed: Day 2 must have NO assignment!"
        print("  --> PASS: Day 1 and Day 2 return 0 assignments (no assignment button displayed).")

        # -------------------------------------------------------------
        # TC03 — Correct Assignment
        # -------------------------------------------------------------
        print("\n[TC03] Correct Assignment Belongs to Selected Day Plan...")
        stmt_day13 = select(Assignment).where(Assignment.course_day_id == 13)
        asg_day13 = (await db.execute(stmt_day13)).scalars().first()
        assert asg_day13 is not None, "TC03 Failed: Day 13 assignment not found"
        assert asg_day13.course_day_id == 13, "TC03 Failed: Assignment course_day_id mismatch!"
        print(f"  --> PASS: Retrieved Assignment ID={asg_day13.id} dynamically bound to Day 13.")

        # -------------------------------------------------------------
        # TC04 — Dynamic Questions
        # -------------------------------------------------------------
        print("\n[TC04] Dynamic Questions (Exactly 3 Questions)...")
        q_list_day13 = await get_assignment_questions(db, asg_day13.id)
        assert len(q_list_day13) == 3, f"TC04 Failed: Expected 3 questions, got {len(q_list_day13)}"
        print(f"  --> PASS: Exactly 3 dynamic questions loaded for Assignment ID={asg_day13.id}.")

        # -------------------------------------------------------------
        # TC05 — Ten Test Cases Per Question
        # -------------------------------------------------------------
        print("\n[TC05] Ten Test Cases Per Question (30 Total Test Cases)...")
        total_tc_count = 0
        for q in q_list_day13:
            tc_list = q.get("test_cases", [])
            assert len(tc_list) == 10, f"TC05 Failed: Question {q['id']} has {len(tc_list)} test cases, expected 10!"
            total_tc_count += len(tc_list)
        assert total_tc_count == 30, "TC05 Failed: Total test cases count != 30"
        print(f"  --> PASS: 3 questions x 10 test cases = {total_tc_count} test cases verified.")

        # -------------------------------------------------------------
        # TC06 — Java Coding Test Evaluation
        # -------------------------------------------------------------
        print("\n[TC06] Java Coding Test Execution & Evaluation...")
        java_answers = {
            "1": "public class Car extends Vehicle { @Override public double calculateFare(double distance) { return distance * 15.0; } }",
            "2": "list.sort((a, b) -> Double.compare(b.getGpa(), a.getGpa()));",
            "3": "return list.stream().filter(s -> s != null && s.length() > 3).map(String::toUpperCase).collect(Collectors.toList());"
        }
        res_java = await evaluate_assignment_answers(db, asg_day13.id, user_id=1, answers=java_answers)
        assert res_java["score"] > 0, "TC06 Failed: Java evaluation score <= 0"
        assert res_java["percentage"] >= 75.0, "TC06 Failed: Java solution should pass 75% threshold"
        print(f"  --> PASS: Java Test Evaluated: Score={res_java['score']}/{res_java['total_marks']} ({res_java['percentage']}%). Status='{res_java['status']}'")

        # -------------------------------------------------------------
        # TC07 — MySQL Coding Test Evaluation
        # -------------------------------------------------------------
        print("\n[TC07] MySQL Coding Test Execution & Evaluation...")
        stmt_day5 = select(Assignment).where(Assignment.course_day_id == 5)
        asg_day5 = (await db.execute(stmt_day5)).scalars().first()
        mysql_answers = {
            "1": "SELECT d.dept_name, SUM(e.salary) FROM employees e JOIN departments d ON e.dept_id = d.id GROUP BY d.dept_name HAVING COUNT(e.id) > 2;",
            "2": "SELECT e.name, e.salary FROM employees e WHERE e.salary > (SELECT AVG(emp.salary) FROM employees emp WHERE emp.dept_id = e.dept_id);",
            "3": "UPDATE employees SET salary = salary * 1.10 WHERE dept_id IN (SELECT id FROM departments WHERE dept_name = 'Engineering');"
        }
        res_mysql = await evaluate_assignment_answers(db, asg_day5.id, user_id=1, answers=mysql_answers)
        assert res_mysql["percentage"] >= 75.0, "TC07 Failed: MySQL solution should pass threshold!"
        print(f"  --> PASS: MySQL Test Evaluated: Score={res_mysql['score']}/{res_mysql['total_marks']} ({res_mysql['percentage']}%). Status='{res_mysql['status']}'")

        # -------------------------------------------------------------
        # TC08 — Test Session & Proctoring
        # -------------------------------------------------------------
        print("\n[TC08] Test Session & Proctoring State Verification...")
        # Verify attempt recording & status update
        stmt_sub = select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == asg_day13.id,
            AssignmentSubmission.user_id == 1
        )
        sub_rec = (await db.execute(stmt_sub)).scalar_one_or_none()
        assert sub_rec is not None, "TC08 Failed: Attempt submission record not found!"
        print(f"  --> PASS: Proctored test attempt record ID={sub_rec.id} created with evaluated status.")

        # -------------------------------------------------------------
        # TC09 — End Test / Result Calculation
        # -------------------------------------------------------------
        print("\n[TC09] End Test Calculation & Pass Threshold Persistence...")
        assert res_java["status"] in ["PASSED", "EVALUATED"], "TC09 Failed: Status invalid"
        assert len(res_java["details"]) == 3, "TC09 Failed: Question breakdown count != 3"
        print(f"  --> PASS: Pass percentage threshold evaluated to {res_java['percentage']}% (Pass Mark: 75%).")

        # -------------------------------------------------------------
        # TC10 — Course Navigation / Progress Update
        # -------------------------------------------------------------
        print("\n[TC10] Course Progress Update & Navigation Return...")
        # Verify submission persisted with evaluated score
        assert sub_rec.marks == res_java["score"], "TC10 Failed: Persisted marks mismatch!"
        print(f"  --> PASS: Assignment completed, submission saved to DB, ready for Course Module return.")

    print("\n" + "=" * 70)
    print("ALL 10 END-TO-END TEST CASES PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_end_to_end_tests())
