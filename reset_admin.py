import asyncio
import bcrypt
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        user = await db.scalar(
            select(User).where(User.email == "admin@hexaware.com")
        )

        if not user:
            print("USER NOT FOUND")
            return

        password = "admin@1234"

        new_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        print("Before:", user.password_hash[:20])

        user.password_hash = new_hash

        await db.commit()
        await db.refresh(user)

        print("After:", user.password_hash[:20])
        print(
            "VERIFY:",
            bcrypt.checkpw(
                password.encode("utf-8"),
                user.password_hash.encode("utf-8")
            )
        )

asyncio.run(main())
