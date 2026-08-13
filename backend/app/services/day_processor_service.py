import os
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.video import Video
from app.models.lesson_qa import LessonQA
from app.models.assignment import Assignment, AssignmentType
from app.models.case_study import CaseStudy
from app.routers.generator_router import get_templated_suggestions

async def process_course_day(db: AsyncSession, course_id: int, day_id: int):
    # 1. Fetch Course and Day
    course = await db.get(Course, course_id)
    if not course:
        return
    day = await db.get(CourseDay, day_id)
    if not day or day.course_id != course_id:
        return

    # Fetch all learning units for this day
    stmt_units = select(LearningUnit).where(LearningUnit.day_id == day_id)
    units_res = await db.execute(stmt_units)
    units = units_res.scalars().all()
    unit_ids = [u.id for u in units]
    unit_titles = [u.title for u in units]

    # 2. Check existing Videos & Video Q&As
    if unit_ids:
        stmt_videos = select(Video).where(Video.learning_unit_id.in_(unit_ids))
        videos_res = await db.execute(stmt_videos)
        videos = videos_res.scalars().all()

        for video in videos:
            stmt_qa = select(LessonQA).where(LessonQA.learning_unit_id == video.learning_unit_id)
            qa_res = await db.execute(stmt_qa)
            existing_qa = qa_res.scalars().first()

            if not existing_qa:
                # Generate video-specific Q&A based on its title
                suggestions = get_templated_suggestions(course.title, video.title, "")
                new_qa = LessonQA(
                    learning_unit_id=video.learning_unit_id,
                    question=suggestions["qa"]["question"],
                    answer=suggestions["qa"]["answer"]
                )
                db.add(new_qa)

    # Analyze course plan requirements using title, description, and unit topics
    plan_text = (day.title + " " + (day.description or "") + " " + " ".join(unit_titles)).lower()
    
    # Requirement detection logic
    req_assignment = any(w in plan_text for w in ["practice", "exercise", "assignment", "lab", "coding", "implement", "tasks", "write queries"])
    req_assessment = any(w in plan_text for w in ["assessment", "challenge", "quiz", "exam", "test"])
    req_case_study = any(w in plan_text for w in ["case study", "scenario", "use case", "case-study"])
    req_project = any(w in plan_text for w in ["project", "build a", "capstone", "mini-project"])

    # Load templates/suggestions for the day
    suggestions = get_templated_suggestions(course.title, day.title, day.description)

    # 4. Check existing Assignment (Standard Assignment: type CODING or NON_CODING, title not starting with "Assessment:")
    stmt_asg = select(Assignment).where(
        Assignment.course_day_id == day_id,
        Assignment.assignment_type.in_([AssignmentType.CODING, AssignmentType.NON_CODING]),
        ~Assignment.title.like("Assessment:%")
    )
    asg_res = await db.execute(stmt_asg)
    existing_asg = asg_res.scalars().first()

    if not existing_asg and req_assignment:
        asg_type = AssignmentType.CODING if any(w in plan_text for w in ["coding", "sql", "queries", "java", "oop", "arrays", "collections", "program"]) else AssignmentType.NON_CODING
        
        attachment_path = None
        if asg_type == AssignmentType.NON_CODING:
            attachment_path = "assignment_files/starter_package.pdf"
            os.makedirs("assignment_files", exist_ok=True)
            if not os.path.exists(attachment_path):
                with open(attachment_path, "wb") as f:
                    f.write(b"%PDF-1.4\n%Mock Starter Package PDF Content")

        new_asg = Assignment(
            course_day_id=day_id,
            title=suggestions["assignment"]["title"],
            description=suggestions["assignment"]["description"],
            assignment_type=asg_type,
            instructions=suggestions["assignment"]["instructions"],
            total_marks=suggestions["assignment"]["total_marks"],
            passing_marks=suggestions["assignment"]["passing_marks"],
            due_date=datetime.utcnow() + timedelta(days=7),
            attachment_path=attachment_path,
            created_by=1
        )
        db.add(new_asg)

    # 5. Check existing Assessment (stored in assignments table with title starting with "Assessment:")
    stmt_assess = select(Assignment).where(
        Assignment.course_day_id == day_id,
        Assignment.title.like("Assessment:%")
    )
    assess_res = await db.execute(stmt_assess)
    existing_assess = assess_res.scalars().first()

    if not existing_assess and req_assessment:
        assess_type = AssignmentType.CODING if any(w in plan_text for w in ["coding", "sql", "java", "oop", "program"]) else AssignmentType.NON_CODING
        new_assess = Assignment(
            course_day_id=day_id,
            title=f"Assessment: {day.title}",
            description=f"Assessment challenge evaluating your comprehension of {day.title}.",
            assignment_type=assess_type,
            instructions="Complete all questions or tasks within the allocated time limit.",
            total_marks=50,
            passing_marks=35,
            due_date=datetime.utcnow() + timedelta(days=5),
            created_by=1
        )
        db.add(new_assess)

    # 6. Check existing Case Study
    stmt_cs = select(CaseStudy).where(CaseStudy.course_day_id == day_id)
    cs_res = await db.execute(stmt_cs)
    existing_cs = cs_res.scalars().first()

    if not existing_cs and req_case_study:
        new_cs = CaseStudy(
            course_day_id=day_id,
            title=suggestions["case_study"]["title"],
            scenario=suggestions["case_study"]["scenario"],
            requirements=suggestions["case_study"]["requirements"],
            total_marks=suggestions["case_study"]["total_marks"],
            due_date=datetime.utcnow() + timedelta(days=10),
            created_by=1
        )
        db.add(new_cs)

    # 7. Check existing Project Build (stored in assignments table with type PROJECT)
    stmt_proj = select(Assignment).where(
        Assignment.course_day_id == day_id,
        Assignment.assignment_type == AssignmentType.PROJECT
    )
    proj_res = await db.execute(stmt_proj)
    existing_proj = proj_res.scalars().first()

    if not existing_proj and req_project:
        new_proj = Assignment(
            course_day_id=day_id,
            title=f"Project Build: {day.title} Application",
            description=f"Capstone project exercise requiring you to design, build, and deploy an application using {day.title}.",
            assignment_type=AssignmentType.PROJECT,
            instructions="1. Initialize a git repository.\n2. Implement the requirements document.\n3. Submit your repository link.",
            total_marks=100,
            passing_marks=80,
            due_date=datetime.utcnow() + timedelta(days=14),
            created_by=1
        )
        db.add(new_proj)

    await db.commit()
