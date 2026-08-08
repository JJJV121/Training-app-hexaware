import pandas as pd
from sqlalchemy import create_engine, text

# =====================================================

# CONFIG

# =====================================================

DATABASE_URL = "postgresql://neondb_owner:npg_RGdnVHkb34vC@ep-weathered-flower-aowym7f1-pooler.c-2.ap-southeast-1.aws.neon.tech/hexaware"


EXCEL_FILE = r"C:\Users\daksh\Videos\course-module\backend\app\scripts\2026_Mavericks_Segue_Training Plan - Java.xlsx"
SHEET_NAME = "Java_Digital_Foundation_Scope"  

COURSE_NAME = "JAVA Digital Foundation"

COURSE_DESCRIPTION = "JAVA Digital Foundation Training Program"

COURSE_DURATION_DAYS = 16

# =====================================================

# DB

# =====================================================

engine = create_engine(DATABASE_URL)

df = pd.read_excel(
EXCEL_FILE,
sheet_name=SHEET_NAME
)
print(repr(df.iloc[0]["Detailed Coverage"]))
with engine.begin() as conn:


    # -----------------------------------
    # CHECK COURSE ALREADY EXISTS
    # -----------------------------------

    existing_course = conn.execute(
        text("""
        SELECT id
        FROM courses
        WHERE title = :title
        """),
        {
            "title": COURSE_NAME
        }
    ).scalar()

    if existing_course:

        raise Exception(
            f"Course '{COURSE_NAME}' already exists."
        )

    # -----------------------------------
    # CREATE COURSE
    # -----------------------------------

    course_id = conn.execute(
        text("""
        INSERT INTO courses
        (
            title,
            description,
            duration_days,
            thumbnail_url,
            is_active,
            created_at
        )
        VALUES
        (
            :title,
            :description,
            :duration_days,
            '',
            TRUE,
            NOW()
        )
        RETURNING id
        """),
        {
            "title": COURSE_NAME,
            "description": COURSE_DESCRIPTION,
            "duration_days": COURSE_DURATION_DAYS
        }
    ).scalar()

    current_day_id = None
    display_order = 1

    # -----------------------------------
    # PROCESS EXCEL
    # -----------------------------------
    current_skill = None
    current_topic = None
    for _, row in df.iterrows():

        skill = row.get("Skills")
        day = row.get("Duration  (in days)")
        topic = row.get("Topics")
        if pd.notna(topic):
            current_topic = str(topic).strip()
        else:
            topic = None
        coverage = row.get("Detailed Coverage")
        hours = row.get("Duration  in Hours")

        # -----------------------------------
        # SKIP COMPLETELY EMPTY ROWS
        # -----------------------------------

        if (
            pd.isna(skill)
            and pd.isna(day)
            and pd.isna(topic)
            and pd.isna(coverage)
        ):
            continue

        # -----------------------------------
        # NEW DAY
        # -----------------------------------

        if pd.notna(day):

            try:

                day_number = int(
                    str(day)
                    .replace("Day", "")
                    .strip()
                )

            except:

                continue

            if pd.notna(skill):
                current_skill = str(skill).strip()

            day_title = current_skill

            current_day_id = conn.execute(
                text("""
                INSERT INTO course_days
                (
                    course_id,
                    day_number,
                    title,
                    description
                )
                VALUES
                (
                    :course_id,
                    :day_number,
                    :title,
                    :description
                )
                RETURNING id
                """),
                {
                    "course_id": course_id,
                    "day_number": day_number,
                    "title": day_title,
                    "description": day_title
                }
            ).scalar()

            display_order = 1

        # -----------------------------------
        # DURATION
        # -----------------------------------

        duration_minutes = None

        if pd.notna(hours):

            try:
                duration_minutes = int(
                    float(hours) * 60
                )

            except:
                duration_minutes = None

        if pd.isna(topic):
            continue

        topic = str(topic).strip()

        if topic.lower() == "nan":
            continue
        # -----------------------------------
        # LEARNING UNIT
        # -----------------------------------

        learning_unit_id = conn.execute(
            text("""
            INSERT INTO learning_units
            (
                day_id,
                title,
                description,
                display_order,
                duration_minutes
            )
            VALUES
            (
                :day_id,
                :title,
                :description,
                :display_order,
                :duration_minutes
            )
            RETURNING id
            """),
            {
                "day_id": current_day_id,
                "title": topic,
                "description": "",
                "display_order": display_order,
                "duration_minutes": duration_minutes
            }
        ).scalar()

        display_order += 1

        # -----------------------------------
        # CONTENT
        # -----------------------------------

        content_text = ""

        if pd.notna(coverage):
            content_text = (
                str(coverage)
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .strip()
            )
        print(topic)
        print(repr(content_text))
        print("-" * 50)
        conn.execute(
            text("""
            INSERT INTO contents
            (
                learning_unit_id,
                content_text
            )
            VALUES
            (
                :learning_unit_id,
                :content_text
            )
            """),
            {
                "learning_unit_id": learning_unit_id,
                "content_text": content_text
            }
        )

        # -----------------------------------
        # VIDEO
        # -----------------------------------

        conn.execute(
            text("""
            INSERT INTO videos
            (
                learning_unit_id,
                title,
                video_url,
                duration_minutes
            )
            VALUES
            (
                :learning_unit_id,
                :title,
                '',
                :duration_minutes
            )
            """),
            {
                "learning_unit_id": learning_unit_id,
                "title": topic,
                "duration_minutes": duration_minutes
            }
        )


print("Course imported successfully.")
