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

async def process_course_day(db: AsyncSession, course_id: int, day_id: int, commit: bool = True):
    from app.utils.cache_utils import cache_get, cache_set
    
    # Check cache first for instant speed
    cache_key = f"day_processed:{day_id}"
    if await cache_get(cache_key):
        return

    # 1. Fetch Course and Day in a single joined query
    stmt_day = (
        select(CourseDay, Course)
        .join(Course, Course.id == CourseDay.course_id)
        .where(CourseDay.id == day_id)
    )
    res_day = await db.execute(stmt_day)
    row = res_day.first()
    if not row:
        return
    day, course = row

    # Fetch all learning units for this day
    stmt_units = select(LearningUnit).where(LearningUnit.day_id == day_id)
    units_res = await db.execute(stmt_units)
    units = units_res.scalars().all()
    unit_ids = [u.id for u in units]
    unit_titles = [u.title for u in units]
    topic_title = unit_titles[0] if unit_titles else day.title

    # 2. Check existing Videos & Video Q&As in bulk
    if unit_ids:
        stmt_videos = select(Video).where(Video.learning_unit_id.in_(unit_ids))
        videos_res = await db.execute(stmt_videos)
        videos = videos_res.scalars().all()

        stmt_qa = select(LessonQA).where(LessonQA.learning_unit_id.in_(unit_ids))
        qa_res = await db.execute(stmt_qa)
        existing_qas = {qa.learning_unit_id: qa for qa in qa_res.scalars().all()}

        for video in videos:
            if video.learning_unit_id not in existing_qas:
                suggestions = get_templated_suggestions(course.title, video.title, "")
                new_qa = LessonQA(
                    learning_unit_id=video.learning_unit_id,
                    question=suggestions["qa"]["question"],
                    answer=suggestions["qa"]["answer"]
                )
                db.add(new_qa)

    # 3. Ensure EVERY course day has exactly ONE topic-based assignment
    stmt_asg = select(Assignment).where(Assignment.course_day_id == day_id)
    asg_res = await db.execute(stmt_asg)
    all_assignments = asg_res.scalars().all()

    clean_course_title = course.title.strip().replace(" ", "_")
    clean_topic_title = topic_title.strip().replace(" ", "_")
    assignment_title = f"{clean_course_title}_Day_{day.day_number}_{clean_topic_title}"

    if not all_assignments:
        assignment_plan = {
            3: [(AssignmentType.CODING, "MySQL Coding Assignment")],
            4: [(AssignmentType.CODING, "MySQL Coding Assignment")],
            5: [(AssignmentType.CODING, "MySQL Coding Assignment")],
            6: [
                (AssignmentType.CODING, "MySQL Coding Assignment"),
                (AssignmentType.CASE_STUDY, "MySQL Case Study"),
            ],
            7: [(AssignmentType.CODING, "Java Coding Assignment")],
            8: [(AssignmentType.CODING, "Java Coding Assignment")],
            9: [(AssignmentType.CODING, "Java Coding Assignment")],
            10: [(AssignmentType.CODING, "Java Coding Assignment")],
            11: [(AssignmentType.CODING, "Java Coding Assignment")],
            12: [
                (AssignmentType.CODING, "Java Coding Assignment"),
                (AssignmentType.CASE_STUDY, "Java Case Study"),
            ],
            13: [(AssignmentType.CODING, "JUnit Coding Assignment")],
            14: [(AssignmentType.PROJECT, "Project Development - Java + MySQL + JUnit")],
            15: [(AssignmentType.NON_CODING, "Git Non-Coding Assignment")],
            16: [(AssignmentType.NON_CODING, "Cloud Non-Coding Assignment")],
        }

        for asg_type, asg_title in assignment_plan.get(day.day_number, []):
            db.add(Assignment(
                course_day_id=day_id,
                title=asg_title,
                description=f"{asg_title} for {topic_title} covered in Day {day.day_number}.",
                assignment_type=asg_type,
                instructions=f"Complete the {asg_title.lower()} for {topic_title}.",
                total_marks=100,
                passing_marks=70,
                due_date=datetime.utcnow() + timedelta(days=7),
                created_by=1
            ))
    else:
        # Update existing assignment title to enforce standard topic title format
        first_asg = all_assignments[0]
        if not first_asg.title or first_asg.title.startswith("Assessment:") or len(first_asg.title) < 5:
            first_asg.title = assignment_title

    if commit:
        await db.commit()
        await cache_set(cache_key, True, expire=86400)
