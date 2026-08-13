import asyncio
from sqlalchemy import text
from app.database.session import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as session:
        # Get users
        try:
            res = await session.execute(text("SELECT id, name, email, role, is_active FROM users"))
            print("Users in DB:")
            for u in res.all():
                print(f"  ID={u[0]}, Name={u[1]}, Email={u[2]}, Role={u[3]}, Active={u[4]}")
        except Exception as e:
            print(f"Error fetching users: {e}")
            
        # Get courses
        try:
            res = await session.execute(text("SELECT id, title, is_active FROM courses"))
            print("Courses in DB:")
            for c in res.all():
                print(f"  ID={c[0]}, Title={c[1]}, Active={c[2]}")
        except Exception as e:
            print(f"Error fetching courses: {e}")

if __name__ == "__main__":
    asyncio.run(main())
