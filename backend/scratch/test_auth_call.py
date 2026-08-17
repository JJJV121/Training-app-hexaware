import asyncio
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password, verify_password

async def test_auth():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User))
        users = res.scalars().all()
        print(f"Total users: {len(users)}")
        
        # Reset password for a test student and test admin so login works
        test_student = await db.scalar(select(User).where(User.email == "user@example.com"))
        if test_student:
            test_student.password_hash = hash_password("password123")
            test_student.is_active = True
            print("Set password for user@example.com -> password123")

        admin_user = await db.scalar(select(User).where(User.email == "admin@hexaware.com"))
        if admin_user:
            admin_user.password_hash = hash_password("admin123")
            admin_user.is_active = True
            print("Set password for admin@hexaware.com -> admin123")
            
        trainer_user = await db.scalar(select(User).where(User.email == "trainer@example.com"))
        if trainer_user:
            trainer_user.password_hash = hash_password("trainer123")
            trainer_user.is_active = True
            print("Set password for trainer@example.com -> trainer123")

        await db.commit()

if __name__ == "__main__":
    asyncio.run(test_auth())
