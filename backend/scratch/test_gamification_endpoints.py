import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import AsyncSessionLocal, engine
from sqlalchemy import select
from app.models.user import User
from app.core.security import create_access_token


async def test_gamification_api():
    print("==================================================")
    print("   TESTING GAMIFICATION & LEADERBOARD APIS")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.id == 4)) # tester@example.com
        u = res.scalars().first()
        if not u:
            res = await db.execute(select(User).order_by(User.id.asc()))
            u = res.scalars().first()

        token = create_access_token({"sub": str(u.id), "email": u.email, "role": u.role})
        headers = {"Authorization": f"Bearer {token}"}

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            # 1. GET /api/gamification/me
            res_g = await client.get("/api/gamification/me", headers=headers)
            print(f"[OK] GET /api/gamification/me Status: {res_g.status_code}")
            assert res_g.status_code == 200
            g_data = res_g.json()
            print(f" Profile -> XP: {g_data['xp']} | Level: {g_data['level']} | Streak: {g_data['current_streak']} | Rank: {g_data['rank']} | Badges: {g_data['badge_count']}")

            # 2. GET /api/leaderboard?period=all_time
            res_lb = await client.get("/api/leaderboard?period=all_time", headers=headers)
            print(f"\n[OK] GET /api/leaderboard Status: {res_lb.status_code}")
            assert res_lb.status_code == 200
            lb_data = res_lb.json()
            print(f" Total Participants: {lb_data['total_participants']}")
            print(f" Top 3 Podium:")
            for p in lb_data["podium"]:
                print(f"   Rank #{p['rank']} - {p['name']} ({p['email']}): {p['xp']} XP, Level {p['level']}")

            # 3. GET /api/badges
            res_b = await client.get("/api/badges", headers=headers)
            print(f"\n[OK] GET /api/badges Status: {res_b.status_code}")
            assert res_b.status_code == 200
            b_data = res_b.json()
            print(f" Total Badges: {b_data['total_badges']} | Earned Badges: {b_data['earned_badges']}")
            for b in b_data["badges"][:3]:
                print(f"   Badge {b['icon']} {b['name']} ({b['code']}) - Earned: {b['is_earned']}")

            # 4. GET /api/badges/me
            res_bm = await client.get("/api/badges/me", headers=headers)
            print(f"\n[OK] GET /api/badges/me Status: {res_bm.status_code}")
            assert res_bm.status_code == 200
            bm_data = res_bm.json()
            print(f" Earned Badges Count: {bm_data['earned_count']}")

    await engine.dispose()
    print("==================================================")
    print("   ALL GAMIFICATION ENDPOINTS VERIFIED 100%!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_gamification_api())
