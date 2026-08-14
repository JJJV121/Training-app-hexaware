from sqlalchemy import text
from app.database.session import engine


async def setup_indexes():
    print("[Index Setup] Setting up database indexes...")

    index_queries = [
        "CREATE INDEX IF NOT EXISTS idx_course_days_course_id ON course_days(course_id)",
        "CREATE INDEX IF NOT EXISTS idx_learning_units_day_id ON learning_units(day_id)",
        "CREATE INDEX IF NOT EXISTS idx_videos_learning_unit_id ON videos(learning_unit_id)",
        "CREATE INDEX IF NOT EXISTS idx_progress_lu_user ON progress(learning_unit_id, user_id)",
        "CREATE INDEX IF NOT EXISTS idx_assignments_course_day_id ON assignments(course_day_id)",
        "CREATE INDEX IF NOT EXISTS idx_case_studies_course_day_id ON case_studies(course_day_id)",
        "CREATE INDEX IF NOT EXISTS idx_lesson_qa_lu_id ON lesson_qa(learning_unit_id)",
        "CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id)",
    ]

    for query in index_queries:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(query))
            print(f"[Index Setup] Successfully verified/created index: {query}")
        except Exception as e:
            print(f"[Index Setup] Error executing index query '{query}': {e}")

    print("[Index Setup] Database index setup process finished.")
