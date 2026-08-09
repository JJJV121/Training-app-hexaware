from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.assignment import (
    Assignment,
    AssignmentType,
)
from app.models.coding_problem import CodingProblem
from app.models.hidden_test_case import HiddenTestCase

from app.schemas.coding_problem_schema import (
    CodingProblemCreate,
    CodingProblemUpdate,
    CodingProblemResponse,
)

from app.schemas.coding_test_case_schema import (
    TestCaseCreate,
    TestCaseResponse,
)

router = APIRouter(
    prefix="/coding-problems",
    tags=["Coding Problems"]
)


# --------------------------------------------------
# Create Coding Problem
# --------------------------------------------------
@router.post(
    "/",
    response_model=CodingProblemResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_problem(
    payload: CodingProblemCreate,
    db: AsyncSession = Depends(get_db)
):
    assignment = await db.scalar(
        select(Assignment).where(
            Assignment.id == payload.assignment_id
        )
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.assignment_type != AssignmentType.CODING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coding problems can only be created for CODING assignments"
        )

    current_total = await db.scalar(
        select(func.coalesce(func.sum(CodingProblem.marks), 0))
        .where(CodingProblem.assignment_id == payload.assignment_id)
    )

    if current_total + payload.marks > assignment.total_marks:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot add problem. "
                f"Current marks = {current_total}, "
                f"adding {payload.marks} exceeds "
                f"assignment total marks ({assignment.total_marks})."
            )
        )

    data = payload.model_dump()

    if data["deadline"] is not None:
        data["deadline"] = data["deadline"].replace(tzinfo=None)

    problem = CodingProblem(**data)
    
    
    # problem = CodingProblem( **payload.model_dump() TODO: replace with current_user.id after auth integration "created_by=current_user.id")

    db.add(problem)
    await db.commit()
    await db.refresh(problem)

    return problem
# --------------------------------------------------
# Get All Problems
# --------------------------------------------------
@router.get(
    "/",
    response_model=list[CodingProblemResponse]
)
async def get_all_problems(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CodingProblem)
    )

    return result.scalars().all()


# --------------------------------------------------
# Get Problem By ID
# --------------------------------------------------
@router.get(
    "/{problem_id}",
    response_model=CodingProblemResponse
)
async def get_problem(
    problem_id: int,
    db: AsyncSession = Depends(get_db)
):
    problem = await db.scalar(
        select(CodingProblem).where(
            CodingProblem.id == problem_id
        )
    )

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    return problem


# --------------------------------------------------
# Update Problem
# --------------------------------------------------
@router.put(
    "/{problem_id}",
    response_model=CodingProblemResponse
)
async def update_problem(
    problem_id: int,
    payload: CodingProblemUpdate,
    db: AsyncSession = Depends(get_db)
):
    problem = await db.scalar(
        select(CodingProblem).where(
            CodingProblem.id == problem_id
        )
    )

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    if "deadline" in update_data and update_data["deadline"] is not None:
        update_data["deadline"] = update_data["deadline"].replace(tzinfo=None)

    if "assignment_id" in update_data:
        assignment = await db.scalar(
            select(Assignment).where(
                Assignment.id ==
                update_data["assignment_id"]
            )
        )

        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )

        if assignment.assignment_type != AssignmentType.CODING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignment must be of type CODING"
            )

    for key, value in update_data.items():
        setattr(problem, key, value)

    await db.commit()
    await db.refresh(problem)

    return problem


# --------------------------------------------------
# Delete Problem
# --------------------------------------------------
@router.delete(
    "/{problem_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_problem(
    problem_id: int,
    db: AsyncSession = Depends(get_db)
):
    problem = await db.scalar(
        select(CodingProblem).where(
            CodingProblem.id == problem_id
        )
    )

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    await db.delete(problem)
    await db.commit()


# --------------------------------------------------
# Add Test Case
# --------------------------------------------------
@router.post(
    "/{problem_id}/testcases",
    response_model=TestCaseResponse,
    status_code=status.HTTP_201_CREATED
)
async def add_testcase(
    problem_id: int,
    payload: TestCaseCreate,
    db: AsyncSession = Depends(get_db)
):
    problem = await db.scalar(
        select(CodingProblem).where(
            CodingProblem.id == problem_id
        )
    )

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    testcase = HiddenTestCase(
        problem_id=problem_id,
        **payload.model_dump()
    )

    db.add(testcase)
    await db.commit()
    await db.refresh(testcase)

    return testcase


# --------------------------------------------------
# Get All Test Cases
# --------------------------------------------------
@router.get(
    "/{problem_id}/testcases",
    response_model=list[TestCaseResponse]
)
async def get_testcases(
    problem_id: int,
    db: AsyncSession = Depends(get_db)
):
    problem = await db.scalar(
        select(CodingProblem).where(
            CodingProblem.id == problem_id
        )
    )

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    result = await db.execute(
        select(HiddenTestCase).where(
            HiddenTestCase.problem_id == problem_id
        )
    )

    return result.scalars().all()