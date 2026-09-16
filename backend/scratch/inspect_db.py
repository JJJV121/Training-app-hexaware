import asyncio
from sqlalchemy import text
from app.database.session import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as session:
        res = await session.execute(text("SELECT id, employee_id, email, name, role FROM users WHERE email IN ('thirtyfour@example.com', 'thirtyfive@example.com')"))
        print("Candidates 34/35:", res.all())

        res2 = await session.execute(text("SELECT * FROM batches LIMIT 10"))
        print("Batches:", res2.all())

        res3 = await session.execute(text("SELECT * FROM live_sessions LIMIT 10"))
        print("Live sessions:", res3.all())

if __name__ == "__main__":
    asyncio.run(main())
