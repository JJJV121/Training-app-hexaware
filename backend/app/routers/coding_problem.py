from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.coding_problem import (
    CodingProblemCreate,
    CodingProblemUpdate
)

from app.services.coding_problem_service import (
    create_problem,
    get_problem,
    get_all_problems,
    update_problem,
    delete_problem
)
router = APIRouter(
    prefix="/coding-problems",
    tags=["Coding Problems"]
)

@router.post("/")
async def create(
    request: CodingProblemCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_problem(
        db,
        request
    )

@router.get("/")
async def get_all(
    db: AsyncSession = Depends(get_db)
):
    return await get_all_problems(
        db
    )

@router.get("/{problem_id}")
async def get_one(
    problem_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_problem(
            db,
            problem_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    
@router.put("/{problem_id}")
async def update(
    problem_id: int,
    request: CodingProblemUpdate,
    db: AsyncSession = Depends(get_db)
):
    return await update_problem(
        db,
        problem_id,
        request
    )

@router.delete("/{problem_id}")
async def delete(
    problem_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await delete_problem(
        db,
        problem_id
    )