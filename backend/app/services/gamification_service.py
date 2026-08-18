import math
from datetime import datetime, date, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.course import Course
from app.models.progress import Progress
from app.models.enrollment import Enrollment
from app.models.gamification import UserGamification, Badge, UserBadge, XPLog


async def get_or_create_user_gamification(db: AsyncSession, user_id: int) -> UserGamification:
    stmt = select(UserGamification).where(UserGamification.user_id == user_id)
    res = await db.execute(stmt)
    ug = res.scalars().first()

    if not ug:
        ug = UserGamification(
            user_id=user_id,
            xp=0,
            level=1,
            current_streak=1,
            longest_streak=1,
            last_active_date=date.today()
        )
        db.add(ug)
        await db.flush()

    return ug


async def award_xp(
    db: AsyncSession,
    user_id: int,
    activity_type: str,
    reference_id: str,
    base_xp: int,
    commit: bool = True
) -> dict:
    # 1. Check idempotency log
    log_stmt = select(XPLog).where(
        and_(
            XPLog.user_id == user_id,
            XPLog.activity_type == activity_type,
            XPLog.reference_id == str(reference_id)
        )
    )
    res_log = await db.execute(log_stmt)
    if res_log.scalars().first():
        ug = await get_or_create_user_gamification(db, user_id)
        return {"awarded": False, "xp": ug.xp, "level": ug.level, "message": "XP already awarded for this activity."}

    # 2. Record XP Log
    xp_log = XPLog(
        user_id=user_id,
        activity_type=activity_type,
        reference_id=str(reference_id),
        xp_awarded=base_xp
    )
    db.add(xp_log)

    # 3. Update UserGamification
    ug = await get_or_create_user_gamification(db, user_id)
    ug.xp += base_xp
    ug.level = (ug.xp // 100) + 1

    today = date.today()
    if ug.last_active_date:
        diff = (today - ug.last_active_date).days
        if diff == 1:
            ug.current_streak += 1
            if ug.current_streak > ug.longest_streak:
                ug.longest_streak = ug.current_streak
        elif diff > 1:
            ug.current_streak = 1
    ug.last_active_date = today

    await db.flush()
    await evaluate_and_unlock_badges(db, user_id)

    if commit:
        await db.commit()

    return {"awarded": True, "xp_awarded": base_xp, "total_xp": ug.xp, "level": ug.level}


async def evaluate_and_unlock_badges(db: AsyncSession, user_id: int):
    res_b = await db.execute(select(Badge))
    badges = res_b.scalars().all()
    if not badges:
        return

    res_ub = await db.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user_id))
    earned_badge_ids = set(res_ub.scalars().all())

    ug = await get_or_create_user_gamification(db, user_id)
    
    res_p = await db.execute(select(Progress).where(Progress.user_id == user_id))
    user_progress = res_p.scalars().all()
    completed_units_count = len(user_progress)

    res_q_logs = await db.execute(
        select(XPLog).where(and_(XPLog.user_id == user_id, XPLog.activity_type == "QUIZ_COMPLETE"))
    )
    quizzes_count = len(res_q_logs.scalars().all())

    res_pq_logs = await db.execute(
        select(XPLog).where(and_(XPLog.user_id == user_id, XPLog.activity_type == "PERFECT_QUIZ"))
    )
    perfect_quiz_count = len(res_pq_logs.scalars().all())

    res_enr = await db.execute(select(Enrollment).where(Enrollment.user_id == user_id))
    user_enrollments = res_enr.scalars().all()
    enrolled_count = len(user_enrollments)

    now = datetime.utcnow()

    for b in badges:
        if b.id in earned_badge_ids:
            continue

        unlocked = False

        if b.code == "FIRST_COURSE" and (enrolled_count >= 1 or completed_units_count >= 1):
            unlocked = True
        elif b.code == "COURSE_COMPLETED" and completed_units_count >= 15:
            unlocked = True
        elif b.code == "QUIZ_MASTER" and quizzes_count >= 3:
            unlocked = True
        elif b.code == "PERFECT_SCORE" and perfect_quiz_count >= 1:
            unlocked = True
        elif b.code == "STREAK_3" and ug.longest_streak >= 3:
            unlocked = True
        elif b.code == "STREAK_7" and ug.longest_streak >= 7:
            unlocked = True
        elif b.code == "JAVA_MASTER" and completed_units_count >= 10:
            unlocked = True
        elif b.code == "CSHARP_MASTER" and completed_units_count >= 8:
            unlocked = True

        if unlocked:
            db.add(UserBadge(user_id=user_id, badge_id=b.id, earned_at=now))
            ug.xp += b.xp_bonus
            ug.level = (ug.xp // 100) + 1

    await db.flush()


async def get_leaderboard_data(
    db: AsyncSession,
    period: str = "all_time",
    course_id: int | None = None,
    current_user_id: int = 1
) -> dict:
    """
    HIGH-PERFORMANCE VECTORIZED LEADERBOARD:
    Fetches all trainees, gamification, enrollments, unit counts, and period XP in BULK queries (5 total queries instead of N*5 queries).
    """
    # 1. Fetch Trainees
    res_users = await db.execute(select(User).where(User.role.ilike("%trainee%")).order_by(User.id.asc()))
    trainees = res_users.scalars().all()
    trainee_ids = [tr.id for tr in trainees]
    if not trainee_ids:
        return {"period": period, "course_id": course_id, "total_participants": 0, "podium": [], "leaderboard": [], "me": None}

    # 2. Bulk fetch Gamification profiles
    res_ug = await db.execute(select(UserGamification).where(UserGamification.user_id.in_(trainee_ids)))
    ug_map = {ug.user_id: ug for ug in res_ug.scalars().all()}

    # 3. Bulk fetch Enrollments
    res_enr = await db.execute(select(Enrollment.user_id, Enrollment.course_id).where(Enrollment.user_id.in_(trainee_ids)))
    enr_map = {}
    for uid, cid in res_enr.all():
        enr_map.setdefault(uid, set()).add(cid)

    # 4. Bulk fetch Progress counts
    res_p_cnt = await db.execute(
        select(Progress.user_id, func.count(Progress.id))
        .where(Progress.user_id.in_(trainee_ids))
        .group_by(Progress.user_id)
    )
    progress_map = dict(res_p_cnt.all())

    # 5. Bulk fetch Badges counts
    res_b_cnt = await db.execute(
        select(UserBadge.user_id, func.count(UserBadge.id))
        .where(UserBadge.user_id.in_(trainee_ids))
        .group_by(UserBadge.user_id)
    )
    badge_map = dict(res_b_cnt.all())

    # 6. Bulk fetch Period XP if needed
    period_xp_map = {}
    if period in ["week", "month"]:
        start_date = datetime.utcnow() - timedelta(days=7 if period == "week" else 30)
        res_pxp = await db.execute(
            select(XPLog.user_id, func.coalesce(func.sum(XPLog.xp_awarded), 0))
            .where(and_(XPLog.user_id.in_(trainee_ids), XPLog.created_at >= start_date))
            .group_by(XPLog.user_id)
        )
        period_xp_map = dict(res_pxp.all())

    leaderboard_rows = []

    for tr in trainees:
        user_courses = enr_map.get(tr.id, set())
        if course_id and course_id > 0 and course_id not in user_courses:
            continue

        ug = ug_map.get(tr.id)
        total_xp = ug.xp if ug else 0
        level = ug.level if ug else 1
        xp_val = period_xp_map.get(tr.id, total_xp) if period in ["week", "month"] else total_xp

        completed_units = progress_map.get(tr.id, 0)
        badge_count = badge_map.get(tr.id, 0)

        courses_completed = 1 if completed_units >= 20 else (1 if completed_units >= 10 else 0)
        learning_hours = round(completed_units * 0.75, 1)

        leaderboard_rows.append({
            "user_id": tr.id,
            "name": tr.name or tr.employee_id or tr.email.split("@")[0].capitalize(),
            "email": tr.email,
            "xp": xp_val,
            "total_xp": total_xp,
            "level": level,
            "courses_completed": courses_completed,
            "learning_hours": learning_hours,
            "badges_count": badge_count,
            "is_current_user": (tr.id == current_user_id)
        })

    # Sort rows by XP desc, then total_xp desc
    leaderboard_rows.sort(key=lambda x: (x["xp"], x["total_xp"]), reverse=True)

    podium = []
    my_rank_info = None

    for idx, row in enumerate(leaderboard_rows):
        rank = idx + 1
        row["rank"] = rank

        if row["is_current_user"]:
            my_rank_info = row

        if rank <= 3:
            podium.append(row)

    return {
        "period": period,
        "course_id": course_id,
        "total_participants": len(leaderboard_rows),
        "podium": podium,
        "leaderboard": leaderboard_rows,
        "me": my_rank_info
    }


async def get_user_gamification_profile(db: AsyncSession, user_id: int) -> dict:
    ug = await get_or_create_user_gamification(db, user_id)
    await evaluate_and_unlock_badges(db, user_id)

    res_ub = await db.execute(select(func.count(UserBadge.id)).where(UserBadge.user_id == user_id))
    badge_count = res_ub.scalar() or 0

    lb = await get_leaderboard_data(db, period="all_time", current_user_id=user_id)
    me_row = lb.get("me") or {}
    rank = me_row.get("rank", 1)

    next_level_xp = ug.level * 100
    current_level_base_xp = (ug.level - 1) * 100
    progress_pct = round(((ug.xp - current_level_base_xp) / 100) * 100, 1)
    if progress_pct > 100:
        progress_pct = 100.0

    return {
        "user_id": user_id,
        "xp": ug.xp,
        "level": ug.level,
        "current_streak": ug.current_streak,
        "longest_streak": ug.longest_streak,
        "badge_count": badge_count,
        "rank": rank,
        "next_level_xp": next_level_xp,
        "current_level_base_xp": current_level_base_xp,
        "level_progress_percentage": progress_pct
    }


async def get_user_badges_full(db: AsyncSession, user_id: int) -> dict:
    ug = await get_or_create_user_gamification(db, user_id)
    await evaluate_and_unlock_badges(db, user_id)

    res_b = await db.execute(select(Badge).order_by(Badge.id.asc()))
    badges = res_b.scalars().all()

    res_ub = await db.execute(select(UserBadge).where(UserBadge.user_id == user_id))
    earned_map = {ub.badge_id: ub.earned_at for ub in res_ub.scalars().all()}

    badge_list = []
    earned_count = 0

    for b in badges:
        is_earned = b.id in earned_map
        if is_earned:
            earned_count += 1

        badge_list.append({
            "id": b.id,
            "code": b.code,
            "name": b.name,
            "description": b.description,
            "icon": b.icon,
            "category": b.category,
            "xp_bonus": b.xp_bonus,
            "requirement_type": b.requirement_type,
            "requirement_value": b.requirement_value,
            "is_earned": is_earned,
            "earned_at": earned_map[b.id].isoformat() if is_earned else None,
            "progress_percentage": 100 if is_earned else 50
        })

    return {
        "user_id": user_id,
        "total_badges": len(badges),
        "earned_badges": earned_count,
        "total_xp": ug.xp,
        "level": ug.level,
        "current_streak": ug.current_streak,
        "badges": badge_list
    }
