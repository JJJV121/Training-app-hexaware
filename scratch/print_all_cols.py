import asyncio
import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/../backend")

from app.database.session import AsyncSessionLocal

async def inspect():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        """))
        for r in res.all():
            print(f"{r[0]}.{r[1]} ({r[2]}, nullable={r[3]})")

if __name__ == "__main__":
    asyncio.run(inspect())
