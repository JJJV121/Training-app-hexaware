import asyncio
from app.database.session import AsyncSessionLocal
from sqlalchemy import text

async def inspect_tables():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'coding_submissions'"))
        print("coding_submissions columns:", res.fetchall())

if __name__ == "__main__":
    asyncio.run(inspect_tables())
