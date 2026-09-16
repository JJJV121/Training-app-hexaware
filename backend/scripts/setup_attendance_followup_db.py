import asyncio
from sqlalchemy import text
from app.database.session import AsyncSessionLocal, engine
from app.database.base import Base
import app.models  # Register all models


async def setup_db():
    print("Beginning Attendance Follow-up DB setup...")

    # 1. Ensure tables created via SQLAlchemy metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Add columns if not existing and apply whitelisting
    async with AsyncSessionLocal() as session:
        # Check users column
        try:
            await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS attendance_followup_enabled BOOLEAN NOT NULL DEFAULT FALSE"))
            await session.commit()
            print("Verified users.attendance_followup_enabled column.")
        except Exception as e:
            print(f"Notice on adding users.attendance_followup_enabled: {e}")
            await session.rollback()

        # Check batches column
        try:
            await session.execute(text("ALTER TABLE batches ADD COLUMN IF NOT EXISTS spoc_id INTEGER REFERENCES users(id)"))
            await session.commit()
            print("Verified batches.spoc_id column.")
        except Exception as e:
            print(f"Notice on adding batches.spoc_id: {e}")
            await session.rollback()

        # Insert default global_automation_enabled system setting
        try:
            await session.execute(text("""
                INSERT INTO system_settings (key, value, updated_at)
                VALUES ('global_automation_enabled', 'true', NOW())
                ON CONFLICT (key) DO NOTHING
            """))
            await session.commit()
            print("Verified system_settings global_automation_enabled.")
        except Exception as e:
            print(f"Notice on system_settings: {e}")
            await session.rollback()

        # 3. Whitelist enforcement: Set all to False first, then set E_034 and E_035 to True
        try:
            # Set all candidates to False
            await session.execute(text("UPDATE users SET attendance_followup_enabled = FALSE"))
            
            # Whitelist candidate 1: E_034 / thirtyfour@example.com
            res1 = await session.execute(text("""
                UPDATE users
                SET attendance_followup_enabled = TRUE
                WHERE employee_id = 'E_034' OR email = 'thirtyfour@example.com'
                RETURNING id, employee_id, email, attendance_followup_enabled
            """))
            c1 = res1.all()

            # Whitelist candidate 2: E_035 / thirtyfive@example.com
            res2 = await session.execute(text("""
                UPDATE users
                SET attendance_followup_enabled = TRUE
                WHERE employee_id = 'E_035' OR email = 'thirtyfive@example.com'
                RETURNING id, employee_id, email, attendance_followup_enabled
            """))
            c2 = res2.all()

            await session.commit()
            print(f"Whitelisted candidate E_034: {c1}")
            print(f"Whitelisted candidate E_035: {c2}")

            # Verify total enabled users in DB
            count_res = await session.execute(text("SELECT id, employee_id, email, attendance_followup_enabled FROM users WHERE attendance_followup_enabled = TRUE"))
            enabled_users = count_res.all()
            print(f"TOTAL Whitelisted Users with attendance_followup_enabled = True (Must be exactly E_034 and E_035): {enabled_users}")

        except Exception as e:
            print(f"Error during candidate whitelisting: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(setup_db())
