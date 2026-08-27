import asyncio
from sqlalchemy import text
from app.database.session import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating database schema for password policy...")
        
        # 1. Add password_changed_at column to users table if it doesn't exist
        await conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        """))
        print("Column password_changed_at verified/created.")

        # 2. Create password_histories table if it doesn't exist
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS password_histories (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        """))
        
        # Index on user_id for faster lookup
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_password_histories_user_id ON password_histories(user_id);
        """))
        print("Table password_histories verified/created.")

    print("Migration completed successfully.")

if __name__ == "__main__":
    asyncio.run(migrate())
