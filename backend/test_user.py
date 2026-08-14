import asyncio
import bcrypt
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User

async def main():
    email = input("Enter email: ")
    password = input("Enter password: ")

    async with AsyncSessionLocal() as db:
        user = await db.scalar(
            select(User).where(User.email == email)
        )

        if not user:
            print("USER NOT FOUND")
            return

        print("ACTIVE:", user.is_active)
        print("ROLE:", user.role)

        try:
            result = bcrypt.checkpw(
                password.encode("utf-8"),
                user.password_hash.encode("utf-8")
            )
            print("PASSWORD MATCH:", result)
        except Exception as e:
            print("PASSWORD CHECK ERROR:", e)

asyncio.run(main())
