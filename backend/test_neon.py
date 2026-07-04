import asyncio
import ssl
import asyncpg

DATABASE_URL = "postgresql://neondb_owner:npg_iu5NkyYIF9Ot@ep-fancy-salad-ao47m5n4.c-2.ap-southeast-1.aws.neon.tech/neondb"

async def main():
    conn = await asyncpg.connect(
        DATABASE_URL,
        ssl=ssl.create_default_context()
    )

    print(await conn.fetch(
        "SELECT current_database(), current_schema(), current_setting('search_path')"
    ))

    print(await conn.fetch(
        "SELECT * FROM public.users LIMIT 1"
    ))

    await conn.close()

asyncio.run(main())