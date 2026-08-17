import asyncio
from sqlalchemy import text
from app.database.session import AsyncSessionLocal
from app.core.security import hash_password

async def run_updates():
    async with AsyncSessionLocal() as db:
        print("1. Adding college_name columns to DB...")
        try:
            await db.execute(text("ALTER TABLE batches ADD COLUMN IF NOT EXISTS college_name VARCHAR(255);"))
            await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS college_name VARCHAR(255);"))
            await db.commit()
            print("Successfully added college_name columns.")
        except Exception as e:
            print("Col error or already exists:", e)

        print("\n2. Updating alembic_version stamp...")
        try:
            await db.execute(text("UPDATE alembic_version SET version_num = 'e8f900123456';"))
            await db.commit()
            print("Successfully stamped alembic_version = e8f900123456")
        except Exception as e:
            print("Alembic stamp error:", e)

        print("\n3. Verifying/Seeding test user tester@example.com...")
        try:
            res = await db.execute(text("SELECT id, email, name FROM users WHERE email = 'tester@example.com' OR email = 'example@tester.com';"))
            user = res.first()
            
            pwd_hash = hash_password("password123")
            
            if not user:
                # Create user tester@example.com
                res = await db.execute(text(
                    "INSERT INTO users (employee_id, name, email, role, password_hash, is_active) "
                    "VALUES ('E9999', 'Tester User', 'tester@example.com', 'TRAINEE', :pwd_hash, True) RETURNING id;"
                ), {"pwd_hash": pwd_hash})
                user_id = res.scalar()
                print(f"Created user tester@example.com with ID={user_id}")
            else:
                user_id = user[0]
                await db.execute(text(
                    "UPDATE users SET password_hash = :pwd_hash, is_active = True, role = 'TRAINEE' WHERE id = :uid;"
                ), {"pwd_hash": pwd_hash, "uid": user_id})
                print(f"Updated user {user[2]} ({user[1]}) ID={user_id}")

            # Check if C# course exists
            res = await db.execute(text("SELECT id, title FROM courses WHERE title ILIKE '%C#%' OR title ILIKE '%C sharp%';"))
            csharp_course = res.first()
            if not csharp_course:
                res = await db.execute(text(
                    "INSERT INTO courses (title, description, duration_days, category, is_active) "
                    "VALUES ('C# .NET Programming', 'Comprehensive C# and .NET Core development course', 10, 'Backend Development', True) RETURNING id;"
                ))
                c_id = res.scalar()
                print(f"Created course 'C# .NET Programming' with ID={c_id}")
            else:
                c_id = csharp_course[0]
                print(f"Found existing C# course ID={c_id}")

            # Ensure user is enrolled in C# course
            res = await db.execute(text("SELECT id FROM enrollments WHERE user_id = :uid AND course_id = :cid;"), {"uid": user_id, "cid": c_id})
            if not res.first():
                await db.execute(text("INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (:uid, :cid, NOW());"), {"uid": user_id, "cid": c_id})
                print(f"Enrolled user {user_id} in C# course {c_id}")

            await db.commit()
            print("DB update & seed complete!")
        except Exception as e:
            print("Seed error:", e)

if __name__ == "__main__":
    asyncio.run(run_updates())
