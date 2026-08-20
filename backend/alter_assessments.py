import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import AsyncSessionLocal
from sqlalchemy import text


async def alter_cols():
    async with AsyncSessionLocal() as db:
        try:
            await db.execute(text("ALTER TABLE assessments ALTER COLUMN created_by DROP NOT NULL;"))
            await db.commit()
            print("Successfully dropped NOT NULL on created_by in assessments table")
        except Exception as e:
            print(f"Error altering column: {e}")

if __name__ == "__main__":
    asyncio.run(alter_cols())
