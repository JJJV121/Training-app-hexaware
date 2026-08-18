import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User
from app.core.security import create_access_token


async def test_dashboard_and_course_endpoints():
    print("==================================================")
    print("   TESTING DASHBOARD & COURSE ENDPOINTS END-TO-END")
    print("==================================================")

    async with AsyncSessionLocal() as db:
        # Fetch user 4 (tester@example.com)
        u_res = await db.execute(select(User).where(User.id == 4))
        u = u_res.scalars().first()
        if not u:
            u_res = await db.execute(select(User).order_by(User.id.asc()))
            u = u_res.scalars().first()

        print(f"[OK] Testing as User: {u.name} ({u.email}, ID: {u.id})")

        token = create_access_token({"sub": str(u.id), "email": u.email, "role": u.role})
        headers = {"Authorization": f"Bearer {token}"}

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            # 1. Test GET /dashboard/{user_id}
            print("\n1. Testing GET /dashboard/{user_id}...")
            res_dash = await client.get(f"/dashboard/{u.id}", headers=headers)
            print(f"   Status: {res_dash.status_code}")
            if res_dash.status_code == 200:
                data = res_dash.json()
                print(f"   Response Course: {data.get('course')}")
                print(f"   Enrolled Courses: {data.get('enrolled_courses')}")
            else:
                print(f"   ERROR Response: {res_dash.text}")

            # 2. Test GET /courses/1/content
            print("\n2. Testing GET /courses/1/content...")
            res_c1 = await client.get("/courses/1/content", headers=headers)
            print(f"   Status: {res_c1.status_code}")
            if res_c1.status_code == 200:
                c1_data = res_c1.json()
                print(f"   Course Title: {c1_data.get('course', {}).get('title') or c1_data.get('course_name')}")
                print(f"   Days count: {len(c1_data.get('days', []))}")
            else:
                print(f"   ERROR Response: {res_c1.text}")

            # 3. Test GET /progress/course/1/user/{user_id}
            print(f"\n3. Testing GET /progress/course/1/user/{u.id}...")
            res_p = await client.get(f"/progress/course/1/user/{u.id}", headers=headers)
            print(f"   Status: {res_p.status_code}")
            if res_p.status_code == 200:
                print(f"   Progress Data: {res_p.json()}")
            else:
                print(f"   ERROR Response: {res_p.text}")

if __name__ == "__main__":
    asyncio.run(test_dashboard_and_course_endpoints())
