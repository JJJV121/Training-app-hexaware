import asyncio
import bcrypt
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User

async def main():
    password = input("Enter admin password: ")

    async with AsyncSessionLocal() as db:
        user = await db.scalar(
            select(User).where(User.email == "admin@hexaware.com")
        )

        if not user:
            print("USER NOT FOUND")
            return

        result = bcrypt.checkpw(
            password.encode("utf-8"),
            user.password_hash.encode("utf-8")
        )

        print("PASSWORD MATCH:", result)

asyncio.run(main())
