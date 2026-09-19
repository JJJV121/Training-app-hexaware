import asyncio
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import bcrypt
from datetime import datetime
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        # Check if batch coordinator exists
        email = "coordinator@hexaware.com"
        user = await db.scalar(
            select(User).where(User.email == email)
        )

        password = "Coordinator@123"
        hashed = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        if not user:
            print(f"Creating new Batch Coordinator user: {email}")
            user = User(
                employee_id="BC1001",
                name="Batch Coordinator",
                email=email,
                role="batch_coordinator",
                is_active=True,
                password_hash=hashed,
                password_changed_at=datetime.utcnow()
            )
            db.add(user)
        else:
            print(f"Updating existing user: {email}")
            user.role = "batch_coordinator"
            user.name = "Batch Coordinator"
            user.employee_id = user.employee_id or "BC1001"
            user.is_active = True
            user.password_hash = hashed
            user.password_changed_at = datetime.utcnow()

        await db.commit()
        await db.refresh(user)

        print(f"Success! Batch Coordinator configured.")
        print(f"ID: {user.id}")
        print(f"Name: {user.name}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")
        print(f"Is Active: {user.is_active}")
        
        # Verify password match
        is_valid = bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8"))
        print(f"Password verification check: {'PASSED' if is_valid else 'FAILED'}")

if __name__ == "__main__":
    asyncio.run(main())
