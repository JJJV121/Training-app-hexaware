import asyncio
import sys
import os
from datetime import datetime, date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import AsyncSessionLocal, engine
from app.database.base import Base
from app.models.user import User
from app.models.progress import Progress
from app.models.gamification import UserGamification, Badge, UserBadge, XPLog

DEFAULT_BADGES = [
    {
        "code": "FIRST_COURSE",
        "name": "First Course",
        "description": "Enrolled in your first course or completed your first learning unit.",
        "icon": "🎓",
        "category": "academic",
        "requirement_type": "enrollment",
        "requirement_value": 1,
        "xp_bonus": 50,
    },
    {
        "code": "COURSE_COMPLETED",
        "name": "Course Completed",
        "description": "Finished all lessons and milestones in a comprehensive course.",
        "icon": "🏆",
        "category": "achievement",
        "requirement_type": "course_completion",
        "requirement_value": 1,
        "xp_bonus": 200,
    },
    {
        "code": "QUIZ_MASTER",
        "name": "Quiz Master",
        "description": "Completed 3 or more knowledge check practice quizzes.",
        "icon": "🧠",
        "category": "skill",
        "requirement_type": "quiz_count",
        "requirement_value": 3,
        "xp_bonus": 100,
    },
    {
        "code": "PERFECT_SCORE",
        "name": "Perfect Score",
        "description": "Achieved a 100% score on a practice assessment quiz.",
        "icon": "💯",
        "category": "mastery",
        "requirement_type": "perfect_quiz",
        "requirement_value": 1,
        "xp_bonus": 100,
    },
    {
        "code": "STREAK_3",
        "name": "3 Day Streak",
        "description": "Maintained an active learning streak for 3 consecutive days.",
        "icon": "🔥",
        "category": "streak",
        "requirement_type": "streak",
        "requirement_value": 3,
        "xp_bonus": 50,
    },
    {
        "code": "STREAK_7",
        "name": "7 Day Streak",
        "description": "Maintained an active learning streak for 7 consecutive days.",
        "icon": "🔥",
        "category": "streak",
        "requirement_type": "streak",
        "requirement_value": 7,
        "xp_bonus": 150,
    },
    {
        "code": "JAVA_MASTER",
        "name": "Java Master",
        "description": "Completed 10 or more Java Core & Architecture learning units.",
        "icon": "☕",
        "category": "specialty",
        "requirement_type": "java_units",
        "requirement_value": 10,
        "xp_bonus": 150,
    },
    {
        "code": "CSHARP_MASTER",
        "name": "C# Master",
        "description": "Completed 8 or more C# Enterprise Programming units.",
        "icon": "💻",
        "category": "specialty",
        "requirement_type": "csharp_units",
        "requirement_value": 8,
        "xp_bonus": 150,
    },
]

async def seed_gamification():
    print("==================================================")
    print("   SEEDING GAMIFICATION BADGES & TRAINEE XP")
    print("==================================================")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed Badges
        badge_map = {}
        for b_data in DEFAULT_BADGES:
            res_b = await db.execute(select(Badge).where(Badge.code == b_data["code"]))
            existing = res_b.scalars().first()
            if not existing:
                b_obj = Badge(**b_data)
                db.add(b_obj)
                await db.flush()
                badge_map[b_data["code"]] = b_obj.id
            else:
                badge_map[b_data["code"]] = existing.id

        await db.commit()

        # 2. Seed User Gamification & Initial Badges
        res_users = await db.execute(select(User).where(User.role.ilike("%trainee%")))
        trainees = res_users.scalars().all()

        now = datetime.utcnow()

        for tr in trainees:
            res_p = await db.execute(select(Progress).where(Progress.user_id == tr.id))
            units_count = len(res_p.scalars().all())

            base_xp = units_count * 20
            # Extra XP for top performers
            if tr.id == 4: # Tester Student
                base_xp += 450
                streak = 7
            elif tr.id in [1, 5, 39]:
                base_xp += 250
                streak = 5
            elif tr.id in [13, 17, 40]:
                base_xp += 150
                streak = 3
            else:
                streak = 1

            level = (base_xp // 100) + 1

            res_ug = await db.execute(select(UserGamification).where(UserGamification.user_id == tr.id))
            ug = res_ug.scalars().first()
            if not ug:
                ug = UserGamification(
                    user_id=tr.id,
                    xp=base_xp,
                    level=level,
                    current_streak=streak,
                    longest_streak=streak,
                    last_active_date=date.today()
                )
                db.add(ug)
            else:
                ug.xp = max(ug.xp, base_xp)
                ug.level = (ug.xp // 100) + 1
                ug.current_streak = streak

            # Award initial badges
            earned_codes = ["FIRST_COURSE"]
            if units_count >= 15 or tr.id == 4:
                earned_codes.extend(["COURSE_COMPLETED", "QUIZ_MASTER", "JAVA_MASTER"])
            if streak >= 3:
                earned_codes.append("STREAK_3")
            if streak >= 7:
                earned_codes.append("STREAK_7")

            for code in earned_codes:
                b_id = badge_map.get(code)
                if b_id:
                    res_ub = await db.execute(
                        select(UserBadge).where(UserBadge.user_id == tr.id, UserBadge.badge_id == b_id)
                    )
                    if not res_ub.scalars().first():
                        db.add(UserBadge(user_id=tr.id, badge_id=b_id, earned_at=now))

        await db.commit()
        print(f"[OK] Successfully initialized gamification for {len(trainees)} trainees!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_gamification())

