from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.schemas.coding_test_case import (
    CodingTestCaseCreate
)

from app.services.coding_test_case_service import (
    create_test_case,
    get_problem_test_cases,
    delete_test_case
)

router = APIRouter(
    prefix="/coding-problems",
    tags=["Coding Test Cases"]
)

@router.post(
    "/{problem_id}/testcases"
)
async def create(
    problem_id: int,
    request: CodingTestCaseCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_test_case(
        db,
        problem_id,
        request
    )

@router.get(
    "/{problem_id}/testcases"
)
async def get(
    problem_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_problem_test_cases(
        db,
        problem_id
    )


@router.delete(
    "/testcases/{testcase_id}"
)
async def delete(
    testcase_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await delete_test_case(
        db,
        testcase_id
    )