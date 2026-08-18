import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

async def test_app_import():
    try:
        from app.main import app
        print("[OK] FastAPI app imported successfully!")
        
        # Test startup event logic
        from app.database.session import test_connection, AsyncSessionLocal
        from app.utils.index_setup import setup_indexes
        from app.services.messaging_service import seed_default_communities
        
        await test_connection()
        print("[OK] Database connection verified!")
        
        await setup_indexes()
        print("[OK] Indexes verified!")
        
        async with AsyncSessionLocal() as db:
            await seed_default_communities(db)
        print("[OK] Community seeding verified!")

    except Exception as e:
        print(f"[ERROR] Startup verification failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_app_import())
