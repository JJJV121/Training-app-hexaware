import asyncio
import sys
import os
from sqlalchemy import text, select

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")

from app.database.session import AsyncSessionLocal, engine
from app.database.base import Base

from app.models.mcq_bank import MCQQuestionBank
from app.models.course import Course
from app.models.learning_unit import LearningUnit
from app.models.assessment import Assessment
from app.database.seed_data.full_java_mcq_bank import FULL_MCQ_BANK

# Mappings for Learning Units to Topic Categories
JAVA_LEARNING_UNITS_MAPPING = {
    38: {"title": "Java Introduction", "topic": "Introduction to Java", "category": "java"},
    39: {"title": "Control Statements", "topic": "Control Statements", "category": "java"},
    41: {"title": "Array", "topic": "Array", "category": "java"},
    42: {"title": "OOP", "topic": "OOP (Object-Oriented Programming)", "category": "java"},
    178: {"title": "Interface & Abstract Classes", "topic": "Interface & Abstract Classes", "category": "java"},
    43: {"title": "Interface, String API", "topic": "Interface/String API", "category": "java"},
    46: {"title": "Collections", "topic": "Collections", "category": "java"},
    47: {"title": "Java 8 Features - Lambda & Functional Interfaces", "topic": "Java 8 Features - Lambda & Functional Interfaces", "category": "java"},
    53: {"title": "Java 8 Features - Method References & Optional", "topic": "Java 8 Features - Method References & Optional", "category": "java"},
    54: {"title": "Java 8 Features - Date and Time API", "topic": "Java 8 Features - Date/Time API", "category": "java"},
    55: {"title": "Exception Handling", "topic": "Exception Handling", "category": "java"},
    59: {"title": "Stream API", "topic": "Stream API", "category": "java"},
    60: {"title": "Threads", "topic": "Threads", "category": "java"},
    179: {"title": "JDBC & Best Practices", "topic": "JDBC & Best Practices", "category": "java"},
    180: {"title": "Testing Fundamentals", "topic": "Testing Fundamentals", "category": "junit"},
    181: {"title": "JUnit", "topic": "JUnit", "category": "junit"},
    182: {"title": "Mockito & Mocking Frameworks", "topic": "Mockito", "category": "junit"},
}

GRADING_ASSESSMENTS_CONFIG = [
    {
        "title": "Problem Solving + Agile + MySQL Grading Assessment",
        "description": "Comprehensive grading assessment for Problem Solving, Agile, and MySQL 8.4 LTS.",
        "instructions": "75 Minutes | 65 MCQs | Medium & Hard Difficulty | 75% Pass Percentage.",
        "duration_minutes": 75,
        "total_marks": 65,
        "passing_marks": 49,
        "assessment_type": "MCQ",
        "categories": ["dsa", "agile", "mysql"],
        "day_id": 10
    },
    {
        "title": "Java + JUnit Grading Assessment",
        "description": "Comprehensive grading assessment covering completed Core Java (JDK 25 LTS) and JUnit curriculum.",
        "instructions": "70 Minutes | 55 MCQs | Medium & Hard Difficulty | 75% Pass Percentage.",
        "duration_minutes": 70,
        "total_marks": 55,
        "passing_marks": 42,
        "assessment_type": "MCQ",
        "categories": ["java", "junit"],
        "day_id": 16
    },
    {
        "title": "Git + Cloud Grading Assessment",
        "description": "Comprehensive grading assessment for Version Control (Git) and Cloud (AWS, Azure, Docker).",
        "instructions": "50 Minutes | 35 MCQs | Medium & Hard Difficulty | 75% Pass Percentage.",
        "duration_minutes": 50,
        "total_marks": 35,
        "passing_marks": 27,
        "assessment_type": "MCQ",
        "categories": ["git", "cloud"],
        "day_id": 20
    },
    {
        "title": "Generative AI & Prompt Engineering Grading Assessment",
        "description": "Comprehensive grading assessment for Generative AI, Prompt Engineering, Agentic SDLC, and MCP.",
        "instructions": "30 Minutes | 20 MCQs | Medium & Hard Difficulty | 75% Pass Percentage.",
        "duration_minutes": 30,
        "total_marks": 20,
        "passing_marks": 15,
        "assessment_type": "MCQ",
        "categories": ["genai"],
        "day_id": 23
    }
]

async def seed_db():
    print("=" * 70)
    print("INITIALIZING DATABASE & SEEDING MCQ QUESTION BANK")
    print("=" * 70)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Update Course Title for Java (Course ID 1)
        res = await session.execute(select(Course).where(Course.id == 1))
        java_course = res.scalar_one_or_none()
        if java_course:
            java_course.title = "Core Java (Java SE / JDK 25 LTS)"
            await session.commit()
            print("[OK] Course ID 1 title updated to 'Core Java (Java SE / JDK 25 LTS)'")

        # 2. Update/Align Learning Units
        for unit_id, meta in JAVA_LEARNING_UNITS_MAPPING.items():
            u_res = await session.execute(select(LearningUnit).where(LearningUnit.id == unit_id))
            unit = u_res.scalar_one_or_none()
            if unit:
                unit.title = meta["title"]
        await session.commit()
        print("[OK] Java Learning Unit titles aligned.")

        # 3. Create or Update 4 Grading Assessments
        for config in GRADING_ASSESSMENTS_CONFIG:
            a_res = await session.execute(select(Assessment).where(Assessment.title == config["title"]))
            assessment = a_res.scalar_one_or_none()
            if not assessment:
                assessment = Assessment(
                    title=config["title"],
                    description=config["description"],
                    instructions=config["instructions"],
                    duration_minutes=config["duration_minutes"],
                    total_marks=config["total_marks"],
                    passing_marks=config["passing_marks"],
                    assessment_type=config["assessment_type"],
                    course_day_id=config["day_id"],
                    created_by=1
                )
                session.add(assessment)
            else:
                assessment.description = config["description"]
                assessment.instructions = config["instructions"]
                assessment.duration_minutes = config["duration_minutes"]
                assessment.total_marks = config["total_marks"]
                assessment.passing_marks = config["passing_marks"]
                assessment.assessment_type = config["assessment_type"]
                assessment.course_day_id = config["day_id"]
        await session.commit()
        print("[OK] All 4 Grading Assessments configured in database.")

        # 4. Populate MCQ Question Bank with Duplicate Validation
        added_count = 0
        skipped_count = 0

        # Build map of topic -> learning_unit_id
        topic_to_unit_id = {meta["topic"].lower(): uid for uid, meta in JAVA_LEARNING_UNITS_MAPPING.items()}

        for q_data in FULL_MCQ_BANK:
            topic_str = q_data["topic"]
            topic_lower = topic_str.lower()
            unit_id = topic_to_unit_id.get(topic_lower)

            # Check if question already exists
            existing_stmt = select(MCQQuestionBank).where(
                MCQQuestionBank.question_text == q_data["question_text"]
            )
            existing_q = (await session.execute(existing_stmt)).scalar_one_or_none()

            if not existing_q:
                new_q = MCQQuestionBank(
                    category=q_data.get("category", "java"),
                    topic=q_data["topic"],
                    subtopic=q_data.get("subtopic", ""),
                    set_name=q_data.get("set_name", "Set 1"),
                    question_no=q_data.get("question_no", 1),
                    question_text=q_data["question_text"],
                    option_a=q_data["option_a"],
                    option_b=q_data["option_b"],
                    option_c=q_data["option_c"],
                    option_d=q_data["option_d"],
                    correct_answer=q_data["correct_answer"],
                    correct_answer_text=q_data.get("correct_answer_text", ""),
                    explanation=q_data.get("explanation", ""),
                    difficulty=q_data.get("difficulty", "MEDIUM").upper(),
                    question_type=q_data.get("question_type", "Concept"),
                    learning_unit_id=unit_id,
                    course_id=1,
                    is_active=True
                )
                session.add(new_q)
                added_count += 1
            else:
                skipped_count += 1

        await session.commit()
        print(f"[OK] MCQ Question Bank Seeded: {added_count} added, {skipped_count} skipped duplicates.")
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(seed_db())
