from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coding_test_case import (
    CodingTestCase
)

async def create_test_case(
    db: AsyncSession,
    problem_id: int,
    data
):
    testcase = CodingTestCase(
        problem_id=problem_id,
        input_data=data.input_data,
        expected_output=data.expected_output,
        is_hidden=data.is_hidden
    )

    db.add(testcase)

    await db.commit()

    await db.refresh(testcase)

    return testcase


async def get_problem_test_cases(
    db: AsyncSession,
    problem_id: int
):
    result = await db.scalars(
        select(CodingTestCase)
        .where(
            CodingTestCase.problem_id
            == problem_id
        )
    )

    return result.all()

async def delete_test_case(
    db: AsyncSession,
    testcase_id: int
):
    testcase = await db.scalar(
        select(CodingTestCase)
        .where(
            CodingTestCase.id
            == testcase_id
        )
    )

    if not testcase:
        raise ValueError(
            "Test case not found"
        )

    await db.delete(testcase)

    await db.commit()

    return {
        "message":
        "Test case deleted successfully"
    }