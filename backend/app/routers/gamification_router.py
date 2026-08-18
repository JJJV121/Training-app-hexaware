from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.gamification_service import (
    get_leaderboard_data,
    get_user_gamification_profile,
    get_user_badges_full,
    award_xp,
)

router = APIRouter(
    prefix="/api",
    tags=["Leaderboard & Gamification"]
)


@router.get("/leaderboard")
async def get_leaderboard(
    period: str = Query("all_time", description="Filter period: week, month, or all_time"),
    course_id: int | None = Query(None, description="Optional Course ID filter"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns leaderboard data including top 3 podium, participant list, rank, student, XP, courses completed, learning hours and badges.
    """
    data = await get_leaderboard_data(db, period=period, course_id=course_id, current_user_id=current_user.id)
    return data


@router.get("/leaderboard/me")
async def get_my_leaderboard_rank(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the logged-in user's leaderboard rank and XP.
    """
    lb = await get_leaderboard_data(db, period="all_time", current_user_id=current_user.id)
    return lb.get("me") or {
        "user_id": current_user.id,
        "name": current_user.name or current_user.email,
        "rank": 1,
        "xp": 0
    }


@router.get("/badges")
async def get_all_badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all system badges and the user's earned/progress status.
    """
    data = await get_user_badges_full(db, current_user.id)
    return data


@router.get("/badges/me")
async def get_my_badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns only the user's earned badges.
    """
    data = await get_user_badges_full(db, current_user.id)
    earned_badges = [b for b in data["badges"] if b["is_earned"]]
    return {
        "user_id": current_user.id,
        "earned_count": len(earned_badges),
        "badges": earned_badges
    }


@router.get("/gamification/me")
async def get_my_gamification_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns XP, level, current streak, badge count, leaderboard rank and next-level progress.
    """
    profile = await get_user_gamification_profile(db, current_user.id)
    return profile
